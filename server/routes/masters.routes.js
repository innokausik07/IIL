/**
 * Phase 1 Master Data Routes
 * Handles: State, City, Brand, Color, Tax/HSN, Courier, Parameter
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ─── Generic helper ────────────────────────────────────────────────────────
const makeRoutes = (table, idCol, listCols, insertCols) => {
  // GET /list
  router.get(`/${table}`, async (req, res) => {
    try {
      const [rows] = await db.execute(`SELECT * FROM ${table} ORDER BY ${idCol} DESC`);
      res.json({ status: 'success', data: rows });
    } catch (e) {
      res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
    }
  });

  // POST /create
  router.post(`/${table}`, async (req, res) => {
    try {
      const values = insertCols.map(c => req.body[c] ?? null);
      const cols   = insertCols.join(', ');
      const marks  = insertCols.map(() => '?').join(', ');
      await db.execute(`INSERT INTO ${table} (${cols}) VALUES (${marks})`, values);
      res.json({ status: 'success', message: 'Created successfully!' });
    } catch (e) {
      res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
    }
  });

  // PUT /update/:id
  router.put(`/${table}/:id`, async (req, res) => {
    try {
      const sets   = insertCols.map(c => `${c} = ?`).join(', ');
      const values = [...insertCols.map(c => req.body[c] ?? null), req.params.id];
      await db.execute(`UPDATE ${table} SET ${sets} WHERE ${idCol} = ?`, values);
      res.json({ status: 'success', message: 'Updated successfully!' });
    } catch (e) {
      res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
    }
  });

  // DELETE /delete/:id
  router.delete(`/${table}/:id`, async (req, res) => {
    try {
      await db.execute(`UPDATE ${table} SET status = '0' WHERE ${idCol} = ?`, [req.params.id]);
      res.json({ status: 'success', message: 'Deactivated successfully!' });
    } catch (e) {
      res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
    }
  });
};

// ─── Register all master tables ────────────────────────────────────────────

makeRoutes('state_master',    'sno',  [], ['state', 'zone', 'code', 'statecode', 'country', 'status']);
makeRoutes('district_master', 'id',   [], ['city', 'state', 'country', 'status']);
makeRoutes('make_master',     'id',   [], ['make', 'status']);
makeRoutes('color_master',    'id',   [], ['color_name', 'color_code', 'status']);
makeRoutes('tax_hsn_master',  'sno',  [], ['chapter_no', 'hsn_description', 'hsn_code', 'sgst', 'igst', 'cgst', 'status']);
makeRoutes('diesl_master',    'sno',  [], ['couriername', 'couriercode', 'contact_person', 'email', 'phone', 'addrs', 'city', 'state', 'gstin', 'status']);
makeRoutes('parameter_master','id',   [], ['param_name', 'param_value', 'param_type', 'status']);

// ─── Ping ──────────────────────────────────────────────────────────────────
router.get('/ping', (req, res) => res.json({ status: 'ok', message: 'masters route working' }));

module.exports = router;
