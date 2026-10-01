/**
 * Dynamic Navigation Menu API
 * With debug endpoint to diagnose live production issues.
 */
const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');

// Helper: decode token safely
function decodeToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const rawToken = authHeader.split(' ')[1];
  if (!rawToken || rawToken === 'null' || rawToken === 'undefined') return null;
  try {
    return jwt.verify(rawToken, process.env.JWT_SECRET || 'innovatiview_secret_key');
  } catch (err) {
    try { return jwt.decode(rawToken); } catch (e) { return null; }
  }
}

// GET /api/navigation/debug - DIAGNOSTIC: shows raw token data and access_function rows
router.get('/debug', async (req, res) => {
  try {
    const decoded = decodeToken(req.headers.authorization);
    const [accessAll] = await db.execute('SELECT * FROM access_function LIMIT 20');
    const [usersAll] = await db.execute('SELECT id, emp_id, full_name, email, utype FROM users');
    const [subFnsAll] = await db.execute('SELECT id, function_id, sub_name FROM sub_function_master LIMIT 10');
    const [fnsAll] = await db.execute('SELECT id, function_id, function_name FROM function_master LIMIT 10');
    res.json({
      decoded_token: decoded,
      users_in_db: usersAll,
      access_function_rows: accessAll,
      sample_sub_functions: subFnsAll,
      sample_functions: fnsAll
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/navigation - Dynamic tree of active functions and sub-functions
router.get('/', async (req, res) => {
  try {
    const decoded = decodeToken(req.headers.authorization);

    let userId = decoded?.id || null;
    let userType = String(decoded?.utype || '');
    let username = decoded?.full_name || decoded?.userid || null;
    let userEmpId = decoded?.emp_id || null;

    // Fetch all functions and sub-functions from database
    const [functions] = await db.execute(
      "SELECT * FROM function_master ORDER BY tab ASC, id ASC"
    );
    const [subFunctions] = await db.execute(
      "SELECT * FROM sub_function_master ORDER BY sub_seq ASC, id ASC"
    );

    // Fetch ALL access_function rows and ALL users rows
    const [allAccessRows] = await db.execute('SELECT * FROM access_function');
    const [allUsers] = await db.execute('SELECT id, emp_id, full_name, email FROM users');

    // Collect candidate identifiers for this logged-in user
    let candidateIds = new Set();

    // Add from token directly
    if (userEmpId) candidateIds.add(String(userEmpId).trim());
    if (userId) candidateIds.add(String(userId).trim());
    if (username) candidateIds.add(String(username).trim());

    // Match against users table
    allUsers.forEach(u => {
      const matchById = userId && String(u.id) === String(userId);
      const matchByEmpId = userEmpId && String(u.emp_id || '').trim() === String(userEmpId).trim();
      const matchByName = username && (
        String(u.full_name || '').toLowerCase() === String(username).toLowerCase() ||
        String(u.email || '').toLowerCase() === String(username).toLowerCase()
      );
      if (matchById || matchByEmpId || matchByName) {
        if (u.emp_id) candidateIds.add(String(u.emp_id).trim());
        if (u.id) candidateIds.add(String(u.id).trim());
        if (u.full_name) candidateIds.add(String(u.full_name).trim());
      }
    });

    const candidateArr = Array.from(candidateIds);
    const candidateLower = candidateArr.map(c => c.toLowerCase());

    // Filter access rows belonging to this user (case-insensitive emp_id match)
    const userRows = allAccessRows.filter(r => {
      const rowEmpId = String(r.emp_id || r.uid || '').trim().toLowerCase();
      return rowEmpId && candidateLower.includes(rowEmpId);
    });

    // Build allowed set from user's access rows
    const allowedSubValues = new Set();
    const wildcardFnIds = new Set();
    
    userRows.forEach(r => {
      const subId = String(r.sub_function_id || '').trim().toLowerCase();
      const fnId = String(r.function_id || '').trim().toLowerCase();
      
      if (subId && subId !== 'null' && subId !== '0' && subId !== 'undefined') {
        allowedSubValues.add(subId);
      } 
      // Always store the parent function ID for wildcard fallback 
      // (but we will ONLY use it if the user has NO specific sub-modules granted, 
      // OR if they are an admin with wildcard grants)
      if (fnId && fnId !== 'null' && fnId !== '0' && fnId !== 'undefined') {
        wildcardFnIds.add(fnId);
      }
    });

    // Build navigation menu tree strictly
    const menuTree = functions.map(fn => {
      const fnCode = String(fn.function_id || '').trim().toLowerCase();
      const fnIdStr = String(fn.id).trim().toLowerCase();

      const children = subFunctions.filter(sub => {
        const subFnCode = String(sub.function_id || '').trim().toLowerCase();
        const subIdStr = String(sub.id).trim().toLowerCase();
        const subName = String(sub.sub_name || '').trim().toLowerCase();
        const subFile = String(sub.file_name || '').trim().toLowerCase();

        // Must belong to this parent function
        const isChild = !subFnCode || subFnCode === fnCode || subFnCode === fnIdStr;
        if (!isChild) return false;

        // No rights granted at all? Hide everything
        if (allowedSubValues.size === 0 && wildcardFnIds.size === 0) return false;

        // Check if this specific sub-module is explicitly granted
        const isExplicitlyGranted = 
          allowedSubValues.has(subIdStr) || 
          allowedSubValues.has(subFnCode) || 
          allowedSubValues.has(subName) || 
          allowedSubValues.has(subFile);

        if (isExplicitlyGranted) return true;

        // If no explicit sub-module matches, but the parent function is granted, 
        // we check if this user has ANY explicit sub-modules for this parent.
        // If they have NO explicit sub-modules for this parent, the parent grant acts as a wildcard.
        const parentGranted = wildcardFnIds.has(subFnCode) || wildcardFnIds.has(fnCode) || wildcardFnIds.has(fnIdStr);
        if (parentGranted) {
           // Does the user have ANY explicit sub-module in allowedSubValues that belongs to this parent?
           const hasOtherSiblingsGranted = subFunctions.some(sibling => {
              const sibFn = String(sibling.function_id || '').trim().toLowerCase();
              const sibId = String(sibling.id).trim().toLowerCase();
              const sibName = String(sibling.sub_name || '').trim().toLowerCase();
              if (sibFn === fnCode || sibFn === fnIdStr) {
                 return allowedSubValues.has(sibId) || allowedSubValues.has(sibName);
              }
              return false;
           });
           
           // If they have siblings granted explicitly, we DO NOT wildcard grant this one.
           // This fixes the bug where checking 1 checkbox opened all of them.
           if (!hasOtherSiblingsGranted) {
              return true; // Wildcard grant
           }
        }

        return false;
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
    }).filter(fn => fn.sub_functions.length > 0);

    res.json({
      status: 'success',
      data: menuTree,
      totalAccessibleModules: menuTree.length,
      grantedCount: allowedSubIds.size + allowedFnIds.size,
      matchedCandidateIds: candidateArr,
      userRowsFound: userRows.length
    });
  } catch (err) {
    console.error('Navigation Route Error:', err);
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

module.exports = router;
