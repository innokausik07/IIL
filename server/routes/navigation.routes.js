/**
 * Dynamic Navigation Menu API
 * 100% Strictly driven by MySQL `access_function` table for ALL users.
 * - If user has NO records in `access_function`, 0 modules are shown in sidebar.
 * - If user has records in `access_function`, ONLY those exact granted sub-modules are shown.
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

    // 3. Strict allowed set: Exclusively populated from `access_function` table (Default: 0 modules)
    let userAllowedSet = new Set();

    if (userId || username || userEmpId) {
      // Look up user's exact emp_id from `users` table
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

      const targetEmpId = empId || userEmpId || String(userId);
      let assignedFunctions = [];

      // 4. Query `access_function` table strictly by emp_id
      if (targetEmpId) {
        try {
          const [accessRows] = await db.execute(
            "SELECT function_id, sub_function_id FROM access_function WHERE (emp_id = ? OR uid = ?) AND status IN ('Y', '1', 'Active', 'A')",
            [targetEmpId, targetEmpId]
          );
          if (accessRows.length > 0) {
            accessRows.forEach(r => {
              if (r.sub_function_id) assignedFunctions.push(String(r.sub_function_id).trim());
              if (r.function_id) assignedFunctions.push(String(r.function_id).trim());
            });
          }
        } catch (e) {
          try {
            const [accessRows] = await db.execute(
              "SELECT function_id FROM access_function WHERE (emp_id = ? OR uid = ?) AND status IN ('Y', '1', 'Active', 'A')",
              [targetEmpId, targetEmpId]
            );
            if (accessRows.length > 0) {
              assignedFunctions = accessRows.map(r => String(r.function_id).trim()).filter(Boolean);
            }
          } catch (err) {}
        }
      }

      // Populate userAllowedSet 100% from access_function table
      userAllowedSet = new Set(assignedFunctions.filter(Boolean));
    }

    // 5. Group sub-functions under their parent function with 100% strict filtering
    const menuTree = functions.map(fn => {
      let children = subFunctions.filter(sub => {
        // Sub-function must belong to this parent function
        const fnCodeMatch = String(sub.function_id).trim().toUpperCase() === String(fn.function_id).trim().toUpperCase() ||
                            String(sub.function_id).trim() === String(fn.id).trim();
        if (!fnCodeMatch) return false;

        // Sub-function must be explicitly present in access_function table
        return (
          userAllowedSet.has(String(sub.id).trim()) ||
          userAllowedSet.has(String(sub.function_id).trim())
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
    }).filter(fn => fn.sub_functions.length > 0); // Only show functions that have granted sub-modules

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
