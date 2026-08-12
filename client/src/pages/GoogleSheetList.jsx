import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Search, RefreshCw, UserCheck, CheckCircle, XCircle,
  Truck, RotateCcw, Upload, Download, Filter, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatusBadge, { STATUS_MAP } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  getGoogleSheetList, doAction, doMovement,
  bulkAssignee, bulkAck, downloadTemplate, getBinsByLocation
} from '../api/erpApi';

const STATUSES = ['42', '63', '76', '77', '65', '78', '79', '80'];
const STATUS_LABELS = {
  '42': 'Created', '63': 'Assigned', '76': 'Work in Progress',
  '77': 'Pending Ack', '65': 'Acknowledged',
  '78': 'Moved to Store', '79': 'Moved to Client', '80': 'Moved to WH'
};
const DESTINATIONS = ['WH Mundka', 'Client', 'Store'];

const INIT_FILTERS = {
  wh_request_id: '', serial_number: '', model_no: '',
  project_code: '', erp_status: '', center_code: '',
  assignee: '', vendor_code: '', date_from: '', date_to: ''
};

export default function GoogleSheetList() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 1 });
  const [filters, setFilters] = useState(INIT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INIT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal states
  const [assignModal, setAssignModal] = useState(false);
  const [movementModal, setMovementModal] = useState(false);
  const [bulkAssignModal, setBulkAssignModal] = useState(false);
  const [bulkAckModal, setBulkAckModal] = useState(false);

  const [assigneeName, setAssigneeName] = useState('');
  const [destination, setDestination] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [movedToProject, setMovedToProject] = useState('');
  const [boxNumber, setBoxNumber] = useState('');
  const [movAttachment, setMovAttachment] = useState(null);
  const [bins, setBins] = useState([]);
  const [bulkCsvFile, setBulkCsvFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getGoogleSheetList({ ...appliedFilters, page, limit: pagination.limit });
      setData(res.data.data);
      setPagination(res.data.pagination);
      setSelectedIds([]);
    } catch (err) {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => { fetchData(1); }, [appliedFilters]);

  const applyFilters = () => { setAppliedFilters({ ...filters }); };
  const clearFilters = () => { setFilters(INIT_FILTERS); setAppliedFilters(INIT_FILTERS); };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) setSelectedIds([]);
    else setSelectedIds(data.map(r => r.id));
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleAction = async (action, extra = {}) => {
    if (selectedIds.length === 0) { toast.error('Please select at least one record.'); return; }
    setActionLoading(true);
    try {
      const res = await doAction(action, selectedIds, extra);
      if (res.data.status === 'success') {
        toast.success(`${action} completed successfully.`);
        fetchData(pagination.page);
      } else {
        toast.error(res.data.message || 'Action failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error.');
    } finally {
      setActionLoading(false);
      setAssignModal(false);
      setMovementModal(false);
    }
  };

  const handleAssign = () => {
    if (!assigneeName.trim()) { toast.error('Enter assignee name.'); return; }
    handleAction('assignee', { assignee_name: assigneeName });
  };

  const handleMovement = async () => {
    if (!destination) { toast.error('Select movement destination.'); return; }
    if (selectedIds.length === 0) { toast.error('Select records first.'); return; }
    setActionLoading(true);
    try {
      const fd = new FormData();
      fd.append('action', 'movement');
      selectedIds.forEach(id => fd.append('ids[]', id));
      fd.append('destination', destination);
      fd.append('extra_info', extraInfo);
      fd.append('moved_to_projrctCode', movedToProject);
      fd.append('box_number', boxNumber);
      if (movAttachment) fd.append('movement_attachment', movAttachment);

      const res = await doMovement(fd);
      if (res.data.status === 'success') {
        toast.success('Movement completed!');
        fetchData(pagination.page);
        setMovementModal(false);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Movement failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDestinationChange = async (dest) => {
    setDestination(dest);
    setExtraInfo('');
    setBins([]);
    if (dest === 'Store') {
      const res = await getBinsByLocation('Store');
      setBins(res.data.data || []);
    }
  };

  const handleBulkAssigneeUpload = async () => {
    if (!bulkCsvFile) { toast.error('Please select a CSV file.'); return; }
    setActionLoading(true);
    try {
      const fd = new FormData();
      fd.append('bulk_file', bulkCsvFile);
      const res = await bulkAssignee(fd);
      if (res.data.status === 'success') {
        toast.success(res.data.message);
        fetchData(pagination.page);
        setBulkAssignModal(false);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setActionLoading(false);
      setBulkCsvFile(null);
    }
  };

  const handleBulkAckUpload = async () => {
    if (!bulkCsvFile) { toast.error('Please select a CSV file.'); return; }
    setActionLoading(true);
    try {
      const fd = new FormData();
      fd.append('bulk_ack_file', bulkCsvFile);
      const res = await bulkAck(fd);
      if (res.data.status === 'success') {
        toast.success(res.data.message);
        fetchData(pagination.page);
        setBulkAckModal(false);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setActionLoading(false);
      setBulkCsvFile(null);
    }
  };

  const handleDownloadTemplate = async (type) => {
    const res = await downloadTemplate(type);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${type}.csv`;
    a.click();
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        {/* Top Bar */}
        <div className="topbar">
          <div>
            <span className="topbar-title">CCTV Audit Data</span>
            <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>
              {pagination.total.toLocaleString()} total records
            </span>
          </div>
          <div className="topbar-actions">
            <button id="btn-refresh" className="btn btn-secondary" onClick={() => fetchData(pagination.page)}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        <div className="page-body">
          {/* ── Filter Bar ─────────────────────────────────────────────── */}
          <div className="filter-bar">
            <div className="filter-grid">
              {[
                { key: 'wh_request_id', label: 'WH Request ID' },
                { key: 'serial_number', label: 'Serial Number' },
                { key: 'model_no', label: 'Model No' },
                { key: 'project_code', label: 'Project Code' },
                { key: 'center_code', label: 'Center Code' },
                { key: 'assignee', label: 'Assignee' },
                { key: 'vendor_code', label: 'Vendor Code' },
              ].map(f => (
                <div className="filter-group" key={f.key}>
                  <label>{f.label}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={filters[f.key]}
                    onChange={e => setFilters(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.label}
                  />
                </div>
              ))}

              <div className="filter-group">
                <label>ERP Status</label>
                <select className="form-select" value={filters.erp_status}
                  onChange={e => setFilters(p => ({ ...p, erp_status: e.target.value }))}>
                  <option value="">All Statuses</option>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>

              <div className="filter-group">
                <label>Date From</label>
                <input type="date" className="form-control" value={filters.date_from}
                  onChange={e => setFilters(p => ({ ...p, date_from: e.target.value }))} />
              </div>
              <div className="filter-group">
                <label>Date To</label>
                <input type="date" className="form-control" value={filters.date_to}
                  onChange={e => setFilters(p => ({ ...p, date_to: e.target.value }))} />
              </div>

              <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                <button id="btn-search" className="btn btn-primary" onClick={applyFilters} style={{ flex: 1 }}>
                  <Search size={13} /> Search
                </button>
                <button className="btn btn-secondary" onClick={clearFilters}>
                  <X size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Action Buttons ──────────────────────────────────────────── */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-body" style={{ padding: '10px 14px' }}>
              <div className="btn-group">
                <button id="btn-assign" className="btn btn-primary btn-sm" onClick={() => setAssignModal(true)}>
                  <UserCheck size={13} /> Assign
                </button>
                <button id="btn-receive" className="btn btn-success btn-sm"
                  onClick={() => handleAction('receive')} disabled={actionLoading}>
                  <CheckCircle size={13} /> Receive
                </button>
                <button id="btn-workdone" className="btn btn-info btn-sm"
                  onClick={() => handleAction('work_done')} disabled={actionLoading}>
                  <CheckCircle size={13} /> Work Done
                </button>
                <button id="btn-acknowledge" className="btn btn-warning btn-sm"
                  onClick={() => handleAction('acknowledgement')} disabled={actionLoading}>
                  <CheckCircle size={13} /> Acknowledge
                </button>
                <button id="btn-movement" className="btn btn-sm" style={{ background: '#8b5cf6', color: '#fff' }}
                  onClick={() => setMovementModal(true)}>
                  <Truck size={13} /> Movement
                </button>
                <button id="btn-rollback" className="btn btn-danger btn-sm"
                  onClick={() => handleAction('rollback')} disabled={actionLoading}>
                  <RotateCcw size={13} /> Rollback
                </button>
                <div style={{ borderLeft: '1px solid #e2e8f0', margin: '0 4px' }} />
                <button id="btn-bulk-assign" className="btn btn-secondary btn-sm" onClick={() => setBulkAssignModal(true)}>
                  <Upload size={13} /> Bulk Assign
                </button>
                <button id="btn-bulk-ack" className="btn btn-secondary btn-sm" onClick={() => setBulkAckModal(true)}>
                  <Upload size={13} /> Bulk Ack
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

          {/* ── Data Table ─────────────────────────────────────────────── */}
          <div className="table-container">
            <div className="table-toolbar">
              <span className="table-info">
                Showing {data.length > 0 ? ((pagination.page - 1) * pagination.limit + 1) : 0}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select className="form-select" style={{ width: 80 }} value={pagination.limit}
                  onChange={e => setPagination(p => ({ ...p, limit: Number(e.target.value) }))}>
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
                      <input type="checkbox"
                        checked={selectedIds.length === data.length && data.length > 0}
                        onChange={toggleSelectAll} />
                    </th>
                    <th>#</th>
                    <th>WH Req ID</th>
                    <th>Serial No</th>
                    <th>Model No</th>
                    <th>Project Code</th>
                    <th>Center Code</th>
                    <th>Center Name</th>
                    <th>Assignee</th>
                    <th>Vendor Code</th>
                    <th>ERP Status</th>
                    <th>Assigned By</th>
                    <th>Assigned At</th>
                    <th>Work Done By</th>
                    <th>Ack By</th>
                    <th>Movement By</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="loading-row">
                      <td colSpan={17}>
                        <div className="loading-dots"><span /><span /><span /></div>
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={17}>
                        <div className="empty-state">
                          <p>No records found. Adjust your filters and try again.</p>
                        </div>
                      </td>
                    </tr>
                  ) : data.map((row, idx) => (
                    <tr key={row.id} className={selectedIds.includes(row.id) ? 'selected' : ''}>
                      <td className="check-cell">
                        <input type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleSelect(row.id)} />
                      </td>
                      <td style={{ color: '#94a3b8' }}>{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                      <td><span title={row.wh_request_id}>{row.wh_request_id || '—'}</span></td>
                      <td><strong>{row.serial_number || '—'}</strong></td>
                      <td>{row.model_no || '—'}</td>
                      <td>{row.project_code || '—'}</td>
                      <td>{row.center_code || '—'}</td>
                      <td>{row.centre_center_name || '—'}</td>
                      <td>{row.assignee || '—'}</td>
                      <td>{row.vendor_code || '—'}</td>
                      <td><StatusBadge status={row.erp_status} /></td>
                      <td>{row.assigned_by || '—'}</td>
                      <td style={{ fontSize: 11 }}>{row.assigned_at ? new Date(row.assigned_at).toLocaleDateString('en-IN') : '—'}</td>
                      <td>{row.work_done_by || '—'}</td>
                      <td>{row.acknowledged_by || '—'}</td>
                      <td>{row.movement_by || '—'}</td>
                      <td style={{ fontSize: 11 }}>{row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <span className="pagination-info">Page {pagination.page} of {pagination.pages}</span>
              <div className="pagination-btns">
                <button className="page-btn" disabled={pagination.page <= 1}
                  onClick={() => fetchData(1)}><ChevronLeft size={12} /><ChevronLeft size={12} /></button>
                <button className="page-btn" disabled={pagination.page <= 1}
                  onClick={() => fetchData(pagination.page - 1)}><ChevronLeft size={12} /></button>
                {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                  const p = Math.max(1, pagination.page - 2) + i;
                  if (p > pagination.pages) return null;
                  return (
                    <button key={p} className={`page-btn${p === pagination.page ? ' active' : ''}`}
                      onClick={() => fetchData(p)}>{p}</button>
                  );
                })}
                <button className="page-btn" disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchData(pagination.page + 1)}><ChevronRight size={12} /></button>
                <button className="page-btn" disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchData(pagination.pages)}><ChevronRight size={12} /><ChevronRight size={12} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Assign Modal ────────────────────────────────────────────────── */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Records ({selectedIds.length} selected)</h3>
              <button className="modal-close" onClick={() => setAssignModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Assignee Name *</label>
                <input type="text" className="form-control" value={assigneeName}
                  onChange={e => setAssigneeName(e.target.value)} placeholder="Enter username" autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAssignModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={actionLoading}>
                {actionLoading ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Movement Modal ──────────────────────────────────────────────── */}
      {movementModal && (
        <div className="modal-overlay" onClick={() => setMovementModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Move Records ({selectedIds.length} selected)</h3>
              <button className="modal-close" onClick={() => setMovementModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Destination *</label>
                <select className="form-select" value={destination}
                  onChange={e => handleDestinationChange(e.target.value)}>
                  <option value="">Select destination</option>
                  {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {destination === 'Client' && (
                <div className="form-group">
                  <label className="form-label">Client Name</label>
                  <input type="text" className="form-control" value={extraInfo}
                    onChange={e => setExtraInfo(e.target.value)} placeholder="Enter client name" />
                </div>
              )}
              {destination === 'Store' && (
                <div className="form-group">
                  <label className="form-label">Store Bin</label>
                  {bins.length > 0 ? (
                    <select className="form-select" value={extraInfo}
                      onChange={e => setExtraInfo(e.target.value)}>
                      <option value="">Select bin</option>
                      {bins.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  ) : (
                    <input type="text" className="form-control" value={extraInfo}
                      onChange={e => setExtraInfo(e.target.value)} placeholder="Enter bin" />
                  )}
                </div>
              )}
              {(destination === 'Client' || destination === 'Store') && (
                <div className="form-group">
                  <label className="form-label">Project Code</label>
                  <input type="text" className="form-control" value={movedToProject}
                    onChange={e => setMovedToProject(e.target.value)} placeholder="Project code" />
                </div>
              )}
              {destination === 'WH Mundka' && (
                <div className="form-group">
                  <label className="form-label">Box Number</label>
                  <input type="text" className="form-control" value={boxNumber}
                    onChange={e => setBoxNumber(e.target.value)} placeholder="Enter box number" />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Attachment (Image, max 5MB)</label>
                <input type="file" className="form-control" accept="image/*"
                  onChange={e => setMovAttachment(e.target.files[0])} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMovementModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleMovement} disabled={actionLoading}>
                {actionLoading ? 'Moving…' : 'Confirm Move'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Assign Modal ───────────────────────────────────────────── */}
      {bulkAssignModal && (
        <div className="modal-overlay" onClick={() => setBulkAssignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Assign via CSV</h3>
              <button className="modal-close" onClick={() => setBulkAssignModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">
                CSV must have columns: <strong>Serial Number, Current User</strong>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginBottom: 12 }}
                onClick={() => handleDownloadTemplate('assignee')}>
                <Download size={13} /> Download Template
              </button>
              <div className="form-group">
                <label className="form-label">Upload CSV File</label>
                <input type="file" className="form-control" accept=".csv"
                  onChange={e => setBulkCsvFile(e.target.files[0])} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setBulkAssignModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleBulkAssigneeUpload} disabled={actionLoading}>
                {actionLoading ? 'Uploading…' : 'Upload & Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Ack Modal ──────────────────────────────────────────────── */}
      {bulkAckModal && (
        <div className="modal-overlay" onClick={() => setBulkAckModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Acknowledge via CSV</h3>
              <button className="modal-close" onClick={() => setBulkAckModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">
                CSV must have column: <strong>Serial Number</strong>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginBottom: 12 }}
                onClick={() => handleDownloadTemplate('ack')}>
                <Download size={13} /> Download Template
              </button>
              <div className="form-group">
                <label className="form-label">Upload CSV File</label>
                <input type="file" className="form-control" accept=".csv"
                  onChange={e => setBulkCsvFile(e.target.files[0])} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setBulkAckModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleBulkAckUpload} disabled={actionLoading}>
                {actionLoading ? 'Uploading…' : 'Upload & Acknowledge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
