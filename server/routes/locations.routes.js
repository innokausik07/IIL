const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET /api/locations  — fetch all locations
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM locations ORDER BY id DESC');
    res.json({ status: 'success', data: rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

// POST /api/locations/create
router.post('/create', async (req, res) => {
  try {
    const {
      location_name, contact_person, department, designation,
      contact_no, contact_email, pan, gstin,
      pincode, city, state, address, status
    } = req.body;

    if (!location_name || !contact_person || !contact_no || !contact_email || !pincode || !city || !state || !address) {
      return res.status(400).json({ status: 'error', message: 'Please fill all required fields.' });
    }

    await db.execute(
      `INSERT INTO locations
        (location_name, contact_person, department, designation,
         contact_no, contact_email, pan, gstin,
         pincode, city, state, address, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [location_name, contact_person, department||'', designation||'',
       contact_no, contact_email, pan||'', gstin||'',
       pincode, city, state, address, status||'1']
    );

    res.json({ status: 'success', message: 'Location created successfully!' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

module.exports = router;
