import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingCart, Plus, RefreshCw, Search, CheckCircle, XCircle, FileText, Eye } from 'lucide-react';
import '../styles/erp.css';

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const token = localStorage.getItem('erp_token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/procurement/purchase-orders', { headers });
      const data = await res.json();
      if (data.status === 'success') {
        setOrders(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch Purchase Orders');
      }
    } catch {
      toast.error('Network error fetching Purchase Orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleApprove = async (id, poNo) => {
    if (!confirm(`Approve Purchase Order ${poNo}?`)) return;
    try {
      const res = await fetch(`/api/procurement/purchase-orders/${id}/approve`, { method: 'POST', headers });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message);
        fetchOrders();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Error approving PO');
    }
  };

  const handleCancel = async (id, poNo) => {
    if (!confirm(`Cancel Purchase Order ${poNo}?`)) return;
    try {
      const res = await fetch(`/api/procurement/purchase-orders/${id}/cancel`, { method: 'POST', headers });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message);
        fetchOrders();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Error cancelling PO');
    }
  };

  const filtered = orders.filter(po => {
    if (statusFilter && po.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (po.po_no || '').toLowerCase().includes(q) ||
      (po.vendor_name || '').toLowerCase().includes(q) ||
      (po.plant_name || '').toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':  return <span className="erp-badge erp-badge-success">Approved</span>;
      case 'Draft':     return <span className="erp-badge erp-badge-warning">Draft</span>;
      case 'Cancelled': return <span className="erp-badge erp-badge-danger">Cancelled</span>;
      case 'Completed': return <span className="erp-badge erp-badge-info">Completed</span>;
      default:          return <span className="erp-badge erp-badge-default">{status}</span>;
    }
  };

  // Metrics
  const totalValue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const draftCount = orders.filter(o => o.status === 'Draft').length;
  const approvedCount = orders.filter(o => o.status === 'Approved').length;

  return (
    <div className="erp-page">
      {/* Header */}
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">Procurement & Purchase Orders</h1>
          <p className="erp-page-sub">Manage vendor procurement, hardware orders, approvals, and inward stock linkage</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchOrders} className="erp-btn-ghost">
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button onClick={() => navigate('/procurement/purchase-orders/new')} className="erp-btn-primary">
            <Plus size={15} /> Create Purchase Order
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="erp-kpi-grid" style={{ marginBottom: '18px' }}>
        <div className="erp-kpi-card">
          <div className="erp-kpi-label">Total Purchase Orders</div>
          <div className="erp-kpi-val" style={{ color: '#6366f1' }}>{orders.length}</div>
          <div className="erp-kpi-sub">Total POs created</div>
        </div>
        <div className="erp-kpi-card">
          <div className="erp-kpi-label">Total Procurement Value</div>
          <div className="erp-kpi-val" style={{ color: '#10b981' }}>₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="erp-kpi-sub">Gross PO Value + 18% GST</div>
        </div>
        <div className="erp-kpi-card">
          <div className="erp-kpi-label">Pending Approval</div>
          <div className="erp-kpi-val" style={{ color: '#f59e0b' }}>{draftCount}</div>
          <div className="erp-kpi-sub">Awaiting manager sign-off</div>
        </div>
        <div className="erp-kpi-card">
          <div className="erp-kpi-label">Approved & Active</div>
          <div className="erp-kpi-val" style={{ color: '#3b82f6' }}>{approvedCount}</div>
          <div className="erp-kpi-sub">Ready for GRN inward</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="erp-card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search PO #, Vendor, Plant..."
              className="erp-input"
              style={{ paddingLeft: '32px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="erp-select"
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">-- All Statuses --</option>
            <option value="Draft">Draft</option>
            <option value="Approved">Approved</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="erp-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="erp-loader"><div className="erp-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            <ShoppingCart size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div>No Purchase Orders found. Click "+ Create Purchase Order" to begin.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>PO Date</th>
                  <th>Vendor</th>
                  <th>Receiving Plant</th>
                  <th>Items / Qty</th>
                  <th>Subtotal</th>
                  <th>Tax (GST)</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(po => (
                  <tr key={po.id}>
                    <td>
                      <strong style={{ color: '#6366f1', fontFamily: 'monospace' }}>{po.po_no}</strong>
                    </td>
                    <td>{po.po_date ? new Date(po.po_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{po.vendor_name || 'Vendor'}</strong>
                      {po.vendor_phone && <div style={{ fontSize: '11px', color: '#64748b' }}>📞 {po.vendor_phone}</div>}
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#334155' }}>{po.plant_name || '—'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{po.line_count || 0} line(s)</span>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Ordered: {po.total_qty_ordered || 0} pcs</div>
                    </td>
                    <td>₹{parseFloat(po.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>₹{parseFloat(po.tax_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <strong style={{ color: '#059669' }}>
                        ₹{parseFloat(po.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </td>
                    <td>{getStatusBadge(po.status)}</td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => navigate(`/procurement/purchase-orders/${po.id}/print`)}
                        className="erp-btn-ghost erp-btn-sm"
                        style={{ color: '#4f46e5', marginRight: '4px' }}
                        title="Print Purchase Order"
                      >
                        <FileText size={13} /> Print
                      </button>
                      {po.status === 'Draft' && (
                        <button
                          onClick={() => handleApprove(po.id, po.po_no)}
                          className="erp-btn-ghost erp-btn-sm"
                          style={{ color: '#10b981', marginRight: '4px' }}
                          title="Approve PO"
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                      )}
                      {po.status === 'Draft' && (
                        <button
                          onClick={() => handleCancel(po.id, po.po_no)}
                          className="erp-btn-ghost erp-btn-sm"
                          style={{ color: '#ef4444' }}
                          title="Cancel PO"
                        >
                          <XCircle size={13} />
                        </button>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
