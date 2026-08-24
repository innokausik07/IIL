import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileSpreadsheet, MoveRight, SlidersHorizontal, Package, LogOut, UserPlus, MapPin,
  Map, Building2, Tag, Palette, Receipt, Truck, Settings, Layers, GitFork, Cpu,
  CircleDollarSign, Users2, Briefcase, Target, FileText, Award, Archive, ShieldCheck,
  Calculator, Send, DownloadCloud, Undo2, Navigation, DollarSign, Network, GitMerge,
  ChevronDown, ChevronRight, Folder, LayoutGrid, RefreshCw
} from 'lucide-react';

// Map icon string names from database (fa-*) to Lucide icons
const getIcon = (iconName, size = 15) => {
  if (!iconName) return <Folder size={size} />;
  const n = iconName.toLowerCase().replace('fa-', '');
  
  if (n.includes('truck'))        return <Truck size={size} />;
  if (n.includes('desktop'))      return <SlidersHorizontal size={size} />;
  if (n.includes('cart') || n.includes('basket')) return <Package size={size} />;
  if (n.includes('reply') || n.includes('undo'))  return <Undo2 size={size} />;
  if (n.includes('briefcase'))    return <Briefcase size={size} />;
  if (n.includes('bullhorn') || n.includes('target')) return <Target size={size} />;
  if (n.includes('suitcase') || n.includes('cube')) return <Package size={size} />;
  if (n.includes('calculator'))   return <Calculator size={size} />;
  if (n.includes('list') || n.includes('table')) return <FileSpreadsheet size={size} />;
  if (n.includes('file') || n.includes('text'))  return <FileText size={size} />;
  if (n.includes('award'))        return <Award size={size} />;
  if (n.includes('map-marker') || n.includes('location')) return <MapPin size={size} />;
  if (n.includes('map'))          return <Map size={size} />;
  if (n.includes('building'))     return <Building2 size={size} />;
  if (n.includes('tag'))          return <Tag size={size} />;
  if (n.includes('paint') || n.includes('brush')) return <Palette size={size} />;
  if (n.includes('dollar') || n.includes('inr'))  return <CircleDollarSign size={size} />;
  if (n.includes('user-plus'))    return <UserPlus size={size} />;
  if (n.includes('user') || n.includes('group'))  return <Users2 size={size} />;
  if (n.includes('sitemap') || n.includes('tree')) return <Network size={size} />;
  if (n.includes('archive'))      return <Archive size={size} />;
  if (n.includes('shield'))       return <ShieldCheck size={size} />;
  if (n.includes('download'))     return <DownloadCloud size={size} />;
  if (n.includes('cogs') || n.includes('gear')) return <Settings size={size} />;
  if (n.includes('share') || n.includes('upload')) return <Send size={size} />;
  if (n.includes('arrow'))        return <MoveRight size={size} />;
  
  return <Folder size={size} />;
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuTree, setMenuTree] = useState([]);
  const [openSections, setOpenSections] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch dynamic navigation tree from database
  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/navigation', {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        setMenuTree(data.data);
        
        // Auto-open section matching current active route
        const activeMap = {};
        data.data.forEach(fn => {
          const hasActive = fn.sub_functions?.some(sub => sub.file_name === location.pathname);
          activeMap[fn.function_id] = hasActive ? true : true; // Default expanded for great UX
        });
        setOpenSections(activeMap);
      }
    } catch (err) {
      console.error('Failed to load navigation menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const toggleSection = (fnId) => {
    setOpenSections(prev => ({ ...prev, [fnId]: !prev[fnId] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Brand Header */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="logo-icon">IIL</div>
          <div className="logo-text">
            Innovatiview
            <small>Dynamic ERP</small>
          </div>
        </div>
        <button onClick={fetchMenu} title="Sync Navigation from Database" style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Dynamic Nav Menu */}
      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
        {loading && menuTree.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '12px' }}>
            Loading ERP Modules...
          </div>
        ) : menuTree.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '12px' }}>
            No active functions in database.
          </div>
        ) : (
          menuTree.map(fn => {
            const isOpen = openSections[fn.function_id] ?? true;
            return (
              <div key={fn.function_id} style={{ marginBottom: '6px' }}>
                {/* Module / Function Header */}
                <div
                  onClick={() => toggleSection(fn.function_id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    userSelect: 'none',
                    borderRadius: '4px',
                    margin: '0 8px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1e293b'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getIcon(fn.icon_img, 14)}
                    <span>{fn.function_name}</span>
                  </div>
                  {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </div>

                {/* Sub-Functions / Sub-Modules */}
                {isOpen && (
                  <div style={{ paddingLeft: '8px', marginTop: '2px' }}>
                    {fn.sub_functions.map(sub => (
                      <NavLink
                        key={sub.id + sub.file_name}
                        to={sub.file_name || '/'}
                        className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
                        style={{ padding: '6px 16px 6px 28px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        {getIcon(sub.icon_img, 14)}
                        <span>{sub.sub_name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* User Footer */}
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
