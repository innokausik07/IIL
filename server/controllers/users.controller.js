const db = require('../config/db');

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

    const profileImg = null; // Image upload coming soon

    if (!userName || !password) {
      return res.status(400).json({ status: 'error', message: 'User Name and Password are required.' });
    }

    // Safely add missing columns to the `users` table if they don't exist yet
    const columnsToAdd = {
      emp_id:      "VARCHAR(100) DEFAULT NULL",
      utype:       "VARCHAR(10) DEFAULT '9'",
      owner:       "VARCHAR(100) DEFAULT NULL",
      alt_mobile:  "VARCHAR(50) DEFAULT NULL",
      mobile:      "VARCHAR(50) DEFAULT NULL",
      status:      "VARCHAR(5) DEFAULT '1'",
      profile_img: "VARCHAR(255) DEFAULT NULL"
    };

    for (const [colName, colType] of Object.entries(columnsToAdd)) {
      const [cols] = await conn.execute(`SHOW COLUMNS FROM users LIKE ?`, [colName]);
      if (cols.length === 0) {
        try {
          await conn.execute(`ALTER TABLE users ADD COLUMN ${colName} ${colType}`);
        } catch (e) {
          console.error(`Failed to add column ${colName}:`, e.message);
        }
      }
    }

    // Check if user already exists by email or emp_id
    let existingCheck = 'SELECT id FROM users WHERE full_name = ?';
    const checkParams = [userName.trim()];
    if (emailId) {
      existingCheck += ' OR email = ?';
      checkParams.push(emailId.trim());
    }
    const [existing] = await conn.execute(existingCheck, checkParams);
    if (existing.length > 0) {
      return res.status(400).json({ status: 'error', message: 'A user with this name or email already exists.' });
    }

    // Insert new user into the `users` table
    await conn.execute(
      `INSERT INTO users 
        (full_name, email, password, emp_id, utype, owner, alt_mobile, mobile, status, profile_img) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userName.trim(),       // full_name
        emailId || null,       // email
        password,              // password
        empId || null,         // emp_id
        userType || '9',       // utype
        owner || null,         // owner
        altMobile || null,     // alt_mobile
        mobileNo || null,      // mobile
        status || '1',         // status
        profileImg || null     // profile_img
      ]
    );

    return res.json({ status: 'success', message: 'User created successfully!' });
  } catch (err) {
    console.error('Create User Error:', err.code, err.message);
    return res.status(500).json({ status: 'error', message: 'DB Error: ' + err.message });
  } finally {
    conn.release();
  }
};

module.exports = { createUser };
