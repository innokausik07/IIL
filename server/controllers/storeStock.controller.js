const db = require('../config/db');

// GET /api/store-stock
const getList = async (req, res) => {
  try {
    const { pCode, page = 1, limit = 50 } = req.query;
    let where = [];
    let params = [];

    if (pCode) { where.push("pCode LIKE ?"); params.push(`%${pCode}%`); }

    const whereStr = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [countResult] = await db.execute(`SELECT COUNT(*) as total FROM iil_stock_sheet ${whereStr}`, params);
    const total = countResult[0].total;

    const [rows] = await db.execute(
      `SELECT * FROM iil_stock_sheet ${whereStr} ORDER BY pCode ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return res.json({
      status: 'success',
      data: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    console.error('store-stock getList error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { getList };
