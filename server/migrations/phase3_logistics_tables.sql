-- ============================================================
-- Logistics Management Tables Migration
-- Run in phpMyAdmin > innovatiview_new > SQL tab
-- ============================================================

-- 1. Delivery Challan (DC) Master
CREATE TABLE IF NOT EXISTS `delivery_challan` (
  `id`             INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `dc_no`          VARCHAR(100)  NOT NULL,
  `dc_date`        DATE          DEFAULT NULL,
  `dc_type`        VARCHAR(50)   DEFAULT 'Outward',
  `client_name`    VARCHAR(255)  NOT NULL,
  `from_location`  VARCHAR(255)  DEFAULT NULL,
  `to_location`    VARCHAR(255)  DEFAULT NULL,
  `courier_name`   VARCHAR(100)  DEFAULT NULL,
  `docket_no`      VARCHAR(100)  DEFAULT NULL,
  `total_qty`      VARCHAR(50)   DEFAULT '0',
  `total_weight`   VARCHAR(50)   DEFAULT '0',
  `status`         VARCHAR(50)   DEFAULT 'Dispatched',
  `remarks`        TEXT          DEFAULT NULL,
  `created_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- 2. Goods Receipt Note (GRN / Inward Logistics)
CREATE TABLE IF NOT EXISTS `goods_receipt_note` (
  `id`             INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `grn_no`         VARCHAR(100)  NOT NULL,
  `grn_date`       DATE          DEFAULT NULL,
  `vendor_name`    VARCHAR(255)  NOT NULL,
  `po_no`          VARCHAR(100)  DEFAULT NULL,
  `invoice_no`     VARCHAR(100)  DEFAULT NULL,
  `warehouse_name` VARCHAR(255)  DEFAULT NULL,
  `received_qty`   VARCHAR(50)   DEFAULT '0',
  `accepted_qty`   VARCHAR(50)   DEFAULT '0',
  `rejected_qty`   VARCHAR(50)   DEFAULT '0',
  `status`         VARCHAR(50)   DEFAULT 'Verified',
  `remarks`        TEXT          DEFAULT NULL,
  `created_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- 3. Return DC / Reverse Logistics
CREATE TABLE IF NOT EXISTS `return_dc_master` (
  `id`             INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `return_dc_no`   VARCHAR(100)  NOT NULL,
  `return_date`    DATE          DEFAULT NULL,
  `client_name`    VARCHAR(255)  NOT NULL,
  `reason`         VARCHAR(255)  DEFAULT NULL,
  `from_city`      VARCHAR(100)  DEFAULT NULL,
  `to_warehouse`   VARCHAR(100)  DEFAULT NULL,
  `courier_name`   VARCHAR(100)  DEFAULT NULL,
  `docket_no`      VARCHAR(100)  DEFAULT NULL,
  `status`         VARCHAR(50)   DEFAULT 'Pending Pickup',
  `created_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- 4. Dispatch & Shipment Tracking
CREATE TABLE IF NOT EXISTS `logistics_shipment` (
  `id`             INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `awb_number`     VARCHAR(100)  NOT NULL,
  `courier_name`   VARCHAR(100)  NOT NULL,
  `ref_doc_no`     VARCHAR(100)  DEFAULT NULL,
  `origin_pin`     VARCHAR(10)   DEFAULT NULL,
  `dest_pin`       VARCHAR(10)   DEFAULT NULL,
  `weight_kg`      DECIMAL(10,2) DEFAULT 0.00,
  `shipping_mode`  VARCHAR(50)   DEFAULT 'Surface',
  `shipment_cost`  DECIMAL(12,2) DEFAULT 0.00,
  `dispatch_date`  DATE          DEFAULT NULL,
  `delivery_status`VARCHAR(50)   DEFAULT 'In Transit',
  `delivery_date`  DATE          DEFAULT NULL,
  `status`         VARCHAR(5)    DEFAULT '1',
  `created_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- 5. Courier Rate & Contract Master
CREATE TABLE IF NOT EXISTS `courier_rate_master` (
  `id`             INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `courier_name`   VARCHAR(100)  NOT NULL,
  `mode`           VARCHAR(50)   DEFAULT 'Surface',
  `min_weight_kg`  DECIMAL(10,2) DEFAULT 0.50,
  `base_rate`      DECIMAL(10,2) DEFAULT 50.00,
  `per_kg_rate`    DECIMAL(10,2) DEFAULT 20.00,
  `fuel_surcharge` DECIMAL(5,2)  DEFAULT 10.00,
  `status`         VARCHAR(5)    DEFAULT '1',
  `created_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);
