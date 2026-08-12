import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import { getCrossAuditList } from '../api/erpApi';

const INIT_FILTERS = {
  wh_request_id: '', serial_number: '', model_no: '',
  project_code: '', erp_status: '', assignee: '', date_from: '', date_to: ''
};

export default function CrossAuditList() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 1 });
  const [filters, setFilters] = useState(INIT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INIT_FILTERS);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getCrossAuditList({ ...appliedFilters, page, limit: pagination.limit });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load cross audit data.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => { fetchData(1); }, [appliedFilters]);

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">Cross Audit List
            <span> · {pagination.total.toLocaleString()} records</span>
          </span>
          <button className="btn btn-secondary" onClick={() => fetchData(pagination.page)}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        <div className="page-body">
          <div className="filter-bar">
            <div className="filter-grid">
              {['wh_request_id','serial_number','model_no','project_code','assignee'].map(k => (
                <div className="filter-group" key={k}>
                  <label>{k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</label>
                  <input type="text" className="form-control" value={filters[k]}
                    onChange={e => setFilters(p=>({...p,[k]:e.target.value}))} />
                </div>
              ))}
              <div className="filter-group">
                <label>Date From</label>
                <input type="date" className="form-control" value={filters.date_from}
                  onChange={e=>setFilters(p=>({...p,date_from:e.target.value}))} />
              </div>
              <div className="filter-group">
                <label>Date To</label>
                <input type="date" className="form-control" value={filters.date_to}
                  onChange={e=>setFilters(p=>({...p,date_to:e.target.value}))} />
              </div>
              <div className="filter-group" style={{display:'flex',alignItems:'flex-end',gap:6}}>
                <button className="btn btn-primary" onClick={()=>setAppliedFilters({...filters})} style={{flex:1}}>
                  <Search size={13}/> Search
                </button>
                <button className="btn btn-secondary" onClick={()=>{setFilters(INIT_FILTERS);setAppliedFilters(INIT_FILTERS);}}>
                  <X size={13}/>
                </button>
              </div>
            </div>
          </div>
          <div className="table-container">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>WH Req ID</th><th>Serial No</th><th>Model No</th>
                    <th>Project Code</th><th>Center Code</th><th>Assignee</th>
                    <th>ERP Status</th><th>Audit Received By</th><th>Audit Date</th><th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="loading-row"><td colSpan={11}><div className="loading-dots"><span/><span/><span/></div></td></tr>
                  ) : data.length === 0 ? (
                    <tr><td colSpan={11}><div className="empty-state"><p>No records found.</p></div></td></tr>
                  ) : data.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{color:'#94a3b8'}}>{(pagination.page-1)*pagination.limit+idx+1}</td>
                      <td>{row.wh_request_id||'—'}</td>
                      <td><strong>{row.serial_number||'—'}</strong></td>
                      <td>{row.model_no||'—'}</td>
                      <td>{row.project_code||'—'}</td>
                      <td>{row.center_code||'—'}</td>
                      <td>{row.assignee||'—'}</td>
                      <td><StatusBadge status={row.erp_status}/></td>
                      <td>{row.audit_received_by||'—'}</td>
                      <td style={{fontSize:11}}>{row.audit_received_date||'—'}</td>
                      <td style={{fontSize:11}}>{row.created_at?new Date(row.created_at).toLocaleDateString('en-IN'):'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span className="pagination-info">Page {pagination.page} of {pagination.pages}</span>
              <div className="pagination-btns">
                <button className="page-btn" disabled={pagination.page<=1} onClick={()=>fetchData(pagination.page-1)}><ChevronLeft size={12}/></button>
                <button className="page-btn active">{pagination.page}</button>
                <button className="page-btn" disabled={pagination.page>=pagination.pages} onClick={()=>fetchData(pagination.page+1)}><ChevronRight size={12}/></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
