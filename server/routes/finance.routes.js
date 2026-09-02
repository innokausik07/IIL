/**
 * Finance Management Routes
 * - Invoices (CRUD + payment)
 * - Payments
 * - Security Deposits
 * - Outstanding Report
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const auth    = require('../middleware/auth');

router.use(auth);

// Helper: auto-generate codes

async function nextCode(prefix, table, col) {
  const [[row]] = await db.execute(
    `SELECT MAX(CAST(SUBSTRING(${col}, LENGTH(?) + 2) AS UNSIGNED)) AS mx FROM ${table} WHERE ${col} LIKE ?`,
    [prefix, `${prefix}-%`]
  );
  const num = (row.mx || 0) + 1;
  return `${prefix}-${String(num).padStart(5, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVOICES
// ═══════════════════════════════════════════════════════════════════════════════

// GET all invoices with joins
router.get('/invoices', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT inv.*,
             cm.client_name, cm.phone AS client_phone,
             it.type_name AS invoice_type,
             ro.order_no,
             u.full_name AS created_by_name,
             (inv.total - inv.paid_amount) AS balance_due
      FROM invoice_master inv
      LEFT JOIN client_master cm ON inv.client_id = cm.id
      LEFT JOIN invoice_type_master it ON inv.invoice_type_id = it.id
      LEFT JOIN rental_orders ro ON inv.order_id = ro.id
      LEFT JOIN users u ON inv.created_by = u.id
      ORDER BY inv.id DESC
    `);
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// GET single invoice with line items and payment history
router.get('/invoices/:id', async (req, res) => {
  try {
    const [[invoice]] = await db.execute(`
      SELECT inv.*,
             cm.client_name, cm.phone AS client_phone, cm.email AS client_email,
             cm.address AS client_address, cm.gstin AS client_gstin,
             it.type_name AS invoice_type, ro.order_no,
             (inv.total - inv.paid_amount) AS balance_due
      FROM invoice_master inv
      LEFT JOIN client_master cm ON inv.client_id = cm.id
      LEFT JOIN invoice_type_master it ON inv.invoice_type_id = it.id
      LEFT JOIN rental_orders ro ON inv.order_id = ro.id
      WHERE inv.id = ?
    `, [req.params.id]);

    if (!invoice) return res.status(404).json({ status: 'error', message: 'Invoice not found' });

    const [lines] = await db.execute(`
      SELECT il.*, am.asset_code, am.serial_no
      FROM invoice_lines il
      LEFT JOIN asset_master am ON il.asset_id = am.id
      WHERE il.invoice_id = ?
    `, [req.params.id]);

    const [payments] = await db.execute(`
      SELECT pm.*, pm2.mode_name, u.full_name AS recorded_by_name
      FROM payment_master pm
      LEFT JOIN payment_mode_master pm2 ON pm.mode_id = pm2.id
      LEFT JOIN users u ON pm.created_by = u.id
      WHERE pm.invoice_id = ? ORDER BY pm.payment_date DESC
    `, [req.params.id]);

    res.json({ status: 'success', data: { invoice, lines, payments } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// POST create invoice
router.post('/invoices', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { client_id, order_id, invoice_type_id, invoice_date, due_date,
            billing_period_from, billing_period_to, lines = [], created_by } = req.body;

    if (!client_id) return res.status(400).json({ status: 'error', message: 'Client is required' });

    const invoice_no = await nextCode('INV', 'invoice_master', 'invoice_no');
    const subtotal   = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
    const tax_amount = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0) * (parseFloat(l.tax_rate) || 0) / 100, 0);
    const total      = subtotal + tax_amount;

    const [result] = await conn.execute(
      `INSERT INTO invoice_master (invoice_no, invoice_type_id, client_id, order_id, invoice_date,
        due_date, billing_period_from, billing_period_to, subtotal, tax_amount, discount, total,
        paid_amount, status, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,0,?,0,'Draft',?)`,
      [invoice_no, invoice_type_id||null, client_id, order_id||null, invoice_date,
       due_date||null, billing_period_from||null, billing_period_to||null,
       subtotal, tax_amount, total, created_by||null]
    );

    const invId = result.insertId;
    for (const line of lines) {
      await conn.execute(
        `INSERT INTO invoice_lines (invoice_id, asset_id, description, qty, unit_rate, tax_rate, amount)
         VALUES (?,?,?,?,?,?,?)`,
        [invId, line.asset_id||null, line.description, line.qty||1,
         line.unit_rate||0, line.tax_rate||0, line.amount||0]
      );
    }

    await conn.commit();
    res.json({ status: 'success', message: 'Invoice created!', id: invId, invoice_no });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  } finally {
    conn.release();
  }
});

// PUT update invoice status
router.put('/invoices/:id/send', async (req, res) => {
  try {
    await db.execute(`UPDATE invoice_master SET status='Sent' WHERE id=? AND status='Draft'`, [req.params.id]);
    res.json({ status: 'success', message: 'Invoice sent!' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

router.put('/invoices/:id/cancel', async (req, res) => {
  try {
    await db.execute(`UPDATE invoice_master SET status='Cancelled' WHERE id=? AND status IN ('Draft','Sent')`, [req.params.id]);
    res.json({ status: 'success', message: 'Invoice cancelled.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET all payments
router.get('/payments', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT pm.*, cm.client_name, pm2.mode_name, im.invoice_no,
             u.full_name AS recorded_by_name
      FROM payment_master pm
      LEFT JOIN client_master cm ON pm.client_id = cm.id
      LEFT JOIN payment_mode_master pm2 ON pm.mode_id = pm2.id
      LEFT JOIN invoice_master im ON pm.invoice_id = im.id
      LEFT JOIN users u ON pm.created_by = u.id
      ORDER BY pm.id DESC
    `);
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// POST record payment
router.post('/payments', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { client_id, invoice_id, amount, mode_id, payment_date, ref_no, remarks, created_by } = req.body;

    if (!client_id || !amount) return res.status(400).json({ status: 'error', message: 'Client and amount are required' });

    const payment_no = await nextCode('PAY', 'payment_master', 'payment_no');
    await conn.execute(
      `INSERT INTO payment_master (payment_no, client_id, invoice_id, amount, mode_id, payment_date, ref_no, remarks, created_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [payment_no, client_id, invoice_id||null, amount, mode_id||null, payment_date, ref_no||null, remarks||null, created_by||null]
    );

    // Update invoice paid_amount and status
    if (invoice_id) {
      const [[inv]] = await conn.execute(`SELECT total, paid_amount FROM invoice_master WHERE id=?`, [invoice_id]);
      if (inv) {
        const newPaid = parseFloat(inv.paid_amount || 0) + parseFloat(amount);
        const newStatus = newPaid >= parseFloat(inv.total) ? 'Paid' : 'Partial';
        await conn.execute(
          `UPDATE invoice_master SET paid_amount=?, status=? WHERE id=?`,
          [newPaid, newStatus, invoice_id]
        );
      }
    }

    await conn.commit();
    res.json({ status: 'success', message: 'Payment recorded!', payment_no });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  } finally {
    conn.release();
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// OUTSTANDING REPORT
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/outstanding', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT inv.invoice_no, inv.invoice_date, inv.due_date,
             inv.total, inv.paid_amount,
             (inv.total - inv.paid_amount) AS balance_due,
             inv.status,
             DATEDIFF(CURDATE(), inv.due_date) AS days_overdue,
             cm.client_name, cm.phone AS client_phone
      FROM invoice_master inv
      LEFT JOIN client_master cm ON inv.client_id = cm.id
      WHERE inv.status IN ('Sent','Partial','Overdue')
        AND (inv.total - inv.paid_amount) > 0
      ORDER BY days_overdue DESC
    `);
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// GET finance dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [[billing]]     = await db.execute(`SELECT COALESCE(SUM(total),0) AS total FROM invoice_master WHERE status != 'Cancelled'`);
    const [[collected]]   = await db.execute(`SELECT COALESCE(SUM(paid_amount),0) AS total FROM invoice_master WHERE status != 'Cancelled'`);
    const [[outstanding]] = await db.execute(`SELECT COALESCE(SUM(total - paid_amount),0) AS total FROM invoice_master WHERE status IN ('Sent','Partial','Overdue')`);
    const [[overdue]]     = await db.execute(`SELECT COALESCE(SUM(total - paid_amount),0) AS total FROM invoice_master WHERE status IN ('Sent','Partial') AND due_date < CURDATE()`);
    const [[deposits]]    = await db.execute(`SELECT COALESCE(SUM(amount),0) AS total FROM security_deposits WHERE status='Held'`);
    const [[payments30]]  = await db.execute(`SELECT COALESCE(SUM(amount),0) AS total FROM payment_master WHERE payment_date >= DATE_SUB(CURDATE(),INTERVAL 30 DAY)`);
    res.json({
      status: 'success',
      data: {
        totalBilling:     parseFloat(billing.total),
        totalCollected:   parseFloat(collected.total),
        totalOutstanding: parseFloat(outstanding.total),
        overdue:          parseFloat(overdue.total),
        depositsHeld:     parseFloat(deposits.total),
        paymentsLast30d:  parseFloat(payments30.total),
      }
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// RECURRING MONTHLY INVOICE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

// POST trigger recurring billing run for active orders
router.post('/recurring/generate-monthly', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const currentMonth = req.body.target_month || new Date().toISOString().slice(0, 7); // e.g. "2026-08"
    const [year, month] = currentMonth.split('-');
    const periodFrom = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const periodTo   = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    const dueDate    = `${year}-${month}-15`; // default 15th

    // Get all Active rental orders
    const [activeOrders] = await conn.execute(`
      SELECT ro.*, cm.client_name 
      FROM rental_orders ro
      JOIN client_master cm ON ro.client_id = cm.id
      WHERE ro.status = 'Active'
    `);

    // Get Rental Invoice Type ID
    const [[rentalType]] = await conn.execute(`
      SELECT id FROM invoice_type_master WHERE type_code = 'RENTAL' LIMIT 1
    `);

    let generatedCount = 0;
    const generatedInvoices = [];

    for (const order of activeOrders) {
      // Check if invoice already exists for this order in this billing period
      const [[existing]] = await conn.execute(`
        SELECT id FROM invoice_master 
        WHERE order_id = ? AND billing_period_from = ? AND status != 'Cancelled'
        LIMIT 1
      `, [order.id, periodFrom]);

      if (existing) continue; // Already generated for this period

      // Fetch order lines
      const [lines] = await conn.execute(`
        SELECT rol.*, pm.product_name, rp.plan_name 
        FROM rental_order_lines rol
        JOIN product_master pm ON rol.product_id = pm.id
        LEFT JOIN rental_plan_master rp ON rol.plan_id = rp.id
        WHERE rol.order_id = ?
      `, [order.id]);

      if (!lines.length) continue;

      const subtotal   = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
      const tax_amount = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0) * 0.18, 0); // standard 18% GST
      const total      = subtotal + tax_amount;

      const invoice_no = await nextCode('INV', 'invoice_master', 'invoice_no');

      const [invResult] = await conn.execute(`
        INSERT INTO invoice_master (
          invoice_no, invoice_type_id, client_id, order_id, invoice_date,
          due_date, billing_period_from, billing_period_to, subtotal, tax_amount,
          discount, total, paid_amount, status, created_by
        ) VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, 0, ?, 0, 'Sent', ?)
      `, [
        invoice_no, rentalType?.id || null, order.client_id, order.id, dueDate,
        periodFrom, periodTo, subtotal, tax_amount, total, req.body.created_by || null
      ]);

      const invId = invResult.insertId;

      for (const line of lines) {
        await conn.execute(`
          INSERT INTO invoice_lines (invoice_id, description, qty, unit_rate, tax_rate, amount)
          VALUES (?, ?, ?, ?, 18, ?)
        `, [
          invId,
          `Monthly Rental (${currentMonth}): ${line.product_name} ${line.plan_name ? '- ' + line.plan_name : ''}`,
          line.qty,
          line.unit_rate,
          line.amount
        ]);
      }

      generatedCount++;
      generatedInvoices.push({ order_no: order.order_no, client_name: order.client_name, invoice_no, total });
    }

    await conn.commit();
    res.json({
      status: 'success',
      message: generatedCount > 0 
        ? `Successfully generated ${generatedCount} recurring invoice(s) for ${currentMonth}!` 
        : `All active orders already have invoices generated for ${currentMonth}.`,
      generated_count: generatedCount,
      invoices: generatedInvoices
    });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  } finally {
    conn.release();
  }
});

module.exports = router;

