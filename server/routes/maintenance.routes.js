/**
 * Maintenance & Service Management Routes
 * - Service Tickets (CRUD, assign technician/ASP, status lifecycle)
 * - Service History (append-only timeline)
 * - Auto-sync asset status (MAINTENANCE, DAMAGED, AVAILABLE, RENTED)
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const auth    = require('../middleware/auth');

router.use(auth);

// Helper: auto-generate ticket codes

async function nextTicketCode() {
  const [[row]] = await db.execute(
    `SELECT MAX(CAST(SUBSTRING(ticket_no, 5) AS UNSIGNED)) AS mx FROM service_tickets WHERE ticket_no LIKE 'TKT-%'`
  );
  const num = (row?.mx || 0) + 1;
  return `TKT-${String(num).padStart(5, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE TICKETS
// ═══════════════════════════════════════════════════════════════════════════════

// GET all service tickets
router.get('/tickets', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT st.*,
             am.asset_code, am.serial_no,
             pm.product_name, pm.model,
             cm.client_name, cm.phone AS client_phone,
             ro.order_no,
             u.full_name AS technician_name,
             asp.asp_name,
             cb.full_name AS created_by_name
      FROM service_tickets st
      LEFT JOIN asset_master am ON st.asset_id = am.id
      LEFT JOIN product_master pm ON am.product_id = pm.id
      LEFT JOIN client_master cm ON st.client_id = cm.id
      LEFT JOIN rental_orders ro ON st.order_id = ro.id
      LEFT JOIN users u ON st.technician_id = u.id
      LEFT JOIN asp_master asp ON st.asp_id = asp.id
      LEFT JOIN users cb ON st.created_by = cb.id
      ORDER BY st.id DESC
    `);
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// GET single ticket with history
router.get('/tickets/:id', async (req, res) => {
  try {
    const [[ticket]] = await db.execute(`
      SELECT st.*,
             am.asset_code, am.serial_no,
             pm.product_name, pm.model,
             cm.client_name, cm.phone AS client_phone, cm.email AS client_email,
             ro.order_no,
             u.full_name AS technician_name, u.phone AS technician_phone,
             asp.asp_name, asp.phone AS asp_phone,
             cb.full_name AS created_by_name
      FROM service_tickets st
      LEFT JOIN asset_master am ON st.asset_id = am.id
      LEFT JOIN product_master pm ON am.product_id = pm.id
      LEFT JOIN client_master cm ON st.client_id = cm.id
      LEFT JOIN rental_orders ro ON st.order_id = ro.id
      LEFT JOIN users u ON st.technician_id = u.id
      LEFT JOIN asp_master asp ON st.asp_id = asp.id
      LEFT JOIN users cb ON st.created_by = cb.id
      WHERE st.id = ?
    `, [req.params.id]);

    if (!ticket) return res.status(404).json({ status: 'error', message: 'Ticket not found' });

    const [history] = await db.execute(`
      SELECT sh.*, u.full_name AS done_by_name
      FROM service_history sh
      LEFT JOIN users u ON sh.done_by = u.id
      WHERE sh.ticket_id = ?
      ORDER BY sh.done_at DESC
    `, [req.params.id]);

    res.json({ status: 'success', data: { ticket, history } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// POST create service ticket
router.post('/tickets', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { client_id, asset_id, order_id, issue_type, priority = 'Medium',
            description, technician_id, asp_id, created_by } = req.body;

    if (!asset_id) return res.status(400).json({ status: 'error', message: 'Asset is required' });

    const ticket_no = await nextTicketCode();
    const initialStatus = (technician_id || asp_id) ? 'Assigned' : 'Open';

    const [result] = await conn.execute(`
      INSERT INTO service_tickets (ticket_no, client_id, asset_id, order_id, issue_type,
        priority, description, technician_id, asp_id, status, opened_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    `, [
      ticket_no, client_id || null, asset_id, order_id || null, issue_type || 'General Issue',
      priority, description || null, technician_id || null, asp_id || null, initialStatus, created_by || null
    ]);

    const ticketId = result.insertId;

    // Log initial history
    await conn.execute(`
      INSERT INTO service_history (ticket_id, action, description, done_by, done_at)
      VALUES (?, 'Ticket Created', ?, ?, NOW())
    `, [ticketId, `Ticket created: ${issue_type || 'General Issue'} (Priority: ${priority})`, created_by || null]);

    // Update asset status to MAINTENANCE if status exists
    const [[maintStatus]] = await conn.execute(`SELECT id FROM asset_status_master WHERE status_code = 'MAINTENANCE' LIMIT 1`);
    if (maintStatus) {
      const [[currentAsset]] = await conn.execute(`SELECT asset_status_id FROM asset_master WHERE id = ?`, [asset_id]);
      await conn.execute(`UPDATE asset_master SET asset_status_id = ? WHERE id = ?`, [maintStatus.id, asset_id]);
      
      await conn.execute(`
        INSERT INTO asset_status_history (asset_id, from_status, to_status, changed_by, ref_doc_type, ref_doc_id, changed_at, remarks)
        VALUES (?, ?, ?, ?, 'ServiceTicket', ?, NOW(), ?)
      `, [asset_id, currentAsset?.asset_status_id || null, maintStatus.id, created_by || null, ticketId, `Service Ticket ${ticket_no} opened`]);
    }

    await conn.commit();
    res.json({ status: 'success', message: 'Service ticket logged successfully!', id: ticketId, ticket_no });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  } finally {
    conn.release();
  }
});

// PUT update ticket status / assign / resolve
router.put('/tickets/:id/update-status', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { status, technician_id, asp_id, action_note, done_by } = req.body;
    const ticketId = req.params.id;

    const [[ticket]] = await conn.execute(`SELECT * FROM service_tickets WHERE id = ?`, [ticketId]);
    if (!ticket) return res.status(404).json({ status: 'error', message: 'Ticket not found' });

    let resolvedAtSql = '';
    let closedAtSql   = '';
    if (status === 'Resolved') resolvedAtSql = ', resolved_at = NOW()';
    if (status === 'Closed')   closedAtSql   = ', closed_at = NOW()';

    await conn.execute(`
      UPDATE service_tickets
      SET status = ?, technician_id = COALESCE(?, technician_id), asp_id = COALESCE(?, asp_id)
          ${resolvedAtSql} ${closedAtSql}
      WHERE id = ?
    `, [status, technician_id || null, asp_id || null, ticketId]);

    // Record Service History
    await conn.execute(`
      INSERT INTO service_history (ticket_id, action, description, done_by, done_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [ticketId, `Status changed to ${status}`, action_note || `Updated status to ${status}`, done_by || null]);

    // If Closed or Resolved, check if asset should be restored to Available or Rented
    if (status === 'Resolved' || status === 'Closed') {
      const [[availStatus]]  = await conn.execute(`SELECT id FROM asset_status_master WHERE status_code = 'AVAILABLE' LIMIT 1`);
      const [[rentedStatus]] = await conn.execute(`SELECT id FROM asset_status_master WHERE status_code = 'RENTED' LIMIT 1`);

      // Check if this asset has an active allocation
      const [[activeAlloc]] = await conn.execute(`
        SELECT id FROM asset_allocations WHERE asset_id = ? AND status = 'Allocated' LIMIT 1
      `, [ticket.asset_id]);

      const targetStatusId = activeAlloc ? rentedStatus?.id : availStatus?.id;
      if (targetStatusId) {
        const [[curAsset]] = await conn.execute(`SELECT asset_status_id FROM asset_master WHERE id = ?`, [ticket.asset_id]);
        await conn.execute(`UPDATE asset_master SET asset_status_id = ? WHERE id = ?`, [targetStatusId, ticket.asset_id]);
        
        await conn.execute(`
          INSERT INTO asset_status_history (asset_id, from_status, to_status, changed_by, ref_doc_type, ref_doc_id, changed_at, remarks)
          VALUES (?, ?, ?, ?, 'ServiceTicket', ?, NOW(), ?)
        `, [ticket.asset_id, curAsset?.asset_status_id || null, targetStatusId, done_by || null, ticketId, `Service Ticket ${ticket.ticket_no} ${status}`]);
      }
    }

    await conn.commit();
    res.json({ status: 'success', message: `Ticket updated to ${status}!` });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  } finally {
    conn.release();
  }
});

// GET maintenance summary stats
router.get('/stats', async (req, res) => {
  try {
    const [[open]]       = await db.execute(`SELECT COUNT(*) AS total FROM service_tickets WHERE status = 'Open'`);
    const [[assigned]]   = await db.execute(`SELECT COUNT(*) AS total FROM service_tickets WHERE status = 'Assigned'`);
    const [[inProgress]] = await db.execute(`SELECT COUNT(*) AS total FROM service_tickets WHERE status = 'InProgress'`);
    const [[resolved]]   = await db.execute(`SELECT COUNT(*) AS total FROM service_tickets WHERE status = 'Resolved'`);
    const [[closed]]     = await db.execute(`SELECT COUNT(*) AS total FROM service_tickets WHERE status = 'Closed'`);
    const [[highPri]]    = await db.execute(`SELECT COUNT(*) AS total FROM service_tickets WHERE priority IN ('High','Critical') AND status NOT IN ('Resolved','Closed')`);

    res.json({
      status: 'success',
      data: {
        open: open.total,
        assigned: assigned.total,
        inProgress: inProgress.total,
        resolved: resolved.total,
        closed: closed.total,
        highPriorityOpen: highPri.total
      }
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

module.exports = router;
