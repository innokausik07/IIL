const db = require('../config/db');
const fs = require('fs');

const createUser = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const {
      userType,
      owner,
      empId,
      password,
      userName,
      altMobile,
      mobileNo,
      emailId,
      status
    } = req.body;

    const profileImg = req.file ? req.file.filename : null;

    if (!empId || !password || !userName) {
      return res.status(400).json({ status: 'error', message: 'Emp ID, User Name, and Password are required.' });
    }

    // Automatically ensure the database table has all the necessary columns
    // The legacy database might only have username, password, name, utype, status
    const alterQueries = [
      "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS emp_id VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS owner VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS alt_mobile VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS mobile VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS profile_img VARCHAR(255) DEFAULT NULL",
    ];

    for (const q of alterQueries) {
      try { await conn.execute(q); } catch (e) { /* ignore if exists */ }
    }

    // Check if user already exists (using empId as username)
    const [existing] = await conn.execute('SELECT username FROM admin_users WHERE username = ? OR emp_id = ?', [empId.trim(), empId.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ status: 'error', message: 'User or Emp ID already exists.' });
    }

    // Insert new user
    // We map empId -> username (for login) and userName -> name
    await conn.execute(
      `INSERT INTO admin_users 
        (username, password, name, utype, status, emp_id, owner, alt_mobile, mobile, email, profile_img) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        empId.trim(),          // username
        password,              // password
        userName.trim(),       // name
        userType || '9',       // utype (default 9)
        status || '1',         // status (default 1)
        empId.trim(),          // emp_id
        owner || null,         // owner
        altMobile || null,     // alt_mobile
        mobileNo || null,      // mobile
        emailId || null,       // email
        profileImg             // profile_img
      ]
    );

    // Give default tab access for new users
    const defaultTabs = ['1', '2', '3', '4'];
    for (const tab of defaultTabs) {
      try {
        await conn.execute('INSERT INTO access_action_tab (userid, actabid, status) VALUES (?, ?, ?)', [empId.trim(), tab, '1']);
      } catch (e) {
        // Ignore duplicate key errors if tab already granted
      }
    }

    return res.json({ status: 'success', message: 'User created successfully!' });
  } catch (err) {
    console.error('Create User Error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  } finally {
    conn.release();
  }
};

module.exports = { createUser };
