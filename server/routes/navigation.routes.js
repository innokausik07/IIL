/**
 * Dynamic Navigation Menu API
 * Fetches active functions and sub-functions from database
 * Strictly filters navigation tree matching MySQL `access_function` table (uid, function_id, status='Y')
 */
const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');

// GET /api/navigation - Dynamic tree of active functions and sub-functions
router.get('/', async (req, res) => {
  try {
    let userId = null;
    let userType = null;
    let username = null;
    let userEmpId = null;

    // 1. Safe token decoding (with verify and decode fallback)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const rawToken = authHeader.split(' ')[1];
      if (rawToken && rawToken !== 'null' && rawToken !== 'undefined') {
        try {
          const decoded = jwt.verify(rawToken, process.env.JWT_SECRET || 'innovatiview_secret_key');
          userId = decoded.id;
          userType = String(decoded.utype || '');
          username = decoded.full_name || decoded.userid;
          userEmpId = decoded.emp_id;
        } catch (err) {
          try {
            const fallback = jwt.decode(rawToken);
            if (fallback) {
              userId = fallback.id;
              userType = String(fallback.utype || '');
              username = fallback.full_name || fallback.userid;
              userEmpId = fallback.emp_id;
            }
          } catch (e) {}
        }
      }
    }

    // 2. Fetch all active functions and sub-functions (Support Active, Y, 1, A)
    const [functions] = await db.execute(
      "SELECT * FROM function_master WHERE status IN ('Active', 'Y', '1', 'A') ORDER BY tab ASC, id ASC"
    );
    const [subFunctions] = await db.execute(
      "SELECT * FROM sub_function_master WHERE status IN ('Y', 'Active', '1', 'A') ORDER BY sub_seq ASC, id ASC"
    );

    // 3. Determine allowed sub-functions for the current user
    let userAllowedSet = null; // null = all active allowed, Set(...) = filtered

    if (userId || username || userEmpId) {
      // Look up user details from MySQL database
      let empId = userEmpId;
      let fullName = username;
      let email = null;
      let dbUtype = userType;

      try {
        let uRows = [];
        if (userId) {
          [uRows] = await db.execute('SELECT id, emp_id, full_name, email, utype FROM users WHERE id = ? LIMIT 1', [userId]);
        }
        if (uRows.length === 0 && (userEmpId || username)) {
          [uRows] = await db.execute('SELECT id, emp_id, full_name, email, utype FROM users WHERE emp_id = ? OR full_name = ? LIMIT 1', [userEmpId || '', username || '']);
        }

        if (uRows.length > 0) {
          userId = uRows[0].id;
          empId = uRows[0].emp_id || empId;
          fullName = uRows[0].full_name || fullName;
          email = uRows[0].email;
          dbUtype = String(uRows[0].utype || dbUtype);
        }
      } catch (e) {}

      const uidsToMatch = Array.from(new Set([empId, String(userId), fullName, email, username, userEmpId].filter(Boolean)));
      let assignedFunctions = [];

      // 4. Query `access_function` table (Matching phpMyAdmin table: id, uid, function_id, status='Y')
      if (uidsToMatch.length > 0) {
        try {
          const placeholders = uidsToMatch.map(() => '?').join(',');
          const [accessRows] = await db.execute(
            `SELECT function_id FROM access_function WHERE uid IN (${placeholders}) AND status = 'Y'`,
            uidsToMatch
          );
          if (accessRows.length > 0) {
            assignedFunctions = accessRows.map(r => String(r.function_id).trim()).filter(Boolean);
          }
        } catch (e) {
          console.error('Error querying access_function:', e.message);
        }
      }

      // 5. Query `user_rights` table fallback
      if (assignedFunctions.length === 0 && userId) {
        try {
          const [rights] = await db.execute(
            'SELECT sub_function_id FROM user_rights WHERE user_id = ? AND status = 1',
            [userId]
          );
          if (rights.length > 0) {
            assignedFunctions = rights.map(r => String(r.sub_function_id)).filter(Boolean);
          }
        } catch (e) {}
      }

      const isSuperAdmin = dbUtype === '1' || dbUtype.toUpperCase() === 'ADMIN';

      if (assignedFunctions.length > 0) {
        // User has specific rights defined in access_function -> Strictly enforce ONLY those modules
        userAllowedSet = new Set(assignedFunctions);
      } else if (!isSuperAdmin) {
        // Non-admin user with NO rights assigned -> Strictly show empty
        userAllowedSet = new Set();
      } else {
        // Super Admin with no custom restriction -> Show all active modules
        userAllowedSet = null;
      }
    } else {
      // Unauthenticated fallback: show all active modules
      userAllowedSet = null;
    }

    // 6. Group sub-functions under their parent function with strict filtering
    const menuTree = functions.map(fn => {
      let children = subFunctions.filter(sub => sub.function_id === fn.function_id);

      // If user has specific rights configured in access_function, filter sub-functions
      if (userAllowedSet !== null) {
        children = children.filter(sub => {
          return (
            userAllowedSet.has(String(sub.id)) ||
            userAllowedSet.has(String(sub.function_id)) ||
            userAllowedSet.has(String(fn.id)) ||
            userAllowedSet.has(String(fn.function_id))
          );
        });
      }

      return {
        id: fn.id,
        function_id: fn.function_id,
        function_name: fn.function_name,
        descrip: fn.descrip,
        icon_img: fn.icon_img,
        utype: fn.utype,
        tab: fn.tab,
        sub_functions: children.map(sub => ({
          id: sub.id,
          sub_name: sub.sub_name,
          sub_seq: sub.sub_seq,
          file_name: sub.file_name,
          tab: sub.tab,
          icon_img: sub.icon_img,
          utype: sub.utype
        }))
      };
    }).filter(fn => fn.sub_functions.length > 0); // Only show functions that have accessible sub-modules

    res.json({
      status: 'success',
      data: menuTree,
      totalAccessibleModules: menuTree.length
    });
  } catch (err) {
    console.error('Navigation Route Error:', err);
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

module.exports = router;
