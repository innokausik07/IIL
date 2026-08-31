-- ============================================================
-- Exact Mapping for User's 30 Function Masters (FN01 - FN30)
-- 100% Mapped to Real React Pages & Routes in App.jsx
-- Run in phpMyAdmin > innovatiview_new > SQL tab
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `function_master`;
TRUNCATE TABLE `sub_function_master`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert User's Exact 30 Functions
INSERT INTO `function_master` (`id`, `function_id`, `function_name`, `descrip`, `icon_img`, `status`, `utype`, `tab`) VALUES
(1,  'FN01', 'Logistic',           'Logistics, Delivery Challan, GRN & Dispatch tracking',      'fa-truck',         'Active', '2', 3.00),
(2,  'FN02', 'Sales',              'Sales, Quotation, RFP & Order Management',                  'fa-desktop',       'Active', '2', 2.00),
(3,  'FN03', 'Purchase',           'Purchase Orders, Vendor Requisitions & RFQ',                'fa-shopping-cart', 'Active', '2', 1.00),
(4,  'FN04', 'Return',             'Return DC, Reverse Logistics & Return Requisitions',        'fa-reply',         'Active', '2', 6.00),
(5,  'FN05', 'Payment',            'Payment collection, Approval & Voucher Management',         'fa-briefcase',     'Active', '2', 5.00),
(6,  'FN06', 'Marketing',          'Lead Generation, Target Planning & Campaigns',              'fa-bullhorn',      'Active', '1', 0.00),
(7,  'FN07', 'Receive Stock',      'Receive Stock From Party, Import Or Opening Stock',         'fa-suitcase',      'Active', '2', 4.00),
(8,  'FN08', 'Sale Force',         'Sales Force Tracking, Beat Plan & Target Allocation',       'fa-handshake-o',   'Active', '2', 0.00),
(9,  'FN09', 'General Query',      'Customer Queries, Escalations & Support Tickets',           'fa-reply',         'Active', '2', 7.00),
(10, 'FN10', 'App Transaction',    'Mobile App related live transactions & activity logs',       'fa-mobile',        'Inactive','2', 0.00),
(11, 'FN11', 'HRMS HR.',           'Human Resource Master, Employee Management & Policies',     'fa-user',          'Inactive','2', 0.00),
(12, 'FN12', 'HRMS Emp.',          'Employee Self Service, Leaves, Attendance & Payroll',       'fa-group',         'Inactive','2', 0.00),
(13, 'FN13', 'HRMS Report',        'HRMS Analytics, Attendance Reports & Performance Logs',     'fa-reply',         'Inactive','2', 0.00),
(14, 'FN14', 'Repair',             'Repair, Alteration, QC & TRC (Technical Repair Center)',    'fa-wrench',        'Active', '2', 8.00),
(15, 'FN15', 'Inventory',          'Store Stock, GRN, Warehouse & Item Inventory',              'fa-cubes',         'Active', '2', 9.00),
(16, 'FN16', 'Invoicing & Rent',   'Billing, Rental Product Orders & Corporate Invoices',       'fa-inr',           'Active', '2', 10.00),
(17, 'FN17', 'Happy Calling',      'Customer Support, Post-delivery followups & Feedback',      'fa-headphones',    'Active', '2', 11.00),
(18, 'FN18', 'Audit & Adjustment', 'CCTV Audit, Cross Audit, Store Stock & Physical Counts',    'fa-balance-scale', 'Active', '2', 12.00),
(19, 'FN19', 'Vendor Management',  'Vendor Master, Contracts, Domestic & Import Suppliers',     'fa-users',         'Active', '2', 13.00),
(20, 'FN20', 'Client Management',  'Corporate Clients, Account Approvals & Site Mapping',       'fa-building',      'Active', '2', 14.00),
(21, 'FN21', 'Product Master',     'Product Category, Sub-Category, BOM & Price Cards',         'fa-tags',          'Active', '2', 15.00),
(22, 'FN22', 'Courier Management', 'Courier Partners, Rate Contracts & Freight Calculator',     'fa-paper-plane',   'Active', '2', 16.00),
(23, 'FN23', 'Administration',     'User Roles, Permissions, Location & System Settings',       'fa-cogs',          'Active', '1', 17.00),
(24, 'FN24', 'Reports & Analytics','MIS Reports, Alteration Reports, TRC & Excel Exports',      'fa-line-chart',    'Active', '2', 18.00),
(25, 'FN25', 'Master Setup',       'State, City, Brand, Color, Tax/HSN, Bin & ASP Masters',     'fa-database',      'Active', '1', 19.00),
(26, 'FN26', 'Asset Management',   'Serialized Asset Tracking, Barcodes & QC Classification',   'fa-barcode',       'Active', '2', 20.00),
(27, 'FN27', 'Dispatch Cell',      'Packing Slips, Gate Pass, Vehicle Loading & Outward Logs',  'fa-share-square-o','Active', '2', 21.00),
(28, 'FN28', 'Procurement RFQ',    'Request For Quotation (RFQ), Vendor Quotations & Bidding',  'fa-file-text-o',   'Active', '2', 22.00),
(29, 'FN29', 'Notice Board',       'Internal Announcements, Circulars & Employee Broadcasts',   'fa-bullhorn',      'Inactive','2', 23.00),
(30, 'FN30', 'System Security',    'User Access Logs, IP Whitelisting & Audit Logs',            'fa-shield',        'Inactive','1', 24.00);

-- 2. Insert Sub-Functions strictly pointing to verified, working React routes
INSERT INTO `sub_function_master` (`id`, `function_id`, `sub_name`, `sub_seq`, `file_name`, `tab`, `icon_img`, `status`, `utype`) VALUES
-- FN01: Logistic
(1,  'FN01', 'Freight Calculator',       1, '/logistics/calculator',        'Logistics', 'fa-calculator',   'Y', '2'),
(2,  'FN01', 'Delivery Challan (DC)',    2, '/logistics/delivery-challan',  'Logistics', 'fa-file-text-o',  'Y', '2'),
(3,  'FN01', 'Shipment Tracking',        3, '/logistics/dispatch-tracking', 'Logistics', 'fa-truck',        'Y', '2'),
(4,  'FN01', 'Courier Rate Cards',       4, '/logistics/courier-rates',     'Logistics', 'fa-dollar',       'Y', '2'),

-- FN02: Sales
(5,  'FN02', 'Quotation Management',     1, '/crm/quotation-master',        'Sales',     'fa-file-text',    'Y', '2'),
(6,  'FN02', 'RFP / Tender Management',  2, '/crm/rfp-master',              'Sales',     'fa-award',        'Y', '2'),

-- FN03: Purchase
(7,  'FN03', 'Price Master',             1, '/products/price-master',       'Purchase',  'fa-dollar',       'Y', '2'),

-- FN04: Return
(8,  'FN04', 'Return Delivery Challan',  1, '/logistics/return-dc',         'Return',    'fa-reply',        'Y', '2'),

-- FN05: Payment
(9,  'FN05', 'Invoice & Payment Tracker',1, '/finance/invoices',            'Payment',   'fa-inr',          'Y', '2'),

-- FN06: Marketing
(10, 'FN06', 'Lead Management',          1, '/crm/lead-master',             'Marketing', 'fa-bullhorn',     'Y', '2'),

-- FN07: Receive Stock
(11, 'FN07', 'GRN Inward Goods',         1, '/logistics/grn-receipt',       'Stock',     'fa-download',     'Y', '2'),

-- FN08: Sale Force
(12, 'FN08', 'Sales Pipeline & Leads',   1, '/crm/lead-master',             'Sales',     'fa-handshake-o',  'Y', '2'),

-- FN09: General Query
(13, 'FN09', 'Support & Query Tickets',  1, '/maintenance/tickets',         'Support',   'fa-reply',        'Y', '2'),

-- FN14: Repair
(14, 'FN14', 'Repair & Breakdown Tickets',1, '/maintenance/tickets',        'Repair',    'fa-wrench',       'Y', '2'),

-- FN15: Inventory
(15, 'FN15', 'Store Stock Sheet',        1, '/store-stock',                 'Inventory', 'fa-cubes',        'Y', '2'),

-- FN16: Invoicing & Rent
(16, 'FN16', 'Rental Orders',            1, '/rental/rental-orders',        'Rental',    'fa-file-text',    'Y', '2'),
(17, 'FN16', 'New Rental Order',         2, '/rental/rental-orders/new',    'Rental',    'fa-plus-circle',  'Y', '2'),
(18, 'FN16', 'Rental Plans & Pricing',   3, '/rental/rental-plans',         'Rental',    'fa-list',         'Y', '2'),
(19, 'FN16', 'Invoice Management',       4, '/finance/invoices',            'Rental',    'fa-inr',          'Y', '2'),

-- FN17: Happy Calling
(20, 'FN17', 'Customer Service Desk',    1, '/maintenance/tickets',         'Support',   'fa-headphones',   'Y', '2'),

-- FN18: Audit & Adjustment
(21, 'FN18', 'CCTV Audit Sheet',         1, '/audit/cctv-audit',            'Audit',     'fa-table',        'Y', '2'),
(22, 'FN18', 'Moved Data Sheet',         2, '/moved-sheet',                 'Audit',     'fa-arrow-right',  'Y', '2'),
(23, 'FN18', 'Cross Audit Sheet',        3, '/cross-audit',                 'Audit',     'fa-sliders',      'Y', '2'),

-- FN19: Vendor Management
(24, 'FN19', 'Vendor Master',            1, '/vendors/vendor-master',       'Vendors',   'fa-users',        'Y', '2'),

-- FN20: Client Management
(25, 'FN20', 'Client Master',            1, '/crm/client-master',           'Clients',   'fa-building',     'Y', '2'),

-- FN21: Product Master
(26, 'FN21', 'Product / Item Master',    1, '/products/product-master',     'Products',  'fa-cubes',        'Y', '2'),
(27, 'FN21', 'Category Master',          2, '/products/category-master',    'Products',  'fa-tags',         'Y', '2'),
(28, 'FN21', 'Sub-Category Master',      3, '/products/subcategory-master', 'Products',  'fa-sitemap',      'Y', '2'),
(29, 'FN21', 'BOM Master',               4, '/products/bom-master',         'Products',  'fa-cogs',         'Y', '2'),

-- FN22: Courier Management
(30, 'FN22', 'Courier Master',           1, '/admin/courier-master',        'Courier',   'fa-truck',        'Y', '2'),
(31, 'FN22', 'Courier Rate Cards',       2, '/logistics/courier-rates',     'Courier',   'fa-dollar',       'Y', '2'),
(32, 'FN22', 'Freight Calculator',       3, '/logistics/calculator',        'Courier',   'fa-calculator',   'Y', '2'),

-- FN23: Administration
(33, 'FN23', 'User Master',              1, '/admin/user-master',           'Admin',     'fa-user-plus',    'Y', '1'),
(34, 'FN23', 'Function Master',          2, '/admin/function-master',       'Admin',     'fa-sitemap',      'Y', '1'),
(35, 'FN23', 'Sub-Function Master',      3, '/admin/subfunction-master',    'Admin',     'fa-list-alt',     'Y', '1'),

-- FN24: Reports & Analytics
(36, 'FN24', 'Executive Analytics',      1, '/reports/analytics',           'Reports',   'fa-line-chart',   'Y', '2'),

-- FN25: Master Setup
(37, 'FN25', 'Org & Hierarchy Setup',    1, '/org/org-levels',              'Masters',   'fa-sitemap',      'Y', '1'),
(38, 'FN25', 'Location Master',          2, '/admin/location-master',       'Masters',   'fa-map-marker',   'Y', '1'),
(39, 'FN25', 'State Master',             3, '/admin/state-master',          'Masters',   'fa-map',          'Y', '1'),
(40, 'FN25', 'City Master',              4, '/admin/city-master',           'Masters',   'fa-building-o',   'Y', '1'),
(41, 'FN25', 'Brand Master',             5, '/admin/brand-master',          'Masters',   'fa-tag',          'Y', '1'),
(42, 'FN25', 'Color Master',             6, '/admin/color-master',          'Masters',   'fa-paint-brush',  'Y', '1'),
(43, 'FN25', 'Tax / HSN Master',         7, '/admin/tax-master',            'Masters',   'fa-percent',      'Y', '1'),
(44, 'FN25', 'Parameter Master',         8, '/admin/parameter-master',      'Masters',   'fa-sliders',      'Y', '1'),
(45, 'FN25', 'Bin Master',               9, '/admin/bin-master',            'Masters',   'fa-archive',      'Y', '1'),
(46, 'FN25', 'ASP Service Partner',     10, '/admin/asp-master',            'Masters',   'fa-shield',       'Y', '1'),

-- FN26: Asset Management
(47, 'FN26', 'Asset Master (Fleet)',     1, '/assets/asset-master',         'Asset',     'fa-laptop',       'Y', '2'),

-- FN27: Dispatch Cell
(48, 'FN27', 'Delivery Challan (DC)',    1, '/logistics/delivery-challan',  'Dispatch',  'fa-file-text-o',  'Y', '2'),

-- FN28: Procurement RFQ
(49, 'FN28', 'RFP / Tender Master',      1, '/crm/rfp-master',              'Procurement','fa-award',       'Y', '2');

-- 3. Automatically Grant Access in access_function for all active users
ALTER TABLE `access_function`
  ADD COLUMN IF NOT EXISTS `emp_id`          VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `sub_function_id` VARCHAR(50)  NULL;

DELETE FROM `access_function`;

INSERT INTO `access_function` (`emp_id`, `function_id`, `sub_function_id`, `status`)
SELECT u.emp_id, sf.function_id, sf.id, 'Y'
FROM `users` u
CROSS JOIN `sub_function_master` sf
JOIN `function_master` f ON sf.function_id = f.function_id
WHERE u.status = '1' AND sf.status = 'Y' AND f.status = 'Active' 
  AND u.emp_id IS NOT NULL AND u.emp_id != '';
