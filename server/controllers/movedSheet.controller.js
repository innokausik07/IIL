const db = require('../config/db');

// GET /api/moved-sheet
const getList = async (req, res) => {
  try {
    const {
      wh_request_id, serial_number, model_no, project_code,
      erp_status, center_code, assignee, vendor_code,
      date_from, date_to, page = 1, limit = 50
    } = req.query;

    let where = [];
    let params = [];

    if (wh_request_id) { where.push("wh_request_id LIKE ?"); params.push(`%${wh_request_id}%`); }
    if (serial_number) { where.push("serial_number LIKE ?"); params.push(`%${serial_number}%`); }
    if (model_no) { where.push("model_no LIKE ?"); params.push(`%${model_no}%`); }
    if (project_code) { where.push("project_code LIKE ?"); params.push(`%${project_code}%`); }
    if (erp_status) { where.push("erp_status = ?"); params.push(erp_status); }
    if (center_code) { where.push("center_code LIKE ?"); params.push(`%${center_code}%`); }
    if (assignee) { where.push("assignee LIKE ?"); params.push(`%${assignee}%`); }
    if (vendor_code) { where.push("vendor_code LIKE ?"); params.push(`%${vendor_code}%`); }
    if (date_from) { where.push("DATE(movement_at) >= ?"); params.push(date_from); }
    if (date_to) { where.push("DATE(movement_at) <= ?"); params.push(date_to); }

    const whereStr = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [countResult] = await db.execute(`SELECT COUNT(*) as total FROM moved_sheet ${whereStr}`, params);
    const total = countResult[0].total;

    const [rows] = await db.execute(
      `SELECT * FROM moved_sheet ${whereStr} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return res.json({
      status: 'success',
      data: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    console.error('moved-sheet getList error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { getList };
