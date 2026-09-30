-- 1. Create the new Specification Master table
CREATE TABLE IF NOT EXISTS specification_master (
  id INT AUTO_INCREMENT PRIMARY KEY,
  material_type_id INT NOT NULL,
  specification_name VARCHAR(255) NOT NULL,
  description VARCHAR(255),
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 1b. Alter the product_master table to include specification_id
ALTER TABLE product_master ADD COLUMN specification_id INT NULL AFTER material_type_id;

-- 2. Insert the Sub-Module into the sub_function_master (so it shows in Sidebar)
SET @func_id = (SELECT function_id FROM function_master WHERE function_name = 'Product Master' LIMIT 1);

INSERT INTO sub_function_master (function_id, sub_name, sub_seq, file_name, tab, icon_img, status, utype)
SELECT @func_id, 'Specification Master', 5, '/products/specification-master', 'Inventory', 'fa-list-alt', 'Y', '2'
WHERE NOT EXISTS (SELECT 1 FROM sub_function_master WHERE sub_name = 'Specification Master');

-- 3. Grant full rights to Admin for the new sub module
SET @sub_id = (SELECT id FROM sub_function_master WHERE sub_name = 'Specification Master' LIMIT 1);

INSERT INTO usertype_rights (utype_id, function_id, sub_function_id, status)
SELECT '1', @func_id, @sub_id, '1'
WHERE NOT EXISTS (SELECT 1 FROM usertype_rights WHERE utype_id = '1' AND sub_function_id = @sub_id);

INSERT INTO usertype_rights (utype_id, function_id, sub_function_id, status)
SELECT 'ADMIN', @func_id, @sub_id, '1'
WHERE NOT EXISTS (SELECT 1 FROM usertype_rights WHERE utype_id = 'ADMIN' AND sub_function_id = @sub_id);
