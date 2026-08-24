-- ============================================================
-- Phase 1: Master Data Tables
-- Run in phpMyAdmin > innovatiview_new > SQL tab
-- ============================================================

-- 1. State Master
CREATE TABLE IF NOT EXISTS `state_master` (
  `sno`       INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `state`     VARCHAR(100) NOT NULL,
  `zone`      VARCHAR(50)  DEFAULT NULL,
  `code`      VARCHAR(10)  DEFAULT NULL,
  `statecode` VARCHAR(10)  DEFAULT NULL,
  `country`   VARCHAR(50)  DEFAULT 'India',
  `status`    VARCHAR(5)   DEFAULT '1',
  `created_at` TIMESTAMP  DEFAULT CURRENT_TIMESTAMP
);

-- 2. City / District Master
CREATE TABLE IF NOT EXISTS `district_master` (
  `id`         INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `city`       VARCHAR(100) NOT NULL,
  `state`      VARCHAR(100) DEFAULT NULL,
  `country`    VARCHAR(50)  DEFAULT 'India',
  `status`     VARCHAR(5)   DEFAULT 'A',
  `created_at` TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- 3. Brand / Make Master
CREATE TABLE IF NOT EXISTS `make_master` (
  `id`          INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `make`        VARCHAR(255) NOT NULL,
  `subcat_id`   VARCHAR(255) DEFAULT NULL,
  `status`      VARCHAR(5)   DEFAULT '1',
  `create_date` TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- 4. Color Master
CREATE TABLE IF NOT EXISTS `color_master` (
  `id`         INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `color_name` VARCHAR(100) NOT NULL,
  `color_code` VARCHAR(20)  DEFAULT NULL,
  `status`     VARCHAR(5)   DEFAULT '1',
  `created_at` TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tax / HSN Master
CREATE TABLE IF NOT EXISTS `tax_hsn_master` (
  `sno`             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `chapter_no`      VARCHAR(50)  DEFAULT NULL,
  `hsn_description` TEXT         DEFAULT NULL,
  `hsn_code`        VARCHAR(50)  NOT NULL,
  `sgst`            VARCHAR(10)  DEFAULT NULL,
  `igst`            VARCHAR(10)  DEFAULT NULL,
  `cgst`            VARCHAR(10)  DEFAULT NULL,
  `status`          VARCHAR(5)   DEFAULT '1',
  `create_by`       VARCHAR(100) DEFAULT NULL,
  `create_date`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 6. Courier / DIESL Master
CREATE TABLE IF NOT EXISTS `diesl_master` (
  `sno`           INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `couriername`   VARCHAR(255) NOT NULL,
  `couriercode`   VARCHAR(50)  DEFAULT NULL,
  `contact_person` VARCHAR(255) DEFAULT NULL,
  `email`         VARCHAR(255) DEFAULT NULL,
  `phone`         VARCHAR(50)  DEFAULT NULL,
  `addrs`         TEXT         DEFAULT NULL,
  `city`          VARCHAR(100) DEFAULT NULL,
  `state`         VARCHAR(100) DEFAULT NULL,
  `gstin`         VARCHAR(50)  DEFAULT NULL,
  `status`        VARCHAR(5)   DEFAULT '1',
  `created_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 7. Parameter Master
CREATE TABLE IF NOT EXISTS `parameter_master` (
  `id`         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `param_name` VARCHAR(255) NOT NULL,
  `param_value` VARCHAR(255) DEFAULT NULL,
  `param_type` VARCHAR(100) DEFAULT NULL,
  `status`     VARCHAR(5)   DEFAULT '1',
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
