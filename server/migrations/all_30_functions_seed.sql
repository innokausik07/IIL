-- ============================================================
-- Complete 30 Functions & All Sub-Functions Import
-- Run in phpMyAdmin > innovatiview_new > SQL tab
-- ============================================================

-- Clear existing data to rebuild cleanly
TRUNCATE TABLE `function_master`;
TRUNCATE TABLE `sub_function_master`;

-- 1. All 30 Functions from Devsite & Modern ERP
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
(10, 'FN10', 'App Transaction',    'Mobile App related live transactions & activity logs',       'fa-mobile',        'Active', '2', 0.00),
(11, 'FN11', 'HRMS HR.',           'Human Resource Master, Employee Management & Policies',     'fa-user',          'Active', '2', 0.00),
(12, 'FN12', 'HRMS Emp.',          'Employee Self Service, Leaves, Attendance & Payroll',       'fa-group',         'Active', '2', 0.00),
(13, 'FN13', 'HRMS Report',        'HRMS Analytics, Attendance Reports & Performance Logs',     'fa-reply',         'Active', '2', 0.00),
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
(29, 'FN29', 'Notice Board',       'Internal Announcements, Circulars & Employee Broadcasts',   'fa-bullhorn',      'Active', '2', 23.00),
(30, 'FN30', 'System Security',    'User Access Logs, IP Whitelisting & Audit Logs',            'fa-shield',        'Active', '1', 24.00);

-- 2. Complete Sub-Functions Mapping
INSERT INTO `sub_function_master` (`id`, `function_id`, `sub_name`, `sub_seq`, `file_name`, `tab`, `icon_img`, `status`, `utype`) VALUES
-- Logistics (FN01)
(1,  'FN01', 'Freight Calculator',       1, '/logistics/calculator',        'Logistics', 'fa-calculator',   'Y', '2'),
(2,  'FN01', 'Delivery Challan (DC)',    2, '/logistics/delivery-challan',  'Logistics', 'fa-list',         'Y', '2'),
(3,  'FN01', 'PENDING DC',               3, '/logistics/delivery-challan',  'Logistics', 'fa-list',         'Y', '1'),
(4,  'FN01', 'Shipment Tracking',        4, '/logistics/dispatch-tracking', 'Logistics', 'fa-truck',        'Y', '2'),
(5,  'FN01', 'Courier Rate Cards',       5, '/logistics/courier-rates',     'Logistics', 'fa-dollar',       'Y', '2'),
(6,  'FN01', 'Dispatch Report',          6, '/logistics/dispatch-tracking', 'Logistics', 'fa-file-text',    'Y', '1'),

-- Sales & Orders (FN02)
(7,  'FN02', 'SRD Billing',              1, '/crm/quotation-master',        'Sales',     'fa-upload',       'Y', '1'),
(8,  'FN02', 'Order List (RO)',          2, '/crm/lead-master',             'Sales',     'fa-list',         'Y', '2'),
(9,  'FN02', 'Quotation Management',     3, '/crm/quotation-master',        'Sales',     'fa-file-text',    'Y', '2'),
(10, 'FN02', 'RFP / Tender Management',  4, '/crm/rfp-master',              'Sales',     'fa-award',        'Y', '2'),

-- Purchase (FN03)
(11, 'FN03', 'Purchase Order (PO)',      1, '/products/price-master',       'Purchase',  'fa-list',         'Y', '2'),
(12, 'FN03', 'Purchase Requisitions (PR)',2, '/products/price-master',      'Purchase',  'fa-file-text',    'Y', '2'),

-- Return (FN04)
(13, 'FN04', 'Return Delivery Challan',  1, '/logistics/return-dc',         'Return',    'fa-reply',        'Y', '2'),
(14, 'FN04', 'Reverse Pickup Requests',  2, '/logistics/return-dc',         'Return',    'fa-undo',         'Y', '2'),

-- Payment (FN05)
(15, 'FN05', 'Payment Receive',          1, '/crm/quotation-master',        'Payment',   'fa-inr',          'Y', '2'),
(16, 'FN05', 'Payment Approval',         2, '/crm/quotation-master',        'Payment',   'fa-check-circle', 'Y', '2'),

-- Marketing & Leads (FN06)
(17, 'FN06', 'Lead Management',          1, '/crm/lead-master',             'Marketing', 'fa-target',       'Y', '2'),
(18, 'FN06', 'Target Assign & View',     2, '/crm/lead-master',             'Marketing', 'fa-crosshairs',   'Y', '1'),

-- Receive Stock (FN07)
(19, 'FN07', 'GRN Inward Goods',         1, '/logistics/grn-receipt',       'Stock',     'fa-download',     'Y', '2'),
(20, 'FN07', 'From Location Transfer',   2, '/logistics/grn-receipt',       'Stock',     'fa-level-down',   'Y', '2'),

-- Inventory & Products (FN15 / FN21)
(21, 'FN15', 'Product / Item Master',    1, '/products/product-master',     'Inventory', 'fa-cubes',        'Y', '2'),
(22, 'FN15', 'Product Category',         2, '/products/category-master',    'Inventory', 'fa-tags',         'Y', '2'),
(23, 'FN15', 'Product Sub-Category',     3, '/products/subcategory-master', 'Inventory', 'fa-sitemap',      'Y', '2'),
(24, 'FN15', 'BOM Master',               4, '/products/bom-master',         'Inventory', 'fa-cogs',         'Y', '2'),
(25, 'FN15', 'Price Master',             5, '/products/price-master',       'Inventory', 'fa-dollar',       'Y', '2'),

-- Audits & Sheets (FN18)
(26, 'FN18', 'CCTV Audit Data',          1, '/',                            'Audit',     'fa-table',        'Y', '2'),
(27, 'FN18', 'Moved Data Audit',         2, '/moved-sheet',                 'Audit',     'fa-arrow-right',  'Y', '2'),
(28, 'FN18', 'Cross Audit',              3, '/cross-audit',                 'Audit',     'fa-sliders',      'Y', '2'),
(29, 'FN18', 'Store Stock Sheet',        4, '/store-stock',                 'Audit',     'fa-database',     'Y', '2'),

-- Vendors & Clients (FN19 / FN20)
(30, 'FN19', 'Vendor Master',            1, '/vendors/vendor-master',       'Vendors',   'fa-users',        'Y', '2'),
(31, 'FN20', 'Client Master',            1, '/crm/client-master',           'Clients',   'fa-building',     'Y', '2'),

-- Administration & Masters (FN23 / FN25)
(32, 'FN23', 'Create User',              1, '/admin/create-user',           'Admin',     'fa-user-plus',    'Y', '1'),
(33, 'FN23', 'Function Master',          2, '/admin/function-master',       'Admin',     'fa-sitemap',      'Y', '1'),
(34, 'FN23', 'Sub-Function Master',      3, '/admin/subfunction-master',    'Admin',     'fa-list-alt',     'Y', '1'),
(35, 'FN25', 'Location Master',          1, '/admin/location-master',       'Masters',   'fa-map-marker',   'Y', '1'),
(36, 'FN25', 'State Master',             2, '/admin/state-master',          'Masters',   'fa-map',          'Y', '1'),
(37, 'FN25', 'City Master',              3, '/admin/city-master',           'Masters',   'fa-building-o',   'Y', '1'),
(38, 'FN25', 'Brand Master',             4, '/admin/brand-master',          'Masters',   'fa-tag',          'Y', '1'),
(39, 'FN25', 'Color Master',             5, '/admin/color-master',          'Masters',   'fa-paint-brush',  'Y', '1'),
(40, 'FN25', 'Tax / HSN Master',         6, '/admin/tax-master',            'Masters',   'fa-file-text',    'Y', '1'),
(41, 'FN25', 'Courier Master',           7, '/admin/courier-master',        'Masters',   'fa-truck',        'Y', '1'),
(42, 'FN25', 'Parameter Master',         8, '/admin/parameter-master',      'Masters',   'fa-sliders',      'Y', '1'),
(43, 'FN25', 'Bin Master',               9, '/admin/bin-master',            'Masters',   'fa-archive',      'Y', '1'),
(44, 'FN25', 'ASP Master',              10, '/admin/asp-master',            'Masters',   'fa-shield',       'Y', '1');
