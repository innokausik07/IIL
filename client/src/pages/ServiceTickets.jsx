import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import '../styles/erp.css';

const STATUS_COLORS = {
  Open:       { bg: '#fee2e2', color: '#991b1b' },
  Assigned:   { bg: '#fef3c7', color: '#92400e' },
  InProgress: { bg: '#dbeafe', color: '#1e40af' },
  Resolved:   { bg: '#dcfce7', color: '#166534' },
  Closed:     { bg: '#f1f5f9', color: '#475569' }
};

const PRIORITY_BADGES = {
  Critical: { bg: '#ef4444', color: '#fff' },
  High:     { bg: '#f97316', color: '#fff' },
  Medium:   { bg: '#3b82f6', color: '#fff' },
  Low:      { bg: '#64748b', color: '#fff' }
};

export default function ServiceTickets() {
  const { user } = useAuth();
  const [tickets, setTickets]       = useState([]);
  const [assets, setAssets]         = useState([]);
  const [clients, setClients]       = useState([]);
  const [orders, setOrders]         = useState([]);
  const [usersList, setUsersList]   = useState([]);
  const [aspList, setAspList]       = useState([]);
  const [stats, setStats]           = useState({});
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const blankForm = {
    client_id: '', asset_id: '', order_id: '', issue_type: 'Hardware Issue',
    priority: 'Medium', description: '', technician_id: '', asp_id: ''
  };
  const [form, setForm]             = useState(blankForm);

  // Detail / Status Modal
  const [showDetail, setShowDetail] = useState(false);
  const [selTicket, setSelTicket]   = useState(null);
  const [ticketHist, setTicketHist] = useState([]);
  const [actionNote, setActionNote] = useState('');
  const [newStatus, setNewStatus]   = useState('');
  const [assignTech, setAssignTech] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, aRes, cRes, oRes, uRes, aspRes, sRes] = await Promise.all([
        fetch('/api/maintenance/tickets').then(r => r.json()),
        fetch('/api/masters/asset_master').then(r => r.json()),
        fetch('/api/masters/client_master').then(r => r.json()),
        fetch('/api/rental/orders').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
        fetch('/api/masters/asp_master').then(r => r.json()),
        fetch('/api/maintenance/stats').then(r => r.json()),
      ]);

      setTickets(tRes.data || []);
      setAssets(aRes.data || []);
      setClients(cRes.data || []);
      setOrders(oRes.data || []);
      setUsersList(uRes.data || []);
      setAspList(aspRes.data || []);
      setStats(sRes.data || {});
    } catch (e) {
      toast.error('Failed to load tickets');
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openTicketDetail = async (id) => {
    try {
      const res = await fetch(`/api/maintenance/tickets/${id}`).then(r => r.json());
      if (res.status === 'success') {
        setSelTicket(res.data.ticket);
        setTicketHist(res.data.history || []);
        setNewStatus(res.data.ticket.status);
        setAssignTech(res.data.ticket.technician_id || '');
        setActionNote('');
        setShowDetail(true);
      }
    } catch {
      toast.error('Could not fetch ticket details');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.asset_id) return toast.error('Please select an asset');

    try {
      const res = await fetch('/api/maintenance/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, created_by: user?.id })
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(`Ticket ${data.ticket_no} created!`);
        setShowCreate(false);
        setForm(blankForm);
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Error creating ticket');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selTicket) return;
    try {
      const res = await fetch(`/api/maintenance/tickets/${selTicket.id}/update-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          technician_id: assignTech || null,
          action_note: actionNote,
          done_by: user?.id
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message);
        setShowDetail(false);
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Update failed');
    }
  };

  const filtered = tickets.filter(t => {
    const matchSearch = 
      (t.ticket_no || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.asset_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.issue_type || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="erp-page">
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">Service & Maintenance</h1>
          <p className="erp-page-sub">Track equipment breakdowns, repairs, technician assignments and turnaround</p>
        </div>
        <button className="erp-btn-primary" onClick={() => { setForm(blankForm); setShowCreate(true); }}>
          <i className="fa fa-plus" /> Log Service Ticket
        </button>
      </div>

      {/* Stats Summary */}
      <div className="erp-stat-row">
        {[
          { label: 'Open Tickets',    val: stats.open || 0,        color: '#ef4444' },
          { label: 'Assigned',        val: stats.assigned || 0,    color: '#f59e0b' },
          { label: 'In Progress',     val: stats.inProgress || 0,  color: '#3b82f6' },
          { label: 'Resolved/Closed', val: (stats.resolved || 0) + (stats.closed || 0), color: '#10b981' },
          { label: 'High Priority',   val: stats.highPriorityOpen || 0, color: '#dc2626' }
        ].map(s => (
          <div key={s.label} className="erp-stat-card" style={{ borderLeftColor: s.color }}>
            <div className="erp-stat-val" style={{ color: s.color }}>{s.val}</div>
            <div className="erp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="erp-toolbar">
        <div className="erp-search-wrap">
          <i className="fa fa-search erp-search-icon" />
          <input
            className="erp-search"
            placeholder="Search by ticket #, asset code, client or issue..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="erp-select"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Tickets Table */}
      <div className="erp-card">
        {loading ? (
          <div className="erp-loader"><div className="erp-spinner" /></div>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Ticket No</th>
                <th>Asset / Model</th>
                <th>Client / Order</th>
                <th>Issue / Priority</th>
                <th>Assigned To</th>
                <th>Opened At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="erp-empty">No service tickets found.</td></tr>
              ) : filtered.map(t => {
                const sc = STATUS_COLORS[t.status] || { bg: '#f1f5f9', color: '#475569' };
                const pb = PRIORITY_BADGES[t.priority] || { bg: '#64748b', color: '#fff' };
                return (
                  <tr key={t.id}>
                    <td><span className="erp-code">{t.ticket_no}</span></td>
                    <td>
                      <div className="erp-cell-main">{t.asset_code}</div>
                      <div className="erp-cell-sub">{t.product_name} {t.model ? `(${t.model})` : ''}</div>
                    </td>
                    <td>
                      <div className="erp-cell-main">{t.client_name || 'In-House Warehouse'}</div>
                      <div className="erp-cell-sub">{t.order_no || '—'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="erp-badge" style={{ background: pb.bg, color: pb.color, fontSize: '0.7rem' }}>
                          {t.priority}
                        </span>
                        <span className="erp-cell-main">{t.issue_type}</span>
                      </div>
                      <div className="erp-cell-sub" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description || 'No description'}
                      </div>
                    </td>
                    <td>
                      {t.technician_name ? (
                        <div className="erp-cell-main"><i className="fa fa-user" style={{ marginRight: 4, color: '#6366f1' }} />{t.technician_name}</div>
                      ) : t.asp_name ? (
                        <div className="erp-cell-main"><i className="fa fa-wrench" style={{ marginRight: 4, color: '#f59e0b' }} />{t.asp_name}</div>
                      ) : (
                        <span className="erp-cell-sub" style={{ fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td>{t.opened_at ? t.opened_at.slice(0, 16).replace('T', ' ') : '—'}</td>
                    <td>
                      <span className="erp-badge" style={{ background: sc.bg, color: sc.color }}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="erp-btn-icon"
                        title="View & Update Ticket"
                        onClick={() => openTicketDetail(t.id)}
                      >
                        <i className="fa fa-eye" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="erp-modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="erp-modal erp-modal-lg">
            <div className="erp-modal-header">
              <h2>Log Service & Breakdown Ticket</h2>
              <button className="erp-modal-close" onClick={() => setShowCreate(false)}><i className="fa fa-times" /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="erp-modal-body">
              <div className="erp-form-grid">
                <div className="erp-form-group">
                  <label>Asset *</label>
                  <select
                    className="erp-select"
                    value={form.asset_id}
                    onChange={e => setForm({ ...form, asset_id: e.target.value })}
                    required
                  >
                    <option value="">— Select Asset —</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.asset_code} {a.serial_no ? `(S/N: ${a.serial_no})` : ''} - {a.product_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="erp-form-group">
                  <label>Client (Optional)</label>
                  <select
                    className="erp-select"
                    value={form.client_id}
                    onChange={e => setForm({ ...form, client_id: e.target.value })}
                  >
                    <option value="">— In-House / General —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.client_name}</option>)}
                  </select>
                </div>

                <div className="erp-form-group">
                  <label>Related Rental Order (Optional)</label>
                  <select
                    className="erp-select"
                    value={form.order_id}
                    onChange={e => setForm({ ...form, order_id: e.target.value })}
                  >
                    <option value="">— None —</option>
                    {orders.map(o => <option key={o.id} value={o.id}>{o.order_no} ({o.client_name})</option>)}
                  </select>
                </div>

                <div className="erp-form-group">
                  <label>Issue Type</label>
                  <select
                    className="erp-select"
                    value={form.issue_type}
                    onChange={e => setForm({ ...form, issue_type: e.target.value })}
                  >
                    <option value="Hardware Issue">Hardware Issue (RAM/SSD/Motherboard)</option>
                    <option value="Screen / Display Damage">Screen / Display Damage</option>
                    <option value="Battery / Power Problem">Battery / Power Problem</option>
                    <option value="OS / Software Crash">OS / Software Crash</option>
                    <option value="Physical Body Damage">Physical Body Damage</option>
                    <option value="Accessory Missing / Faulty">Accessory Missing / Faulty</option>
                    <option value="General Preventive Maintenance">General Preventive Maintenance</option>
                  </select>
                </div>

                <div className="erp-form-group">
                  <label>Priority</label>
                  <select
                    className="erp-select"
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical (Immediate Replacement Needed)</option>
                  </select>
                </div>

                <div className="erp-form-group">
                  <label>Assign In-House Technician</label>
                  <select
                    className="erp-select"
                    value={form.technician_id}
                    onChange={e => setForm({ ...form, technician_id: e.target.value })}
                  >
                    <option value="">— Select Technician —</option>
                    {usersList.map(u => <option key={u.id} value={u.id}>{u.full_name || u.userid}</option>)}
                  </select>
                </div>

                <div className="erp-form-group">
                  <label>Assign ASP / Service Partner</label>
                  <select
                    className="erp-select"
                    value={form.asp_id}
                    onChange={e => setForm({ ...form, asp_id: e.target.value })}
                  >
                    <option value="">— Select ASP —</option>
                    {aspList.map(asp => <option key={asp.id} value={asp.id}>{asp.asp_name} ({asp.city || 'Vendor'})</option>)}
                  </select>
                </div>

                <div className="erp-form-group erp-form-full">
                  <label>Issue Description</label>
                  <textarea
                    className="erp-input erp-textarea"
                    rows={3}
                    placeholder="Describe symptoms, error codes, damage details..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="erp-modal-footer">
                <button type="button" className="erp-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="erp-btn-primary">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail & Status Modal */}
      {showDetail && selTicket && (
        <div className="erp-modal-overlay" onClick={e => e.target === e.currentTarget && setShowDetail(false)}>
          <div className="erp-modal erp-modal-lg" style={{ maxWidth: 850 }}>
            <div className="erp-modal-header">
              <div>
                <h2>{selTicket.ticket_no} — {selTicket.issue_type}</h2>
                <div className="erp-card-sub">Asset: <strong>{selTicket.asset_code}</strong> ({selTicket.product_name})</div>
              </div>
              <button className="erp-modal-close" onClick={() => setShowDetail(false)}><i className="fa fa-times" /></button>
            </div>

            <div className="erp-modal-body">
              {/* Top details cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.25rem' }}>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                  <div className="erp-cell-sub">Client / Order</div>
                  <div className="erp-cell-main">{selTicket.client_name || 'Internal'}</div>
                  <div className="erp-cell-sub">{selTicket.order_no || 'No active order'}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                  <div className="erp-cell-sub">Priority & Status</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: 4 }}>
                    <span className="erp-badge" style={{ background: PRIORITY_BADGES[selTicket.priority]?.bg, color: '#fff' }}>
                      {selTicket.priority}
                    </span>
                    <span className="erp-badge" style={{ background: STATUS_COLORS[selTicket.status]?.bg, color: STATUS_COLORS[selTicket.status]?.color }}>
                      {selTicket.status}
                    </span>
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                  <div className="erp-cell-sub">Assigned Technician / ASP</div>
                  <div className="erp-cell-main">{selTicket.technician_name || selTicket.asp_name || 'Unassigned'}</div>
                  <div className="erp-cell-sub">{selTicket.technician_phone || selTicket.asp_phone || ''}</div>
                </div>
              </div>

              {/* Description */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Reported Issue:</div>
                <div style={{ fontSize: '0.9rem', color: '#1e293b' }}>{selTicket.description || 'No detailed description provided.'}</div>
              </div>

              {/* Status Update Form */}
              <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '14px 16px', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', marginBottom: 10 }}>
                  <i className="fa fa-wrench" style={{ marginRight: 6, color: '#6366f1' }} />
                  Update Ticket Status & Log Activity
                </div>
                <div className="erp-form-grid">
                  <div className="erp-form-group">
                    <label>Change Status To</label>
                    <select
                      className="erp-select"
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value)}
                    >
                      <option value="Open">Open</option>
                      <option value="Assigned">Assigned</option>
                      <option value="InProgress">InProgress (Under Repair)</option>
                      <option value="Resolved">Resolved (Ready / Tested)</option>
                      <option value="Closed">Closed (Delivered to Client / Returned to Fleet)</option>
                    </select>
                  </div>
                  <div className="erp-form-group">
                    <label>Reassign Technician</label>
                    <select
                      className="erp-select"
                      value={assignTech}
                      onChange={e => setAssignTech(e.target.value)}
                    >
                      <option value="">— Keep Current —</option>
                      {usersList.map(u => <option key={u.id} value={u.id}>{u.full_name || u.userid}</option>)}
                    </select>
                  </div>
                  <div className="erp-form-group erp-form-full">
                    <label>Action / Resolution Note</label>
                    <input
                      className="erp-input"
                      placeholder="e.g. Replaced display panel; Ran diagnostics; Passed 24hr stress test"
                      value={actionNote}
                      onChange={e => setActionNote(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button type="button" className="erp-btn-primary erp-btn-sm" onClick={handleUpdateStatus}>
                    Update Status & Log
                  </button>
                </div>
              </div>

              {/* Service History Timeline */}
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', marginBottom: 8 }}>
                  Activity History & Audit Trail
                </div>
                <ul className="erp-timeline">
                  {ticketHist.length === 0 ? (
                    <li className="erp-cell-sub" style={{ padding: '8px 0' }}>No history records yet.</li>
                  ) : ticketHist.map(h => (
                    <li key={h.id} className="erp-timeline-item">
                      <div className="erp-timeline-dot" />
                      <div className="erp-timeline-content">
                        <div className="erp-timeline-title">{h.action}</div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: 2 }}>{h.description}</div>
                        <div className="erp-timeline-sub">
                          by <strong>{h.done_by_name || 'System'}</strong> • {h.done_at ? h.done_at.slice(0, 16).replace('T', ' ') : ''}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
