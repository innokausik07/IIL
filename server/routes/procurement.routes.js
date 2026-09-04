/**
 * Procurement & Purchase Order Routes
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const auth    = require('../middleware/auth');

router.use(auth);

// Helper: auto-generate PO codes (e.g. PO-00001)
async function nextPoCode() {
  const [[row]] = await db.execute(
    `SELECT MAX(CAST(SUBSTRING(po_no, 4) AS UNSIGNED)) AS mx FROM purchase_order WHERE po_no LIKE 'PO-%'`
  );
  const num = (row?.mx || 0) + 1;
  return `PO-${String(num).padStart(5, '0')}`;
}

// 1. GET /api/procurement/purchase-orders — List POs
router.get('/purchase-orders', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        po.*,
        v.name as vendor_name, v.phone as vendor_phone, v.email as vendor_email,
        l.location_name as plant_name,
        u.full_name as created_by_name,
        ab.full_name as approved_by_name,
        (SELECT COUNT(*) FROM purchase_order_lines WHERE po_id = po.id) as line_count,
        (SELECT COALESCE(SUM(qty_ordered), 0) FROM purchase_order_lines WHERE po_id = po.id) as total_qty_ordered,
        (SELECT COALESCE(SUM(qty_received), 0) FROM purchase_order_lines WHERE po_id = po.id) as total_qty_received
      FROM purchase_order po
      LEFT JOIN vendor_master v ON po.vendor_id = v.sno OR po.vendor_id = v.id
      LEFT JOIN locations l ON po.plant_id = l.id
      LEFT JOIN users u ON po.created_by = u.id
      LEFT JOIN users ab ON po.approved_by = ab.id
      ORDER BY po.id DESC
    `);
    res.json({ status: 'success', data: rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

// 2. GET /api/procurement/purchase-orders/:id — Detail with lines
router.get('/purchase-orders/:id', async (req, res) => {
  try {
    const [[po]] = await db.execute(`
      SELECT 
        po.*,
        v.name as vendor_name, v.phone as vendor_phone, v.email as vendor_email, v.address as vendor_address, v.gstin_no as vendor_gstin,
        l.location_name as plant_name, l.address as plant_address, l.city as plant_city, l.state as plant_state, l.pincode as plant_pincode,
        u.full_name as created_by_name,
        ab.full_name as approved_by_name
      FROM purchase_order po
      LEFT JOIN vendor_master v ON po.vendor_id = v.sno OR po.vendor_id = v.id
      LEFT JOIN locations l ON po.plant_id = l.id
      LEFT JOIN users u ON po.created_by = u.id
      LEFT JOIN users ab ON po.approved_by = ab.id
      WHERE po.id = ?
    `, [req.params.id]);

    if (!po) {
      return res.status(404).json({ status: 'error', message: 'Purchase Order not found.' });
    }

    const [lines] = await db.execute(
      `SELECT pol.*, pm.product_name, pm.item_code 
       FROM purchase_order_lines pol 
       LEFT JOIN product_master pm ON pol.product_id = pm.id 
       WHERE pol.po_id = ? 
       ORDER BY pol.id ASC`,
      [req.params.id]
    );

    res.json({ status: 'success', data: { ...po, lines } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

// 3. POST /api/procurement/purchase-orders — Create PO
router.post('/purchase-orders', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      vendor_id, plant_id, po_date, delivery_date, payment_terms,
      lines = [], remarks, tax_percent = 18.00
    } = req.body;

    if (!vendor_id) {
      return res.status(400).json({ status: 'error', message: 'Vendor is required.' });
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ status: 'error', message: 'At least one line item is required.' });
    }

    const po_no = await nextPoCode();

    let subtotal = 0;
    lines.forEach(line => {
      const qty = Math.max(parseInt(line.qty_ordered) || 1, 1);
      const price = Math.max(parseFloat(line.unit_price) || 0, 0);
      subtotal += qty * price;
    });

    const taxRate = parseFloat(tax_percent) || 18.00;
    const tax_amount = Math.round((subtotal * (taxRate / 100)) * 100) / 100;
    const total_amount = subtotal + tax_amount;

    const [result] = await conn.execute(
      `INSERT INTO purchase_order
        (po_no, po_date, vendor_id, plant_id, delivery_date, payment_terms,
         subtotal, tax_percent, tax_amount, total_amount, status, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?)`,
      [
        po_no,
        po_date || new Date().toISOString().split('T')[0],
        vendor_id,
        plant_id || null,
        delivery_date || null,
        payment_terms || '30 Days Net',
        subtotal,
        taxRate,
        tax_amount,
        total_amount,
        remarks || '',
        req.user?.id || null
      ]
    );

    const poId = result.insertId;

    for (const line of lines) {
      const qty = Math.max(parseInt(line.qty_ordered) || 1, 1);
      const price = Math.max(parseFloat(line.unit_price) || 0, 0);
      const total = qty * price;

      await conn.execute(
        `INSERT INTO purchase_order_lines
          (po_id, product_id, item_name, part_code, qty_ordered, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          poId,
          line.product_id || null,
          line.item_name || 'Hardware SKU',
          line.part_code || '',
          qty,
          price,
          total
        ]
      );
    }

    await conn.commit();
    res.json({
      status: 'success',
      message: `Purchase Order ${po_no} created successfully!`,
      id: poId,
      po_no
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  } finally {
    conn.release();
  }
});

// 4. POST /api/procurement/purchase-orders/:id/approve — Approve PO
router.post('/purchase-orders/:id/approve', async (req, res) => {
  try {
    await db.execute(
      `UPDATE purchase_order 
       SET status = 'Approved', approved_by = ?, approved_at = NOW() 
       WHERE id = ?`,
      [req.user?.id || null, req.params.id]
    );
    res.json({ status: 'success', message: 'Purchase Order approved successfully!' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

// 5. POST /api/procurement/purchase-orders/:id/cancel — Cancel PO
router.post('/purchase-orders/:id/cancel', async (req, res) => {
  try {
    await db.execute(
      `UPDATE purchase_order SET status = 'Cancelled' WHERE id = ?`,
      [req.params.id]
    );
    res.json({ status: 'success', message: 'Purchase Order cancelled.' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

// Helper: auto-generate GRN code
async function nextGrnCode() {
  try {
    const [[row]] = await db.execute(
      `SELECT MAX(CAST(SUBSTRING(grn_no, 5) AS UNSIGNED)) AS mx FROM goods_receipt_note WHERE grn_no LIKE 'GRN-%'`
    );
    const num = (row?.mx || 0) + 1;
    return `GRN-${String(num).padStart(5, '0')}`;
  } catch {
    return `GRN-${Date.now().toString().slice(-6)}`;
  }
}

// 6. POST /api/procurement/purchase-orders/:id/receive-grn — 1-Click Receive GRN & Auto-Create Assets
router.post('/purchase-orders/:id/receive-grn', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const poId = req.params.id;
    const {
      invoice_no,
      invoice_date = new Date().toISOString().split('T')[0],
      warehouse_name,
      warehouse_id,
      lines = [],
      remarks = ''
    } = req.body;

    // 1. Fetch PO details
    const [[po]] = await conn.execute(
      `SELECT po.*, v.name as vendor_name 
       FROM purchase_order po 
       LEFT JOIN vendor_master v ON po.vendor_id = v.sno OR po.vendor_id = v.id 
       WHERE po.id = ?`,
      [poId]
    );

    if (!po) {
      await conn.rollback();
      return res.status(404).json({ status: 'error', message: 'Purchase order not found.' });
    }

    if (po.status === 'Cancelled') {
      await conn.rollback();
      return res.status(400).json({ status: 'error', message: 'Cannot receive items against a cancelled PO.' });
    }

    const grnNo = await nextGrnCode();
    const vendorName = po.vendor_name || 'Vendor';
    const targetWh = warehouse_name || 'Main Warehouse';

    let totalRec = 0;
    let totalAcc = 0;
    let totalRej = 0;
    let assetsCreated = 0;

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const recQty = parseInt(line.received_qty || 0, 10);
      const accQty = parseInt(line.accepted_qty || recQty, 10);
      const rejQty = parseInt(line.rejected_qty || 0, 10);

      totalRec += recQty;
      totalAcc += accQty;
      totalRej += rejQty;

      // Update PO line received qty
      if (line.po_line_id) {
        await conn.execute(
          `UPDATE purchase_order_lines 
           SET qty_received = COALESCE(qty_received, 0) + ? 
           WHERE id = ?`,
          [recQty, line.po_line_id]
        );
      }

      // Check serial numbers or auto-generate assets for accepted qty
      let serials = [];
      if (Array.isArray(line.serial_numbers)) {
        serials = line.serial_numbers.filter(Boolean);
      } else if (typeof line.serial_numbers === 'string' && line.serial_numbers.trim()) {
        serials = line.serial_numbers.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      }

      const countToCreate = Math.max(serials.length, accQty);
      for (let sIdx = 0; sIdx < countToCreate; sIdx++) {
        const serialNo = serials[sIdx] || `SN-${Date.now().toString().slice(-6)}-${assetsCreated + 1}`;
        const assetCode = `AST-${(line.part_code || line.product_id || 'IT').toString().toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}${assetsCreated + 1}`;

        try {
          await conn.execute(
            `INSERT INTO asset_master 
             (asset_code, serial_no, product_id, vendor_id, current_loc_id, purchase_date, purchase_cost, purchase_ref, notes, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '1', ?)`,
            [
              assetCode,
              serialNo,
              line.product_id || 1,
              po.vendor_id || null,
              warehouse_id || po.plant_id || null,
              invoice_date,
              line.unit_price || 0,
              po.po_no,
              `Received via GRN ${grnNo} (Invoice: ${invoice_no || 'N/A'})`,
              req.user?.id || null
            ]
          );
          assetsCreated++;
        } catch (astErr) {
          // If asset_code or serial duplicate, append random suffix
          const fallbackCode = `${assetCode}-${Math.floor(Math.random()*1000)}`;
          await conn.execute(
            `INSERT INTO asset_master 
             (asset_code, serial_no, product_id, vendor_id, current_loc_id, purchase_date, purchase_cost, purchase_ref, notes, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '1', ?)`,
            [
              fallbackCode,
              `${serialNo}-${Math.floor(Math.random()*100)}`,
              line.product_id || 1,
              po.vendor_id || null,
              warehouse_id || po.plant_id || null,
              invoice_date,
              line.unit_price || 0,
              po.po_no,
              `Received via GRN ${grnNo} (Invoice: ${invoice_no || 'N/A'})`,
              req.user?.id || null
            ]
          );
          assetsCreated++;
        }
      }
    }

    // Insert into goods_receipt_note
    await conn.execute(
      `INSERT INTO goods_receipt_note 
       (grn_no, grn_date, vendor_name, po_no, invoice_no, warehouse_name, received_qty, accepted_qty, rejected_qty, status, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Verified', ?)`,
      [
        grnNo,
        invoice_date,
        vendorName,
        po.po_no,
        invoice_no || null,
        targetWh,
        String(totalRec),
        String(totalAcc),
        String(totalRej),
        remarks || `Inward received for ${po.po_no}`
      ]
    );

    // Check if PO is completely received
    const [[summary]] = await conn.execute(
      `SELECT 
         COALESCE(SUM(qty_ordered), 0) as total_ordered,
         COALESCE(SUM(qty_received), 0) as total_received
       FROM purchase_order_lines 
       WHERE po_id = ?`,
      [poId]
    );

    const newStatus = (summary.total_received >= summary.total_ordered) ? 'Received' : 'Partially Received';
    await conn.execute(
      `UPDATE purchase_order SET status = ? WHERE id = ?`,
      [newStatus, poId]
    );

    await conn.commit();
    res.json({
      status: 'success',
      message: `GRN (${grnNo}) generated successfully! ${assetsCreated} hardware asset units created in Asset Master.`,
      data: { grn_no: grnNo, assets_created: assetsCreated, po_status: newStatus }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
