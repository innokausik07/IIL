const db = require('../config/db');

// GET /api/users - List all users
const getUsers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, emp_id, full_name, email, utype, owner, mobile, alt_mobile, status, created_at 
       FROM users 
       ORDER BY id DESC`
    );
    return res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error('Get Users Error:', err);
    return res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
};

// POST /api/users/create - Create a new user
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

// PUT /api/users/:id - Update user details
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userType, owner, empId, password, userName, altMobile, mobileNo, emailId, status } = req.body;

    if (!userName) {
      return res.status(400).json({ status: 'error', message: 'User Name is required.' });
    }

    if (password && password.trim() !== '') {
      await db.execute(
        `UPDATE users SET full_name = ?, email = ?, password = ?, emp_id = ?, utype = ?, owner = ?, mobile = ?, alt_mobile = ?, status = ? WHERE id = ?`,
        [userName, emailId || '', password, empId || '', userType || '9', owner || '', mobileNo || '', altMobile || '', status || '1', id]
      );
    } else {
      await db.execute(
        `UPDATE users SET full_name = ?, email = ?, emp_id = ?, utype = ?, owner = ?, mobile = ?, alt_mobile = ?, status = ? WHERE id = ?`,
        [userName, emailId || '', empId || '', userType || '9', owner || '', mobileNo || '', altMobile || '', status || '1', id]
      );
    }

    return res.json({ status: 'success', message: 'User updated successfully!' });
  } catch (err) {
    console.error('Update User Error:', err);
    return res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
};

// DELETE /api/users/:id - Toggle/Deactivate user status
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [user] = await db.execute('SELECT status FROM users WHERE id = ?', [id]);
    if (!user || user.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const currentStatus = String(user[0].status);
    const newStatus = currentStatus === '1' ? '0' : '1';
    await db.execute('UPDATE users SET status = ? WHERE id = ?', [newStatus, id]);

    return res.json({
      status: 'success',
      message: `User ${newStatus === '1' ? 'activated' : 'deactivated'} successfully!`,
      newStatus
    });
  } catch (err) {
    console.error('Delete User Error:', err);
    return res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
