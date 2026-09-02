import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Plus, RefreshCw, Search, X, Download, Pencil, Ban, CheckCircle2 } from 'lucide-react';

export default function LocationMaster() {
  const navigate = useNavigate();
  const [locations, setLocations]       = useState([]);
  const [fetching, setFetching]         = useState(false);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const [limit, setLimit]               = useState(50);
  const [selectedIds, setSelectedIds]   = useState([]);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };

  const fetchLocations = async () => {
    setFetching(true);
    try {
      const res  = await fetch('/api/locations', { headers });
      const data = await res.json();
      if (data.status === 'success') setLocations(data.data || []);
    } catch (e) { toast.error('Failed to load locations'); }
    finally { setFetching(false); }
  };

  useEffect(() => { fetchLocations(); }, []);

  const handleExportCsv = () => {
    if (locations.length === 0) { toast.error('No locations to export'); return; }
    const headersCsv = '"#","Location Name","City","State","Contact Person","Contact No","Email","Status"';
    const rowsCsv = locations.map((loc, i) =>
      `"${i+1}","${loc.location_name||''}","${loc.city||''}","${loc.state||''}","${loc.contact_person||''}","${loc.contact_no||''}","${loc.contact_email||''}","${String(loc.status)==='1'?'Active':'Inactive'}"`
    ).join('\n');
    const blob = new Blob([headersCsv + '\n' + rowsCsv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'locations_export.csv';
    a.click();
    toast.success('Exported to CSV');
  };

  const filteredLocations = locations.filter(loc => {
    if (statusFilter && String(loc.status ?? '1') !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (loc.location_name || '').toLowerCase().includes(q) ||
      (loc.city || '').toLowerCase().includes(q) ||
      (loc.state || '').toLowerCase().includes(q) ||
      (loc.contact_person || '').toLowerCase().includes(q) ||
      (loc.contact_no || '').toLowerCase().includes(q) ||
      (loc.pincode || '').toLowerCase().includes(q)
    );
  });

  const totalRecords = filteredLocations.length;
  const totalPages   = Math.ceil(totalRecords / limit) || 1;
  const pagedList    = filteredLocations.slice((page - 1) * limit, page * limit);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(pagedList.map(l => l.id));
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
          <span className="topbar-title">Location Master</span>
          <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>
            {totalRecords.toLocaleString()} total records
          </span>
        </div>
        <div className="topbar-actions">
          <button id="btn-refresh" className="btn btn-secondary" onClick={fetchLocations}>
            <RefreshCw size={14} className={fetching ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/location-master/add')}>
            <Plus size={14} /> Add Location
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* ── 2. Filter Bar (CCTV Audit Style) ───────────────────────── */}
        <div className="filter-bar">
          <div className="filter-grid">
            <div className="filter-group">
              <label>Search Location</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search location, city, person..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
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
                <option value="0">Inactive Only</option>
              </select>
            </div>

            <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <button className="btn btn-primary" onClick={() => setPage(1)} style={{ flex: 1 }}>
                <Search size={13} /> Search
              </button>
              {(search || statusFilter) && (
                <button className="btn btn-secondary" onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}>
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
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/location-master/add')}>
                <Plus size={13} /> Add Location
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleExportCsv}>
                <Download size={13} /> Export CSV
              </button>
              <button className="btn btn-secondary btn-sm" onClick={fetchLocations}>
                <RefreshCw size={13} className={fetching ? 'spin' : ''} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Selection bar */}
        {selectedIds.length > 0 && (
          <div className="selected-bar">
            <span>{selectedIds.length} location{selectedIds.length > 1 ? 's' : ''} selected</span>
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
                  <th>Plant Code</th>
                  <th>Plant / Location Name</th>
                  <th>Plant Type</th>
                  <th>Parent Plant</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Contact Person</th>
                  <th>Contact No</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center', width: 90 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fetching ? (
                  <tr>
                    <td colSpan="12" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      <div className="spinner" style={{ margin: '0 auto 10px', width: 24, height: 24 }}></div>
                      Loading plants & locations...
                    </td>
                  </tr>
                ) : pagedList.length === 0 ? (
                  <tr>
                    <td colSpan="12" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      No plants or locations found
                    </td>
                  </tr>
                ) : (
                  pagedList.map((loc, idx) => {
                    const isSelected = selectedIds.includes(loc.id);
                    const isActive = String(loc.status) === '1';

                    return (
                      <tr key={loc.id} className={isSelected ? 'selected' : ''}>
                        <td className="check-cell">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(loc.id)}
                          />
                        </td>
                        <td style={{ color: '#94a3b8' }}>{(page - 1) * limit + idx + 1}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#6366f1', background: '#f5f3ff', padding: '2px 6px', borderRadius: 4 }}>
                            {loc.plant_code || `PLT-${loc.id}`}
                          </span>
                        </td>
                        <td><strong style={{ color: '#1e293b' }}>{loc.location_name}</strong></td>
                        <td>
                          <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                            {loc.plant_type_name || 'Warehouse'}
                          </span>
                        </td>
                        <td style={{ color: loc.parent_plant_name ? '#0f172a' : '#94a3b8', fontSize: 12 }}>
                          {loc.parent_plant_name ? `↳ ${loc.parent_plant_name}` : '— (Root)'}
                        </td>
                        <td>{loc.city}</td>
                        <td>{loc.state}</td>
                        <td>{loc.contact_person}</td>
                        <td>{loc.contact_no}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${isActive ? 'badge-ack' : 'badge-default'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => navigate(`/admin/location-master/edit/${loc.id}`)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 7px' }}
                            title="Edit Location"
                          >
                            <Pencil size={12} />
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
              Page {page} of {totalPages} ({totalRecords.toLocaleString()} locations)
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
