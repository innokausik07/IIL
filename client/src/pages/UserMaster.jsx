import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, Users, RefreshCw, Pencil, Ban, CheckCircle2, Search, X, Download } from 'lucide-react';

export default function UserMaster() {
  const navigate = useNavigate();
  const [users, setUsers]               = useState([]);
  const [userTypes, setUserTypes]       = useState([]);
  const [fetching, setFetching]         = useState(false);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const [limit, setLimit]               = useState(50);
  const [selectedIds, setSelectedIds]   = useState([]);

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

  const handleExportCsv = () => {
    if (users.length === 0) { toast.error('No users to export'); return; }
    const headersCsv = '"S.No","Emp ID","User Name","User Type","Mobile","Email","Owner","Status"';
    const rowsCsv = users.map((u, i) =>
      `"${i+1}","${u.emp_id||''}","${u.full_name||''}","${u.utype||''}","${u.mobile||''}","${u.email||''}","${u.owner||''}","${String(u.status)==='1'?'Active':'Inactive'}"`
    ).join('\n');
    const blob = new Blob([headersCsv + '\n' + rowsCsv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'users_export.csv';
    a.click();
    toast.success('Exported to CSV');
  };

  const getRoleBadge = (utype) => {
    const u = String(utype || '');
    const found = userTypes.find(t => String(t.id) === u || String(t.utype).toLowerCase() === u.toLowerCase() || String(t.typename).toLowerCase() === u.toLowerCase());
    const roleName = found ? found.typename : (u === '1' ? 'ADMIN' : (u === '2' ? 'Manager' : `User (${u || 'Default'})`));

    const isAdm = roleName.toLowerCase().includes('admin');
    const isMgr = roleName.toLowerCase().includes('manager') || roleName.toLowerCase().includes('lead');

    return (
      <span className={`badge ${isAdm ? 'badge-workdone' : isMgr ? 'badge-assigned' : 'badge-default'}`}>
        {roleName}
      </span>
    );
  };

  const filteredUsers = users.filter(u => {
    if (statusFilter && String(u.status ?? '1') !== statusFilter) return false;
    if (userTypeFilter && String(u.utype ?? '') !== userTypeFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.emp_id || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.mobile || '').toLowerCase().includes(q) ||
      (u.owner || '').toLowerCase().includes(q)
    );
  });

  const totalRecords = filteredUsers.length;
  const totalPages   = Math.ceil(totalRecords / limit) || 1;
  const pagedList    = filteredUsers.slice((page - 1) * limit, page * limit);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(pagedList.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <>
      {/* ── 1. Top Bar (CCTV Audit Style) ────────────────────────────── */}
      <div className="topbar">
        <div>
          <span className="topbar-title">Admin / Users Master</span>
          <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>
            {totalRecords.toLocaleString()} total records
          </span>
        </div>
        <div className="topbar-actions">
          <button id="btn-refresh" className="btn btn-secondary" onClick={fetchUsers}>
            <RefreshCw size={14} className={fetching ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/user-master/add')}>
            <UserPlus size={14} /> Add User
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* ── 2. Filter Bar (CCTV Audit Style) ───────────────────────── */}
        <div className="filter-bar">
          <div className="filter-grid">
            <div className="filter-group">
              <label>Search Keyword</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search name, emp ID, email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            <div className="filter-group">
              <label>User Type</label>
              <select
                className="form-select"
                value={userTypeFilter}
                onChange={e => { setUserTypeFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Roles</option>
                {userTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.typename}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="1">Active Only</option>
                <option value="0">Deactive Only</option>
              </select>
            </div>

            <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <button className="btn btn-primary" onClick={() => setPage(1)} style={{ flex: 1 }}>
                <Search size={13} /> Search
              </button>
              {(search || userTypeFilter || statusFilter) && (
                <button className="btn btn-secondary" onClick={() => { setSearch(''); setUserTypeFilter(''); setStatusFilter(''); setPage(1); }}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── 3. Action Buttons Row ──────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-body" style={{ padding: '10px 14px' }}>
            <div className="btn-group">
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/user-master/add')}>
                <UserPlus size={13} /> Add User
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleExportCsv}>
                <Download size={13} /> Export CSV
              </button>
              <button className="btn btn-secondary btn-sm" onClick={fetchUsers}>
                <RefreshCw size={13} className={fetching ? 'spin' : ''} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Selection bar */}
        {selectedIds.length > 0 && (
          <div className="selected-bar">
            <span>{selectedIds.length} user{selectedIds.length > 1 ? 's' : ''} selected</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedIds([])}>
              <X size={12} /> Deselect All
            </button>
          </div>
        )}

        {/* ── 4. Data Table Container (CCTV Audit Style) ─────────────── */}
        <div className="table-container">
          <div className="table-toolbar">
            <span className="table-info">
              Showing {totalRecords > 0 ? ((page - 1) * limit + 1) : 0}–
              {Math.min(page * limit, totalRecords)} of {totalRecords.toLocaleString()}
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select
                className="form-select"
                style={{ width: 80 }}
                value={limit}
                onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              >
                {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span style={{ fontSize: 11, color: '#64748b' }}>per page</span>
            </div>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="check-cell">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={pagedList.length > 0 && selectedIds.length === pagedList.length}
                    />
                  </th>
                  <th style={{ width: 45 }}>#</th>
                  <th>Emp ID</th>
                  <th>User Name</th>
                  <th>User Type</th>
                  <th>Phone No.</th>
                  <th>Email-ID</th>
                  <th>Owner (Location)</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center', width: 90 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fetching ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      <div className="spinner" style={{ margin: '0 auto 10px', width: 24, height: 24 }}></div>
                      Loading users...
                    </td>
                  </tr>
                ) : pagedList.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  pagedList.map((u, idx) => {
                    const isSelected = selectedIds.includes(u.id);
                    const isActive = String(u.status) === '1';

                    return (
                      <tr key={u.id} className={isSelected ? 'selected' : ''}>
                        <td className="check-cell">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(u.id)}
                          />
                        </td>
                        <td style={{ color: '#94a3b8' }}>{(page - 1) * limit + idx + 1}</td>
                        <td><strong>{u.emp_id || `USR_${u.id}`}</strong></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {u.profile_img ? (
                              <img src={u.profile_img} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                            ) : (
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>
                                {(u.full_name || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <strong style={{ color: '#1e293b' }}>{u.full_name}</strong>
                          </div>
                        </td>
                        <td>{getRoleBadge(u.utype)}</td>
                        <td>{u.mobile || '—'}</td>
                        <td>{u.email || '—'}</td>
                        <td>
                          <span style={{ color: '#0369a1', fontWeight: '500' }}>{u.owner || '—'}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${isActive ? 'badge-ack' : 'badge-default'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => navigate(`/admin/user-master/edit/${u.id}`)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 7px', marginRight: 4 }}
                            title="Edit User"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/user-master/edit/${u.id}?rights=1`)}
                            className="btn btn-sm"
                            style={{ background: '#1e293b', color: '#fff', padding: '3px 7px', marginRight: 4 }}
                            title="Update Module Rights"
                          >
                            <Shield size={12} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u.id)}
                            className={`btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'}`}
                            style={{ padding: '3px 7px' }}
                            title={isActive ? 'Deactivate' : 'Activate'}
                          >
                            {isActive ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── 5. Pagination Bar ──────────────────────────────────────── */}
          <div className="pagination">
            <span className="pagination-info">
              Page {page} of {totalPages} ({totalRecords.toLocaleString()} users)
            </span>
            <div className="pagination-btns">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(1)}>«</button>
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, page - 2) + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    className={`page-btn${p === page ? ' active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
