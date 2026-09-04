import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Pencil, Ban, Search, X, Download, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { lookupPincode } from '../utils/pincodeLookup';

/**
 * Generic Master Page Component — Styled identically to CCTV Audit Data page
 * Props:
 *  - title: string
 *  - icon: JSX element
 *  - apiPath: string  (e.g. 'state_master', 'vendor_master')
 *  - fields: array of { name, label, type?, required?, options?, default? }
 *  - columns: array of { key, label }
 */
export default function MasterPage({ title, icon, apiPath, fields, columns }) {
  const INIT = Object.fromEntries(fields.map(f => [f.name, f.default ?? '']));
  const [list, setList]                 = useState([]);
  const [form, setForm]                 = useState(INIT);
  const [editId, setEditId]             = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [loading, setLoading]           = useState(false);
  const [fetching, setFetching]         = useState(false);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const [limit, setLimit]               = useState(50);
  const [selectedIds, setSelectedIds]   = useState([]);

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
    let nextForm = { ...form, [name]: value };
    const fieldDef = fields.find(f => f.name === name);
    if (fieldDef && typeof fieldDef.onChange === 'function') {
      nextForm = fieldDef.onChange(value, nextForm, form) || nextForm;
    }
    setForm(nextForm);

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
    setShowModal(true);
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
        setShowModal(false);
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
    setShowModal(true);
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Toggle status for this record?')) return;
    try {
      const res  = await fetch(`${url}/${id}`, { method: 'DELETE', headers: hdr });
      const data = await res.json();
      if (data.status === 'success') { toast.success(data.message); fetchList(); }
      else toast.error(data.message);
    } catch (e) { toast.error('Network error'); }
  };

  const handleExportCsv = () => {
    if (list.length === 0) { toast.error('No data to export'); return; }
    const headersCsv = columns.map(c => `"${c.label}"`).join(',');
    const rowsCsv = list.map(row => columns.map(c => `"${(row[c.key] ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([headersCsv + '\n' + rowsCsv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${apiPath}_export.csv`;
    a.click();
    toast.success('Exported to CSV');
  };

  // Filter list
  const filteredList = list.filter(row => {
    if (statusFilter) {
      const st = String(row.status ?? row.status_id ?? '');
      if (statusFilter === '1' && st !== '1' && st !== 'Active' && st !== 'Y' && st !== 'A') return false;
      if (statusFilter === '0' && (st === '1' || st === 'Active' || st === 'Y' || st === 'A')) return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(row).some(v => String(v || '').toLowerCase().includes(q));
  });

  const totalRecords = filteredList.length;
  const totalPages   = Math.ceil(totalRecords / limit) || 1;
  const pagedList    = filteredList.slice((page - 1) * limit, page * limit);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = pagedList.map((row, i) => {
        const idKeys = ['sno', 'id', 'catid', 'psubcatid'];
        return idKeys.map(k => row[k]).find(v => v != null) || i;
      });
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <>
      {/* ── 1. Top Bar (Identical to CCTV Audit Data) ────────────────── */}
      <div className="topbar">
        <div>
          <span className="topbar-title">{title}</span>
          <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>
            {totalRecords.toLocaleString()} total records
          </span>
        </div>
        <div className="topbar-actions">
          <button id="btn-refresh" className="btn btn-secondary" onClick={fetchList}>
            <RefreshCw size={14} className={fetching ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleAddNew}>
            <Plus size={14} /> Add {title.replace('Master', '').trim() || title}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* ── 2. Filter Bar (Identical to CCTV Audit Data) ───────────── */}
        <div className="filter-bar">
          <div className="filter-grid">
            <div className="filter-group">
              <label>Search Keyword</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Search ${title}...`}
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="1">Active</option>
                <option value="0">Inactive / Deactive</option>
              </select>
            </div>

            <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <button className="btn btn-primary" onClick={() => setPage(1)} style={{ flex: 1 }}>
                <Search size={13} /> Filter
              </button>
              {(search || statusFilter) && (
                <button className="btn btn-secondary" onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── 3. Action Buttons Row (Identical to CCTV Audit Data) ────── */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-body" style={{ padding: '10px 14px' }}>
            <div className="btn-group">
              <button className="btn btn-primary btn-sm" onClick={handleAddNew}>
                <Plus size={13} /> Add Record
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleExportCsv}>
                <Download size={13} /> Export CSV
              </button>
              <button className="btn btn-secondary btn-sm" onClick={fetchList}>
                <RefreshCw size={13} className={fetching ? 'spin' : ''} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Selection bar */}
        {selectedIds.length > 0 && (
          <div className="selected-bar">
            <span>{selectedIds.length} record{selectedIds.length > 1 ? 's' : ''} selected</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedIds([])}>
              <X size={12} /> Deselect All
            </button>
          </div>
        )}

        {/* ── 4. Data Table (Identical to CCTV Audit Data) ───────────── */}
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
                  {columns.map(c => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  <th style={{ textAlign: 'center', width: 90 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fetching ? (
                  <tr>
                    <td colSpan={columns.length + 3} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      <div className="spinner" style={{ margin: '0 auto 10px', width: 24, height: 24 }}></div>
                      Loading data...
                    </td>
                  </tr>
                ) : pagedList.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 3} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      No records found
                    </td>
                  </tr>
                ) : (
                  pagedList.map((row, idx) => {
                    const idKeys = ['sno', 'id', 'catid', 'psubcatid'];
                    const id = idKeys.map(k => row[k]).find(v => v != null) || idx;
                    const st = String(row.status ?? row.status_id ?? '');
                    const isActive = st === '1' || st === 'Active' || st === 'Y' || st === 'A';
                    const isSelected = selectedIds.includes(id);

                    return (
                      <tr key={id} className={isSelected ? 'selected' : ''}>
                        <td className="check-cell">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(id)}
                          />
                        </td>
                        <td style={{ color: '#94a3b8' }}>{(page - 1) * limit + idx + 1}</td>
                        {columns.map(c => (
                          <td key={c.key}>
                            {c.key === 'status' || c.key === 'status_id' ? (
                              <span className={`badge ${isActive ? 'badge-ack' : 'badge-default'}`}>
                                {isActive ? 'Active' : 'Inactive'}
                              </span>
                            ) : (
                              <strong>{row[c.key] ?? '—'}</strong>
                            )}
                          </td>
                        ))}
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => handleEdit(row)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 7px', marginRight: 4 }}
                            title="Edit Record"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleDeactivate(id)}
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

          {/* ── 5. Pagination Bar (Identical to CCTV Audit Data) ────── */}
          <div className="pagination">
            <span className="pagination-info">
              Page {page} of {totalPages} ({totalRecords.toLocaleString()} items)
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

      {/* ── Modal: Add / Edit Form ──────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3>{editId ? `Edit ${title} #${editId}` : `Add New ${title}`}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: fields.length > 4 ? '1fr 1fr' : '1fr', gap: '14px' }}>
                  {fields.map(f => (
                    <div key={f.name} className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{f.label} {f.required && <span style={{ color: 'red' }}>*</span>}</label>
                      {f.type === 'select' ? (
                        <select className="form-select" name={f.name} value={form[f.name]} onChange={handleChange} required={f.required}>
                          <option value="">-- Select --</option>
                          {(f.options || []).map(o => (
                            <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
                          ))}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea className="form-control" name={f.name} value={form[f.name]} onChange={handleChange} required={f.required} rows={3} />
                      ) : (
                        <input className="form-control" type={f.type || 'text'} name={f.name} value={form[f.name]} onChange={handleChange} required={f.required} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editId ? 'Update' : 'Save Record')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
