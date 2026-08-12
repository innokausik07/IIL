const db = require('../config/db');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

// ─── Helper: update iil_stock_sheet common bucket from google_sheet_data ──────
async function recalcCommon(conn) {
  await conn.execute("UPDATE iil_stock_sheet SET common = 0");
  const [rows] = await conn.execute(`
    SELECT p.part_code, COUNT(DISTINCT g.id) as actual_count
    FROM google_sheet_data g
    JOIN product_master p ON TRIM(g.model_no) = TRIM(p.item_code)
    WHERE TRIM(g.erp_status) = '42'
    GROUP BY p.part_code
  `);
  for (const row of rows) {
    await conn.execute(
      "UPDATE iil_stock_sheet SET common = ? WHERE TRIM(pCode) = ?",
      [row.actual_count, row.part_code]
    );
  }
}

// ─── GET /api/google-sheet ─────────────────────────────────────────────────────
const getList = async (req, res) => {
  try {
    const {
      wh_request_id, serial_number, model_no, project_code,
      erp_status, center_code, assignee, vendor_code,
      date_from, date_to, page = 1, limit = 50
    } = req.query;

    let where = [];
    let params = [];

    if (wh_request_id) { where.push("g.wh_request_id LIKE ?"); params.push(`%${wh_request_id}%`); }
    if (serial_number) { where.push("g.serial_number LIKE ?"); params.push(`%${serial_number}%`); }
    if (model_no) { where.push("g.model_no LIKE ?"); params.push(`%${model_no}%`); }
    if (project_code) { where.push("g.project_code LIKE ?"); params.push(`%${project_code}%`); }
    if (erp_status) { where.push("g.erp_status = ?"); params.push(erp_status); }
    if (center_code) { where.push("g.center_code LIKE ?"); params.push(`%${center_code}%`); }
    if (assignee) { where.push("g.assignee LIKE ?"); params.push(`%${assignee}%`); }
    if (vendor_code) { where.push("g.vendor_code LIKE ?"); params.push(`%${vendor_code}%`); }
    if (date_from) { where.push("DATE(g.created_at) >= ?"); params.push(date_from); }
    if (date_to) { where.push("DATE(g.created_at) <= ?"); params.push(date_to); }

    const whereStr = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM google_sheet_data g ${whereStr}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await db.execute(
      `SELECT g.*, p.part_code 
       FROM google_sheet_data g
       LEFT JOIN product_master p ON TRIM(g.model_no) = TRIM(p.item_code)
       ${whereStr}
       ORDER BY g.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return res.json({
      status: 'success',
      data: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('getList error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── POST /api/google-sheet/action ────────────────────────────────────────────
const doAction = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { action, ids, assignee_name, destination, extra_info, moved_to_projrctCode, box_number } = req.body;
    const currentUser = req.user.userid;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json({ status: 'error', message: 'No records selected.' });
    }
    const safeIds = ids.map(Number).filter(n => n > 0);
    const placeholder = safeIds.map(() => '?').join(',');

    // ── ASSIGNEE ─────────────────────────────────────────────────────────────
    if (action === 'assignee') {
      if (!assignee_name) return res.json({ status: 'error', message: 'Assignee name is required.' });

      // Transfer stock for items in work-in-progress
      const [wip] = await conn.execute(
        `SELECT g.model_no, p.part_code,
         COALESCE(NULLIF(g.movement_by,''), NULLIF(g.acknowledged_by,''), NULLIF(g.work_done_by,''), NULLIF(g.assignee,'')) as current_owner,
         COUNT(*) as cnt
         FROM google_sheet_data g
         LEFT JOIN product_master p ON TRIM(g.model_no) = TRIM(p.item_code)
         WHERE g.id IN (${placeholder}) AND (g.erp_status = '76' OR g.erp_status = 'Work in Progress')
         GROUP BY g.model_no, p.part_code, current_owner`,
        safeIds
      );
      for (const row of wip) {
        if (row.part_code && row.current_owner) {
          await conn.execute("UPDATE iil_user_stock SET qty = qty - ? WHERE username = ? AND pCode = ?", [row.cnt, row.current_owner, row.part_code]);
        }
        if (row.part_code) {
          const [uc] = await conn.execute("SELECT id FROM iil_user_stock WHERE username = ? AND pCode = ? LIMIT 1", [assignee_name, row.part_code]);
          if (uc.length > 0) {
            await conn.execute("UPDATE iil_user_stock SET qty = qty + ? WHERE username = ? AND pCode = ?", [row.cnt, assignee_name, row.part_code]);
          } else {
            await conn.execute("INSERT INTO iil_user_stock (username, pCode, qty) VALUES (?,?,?)", [assignee_name, row.part_code, row.cnt]);
          }
        }
      }

      await conn.execute(
        `UPDATE google_sheet_data SET assignee = ?, erp_status = IF(erp_status = '76' OR erp_status = 'Work in Progress', '76', '63'), assigned_by = ?, assigned_at = NOW() WHERE id IN (${placeholder})`,
        [assignee_name, currentUser, ...safeIds]
      );

    // ── RECEIVE ───────────────────────────────────────────────────────────────
    } else if (action === 'receive') {
      const [items] = await conn.execute(
        `SELECT g.model_no, p.part_code, g.assignee, COUNT(*) as cnt
         FROM google_sheet_data g
         LEFT JOIN product_master p ON TRIM(g.model_no) = TRIM(p.item_code)
         WHERE g.id IN (${placeholder}) AND (g.erp_status = '63' OR g.erp_status = 'Pending to Receive')
         GROUP BY g.model_no, p.part_code, g.assignee`,
        safeIds
      );
      await conn.execute(`UPDATE google_sheet_data SET erp_status = '76' WHERE id IN (${placeholder})`, safeIds);
      for (const row of items) {
        if (row.part_code && row.assignee) {
          await conn.execute("UPDATE iil_stock_sheet SET common = common - ?, user = user + ? WHERE pCode = ?", [row.cnt, row.cnt, row.part_code]);
          const [uc] = await conn.execute("SELECT id FROM iil_user_stock WHERE username = ? AND pCode = ? LIMIT 1", [row.assignee, row.part_code]);
          if (uc.length > 0) {
            await conn.execute("UPDATE iil_user_stock SET qty = qty + ? WHERE username = ? AND pCode = ?", [row.cnt, row.assignee, row.part_code]);
          } else {
            await conn.execute("INSERT INTO iil_user_stock (username, pCode, qty) VALUES (?,?,?)", [row.assignee, row.part_code, row.cnt]);
          }
        }
      }

    // ── WORK DONE ─────────────────────────────────────────────────────────────
    } else if (action === 'work_done') {
      const [items] = await conn.execute(
        `SELECT g.model_no, p.part_code,
         COALESCE(NULLIF(g.movement_by,''), NULLIF(g.acknowledged_by,''), NULLIF(g.work_done_by,''), NULLIF(g.assignee,'')) as current_owner,
         COUNT(*) as cnt
         FROM google_sheet_data g
         LEFT JOIN product_master p ON TRIM(g.model_no) = TRIM(p.item_code)
         WHERE g.id IN (${placeholder}) AND (g.erp_status = '76' OR g.erp_status = 'Work in Progress')
         GROUP BY g.model_no, p.part_code, current_owner`,
        safeIds
      );
      await conn.execute(`UPDATE google_sheet_data SET erp_status = '77', work_done_by = ?, work_done_at = NOW() WHERE id IN (${placeholder})`, [currentUser, ...safeIds]);
      for (const row of items) {
        if (row.part_code) {
          if (row.current_owner) await conn.execute("UPDATE iil_user_stock SET qty = qty - ? WHERE username = ? AND pCode = ?", [row.cnt, row.current_owner, row.part_code]);
          const [uc] = await conn.execute("SELECT id FROM iil_user_stock WHERE username = ? AND pCode = ? LIMIT 1", [currentUser, row.part_code]);
          if (uc.length > 0) {
            await conn.execute("UPDATE iil_user_stock SET qty = qty + ? WHERE username = ? AND pCode = ?", [row.cnt, currentUser, row.part_code]);
          } else {
            await conn.execute("INSERT INTO iil_user_stock (username, pCode, qty) VALUES (?,?,?)", [currentUser, row.part_code, row.cnt]);
          }
        }
      }

    // ── ACKNOWLEDGEMENT ───────────────────────────────────────────────────────
    } else if (action === 'acknowledgement') {
      const [items] = await conn.execute(
        `SELECT g.model_no, p.part_code,
         COALESCE(NULLIF(g.movement_by,''), NULLIF(g.acknowledged_by,''), NULLIF(g.work_done_by,''), NULLIF(g.assignee,'')) as current_owner,
         COUNT(*) as cnt
         FROM google_sheet_data g
         LEFT JOIN product_master p ON TRIM(g.model_no) = TRIM(p.item_code)
         WHERE g.id IN (${placeholder})
         GROUP BY g.model_no, p.part_code, current_owner`,
        safeIds
      );
      await conn.execute(`UPDATE google_sheet_data SET erp_status = '65', acknowledged_by = ?, acknowledged_at = NOW() WHERE id IN (${placeholder})`, [currentUser, ...safeIds]);
      for (const row of items) {
        if (row.part_code) {
          if (row.current_owner) await conn.execute("UPDATE iil_user_stock SET qty = qty - ? WHERE username = ? AND pCode = ?", [row.cnt, row.current_owner, row.part_code]);
          const [uc] = await conn.execute("SELECT id FROM iil_user_stock WHERE username = ? AND pCode = ? LIMIT 1", [currentUser, row.part_code]);
          if (uc.length > 0) {
            await conn.execute("UPDATE iil_user_stock SET qty = qty + ? WHERE username = ? AND pCode = ?", [row.cnt, currentUser, row.part_code]);
          } else {
            await conn.execute("INSERT INTO iil_user_stock (username, pCode, qty) VALUES (?,?,?)", [currentUser, row.part_code, row.cnt]);
          }
        }
      }

    // ── ROLLBACK ──────────────────────────────────────────────────────────────
    } else if (action === 'rollback') {
      await conn.execute(`UPDATE google_sheet_data SET erp_status = NULL, assignee = NULL WHERE id IN (${placeholder})`, safeIds);

    // ── MOVEMENT ──────────────────────────────────────────────────────────────
    } else if (action === 'movement') {
      if (!destination) return res.json({ status: 'error', message: 'Movement destination is required.' });

      const statusMap = { 'WH Mundka': '80', 'Client': '79', 'Store': '78' };
      const status_val = statusMap[destination] || `Movement (${destination})`;

      let attachmentPath = '';
      if (req.file) {
        attachmentPath = `uploads/movement_attachments/${req.file.filename}`;
      }

      // Fetch stock info before update
      const [items] = await conn.execute(
        `SELECT g.model_no, p.part_code,
         COALESCE(NULLIF(g.movement_by,''), NULLIF(g.acknowledged_by,''), NULLIF(g.work_done_by,''), NULLIF(g.assignee,'')) as current_owner,
         COUNT(*) as cnt
         FROM google_sheet_data g
         LEFT JOIN product_master p ON TRIM(g.model_no) = TRIM(p.item_code)
         WHERE g.id IN (${placeholder})
         GROUP BY g.model_no, p.part_code, current_owner`,
        safeIds
      );

      // Build dynamic update
      let updateFields = ['erp_status = ?', 'movement_by = ?', 'movement_at = NOW()'];
      let updateParams = [status_val, currentUser];

      if (destination === 'Client' && extra_info) { updateFields.push('client_name = ?'); updateParams.push(extra_info); }
      if (destination === 'Store' && extra_info) { updateFields.push('store_bin = ?'); updateParams.push(extra_info); }
      if (moved_to_projrctCode) { updateFields.push('moved_to_projrctCode = ?'); updateParams.push(moved_to_projrctCode); }
      if (box_number) { updateFields.push('box_number = ?'); updateParams.push(box_number); }
      if (attachmentPath) { updateFields.push('attachment = ?'); updateParams.push(attachmentPath); }

      await conn.execute(
        `UPDATE google_sheet_data SET ${updateFields.join(', ')} WHERE id IN (${placeholder})`,
        [...updateParams, ...safeIds]
      );

      // Ensure moved_sheet exists with same structure
      await conn.execute("CREATE TABLE IF NOT EXISTS moved_sheet LIKE google_sheet_data");

      // Get columns for INSERT SELECT
      const [cols] = await conn.execute("SHOW COLUMNS FROM google_sheet_data");
      const colNames = cols.map(c => `\`${c.Field}\``).join(', ');

      await conn.execute(`INSERT IGNORE INTO moved_sheet (${colNames}) SELECT ${colNames} FROM google_sheet_data WHERE id IN (${placeholder})`, safeIds);
      await conn.execute(`DELETE FROM google_sheet_data WHERE id IN (${placeholder})`, safeIds);

      // Update attachment in moved_sheet if any
      if (attachmentPath) {
        await conn.execute(`UPDATE moved_sheet SET attachment = ? WHERE id IN (${placeholder})`, [attachmentPath, ...safeIds]);
      }

      // Update stock
      for (const row of items) {
        if (row.part_code) {
          if (row.current_owner) await conn.execute("UPDATE iil_user_stock SET qty = qty - ? WHERE username = ? AND pCode = ?", [row.cnt, row.current_owner, row.part_code]);

          if (destination === 'WH Mundka') {
            await conn.execute("UPDATE iil_stock_sheet SET user = user - ?, wh_mundka = wh_mundka + ? WHERE pCode = ?", [row.cnt, row.cnt, row.part_code]);
          } else if (destination === 'Client') {
            await conn.execute("UPDATE iil_stock_sheet SET user = user - ?, client = client + ? WHERE pCode = ?", [row.cnt, row.cnt, row.part_code]);
          } else if (destination === 'Store') {
            await conn.execute("UPDATE iil_stock_sheet SET user = user - ?, store = store + ? WHERE pCode = ?", [row.cnt, row.cnt, row.part_code]);
            // Bin allocation
            if (extra_info) {
              const [binRow] = await conn.execute("SELECT bin_id FROM bin_master WHERE bin_title = ? LIMIT 1", [extra_info]);
              if (binRow.length > 0) {
                const bin_id = binRow[0].bin_id;
                const [alloc] = await conn.execute("SELECT sr_no FROM bin_allocation WHERE bin_id = ? AND part_code = ? LIMIT 1", [bin_id, row.part_code]);
                if (alloc.length > 0) {
                  await conn.execute("UPDATE bin_allocation SET qty_a = qty_a + ?, updated_at = NOW() WHERE bin_id = ? AND part_code = ?", [row.cnt, bin_id, row.part_code]);
                } else {
                  await conn.execute("INSERT INTO bin_allocation (bin_id, part_code, qty_a, qty_b, updated_by, updated_at) VALUES (?,?,?,0,?,NOW())", [bin_id, row.part_code, row.cnt, currentUser]);
                }
              }
            }
          }
        }
      }
    } else {
      return res.json({ status: 'error', message: 'Unknown action.' });
    }

    await conn.commit();
    return res.json({ status: 'success' });
  } catch (err) {
    await conn.rollback();
    console.error('doAction error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  } finally {
    conn.release();
  }
};

// ─── POST /api/google-sheet/bulk/assignee (CSV upload) ────────────────────────
const bulkAssignee = async (req, res) => {
  const conn = await db.getConnection();
  try {
    if (!req.file) return res.json({ status: 'error', message: 'Please upload a CSV file.' });

    const content = fs.readFileSync(req.file.path, 'utf8');
    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
    fs.unlinkSync(req.file.path); // cleanup

    const missingSerials = [];
    const toProcess = [];

    for (let i = 0; i < records.length; i++) {
      const serial = records[i]['Serial Number'] || '';
      const assignee = records[i]['Current User'] || '';
      if (!serial || !assignee) continue;

      const [check] = await conn.execute(
        "SELECT id FROM google_sheet_data WHERE serial_number = ? AND (erp_status = '42' OR erp_status = 'Created' OR erp_status IS NULL)",
        [serial]
      );
      if (check.length > 0) {
        toProcess.push({ serial, assignee });
      } else {
        missingSerials.push(`Line ${i + 2}: ${serial}`);
      }
    }

    if (missingSerials.length > 0) {
      return res.json({ status: 'error', message: `Upload aborted. Not found or not in Created status:\n${missingSerials.join('\n')}` });
    }

    let successCount = 0;
    for (const { serial, assignee } of toProcess) {
      const [result] = await conn.execute(
        "UPDATE google_sheet_data SET assignee = ?, erp_status = '63', assigned_by = ?, assigned_at = NOW() WHERE serial_number = ? AND (erp_status = '42' OR erp_status = 'Created' OR erp_status IS NULL)",
        [assignee, req.user.userid, serial]
      );
      if (result.affectedRows > 0) successCount++;
    }

    await conn.commit();
    return res.json({ status: 'success', message: `Successfully assigned ${successCount} records.` });
  } catch (err) {
    console.error('bulkAssignee error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  } finally {
    conn.release();
  }
};

// ─── POST /api/google-sheet/bulk/ack (CSV upload) ─────────────────────────────
const bulkAck = async (req, res) => {
  const conn = await db.getConnection();
  try {
    if (!req.file) return res.json({ status: 'error', message: 'Please upload a CSV file.' });

    const content = fs.readFileSync(req.file.path, 'utf8');
    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
    fs.unlinkSync(req.file.path);

    const invalidSerials = [];
    const toProcess = [];

    for (let i = 0; i < records.length; i++) {
      const serial = records[i]['Serial Number'] || '';
      if (!serial) continue;
      const [check] = await conn.execute(
        "SELECT id FROM google_sheet_data WHERE serial_number = ? AND (erp_status = '77' OR erp_status = 'Pending to Acknowledge')",
        [serial]
      );
      if (check.length > 0) toProcess.push(serial);
      else invalidSerials.push(`Line ${i + 2}: ${serial}`);
    }

    if (invalidSerials.length > 0) {
      return res.json({ status: 'error', message: `Upload aborted. Not found or not pending:\n${invalidSerials.join('\n')}` });
    }

    let successCount = 0;
    for (const serial of toProcess) {
      const [fetchRows] = await conn.execute(
        `SELECT g.id, p.part_code,
         COALESCE(NULLIF(g.movement_by,''), NULLIF(g.acknowledged_by,''), NULLIF(g.work_done_by,''), NULLIF(g.assignee,'')) as current_owner
         FROM google_sheet_data g
         LEFT JOIN product_master p ON TRIM(g.model_no) = TRIM(p.item_code)
         WHERE g.serial_number = ? AND (g.erp_status = '77' OR g.erp_status = 'Pending to Acknowledge')`,
        [serial]
      );
      if (fetchRows.length === 0) continue;
      const { id, part_code, current_owner } = fetchRows[0];
      const [upd] = await conn.execute(
        "UPDATE google_sheet_data SET erp_status = '65', acknowledged_by = ?, acknowledged_at = NOW() WHERE id = ?",
        [req.user.userid, id]
      );
      if (upd.affectedRows > 0) {
        successCount++;
        if (part_code) {
          if (current_owner) await conn.execute("UPDATE iil_user_stock SET qty = qty - 1 WHERE username = ? AND pCode = ?", [current_owner, part_code]);
          const [uc] = await conn.execute("SELECT id FROM iil_user_stock WHERE username = ? AND pCode = ? LIMIT 1", [req.user.userid, part_code]);
          if (uc.length > 0) {
            await conn.execute("UPDATE iil_user_stock SET qty = qty + 1 WHERE username = ? AND pCode = ?", [req.user.userid, part_code]);
          } else {
            await conn.execute("INSERT INTO iil_user_stock (username, pCode, qty) VALUES (?,?,1)", [req.user.userid, part_code]);
          }
        }
      }
    }

    await conn.commit();
    return res.json({ status: 'success', message: `Successfully acknowledged ${successCount} records.` });
  } catch (err) {
    console.error('bulkAck error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  } finally {
    conn.release();
  }
};

// ─── GET /api/google-sheet/template/:type ─────────────────────────────────────
const downloadTemplate = (req, res) => {
  const type = req.params.type;
  if (type === 'assignee') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bulk_assignee_template.csv');
    return res.send('Serial Number,Current User\n');
  }
  if (type === 'ack') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bulk_acknowledgement_template.csv');
    return res.send('Serial Number\n');
  }
  if (type === 'movement') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bulk_movement_template.csv');
    return res.send('Serial Number\nEXAMPLE12345\n');
  }
  return res.status(400).json({ status: 'error', message: 'Unknown template type.' });
};

// ─── GET /api/google-sheet/bins ───────────────────────────────────────────────
const getBinsByLocation = async (req, res) => {
  const { location } = req.query;
  if (!location) return res.json({ status: 'success', data: [] });
  const [rows] = await db.execute("SELECT bin_title FROM bin_master WHERE bin_location = ? ORDER BY bin_title ASC", [location]);
  return res.json({ status: 'success', data: rows.map(r => r.bin_title) });
};

// ─── GET /api/google-sheet/stats ──────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT erp_status, COUNT(*) as cnt FROM google_sheet_data GROUP BY erp_status ORDER BY cnt DESC"
    );
    return res.json({ status: 'success', data: rows });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { getList, doAction, bulkAssignee, bulkAck, downloadTemplate, getBinsByLocation, getStats };
