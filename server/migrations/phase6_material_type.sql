-- 1. Create the new Material Type Master table
CREATE TABLE IF NOT EXISTS material_type_master (
  id INT AUTO_INCREMENT PRIMARY KEY,
  material_type VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Alter the product_master table to include material_type_id
ALTER TABLE product_master ADD COLUMN material_type_id INT NULL AFTER product_subcat_id;

-- 3. Insert the Sub-Module into the sub_function_master (so it shows in Sidebar)
SET @func_id = (SELECT function_id FROM function_master WHERE function_name = 'Product Master' LIMIT 1);

INSERT INTO sub_function_master (function_id, sub_name, sub_seq, file_name, tab, icon_img, status, utype)
SELECT @func_id, 'Material Type Master', 4, '/products/material-type', 'Inventory', 'fa-cubes', 'Y', '2'
WHERE NOT EXISTS (SELECT 1 FROM sub_function_master WHERE sub_name = 'Material Type Master');

-- 4. Grant full rights to Admin for the new sub module
SET @sub_id = (SELECT id FROM sub_function_master WHERE sub_name = 'Material Type Master' LIMIT 1);

INSERT INTO usertype_rights (utype_id, function_id, sub_function_id, status)
SELECT '1', @func_id, @sub_id, '1'
WHERE NOT EXISTS (SELECT 1 FROM usertype_rights WHERE utype_id = '1' AND sub_function_id = @sub_id);

INSERT INTO usertype_rights (utype_id, function_id, sub_function_id, status)
SELECT 'ADMIN', @func_id, @sub_id, '1'
WHERE NOT EXISTS (SELECT 1 FROM usertype_rights WHERE utype_id = 'ADMIN' AND sub_function_id = @sub_id);
