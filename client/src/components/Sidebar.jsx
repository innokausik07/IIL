import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutGrid, FileSpreadsheet, MoveRight, SlidersHorizontal,
  Package, LogOut, User, Database, UserPlus, MapPin,
  Map, Building2, Tag, Palette, Receipt, Truck, Settings
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'CCTV Audit Data', icon: <FileSpreadsheet size={16} />, exact: true },
  { to: '/moved-sheet', label: 'Moved Data', icon: <MoveRight size={16} /> },
  { to: '/cross-audit', label: 'Cross Audit', icon: <SlidersHorizontal size={16} /> },
  { to: '/store-stock', label: 'Store Stock', icon: <Package size={16} /> },
];

const adminItems = [
  { to: '/admin/create-user',      label: 'Create User',      icon: <UserPlus size={16} /> },
  { to: '/admin/location-master',  label: 'Location Master',  icon: <MapPin size={16} /> },
  { to: '/admin/state-master',     label: 'State Master',     icon: <Map size={16} /> },
  { to: '/admin/city-master',      label: 'City Master',      icon: <Building2 size={16} /> },
  { to: '/admin/brand-master',     label: 'Brand Master',     icon: <Tag size={16} /> },
  { to: '/admin/color-master',     label: 'Color Master',     icon: <Palette size={16} /> },
  { to: '/admin/tax-master',       label: 'Tax / HSN Master', icon: <Receipt size={16} /> },
  { to: '/admin/courier-master',   label: 'Courier Master',   icon: <Truck size={16} /> },
  { to: '/admin/parameter-master', label: 'Parameter Master', icon: <Settings size={16} /> },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">IIL</div>
        <div className="logo-text">
          Innovatiview
          <small>ERP Portal</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">Main Menu</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}

        {/* Admin Section */}
        <div className="sidebar-section" style={{ marginTop: '20px' }}>Admin</div>
        {adminItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
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
