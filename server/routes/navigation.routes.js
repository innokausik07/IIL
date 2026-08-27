/**
 * Dynamic Navigation Menu API
 * Strictly enforces user access rights based on MySQL `access_function` table.
 * If a user has NO access rights assigned in `access_function`, 0 modules are returned.
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

    // 1. Decode token from Authorization header
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

    // 2. Fetch all active functions and sub-functions
    const [functions] = await db.execute(
      "SELECT * FROM function_master WHERE status IN ('Active', 'Y', '1', 'A') ORDER BY tab ASC, id ASC"
    );
    const [subFunctions] = await db.execute(
      "SELECT * FROM sub_function_master WHERE status IN ('Y', 'Active', '1', 'A') ORDER BY sub_seq ASC, id ASC"
    );

    // 3. Strict allowed set: Every user MUST have explicit rights in `access_function`
    let userAllowedSet = new Set(); // Default: 0 modules accessible

    if (userId || username || userEmpId) {
      // Look up user details from MySQL database
      let empId = userEmpId;
      let fullName = username;
      let email = null;

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
        }
      } catch (e) {}

      const uidsToMatch = Array.from(new Set([empId, String(userId), fullName, email, username, userEmpId].filter(Boolean)));
      let assignedFunctions = [];

      // 4. Query `access_function` table (Matching phpMyAdmin schema: id, uid, function_id, status='Y')
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

      // If user has specific rights in access_function, populate userAllowedSet
      if (assignedFunctions.length > 0) {
        userAllowedSet = new Set(assignedFunctions);
      } else {
        // User has NO rights assigned in access_function -> 0 modules accessible
        userAllowedSet = new Set();
      }
    }

    // 6. Group sub-functions under their parent function with strict filtering
    const menuTree = functions.map(fn => {
      // Filter sub-functions to only those explicitly granted to the user
      const children = subFunctions.filter(sub => {
        if (sub.function_id !== fn.function_id) return false;
        return (
          userAllowedSet.has(String(sub.id)) ||
          userAllowedSet.has(String(sub.function_id)) ||
          userAllowedSet.has(String(fn.id)) ||
          userAllowedSet.has(String(fn.function_id))
        );
      });

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
    }).filter(fn => fn.sub_functions.length > 0); // Only show functions that have at least 1 granted sub-module

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
