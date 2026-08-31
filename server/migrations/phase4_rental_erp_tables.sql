-- ============================================================
-- Phase 4: IT Rental ERP — New Tables Migration
-- Run in phpMyAdmin > innovatiview_new > SQL tab
-- Safe: uses CREATE TABLE IF NOT EXISTS + ALTER ... ADD COLUMN IF NOT EXISTS
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- SECTION A: ALTER EXISTING TABLES
-- ─────────────────────────────────────────────────────────────

-- A1. users — add org hierarchy & role fields
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `designation`  VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `org_unit_id`  INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `location_id`  INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `reporting_to` INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `updated_at`   TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP;

-- A2. locations — add hierarchy tree support
ALTER TABLE `locations`
  ADD COLUMN IF NOT EXISTS `loc_code`            VARCHAR(30)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `type_id`             INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `parent_loc_id`       INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `level`               INT          DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `company_id`          INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `org_unit_id`         INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `responsible_user_id` INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `updated_at`          TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP;

-- A3. client_master — add rental fields
ALTER TABLE `client_master`
  ADD COLUMN IF NOT EXISTS `credit_limit`  DECIMAL(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS `payment_terms` INT           DEFAULT 30,
  ADD COLUMN IF NOT EXISTS `updated_at`    TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP;

-- A4. product_master — add rental pricing (appended at end, safe for any column order)
ALTER TABLE `product_master`
  ADD COLUMN IF NOT EXISTS `rental_price`     DECIMAL(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS `security_deposit` DECIMAL(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS `is_rentable`      TINYINT(1)    DEFAULT 1;

-- A5. quot_master — link to lead, client, rental plan
ALTER TABLE `quot_master`
  ADD COLUMN IF NOT EXISTS `lead_id`        INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `client_id`      INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `rental_plan_id` INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `validity_days`  INT          DEFAULT 30,
  ADD COLUMN IF NOT EXISTS `created_by`     INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `updated_at`     TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP;

-- A6. goods_receipt_note — link to vendor_master and location
ALTER TABLE `goods_receipt_note`
  ADD COLUMN IF NOT EXISTS `vendor_id`   INT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `location_id` INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_by`  INT UNSIGNED DEFAULT NULL;

-- A7. delivery_challan — link to rental order
ALTER TABLE `delivery_challan`
  ADD COLUMN IF NOT EXISTS `rental_order_id` INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_by`      INT UNSIGNED DEFAULT NULL;

-- ─────────────────────────────────────────────────────────────
-- SECTION B: NEW TABLES — Organization Hierarchy
-- ─────────────────────────────────────────────────────────────

-- B1. Organization Level Master
CREATE TABLE IF NOT EXISTS `org_levels` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `level_code`      VARCHAR(20)  NOT NULL,
  `level_name`      VARCHAR(100) NOT NULL,
  `level_order`     INT          NOT NULL DEFAULT 1,
  `parent_level_id` INT UNSIGNED DEFAULT NULL,
  `status`          VARCHAR(5)   DEFAULT '1',
  `created_at`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_level_code` (`level_code`)
);

-- B2. Organization Unit Master (Region / Zone / Branch / Dept / Team)
CREATE TABLE IF NOT EXISTS `org_units` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `unit_code`       VARCHAR(30)  NOT NULL,
  `unit_name`       VARCHAR(200) NOT NULL,
  `level_id`        INT UNSIGNED NOT NULL,
  `parent_unit_id`  INT UNSIGNED DEFAULT NULL,
  `company_id`      INT UNSIGNED DEFAULT NULL,
  `head_user_id`    INT UNSIGNED DEFAULT NULL,
  `status`          VARCHAR(5)   DEFAULT '1',
  `created_by`      INT UNSIGNED DEFAULT NULL,
  `created_at`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_unit_code` (`unit_code`)
);

-- ─────────────────────────────────────────────────────────────
-- SECTION C: NEW TABLES — Location Hierarchy
-- ─────────────────────────────────────────────────────────────

-- C1. Location Type Master
CREATE TABLE IF NOT EXISTS `location_types` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `type_code`  VARCHAR(20)  NOT NULL,
  `type_name`  VARCHAR(100) NOT NULL,
  `status`     VARCHAR(5)   DEFAULT '1',
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_type_code` (`type_code`)
);

-- ─────────────────────────────────────────────────────────────
-- SECTION D: NEW TABLES — Asset Management
-- ─────────────────────────────────────────────────────────────

-- D1. Asset Status Master
CREATE TABLE IF NOT EXISTS `asset_status_master` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `status_code`  VARCHAR(30)  NOT NULL,
  `status_name`  VARCHAR(100) NOT NULL,
  `color`        VARCHAR(20)  DEFAULT '#888888',
  `is_available` TINYINT(1)   DEFAULT 0,
  `is_rented`    TINYINT(1)   DEFAULT 0,
  `sort_order`   INT          DEFAULT 0,
  `status`       VARCHAR(5)   DEFAULT '1',
  `created_at`   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_status_code` (`status_code`)
);

-- D2. Asset Condition Master
CREATE TABLE IF NOT EXISTS `asset_condition_master` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `cond_code`  VARCHAR(20)  NOT NULL,
  `cond_name`  VARCHAR(100) NOT NULL,
  `status`     VARCHAR(5)   DEFAULT '1',
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_cond_code` (`cond_code`)
);

-- D3. Asset Master (physical units: AST-000001)
CREATE TABLE IF NOT EXISTS `asset_master` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `asset_code`       VARCHAR(50)  NOT NULL,
  `serial_no`        VARCHAR(100) DEFAULT NULL,
  `product_id`       INT UNSIGNED NOT NULL,
  `vendor_id`        INT          DEFAULT NULL,
  `current_loc_id`   INT UNSIGNED DEFAULT NULL,
  `custodian_id`     INT UNSIGNED DEFAULT NULL,
  `asset_status_id`  INT UNSIGNED DEFAULT NULL,
  `condition_id`     INT UNSIGNED DEFAULT NULL,
  `purchase_date`    DATE         DEFAULT NULL,
  `purchase_cost`    DECIMAL(15,2) DEFAULT 0.00,
  `purchase_ref`     VARCHAR(100) DEFAULT NULL,
  `warranty_expiry`  DATE         DEFAULT NULL,
  `notes`            TEXT         DEFAULT NULL,
  `status`           VARCHAR(5)   DEFAULT '1',
  `created_by`       INT UNSIGNED DEFAULT NULL,
  `created_at`       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`       TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY `uk_asset_code` (`asset_code`)
);

-- D4. Asset Movement History (append-only)
CREATE TABLE IF NOT EXISTS `asset_movements` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `asset_id`       INT UNSIGNED NOT NULL,
  `from_loc_id`    INT UNSIGNED DEFAULT NULL,
  `to_loc_id`      INT UNSIGNED DEFAULT NULL,
  `movement_type`  VARCHAR(50)  NOT NULL,
  `from_status`    INT UNSIGNED DEFAULT NULL,
  `to_status`      INT UNSIGNED DEFAULT NULL,
  `ref_doc_type`   VARCHAR(50)  DEFAULT NULL,
  `ref_doc_id`     INT UNSIGNED DEFAULT NULL,
  `moved_by`       INT UNSIGNED DEFAULT NULL,
  `approved_by`    INT UNSIGNED DEFAULT NULL,
  `moved_at`       DATETIME     NOT NULL DEFAULT NOW(),
  `remarks`        TEXT         DEFAULT NULL,
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- D5. Asset Status History (append-only)
CREATE TABLE IF NOT EXISTS `asset_status_history` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `asset_id`     INT UNSIGNED NOT NULL,
  `from_status`  INT UNSIGNED DEFAULT NULL,
  `to_status`    INT UNSIGNED DEFAULT NULL,
  `changed_by`   INT UNSIGNED DEFAULT NULL,
  `ref_doc_type` VARCHAR(50)  DEFAULT NULL,
  `ref_doc_id`   INT UNSIGNED DEFAULT NULL,
  `changed_at`   DATETIME     DEFAULT NOW(),
  `remarks`      TEXT         DEFAULT NULL
);

-- ─────────────────────────────────────────────────────────────
-- SECTION E: NEW TABLES — Rental Masters
-- ─────────────────────────────────────────────────────────────

-- E1. Rental Type Master
CREATE TABLE IF NOT EXISTS `rental_type_master` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `type_code`   VARCHAR(20)  NOT NULL,
  `type_name`   VARCHAR(100) NOT NULL,
  `status`      VARCHAR(5)   DEFAULT '1',
  `created_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_type_code` (`type_code`)
);

-- E2. Billing Cycle Master
CREATE TABLE IF NOT EXISTS `billing_cycle_master` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `cycle_code`  VARCHAR(20)  NOT NULL,
  `cycle_name`  VARCHAR(100) NOT NULL,
  `cycle_days`  INT          DEFAULT 30,
  `status`      VARCHAR(5)   DEFAULT '1',
  `created_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_cycle_code` (`cycle_code`)
);

-- E3. Rental Plan Master
CREATE TABLE IF NOT EXISTS `rental_plan_master` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `plan_code`        VARCHAR(30)  NOT NULL,
  `plan_name`        VARCHAR(200) NOT NULL,
  `product_id`       INT UNSIGNED DEFAULT NULL,
  `rental_type_id`   INT UNSIGNED DEFAULT NULL,
  `billing_cycle_id` INT UNSIGNED DEFAULT NULL,
  `duration_months`  INT          DEFAULT 12,
  `monthly_rent`     DECIMAL(15,2) DEFAULT 0.00,
  `security_deposit` DECIMAL(15,2) DEFAULT 0.00,
  `late_fee_per_day` DECIMAL(10,2) DEFAULT 0.00,
  `auto_renew`       TINYINT(1)   DEFAULT 0,
  `status`           VARCHAR(5)   DEFAULT '1',
  `created_by`       INT UNSIGNED DEFAULT NULL,
  `created_at`       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_plan_code` (`plan_code`)
);

-- ─────────────────────────────────────────────────────────────
-- SECTION F: NEW TABLES — Rental Transactions
-- ─────────────────────────────────────────────────────────────

-- F1. Rental Orders
CREATE TABLE IF NOT EXISTS `rental_orders` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_no`         VARCHAR(50)  NOT NULL,
  `client_id`        INT UNSIGNED NOT NULL,
  `lead_id`          INT UNSIGNED DEFAULT NULL,
  `quot_id`          INT UNSIGNED DEFAULT NULL,
  `org_unit_id`      INT UNSIGNED DEFAULT NULL,
  `delivery_loc_id`  INT UNSIGNED DEFAULT NULL,
  `order_date`       DATE         NOT NULL,
  `start_date`       DATE         DEFAULT NULL,
  `end_date`         DATE         DEFAULT NULL,
  `status`           VARCHAR(30)  DEFAULT 'Draft',
  `approved_by`      INT UNSIGNED DEFAULT NULL,
  `approved_at`      DATETIME     DEFAULT NULL,
  `total_amount`     DECIMAL(15,2) DEFAULT 0.00,
  `remarks`          TEXT         DEFAULT NULL,
  `created_by`       INT UNSIGNED DEFAULT NULL,
  `created_at`       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_order_no` (`order_no`)
);

-- F2. Rental Order Lines
CREATE TABLE IF NOT EXISTS `rental_order_lines` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id`     INT UNSIGNED NOT NULL,
  `product_id`   INT UNSIGNED NOT NULL,
  `plan_id`      INT UNSIGNED DEFAULT NULL,
  `qty`          INT          NOT NULL DEFAULT 1,
  `unit_rate`    DECIMAL(15,2) DEFAULT 0.00,
  `amount`       DECIMAL(15,2) DEFAULT 0.00,
  `status`       VARCHAR(30)  DEFAULT 'Open'
);

-- F3. Asset Reservations
CREATE TABLE IF NOT EXISTS `asset_reservations` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id`      INT UNSIGNED NOT NULL,
  `order_line_id` INT UNSIGNED NOT NULL,
  `asset_id`      INT UNSIGNED NOT NULL,
  `reserved_at`   DATETIME     DEFAULT NOW(),
  `reserved_by`   INT UNSIGNED DEFAULT NULL,
  `status`        VARCHAR(30)  DEFAULT 'Reserved',
  `remarks`       TEXT         DEFAULT NULL
);

-- F4. Asset Allocations
CREATE TABLE IF NOT EXISTS `asset_allocations` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id`         INT UNSIGNED NOT NULL,
  `order_line_id`    INT UNSIGNED NOT NULL,
  `asset_id`         INT UNSIGNED NOT NULL,
  `allocated_at`     DATETIME     DEFAULT NULL,
  `allocated_by`     INT UNSIGNED DEFAULT NULL,
  `returned_at`      DATETIME     DEFAULT NULL,
  `return_condition` VARCHAR(50)  DEFAULT NULL,
  `status`           VARCHAR(30)  DEFAULT 'Allocated',
  `remarks`          TEXT         DEFAULT NULL
);

-- F5. Rental Agreements
CREATE TABLE IF NOT EXISTS `rental_agreements` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `agreement_no`   VARCHAR(50)  NOT NULL,
  `order_id`       INT UNSIGNED NOT NULL,
  `client_id`      INT UNSIGNED NOT NULL,
  `agreement_date` DATE         NOT NULL,
  `start_date`     DATE         DEFAULT NULL,
  `end_date`       DATE         DEFAULT NULL,
  `document_path`  VARCHAR(500) DEFAULT NULL,
  `status`         VARCHAR(30)  DEFAULT 'Active',
  `created_by`     INT UNSIGNED DEFAULT NULL,
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_agreement_no` (`agreement_no`)
);

-- ─────────────────────────────────────────────────────────────
-- SECTION G: NEW TABLES — Finance & Billing
-- ─────────────────────────────────────────────────────────────

-- G1. Invoice Type Master
CREATE TABLE IF NOT EXISTS `invoice_type_master` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `type_code`  VARCHAR(20)  NOT NULL,
  `type_name`  VARCHAR(100) NOT NULL,
  `status`     VARCHAR(5)   DEFAULT '1',
  UNIQUE KEY `uk_type_code` (`type_code`)
);

-- G2. Payment Mode Master
CREATE TABLE IF NOT EXISTS `payment_mode_master` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `mode_code`  VARCHAR(20)  NOT NULL,
  `mode_name`  VARCHAR(100) NOT NULL,
  `status`     VARCHAR(5)   DEFAULT '1',
  UNIQUE KEY `uk_mode_code` (`mode_code`)
);

-- G3. Invoice Master
CREATE TABLE IF NOT EXISTS `invoice_master` (
  `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `invoice_no`          VARCHAR(50)  NOT NULL,
  `invoice_type_id`     INT UNSIGNED DEFAULT NULL,
  `client_id`           INT UNSIGNED NOT NULL,
  `order_id`            INT UNSIGNED DEFAULT NULL,
  `invoice_date`        DATE         NOT NULL,
  `due_date`            DATE         DEFAULT NULL,
  `billing_period_from` DATE         DEFAULT NULL,
  `billing_period_to`   DATE         DEFAULT NULL,
  `subtotal`            DECIMAL(15,2) DEFAULT 0.00,
  `tax_amount`          DECIMAL(15,2) DEFAULT 0.00,
  `discount`            DECIMAL(15,2) DEFAULT 0.00,
  `total`               DECIMAL(15,2) DEFAULT 0.00,
  `paid_amount`         DECIMAL(15,2) DEFAULT 0.00,
  `status`              VARCHAR(30)  DEFAULT 'Draft',
  `created_by`          INT UNSIGNED DEFAULT NULL,
  `created_at`          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_invoice_no` (`invoice_no`)
);

-- G4. Invoice Line Items
CREATE TABLE IF NOT EXISTS `invoice_lines` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `invoice_id`  INT UNSIGNED NOT NULL,
  `asset_id`    INT UNSIGNED DEFAULT NULL,
  `description` VARCHAR(500) NOT NULL,
  `qty`         INT          DEFAULT 1,
  `unit_rate`   DECIMAL(15,2) DEFAULT 0.00,
  `tax_rate`    DECIMAL(5,2)  DEFAULT 0.00,
  `amount`      DECIMAL(15,2) DEFAULT 0.00
);

-- G5. Payment Master
CREATE TABLE IF NOT EXISTS `payment_master` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `payment_no`   VARCHAR(50)  NOT NULL,
  `client_id`    INT UNSIGNED NOT NULL,
  `invoice_id`   INT UNSIGNED DEFAULT NULL,
  `amount`       DECIMAL(15,2) NOT NULL,
  `mode_id`      INT UNSIGNED DEFAULT NULL,
  `payment_date` DATE         NOT NULL,
  `ref_no`       VARCHAR(100) DEFAULT NULL,
  `remarks`      TEXT         DEFAULT NULL,
  `created_by`   INT UNSIGNED DEFAULT NULL,
  `created_at`   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_payment_no` (`payment_no`)
);

-- G6. Security Deposits
CREATE TABLE IF NOT EXISTS `security_deposits` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id`      INT UNSIGNED NOT NULL,
  `client_id`     INT UNSIGNED NOT NULL,
  `amount`        DECIMAL(15,2) NOT NULL,
  `paid_date`     DATE         DEFAULT NULL,
  `refund_date`   DATE         DEFAULT NULL,
  `refund_amount` DECIMAL(15,2) DEFAULT 0.00,
  `status`        VARCHAR(30)  DEFAULT 'Held',
  `created_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- SECTION H: NEW TABLES — Maintenance / Service
-- ─────────────────────────────────────────────────────────────

-- H1. Service Tickets
CREATE TABLE IF NOT EXISTS `service_tickets` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `ticket_no`     VARCHAR(50)  NOT NULL,
  `client_id`     INT UNSIGNED DEFAULT NULL,
  `asset_id`      INT UNSIGNED NOT NULL,
  `order_id`      INT UNSIGNED DEFAULT NULL,
  `issue_type`    VARCHAR(100) DEFAULT NULL,
  `priority`      VARCHAR(20)  DEFAULT 'Medium',
  `description`   TEXT         DEFAULT NULL,
  `technician_id` INT UNSIGNED DEFAULT NULL,
  `asp_id`        INT UNSIGNED DEFAULT NULL,
  `status`        VARCHAR(30)  DEFAULT 'Open',
  `opened_at`     DATETIME     DEFAULT NOW(),
  `resolved_at`   DATETIME     DEFAULT NULL,
  `closed_at`     DATETIME     DEFAULT NULL,
  `created_by`    INT UNSIGNED DEFAULT NULL,
  `created_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_ticket_no` (`ticket_no`)
);

-- H2. Service History (append-only)
CREATE TABLE IF NOT EXISTS `service_history` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `ticket_id`   INT UNSIGNED NOT NULL,
  `action`      VARCHAR(100) NOT NULL,
  `description` TEXT         DEFAULT NULL,
  `done_by`     INT UNSIGNED DEFAULT NULL,
  `done_at`     DATETIME     DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- SECTION I: NEW TABLES — RBAC Enhancement
-- ─────────────────────────────────────────────────────────────

-- I1. Roles Master
CREATE TABLE IF NOT EXISTS `roles` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `role_code`   VARCHAR(30)  NOT NULL,
  `role_name`   VARCHAR(100) NOT NULL,
  `description` TEXT         DEFAULT NULL,
  `status`      VARCHAR(5)   DEFAULT '1',
  `created_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_role_code` (`role_code`)
);

-- I2. User-Role Assignments
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id`      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `role_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`)
);

-- I3. Data Scope Master
CREATE TABLE IF NOT EXISTS `data_scope_master` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `scope_code`  VARCHAR(20)  NOT NULL,
  `scope_name`  VARCHAR(100) NOT NULL,
  `scope_level` INT          NOT NULL DEFAULT 1,
  UNIQUE KEY `uk_scope_code` (`scope_code`)
);

-- I4. User Data Scopes per Module
CREATE TABLE IF NOT EXISTS `user_data_scopes` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id`   INT UNSIGNED NOT NULL,
  `module_id` INT UNSIGNED DEFAULT NULL,
  `scope_id`  INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_uds` (`user_id`, `module_id`)
);

-- ─────────────────────────────────────────────────────────────
-- SECTION J: NEW TABLES — Audit Log
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT UNSIGNED    DEFAULT NULL,
  `action`      VARCHAR(50)     NOT NULL,
  `module`      VARCHAR(50)     NOT NULL,
  `record_type` VARCHAR(50)     DEFAULT NULL,
  `record_id`   INT UNSIGNED    DEFAULT NULL,
  `old_value`   JSON            DEFAULT NULL,
  `new_value`   JSON            DEFAULT NULL,
  `ip_address`  VARCHAR(50)     DEFAULT NULL,
  `user_agent`  TEXT            DEFAULT NULL,
  `logged_at`   DATETIME        DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- SECTION K: SEED DATA for lookup masters
-- ─────────────────────────────────────────────────────────────

-- K1. Org Levels seed
INSERT IGNORE INTO `org_levels` (`level_code`, `level_name`, `level_order`) VALUES
('COMPANY',    'Company',    1),
('REGION',     'Region',     2),
('ZONE',       'Zone',       3),
('BRANCH',     'Branch',     4),
('DEPARTMENT', 'Department', 5),
('TEAM',       'Team',       6);

-- K2. Location Types seed
INSERT IGNORE INTO `location_types` (`type_code`, `type_name`) VALUES
('HO',         'Head Office'),
('PLANT',      'Plant'),
('MOTHER_WH',  'Mother Warehouse'),
('CHILD_WH',   'Child Warehouse'),
('REPAIR',     'Repair Center'),
('BRANCH_OFF', 'Branch Office'),
('CLIENT_SITE','Customer Site');

-- K3. Asset Status seed
INSERT IGNORE INTO `asset_status_master` (`status_code`, `status_name`, `color`, `is_available`, `is_rented`, `sort_order`) VALUES
('PURCHASED',   'Purchased',         '#6366f1', 0, 0, 1),
('RECEIVED',    'Received',          '#8b5cf6', 0, 0, 2),
('AVAILABLE',   'Available',         '#22c55e', 1, 0, 3),
('RESERVED',    'Reserved',          '#f59e0b', 0, 0, 4),
('ALLOCATED',   'Allocated',         '#3b82f6', 0, 0, 5),
('IN_TRANSIT',  'In Transit',        '#06b6d4', 0, 0, 6),
('RENTED',      'Rented',            '#10b981', 0, 1, 7),
('RETURNED',    'Returned',          '#84cc16', 0, 0, 8),
('INSPECTION',  'Under Inspection',  '#eab308', 0, 0, 9),
('MAINTENANCE', 'Under Maintenance', '#f97316', 0, 0, 10),
('DAMAGED',     'Damaged',           '#ef4444', 0, 0, 11),
('LOST',        'Lost',              '#991b1b', 0, 0, 12),
('SCRAPPED',    'Scrapped',          '#6b7280', 0, 0, 13);

-- K4. Asset Condition seed
INSERT IGNORE INTO `asset_condition_master` (`cond_code`, `cond_name`) VALUES
('EXCELLENT', 'Excellent'),
('GOOD',      'Good'),
('FAIR',      'Fair'),
('POOR',      'Poor'),
('DAMAGED',   'Damaged'),
('SCRAPPED',  'Scrapped');

-- K5. Rental Type seed
INSERT IGNORE INTO `rental_type_master` (`type_code`, `type_name`) VALUES
('MONTHLY',  'Monthly Rental'),
('QUARTERLY','Quarterly Rental'),
('ANNUAL',   'Annual Rental'),
('DAILY',    'Daily Rental'),
('ONE_TIME',  'One-Time Rental');

-- K6. Billing Cycle seed
INSERT IGNORE INTO `billing_cycle_master` (`cycle_code`, `cycle_name`, `cycle_days`) VALUES
('MONTHLY',   'Monthly',   30),
('QUARTERLY', 'Quarterly', 90),
('HALF_YR',   'Half-Yearly',180),
('ANNUAL',    'Annual',    365);

-- K7. Invoice Type seed
INSERT IGNORE INTO `invoice_type_master` (`type_code`, `type_name`) VALUES
('RENTAL',    'Rental Invoice'),
('SECURITY',  'Security Deposit'),
('LATE_FEE',  'Late Fee'),
('MAINTENANCE','Maintenance Charge'),
('REFUND',    'Refund / Credit Note');

-- K8. Payment Mode seed
INSERT IGNORE INTO `payment_mode_master` (`mode_code`, `mode_name`) VALUES
('CASH',   'Cash'),
('BANK',   'Bank Transfer / NEFT / RTGS'),
('UPI',    'UPI'),
('CHEQUE', 'Cheque'),
('CARD',   'Debit / Credit Card');

-- K9. Data Scope seed
INSERT IGNORE INTO `data_scope_master` (`scope_code`, `scope_name`, `scope_level`) VALUES
('SELF',    'Self Only',     1),
('TEAM',    'Team',          2),
('DEPT',    'Department',    3),
('BRANCH',  'Branch',        4),
('ZONE',    'Zone',          5),
('REGION',  'Region',        6),
('COMPANY', 'Company',       7),
('GLOBAL',  'Global / All',  9);

-- K10. Default Roles seed
INSERT IGNORE INTO `roles` (`role_code`, `role_name`, `description`) VALUES
('SUPER_ADMIN',    'Super Admin',       'Full access to all modules and data'),
('ADMIN',          'Admin',             'Administrative access'),
('CEO',            'CEO',               'Company head - global view'),
('REGIONAL_HEAD',  'Regional Head',     'Access to own region data'),
('BRANCH_MANAGER', 'Branch Manager',    'Access to own branch data'),
('DEPT_MANAGER',   'Department Manager','Access to own department'),
('TEAM_LEADER',    'Team Leader',       'Access to team data'),
('SALES_MANAGER',  'Sales Manager',     'Sales module access'),
('SALES_EXEC',     'Sales Executive',   'Own sales data access'),
('OPS_MANAGER',    'Operations Manager','Operations module access'),
('WH_MANAGER',     'Warehouse Manager', 'Inventory & asset access'),
('WH_EXEC',        'Warehouse Executive','Warehouse operations'),
('FINANCE_MANAGER','Finance Manager',   'Finance & billing module'),
('FINANCE_EXEC',   'Finance Executive', 'Payment & invoice access'),
('TECHNICIAN',     'Technician',        'Maintenance & service access'),
('DELIVERY_EXEC',  'Delivery Executive','Delivery & pickup access');

-- ─────────────────────────────────────────────────────────────
-- SECTION L: New function_master entries for IT Rental ERP
-- ─────────────────────────────────────────────────────────────

INSERT IGNORE INTO `function_master` (`id`, `function_id`, `function_name`, `descrip`, `icon_img`, `status`, `utype`, `tab`) VALUES
(14, 'FN17', 'Asset Management',   'Physical asset tracking and lifecycle',   'fa-laptop',       'Active', '2', 11.00),
(15, 'FN18', 'Rental Management',  'Rental orders, agreements, allocations',  'fa-handshake-o',  'Active', '2', 12.00),
(16, 'FN19', 'Finance & Billing',  'Invoices, payments, deposits, late fees', 'fa-money',        'Active', '2', 13.00),
(17, 'FN20', 'Maintenance',        'Service tickets, repair, technician',     'fa-wrench',        'Active', '2', 14.00),
(18, 'FN21', 'Organization',       'Org levels, units, company hierarchy',    'fa-sitemap',       'Active', '2', 15.00),
(19, 'FN22', 'Reports',            'All ERP reports and analytics',           'fa-bar-chart',     'Active', '2', 16.00);

-- Sub-functions for new modules
INSERT IGNORE INTO `sub_function_master` (`function_id`, `sub_name`, `sub_seq`, `file_name`, `tab`, `icon_img`, `status`, `utype`) VALUES
-- Asset Management
('FN17', 'Asset Master',         1, '/assets/asset-master',       'Asset', 'fa-laptop',    'Y', '2'),
('FN17', 'Asset Status Master',  2, '/assets/asset-status',       'Asset', 'fa-tag',       'Y', '2'),
('FN17', 'Asset Movement',       3, '/assets/asset-movements',    'Asset', 'fa-exchange',  'Y', '2'),
-- Rental Management
('FN18', 'Rental Plans',         1, '/rental/rental-plans',       'Rental','fa-list',      'Y', '2'),
('FN18', 'Rental Orders',        2, '/rental/rental-orders',      'Rental','fa-file-text', 'Y', '2'),
('FN18', 'Rental Agreements',    3, '/rental/agreements',         'Rental','fa-file-pdf-o','Y', '2'),
('FN18', 'Asset Allocation',     4, '/rental/allocations',        'Rental','fa-cubes',     'Y', '2'),
-- Finance
('FN19', 'Invoices',             1, '/finance/invoices',          'Finance','fa-inr',      'Y', '2'),
('FN19', 'Payments',             2, '/finance/payments',          'Finance','fa-credit-card','Y','2'),
('FN19', 'Security Deposits',    3, '/finance/deposits',          'Finance','fa-lock',     'Y', '2'),
-- Maintenance
('FN20', 'Service Tickets',      1, '/maintenance/tickets',       'Maintenance','fa-ticket','Y','2'),
('FN20', 'Service History',      2, '/maintenance/history',       'Maintenance','fa-history','Y','2'),
-- Organization
('FN21', 'Org Levels',           1, '/org/org-levels',            'Org',   'fa-sitemap',   'Y', '2'),
('FN21', 'Org Units',            2, '/org/org-units',             'Org',   'fa-building',  'Y', '2'),
('FN21', 'Location Types',       3, '/org/location-types',        'Org',   'fa-map-marker','Y', '2'),
-- Reports
('FN22', 'Executive Analytics',  1, '/reports/analytics',         'Reports','fa-bar-chart','Y', '2');

-- ─────────────────────────────────────────────────────────────
-- SECTION M: Grant Access in access_function for all sub-functions
-- Automatically grants permissions to all active users/employees
-- ─────────────────────────────────────────────────────────────
ALTER TABLE `access_function`
  ADD COLUMN IF NOT EXISTS `emp_id`          VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `sub_function_id` VARCHAR(50)  NULL;

INSERT IGNORE INTO `access_function` (`emp_id`, `function_id`, `sub_function_id`, `status`)
SELECT u.emp_id, sf.function_id, sf.id, 'Y'
FROM `users` u
CROSS JOIN `sub_function_master` sf
WHERE u.status = '1' AND sf.status = 'Y' AND u.emp_id IS NOT NULL AND u.emp_id != '';

