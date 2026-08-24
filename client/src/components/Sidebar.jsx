import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileSpreadsheet, MoveRight, SlidersHorizontal,
  Package, LogOut, UserPlus, MapPin,
  Map, Building2, Tag, Palette, Receipt, Truck, Settings,
  Layers, GitFork, Cpu, CircleDollarSign, Users2, Briefcase,
  Target, FileText, Award, Archive, ShieldCheck
} from 'lucide-react';

const sheetItems = [
  { to: '/', label: 'CCTV Audit Data', icon: <FileSpreadsheet size={15} />, exact: true },
  { to: '/moved-sheet', label: 'Moved Data', icon: <MoveRight size={15} /> },
  { to: '/cross-audit', label: 'Cross Audit', icon: <SlidersHorizontal size={15} /> },
  { to: '/store-stock', label: 'Store Stock', icon: <Package size={15} /> },
];

const productItems = [
  { to: '/products/product-master',     label: 'Product / Item Master', icon: <Package size={15} /> },
  { to: '/products/category-master',    label: 'Product Category',      icon: <Layers size={15} /> },
  { to: '/products/subcategory-master', label: 'Product Sub-Category',  icon: <GitFork size={15} /> },
  { to: '/products/bom-master',          label: 'BOM Master',            icon: <Cpu size={15} /> },
  { to: '/products/price-master',        label: 'Price Master',          icon: <CircleDollarSign size={15} /> },
];

const vendorClientItems = [
  { to: '/vendors/vendor-master', label: 'Vendor Master', icon: <Users2 size={15} /> },
  { to: '/crm/client-master',     label: 'Client Master', icon: <Briefcase size={15} /> },
];

const crmItems = [
  { to: '/crm/lead-master',       label: 'Lead Management',       icon: <Target size={15} /> },
  { to: '/crm/quotation-master',  label: 'Quotation Management',  icon: <FileText size={15} /> },
  { to: '/crm/rfp-master',        label: 'RFP / Tender',          icon: <Award size={15} /> },
];

const adminItems = [
  { to: '/admin/create-user',      label: 'Create User',          icon: <UserPlus size={15} /> },
  { to: '/admin/location-master',  label: 'Location Master',      icon: <MapPin size={15} /> },
  { to: '/admin/state-master',     label: 'State Master',         icon: <Map size={15} /> },
  { to: '/admin/city-master',      label: 'City Master',          icon: <Building2 size={15} /> },
  { to: '/admin/brand-master',     label: 'Brand Master',         icon: <Tag size={15} /> },
  { to: '/admin/color-master',     label: 'Color Master',         icon: <Palette size={15} /> },
  { to: '/admin/tax-master',       label: 'Tax / HSN Master',     icon: <Receipt size={15} /> },
  { to: '/admin/courier-master',   label: 'Courier Master',       icon: <Truck size={15} /> },
  { to: '/admin/parameter-master', label: 'Parameter Master',     icon: <Settings size={15} /> },
  { to: '/admin/bin-master',       label: 'Bin Master',           icon: <Archive size={15} /> },
  { to: '/admin/asp-master',       label: 'ASP Master',           icon: <ShieldCheck size={15} /> },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderSection = (title, items) => (
    <div key={title} style={{ marginBottom: '14px' }}>
      <div className="sidebar-section" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px', color: '#888', padding: '6px 16px', fontWeight: '600' }}>
        {title}
      </div>
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exact}
          className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
          style={{ padding: '7px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="sidebar-logo">
        <div className="logo-icon">IIL</div>
        <div className="logo-text">
          Innovatiview
          <small>ERP Portal</small>
        </div>
      </div>

      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
        {renderSection('Audits & Operations', sheetItems)}
        {renderSection('Product Management', productItems)}
        {renderSection('Vendors & Clients', vendorClientItems)}
        {renderSection('CRM & Sales', crmItems)}
        {renderSection('Master Management', adminItems)}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.userid?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.userid || 'User'}</div>
            <div className="user-role">{user?.utype || 'Staff'}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
