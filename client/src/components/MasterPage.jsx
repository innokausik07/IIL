import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Pencil, Ban, ArrowLeft, Search, CheckCircle2, Eye } from 'lucide-react';
import { lookupPincode } from '../utils/pincodeLookup';

/**
 * Generic Master Page Component
 * Props:
 *  - title: string
 *  - icon: JSX element
 *  - apiPath: string  (e.g. 'state_master')
 *  - fields: array of { name, label, type?, required?, options?, default? }
 *  - columns: array of { key, label }
 */
export default function MasterPage({ title, icon, apiPath, fields, columns }) {
  const INIT = Object.fromEntries(fields.map(f => [f.name, f.default ?? '']));
  const [list, setList]         = useState([]);
  const [form, setForm]         = useState(INIT);
  const [editId, setEditId]     = useState(null);
  const [view, setView]         = useState('list'); // 'list' or 'form'
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const token = localStorage.getItem('token');
  const hdr   = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };
  const url   = `/api/masters/${apiPath}`;

  const fetchList = async () => {
    setFetching(true);
    try {
      const res  = await fetch(url, { headers: hdr });
      const data = await res.json();
      if (data.status === 'success') setList(data.data || []);
    } catch (e) { toast.error('Failed to load data'); }
    finally { setFetching(false); }
  };

  useEffect(() => { fetchList(); }, []);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    // Global Auto-Pincode Detection
    if (name.toLowerCase().includes('pin') || name.toLowerCase().includes('zip')) {
      const cleanPin = value.replace(/\D/g, '');
      if (cleanPin.length === 6) {
        const res = await lookupPincode(cleanPin);
        if (res) {
          setForm(prev => {
            const next = { ...prev };
            fields.forEach(f => {
              const fname = f.name.toLowerCase();
              if (fname === 'city' || fname === 'district' || fname === 'city_name') {
                next[f.name] = res.city;
              }
              if (fname === 'state' || fname === 'state_name') {
                next[f.name] = res.state;
              }
            });
            return next;
          });
          toast.success(`Auto-filled: ${res.city}, ${res.state}`);
        }
      }
    }
  };

  const handleAddNew = () => {
    setForm(INIT);
    setEditId(null);
    setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = editId ? 'PUT' : 'POST';
      const endpoint = editId ? `${url}/${editId}` : url;
      const res  = await fetch(endpoint, { method, headers: hdr, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message || 'Saved successfully!');
        setForm(INIT);
        setEditId(null);
        setView('list'); // Return to list view
        fetchList();
      } else {
        toast.error(data.message || 'Error');
      }
    } catch (e) { toast.error('Network error: ' + e.message); }
    finally { setLoading(false); }
  };

  const handleEdit = (row) => {
    const idKeys = ['sno', 'id', 'catid', 'psubcatid'];
    const id = idKeys.map(k => row[k]).find(v => v != null);
    setEditId(id);
    const populated = {};
    fields.forEach(f => { populated[f.name] = row[f.name] ?? ''; });
    setForm(populated);
    setView('form');
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate / Activate this record?')) return;
    try {
      const res  = await fetch(`${url}/${id}`, { method: 'DELETE', headers: hdr });
      const data = await res.json();
      if (data.status === 'success') { toast.success(data.message); fetchList(); }
      else toast.error(data.message);
    } catch (e) { toast.error('Network error'); }
  };

  // Filter list
  const filteredList = list.filter(row => {
    // Status filter
    if (statusFilter !== 'ALL') {
      const st = String(row.status ?? row.status_id ?? '');
      if (statusFilter === '1' && st !== '1' && st !== 'Active' && st !== 'Y' && st !== 'A') return false;
      if (statusFilter === '0' && (st === '1' || st === 'Active' || st === 'Y' || st === 'A')) return false;
    }

    // Search query
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(row).some(v => String(v || '').toLowerCase().includes(q));
  });

  const fs = { flex: 1, padding: '7px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', width: '100%' };
  const ls = { flex: '0 0 35%', fontWeight: '500', fontSize: '13px' };
  const rs = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' };

  return (
    <div className="page-container">
      {/* ─── Top Header ────────────────────────────────────────── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          {icon} {title}
        </h1>

        {view === 'list' ? (
          <button
            onClick={handleAddNew}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '13px', borderRadius: '4px', fontWeight: '600' }}
          >
            <Plus size={15} /> Add {title.replace('Master', '').trim() || title}
          </button>
        ) : (
          <button
            onClick={() => { setView('list'); setEditId(null); setForm(INIT); }}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
          >
            <ArrowLeft size={14} /> Back to List
          </button>
        )}
      </div>

      {/* ─── View 1: List / Table View (Default) ───────────────── */}
      {view === 'list' && (
        <div className="card" style={{ maxWidth: '1080px', margin: '0 auto', padding: '20px' }}>
          {/* Action Bar (Filters + Search + Refresh) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: '500' }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ padding: '5px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', background: '#fff' }}
                >
                  <option value="ALL">All Records</option>
                  <option value="1">Active Only</option>
                  <option value="0">Inactive / Deactivated</option>
                </select>
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '8px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: '5px 10px 5px 30px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', width: '220px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Total: <strong>{filteredList.length}</strong>
              </span>
              <button onClick={fetchList} className="btn btn-secondary" style={{ fontSize: '12px', padding: '5px 12px' }}>
                <RefreshCw size={12} className={fetching ? 'spin' : ''} style={{ marginRight: '4px' }} /> Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          {fetching ? (
            <p style={{ textAlign: 'center', padding: '24px', color: '#888' }}>Loading records...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '9px 12px', textAlign: 'left' }}>#</th>
                    {columns.map(c => (
                      <th key={c.key} style={{ padding: '9px 12px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                        {c.label}
                      </th>
                    ))}
                    <th style={{ padding: '9px 12px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 2} style={{ textAlign: 'center', padding: '28px', color: '#94a3b8' }}>
                        No records found
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((row, i) => {
                      const idKeys = ['sno', 'id', 'catid', 'psubcatid'];
                      const id = idKeys.map(k => row[k]).find(v => v != null);
                      const st = String(row.status ?? row.status_id ?? '');
                      const isActive = st === '1' || st === 'Active' || st === 'Y' || st === 'A';

                      return (
                        <tr key={id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '9px 12px' }}>{i + 1}</td>
                          {columns.map(c => (
                            <td key={c.key} style={{ padding: '9px 12px' }}>
                              {c.key === 'status' || c.key === 'status_id' ? (
                                <span style={{
                                  padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500',
                                  background: isActive ? '#d4edda' : '#f8d7da',
                                  color: isActive ? '#155724' : '#721c24'
                                }}>
                                  {isActive ? 'Active' : 'Inactive'}
                                </span>
                              ) : (row[c.key] ?? '—')}
                            </td>
                          ))}
                          <td style={{ padding: '9px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => handleEdit(row)}
                              title="Edit"
                              style={{
                                background: 'none', border: '1px solid #3b82f6', borderRadius: '4px',
                                color: '#3b82f6', padding: '3px 8px', marginRight: '6px', cursor: 'pointer', fontSize: '12px'
                              }}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleDeactivate(id)}
                              title={isActive ? 'Deactivate' : 'Activate'}
                              style={{
                                background: 'none',
                                border: `1px solid ${isActive ? '#ef4444' : '#22c55e'}`,
                                borderRadius: '4px',
                                color: isActive ? '#ef4444' : '#22c55e',
                                padding: '3px 8px', cursor: 'pointer', fontSize: '12px'
                              }}
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
          )}
        </div>
      )}

      {/* ─── View 2: Add / Edit Form (Only opens on Add/Edit click) ── */}
      {view === 'form' && (
        <div className="card" style={{ maxWidth: '820px', margin: '0 auto 24px', padding: '28px' }}>
          <h3 style={{ marginBottom: '18px', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={15} />
            {editId ? `Edit ${title} #${editId}` : `Add New ${title}`}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: fields.length > 4 ? '1fr 1fr' : '1fr', gap: '0 30px' }}>
              {fields.map(f => (
                <div key={f.name} style={rs}>
                  <label style={ls}>{f.label} {f.required && <span style={{ color: 'red' }}>*</span>}</label>
                  {f.type === 'select' ? (
                    <select name={f.name} value={form[f.name]} onChange={handleChange} required={f.required} style={fs}>
                      <option value="">-- Select --</option>
                      {(f.options || []).map(o => (
                        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
                      ))}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea name={f.name} value={form[f.name]} onChange={handleChange} required={f.required}
                      rows={3} style={{ ...fs, resize: 'vertical' }} />
                  ) : (
                    <input type={f.type || 'text'} name={f.name} value={form[f.name]}
                      onChange={handleChange} required={f.required} style={fs} />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '9px 36px', fontSize: '13px' }}
              >
                {loading ? 'Saving...' : (editId ? 'Update Record' : 'Save Record')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '9px 24px', fontSize: '13px' }}
                onClick={() => { setView('list'); setEditId(null); setForm(INIT); }}
              >
                Back to List
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
