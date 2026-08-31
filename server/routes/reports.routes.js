/**
 * Reports & Analytics Routes
 * - Executive KPI Dashboard
 * - Fleet / Asset Utilization Breakdown
 * - Monthly Recurring Revenue (MRR) & Collections
 * - Client Aging & Outstanding Matrix
 * - Expiring Rental Contracts (30/60/90 days)
 * - Maintenance Turnaround Analytics
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// 1. Executive Comprehensive KPI Summary
router.get('/kpi-summary', async (req, res) => {
  try {
    const [[assetStats]] = await db.execute(`
      SELECT 
        COUNT(*) AS total_assets,
        SUM(CASE WHEN s.is_available = 1 THEN 1 ELSE 0 END) AS available_assets,
        SUM(CASE WHEN s.is_rented = 1 THEN 1 ELSE 0 END) AS rented_assets,
        SUM(CASE WHEN s.status_code = 'MAINTENANCE' THEN 1 ELSE 0 END) AS maintenance_assets,
        SUM(CASE WHEN s.status_code IN ('DAMAGED', 'LOST', 'SCRAPPED') THEN 1 ELSE 0 END) AS offline_assets,
        COALESCE(SUM(am.purchase_cost), 0) AS total_inventory_value
      FROM asset_master am
      LEFT JOIN asset_status_master s ON am.asset_status_id = s.id
      WHERE am.deleted_at IS NULL
    `);

    const [[rentalStats]] = await db.execute(`
      SELECT 
        COUNT(*) AS total_orders,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active_rentals,
        SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) AS pending_allocation,
        SUM(CASE WHEN status = 'Active' THEN total_amount ELSE 0 END) AS monthly_recurring_revenue
      FROM rental_orders
    `);

    const [[financeStats]] = await db.execute(`
      SELECT 
        COALESCE(SUM(total), 0) AS total_billed,
        COALESCE(SUM(paid_amount), 0) AS total_collected,
        COALESCE(SUM(CASE WHEN status IN ('Sent', 'Partial', 'Overdue') THEN (total - paid_amount) ELSE 0 END), 0) AS total_outstanding,
        COALESCE(SUM(CASE WHEN status IN ('Sent', 'Partial') AND due_date < CURDATE() THEN (total - paid_amount) ELSE 0 END), 0) AS total_overdue
      FROM invoice_master
      WHERE status != 'Cancelled'
    `);

    const [[ticketStats]] = await db.execute(`
      SELECT 
        COUNT(*) AS total_tickets,
        SUM(CASE WHEN status IN ('Open', 'Assigned', 'InProgress') THEN 1 ELSE 0 END) AS open_tickets,
        SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) AS resolved_tickets
      FROM service_tickets
    `);

    const fleetOccupancy = assetStats.total_assets > 0 
      ? Math.round((assetStats.rented_assets / assetStats.total_assets) * 100) 
      : 0;

    res.json({
      status: 'success',
      data: {
        assets: {
          ...assetStats,
          occupancy_rate: fleetOccupancy
        },
        rentals: rentalStats,
        finance: financeStats,
        tickets: ticketStats
      }
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// 2. Asset Fleet Breakdown by Category & Status
router.get('/asset-utilization', async (req, res) => {
  try {
    const [byCategory] = await db.execute(`
      SELECT 
        COALESCE(pc.cat_name, 'Uncategorized') AS category_name,
        COUNT(am.id) AS total,
        SUM(CASE WHEN s.is_available = 1 THEN 1 ELSE 0 END) AS available,
        SUM(CASE WHEN s.is_rented = 1 THEN 1 ELSE 0 END) AS rented,
        SUM(CASE WHEN s.status_code = 'MAINTENANCE' THEN 1 ELSE 0 END) AS in_maintenance
      FROM asset_master am
      LEFT JOIN product_master pm ON am.product_id = pm.id
      LEFT JOIN product_cat_master pc ON pm.product_category_id = pc.catid
      LEFT JOIN asset_status_master s ON am.asset_status_id = s.id
      WHERE am.deleted_at IS NULL
      GROUP BY pc.catid, pc.cat_name
      ORDER BY total DESC
    `);

    const [byStatus] = await db.execute(`
      SELECT 
        s.status_name, s.status_code, s.color,
        COUNT(am.id) AS count,
        COALESCE(SUM(am.purchase_cost), 0) AS total_val
      FROM asset_master am
      LEFT JOIN asset_status_master s ON am.asset_status_id = s.id
      WHERE am.deleted_at IS NULL
      GROUP BY s.id, s.status_name, s.status_code, s.color
      ORDER BY count DESC
    `);

    res.json({ status: 'success', data: { byCategory, byStatus } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// 3. Client Aging Matrix (Overdue buckets: 0-30, 31-60, 61-90, 90+)
router.get('/aging-analysis', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        cm.id AS client_id,
        cm.client_name,
        cm.phone,
        cm.email,
        COUNT(inv.id) AS total_unpaid_invoices,
        COALESCE(SUM(inv.total - inv.paid_amount), 0) AS total_outstanding,
        COALESCE(SUM(CASE WHEN DATEDIFF(CURDATE(), inv.due_date) <= 30 THEN (inv.total - inv.paid_amount) ELSE 0 END), 0) AS bucket_0_30,
        COALESCE(SUM(CASE WHEN DATEDIFF(CURDATE(), inv.due_date) BETWEEN 31 AND 60 THEN (inv.total - inv.paid_amount) ELSE 0 END), 0) AS bucket_31_60,
        COALESCE(SUM(CASE WHEN DATEDIFF(CURDATE(), inv.due_date) BETWEEN 61 AND 90 THEN (inv.total - inv.paid_amount) ELSE 0 END), 0) AS bucket_61_90,
        COALESCE(SUM(CASE WHEN DATEDIFF(CURDATE(), inv.due_date) > 90 THEN (inv.total - inv.paid_amount) ELSE 0 END), 0) AS bucket_90_plus
      FROM client_master cm
      JOIN invoice_master inv ON cm.id = inv.client_id
      WHERE inv.status IN ('Sent', 'Partial', 'Overdue')
        AND (inv.total - inv.paid_amount) > 0
      GROUP BY cm.id, cm.client_name, cm.phone, cm.email
      ORDER BY total_outstanding DESC
    `);
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// 4. Expiring & Active Rental Contracts
router.get('/expiring-rentals', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        ro.id, ro.order_no, ro.order_date, ro.start_date, ro.end_date,
        ro.total_amount AS monthly_rental, ro.status,
        cm.client_name, cm.phone AS client_phone,
        DATEDIFF(ro.end_date, CURDATE()) AS days_remaining,
        (SELECT COUNT(*) FROM asset_allocations WHERE order_id = ro.id AND status = 'Allocated') AS total_units_deployed
      FROM rental_orders ro
      LEFT JOIN client_master cm ON ro.client_id = cm.id
      WHERE ro.status = 'Active' AND ro.end_date IS NOT NULL
      ORDER BY days_remaining ASC
    `);
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// 5. Monthly Revenue Trend (Last 6 Months)
router.get('/revenue-trend', async (req, res) => {
  try {
    const [billed] = await db.execute(`
      SELECT 
        DATE_FORMAT(invoice_date, '%Y-%m') AS month_key,
        DATE_FORMAT(invoice_date, '%b %Y') AS month_label,
        COALESCE(SUM(total), 0) AS total_billed
      FROM invoice_master
      WHERE status != 'Cancelled'
        AND invoice_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month_key, month_label
      ORDER BY month_key ASC
    `);

    const [collected] = await db.execute(`
      SELECT 
        DATE_FORMAT(payment_date, '%Y-%m') AS month_key,
        DATE_FORMAT(payment_date, '%b %Y') AS month_label,
        COALESCE(SUM(amount), 0) AS total_collected
      FROM payment_master
      WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month_key, month_label
      ORDER BY month_key ASC
    `);

    res.json({ status: 'success', data: { billed, collected } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

module.exports = router;
