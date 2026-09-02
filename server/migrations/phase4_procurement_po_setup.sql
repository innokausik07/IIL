-- ============================================================
-- Phase 4: Procurement & Purchase Order (PO) Management
-- ============================================================

CREATE TABLE IF NOT EXISTS `purchase_order` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `po_no`          VARCHAR(50)  NOT NULL UNIQUE,
  `po_date`        DATE         NOT NULL,
  `vendor_id`      INT          NOT NULL,
  `plant_id`       INT UNSIGNED NULL,
  `delivery_date`  DATE         NULL,
  `payment_terms`  VARCHAR(100) NULL,
  `subtotal`       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax_percent`    DECIMAL(5,2)  NOT NULL DEFAULT 18.00,
  `tax_amount`     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_amount`   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status`         VARCHAR(30)   NOT NULL DEFAULT 'Draft', -- 'Draft', 'Approved', 'Partially Received', 'Completed', 'Cancelled'
  `remarks`        TEXT          NULL,
  `created_by`     INT           NULL,
  `approved_by`    INT           NULL,
  `approved_at`    DATETIME      NULL,
  `created_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_vendor` (`vendor_id`),
  INDEX `idx_plant` (`plant_id`),
  INDEX `idx_status` (`status`)
);

CREATE TABLE IF NOT EXISTS `purchase_order_lines` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `po_id`          INT UNSIGNED NOT NULL,
  `product_id`     INT          NULL,
  `item_name`      VARCHAR(255) NOT NULL,
  `part_code`      VARCHAR(100) NULL,
  `qty_ordered`    INT          NOT NULL DEFAULT 1,
  `qty_received`   INT          NOT NULL DEFAULT 0,
  `unit_price`     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_price`    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_po` (`po_id`)
);
