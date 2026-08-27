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

    // Decode token if provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'innovatiview_secret_key');
        userId = decoded.id;
        userType = String(decoded.utype || '');
        username = decoded.full_name || decoded.userid;
        userEmpId = decoded.emp_id;
      } catch (e) {}
    }

    const [functions] = await db.execute(
      "SELECT * FROM function_master WHERE status = 'Active' ORDER BY tab ASC, id ASC"
    );
    const [subFunctions] = await db.execute(
      "SELECT * FROM sub_function_master WHERE status = 'Y' ORDER BY sub_seq ASC, id ASC"
    );

    // Determine allowed sub-functions for the current user
    let userAllowedSubIds = null;

    if (userId) {
      // Look up user's exact emp_id and username from DB if not in token
      let empId = userEmpId;
      let fullName = username;
      try {
        const [uRows] = await db.execute('SELECT emp_id, full_name, utype FROM users WHERE id = ? LIMIT 1', [userId]);
        if (uRows.length > 0) {
          empId = uRows[0].emp_id || empId;
          fullName = uRows[0].full_name || fullName;
          userType = String(uRows[0].utype || userType);
        }
      } catch (e) {}

      let assigned = [];

      // 1. Query the `access_function` table (Matching phpMyAdmin table: id, uid, function_id, status='Y')
      try {
        const [accessRows] = await db.execute(
          "SELECT function_id FROM access_function WHERE (uid = ? OR uid = ? OR uid = ?) AND status = 'Y'",
          [empId || '', String(userId), fullName || '']
        );
        if (accessRows.length > 0) {
          assigned = accessRows.map(r => parseInt(r.function_id)).filter(Boolean);
        }
      } catch (e) {}

      // 2. Query `user_rights` table fallback
      if (assigned.length === 0) {
        try {
          const [rights] = await db.execute(
            'SELECT sub_function_id FROM user_rights WHERE user_id = ? AND status = 1',
            [userId]
          );
          if (rights.length > 0) {
            assigned = rights.map(r => r.sub_function_id);
          }
        } catch (e) {}
      }

      if (assigned.length > 0) {
        // User has specific rights defined in access_function -> Strictly show ONLY those sub-modules
        userAllowedSubIds = new Set(assigned);
      } else if (userType !== '1') {
        // Non-admin user with no rights granted -> Show empty/restricted menu
        userAllowedSubIds = new Set();
      }
      // If userType === '1' (Super Admin) and no custom restriction, userAllowedSubIds remains null (all active modules allowed)
    }

    // Group sub-functions under their parent function
    const menuTree = functions.map(fn => {
      let children = subFunctions.filter(sub => sub.function_id === fn.function_id);

      // If user has specific rights configured in access_function, filter sub-functions
      if (userAllowedSubIds !== null) {
        children = children.filter(sub => userAllowedSubIds.has(sub.id));
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

    res.json({ status: 'success', data: menuTree, totalAccessibleModules: menuTree.length });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

module.exports = router;
