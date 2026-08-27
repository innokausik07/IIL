const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Ensure uploads/profiles directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Auto-create access_function and user_rights tables if missing
(async () => {
  try {
    const [cols] = await db.execute("SHOW COLUMNS FROM users LIKE 'profile_img'");
    if (cols.length === 0) {
      await db.execute("ALTER TABLE users ADD COLUMN profile_img VARCHAR(255) NULL AFTER alt_mobile");
      console.log('Added profile_img column to users table.');
    }
  } catch (err) {}

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS access_function (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(100) NOT NULL,
        function_id VARCHAR(50) NOT NULL,
        status VARCHAR(10) DEFAULT 'Y',
        INDEX idx_uid (uid),
        INDEX idx_fn (function_id)
      )
    `);
    console.log('access_function table verified/created.');
  } catch (err) {}

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_rights (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        sub_function_id INT NOT NULL,
        function_id VARCHAR(50) DEFAULT NULL,
        status TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_sub (user_id, sub_function_id)
      )
    `);
  } catch (err) {}
})();

// Helper to save base64 image to disk
const saveProfileImage = (base64Str) => {
  if (!base64Str || typeof base64Str !== 'string') return null;
  if (!base64Str.startsWith('data:image')) {
    return base64Str;
  }

  try {
    const matches = base64Str.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    let ext = matches[1];
    if (ext === 'jpeg') ext = 'jpg';
    const base64Data = matches[2];
    const fileName = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    return `/uploads/profiles/${fileName}`;
  } catch (e) {
    console.error('Error saving profile image:', e);
    return null;
  }
};

// GET /api/users - List all users
const getUsers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, emp_id, full_name, email, utype, owner, mobile, alt_mobile, profile_img, status, created_at 
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
    const { userType, owner, empId, password, userName, altMobile, mobileNo, emailId, status, profileImg } = req.body;

    if (!userName || !password) {
      return res.status(400).json({ status: 'error', message: 'User Name and Password are required.' });
    }

    const savedImgPath = saveProfileImage(profileImg);

    const [result] = await db.execute(
      `INSERT INTO users (full_name, email, password, emp_id, utype, owner, mobile, alt_mobile, profile_img, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userName     || '',
        emailId      || '',
        password,
        empId        || '',
        userType     || '9',
        owner        || '',
        mobileNo     || '',
        altMobile    || '',
        savedImgPath || null,
        status       || '1'
      ]
    );

    return res.json({
      status: 'success',
      message: 'User created successfully!',
      id: result.insertId,
      profileImg: savedImgPath
    });
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
    const { userType, owner, empId, password, userName, altMobile, mobileNo, emailId, status, profileImg } = req.body;

    if (!userName) {
      return res.status(400).json({ status: 'error', message: 'User Name is required.' });
    }

    const savedImgPath = saveProfileImage(profileImg);

    if (password && password.trim() !== '') {
      if (savedImgPath !== undefined) {
        await db.execute(
          `UPDATE users SET full_name = ?, email = ?, password = ?, emp_id = ?, utype = ?, owner = ?, mobile = ?, alt_mobile = ?, profile_img = ?, status = ? WHERE id = ?`,
          [userName, emailId || '', password, empId || '', userType || '9', owner || '', mobileNo || '', altMobile || '', savedImgPath || null, status || '1', id]
        );
      } else {
        await db.execute(
          `UPDATE users SET full_name = ?, email = ?, password = ?, emp_id = ?, utype = ?, owner = ?, mobile = ?, alt_mobile = ?, status = ? WHERE id = ?`,
          [userName, emailId || '', password, empId || '', userType || '9', owner || '', mobileNo || '', altMobile || '', status || '1', id]
        );
      }
    } else {
      if (savedImgPath !== undefined) {
        await db.execute(
          `UPDATE users SET full_name = ?, email = ?, emp_id = ?, utype = ?, owner = ?, mobile = ?, alt_mobile = ?, profile_img = ?, status = ? WHERE id = ?`,
          [userName, emailId || '', empId || '', userType || '9', owner || '', mobileNo || '', altMobile || '', savedImgPath || null, status || '1', id]
        );
      } else {
        await db.execute(
          `UPDATE users SET full_name = ?, email = ?, emp_id = ?, utype = ?, owner = ?, mobile = ?, alt_mobile = ?, status = ? WHERE id = ?`,
          [userName, emailId || '', empId || '', userType || '9', owner || '', mobileNo || '', altMobile || '', status || '1', id]
        );
      }
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

// GET /api/users/:id/rights - Fetch user module & submodule access rights from access_function table
const getUserRights = async (req, res) => {
  try {
    const { id } = req.params;

    // Get user info
    const [users] = await db.execute('SELECT id, full_name, email, emp_id, utype FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    const user = users[0];
    const userUid = user.emp_id || user.full_name || String(user.id);

    // Fetch all functions and sub-functions
    const [functions] = await db.execute(
      "SELECT id, function_id, function_name, descrip, tab FROM function_master WHERE status = 'Active' ORDER BY tab ASC, id ASC"
    );
    const [subFunctions] = await db.execute(
      "SELECT id, function_id, sub_name, sub_seq, file_name, tab, utype FROM sub_function_master WHERE status = 'Y' ORDER BY sub_seq ASC, id ASC"
    );

    // Fetch currently granted rights from access_function table
    let assignedIds = [];
    try {
      const [rights] = await db.execute(
        "SELECT function_id, sub_function_id FROM access_function WHERE (uid = ? OR uid = ? OR uid = ?) AND status = 'Y'",
        [userUid, String(user.id), user.full_name]
      );
      assignedIds = rights.map(r => parseInt(r.sub_function_id || r.function_id)).filter(Boolean);
    } catch (e) {
      // Fallback query if sub_function_id column is not yet present
      try {
        const [rightsOld] = await db.execute(
          "SELECT function_id FROM access_function WHERE (uid = ? OR uid = ? OR uid = ?) AND status = 'Y'",
          [userUid, String(user.id), user.full_name]
        );
        assignedIds = rightsOld.map(r => parseInt(r.function_id)).filter(Boolean);
      } catch (err) {}
    }

    // Fallback to user_rights table if access_function is empty
    if (assignedIds.length === 0) {
      try {
        const [ur] = await db.execute(
          'SELECT sub_function_id FROM user_rights WHERE user_id = ? AND status = 1',
          [id]
        );
        assignedIds = ur.map(r => r.sub_function_id);
      } catch (e) {}
    }

    return res.json({
      status: 'success',
      data: {
        user,
        functions,
        subFunctions,
        assignedIds
      }
    });
  } catch (err) {
    console.error('Get User Rights Error:', err);
    return res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
};

// POST /api/users/:id/rights - Save user module & submodule access rights in access_function table
const updateUserRights = async (req, res) => {
  try {
    const { id } = req.params;
    const { subFunctionIds } = req.body; // Array of sub_function_master IDs

    if (!Array.isArray(subFunctionIds)) {
      return res.status(400).json({ status: 'error', message: 'subFunctionIds must be an array' });
    }

    const [users] = await db.execute('SELECT id, full_name, email, emp_id, utype FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    const user = users[0];
    const uids = Array.from(new Set([user.emp_id, String(user.id), user.full_name].filter(Boolean)));

    // Auto-ensure sub_function_id column exists in access_function table
    try {
      await db.execute("ALTER TABLE `access_function` ADD COLUMN `sub_function_id` VARCHAR(50) NULL AFTER `function_id`");
    } catch (e) {}

    // Map sub-functions to their parent function_id
    const subMap = {};
    if (subFunctionIds.length > 0) {
      const placeholders = subFunctionIds.map(() => '?').join(',');
      const [subs] = await db.execute(
        `SELECT id, function_id FROM sub_function_master WHERE id IN (${placeholders})`,
        subFunctionIds
      );
      subs.forEach(s => { subMap[s.id] = s.function_id; });
    }

    // 1. Delete existing rights from `access_function` table for all aliases of this user
    for (const u of uids) {
      try {
        await db.execute('DELETE FROM access_function WHERE uid = ?', [u]);
      } catch (e) {}
    }

    // 2. Insert into `access_function` table with both parent `function_id` and child `sub_function_id`
    for (const subId of subFunctionIds) {
      const parentFnId = subMap[subId] || '';
      for (const u of uids) {
        try {
          await db.execute(
            "INSERT INTO access_function (uid, function_id, sub_function_id, status) VALUES (?, ?, ?, 'Y')",
            [u, String(parentFnId), String(subId)]
          );
        } catch (err) {
          // Fallback if schema does not accept sub_function_id
          try {
            await db.execute(
              "INSERT INTO access_function (uid, function_id, status) VALUES (?, ?, 'Y')",
              [u, String(subId)]
            );
          } catch (e) {}
        }
      }
    }

    // 3. Also sync into `user_rights` table
    try {
      await db.execute('DELETE FROM user_rights WHERE user_id = ?', [id]);
      for (const subId of subFunctionIds) {
        const fnId = subMap[subId] || null;
        await db.execute(
          'INSERT INTO user_rights (user_id, sub_function_id, function_id, status) VALUES (?, ?, ?, 1)',
          [id, subId, fnId]
        );
      }
    } catch (e) {}

    return res.json({
      status: 'success',
      message: `User access rights saved in access_function table (${subFunctionIds.length} modules granted)!`,
      assignedCount: subFunctionIds.length
    });
  } catch (err) {
    console.error('Update User Rights Error:', err);
    return res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserRights,
  updateUserRights
};
