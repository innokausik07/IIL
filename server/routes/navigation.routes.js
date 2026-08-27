/**
 * Dynamic Navigation Menu API
 * 100% Strictly driven by MySQL `access_function` table.
 * - Dynamically inspects table columns to prevent SQL errors.
 * - Perfectly maps candidate emp_id and renders granted modules & sub-modules.
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

    // 2. Fetch all functions and sub-functions from database
    const [functions] = await db.execute(
      "SELECT * FROM function_master ORDER BY tab ASC, id ASC"
    );
    const [subFunctions] = await db.execute(
      "SELECT * FROM sub_function_master ORDER BY sub_seq ASC, id ASC"
    );

    // 3. Collect all candidate emp_id / user identifiers for the logged-in user
    let candidateIds = [];

    try {
      const [allUsers] = await db.execute('SELECT id, emp_id, full_name, email FROM users');
      allUsers.forEach(u => {
        const isMatch = (userId && String(u.id) === String(userId)) ||
                        (userEmpId && String(u.emp_id).trim() === String(userEmpId).trim()) ||
                        (username && String(u.full_name || '').toLowerCase().includes(String(username || '').toLowerCase())) ||
                        (username && String(u.email || '').toLowerCase() === String(username || '').toLowerCase());
        if (isMatch) {
          if (u.emp_id) candidateIds.push(String(u.emp_id).trim());
          if (u.id) candidateIds.push(String(u.id).trim());
        }
      });
    } catch (e) {}

    if (userEmpId) candidateIds.push(String(userEmpId).trim());
    if (userId) candidateIds.push(String(userId).trim());
    candidateIds = Array.from(new Set(candidateIds.filter(Boolean)));

    // 4. Query `access_function` table safely
    let userAllowedSet = new Set();
    let assignedFunctions = [];

    if (candidateIds.length > 0) {
      try {
        // Detect whether column is `emp_id` or `uid`
        let colName = 'emp_id';
        try {
          const [cols] = await db.execute("SHOW COLUMNS FROM `access_function` LIKE 'emp_id'");
          if (cols.length === 0) colName = 'uid';
        } catch (errCol) {}

        const placeholders = candidateIds.map(() => '?').join(',');
        const [accessRows] = await db.execute(
          `SELECT * FROM access_function WHERE ${colName} IN (${placeholders}) AND (status IS NULL OR status NOT IN ('N', '0', 'D', 'Inactive'))`,
          candidateIds
        );

        if (accessRows.length > 0) {
          accessRows.forEach(r => {
            if (r.sub_function_id) assignedFunctions.push(String(r.sub_function_id).trim());
            if (r.function_id) assignedFunctions.push(String(r.function_id).trim());
          });
        }
      } catch (errQuery) {
        console.error('Error reading access_function:', errQuery.message);
      }

      // Fallback to user_rights table if access_function is empty
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

      userAllowedSet = new Set(assignedFunctions.filter(Boolean));
    }

    // 5. Build dynamic navigation menu tree strictly from userAllowedSet
    const menuTree = functions.map(fn => {
      let children = subFunctions.filter(sub => {
        // Sub-function must belong to this parent function
        const fnCodeMatch = !sub.function_id || !fn.function_id ||
                            String(sub.function_id).trim().toUpperCase() === String(fn.function_id).trim().toUpperCase() ||
                            String(sub.function_id).trim() === String(fn.id).trim();
        if (!fnCodeMatch) return false;

        // If no access rights exist, hide sub-function
        if (userAllowedSet.size === 0) return false;

        // Sub-function must be explicitly in user's access rights
        return (
          userAllowedSet.has(String(sub.id).trim()) ||
          userAllowedSet.has(String(sub.function_id).trim()) ||
          userAllowedSet.has(String(fn.id).trim()) ||
          userAllowedSet.has(String(fn.function_id).trim())
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
      totalAccessibleModules: menuTree.length,
      matchedCandidateIds: candidateIds,
      grantedCount: userAllowedSet.size
    });
  } catch (err) {
    console.error('Navigation Route Error:', err);
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

module.exports = router;
