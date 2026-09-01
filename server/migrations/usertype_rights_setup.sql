-- ============================================================
-- Create usertype_rights table for User-Type based permissions
-- ============================================================

CREATE TABLE IF NOT EXISTS `usertype_rights` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `utype_id`        VARCHAR(50)  NOT NULL,
  `function_id`     VARCHAR(50)  DEFAULT NULL,
  `sub_function_id` INT          NOT NULL,
  `status`          VARCHAR(5)   DEFAULT '1',
  `created_at`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_utype` (`utype_id`),
  INDEX `idx_sub_fn` (`sub_function_id`)
);

-- Seed Default User-Type Presets based on exact sub_function_master IDs
-- 1. Admin (Full access to all sub-functions 1 to 41)
INSERT IGNORE INTO `usertype_rights` (`utype_id`, `function_id`, `sub_function_id`, `status`)
SELECT '1', function_id, id, '1' FROM `sub_function_master` WHERE status = 'Y';

INSERT IGNORE INTO `usertype_rights` (`utype_id`, `function_id`, `sub_function_id`, `status`)
SELECT 'ADMIN', function_id, id, '1' FROM `sub_function_master` WHERE status = 'Y';
