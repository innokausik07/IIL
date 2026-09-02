-- ============================================================
-- Fix: Ensure all product_master columns exist in database
-- Run in phpMyAdmin > innovatiview_new > SQL tab
-- ============================================================

ALTER TABLE `product_master`
  ADD COLUMN IF NOT EXISTS `product_name`        VARCHAR(255)  NULL,
  ADD COLUMN IF NOT EXISTS `part_code`           VARCHAR(100)  NULL,
  ADD COLUMN IF NOT EXISTS `item_code`           VARCHAR(100)  NULL,
  ADD COLUMN IF NOT EXISTS `product_category_id` VARCHAR(50)   NULL,
  ADD COLUMN IF NOT EXISTS `product_subcat_id`   VARCHAR(50)   NULL,
  ADD COLUMN IF NOT EXISTS `brand_id`            VARCHAR(50)   NULL,
  ADD COLUMN IF NOT EXISTS `model`               VARCHAR(100)  NULL,
  ADD COLUMN IF NOT EXISTS `hsn_code`            VARCHAR(50)   NULL,
  ADD COLUMN IF NOT EXISTS `product_color`       VARCHAR(50)   NULL,
  ADD COLUMN IF NOT EXISTS `product_type`        VARCHAR(50)   DEFAULT 'UNIT',
  ADD COLUMN IF NOT EXISTS `is_serialize`        VARCHAR(5)    DEFAULT 'Y',
  ADD COLUMN IF NOT EXISTS `product_description` TEXT          NULL,
  ADD COLUMN IF NOT EXISTS `warranty_days`       VARCHAR(20)   NULL,
  ADD COLUMN IF NOT EXISTS `warranty_terms`      VARCHAR(255)  NULL,
  ADD COLUMN IF NOT EXISTS `status_id`           VARCHAR(5)    DEFAULT '1';
