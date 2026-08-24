/**
 * Dynamic Navigation Menu API
 * Fetches active functions and sub-functions from database
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET /api/navigation - Dynamic tree of active functions and sub-functions
router.get('/', async (req, res) => {
  try {
    const [functions] = await db.execute(
      "SELECT * FROM function_master WHERE status = 'Active' ORDER BY tab ASC, id ASC"
    );
    const [subFunctions] = await db.execute(
      "SELECT * FROM sub_function_master WHERE status = 'Y' ORDER BY sub_seq ASC, id ASC"
    );

    // Group sub-functions under their parent function
    const menuTree = functions.map(fn => {
      const children = subFunctions.filter(sub => sub.function_id === fn.function_id);
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
    }).filter(fn => fn.sub_functions.length > 0); // Only show functions that have active sub-modules

    res.json({ status: 'success', data: menuTree });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

module.exports = router;
