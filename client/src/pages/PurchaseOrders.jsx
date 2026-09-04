import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingCart, Plus, RefreshCw, Search, CheckCircle, XCircle, FileText, PackageCheck, X, Building2 } from 'lucide-react';
import '../styles/erp.css';

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [plants, setPlants]             = useState([]);

  // GRN Inward Modal State
  const [showGrnModal, setShowGrnModal]   = useState(false);
  const [selectedPo, setSelectedPo]       = useState(null);
  const [grnLoading, setGrnLoading]       = useState(false);
  const [grnSubmitting, setGrnSubmitting] = useState(false);
  const [grnForm, setGrnForm]             = useState({
    invoice_no: '',
    invoice_date: new Date().toISOString().split('T')[0],
    warehouse_id: '',
    warehouse_name: '',
    remarks: '',
    lines: []
  });

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

  const fetchPlants = async () => {
    try {
      const res = await fetch('/api/locations', { headers });
      const data = await res.json();
      if (data.status === 'success') {
        setPlants(data.data.filter(l => l.status !== 'D') || []);
      }
    } catch (e) {
      console.error('Failed to load plants', e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchPlants();
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

  // Open GRN Modal & load PO lines
  const handleOpenGrnModal = async (po) => {
    setSelectedPo(po);
    setGrnLoading(true);
    setShowGrnModal(true);
    try {
      const res = await fetch(`/api/procurement/purchase-orders/${po.id}`, { headers });
      const data = await res.json();
      if (data.status === 'success') {
        const fullPo = data.data;
        const initialLines = (fullPo.lines || []).map(l => {
          const rem = Math.max(0, parseInt(l.qty_ordered || 0) - parseInt(l.qty_received || 0));
          return {
            po_line_id: l.id,
            product_id: l.product_id,
            product_name: l.item_name || l.product_name,
            part_code: l.part_code || '',
            qty_ordered: l.qty_ordered,
            qty_previously_received: l.qty_received || 0,
            received_qty: rem,
            accepted_qty: rem,
            rejected_qty: 0,
            unit_price: l.unit_price,
            serial_numbers: ''
          };
        });

        setGrnForm({
          invoice_no: '',
          invoice_date: new Date().toISOString().split('T')[0],
          warehouse_id: fullPo.plant_id || '',
          warehouse_name: fullPo.plant_name || '',
          remarks: '',
          lines: initialLines
        });
      }
    } catch {
      toast.error('Failed to load PO lines for GRN');
    } finally {
      setGrnLoading(false);
    }
  };

  const handleGrnLineChange = (index, field, val) => {
    setGrnForm(prev => {
      const nextLines = [...prev.lines];
      nextLines[index][field] = val;
      if (field === 'received_qty') {
        nextLines[index].accepted_qty = val;
        nextLines[index].rejected_qty = 0;
      }
      return { ...prev, lines: nextLines };
    });
  };

  const handleGrnSubmit = async (e) => {
    e.preventDefault();
    if (!grnForm.warehouse_name && !grnForm.warehouse_id) {
      toast.error('Please select receiving warehouse / plant.');
      return;
    }
    if (grnForm.lines.every(l => parseInt(l.received_qty || 0) <= 0)) {
      toast.error('Please enter a received quantity for at least one item.');
      return;
    }

    setGrnSubmitting(true);
    try {
      const res = await fetch(`/api/procurement/purchase-orders/${selectedPo.id}/receive-grn`, {
        method: 'POST',
        headers,
        body: JSON.stringify(grnForm)
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message, { duration: 6000 });
        setShowGrnModal(false);
        fetchOrders();
      } else {
        toast.error(data.message || 'Failed to generate GRN');
      }
    } catch {
      toast.error('Network error generating GRN');
    } finally {
      setGrnSubmitting(false);
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
      case 'Approved':           return <span className="erp-badge erp-badge-success">Approved</span>;
      case 'Draft':              return <span className="erp-badge erp-badge-warning">Draft</span>;
      case 'Partially Received': return <span className="erp-badge" style={{ background: '#ede9fe', color: '#6366f1' }}>Partially Received</span>;
      case 'Received':           return <span className="erp-badge erp-badge-info">Received (Inward Done)</span>;
      case 'Cancelled':          return <span className="erp-badge erp-badge-danger">Cancelled</span>;
      default:                   return <span className="erp-badge erp-badge-default">{status}</span>;
    }
  };

  // Metrics
  const totalValue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const draftCount = orders.filter(o => o.status === 'Draft').length;
  const approvedCount = orders.filter(o => o.status === 'Approved').length;
  const receivedCount = orders.filter(o => o.status === 'Received' || o.status === 'Partially Received').length;

  return (
    <div className="erp-page">
      {/* Header */}
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">Procurement & Purchase Orders</h1>
          <p className="erp-page-sub">Manage vendor procurement, hardware orders, approvals, and 1-Click GRN inward linkage</p>
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
          <div className="erp-kpi-label">Approved / Inward Ready</div>
          <div className="erp-kpi-val" style={{ color: '#3b82f6' }}>{approvedCount}</div>
          <div className="erp-kpi-sub">{receivedCount} received / in stock</div>
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
            <option value="Partially Received">Partially Received</option>
            <option value="Received">Received (Inward Done)</option>
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
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Ord: {po.total_qty_ordered || 0} | Rec: {po.total_qty_received || 0}
                      </div>
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

                      {/* 1-Click Receive GRN button when Approved or Partially Received */}
                      {(po.status === 'Approved' || po.status === 'Partially Received') && (
                        <button
                          onClick={() => handleOpenGrnModal(po)}
                          className="erp-btn-sm"
                          style={{
                            background: '#4f46e5',
                            color: '#ffffff',
                            marginRight: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                          title="Generate GRN Inward & Auto-Create Assets"
                        >
                          <PackageCheck size={13} /> Receive GRN
                        </button>
                      )}

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

      {/* ── 1-Click GRN Inward Modal ────────────────────────────── */}
      {showGrnModal && selectedPo && (
        <div className="modal-overlay" onClick={() => setShowGrnModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 840, width: '95%' }}>
            <div className="modal-header" style={{ background: '#1e293b', color: '#fff', padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PackageCheck size={20} color="#a5b4fc" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>
                  Receive Goods Receipt Note (GRN) — {selectedPo.po_no}
                </h3>
              </div>
              <button className="modal-close" onClick={() => setShowGrnModal(false)} style={{ color: '#fff' }}>
                <X size={16} />
              </button>
            </div>

            {grnLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <div className="erp-spinner" style={{ margin: '0 auto 10px' }} />
                Loading PO lines...
              </div>
            ) : (
              <form onSubmit={handleGrnSubmit}>
                <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '20px' }}>
                  {/* PO Summary Header */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                    <div><strong>Vendor:</strong> {selectedPo.vendor_name || 'Vendor'}</div>
                    <div><strong>PO Date:</strong> {selectedPo.po_date ? new Date(selectedPo.po_date).toLocaleDateString('en-IN') : '—'}</div>
                    <div><strong>PO Gross Amount:</strong> ₹{parseFloat(selectedPo.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div><strong>Target Plant:</strong> {selectedPo.plant_name || 'Main Warehouse'}</div>
                  </div>

                  {/* Inward Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Vendor Invoice No. *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. INV-2026-908"
                        required
                        value={grnForm.invoice_no}
                        onChange={e => setGrnForm({ ...grnForm, invoice_no: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Invoice / Receipt Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={grnForm.invoice_date}
                        onChange={e => setGrnForm({ ...grnForm, invoice_date: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                      <label className="form-label">Receiving Warehouse / Plant *</label>
                      <select
                        className="form-select"
                        required
                        value={grnForm.warehouse_id}
                        onChange={e => {
                          const p = plants.find(pl => String(pl.id) === String(e.target.value));
                          setGrnForm({
                            ...grnForm,
                            warehouse_id: e.target.value,
                            warehouse_name: p ? p.location_name : ''
                          });
                        }}
                      >
                        <option value="">-- Select Receiving Warehouse / Plant --</option>
                        {plants.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.location_name} {p.plant_code ? `(${p.plant_code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Line Items Receiving Table */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '13.5px', fontWeight: '700', marginBottom: '8px', color: '#1e293b' }}>
                      Items to Inward & Serial Allocation
                    </h4>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <table className="erp-table" style={{ margin: 0, fontSize: '12px' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9' }}>
                            <th>Item Name</th>
                            <th style={{ width: '80px', textAlign: 'center' }}>Ordered</th>
                            <th style={{ width: '80px', textAlign: 'center' }}>Prev. Rec</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>Rec Qty *</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>Acc Qty</th>
                            <th>Serial Numbers (Auto-creates Assets)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grnForm.lines.map((l, idx) => (
                            <tr key={idx}>
                              <td>
                                <strong>{l.product_name}</strong>
                                {l.part_code && <div style={{ fontSize: '11px', color: '#64748b' }}>PID: {l.part_code}</div>}
                              </td>
                              <td style={{ textAlign: 'center' }}>{l.qty_ordered}</td>
                              <td style={{ textAlign: 'center', color: '#64748b' }}>{l.qty_previously_received}</td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max={l.qty_ordered}
                                  className="form-control"
                                  style={{ padding: '4px 6px', textAlign: 'center' }}
                                  value={l.received_qty}
                                  onChange={e => handleGrnLineChange(idx, 'received_qty', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max={l.received_qty}
                                  className="form-control"
                                  style={{ padding: '4px 6px', textAlign: 'center' }}
                                  value={l.accepted_qty}
                                  onChange={e => handleGrnLineChange(idx, 'accepted_qty', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="e.g. SN1001, SN1002 (comma separated)"
                                  style={{ padding: '4px 8px', fontSize: '11.5px' }}
                                  value={l.serial_numbers}
                                  onChange={e => handleGrnLineChange(idx, 'serial_numbers', e.target.value)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Inspection & Inward Remarks</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="QC inspection notes, delivery condition, transporter details..."
                      value={grnForm.remarks}
                      onChange={e => setGrnForm({ ...grnForm, remarks: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowGrnModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={grnSubmitting} style={{ background: '#4f46e5' }}>
                    {grnSubmitting ? 'Generating GRN & Creating Assets...' : '✓ Confirm Inward & Auto-Create Assets'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

