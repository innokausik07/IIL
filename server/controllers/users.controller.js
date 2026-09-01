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

    // Fetch currently granted rights from access_function table strictly for this emp_id
    const targetEmpId = user.emp_id || String(user.id);
    let assignedIds = [];
    try {
      const [rights] = await db.execute(
        "SELECT function_id, sub_function_id FROM access_function WHERE (emp_id = ? OR uid = ?) AND status IN ('Y', '1', 'Active', 'A')",
        [targetEmpId, targetEmpId]
      );
      assignedIds = rights.map(r => parseInt(r.sub_function_id || r.function_id)).filter(Boolean);
    } catch (e) {}

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

// POST /api/users/:id/rights - Save user module & submodule access rights in access_function table strictly by emp_id
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
    const targetEmpId = user.emp_id || String(user.id);

    // Auto-rename uid to emp_id and add sub_function_id if needed
    try {
      await db.execute("ALTER TABLE `access_function` CHANGE COLUMN `uid` `emp_id` VARCHAR(100) NULL");
    } catch (e) {}
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

    // 1. Delete existing rights strictly for this user's emp_id
    try {
      await db.execute('DELETE FROM access_function WHERE emp_id = ?', [targetEmpId]);
    } catch (e) {
      try {
        await db.execute('DELETE FROM access_function WHERE uid = ?', [targetEmpId]);
      } catch (err) {}
    }

    // 2. Insert ONLY 1 row per sub_function_id strictly with emp_id
    for (const subId of subFunctionIds) {
      const parentFnId = subMap[subId] || '';
      try {
        await db.execute(
          "INSERT INTO access_function (emp_id, function_id, sub_function_id, status) VALUES (?, ?, ?, 'Y')",
          [targetEmpId, String(parentFnId), String(subId)]
        );
      } catch (err) {
        try {
          await db.execute(
            "INSERT INTO access_function (uid, function_id, sub_function_id, status) VALUES (?, ?, ?, 'Y')",
            [targetEmpId, String(parentFnId), String(subId)]
          );
        } catch (e) {
          try {
            await db.execute(
              "INSERT INTO access_function (emp_id, function_id, status) VALUES (?, ?, 'Y')",
              [targetEmpId, String(subId)]
            );
          } catch (e2) {}
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
      message: `User access rights saved in access_function table (${subFunctionIds.length} modules granted for emp_id ${targetEmpId})!`,
      assignedCount: subFunctionIds.length
    });
  } catch (err) {
    console.error('Update User Rights Error:', err);
    return res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
};

// ── User-Type (utype) Default Rights Management ───────────────────────────────

// Built-in smart templates for standard corporate user types
const SMART_PRESETS = {
  ADMIN: {
    name: 'Super Admin (Full Access)',
    keywords: ['admin', 'super', 'director', 'ceo'],
    description: 'Full access to all 11 modules and 41 sub-modules'
  },
  TECHNICIAN: {
    name: 'Technician / Service Engineer',
    keywords: ['tech', 'repair', 'engineer', 'service', 'asp'],
    description: 'Service Breakdown Tickets, Physical Fleet Assets, and Query Tickets',
    subNames: ['Service Tickets', 'Asset Master', 'Support & Query Tickets', 'Customer Service Desk', 'Repair & Breakdown Tickets']
  },
  SALES: {
    name: 'Sales & CRM Executive',
    keywords: ['sale', 'crm', 'marketing', 'bd', 'executive'],
    description: 'Leads, Quotations, RFPs, Client Master, Rental Plans & Rental Orders',
    subNames: ['Lead Management', 'Quotation Management', 'RFP / Tender Management', 'Client Master', 'Rental Orders', 'New Rental Order', 'Rental Plans & Pricing', 'Sales Pipeline & Leads']
  },
  FINANCE: {
    name: 'Finance & Accounts Manager',
    keywords: ['finance', 'account', 'bill', 'audit', 'tax'],
    description: 'Invoice Management, Payment Tracker, Executive Analytics, and Client Master',
    subNames: ['Invoice Management', 'Invoice & Payment Tracker', 'Executive Analytics', 'Client Master', 'Tax / HSN Master']
  },
  WAREHOUSE: {
    name: 'Warehouse & Inventory Manager',
    keywords: ['warehouse', 'store', 'inventory', 'stock'],
    description: 'Physical Asset Master, Store Stock Sheet, GRN Inward Receipt, Delivery Challan, Return DC, and Product Catalog',
    subNames: ['Asset Master', 'Asset Master (Fleet)', 'Store Stock Sheet', 'GRN Inward Goods', 'GRN Inward Receipt', 'Delivery Challan (DC)', 'Return DC', 'Return Delivery Challan', 'Product / Item Master', 'Category Master', 'Sub-Category Master', 'BOM Master']
  },
  LOGISTICS: {
    name: 'Logistics & Dispatch Executive',
    keywords: ['logistic', 'dispatch', 'transport', 'courier', 'driver', 'delivery'],
    description: 'Freight Calculator, Delivery Challan, Return DC, Shipment Tracking, and Courier Rate Cards',
    subNames: ['Freight Calculator', 'Delivery Challan (DC)', 'GRN Inward Receipt', 'Return DC', 'Shipment Tracking', 'Courier Rate Cards', 'Courier Master']
  },
  AUDIT: {
    name: 'Operations & Exam Audit',
    keywords: ['audit', 'ops', 'cctv', 'exam', 'field'],
    description: 'CCTV Audit Sheet, Moved Data Sheet, Cross Audit, and Store Stock Sheet',
    subNames: ['CCTV Audit Sheet', 'Moved Data Sheet', 'Cross Audit Sheet', 'Store Stock Sheet']
  }
};

// GET /api/users/usertypes/rights/:utypeId
const getUserTypeRights = async (req, res) => {
  try {
    const { utypeId } = req.params;

    // Ensure usertype_rights table exists
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS usertype_rights (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          utype_id VARCHAR(50) NOT NULL,
          function_id VARCHAR(50) DEFAULT NULL,
          sub_function_id INT NOT NULL,
          status VARCHAR(5) DEFAULT '1',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_utype (utype_id)
        )
      `);
    } catch (e) {}

    // Get user type info
    const [types] = await db.execute('SELECT * FROM usertype_master WHERE id = ? OR utype = ?', [utypeId, utypeId]);
    const userType = types[0] || { id: utypeId, typename: `User Type ${utypeId}`, utype: utypeId };

    // Fetch all functions and sub-functions
    const [functions] = await db.execute(
      "SELECT id, function_id, function_name, descrip, tab FROM function_master WHERE status = 'Active' ORDER BY tab ASC, id ASC"
    );
    const [subFunctions] = await db.execute(
      "SELECT id, function_id, sub_name, sub_seq, file_name, tab, utype FROM sub_function_master WHERE status = 'Y' ORDER BY sub_seq ASC, id ASC"
    );

    // Fetch assigned rights from usertype_rights
    let [rights] = await db.execute(
      "SELECT sub_function_id FROM usertype_rights WHERE (utype_id = ? OR utype_id = ?) AND status = '1'",
      [String(utypeId), String(userType.utype || utypeId)]
    );
    let assignedIds = rights.map(r => parseInt(r.sub_function_id)).filter(Boolean);

    // If no rights saved yet, check if there is a smart matching preset
    if (assignedIds.length === 0) {
      const typeNameLower = (userType.typename || '').toLowerCase();
      for (const [key, preset] of Object.entries(SMART_PRESETS)) {
        if (preset.keywords.some(k => typeNameLower.includes(k))) {
          if (key === 'ADMIN') {
            assignedIds = subFunctions.map(s => s.id);
          } else if (preset.subNames) {
            assignedIds = subFunctions
              .filter(s => preset.subNames.some(sn => s.sub_name.toLowerCase().includes(sn.toLowerCase())))
              .map(s => s.id);
          }
          break;
        }
      }
    }

    return res.json({
      status: 'success',
      data: {
        userType,
        functions,
        subFunctions,
        assignedIds,
        smartPresets: Object.keys(SMART_PRESETS).map(k => ({
          key: k,
          name: SMART_PRESETS[k].name,
          description: SMART_PRESETS[k].description
        }))
      }
    });
  } catch (err) {
    console.error('Get User Type Rights Error:', err);
    return res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
};

// POST /api/users/usertypes/rights/:utypeId - Save default rights for this User Type
const saveUserTypeRights = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { utypeId } = req.params;
    const { subFunctionIds, syncToUsers = false } = req.body;

    if (!Array.isArray(subFunctionIds)) {
      return res.status(400).json({ status: 'error', message: 'subFunctionIds must be an array' });
    }

    // Get user type details
    const [types] = await conn.execute('SELECT * FROM usertype_master WHERE id = ? OR utype = ?', [utypeId, utypeId]);
    const utypeVal = types[0]?.utype || types[0]?.id || utypeId;

    // Delete existing records for this utype
    await conn.execute('DELETE FROM usertype_rights WHERE utype_id = ? OR utype_id = ?', [String(utypeId), String(utypeVal)]);

    // Map sub-functions to parent function_id
    const subMap = {};
    if (subFunctionIds.length > 0) {
      const placeholders = subFunctionIds.map(() => '?').join(',');
      const [subs] = await conn.execute(
        `SELECT id, function_id FROM sub_function_master WHERE id IN (${placeholders})`,
        subFunctionIds
      );
      subs.forEach(s => { subMap[s.id] = s.function_id; });

      // Insert new default rights
      for (const subId of subFunctionIds) {
        const fnId = subMap[subId] || null;
        await conn.execute(
          'INSERT INTO usertype_rights (utype_id, function_id, sub_function_id, status) VALUES (?, ?, ?, "1")',
          [String(utypeId), fnId, subId]
        );
      }
    }

    let syncedUsersCount = 0;
    // If syncToUsers is true, automatically update access_function for all users of this utype!
    if (syncToUsers) {
      const [users] = await conn.execute(
        'SELECT id, emp_id FROM users WHERE (utype = ? OR utype = ?) AND status = "1"',
        [String(utypeId), String(utypeVal)]
      );

      for (const u of users) {
        const targetEmpId = u.emp_id || String(u.id);
        await conn.execute('DELETE FROM access_function WHERE emp_id = ?', [targetEmpId]);
        
        for (const subId of subFunctionIds) {
          const fnId = subMap[subId] || '';
          await conn.execute(
            'INSERT INTO access_function (emp_id, function_id, sub_function_id, status) VALUES (?, ?, ?, "Y")',
            [targetEmpId, String(fnId), String(subId)]
          );
        }
        syncedUsersCount++;
      }
    }

    await conn.commit();
    return res.json({
      status: 'success',
      message: syncToUsers
        ? `Rights saved and automatically synced to all ${syncedUsersCount} active users of this User Type!`
        : `Default rights saved for User Type (${subFunctionIds.length} sub-modules selected)!`,
      syncedUsersCount
    });
  } catch (err) {
    await conn.rollback();
    console.error('Save User Type Rights Error:', err);
    return res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  } finally {
    conn.release();
  }
};

// GET /api/users/roles/smart-presets
const getSmartPresets = async (req, res) => {
  try {
    const [subFunctions] = await db.execute(
      "SELECT id, function_id, sub_name FROM sub_function_master WHERE status = 'Y'"
    );

    const presetsWithIds = {};
    for (const [key, preset] of Object.entries(SMART_PRESETS)) {
      if (key === 'ADMIN') {
        presetsWithIds[key] = {
          name: preset.name,
          description: preset.description,
          subFunctionIds: subFunctions.map(s => s.id)
        };
      } else {
        const matched = subFunctions.filter(s =>
          preset.subNames.some(sn => s.sub_name.toLowerCase().includes(sn.toLowerCase()))
        );
        presetsWithIds[key] = {
          name: preset.name,
          description: preset.description,
          subFunctionIds: matched.map(s => s.id)
        };
      }
    }

    return res.json({ status: 'success', data: presetsWithIds });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: e.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserRights,
  updateUserRights,
  getUserTypeRights,
  saveUserTypeRights,
  getSmartPresets
};

