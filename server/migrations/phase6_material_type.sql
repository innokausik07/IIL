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
-- Make sure to run this safely (it will add the column if it does not exist)
ALTER TABLE product_master ADD COLUMN material_type_id INT NULL AFTER product_subcat_id;

-- 3. Insert the Sub-Module into the Access Functions (so it shows in Sidebar)
-- Replace the '19' with the actual function_id of 'Product Management' if it is different.
SET @func_id = (SELECT id FROM access_functions WHERE function_name LIKE '%Product%' LIMIT 1);

INSERT INTO access_sub_functions (function_id, sub_name, sub_seq, file_name, tab, icon_img, status)
SELECT @func_id, 'Material Type Master', 3, '/products/material-type', 'tab1', 'fa fa-cubes', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM access_sub_functions WHERE sub_name = 'Material Type Master');

-- 4. Grant full rights to Admin (user_type_id = 1) for the new sub module
SET @sub_id = (SELECT id FROM access_sub_functions WHERE sub_name = 'Material Type Master' LIMIT 1);

INSERT INTO user_type_rights (user_type_id, sub_function_id, r_view, r_add, r_edit, r_delete, r_print)
SELECT 1, @sub_id, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM user_type_rights WHERE user_type_id = 1 AND sub_function_id = @sub_id);
