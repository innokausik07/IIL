const db = require('./config/db');

async function migrate() {
  try {
    console.log('Creating material_type_master table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS material_type_master (
        id INT AUTO_INCREMENT PRIMARY KEY,
        material_type VARCHAR(100) NOT NULL,
        description VARCHAR(255),
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('Altering product_master...');
    try {
      await db.query(`ALTER TABLE product_master ADD COLUMN material_type_id INT NULL AFTER product_subcat_id`);
      console.log('Added material_type_id to product_master.');
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('material_type_id already exists in product_master.');
      } else {
        throw e;
      }
    }

    // Get function ID for product management
    const [functions] = await db.query(`SELECT id FROM access_functions WHERE function_name LIKE '%Product%' LIMIT 1`);
    if (functions.length > 0) {
      const funcId = functions[0].id;
      // Check if sub-function already exists
      const [subs] = await db.query(`SELECT id FROM access_sub_functions WHERE sub_name = 'Material Type Master'`);
      if (subs.length === 0) {
        console.log('Inserting into access_sub_functions...');
        await db.query(`
          INSERT INTO access_sub_functions (function_id, sub_name, sub_seq, file_name, tab, icon_img, status)
          VALUES (?, 'Material Type Master', 3, '/products/material-type', 'tab1', 'fa fa-cubes', 'Active')
        `, [funcId]);
        
        // Give rights to super admin (user_type_id = 1)
        const [newSubs] = await db.query(`SELECT id FROM access_sub_functions WHERE sub_name = 'Material Type Master'`);
        const subId = newSubs[0].id;
        await db.query(`
          INSERT INTO user_type_rights (user_type_id, sub_function_id, r_view, r_add, r_edit, r_delete, r_print)
          VALUES (1, ?, 1, 1, 1, 1, 1)
        `, [subId]);
      } else {
        console.log('Sub-function Material Type already exists.');
      }
    }

    console.log('Migration successful.');
    process.exit(0);
  } catch(e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
}

migrate();
