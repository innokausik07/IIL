-- ============================================================
-- Complete ERP Modules SQL Migration
-- Run in phpMyAdmin > innovatiview_new > SQL tab
-- ============================================================

-- 1. Product Category Master
CREATE TABLE IF NOT EXISTS `product_cat_master` (
  `catid`       INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `cat_name`    VARCHAR(255)  NOT NULL,
  `short_code`  VARCHAR(50)   DEFAULT NULL,
  `status`      VARCHAR(5)    DEFAULT '1',
  `createdate`  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- 2. Product Sub-Category Master
CREATE TABLE IF NOT EXISTS `product_sub_category` (
  `psubcatid`        INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `prod_sub_cat`     VARCHAR(255)  NOT NULL,
  `productid`        VARCHAR(50)   DEFAULT NULL,
  `product_category` VARCHAR(255)  DEFAULT NULL,
  `status`           VARCHAR(5)    DEFAULT '1',
  `createdate`       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- 3. Product / Item Master
CREATE TABLE IF NOT EXISTS `product_master` (
  `id`                  INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `part_code`           VARCHAR(100)  DEFAULT NULL,
  `item_code`           VARCHAR(100)  DEFAULT NULL,
  `product_name`        VARCHAR(255)  NOT NULL,
  `product_category_id` VARCHAR(50)   DEFAULT NULL,
  `product_subcat_id`   VARCHAR(50)   DEFAULT NULL,
  `brand_id`            VARCHAR(50)   DEFAULT NULL,
  `model`               VARCHAR(100)  DEFAULT NULL,
  `hsn_code`            VARCHAR(50)   DEFAULT NULL,
  `product_color`       VARCHAR(50)   DEFAULT NULL,
  `product_type`        VARCHAR(50)   DEFAULT 'UNIT',
  `is_serialize`        VARCHAR(5)    DEFAULT 'Y',
  `product_description` TEXT          DEFAULT NULL,
  `warranty_days`       VARCHAR(20)   DEFAULT NULL,
  `warranty_terms`      VARCHAR(255)  DEFAULT NULL,
  `status_id`           VARCHAR(5)    DEFAULT '1',
  `entry_date`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- 4. BOM (Bill of Materials) Master
CREATE TABLE IF NOT EXISTS `bom_master` (
  `id`             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `bom_no`         VARCHAR(100) DEFAULT NULL,
  `product_name`   VARCHAR(255) NOT NULL,
  `part_code`      VARCHAR(100) DEFAULT NULL,
  `subcat_name`    VARCHAR(255) DEFAULT NULL,
  `qty`            VARCHAR(50)  DEFAULT '1',
  `status`         VARCHAR(5)   DEFAULT '1',
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 5. Price Master
CREATE TABLE IF NOT EXISTS `price_master` (
  `id`             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `part_code`      VARCHAR(100) NOT NULL,
  `product_name`   VARCHAR(255) DEFAULT NULL,
  `purchase_price` DECIMAL(12,2) DEFAULT 0.00,
  `selling_price`  DECIMAL(12,2) DEFAULT 0.00,
  `rental_price`   DECIMAL(12,2) DEFAULT 0.00,
  `status`         VARCHAR(5)   DEFAULT '1',
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 6. Vendor Master
CREATE TABLE IF NOT EXISTS `vendor_master` (
  `sno`             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `id`              VARCHAR(100) DEFAULT NULL,
  `name`            VARCHAR(255) NOT NULL,
  `type`            VARCHAR(50)  DEFAULT NULL,
  `contact_name`    VARCHAR(255) DEFAULT NULL,
  `phone`           VARCHAR(50)  DEFAULT NULL,
  `alt_number`      VARCHAR(50)  DEFAULT NULL,
  `email`           VARCHAR(255) DEFAULT NULL,
  `address`         TEXT         DEFAULT NULL,
  `city`            VARCHAR(100) DEFAULT NULL,
  `state`           VARCHAR(100) DEFAULT NULL,
  `country`         VARCHAR(100) DEFAULT 'India',
  `pincode`         VARCHAR(20)  DEFAULT NULL,
  `gstin_no`        VARCHAR(50)  DEFAULT NULL,
  `business_nature` VARCHAR(100) DEFAULT NULL,
  `payment_terms`   VARCHAR(255) DEFAULT NULL,
  `bank`            VARCHAR(100) DEFAULT NULL,
  `acct_number`     VARCHAR(100) DEFAULT NULL,
  `ifsc`            VARCHAR(50)  DEFAULT NULL,
  `status`          VARCHAR(5)   DEFAULT '1',
  `created_date`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 7. Client Master
CREATE TABLE IF NOT EXISTS `client_master` (
  `id`              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `client_code`     VARCHAR(100) DEFAULT NULL,
  `client_name`     VARCHAR(255) NOT NULL,
  `contact_person`  VARCHAR(255) DEFAULT NULL,
  `phone`           VARCHAR(50)  DEFAULT NULL,
  `email`           VARCHAR(255) DEFAULT NULL,
  `city`            VARCHAR(100) DEFAULT NULL,
  `state`           VARCHAR(100) DEFAULT NULL,
  `address`         TEXT         DEFAULT NULL,
  `gstin`           VARCHAR(50)  DEFAULT NULL,
  `status`          VARCHAR(5)   DEFAULT '1',
  `created_at`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 8. Lead Master
CREATE TABLE IF NOT EXISTS `lead_master` (
  `id`              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `lead_no`         VARCHAR(100) DEFAULT NULL,
  `lead_title`      VARCHAR(255) NOT NULL,
  `client_name`     VARCHAR(255) DEFAULT NULL,
  `contact_person`  VARCHAR(255) DEFAULT NULL,
  `phone`           VARCHAR(50)  DEFAULT NULL,
  `email`           VARCHAR(255) DEFAULT NULL,
  `source`          VARCHAR(100) DEFAULT NULL,
  `lead_status`     VARCHAR(50)  DEFAULT 'NEW',
  `expected_value`  DECIMAL(12,2) DEFAULT 0.00,
  `remarks`         TEXT         DEFAULT NULL,
  `created_at`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 9. Quotation Master
CREATE TABLE IF NOT EXISTS `quot_master` (
  `id`              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `quot_no`         VARCHAR(100) NOT NULL,
  `client_name`     VARCHAR(255) NOT NULL,
  `quot_date`       DATE         DEFAULT NULL,
  `total_amount`    DECIMAL(12,2) DEFAULT 0.00,
  `tax_amount`      DECIMAL(12,2) DEFAULT 0.00,
  `net_amount`      DECIMAL(12,2) DEFAULT 0.00,
  `status`          VARCHAR(50)  DEFAULT 'Draft',
  `created_at`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 10. RFP (Request For Proposal) Master
CREATE TABLE IF NOT EXISTS `rfp_master` (
  `id`              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `rfp_no`          VARCHAR(100) NOT NULL,
  `title`           VARCHAR(255) NOT NULL,
  `client_name`     VARCHAR(255) DEFAULT NULL,
  `submission_date` DATE         DEFAULT NULL,
  `estimated_value` DECIMAL(12,2) DEFAULT 0.00,
  `status`          VARCHAR(50)  DEFAULT 'Open',
  `created_at`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 11. Bin Master
CREATE TABLE IF NOT EXISTS `bin_master` (
  `id`              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `bin_name`        VARCHAR(100) NOT NULL,
  `location_name`   VARCHAR(255) DEFAULT NULL,
  `warehouse`       VARCHAR(100) DEFAULT NULL,
  `status`          VARCHAR(5)   DEFAULT '1',
  `created_at`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 12. ASP (Authorized Service Partner) Master
CREATE TABLE IF NOT EXISTS `asp_master` (
  `id`              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `asp_name`        VARCHAR(255) NOT NULL,
  `contact_person`  VARCHAR(255) DEFAULT NULL,
  `phone`           VARCHAR(50)  DEFAULT NULL,
  `email`           VARCHAR(255) DEFAULT NULL,
  `city`            VARCHAR(100) DEFAULT NULL,
  `state`           VARCHAR(100) DEFAULT NULL,
  `status`          VARCHAR(5)   DEFAULT '1',
  `created_at`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
