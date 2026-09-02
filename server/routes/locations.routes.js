const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET /api/locations — fetch all plants/locations with type & parent names
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        l.*,
        pt.type_name as plant_type_name,
        pt.type_code as plant_type_code,
        p.location_name as parent_plant_name
      FROM locations l
      LEFT JOIN plant_types pt ON l.plant_type_id = pt.id
      LEFT JOIN locations p ON l.parent_plant_id = p.id
      ORDER BY l.id DESC
    `);
    res.json({ status: 'success', data: rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

// GET /api/locations/hierarchy — Tree structure (Parent -> Child Plants)
router.get('/hierarchy', async (req, res) => {
  try {
    const [all] = await db.execute(`
      SELECT 
        l.*,
        pt.type_name as plant_type_name,
        pt.type_code as plant_type_code
      FROM locations l
      LEFT JOIN plant_types pt ON l.plant_type_id = pt.id
      WHERE l.status != 'D'
      ORDER BY l.id ASC
    `);

    // Build hierarchy tree
    const map = {};
    const roots = [];

    all.forEach(item => {
      map[item.id] = { ...item, children: [] };
    });

    all.forEach(item => {
      if (item.parent_plant_id && map[item.parent_plant_id]) {
        map[item.parent_plant_id].children.push(map[item.id]);
      } else {
        roots.push(map[item.id]);
      }
    });

    res.json({ status: 'success', data: roots });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

// POST /api/locations/create
router.post('/create', async (req, res) => {
  try {
    const {
      plant_code, plant_type_id, parent_plant_id,
      location_name, contact_person, department, designation,
      contact_no, contact_email, pan, gstin,
      pincode, city, state, address, status
    } = req.body;

    if (!location_name || !contact_person || !contact_no || !contact_email || !pincode || !city || !state || !address) {
      return res.status(400).json({ status: 'error', message: 'Please fill all required fields.' });
    }

    const [result] = await db.execute(
      `INSERT INTO locations
        (plant_code, plant_type_id, parent_plant_id,
         location_name, contact_person, department, designation,
         contact_no, contact_email, pan, gstin,
         pincode, city, state, address, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        plant_code || `PLT-${Date.now().toString().slice(-4)}`,
        plant_type_id || 2,
        parent_plant_id || null,
        location_name, contact_person, department || '', designation || '',
        contact_no, contact_email, pan || '', gstin || '',
        pincode, city, state, address, status || '1'
      ]
    );

    res.json({ status: 'success', message: 'Plant / Location created successfully!', id: result.insertId });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

// PUT /api/locations/:id
router.put('/:id', async (req, res) => {
  try {
    const {
      plant_code, plant_type_id, parent_plant_id,
      location_name, contact_person, department, designation,
      contact_no, contact_email, pan, gstin,
      pincode, city, state, address, status
    } = req.body;

    await db.execute(
      `UPDATE locations SET
        plant_code = ?, plant_type_id = ?, parent_plant_id = ?,
        location_name = ?, contact_person = ?, department = ?, designation = ?,
        contact_no = ?, contact_email = ?, pan = ?, gstin = ?,
        pincode = ?, city = ?, state = ?, address = ?, status = ?
       WHERE id = ?`,
      [
        plant_code || '', plant_type_id || null, parent_plant_id || null,
        location_name, contact_person, department || '', designation || '',
        contact_no, contact_email, pan || '', gstin || '',
        pincode, city, state, address, status || '1',
        req.params.id
      ]
    );

    res.json({ status: 'success', message: 'Plant / Location updated successfully!' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

// DELETE /api/locations/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.execute("UPDATE locations SET status = 'D' WHERE id = ?", [req.params.id]);
    res.json({ status: 'success', message: 'Plant / Location deactivated successfully!' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.sqlMessage || err.message });
  }
});

module.exports = router;

