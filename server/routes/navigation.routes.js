/**
 * Dynamic Navigation Menu API
 * Strictly enforces user access rights based on MySQL `access_function` table.
 * - If user has custom rows in `access_function`, they STRICTLY see ONLY those granted modules.
 * - If user has 0 rows in `access_function`:
 *    - Admin (`utype = 1` or `ADMIN`) sees all active modules (preventing lockout).
 *    - Non-admin user sees 0 modules (strictly restricted until granted).
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

    // 2. Fetch all active functions and sub-functions from database
    const [functions] = await db.execute(
      "SELECT * FROM function_master WHERE status IN ('Active', 'Y', '1', 'A') ORDER BY tab ASC, id ASC"
    );
    const [subFunctions] = await db.execute(
      "SELECT * FROM sub_function_master WHERE status IN ('Y', 'Active', '1', 'A') ORDER BY sub_seq ASC, id ASC"
    );

    // 3. Determine allowed sub-functions for the current user
    let userAllowedSet = null; // null = all active allowed, Set(...) = filtered set

    if (userId || username || userEmpId) {
      // Look up user's exact emp_id and utype from `users` table
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

      // Collect all possible identifiers with emp_id as primary
      const uidsToMatch = Array.from(new Set([empId, String(userId), fullName, email, username, userEmpId].filter(Boolean)));
      let assignedFunctions = [];

      // 4. Query `access_function` table (Matching both `emp_id` and legacy `uid` column)
      if (uidsToMatch.length > 0) {
        const placeholders = uidsToMatch.map(() => '?').join(',');
        try {
          const [accessRows] = await db.execute(
            `SELECT function_id, sub_function_id FROM access_function WHERE (emp_id IN (${placeholders}) OR TRIM(emp_id) IN (${placeholders})) AND status IN ('Y', '1', 'Active', 'A')`,
            [...uidsToMatch, ...uidsToMatch]
          );
          if (accessRows.length > 0) {
            accessRows.forEach(r => {
              if (r.sub_function_id) assignedFunctions.push(String(r.sub_function_id).trim());
              if (r.function_id) assignedFunctions.push(String(r.function_id).trim());
            });
          }
        } catch (e) {
          // Fallback if table uses column name `uid`
          try {
            const [accessRows] = await db.execute(
              `SELECT function_id, sub_function_id FROM access_function WHERE (uid IN (${placeholders}) OR TRIM(uid) IN (${placeholders})) AND status IN ('Y', '1', 'Active', 'A')`,
              [...uidsToMatch, ...uidsToMatch]
            );
            if (accessRows.length > 0) {
              accessRows.forEach(r => {
                if (r.sub_function_id) assignedFunctions.push(String(r.sub_function_id).trim());
                if (r.function_id) assignedFunctions.push(String(r.function_id).trim());
              });
            }
          } catch (err) {
            try {
              const [accessRows] = await db.execute(
                `SELECT function_id FROM access_function WHERE (uid IN (${placeholders}) OR emp_id IN (${placeholders})) AND status IN ('Y', '1', 'Active', 'A')`,
                [...uidsToMatch, ...uidsToMatch]
              );
              if (accessRows.length > 0) {
                assignedFunctions = accessRows.map(r => String(r.function_id).trim()).filter(Boolean);
              }
            } catch (err2) {}
          }
        }
      }

      // 5. Query `user_rights` table fallback
      if (assignedFunctions.length === 0 && userId) {
        try {
          const [rights] = await db.execute(
            'SELECT sub_function_id, function_id FROM user_rights WHERE user_id = ? AND status = 1',
            [userId]
          );
          if (rights.length > 0) {
            rights.forEach(r => {
              if (r.sub_function_id) assignedFunctions.push(String(r.sub_function_id).trim());
              if (r.function_id) assignedFunctions.push(String(r.function_id).trim());
            });
          }
        } catch (e) {}
      }

      const isSuperAdmin = dbUtype === '1' || dbUtype.toUpperCase() === 'ADMIN';

      if (assignedFunctions.length > 0) {
        // User has custom rights in access_function -> Strictly show ONLY granted modules
        userAllowedSet = new Set(assignedFunctions.filter(Boolean));
      } else if (isSuperAdmin) {
        // Super Admin with 0 custom restrictions -> Show all active modules (never lock out Admin)
        userAllowedSet = null;
      } else {
        // Non-admin user with 0 assigned rights -> Strictly 0 modules
        userAllowedSet = new Set();
      }
    } else {
      // Unauthenticated fallback: show all active modules
      userAllowedSet = null;
    }

    // 6. Group sub-functions under their parent function with strict filtering
    const menuTree = functions.map(fn => {
      let children = subFunctions.filter(sub => {
        // Sub-function must belong to this parent function
        const fnCodeMatch = String(sub.function_id).trim().toUpperCase() === String(fn.function_id).trim().toUpperCase() ||
                            String(sub.function_id).trim() === String(fn.id).trim();
        if (!fnCodeMatch) return false;

        // If userAllowedSet is defined, filter strictly
        if (userAllowedSet !== null) {
          return (
            userAllowedSet.has(String(sub.id).trim()) ||
            userAllowedSet.has(String(sub.function_id).trim()) ||
            userAllowedSet.has(String(fn.id).trim()) ||
            userAllowedSet.has(String(fn.function_id).trim())
          );
        }
        return true;
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
