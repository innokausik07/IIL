-- ============================================================
-- Phase 2: Organization Hierarchy (Company -> Plant -> Department -> Designation -> User)
-- ============================================================

-- 1. Plant Types Master (Configurable Master)
CREATE TABLE IF NOT EXISTS `plant_types` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `type_code`   VARCHAR(30)  NOT NULL UNIQUE,
  `type_name`   VARCHAR(100) NOT NULL,
  `description` TEXT         NULL,
  `status`      VARCHAR(5)   DEFAULT '1',
  `created_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Seed Standard Plant Types
INSERT IGNORE INTO `plant_types` (`id`, `type_code`, `type_name`, `description`, `status`) VALUES
(1, 'HO',   'Head Office',              'Main corporate headquarters and executive office', '1'),
(2, 'MWH',  'Mother Warehouse',         'Central regional distribution and inventory hub', '1'),
(3, 'CWH',  'Child Warehouse',          'Local fulfillment and secondary transit warehouse', '1'),
(4, 'RC',   'Repair & Service Center',  'ASP and internal hardware diagnostics and repair facility', '1'),
(5, 'BO',   'Branch Office',            'Regional sales and administrative branch', '1');

-- 2. Designation Master (Organizational Position Master)
CREATE TABLE IF NOT EXISTS `designation_master` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `designation_code` VARCHAR(30)  NOT NULL UNIQUE,
  `designation_name` VARCHAR(100) NOT NULL,
  `department_id`    INT UNSIGNED NULL,
  `description`      VARCHAR(255) NULL,
  `status`           VARCHAR(5)   DEFAULT '1',
  `created_at`       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Seed Standard Designations
INSERT IGNORE INTO `designation_master` (`id`, `designation_code`, `designation_name`, `description`, `status`) VALUES
(1, 'DIR',   'Director / CEO',              'Executive leadership', '1'),
(2, 'OPM',   'Operations Manager',          'Head of field operations & fulfillment', '1'),
(3, 'WHM',   'Warehouse Manager',           'Central stock and asset custodian', '1'),
(4, 'WHE',   'Warehouse Executive',         'Stock handling, DC, GRN dispatch', '1'),
(5, 'TSE',   'Senior Service Engineer',     'Lead hardware technician & QA', '1'),
(6, 'FTE',   'Field Technician',            'Client onsite repair & installation', '1'),
(7, 'SLM',   'Sales & BD Manager',          'Corporate rental accounts & CRM', '1'),
(8, 'SLE',   'Sales Executive',             'Lead generation & customer quotations', '1'),
(9, 'ACC',   'Accountant / Finance Head',   'Invoicing, taxation, and payments', '1'),
(10, 'LOG',  'Logistics Coordinator',       'Shipment dispatch, tracking & couriers', '1'),
(11, 'AUD',  'Audit & Quality Officer',     'Equipment inspection & CCTV exam audit', '1');

-- 3. Plant Departments Junction (Configure which departments exist at which plant)
CREATE TABLE IF NOT EXISTS `plant_departments` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `plant_id`      INT UNSIGNED NOT NULL,
  `department_id` INT UNSIGNED NOT NULL,
  `status`        VARCHAR(5)   DEFAULT '1',
  `created_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_plant` (`plant_id`),
  INDEX `idx_dept` (`department_id`)
);

-- 4. Alter locations (plants) table to support plant_type_id & parent_plant_id
ALTER TABLE `locations`
  ADD COLUMN IF NOT EXISTS `plant_code`      VARCHAR(50)  NULL AFTER `id`,
  ADD COLUMN IF NOT EXISTS `plant_type_id`   INT UNSIGNED NULL DEFAULT 2 AFTER `plant_code`,
  ADD COLUMN IF NOT EXISTS `parent_plant_id` INT UNSIGNED NULL AFTER `plant_type_id`;

-- Sync parent_plant_id from legacy parent_loc_id if exists
UPDATE `locations` SET `parent_plant_id` = `parent_loc_id` WHERE `parent_loc_id` IS NOT NULL AND `parent_plant_id` IS NULL;

-- 5. Alter users table to support (Plant -> Department -> Designation -> Reporting Manager)
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `plant_id`             INT UNSIGNED NULL AFTER `location_id`,
  ADD COLUMN IF NOT EXISTS `department_id`        INT UNSIGNED NULL AFTER `plant_id`,
  ADD COLUMN IF NOT EXISTS `designation_id`       INT UNSIGNED NULL AFTER `department_id`,
  ADD COLUMN IF NOT EXISTS `reporting_manager_id` INT UNSIGNED NULL AFTER `designation_id`;

-- Sync legacy columns
UPDATE `users` SET `plant_id` = `location_id` WHERE `location_id` IS NOT NULL AND `plant_id` IS NULL;
UPDATE `users` SET `reporting_manager_id` = `reporting_to` WHERE `reporting_to` IS NOT NULL AND `reporting_manager_id` IS NULL;
