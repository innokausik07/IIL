const db = require('../config/db');

// GET /api/cross-audit
const getList = async (req, res) => {
  try {
    const {
      wh_request_id, serial_number, model_no, project_code,
      erp_status, center_code, assignee,
      date_from, date_to, page = 1, limit = 50
    } = req.query;

    let where = [];
    let params = [];

    if (wh_request_id) { where.push("g.wh_request_id LIKE ?"); params.push(`%${wh_request_id}%`); }
    if (serial_number) { where.push("g.serial_number LIKE ?"); params.push(`%${serial_number}%`); }
    if (model_no) { where.push("g.model_no LIKE ?"); params.push(`%${model_no}%`); }
    if (project_code) { where.push("g.project_code LIKE ?"); params.push(`%${project_code}%`); }
    if (erp_status) { where.push("g.erp_status = ?"); params.push(erp_status); }
    if (center_code) { where.push("g.center_code LIKE ?"); params.push(`%${center_code}%`); }
    if (assignee) { where.push("g.assignee LIKE ?"); params.push(`%${assignee}%`); }
    if (date_from) { where.push("DATE(g.created_at) >= ?"); params.push(date_from); }
    if (date_to) { where.push("DATE(g.created_at) <= ?"); params.push(date_to); }

    const whereStr = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM google_sheet_data g ${whereStr}`, params
    );
    const total = countResult[0].total;

    const [rows] = await db.execute(
      `SELECT g.*, p.part_code
       FROM google_sheet_data g
       LEFT JOIN product_master p ON TRIM(g.model_no) = TRIM(p.item_code)
       ${whereStr}
       ORDER BY g.id DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return res.json({
      status: 'success',
      data: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    console.error('cross-audit getList error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { getList };
