/**
 * Complete Master, Logistics & Function Master Data Routes
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// Helper to register standard CRUD for any table
const makeRoutes = (table, idCol, insertCols) => {
  // GET list
  router.get(`/${table}`, async (req, res) => {
    try {
      const [rows] = await db.execute(`SELECT * FROM ${table} ORDER BY ${idCol} ASC`);
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
      await db.execute(`UPDATE ${table} SET status = 'D' WHERE ${idCol} = ?`, [req.params.id]);
      res.json({ status: 'success', message: 'Deactivated successfully!' });
    } catch (e) {
      res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
    }
  });
};

// ─── 1. Function & Sub-Function Masters (Module Hierarchy) ────────────────────
makeRoutes('function_master',     'id', ['function_id', 'function_name', 'descrip', 'icon_img', 'status', 'utype', 'tab']);
makeRoutes('sub_function_master', 'id', ['function_id', 'sub_name', 'sub_seq', 'file_name', 'tab', 'icon_img', 'status', 'utype']);

// ─── 2. Core Masters ──────────────────────────────────────────────────────────
makeRoutes('usertype_master',  'id',  ['typename', 'utype', 'refid', 'status']);
makeRoutes('state_master',     'sno', ['state', 'zone', 'code', 'statecode', 'country', 'status']);
makeRoutes('district_master',  'id',  ['city', 'state', 'country', 'status']);
makeRoutes('make_master',      'id',  ['make', 'status']);
makeRoutes('color_master',     'id',  ['color_name', 'color_code', 'status']);
makeRoutes('tax_hsn_master',   'sno', ['chapter_no', 'hsn_description', 'hsn_code', 'sgst', 'igst', 'cgst', 'status']);
makeRoutes('diesl_master',     'sno', ['couriername', 'couriercode', 'contact_person', 'email', 'phone', 'addrs', 'city', 'state', 'gstin', 'status']);
makeRoutes('parameter_master', 'id',  ['param_name', 'param_value', 'param_type', 'status']);
makeRoutes('bin_master',       'id',  ['bin_name', 'location_name', 'warehouse', 'status']);
makeRoutes('asp_master',       'id',  ['asp_name', 'contact_person', 'phone', 'email', 'city', 'state', 'status']);

// ─── 3. Product Management ───────────────────────────────────────────────────
makeRoutes('product_cat_master',  'catid',     ['cat_name', 'short_code', 'status']);
makeRoutes('product_sub_category','psubcatid', ['prod_sub_cat', 'productid', 'product_category', 'status']);
makeRoutes('product_master',      'id',        ['part_code', 'item_code', 'product_name', 'product_category_id', 'product_subcat_id', 'brand_id', 'model', 'hsn_code', 'product_color', 'product_type', 'is_serialize', 'product_description', 'warranty_days', 'warranty_terms', 'status_id']);
makeRoutes('bom_master',          'id',        ['bom_no', 'product_name', 'part_code', 'subcat_name', 'qty', 'status']);
makeRoutes('price_master',        'id',        ['part_code', 'product_name', 'purchase_price', 'selling_price', 'rental_price', 'status']);

// ─── 4. Vendor & Client ───────────────────────────────────────────────────────
makeRoutes('vendor_master',       'sno',       ['id', 'name', 'type', 'contact_name', 'phone', 'alt_number', 'email', 'address', 'city', 'state', 'country', 'pincode', 'gstin_no', 'business_nature', 'payment_terms', 'bank', 'acct_number', 'ifsc', 'status']);
makeRoutes('client_master',       'id',        ['client_code', 'client_name', 'contact_person', 'phone', 'email', 'city', 'state', 'address', 'gstin', 'status']);

// ─── 5. CRM & Sales ───────────────────────────────────────────────────────────
makeRoutes('lead_master',         'id',        ['lead_no', 'lead_title', 'client_name', 'contact_person', 'phone', 'email', 'source', 'lead_status', 'expected_value', 'remarks']);
makeRoutes('quot_master',         'id',        ['quot_no', 'client_name', 'quot_date', 'total_amount', 'tax_amount', 'net_amount', 'status']);
makeRoutes('rfp_master',          'id',        ['rfp_no', 'title', 'client_name', 'submission_date', 'estimated_value', 'status']);

// ─── 6. Logistics Management ──────────────────────────────────────────────────
makeRoutes('delivery_challan',    'id',        ['dc_no', 'dc_date', 'dc_type', 'client_name', 'from_location', 'to_location', 'courier_name', 'docket_no', 'total_qty', 'total_weight', 'status', 'remarks']);
makeRoutes('goods_receipt_note',  'id',        ['grn_no', 'grn_date', 'vendor_name', 'po_no', 'invoice_no', 'warehouse_name', 'received_qty', 'accepted_qty', 'rejected_qty', 'status', 'remarks']);
makeRoutes('return_dc_master',    'id',        ['return_dc_no', 'return_date', 'client_name', 'reason', 'from_city', 'to_warehouse', 'courier_name', 'docket_no', 'status']);
makeRoutes('logistics_shipment',  'id',        ['awb_number', 'courier_name', 'ref_doc_no', 'origin_pin', 'dest_pin', 'weight_kg', 'shipping_mode', 'shipment_cost', 'dispatch_date', 'delivery_status', 'delivery_date', 'status']);
makeRoutes('courier_rate_master', 'id',        ['courier_name', 'mode', 'min_weight_kg', 'base_rate', 'per_kg_rate', 'fuel_surcharge', 'status']);

// ─── 7. Logistics Freight Calculator API ───────────────────────────────────────
router.post('/calculate-freight', (req, res) => {
  try {
    const { origin_pin, dest_pin, weight_kg = 1, mode = 'Surface', carrier = 'Standard' } = req.body;
    const wt = Math.max(parseFloat(weight_kg) || 1, 0.5);

    const getZone = (pin) => {
      const p = parseInt(String(pin || '').substring(0, 2), 10);
      if (p === 11) return 'North (Delhi)';
      if (p >= 12 && p <= 13) return 'North (Haryana)';
      if (p >= 14 && p <= 16) return 'North (Punjab)';
      if (p >= 20 && p <= 28) return 'North (UP/UK)';
      if (p >= 30 && p <= 34) return 'North (Rajasthan)';
      if (p >= 36 && p <= 39) return 'West (Gujarat)';
      if (p >= 40 && p <= 44) return 'West (Maharashtra)';
      if (p >= 45 && p <= 49) return 'West (MP)';
      if (p >= 50 && p <= 53) return 'South (AP/Telangana)';
      if (p >= 56 && p <= 59) return 'South (Karnataka)';
      if (p >= 60 && p <= 66) return 'South (Tamil Nadu)';
      if (p >= 67 && p <= 69) return 'South (Kerala)';
      if (p >= 70 && p <= 74) return 'East (WB)';
      if (p >= 75 && p <= 77) return 'East (Odisha)';
      if (p >= 78 && p <= 79) return 'Northeast (Remote)';
      if (p >= 80 && p <= 85) return 'East (Bihar/Jharkhand)';
      return 'Rest of India';
    };

    const originZone = getZone(origin_pin);
    const destZone   = getZone(dest_pin);

    const rateCard = {
      'Surface': { base: 60, perKg: 18, fuel: 10, handling: 20 },
      'Express': { base: 110, perKg: 35, fuel: 12, handling: 30 },
      'Air':     { base: 180, perKg: 65, fuel: 15, handling: 50 },
    };

    const rate = rateCard[mode] || rateCard['Surface'];
    const freightCharge = rate.base + (wt > 1 ? (wt - 1) * rate.perKg : 0);
    const fuelCharge    = (freightCharge * rate.fuel) / 100;
    const subtotal      = freightCharge + fuelCharge + rate.handling;
    const gst           = subtotal * 0.18;
    const totalCost     = Math.round((subtotal + gst) * 100) / 100;

    res.json({
      status: 'success',
      data: {
        origin: { pincode: origin_pin, zone: originZone },
        destination: { pincode: dest_pin, zone: destZone },
        weight_kg: wt,
        shipping_mode: mode,
        carrier,
        breakdown: {
          freightCharge: Math.round(freightCharge * 100) / 100,
          fuelSurcharge: Math.round(fuelCharge * 100) / 100,
          handlingCharge: rate.handling,
          gst_18_percent: Math.round(gst * 100) / 100,
          totalEstimatedCost: totalCost
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Ping
router.get('/ping', (req, res) => res.json({ status: 'ok', message: 'All routes working including function_master' }));

module.exports = router;
