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
-- SECTION L: Clean & Exact 11 ERP Functions & Sub-Functions
-- 100% mapped to actual existing React pages and routes
-- ─────────────────────────────────────────────────────────────

-- 1. Insert The Exact 11 Enterprise Functions
INSERT IGNORE INTO `function_master` (`id`, `function_id`, `function_name`, `descrip`, `icon_img`, `status`, `utype`, `tab`) VALUES
(1,  'FN01', 'Operations & Audit',   'Operations, CCTV Audit Sheets & Store Stocks',          'fa-table',        'Active', '2', 1.00),
(2,  'FN02', 'Asset Management',     'Physical IT hardware inventory, serial numbers & status', 'fa-laptop',       'Active', '2', 2.00),
(3,  'FN03', 'Rental Management',    'Rental orders, plans, allocations & returns',            'fa-handshake-o',  'Active', '2', 3.00),
(4,  'FN04', 'Finance & Billing',    'Invoices, GST billing, recurring engine & collections',   'fa-inr',          'Active', '2', 4.00),
(5,  'FN05', 'Service & Repair',     'Breakdown tickets, repairs & technician assignment',     'fa-wrench',       'Active', '2', 5.00),
(6,  'FN06', 'Reports & Analytics',  'Fleet occupancy, MRR, aging analysis & renewals',       'fa-bar-chart',    'Active', '2', 6.00),
(7,  'FN07', 'Logistics & Dispatch', 'Freight estimation, DC, GRN, reverse pickup & tracking', 'fa-truck',        'Active', '2', 7.00),
(8,  'FN08', 'Product Master',       'Product catalog, categories, BOM & price lists',         'fa-tags',         'Active', '2', 8.00),
(9,  'FN09', 'CRM & Sales',          'Clients, vendors, leads, quotations & RFPs',             'fa-users',        'Active', '2', 9.00),
(10, 'FN10', 'Master Setup',         'Hierarchy levels, location types, state, city & masters', 'fa-database',     'Active', '1', 10.00),
(11, 'FN11', 'Administration',       'User management, roles, security & dynamic permissions', 'fa-cogs',         'Active', '1', 11.00);

-- 2. Insert Exactly Mapped Sub-Functions (100% matching App.jsx routes)
INSERT IGNORE INTO `sub_function_master` (`id`, `function_id`, `sub_name`, `sub_seq`, `file_name`, `tab`, `icon_img`, `status`, `utype`) VALUES
-- Module 1: Operations & Audit
(1,  'FN01', 'CCTV Audit Sheet',        1, '/audit/cctv-audit',            'Audit',     'fa-table',        'Y', '2'),
(2,  'FN01', 'Moved Data Sheet',        2, '/moved-sheet',                 'Audit',     'fa-arrow-right',  'Y', '2'),
(3,  'FN01', 'Cross Audit Sheet',       3, '/cross-audit',                 'Audit',     'fa-sliders',      'Y', '2'),
(4,  'FN01', 'Store Stock Sheet',       4, '/store-stock',                 'Audit',     'fa-database',     'Y', '2'),

-- Module 2: Asset Management
(5,  'FN02', 'Asset Master',            1, '/assets/asset-master',         'Asset',     'fa-laptop',       'Y', '2'),

-- Module 3: Rental Management
(6,  'FN03', 'Rental Orders',           1, '/rental/rental-orders',        'Rental',    'fa-file-text',    'Y', '2'),
(7,  'FN03', 'New Rental Order',        2, '/rental/rental-orders/new',    'Rental',    'fa-plus-circle',  'Y', '2'),
(8,  'FN03', 'Rental Plans & Pricing',  3, '/rental/rental-plans',         'Rental',    'fa-list',         'Y', '2'),

-- Module 4: Finance & Billing
(9,  'FN04', 'Invoice Management',      1, '/finance/invoices',            'Finance',   'fa-inr',          'Y', '2'),

-- Module 5: Service & Repair
(10, 'FN05', 'Service Tickets',         1, '/maintenance/tickets',         'Repair',    'fa-ticket',       'Y', '2'),

-- Module 6: Reports & Analytics
(11, 'FN06', 'Executive Analytics',     1, '/reports/analytics',           'Reports',   'fa-line-chart',   'Y', '2'),

-- Module 7: Logistics & Dispatch
(12, 'FN07', 'Freight Calculator',      1, '/logistics/calculator',        'Logistics', 'fa-calculator',   'Y', '2'),
(13, 'FN07', 'Delivery Challan (DC)',   2, '/logistics/delivery-challan',  'Logistics', 'fa-file-text-o',  'Y', '2'),
(14, 'FN07', 'GRN Inward Receipt',      3, '/logistics/grn-receipt',       'Logistics', 'fa-download',     'Y', '2'),
(15, 'FN07', 'Return DC',               4, '/logistics/return-dc',         'Logistics', 'fa-reply',        'Y', '2'),
(16, 'FN07', 'Shipment Tracking',       5, '/logistics/dispatch-tracking', 'Logistics', 'fa-truck',        'Y', '2'),
(17, 'FN07', 'Courier Rate Cards',      6, '/logistics/courier-rates',     'Logistics', 'fa-dollar',       'Y', '2'),

-- Module 8: Product Master
(18, 'FN08', 'Product / Item Master',   1, '/products/product-master',     'Products',  'fa-cubes',        'Y', '2'),
(19, 'FN08', 'Category Master',         2, '/products/category-master',    'Products',  'fa-tags',         'Y', '2'),
(20, 'FN08', 'Sub-Category Master',     3, '/products/subcategory-master', 'Products',  'fa-sitemap',      'Y', '2'),
(21, 'FN08', 'BOM Master',              4, '/products/bom-master',         'Products',  'fa-cogs',         'Y', '2'),
(22, 'FN08', 'Price Master',            5, '/products/price-master',       'Products',  'fa-dollar',       'Y', '2'),

-- Module 9: CRM & Sales
(23, 'FN09', 'Client Master',           1, '/crm/client-master',           'CRM',       'fa-building',     'Y', '2'),
(24, 'FN09', 'Vendor Master',           2, '/vendors/vendor-master',       'CRM',       'fa-users',        'Y', '2'),
(25, 'FN09', 'Lead Management',         3, '/crm/lead-master',             'CRM',       'fa-bullhorn',     'Y', '2'),
(26, 'FN09', 'Quotation Master',        4, '/crm/quotation-master',        'CRM',       'fa-file-text',    'Y', '2'),
(27, 'FN09', 'RFP / Tender Master',     5, '/crm/rfp-master',              'CRM',       'fa-award',        'Y', '2'),

-- Module 10: Master Setup
(28, 'FN10', 'Org & Hierarchy Setup',   1, '/org/org-levels',              'Masters',   'fa-sitemap',      'Y', '1'),
(29, 'FN10', 'Location Master',         2, '/admin/location-master',       'Masters',   'fa-map-marker',   'Y', '1'),
(30, 'FN10', 'State Master',            3, '/admin/state-master',          'Masters',   'fa-map',          'Y', '1'),
(31, 'FN10', 'City Master',             4, '/admin/city-master',           'Masters',   'fa-building-o',   'Y', '1'),
(32, 'FN10', 'Brand Master',            5, '/admin/brand-master',          'Masters',   'fa-tag',          'Y', '1'),
(33, 'FN10', 'Color Master',            6, '/admin/color-master',          'Masters',   'fa-paint-brush',  'Y', '1'),
(34, 'FN10', 'Tax / HSN Master',        7, '/admin/tax-master',            'Masters',   'fa-percent',      'Y', '1'),
(35, 'FN10', 'Courier Master',          8, '/admin/courier-master',        'Masters',   'fa-truck',        'Y', '1'),
(36, 'FN10', 'Parameter Master',        9, '/admin/parameter-master',      'Masters',   'fa-sliders',      'Y', '1'),
(37, 'FN10', 'Bin Master',             10, '/admin/bin-master',            'Masters',   'fa-archive',      'Y', '1'),
(38, 'FN10', 'ASP Service Partner',    11, '/admin/asp-master',            'Masters',   'fa-shield',       'Y', '1'),

-- Module 11: Administration
(39, 'FN11', 'User Master',             1, '/admin/user-master',           'Admin',     'fa-user-plus',    'Y', '1'),
(40, 'FN11', 'Function Master',         2, '/admin/function-master',       'Admin',     'fa-sitemap',      'Y', '1'),
(41, 'FN11', 'Sub-Function Master',     3, '/admin/subfunction-master',    'Admin',     'fa-list-alt',     'Y', '1');

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


