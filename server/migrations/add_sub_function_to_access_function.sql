-- Add sub_function_id column to access_function table if not present
ALTER TABLE `access_function` 
ADD COLUMN IF NOT EXISTS `sub_function_id` VARCHAR(50) NULL AFTER `function_id`;
