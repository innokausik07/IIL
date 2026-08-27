-- Rename uid to emp_id in access_function table
ALTER TABLE `access_function` CHANGE COLUMN `uid` `emp_id` VARCHAR(100) NULL;

-- Ensure sub_function_id column is present
ALTER TABLE `access_function` ADD COLUMN IF NOT EXISTS `sub_function_id` VARCHAR(50) NULL AFTER `function_id`;
