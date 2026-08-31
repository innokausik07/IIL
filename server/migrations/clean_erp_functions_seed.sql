-- ============================================================
-- Clean & Exact 11 ERP Modules & Sub-Functions Mapping
-- 100% 1-to-1 matched with React Pages & Routes in App.jsx
-- Run in phpMyAdmin > innovatiview_new > SQL tab
-- ============================================================

-- 1. Reset function_master and sub_function_master cleanly
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `function_master`;
TRUNCATE TABLE `sub_function_master`;
SET FOREIGN_KEY_CHECKS = 1;

-- 2. Insert The Exact 11 Enterprise Functions
INSERT INTO `function_master` (`id`, `function_id`, `function_name`, `descrip`, `icon_img`, `status`, `utype`, `tab`) VALUES
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

-- 3. Insert Exactly Mapped Sub-Functions (100% matching App.jsx routes)
INSERT INTO `sub_function_master` (`id`, `function_id`, `sub_name`, `sub_seq`, `file_name`, `tab`, `icon_img`, `status`, `utype`) VALUES
-- ── Module 1: Operations & Audit (FN01)
(1,  'FN01', 'CCTV Audit Sheet',        1, '/audit/cctv-audit',            'Audit',     'fa-table',        'Y', '2'),
(2,  'FN01', 'Moved Data Sheet',        2, '/moved-sheet',                 'Audit',     'fa-arrow-right',  'Y', '2'),
(3,  'FN01', 'Cross Audit Sheet',       3, '/cross-audit',                 'Audit',     'fa-sliders',      'Y', '2'),
(4,  'FN01', 'Store Stock Sheet',       4, '/store-stock',                 'Audit',     'fa-database',     'Y', '2'),

-- ── Module 2: Asset Management (FN02)
(5,  'FN02', 'Asset Master',            1, '/assets/asset-master',         'Asset',     'fa-laptop',       'Y', '2'),

-- ── Module 3: Rental Management (FN03)
(6,  'FN03', 'Rental Orders',           1, '/rental/rental-orders',        'Rental',    'fa-file-text',    'Y', '2'),
(7,  'FN03', 'New Rental Order',        2, '/rental/rental-orders/new',    'Rental',    'fa-plus-circle',  'Y', '2'),
(8,  'FN03', 'Rental Plans & Pricing',  3, '/rental/rental-plans',         'Rental',    'fa-list',         'Y', '2'),

-- ── Module 4: Finance & Billing (FN04)
(9,  'FN04', 'Invoice Management',      1, '/finance/invoices',            'Finance',   'fa-inr',          'Y', '2'),

-- ── Module 5: Service & Repair (FN05)
(10, 'FN05', 'Service Tickets',         1, '/maintenance/tickets',         'Repair',    'fa-ticket',       'Y', '2'),

-- ── Module 6: Reports & Analytics (FN06)
(11, 'FN06', 'Executive Analytics',     1, '/reports/analytics',           'Reports',   'fa-line-chart',   'Y', '2'),

-- ── Module 7: Logistics & Dispatch (FN07)
(12, 'FN07', 'Freight Calculator',      1, '/logistics/calculator',        'Logistics', 'fa-calculator',   'Y', '2'),
(13, 'FN07', 'Delivery Challan (DC)',   2, '/logistics/delivery-challan',  'Logistics', 'fa-file-text-o',  'Y', '2'),
(14, 'FN07', 'GRN Inward Receipt',      3, '/logistics/grn-receipt',       'Logistics', 'fa-download',     'Y', '2'),
(15, 'FN07', 'Return DC',               4, '/logistics/return-dc',         'Logistics', 'fa-reply',        'Y', '2'),
(16, 'FN07', 'Shipment Tracking',       5, '/logistics/dispatch-tracking', 'Logistics', 'fa-truck',        'Y', '2'),
(17, 'FN07', 'Courier Rate Cards',      6, '/logistics/courier-rates',     'Logistics', 'fa-dollar',       'Y', '2'),

-- ── Module 8: Product Master (FN08)
(18, 'FN08', 'Product / Item Master',   1, '/products/product-master',     'Products',  'fa-cubes',        'Y', '2'),
(19, 'FN08', 'Category Master',         2, '/products/category-master',    'Products',  'fa-tags',         'Y', '2'),
(20, 'FN08', 'Sub-Category Master',     3, '/products/subcategory-master', 'Products',  'fa-sitemap',      'Y', '2'),
(21, 'FN08', 'BOM Master',              4, '/products/bom-master',         'Products',  'fa-cogs',         'Y', '2'),
(22, 'FN08', 'Price Master',            5, '/products/price-master',       'Products',  'fa-dollar',       'Y', '2'),

-- ── Module 9: CRM & Sales (FN09)
(23, 'FN09', 'Client Master',           1, '/crm/client-master',           'CRM',       'fa-building',     'Y', '2'),
(24, 'FN09', 'Vendor Master',           2, '/vendors/vendor-master',       'CRM',       'fa-users',        'Y', '2'),
(25, 'FN09', 'Lead Management',         3, '/crm/lead-master',             'CRM',       'fa-bullhorn',     'Y', '2'),
(26, 'FN09', 'Quotation Master',        4, '/crm/quotation-master',        'CRM',       'fa-file-text',    'Y', '2'),
(27, 'FN09', 'RFP / Tender Master',     5, '/crm/rfp-master',              'CRM',       'fa-award',        'Y', '2'),

-- ── Module 10: Master Setup (FN10)
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

-- ── Module 11: Administration (FN11)
(39, 'FN11', 'User Master',             1, '/admin/user-master',           'Admin',     'fa-user-plus',    'Y', '1'),
(40, 'FN11', 'Function Master',         2, '/admin/function-master',       'Admin',     'fa-sitemap',      'Y', '1'),
(41, 'FN11', 'Sub-Function Master',     3, '/admin/subfunction-master',    'Admin',     'fa-list-alt',     'Y', '1');

-- 4. Auto Grant Access in access_function for all active users
ALTER TABLE `access_function`
  ADD COLUMN IF NOT EXISTS `emp_id`          VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `sub_function_id` VARCHAR(50)  NULL;

-- Clean existing permissions and grant cleanly for all 41 real sub-functions
DELETE FROM `access_function`;

INSERT INTO `access_function` (`emp_id`, `function_id`, `sub_function_id`, `status`)
SELECT u.emp_id, sf.function_id, sf.id, 'Y'
FROM `users` u
CROSS JOIN `sub_function_master` sf
WHERE u.status = '1' AND sf.status = 'Y' AND u.emp_id IS NOT NULL AND u.emp_id != '';
