const db = require('../config/db');

// POST /api/users/create
const createUser = async (req, res) => {
  try {
    const { userType, owner, empId, password, userName, altMobile, mobileNo, emailId, status } = req.body;

    if (!userName || !password) {
      return res.status(400).json({ status: 'error', message: 'User Name and Password are required.' });
    }

    const [result] = await db.execute(
      `INSERT INTO users (full_name, email, password, emp_id, utype, owner, mobile, alt_mobile, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userName  || '',
        emailId   || '',
        password,
        empId     || '',
        userType  || '9',
        owner     || '',
        mobileNo  || '',
        altMobile || '',
        status    || '1'
      ]
    );

    return res.json({ status: 'success', message: 'User created successfully!', id: result.insertId });
  } catch (err) {
    console.error('Create User Error:', err.code, err.sqlMessage || err.message);
    return res.status(500).json({
      status: 'error',
      message: err.sqlMessage || err.message || 'Unknown DB error'
    });
  }
};

module.exports = { createUser };
