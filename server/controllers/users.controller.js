const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Ensure uploads/profiles directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Auto-add profile_img column to users table if missing
(async () => {
  try {
    const [cols] = await db.execute("SHOW COLUMNS FROM users LIKE 'profile_img'");
    if (cols.length === 0) {
      await db.execute("ALTER TABLE users ADD COLUMN profile_img VARCHAR(255) NULL AFTER alt_mobile");
      console.log('Added profile_img column to users table.');
    }
  } catch (err) {
    // Ignore if table doesn't exist yet or column exists
  }
})();

// Helper to save base64 image to disk
const saveProfileImage = (base64Str) => {
  if (!base64Str || typeof base64Str !== 'string') return null;
  if (!base64Str.startsWith('data:image')) {
    // Already a saved URL or path
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
      message: 'User created successfully with profile image!',
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

module.exports = { getUsers, createUser, updateUser, deleteUser };
