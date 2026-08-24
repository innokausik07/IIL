-- ============================================================
-- Function Master & Sub-Function Master Migration
-- Run in phpMyAdmin > innovatiview_new > SQL tab
-- ============================================================

-- 1. Function Master (Main Modules)
CREATE TABLE IF NOT EXISTS `function_master` (
  `id`             INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `function_id`    VARCHAR(50)   NOT NULL,
  `function_name`  VARCHAR(255)  NOT NULL,
  `descrip`        TEXT          DEFAULT NULL,
  `icon_img`       VARCHAR(100)  DEFAULT NULL,
  `status`         VARCHAR(20)   DEFAULT 'Active',
  `utype`          VARCHAR(10)   DEFAULT '2',
  `tab`            DECIMAL(5,2)  DEFAULT 0.00,
  `created_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sub-Function Master (Sub-Modules)
CREATE TABLE IF NOT EXISTS `sub_function_master` (
  `id`             INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `function_id`    VARCHAR(50)   NOT NULL,
  `sub_name`       VARCHAR(255)  NOT NULL,
  `sub_seq`        INT           DEFAULT 0,
  `file_name`      VARCHAR(255)  DEFAULT NULL,
  `tab`            VARCHAR(50)   DEFAULT NULL,
  `icon_img`       VARCHAR(100)  DEFAULT NULL,
  `status`         VARCHAR(10)   DEFAULT 'Y',
  `utype`          VARCHAR(10)   DEFAULT '2',
  `created_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Seed initial records from Devsite if tables are empty
-- ============================================================

INSERT IGNORE INTO `function_master` (`id`, `function_id`, `function_name`, `descrip`, `icon_img`, `status`, `utype`, `tab`) VALUES
(1,  'FN01', 'Logistic',      'Logistics, DC, GRN, and Dispatch tracking',  'fa-truck',         'Active', '2', 3.00),
(2,  'FN02', 'Sales',         'Sales and Customer management',              'fa-desktop',       'Active', '2', 2.00),
(3,  'FN03', 'Purchase',      'Purchase Orders and Vendor Requisitions',    'fa-shopping-cart', 'Active', '2', 1.00),
(4,  'FN04', 'Return',        'Return DC and Reverse Logistics',            'fa-reply',         'Active', '2', 6.00),
(5,  'FN05', 'Payment',       'Payment collections and vouchers',           'fa-briefcase',     'Active', '2', 5.00),
(6,  'FN06', 'Marketing',     'Lead and Marketing CRM',                     'fa-bullhorn',      'Active', '1', 0.00),
(7,  'FN07', 'Receive Stock', 'Receive Stock From Party Or Import',         'fa-suitcase',      'Active', '2', 4.00),
(8,  'FN08', 'Sale Force',    'Sales Force Tracking and Beat Plan',         'fa-handshake-o',   'Active', '2', 0.00),
(9,  'FN09', 'General Query', 'Customer queries and tickets',               'fa-reply',         'Active', '2', 7.00),
(10, 'FN10', 'App Transaction','Mobile App related transactions',           'fa-mobile',        'Active', '2', 0.00),
(11, 'FN14', 'Repair',        'Repair, Alteration and TRC / QC',            'fa-wrench',        'Active', '2', 8.00),
(12, 'FN15', 'Inventory',     'GRN, Warehouse & Store Inventory',           'fa-cubes',         'Active', '2', 9.00),
(13, 'FN16', 'Invoicing & Rent','Billing & Rental product management',       'fa-inr',           'Active', '2', 10.00);

INSERT IGNORE INTO `sub_function_master` (`id`, `function_id`, `sub_name`, `sub_seq`, `file_name`, `tab`, `icon_img`, `status`, `utype`) VALUES
(1,  'FN01', 'Freight Calculator',    1, '/logistics/calculator',        'Logistics', 'fa-calculator', 'Y', '2'),
(2,  'FN01', 'Delivery Challan (DC)', 2, '/logistics/delivery-challan',  'Logistics', 'fa-list',       'Y', '2'),
(3,  'FN01', 'PENDING DC',            3, '/logistics/delivery-challan',  'Logistics', 'fa-list',       'Y', '1'),
(4,  'FN01', 'Shipment Tracking',     4, '/logistics/dispatch-tracking', 'Logistics', 'fa-truck',      'Y', '2'),
(5,  'FN01', 'Return DC',             5, '/logistics/return-dc',         'Logistics', 'fa-reply',      'Y', '2'),
(6,  'FN02', 'Order List (RO)',       1, '/crm/lead-master',             'Sales',     'fa-list',       'Y', '2'),
(7,  'FN02', 'Quotation Management',  2, '/crm/quotation-master',        'Sales',     'fa-file-text',  'Y', '2'),
(8,  'FN02', 'RFP / Tender',          3, '/crm/rfp-master',              'Sales',     'fa-award',      'Y', '2'),
(9,  'FN03', 'Purchase Order (PO)',   1, '/products/price-master',       'Purchase',  'fa-list',       'Y', '2'),
(10, 'FN07', 'GRN Inward Goods',      1, '/logistics/grn-receipt',       'Inventory', 'fa-cubes',      'Y', '2'),
(11, 'FN15', 'Product / Item Master', 1, '/products/product-master',     'Inventory', 'fa-cubes',      'Y', '2'),
(12, 'FN15', 'Product Category',      2, '/products/category-master',    'Inventory', 'fa-suitcase',   'Y', '2'),
(13, 'FN15', 'Product Sub-Category',  3, '/products/subcategory-master', 'Inventory', 'fa-cubes',      'Y', '2');
