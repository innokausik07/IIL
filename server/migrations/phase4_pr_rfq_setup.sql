-- ============================================================
-- Phase 4B: Purchase Requisition (PR) & Request for Quotation (RFQ)
-- ============================================================

-- Purchase Requisition (PR)
CREATE TABLE IF NOT EXISTS `purchase_requisitions` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `pr_no`          VARCHAR(50)  NOT NULL UNIQUE,
  `pr_date`        DATE         NOT NULL,
  `plant_id`       INT UNSIGNED NULL,
  `requested_by`   INT          NULL,
  `status`         VARCHAR(30)  NOT NULL DEFAULT 'Draft', -- 'Draft', 'Pending Approval', 'Approved', 'RFQ Created', 'PO Created', 'Rejected'
  `remarks`        TEXT         NULL,
  `created_by`     INT          NULL,
  `approved_by`    INT          NULL,
  `approved_at`    DATETIME     NULL,
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_plant` (`plant_id`),
  INDEX `idx_status` (`status`)
);

CREATE TABLE IF NOT EXISTS `purchase_requisition_lines` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `pr_id`          INT UNSIGNED NOT NULL,
  `product_id`     INT          NULL,
  `item_name`      VARCHAR(255) NOT NULL,
  `qty_requested`  INT          NOT NULL DEFAULT 1,
  `expected_date`  DATE         NULL,
  `remarks`        TEXT         NULL,
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pr` (`pr_id`)
);

-- Request for Quotation (RFQ)
CREATE TABLE IF NOT EXISTS `rfqs` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `rfq_no`         VARCHAR(50)  NOT NULL UNIQUE,
  `rfq_date`       DATE         NOT NULL,
  `pr_id`          INT UNSIGNED NULL,
  `deadline_date`  DATE         NULL,
  `status`         VARCHAR(30)  NOT NULL DEFAULT 'Draft', -- 'Draft', 'Published', 'Closed', 'Awarded'
  `remarks`        TEXT         NULL,
  `created_by`     INT          NULL,
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pr_id` (`pr_id`),
  INDEX `idx_status` (`status`)
);

CREATE TABLE IF NOT EXISTS `rfq_lines` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `rfq_id`         INT UNSIGNED NOT NULL,
  `product_id`     INT          NULL,
  `item_name`      VARCHAR(255) NOT NULL,
  `qty_requested`  INT          NOT NULL DEFAULT 1,
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_rfq` (`rfq_id`)
);

CREATE TABLE IF NOT EXISTS `rfq_vendors` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `rfq_id`         INT UNSIGNED NOT NULL,
  `vendor_id`      INT          NOT NULL,
  `quote_amount`   DECIMAL(12,2) NULL, -- Optional, until they provide a quote
  `is_awarded`     TINYINT(1)   NOT NULL DEFAULT 0,
  `status`         VARCHAR(30)  NOT NULL DEFAULT 'Pending', -- 'Pending', 'Submitted', 'Rejected'
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX `idx_rfq_vendor` (`rfq_id`, `vendor_id`)
);
