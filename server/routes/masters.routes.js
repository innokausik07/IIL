/**
 * Complete Master Data Routes
 * Handles all ERP modules dynamically:
 * - Masters: State, City, Brand, Color, Tax, Courier, Parameter, Bin, ASP
 * - Products: Category, Sub-Category, Product / Item Master, BOM, Price
 * - Vendors & Clients: Vendor Master, Client Master
 * - CRM & Sales: Lead, Quotation, RFP
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// Helper to register standard CRUD for any table
const makeRoutes = (table, idCol, insertCols) => {
  // GET list
  router.get(`/${table}`, async (req, res) => {
    try {
      const [rows] = await db.execute(`SELECT * FROM ${table} ORDER BY ${idCol} DESC`);
      res.json({ status: 'success', data: rows });
    } catch (e) {
      res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
    }
  });

  // POST create
  router.post(`/${table}`, async (req, res) => {
    try {
      const values = insertCols.map(c => req.body[c] ?? null);
      const cols   = insertCols.join(', ');
      const marks  = insertCols.map(() => '?').join(', ');
      const [result] = await db.execute(`INSERT INTO ${table} (${cols}) VALUES (${marks})`, values);
      res.json({ status: 'success', message: 'Created successfully!', id: result.insertId });
    } catch (e) {
      res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
    }
  });

  // PUT update
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

  // DELETE / deactivate
  router.delete(`/${table}/:id`, async (req, res) => {
    try {
      await db.execute(`UPDATE ${table} SET status = '0' WHERE ${idCol} = ?`, [req.params.id]);
      res.json({ status: 'success', message: 'Deactivated successfully!' });
    } catch (e) {
      res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
    }
  });
};

// ─── 1. Core Masters ──────────────────────────────────────────────────────────
makeRoutes('state_master',     'sno',       ['state', 'zone', 'code', 'statecode', 'country', 'status']);
makeRoutes('district_master',  'id',        ['city', 'state', 'country', 'status']);
makeRoutes('make_master',      'id',        ['make', 'status']);
makeRoutes('color_master',     'id',        ['color_name', 'color_code', 'status']);
makeRoutes('tax_hsn_master',   'sno',       ['chapter_no', 'hsn_description', 'hsn_code', 'sgst', 'igst', 'cgst', 'status']);
makeRoutes('diesl_master',     'sno',       ['couriername', 'couriercode', 'contact_person', 'email', 'phone', 'addrs', 'city', 'state', 'gstin', 'status']);
makeRoutes('parameter_master', 'id',        ['param_name', 'param_value', 'param_type', 'status']);
makeRoutes('bin_master',       'id',        ['bin_name', 'location_name', 'warehouse', 'status']);
makeRoutes('asp_master',       'id',        ['asp_name', 'contact_person', 'phone', 'email', 'city', 'state', 'status']);

// ─── 2. Product Management ───────────────────────────────────────────────────
makeRoutes('product_cat_master',  'catid',     ['cat_name', 'short_code', 'status']);
makeRoutes('product_sub_category','psubcatid', ['prod_sub_cat', 'productid', 'product_category', 'status']);
makeRoutes('product_master',      'id',        ['part_code', 'item_code', 'product_name', 'product_category_id', 'product_subcat_id', 'brand_id', 'model', 'hsn_code', 'product_color', 'product_type', 'is_serialize', 'product_description', 'warranty_days', 'warranty_terms', 'status_id']);
makeRoutes('bom_master',          'id',        ['bom_no', 'product_name', 'part_code', 'subcat_name', 'qty', 'status']);
makeRoutes('price_master',        'id',        ['part_code', 'product_name', 'purchase_price', 'selling_price', 'rental_price', 'status']);

// ─── 3. Vendor & Client ───────────────────────────────────────────────────────
makeRoutes('vendor_master',       'sno',       ['id', 'name', 'type', 'contact_name', 'phone', 'alt_number', 'email', 'address', 'city', 'state', 'country', 'pincode', 'gstin_no', 'business_nature', 'payment_terms', 'bank', 'acct_number', 'ifsc', 'status']);
makeRoutes('client_master',       'id',        ['client_code', 'client_name', 'contact_person', 'phone', 'email', 'city', 'state', 'address', 'gstin', 'status']);

// ─── 4. CRM & Sales ───────────────────────────────────────────────────────────
makeRoutes('lead_master',         'id',        ['lead_no', 'lead_title', 'client_name', 'contact_person', 'phone', 'email', 'source', 'lead_status', 'expected_value', 'remarks']);
makeRoutes('quot_master',         'id',        ['quot_no', 'client_name', 'quot_date', 'total_amount', 'tax_amount', 'net_amount', 'status']);
makeRoutes('rfp_master',          'id',        ['rfp_no', 'title', 'client_name', 'submission_date', 'estimated_value', 'status']);

// Ping
router.get('/ping', (req, res) => res.json({ status: 'ok', message: 'All master and module routes working' }));

module.exports = router;
