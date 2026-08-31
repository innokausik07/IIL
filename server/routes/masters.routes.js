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

// ─── 8. Organization Hierarchy ───────────────────────────────────────────────
makeRoutes('org_levels', 'id', ['level_code', 'level_name', 'level_order', 'parent_level_id', 'status']);
makeRoutes('org_units',  'id', ['unit_code', 'unit_name', 'level_id', 'parent_unit_id', 'company_id', 'head_user_id', 'status', 'created_by']);

// GET org_units as tree
router.get('/org_units/tree', async (req, res) => {
  try {
    const [units] = await db.execute(
      `SELECT u.*, l.level_name FROM org_units u
       LEFT JOIN org_levels l ON u.level_id = l.id
       WHERE u.status = '1' ORDER BY l.level_order ASC, u.unit_name ASC`
    );
    const buildTree = (items, parentId = null) =>
      items.filter(i => (i.parent_unit_id || null) == parentId)
           .map(i => ({ ...i, children: buildTree(items, i.id) }));
    res.json({ status: 'success', data: buildTree(units) });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// ─── 9. Location Hierarchy ───────────────────────────────────────────────────
makeRoutes('location_types', 'id', ['type_code', 'type_name', 'status']);

// GET locations as tree (enhanced)
router.get('/locations/tree', async (req, res) => {
  try {
    const [locs] = await db.execute(
      `SELECT l.*, t.type_name FROM locations l
       LEFT JOIN location_types t ON l.type_id = t.id
       WHERE l.status = '1' ORDER BY l.level ASC, l.location_name ASC`
    );
    const buildTree = (items, parentId = null) =>
      items.filter(i => (i.parent_loc_id || null) == parentId)
           .map(i => ({ ...i, children: buildTree(items, i.id) }));
    res.json({ status: 'success', data: buildTree(locs) });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// ─── 10. Asset Management ────────────────────────────────────────────────────
makeRoutes('asset_status_master',    'id', ['status_code', 'status_name', 'color', 'is_available', 'is_rented', 'sort_order', 'status']);
makeRoutes('asset_condition_master', 'id', ['cond_code', 'cond_name', 'status']);

// GET assets with joins
router.get('/asset_master', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT a.*, p.product_name, p.model, vm.name AS vendor_name,
              l.location_name AS current_location,
              s.status_name AS asset_status, s.color AS status_color,
              c.cond_name AS condition_name,
              u.full_name AS custodian_name
       FROM asset_master a
       LEFT JOIN product_master p ON a.product_id = p.id
       LEFT JOIN vendor_master vm ON a.vendor_id = vm.sno
       LEFT JOIN locations l ON a.current_loc_id = l.id
       LEFT JOIN asset_status_master s ON a.asset_status_id = s.id
       LEFT JOIN asset_condition_master c ON a.condition_id = c.id
       LEFT JOIN users u ON a.custodian_id = u.id
       WHERE a.deleted_at IS NULL
       ORDER BY a.id DESC`
    );
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// POST create asset
router.post('/asset_master', async (req, res) => {
  try {
    const { asset_code, serial_no, product_id, vendor_id, current_loc_id, custodian_id,
            asset_status_id, condition_id, purchase_date, purchase_cost, purchase_ref,
            warranty_expiry, notes, created_by } = req.body;
    const [result] = await db.execute(
      `INSERT INTO asset_master (asset_code, serial_no, product_id, vendor_id, current_loc_id,
        custodian_id, asset_status_id, condition_id, purchase_date, purchase_cost, purchase_ref,
        warranty_expiry, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [asset_code, serial_no, product_id, vendor_id, current_loc_id, custodian_id,
       asset_status_id, condition_id, purchase_date, purchase_cost, purchase_ref,
       warranty_expiry, notes, created_by]
    );
    // Record initial movement
    if (current_loc_id) {
      await db.execute(
        `INSERT INTO asset_movements (asset_id, to_loc_id, movement_type, to_status, ref_doc_type, moved_by, moved_at)
         VALUES (?, ?, 'Inbound', ?, 'Asset Creation', ?, NOW())`,
        [result.insertId, current_loc_id, asset_status_id, created_by]
      );
    }
    res.json({ status: 'success', message: 'Asset created!', id: result.insertId });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// PUT update asset
router.put('/asset_master/:id', async (req, res) => {
  try {
    const { serial_no, product_id, vendor_id, current_loc_id, custodian_id,
            asset_status_id, condition_id, purchase_date, purchase_cost, purchase_ref,
            warranty_expiry, notes } = req.body;
    await db.execute(
      `UPDATE asset_master SET serial_no=?, product_id=?, vendor_id=?, current_loc_id=?,
        custodian_id=?, asset_status_id=?, condition_id=?, purchase_date=?, purchase_cost=?,
        purchase_ref=?, warranty_expiry=?, notes=? WHERE id=? AND deleted_at IS NULL`,
      [serial_no, product_id, vendor_id, current_loc_id, custodian_id,
       asset_status_id, condition_id, purchase_date, purchase_cost, purchase_ref,
       warranty_expiry, notes, req.params.id]
    );
    res.json({ status: 'success', message: 'Asset updated!' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// DELETE asset (soft)
router.delete('/asset_master/:id', async (req, res) => {
  try {
    await db.execute(`UPDATE asset_master SET deleted_at = NOW() WHERE id = ?`, [req.params.id]);
    res.json({ status: 'success', message: 'Asset removed!' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// GET asset movements for an asset
router.get('/asset_master/:id/movements', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT m.*, fl.location_name AS from_loc, tl.location_name AS to_loc,
              fs.status_name AS from_status_name, ts.status_name AS to_status_name,
              u.full_name AS moved_by_name
       FROM asset_movements m
       LEFT JOIN locations fl ON m.from_loc_id = fl.id
       LEFT JOIN locations tl ON m.to_loc_id = tl.id
       LEFT JOIN asset_status_master fs ON m.from_status = fs.id
       LEFT JOIN asset_status_master ts ON m.to_status = ts.id
       LEFT JOIN users u ON m.moved_by = u.id
       WHERE m.asset_id = ? ORDER BY m.moved_at DESC`,
      [req.params.id]
    );
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// ─── 11. Rental Masters ───────────────────────────────────────────────────────
makeRoutes('rental_type_master',  'id', ['type_code', 'type_name', 'status']);
makeRoutes('billing_cycle_master','id', ['cycle_code', 'cycle_name', 'cycle_days', 'status']);

// Rental Plans with product join
router.get('/rental_plan_master', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT rp.*, p.product_name, p.model,
              rt.type_name AS rental_type, bc.cycle_name AS billing_cycle
       FROM rental_plan_master rp
       LEFT JOIN product_master p ON rp.product_id = p.id
       LEFT JOIN rental_type_master rt ON rp.rental_type_id = rt.id
       LEFT JOIN billing_cycle_master bc ON rp.billing_cycle_id = bc.id
       WHERE rp.status = '1' ORDER BY rp.id DESC`
    );
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

router.post('/rental_plan_master', async (req, res) => {
  try {
    const { plan_code, plan_name, product_id, rental_type_id, billing_cycle_id,
            duration_months, monthly_rent, security_deposit, late_fee_per_day, auto_renew, created_by } = req.body;
    const [r] = await db.execute(
      `INSERT INTO rental_plan_master (plan_code, plan_name, product_id, rental_type_id, billing_cycle_id,
        duration_months, monthly_rent, security_deposit, late_fee_per_day, auto_renew, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [plan_code, plan_name, product_id, rental_type_id, billing_cycle_id,
       duration_months, monthly_rent, security_deposit, late_fee_per_day, auto_renew || 0, created_by]
    );
    res.json({ status: 'success', message: 'Rental plan created!', id: r.insertId });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

router.put('/rental_plan_master/:id', async (req, res) => {
  try {
    const { plan_code, plan_name, product_id, rental_type_id, billing_cycle_id,
            duration_months, monthly_rent, security_deposit, late_fee_per_day, auto_renew } = req.body;
    await db.execute(
      `UPDATE rental_plan_master SET plan_code=?, plan_name=?, product_id=?, rental_type_id=?,
        billing_cycle_id=?, duration_months=?, monthly_rent=?, security_deposit=?,
        late_fee_per_day=?, auto_renew=? WHERE id=?`,
      [plan_code, plan_name, product_id, rental_type_id, billing_cycle_id,
       duration_months, monthly_rent, security_deposit, late_fee_per_day, auto_renew || 0, req.params.id]
    );
    res.json({ status: 'success', message: 'Rental plan updated!' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

router.delete('/rental_plan_master/:id', async (req, res) => {
  try {
    await db.execute(`UPDATE rental_plan_master SET status='D' WHERE id=?`, [req.params.id]);
    res.json({ status: 'success', message: 'Plan deactivated!' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// ─── 12. Finance Masters ─────────────────────────────────────────────────────
makeRoutes('invoice_type_master', 'id', ['type_code', 'type_name', 'status']);
makeRoutes('payment_mode_master', 'id', ['mode_code', 'mode_name', 'status']);

// ─── 13. RBAC Masters ────────────────────────────────────────────────────────
makeRoutes('roles',             'id', ['role_code', 'role_name', 'description', 'status']);
makeRoutes('data_scope_master', 'id', ['scope_code', 'scope_name', 'scope_level']);

// ─── 14. Dashboard Stats ─────────────────────────────────────────────────────
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [[assets]]       = await db.execute(`SELECT COUNT(*) AS total FROM asset_master WHERE deleted_at IS NULL`);
    const [[available]]    = await db.execute(`SELECT COUNT(*) AS total FROM asset_master a JOIN asset_status_master s ON a.asset_status_id = s.id WHERE s.is_available = 1 AND a.deleted_at IS NULL`);
    const [[rented]]       = await db.execute(`SELECT COUNT(*) AS total FROM asset_master a JOIN asset_status_master s ON a.asset_status_id = s.id WHERE s.is_rented = 1 AND a.deleted_at IS NULL`);
    const [[maintenance]]  = await db.execute(`SELECT COUNT(*) AS total FROM asset_master a JOIN asset_status_master s ON a.asset_status_id = s.id WHERE s.status_code = 'MAINTENANCE' AND a.deleted_at IS NULL`);
    const [[clients]]      = await db.execute(`SELECT COUNT(*) AS total FROM client_master WHERE status = '1'`);
    const [[vendors]]      = await db.execute(`SELECT COUNT(*) AS total FROM vendor_master WHERE status = '1'`);
    const [[activeRentals]]= await db.execute(`SELECT COUNT(*) AS total FROM rental_orders WHERE status = 'Active'`);
    const [[tickets]]      = await db.execute(`SELECT COUNT(*) AS total FROM service_tickets WHERE status IN ('Open','Assigned','InProgress')`);
    res.json({
      status: 'success',
      data: {
        totalAssets:     assets.total,
        availableAssets: available.total,
        rentedAssets:    rented.total,
        maintenanceAssets: maintenance.total,
        totalClients:    clients.total,
        totalVendors:    vendors.total,
        activeRentals:   activeRentals.total,
        openTickets:     tickets.total
      }
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.sqlMessage || e.message });
  }
});

// Ping
router.get('/ping', (req, res) => res.json({ status: 'ok', message: 'All routes working including function_master' }));

module.exports = router;
