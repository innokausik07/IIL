import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { getMovedSheetList } from '../api/erpApi';

const INIT_FILTERS = {
  wh_request_id: '', serial_number: '', model_no: '',
  project_code: '', erp_status: '', center_code: '',
  assignee: '', vendor_code: '', date_from: '', date_to: ''
};

export default function MovedSheetList() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 1 });
  const [filters, setFilters] = useState(INIT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INIT_FILTERS);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getMovedSheetList({ ...appliedFilters, page, limit: pagination.limit });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load moved data.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => { fetchData(1); }, [appliedFilters]);

  return (
    <>
      <div className="topbar">
          <div>
            <span className="topbar-title">Moved CCTV Audit Data</span>
            <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>
              {pagination.total.toLocaleString()} records moved
            </span>
          </div>
          <button className="btn btn-secondary" onClick={() => fetchData(pagination.page)}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="page-body">
          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="filter-grid">
              {[
                { key: 'wh_request_id', label: 'WH Request ID' },
                { key: 'serial_number', label: 'Serial Number' },
                { key: 'model_no', label: 'Model No' },
                { key: 'project_code', label: 'Project Code' },
                { key: 'assignee', label: 'Assignee' },
                { key: 'vendor_code', label: 'Vendor Code' },
              ].map(f => (
                <div className="filter-group" key={f.key}>
                  <label>{f.label}</label>
                  <input type="text" className="form-control"
                    value={filters[f.key]}
                    onChange={e => setFilters(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.label} />
                </div>
              ))}
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
                <button className="btn btn-primary" onClick={() => setAppliedFilters({ ...filters })} style={{ flex: 1 }}>
                  <Search size={13} /> Search
                </button>
                <button className="btn btn-secondary" onClick={() => { setFilters(INIT_FILTERS); setAppliedFilters(INIT_FILTERS); }}>
                  <X size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="table-container">
            <div className="table-toolbar">
              <span className="table-info">
                Showing {data.length > 0 ? ((pagination.page - 1) * pagination.limit + 1) : 0}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
              </span>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>WH Req ID</th>
                    <th>Serial No</th>
                    <th>Model No</th>
                    <th>Project Code</th>
                    <th>Center Code</th>
                    <th>Assignee</th>
                    <th>Vendor Code</th>
                    <th>ERP Status</th>
                    <th>Movement By</th>
                    <th>Movement At</th>
                    <th>Client Name</th>
                    <th>Store Bin</th>
                    <th>Box No</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="loading-row">
                      <td colSpan={14}><div className="loading-dots"><span /><span /><span /></div></td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr><td colSpan={14}><div className="empty-state"><p>No moved records found.</p></div></td></tr>
                  ) : data.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ color: '#94a3b8' }}>{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                      <td>{row.wh_request_id || '—'}</td>
                      <td><strong>{row.serial_number || '—'}</strong></td>
                      <td>{row.model_no || '—'}</td>
                      <td>{row.project_code || '—'}</td>
                      <td>{row.center_code || '—'}</td>
                      <td>{row.assignee || '—'}</td>
                      <td>{row.vendor_code || '—'}</td>
                      <td><StatusBadge status={row.erp_status} /></td>
                      <td>{row.movement_by || '—'}</td>
                      <td style={{ fontSize: 11 }}>{row.movement_at ? new Date(row.movement_at).toLocaleDateString('en-IN') : '—'}</td>
                      <td>{row.client_name || '—'}</td>
                      <td>{row.store_bin || '—'}</td>
                      <td>{row.box_number || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span className="pagination-info">Page {pagination.page} of {pagination.pages}</span>
              <div className="pagination-btns">
                <button className="page-btn" disabled={pagination.page <= 1} onClick={() => fetchData(pagination.page - 1)}>
                  <ChevronLeft size={12} />
                </button>
                <button className={`page-btn active`}>{pagination.page}</button>
                <button className="page-btn" disabled={pagination.page >= pagination.pages} onClick={() => fetchData(pagination.page + 1)}>
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
    </>
  );
}
