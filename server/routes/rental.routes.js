/**
 * Rental Management Routes
 * - Rental Orders (CRUD + approve + status transitions)
 * - Rental Order Lines
 * - Asset Reservations
 * - Asset Allocations
 * - Rental Agreements
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ── Helper: auto-generate numbered codes ──────────────────────────────────────
async function nextCode(prefix, table, col) {
  const [[row]] = await db.execute(
    `SELECT MAX(CAST(SUBSTRING(${col}, LENGTH(?) + 2) AS UNSIGNED)) AS mx FROM ${table} WHERE ${col} LIKE ?`,
    [prefix, `${prefix}-%`]
  );
  const num = (row.mx || 0) + 1;
  return `${prefix}-${String(num).padStart(5, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENTAL ORDERS
// ═══════════════════════════════════════════════════════════════════════════════

// GET all rental orders with joins
router.get('/orders', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT ro.*,
             cm.client_name, cm.phone AS client_phone,
             l.location_name AS delivery_location,
             u.full_name AS created_by_name,
             ab.full_name AS approved_by_name,
             (SELECT COUNT(*) FROM rental_order_lines WHERE order_id = ro.id) AS line_count,
             (SELECT COUNT(*) FROM asset_allocations WHERE order_id = ro.id) AS allocated_count
      FROM rental_orders ro
      LEFT JOIN client_master cm ON ro.client_id = cm.id
      LEFT JOIN locations l ON ro.delivery_loc_id = l.id
      LEFT JOIN users u ON ro.created_by = u.id
      LEFT JOIN users ab ON ro.approved_by = ab.id
      ORDER BY ro.id DESC
    `);
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// GET single rental order with full details
router.get('/orders/:id', async (req, res) => {
  try {
    const [[order]] = await db.execute(`
      SELECT ro.*,
             cm.client_name, cm.phone AS client_phone, cm.email AS client_email,
             cm.address AS client_address, cm.gstin AS client_gstin,
             l.location_name AS delivery_location,
             u.full_name AS created_by_name
      FROM rental_orders ro
      LEFT JOIN client_master cm ON ro.client_id = cm.id
      LEFT JOIN locations l ON ro.delivery_loc_id = l.id
      LEFT JOIN users u ON ro.created_by = u.id
      WHERE ro.id = ?
    `, [req.params.id]);

    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    const [lines] = await db.execute(`
      SELECT rol.*,
             pm.product_name, pm.model, pm.part_code,
             rp.plan_name, rp.monthly_rent AS plan_rate,
             (SELECT COUNT(*) FROM asset_allocations WHERE order_line_id = rol.id) AS assets_allocated
      FROM rental_order_lines rol
      LEFT JOIN product_master pm ON rol.product_id = pm.id
      LEFT JOIN rental_plan_master rp ON rol.plan_id = rp.id
      WHERE rol.order_id = ?
    `, [req.params.id]);

    const [allocations] = await db.execute(`
      SELECT aa.*,
             am.asset_code, am.serial_no,
             pm.product_name,
             s.status_name AS asset_status_name, s.color AS status_color,
             l.location_name AS current_location
      FROM asset_allocations aa
      LEFT JOIN asset_master am ON aa.asset_id = am.id
      LEFT JOIN product_master pm ON am.product_id = pm.id
      LEFT JOIN asset_status_master s ON am.asset_status_id = s.id
      LEFT JOIN locations l ON am.current_loc_id = l.id
      WHERE aa.order_id = ?
    `, [req.params.id]);

    res.json({ status: 'success', data: { order, lines, allocations } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// POST create rental order
router.post('/orders', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { client_id, lead_id, quot_id, org_unit_id, delivery_loc_id,
            order_date, start_date, end_date, remarks, created_by, lines = [] } = req.body;

    if (!client_id) return res.status(400).json({ status: 'error', message: 'Client is required' });

    const order_no = await nextCode('RO', 'rental_orders', 'order_no');
    const total = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);

    const [result] = await conn.execute(
      `INSERT INTO rental_orders (order_no, client_id, lead_id, quot_id, org_unit_id,
        delivery_loc_id, order_date, start_date, end_date, total_amount, remarks, created_by, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'Draft')`,
      [order_no, client_id, lead_id||null, quot_id||null, org_unit_id||null,
       delivery_loc_id||null, order_date, start_date||null, end_date||null,
       total, remarks||null, created_by||null]
    );

    const orderId = result.insertId;
    for (const line of lines) {
      await conn.execute(
        `INSERT INTO rental_order_lines (order_id, product_id, plan_id, qty, unit_rate, amount, status)
         VALUES (?,?,?,?,?,?,'Open')`,
        [orderId, line.product_id, line.plan_id||null, line.qty||1, line.unit_rate||0, line.amount||0]
      );
    }

    await conn.commit();
    res.json({ status: 'success', message: 'Rental order created!', id: orderId, order_no });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  } finally {
    conn.release();
  }
});

// PUT update rental order
router.put('/orders/:id', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { client_id, delivery_loc_id, order_date, start_date, end_date,
            remarks, lines = [] } = req.body;

    const total = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);

    await conn.execute(
      `UPDATE rental_orders SET client_id=?, delivery_loc_id=?, order_date=?,
        start_date=?, end_date=?, total_amount=?, remarks=? WHERE id=? AND status='Draft'`,
      [client_id, delivery_loc_id||null, order_date, start_date||null, end_date||null,
       total, remarks||null, req.params.id]
    );

    // Replace lines
    await conn.execute(`DELETE FROM rental_order_lines WHERE order_id=?`, [req.params.id]);
    for (const line of lines) {
      await conn.execute(
        `INSERT INTO rental_order_lines (order_id, product_id, plan_id, qty, unit_rate, amount, status)
         VALUES (?,?,?,?,?,?,'Open')`,
        [req.params.id, line.product_id, line.plan_id||null, line.qty||1, line.unit_rate||0, line.amount||0]
      );
    }

    await conn.commit();
    res.json({ status: 'success', message: 'Order updated!' });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  } finally {
    conn.release();
  }
});

// PUT approve order
router.put('/orders/:id/approve', async (req, res) => {
  try {
    const { approved_by } = req.body;
    await db.execute(
      `UPDATE rental_orders SET status='Confirmed', approved_by=?, approved_at=NOW() WHERE id=? AND status='Draft'`,
      [approved_by||null, req.params.id]
    );
    res.json({ status: 'success', message: 'Order confirmed!' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// PUT cancel order
router.put('/orders/:id/cancel', async (req, res) => {
  try {
    await db.execute(
      `UPDATE rental_orders SET status='Cancelled' WHERE id=? AND status IN ('Draft','Confirmed')`,
      [req.params.id]
    );
    res.json({ status: 'success', message: 'Order cancelled.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// PUT activate order (after delivery)
router.put('/orders/:id/activate', async (req, res) => {
  try {
    await db.execute(
      `UPDATE rental_orders SET status='Active', start_date=COALESCE(start_date, CURDATE()) WHERE id=?`,
      [req.params.id]
    );
    res.json({ status: 'success', message: 'Rental activated!' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// PUT close order
router.put('/orders/:id/close', async (req, res) => {
  try {
    await db.execute(
      `UPDATE rental_orders SET status='Closed' WHERE id=?`, [req.params.id]
    );
    res.json({ status: 'success', message: 'Order closed.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ASSET ALLOCATION
// ═══════════════════════════════════════════════════════════════════════════════

// GET available assets for a product
router.get('/available-assets/:product_id', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT am.id, am.asset_code, am.serial_no,
             s.status_name, s.color AS status_color,
             c.cond_name AS condition_name,
             l.location_name AS current_location
      FROM asset_master am
      LEFT JOIN asset_status_master s ON am.asset_status_id = s.id
      LEFT JOIN asset_condition_master c ON am.condition_id = c.id
      LEFT JOIN locations l ON am.current_loc_id = l.id
      WHERE am.product_id = ? AND s.is_available = 1 AND am.deleted_at IS NULL
        AND am.id NOT IN (SELECT asset_id FROM asset_allocations WHERE status = 'Allocated')
      ORDER BY am.asset_code ASC
    `, [req.params.product_id]);
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// POST allocate assets to an order line
router.post('/orders/:id/allocate', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { allocations, allocated_by } = req.body;
    // allocations = [{order_line_id, asset_id}]

    // Get RENTED status id
    const [[rentedStatus]] = await conn.execute(
      `SELECT id FROM asset_status_master WHERE status_code='RENTED' LIMIT 1`
    );
    const [[allocatedStatus]] = await conn.execute(
      `SELECT id FROM asset_status_master WHERE status_code='ALLOCATED' LIMIT 1`
    );

    for (const alloc of allocations) {
      // Get current status of asset for movement history
      const [[asset]] = await conn.execute(
        `SELECT asset_status_id, current_loc_id FROM asset_master WHERE id=?`, [alloc.asset_id]
      );

      // Insert allocation record
      await conn.execute(
        `INSERT INTO asset_allocations (order_id, order_line_id, asset_id, allocated_at, allocated_by, status)
         VALUES (?,?,?,NOW(),?,'Allocated')`,
        [req.params.id, alloc.order_line_id, alloc.asset_id, allocated_by||null]
      );

      // Update asset status to ALLOCATED
      if (allocatedStatus) {
        await conn.execute(
          `UPDATE asset_master SET asset_status_id=? WHERE id=?`,
          [allocatedStatus.id, alloc.asset_id]
        );
        // Record status history
        await conn.execute(
          `INSERT INTO asset_status_history (asset_id, from_status, to_status, changed_by, ref_doc_type, ref_doc_id, changed_at)
           VALUES (?,?,?,?,'RentalOrder',?,NOW())`,
          [alloc.asset_id, asset?.asset_status_id||null, allocatedStatus.id, allocated_by||null, req.params.id]
        );
      }
    }

    // Update order status to In Progress if confirmed
    await conn.execute(
      `UPDATE rental_orders SET status='In Progress' WHERE id=? AND status='Confirmed'`,
      [req.params.id]
    );

    await conn.commit();
    res.json({ status: 'success', message: `${allocations.length} asset(s) allocated!` });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  } finally {
    conn.release();
  }
});

// PUT return asset
router.put('/allocations/:id/return', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { return_condition, remarks, returned_by } = req.body;

    const [[alloc]] = await conn.execute(
      `SELECT * FROM asset_allocations WHERE id=?`, [req.params.id]
    );
    if (!alloc) return res.status(404).json({ status: 'error', message: 'Allocation not found' });

    await conn.execute(
      `UPDATE asset_allocations SET returned_at=NOW(), return_condition=?, status='Returned', remarks=? WHERE id=?`,
      [return_condition||'Good', remarks||null, req.params.id]
    );

    // Set asset status to RETURNED / INSPECTION
    const [[inspStatus]] = await conn.execute(
      `SELECT id FROM asset_status_master WHERE status_code='INSPECTION' LIMIT 1`
    );
    if (inspStatus) {
      const [[asset]] = await conn.execute(`SELECT asset_status_id FROM asset_master WHERE id=?`, [alloc.asset_id]);
      await conn.execute(`UPDATE asset_master SET asset_status_id=? WHERE id=?`, [inspStatus.id, alloc.asset_id]);
      await conn.execute(
        `INSERT INTO asset_status_history (asset_id, from_status, to_status, changed_by, ref_doc_type, ref_doc_id, changed_at)
         VALUES (?,?,?,?,'Return',?,NOW())`,
        [alloc.asset_id, asset?.asset_status_id||null, inspStatus.id, returned_by||null, alloc.order_id]
      );
    }

    await conn.commit();
    res.json({ status: 'success', message: 'Asset returned and sent for inspection!' });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  } finally {
    conn.release();
  }
});

// GET asset movement history
router.get('/asset-history/:asset_id', async (req, res) => {
  try {
    const [moves] = await db.execute(`
      SELECT am.*, fl.location_name AS from_loc, tl.location_name AS to_loc,
             fs.status_name AS from_status_name, ts.status_name AS to_status_name,
             ts.color AS to_status_color, u.full_name AS moved_by_name
      FROM asset_movements am
      LEFT JOIN locations fl ON am.from_loc_id = fl.id
      LEFT JOIN locations tl ON am.to_loc_id = tl.id
      LEFT JOIN asset_status_master fs ON am.from_status = fs.id
      LEFT JOIN asset_status_master ts ON am.to_status = ts.id
      LEFT JOIN users u ON am.moved_by = u.id
      WHERE am.asset_id = ? ORDER BY am.moved_at DESC
    `, [req.params.asset_id]);
    res.json({ status: 'success', data: moves });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

module.exports = router;
