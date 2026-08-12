const db = require('../config/db');

// POST /api/sync  — Replaces api_google_sheet_sync.php
// Called by Google Apps Script to push sheet data into MySQL
const syncFromGoogleSheet = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const data = req.body;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.json({ status: 'error', message: 'No data received from Google Sheets.' });
    }

    // Ensure required columns exist (safe to run every time, MySQL ignores if column already exists via try/catch)
    const alterQueries = [
      "ALTER TABLE google_sheet_data ADD COLUMN IF NOT EXISTS vendor_code VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE moved_sheet ADD COLUMN IF NOT EXISTS vendor_code VARCHAR(255) DEFAULT NULL",
    ];
    for (const q of alterQueries) {
      try { await conn.execute(q); } catch (e) { /* ignore if column exists */ }
    }

    // Pre-fetch existing erp_unique_ids into memory for O(1) lookups
    const existingGoogle = {};
    const [gs] = await conn.execute("SELECT erp_unique_id, vendor_code FROM google_sheet_data WHERE erp_unique_id IS NOT NULL AND erp_unique_id != ''");
    for (const r of gs) existingGoogle[r.erp_unique_id] = r.vendor_code;

    const existingMoved = {};
    const [ms] = await conn.execute("SELECT erp_unique_id, vendor_code FROM moved_sheet WHERE erp_unique_id IS NOT NULL AND erp_unique_id != ''");
    for (const r of ms) existingMoved[r.erp_unique_id] = r.vendor_code;

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let index = 0; index < data.length; index++) {
      const rawRow = data[index];
      // Normalize headers to lowercase
      const row = {};
      for (const [k, v] of Object.entries(rawRow)) {
        row[k.toLowerCase().trim()] = v;
      }

      const status             = (row['status'] || '').toString().trim();
      const wh_request_id      = (row['wh request id'] || '').toString().trim();
      const cctv_unique_id     = (row['cctv unique id'] || '').toString().trim();
      const project_code       = (row['project code'] || '').toString().trim();
      const model_no           = (row['model no'] || '').toString().trim();
      const serial_number      = (row['serial number'] || '').toString().trim();
      const center_code        = (row['center code'] || '').toString().trim();
      const centre_center_name = (row['centre center name'] || '').toString().trim();
      const vendor_code        = (row['vendor code'] || '').toString().trim();

      let audit_received_by = '', audit_received_date = '', received_project_code = '';
      for (const [k, v] of Object.entries(row)) {
        if (k.includes('received') && k.includes('by')) audit_received_by = v.toString().trim();
        if (k.includes('received') && k.includes('date')) audit_received_date = v.toString().trim();
        if (k.includes('received') && k.includes('project') && k.includes('code')) received_project_code = v.toString().trim();
      }

      if (!wh_request_id) continue;

      const sheet_row_id = row['sheet_row_id'] || '';
      const erp_unique_id = serial_number
        ? `${serial_number}-${wh_request_id}`
        : `ROW${sheet_row_id}-${wh_request_id}`;

      // If already exists, only update vendor_code if changed
      if (existingGoogle[erp_unique_id] !== undefined) {
        if (vendor_code && existingGoogle[erp_unique_id] !== vendor_code) {
          await conn.execute("UPDATE google_sheet_data SET vendor_code = ? WHERE erp_unique_id = ?", [vendor_code, erp_unique_id]);
          existingGoogle[erp_unique_id] = vendor_code;
        }
        successCount++;
        continue;
      }
      if (existingMoved[erp_unique_id] !== undefined) {
        if (vendor_code && existingMoved[erp_unique_id] !== vendor_code) {
          await conn.execute("UPDATE moved_sheet SET vendor_code = ? WHERE erp_unique_id = ?", [vendor_code, erp_unique_id]);
          existingMoved[erp_unique_id] = vendor_code;
        }
        successCount++;
        continue;
      }

      // New record — INSERT
      try {
        await conn.execute(
          `INSERT INTO google_sheet_data
           (status, wh_request_id, cctv_unique_id, project_code, model_no, serial_number, center_code, centre_center_name, audit_received_by, audit_received_date, erp_unique_id, received_project_code, vendor_code)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [status, wh_request_id, cctv_unique_id, project_code, model_no, serial_number, center_code, centre_center_name, audit_received_by, audit_received_date, erp_unique_id, received_project_code, vendor_code]
        );
        existingGoogle[erp_unique_id] = vendor_code;

        // Update common stock
        const [partRows] = await conn.execute("SELECT part_code FROM product_master WHERE TRIM(item_code) = TRIM(?) LIMIT 1", [model_no]);
        if (partRows.length > 0 && partRows[0].part_code) {
          const part_code = partRows[0].part_code;
          const [stockUpd] = await conn.execute("UPDATE iil_stock_sheet SET common = common + 1 WHERE pCode = ?", [part_code]);
          if (stockUpd.affectedRows === 0) {
            await conn.execute("INSERT INTO iil_stock_sheet (pCode, common, user, wh_mundka, client, store) VALUES (?,1,0,0,0,0)", [part_code]);
          }
        }
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`Row ${index + 1}: ${err.message}`);
      }
    }

    await conn.commit();

    if (errorCount === 0) {
      return res.json({ status: 'success', message: `${successCount} records synced successfully.` });
    } else {
      return res.json({ status: 'partial_success', message: `${successCount} inserted, ${errorCount} failed.`, errors });
    }
  } catch (err) {
    await conn.rollback();
    console.error('sync error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  } finally {
    conn.release();
  }
};

module.exports = { syncFromGoogleSheet };
