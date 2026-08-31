import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/erp.css';

const STATUS_COLORS = {
  Draft:       { bg:'#f1f5f9', color:'#475569' },
  Confirmed:   { bg:'#dbeafe', color:'#1e40af' },
  'In Progress':{ bg:'#fef3c7', color:'#92400e' },
  Active:      { bg:'#dcfce7', color:'#166534' },
  Closed:      { bg:'#e0e7ff', color:'#3730a3' },
  Cancelled:   { bg:'#fee2e2', color:'#991b1b' },
};

export default function RentalOrders() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatus] = useState('all');
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    const res  = await fetch('/api/rental/orders').then(r => r.json());
    setOrders(res.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async id => {
    if (!confirm('Confirm this rental order?')) return;
    const res  = await fetch(`/api/rental/orders/${id}/approve`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({}) });
    const data = await res.json();
    data.status === 'success' ? (toast.success('Order confirmed!'), load()) : toast.error(data.message);
  };

  const cancel = async id => {
    if (!confirm('Cancel this order?')) return;
    const res  = await fetch(`/api/rental/orders/${id}/cancel`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({}) });
    const data = await res.json();
    data.status === 'success' ? (toast.success('Order cancelled.'), load()) : toast.error(data.message);
  };

  const activate = async id => {
    if (!confirm('Activate this rental? This means delivery is done.')) return;
    const res  = await fetch(`/api/rental/orders/${id}/activate`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({}) });
    const data = await res.json();
    data.status === 'success' ? (toast.success('Rental activated!'), load()) : toast.error(data.message);
  };

  const filtered = orders.filter(o => {
    const matchSearch = (o.order_no||'').toLowerCase().includes(search.toLowerCase()) ||
                        (o.client_name||'').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusBadge = status => {
    const c = STATUS_COLORS[status] || { bg:'#f1f5f9', color:'#475569' };
    return <span className="erp-badge" style={{ background: c.bg, color: c.color }}>{status}</span>;
  };

  // Stats
  const counts = ['Draft','Confirmed','In Progress','Active','Closed','Cancelled'].reduce((a,s) => {
    a[s] = orders.filter(o => o.status === s).length; return a;
  }, {});

  return (
    <div className="erp-page">
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">Rental Orders</h1>
          <p className="erp-page-sub">Create and manage IT equipment rental orders for clients</p>
        </div>
        <button className="erp-btn-primary" onClick={() => nav('/rental/rental-orders/new')}>
          <i className="fa fa-plus" /> New Order
        </button>
      </div>

      {/* Status Quick Stats */}
      <div className="erp-stat-row">
        {[
          { label:'Draft',       val: counts.Draft,          color:'#6366f1' },
          { label:'Confirmed',   val: counts.Confirmed,      color:'#3b82f6' },
          { label:'In Progress', val: counts['In Progress'], color:'#f59e0b' },
          { label:'Active',      val: counts.Active,         color:'#22c55e' },
          { label:'Closed',      val: counts.Closed,         color:'#8b5cf6' },
        ].map(s => (
          <div className="erp-stat-card" key={s.label} style={{ borderLeftColor: s.color, cursor:'pointer' }}
               onClick={() => setStatus(s.label === statusFilter ? 'all' : s.label)}>
            <div className="erp-stat-val" style={{ color: s.color }}>{s.val}</div>
            <div className="erp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="erp-toolbar">
        <div className="erp-search-wrap">
          <i className="fa fa-search erp-search-icon" />
          <input className="erp-search" placeholder="Search by order no, client..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="erp-select" style={{width:160}} value={statusFilter} onChange={e=>setStatus(e.target.value)}>
          <option value="all">All Status</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="erp-card">
        {loading ? (
          <div className="erp-loader"><div className="erp-spinner" /></div>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Order No</th><th>Client</th><th>Order Date</th>
                <th>Start Date</th><th>End Date</th><th>Lines</th>
                <th>Allocated</th><th>Total</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="erp-empty">No rental orders found.</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id}>
                  <td><span className="erp-code">{o.order_no}</span></td>
                  <td>
                    <div className="erp-cell-main">{o.client_name}</div>
                    <div className="erp-cell-sub">{o.client_phone}</div>
                  </td>
                  <td>{o.order_date?.slice(0,10)||'—'}</td>
                  <td>{o.start_date?.slice(0,10)||'—'}</td>
                  <td>{o.end_date?.slice(0,10)||'—'}</td>
                  <td><span className="erp-badge erp-badge-blue">{o.line_count||0}</span></td>
                  <td><span className="erp-badge erp-badge-green">{o.allocated_count||0}</span></td>
                  <td className="erp-amount">₹{Number(o.total_amount||0).toLocaleString('en-IN')}</td>
                  <td>{statusBadge(o.status)}</td>
                  <td>
                    <button className="erp-btn-icon" title="View / Allocate" onClick={() => nav(`/rental/rental-orders/${o.id}`)}>
                      <i className="fa fa-eye" />
                    </button>
                    {o.status === 'Draft' && (
                      <>
                        <button className="erp-btn-icon" title="Edit" onClick={() => nav(`/rental/rental-orders/edit/${o.id}`)}>
                          <i className="fa fa-pencil" />
                        </button>
                        <button className="erp-btn-icon" title="Confirm" style={{color:'#16a34a'}} onClick={() => approve(o.id)}>
                          <i className="fa fa-check" />
                        </button>
                        <button className="erp-btn-icon erp-btn-danger" title="Cancel" onClick={() => cancel(o.id)}>
                          <i className="fa fa-times" />
                        </button>
                      </>
                    )}
                    {o.status === 'In Progress' && (
                      <button className="erp-btn-icon" title="Activate Rental" style={{color:'#16a34a'}} onClick={() => activate(o.id)}>
                        <i className="fa fa-play" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
