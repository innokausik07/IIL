import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, Users, RefreshCw, Pencil, Ban, CheckCircle2, Search } from 'lucide-react';

export default function UserMaster() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [userTypeFilter, setUserTypeFilter] = useState('ALL');

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };

  const fetchUsers = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/users', { headers });
      const data = await res.json();
      if (data.status === 'success') {
        setUsers(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      toast.error('Network error while loading users');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Fetch usertypes for role display and filter
    fetch('/api/masters/usertype_master', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setUserTypes(data.data);
        }
      })
      .catch(() => console.error('Failed to load user types'));
  }, []);

  const handleToggleStatus = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message);
        fetchUsers();
      } else {
        toast.error(data.message || 'Action failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const getRoleBadge = (utype) => {
    const u = String(utype || '');
    const found = userTypes.find(t => String(t.id) === u || String(t.utype).toLowerCase() === u.toLowerCase() || String(t.typename).toLowerCase() === u.toLowerCase());
    const roleName = found ? found.typename : (u === '1' ? 'ADMIN' : (u === '2' ? 'Manager' : `User (${u || 'Default'})`));

    const isAdm = roleName.toLowerCase().includes('admin');
    const isMgr = roleName.toLowerCase().includes('manager') || roleName.toLowerCase().includes('lead');

    return (
      <span style={{
        padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
        background: isAdm ? '#fee2e2' : (isMgr ? '#e0e7ff' : '#f1f5f9'),
        color: isAdm ? '#991b1b' : (isMgr ? '#3730a3' : '#334155')
      }}>
        {roleName}
      </span>
    );
  };

  const filteredUsers = users.filter(u => {
    // Status Filter
    if (statusFilter !== 'ALL' && String(u.status ?? '1') !== statusFilter) return false;

    // User Type Filter
    if (userTypeFilter !== 'ALL') {
      const userRole = String(u.utype ?? '');
      if (userRole !== userTypeFilter) return false;
    }

    // Search query
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.emp_id || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.mobile || '').toLowerCase().includes(q) ||
      (u.owner || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container">
      {/* ─── Page Header with Add User Button ───────────────────── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Users size={20} /> Admin / Users Master
        </h1>

        <button
          onClick={() => navigate('/admin/user-master/add')}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '13px', borderRadius: '4px', fontWeight: '600' }}
        >
          <UserPlus size={15} /> Add User
        </button>
      </div>

      {/* ─── Clean Users Table Card ────────────────────────────── */}
      <div className="card" style={{ maxWidth: '1080px', margin: '0 auto', padding: '20px' }}>
        {/* Top Filters & Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <span style={{ color: '#64748b', fontWeight: '500' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '5px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', background: '#fff' }}
              >
                <option value="ALL">All Status</option>
                <option value="1">Active Only</option>
                <option value="0">Deactive Only</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <span style={{ color: '#64748b', fontWeight: '500' }}>User Type:</span>
              <select
                value={userTypeFilter}
                onChange={e => setUserTypeFilter(e.target.value)}
                style={{ padding: '5px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', background: '#fff' }}
              >
                <option value="ALL">All Roles</option>
                {userTypes.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.typename}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '8px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search name, emp ID, location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '5px 10px 5px 30px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', width: '230px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Showing <strong>{filteredUsers.length}</strong> of {users.length} users
            </span>
            <button onClick={fetchUsers} className="btn btn-secondary" style={{ fontSize: '12px', padding: '5px 12px' }}>
              <RefreshCw size={12} className={fetching ? 'spin' : ''} style={{ marginRight: '4px' }} /> Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        {fetching ? (
          <p style={{ textAlign: 'center', padding: '24px', color: '#888' }}>Loading users...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: '#fff', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '9px 12px', textAlign: 'left' }}>S.No</th>
                  <th style={{ padding: '9px 12px', textAlign: 'left' }}>Login / Emp ID</th>
                  <th style={{ padding: '9px 12px', textAlign: 'left' }}>User Name</th>
                  <th style={{ padding: '9px 12px', textAlign: 'left' }}>User Type</th>
                  <th style={{ padding: '9px 12px', textAlign: 'left' }}>Phone No.</th>
                  <th style={{ padding: '9px 12px', textAlign: 'left' }}>Email-id</th>
                  <th style={{ padding: '9px 12px', textAlign: 'left' }}>Owner (Location)</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center' }}>View/Edit</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '28px', color: '#94a3b8' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '9px 12px' }}>{idx + 1}</td>
                      <td style={{ padding: '9px 12px', fontWeight: '500' }}>{u.emp_id || `USR_${u.id}`}</td>
                      <td style={{ padding: '9px 12px', fontWeight: '600', color: '#1e293b' }}>{u.full_name}</td>
                      <td style={{ padding: '9px 12px' }}>{getRoleBadge(u.utype)}</td>
                      <td style={{ padding: '9px 12px' }}>{u.mobile || '—'}</td>
                      <td style={{ padding: '9px 12px' }}>{u.email || '—'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ fontWeight: '500', color: '#0369a1' }}>{u.owner || '—'}</span>
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500',
                          background: String(u.status) === '1' ? '#d4edda' : '#f8d7da',
                          color: String(u.status) === '1' ? '#155724' : '#721c24'
                        }}>
                          {String(u.status) === '1' ? 'active' : 'deactive'}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => navigate(`/admin/user-master/edit/${u.id}`)}
                          title="Edit User"
                          style={{
                            background: 'none', border: '1px solid #3b82f6', borderRadius: '4px',
                            color: '#3b82f6', padding: '3px 8px', marginRight: '6px', cursor: 'pointer', fontSize: '12px'
                          }}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          title={String(u.status) === '1' ? 'Deactivate' : 'Activate'}
                          style={{
                            background: 'none',
                            border: `1px solid ${String(u.status) === '1' ? '#ef4444' : '#22c55e'}`,
                            borderRadius: '4px',
                            color: String(u.status) === '1' ? '#ef4444' : '#22c55e',
                            padding: '3px 8px', cursor: 'pointer', fontSize: '12px'
                          }}
                        >
                          {String(u.status) === '1' ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
