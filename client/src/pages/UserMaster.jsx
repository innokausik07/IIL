import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, Users, RefreshCw, Pencil, Ban, CheckCircle2, Search, ArrowLeft } from 'lucide-react';

const INIT_FORM = {
  userType: '',
  owner: '',
  empId: '',
  password: '',
  userName: '',
  altMobile: '',
  mobileNo: '',
  emailId: '',
  status: '1',
};

export default function UserMaster() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(INIT_FORM);
  const [editId, setEditId] = useState(null);
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [loading, setLoading] = useState(false);
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
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNew = () => {
    setForm(INIT_FORM);
    setEditId(null);
    setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userName) {
      toast.error('User Name is required.');
      return;
    }
    if (!editId && !form.password) {
      toast.error('Password is required for new users.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = editId ? `/api/users/${editId}` : '/api/users/create';
      const method   = editId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message || (editId ? 'User updated successfully!' : 'User created successfully!'));
        setForm(INIT_FORM);
        setEditId(null);
        setView('list'); // Return to list view
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to save user');
      }
    } catch (err) {
      toast.error('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (u) => {
    setEditId(u.id);
    setForm({
      userType: String(u.utype ?? ''),
      owner: u.owner ?? '',
      empId: u.emp_id ?? '',
      password: '',
      userName: u.full_name ?? '',
      altMobile: u.alt_mobile ?? '',
      mobileNo: u.mobile ?? '',
      emailId: u.email ?? '',
      status: String(u.status ?? '1'),
    });
    setView('form');
  };

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
    const u = String(utype);
    if (u === '1') return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', background: '#fee2e2', color: '#991b1b', fontWeight: '600' }}>Admin (1)</span>;
    if (u === '2') return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', background: '#e0e7ff', color: '#3730a3', fontWeight: '600' }}>Manager (2)</span>;
    return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', background: '#f1f5f9', color: '#475569' }}>Standard ({u || '9'})</span>;
  };

  const filteredUsers = users.filter(u => {
    // Status Filter
    if (statusFilter !== 'ALL' && String(u.status ?? '1') !== statusFilter) return false;

    // User Type Filter
    if (userTypeFilter !== 'ALL' && String(u.utype ?? '') !== userTypeFilter) return false;

    // Search query
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.emp_id || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.mobile || '').toLowerCase().includes(q)
    );
  });

  const fieldStyle = { flex: 1, padding: '7px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', width: '100%' };
  const labelStyle = { flex: '0 0 38%', fontWeight: '500', fontSize: '13px' };
  const rowStyle   = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' };

  return (
    <div className="page-container">
      {/* ─── Page Header with Add User Button ───────────────────── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Users size={20} /> Admin / Users Master
        </h1>

        {view === 'list' ? (
          <button
            onClick={handleAddNew}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '13px', borderRadius: '4px', fontWeight: '600' }}
          >
            <UserPlus size={15} /> Add User
          </button>
        ) : (
          <button
            onClick={() => { setView('list'); setEditId(null); setForm(INIT_FORM); }}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
          >
            <ArrowLeft size={14} /> Back to Users List
          </button>
        )}
      </div>

      {/* ─── View 1: List / Table View (Default) ───────────────── */}
      {view === 'list' && (
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
                  <option value="1">Admin (1)</option>
                  <option value="2">Manager (2)</option>
                  <option value="9">Standard User (9)</option>
                </select>
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '8px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search name, emp ID, email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: '5px 10px 5px 30px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', width: '220px' }}
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
                    <th style={{ padding: '9px 12px', textAlign: 'left' }}>Owner</th>
                    <th style={{ padding: '9px 12px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '9px 12px', textAlign: 'center' }}>View/Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '28px', color: '#94a3b8' }}>
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
                        <td style={{ padding: '9px 12px' }}>{u.owner || '—'}</td>
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
                            onClick={() => handleEdit(u)}
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
      )}

      {/* ─── View 2: Add / Edit User Form (Only opens on Add User / Edit click) ── */}
      {view === 'form' && (
        <div className="card" style={{ maxWidth: '960px', margin: '0 auto 24px', padding: '28px' }}>
          <h3 style={{ marginBottom: '18px', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserPlus size={16} />
            {editId ? `Edit User #${editId}` : 'Add New User'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

              {/* Left Column */}
              <div>
                <div style={rowStyle}>
                  <label style={labelStyle}>User Type</label>
                  <select name="userType" value={form.userType} onChange={handleChange} style={fieldStyle}>
                    <option value="">-- Please Select --</option>
                    <option value="1">Admin (1)</option>
                    <option value="2">Manager (2)</option>
                    <option value="9">Standard User (9)</option>
                  </select>
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>Emp. ID</label>
                  <input type="text" name="empId" value={form.empId} onChange={handleChange} style={fieldStyle} placeholder="e.g. EMP1001" />
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>User Name <span style={{ color: 'red' }}>*</span></label>
                  <input type="text" name="userName" value={form.userName} onChange={handleChange} required style={fieldStyle} placeholder="Full Name" />
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>Mobile No.</label>
                  <input type="text" name="mobileNo" value={form.mobileNo} onChange={handleChange} style={fieldStyle} placeholder="10-digit mobile" />
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>Email-Id</label>
                  <input type="email" name="emailId" value={form.emailId} onChange={handleChange} style={fieldStyle} placeholder="name@company.com" />
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>Status</label>
                  <select name="status" value={form.status} onChange={handleChange} style={fieldStyle}>
                    <option value="1">Activate</option>
                    <option value="0">Deactivate</option>
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <div style={rowStyle}>
                  <label style={labelStyle}>Owner</label>
                  <select name="owner" value={form.owner} onChange={handleChange} style={fieldStyle}>
                    <option value="">-- Please Select --</option>
                    <option value="Innovatiview">Innovatiview</option>
                    <option value="Vendor">Vendor</option>
                  </select>
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>
                    Password {editId ? <span style={{ fontSize: '11px', color: '#666' }}>(Leave blank to keep current)</span> : <span style={{ color: 'red' }}>*</span>}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required={!editId}
                    style={fieldStyle}
                    placeholder={editId ? '••••••••' : 'Enter password'}
                  />
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>Alt. Mobile No.</label>
                  <input type="text" name="altMobile" value={form.altMobile} onChange={handleChange} style={fieldStyle} placeholder="Alternate contact" />
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>Profile Img.</label>
                  <div style={{ flex: 1 }}>
                    <input type="file" accept="image/*" style={fieldStyle} disabled title="Image upload coming soon" />
                    <small style={{ color: '#888', fontSize: '11px' }}>Standard 220px × 220px</small>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '9px 36px', fontSize: '13px' }}
              >
                {loading ? 'Saving...' : (editId ? 'Update User' : 'Save User')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '9px 24px', fontSize: '13px' }}
                onClick={() => { setView('list'); setEditId(null); setForm(INIT_FORM); }}
              >
                Back to Users List
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
