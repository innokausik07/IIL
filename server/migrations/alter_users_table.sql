-- Run this SQL in phpMyAdmin to update the `users` table
-- with all the fields from the Create User form

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `emp_id`     VARCHAR(100) DEFAULT NULL AFTER `full_name`,
  ADD COLUMN IF NOT EXISTS `utype`      VARCHAR(10)  DEFAULT '9' AFTER `emp_id`,
  ADD COLUMN IF NOT EXISTS `owner`      VARCHAR(100) DEFAULT NULL AFTER `utype`,
  ADD COLUMN IF NOT EXISTS `mobile`     VARCHAR(50)  DEFAULT NULL AFTER `email`,
  ADD COLUMN IF NOT EXISTS `alt_mobile` VARCHAR(50)  DEFAULT NULL AFTER `mobile`,
  ADD COLUMN IF NOT EXISTS `status`     VARCHAR(5)   DEFAULT '1' AFTER `alt_mobile`,
  ADD COLUMN IF NOT EXISTS `profile_img` VARCHAR(255) DEFAULT NULL AFTER `status`;

-- Expected final columns:
-- id, full_name, emp_id, utype, owner, email, password, mobile, alt_mobile, status, profile_img, created_at
