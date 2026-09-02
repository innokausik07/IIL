import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/erp.css';

const STATUS_COLORS = {
  Draft:        { bg:'#f1f5f9', color:'#475569' },
  Confirmed:    { bg:'#dbeafe', color:'#1e40af' },
  'In Progress':{ bg:'#fef3c7', color:'#92400e' },
  Active:       { bg:'#dcfce7', color:'#166534' },
  Closed:       { bg:'#e0e7ff', color:'#3730a3' },
  Cancelled:    { bg:'#fee2e2', color:'#991b1b' },
};

export default function RentalOrderDetail() {
  const { id } = useParams();
  const nav    = useNavigate();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [allocating, setAllocating] = useState(false);

  // Allocation modal state
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [selLine, setSelLine]               = useState(null);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAssets, setSelectedAssets]   = useState([]);
  const [assetsLoading, setAssetsLoading]     = useState(false);

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selAlloc, setSelAlloc]               = useState(null);
  const [returnCond, setReturnCond]           = useState('Good');
  const [returnRemarks, setReturnRemarks]     = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/rental/orders/${id}`).then(r => r.json());
    if (res.status === 'success') setData(res.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const openAllocModal = async line => {
    setSelLine(line);
    setSelectedAssets([]);
    setAssetsLoading(true);
    setShowAllocModal(true);
    const res = await fetch(`/api/rental/available-assets/${line.product_id}`).then(r => r.json());
    setAvailableAssets(res.data || []);
    setAssetsLoading(false);
  };

  const toggleAsset = asset => {
    setSelectedAssets(prev =>
      prev.find(a => a.id === asset.id) ? prev.filter(a => a.id !== asset.id) : [...prev, asset]
    );
  };

  const confirmAlloc = async () => {
    if (!selectedAssets.length) return toast.error('Select at least one asset');
    if (selectedAssets.length > (selLine.qty - selLine.assets_allocated)) {
      return toast.error(`Only ${selLine.qty - selLine.assets_allocated} more asset(s) needed`);
    }
    setAllocating(true);
    const allocations = selectedAssets.map(a => ({ order_line_id: selLine.id, asset_id: a.id }));
    const res  = await fetch(`/api/rental/orders/${id}/allocate`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ allocations })
    });
    const data = await res.json();
    if (data.status === 'success') {
      toast.success(data.message);
      setShowAllocModal(false);
      load();
    } else toast.error(data.message);
    setAllocating(false);
  };

  const openReturn = alloc => {
    setSelAlloc(alloc);
    setReturnCond('Good');
    setReturnRemarks('');
    setShowReturnModal(true);
  };

  const confirmReturn = async () => {
    const res  = await fetch(`/api/rental/allocations/${selAlloc.id}/return`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ return_condition: returnCond, remarks: returnRemarks })
    });
    const d = await res.json();
    if (d.status === 'success') {
      toast.success('Asset returned for inspection!');
      setShowReturnModal(false);
      load();
    } else toast.error(d.message);
  };

  const approve = async () => {
    if (!confirm('Confirm this order?')) return;
    const res = await fetch(`/api/rental/orders/${id}/approve`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:'{}' });
    const d   = await res.json();
    d.status === 'success' ? (toast.success('Confirmed!'), load()) : toast.error(d.message);
  };

  if (loading) return <div className="erp-page"><div className="erp-loader"><div className="erp-spinner" /></div></div>;
  if (!data) return <div className="erp-page"><div className="erp-empty">Order not found.</div></div>;

  const { order, lines, allocations } = data;
  const sc = STATUS_COLORS[order.status] || { bg:'#f1f5f9', color:'#475569' };

  return (
    <div className="erp-page">
      {/* Header */}
      <div className="erp-page-header">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <h1 className="erp-page-title">{order.order_no}</h1>
            <span className="erp-badge" style={{ background:sc.bg, color:sc.color, fontSize:'0.85rem', padding:'4px 12px' }}>{order.status}</span>
          </div>
          <p className="erp-page-sub">{order.client_name} • {order.order_date?.slice(0,10)}</p>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {order.status === 'Draft' && (
            <>
              <button className="erp-btn-ghost" onClick={() => nav(`/rental/rental-orders/edit/${id}`)}>
                <i className="fa fa-pencil" /> Edit
              </button>
              <button className="erp-btn-primary" onClick={approve}>
                <i className="fa fa-check" /> Confirm Order
              </button>
            </>
          )}
          <button className="erp-btn-primary" onClick={() => nav(`/rental/rental-orders/${id}/print-agreement`)}>
            <i className="fa fa-print" /> Print Agreement
          </button>
          <button className="erp-btn-ghost" onClick={() => nav('/rental/rental-orders')}>
            <i className="fa fa-arrow-left" /> Back
          </button>
        </div>
      </div>



      {/* Info Cards Row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
        <div className="erp-card" style={{ padding:'1rem' }}>
          <div className="erp-card-sub">Client</div>
          <div className="erp-cell-main">{order.client_name}</div>
          <div className="erp-cell-sub">{order.client_phone} • {order.client_email}</div>
          <div className="erp-cell-sub" style={{ marginTop:4 }}>{order.client_address}</div>
        </div>
        <div className="erp-card" style={{ padding:'1rem' }}>
          <div className="erp-card-sub">Rental Period</div>
          <div className="erp-cell-main">{order.start_date?.slice(0,10)||'TBD'} → {order.end_date?.slice(0,10)||'TBD'}</div>
          <div className="erp-cell-sub">Delivery: {order.delivery_location||'Not specified'}</div>
          {order.approved_by_name && <div className="erp-cell-sub">Approved by: {order.approved_by_name}</div>}
        </div>
        <div className="erp-card" style={{ padding:'1rem' }}>
          <div className="erp-card-sub">Order Value</div>
          <div style={{ fontSize:'1.5rem', fontWeight:700, color:'#059669' }}>
            ₹{Number(order.total_amount||0).toLocaleString('en-IN')}
          </div>
          <div className="erp-cell-sub">Monthly Rental Total</div>
          {order.remarks && <div className="erp-cell-sub" style={{ marginTop:4, fontStyle:'italic' }}>{order.remarks}</div>}
        </div>
      </div>

      {/* Product Lines + Allocation */}
      <div className="erp-card" style={{ marginBottom:'1.5rem' }}>
        <div className="erp-card-header">
          <div className="erp-card-title">Product Lines & Asset Allocation</div>
        </div>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Product</th><th>Plan</th><th>Qty Required</th>
              <th>Unit Rate</th><th>Amount</th><th>Allocated</th><th>Pending</th>
              {['Confirmed','In Progress','Active'].includes(order.status) && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {lines.map(line => {
              const pending = line.qty - line.assets_allocated;
              return (
                <tr key={line.id}>
                  <td><div className="erp-cell-main">{line.product_name}</div><div className="erp-cell-sub">{line.model}</div></td>
                  <td>{line.plan_name||'—'}</td>
                  <td style={{ textAlign:'center', fontWeight:600 }}>{line.qty}</td>
                  <td>₹{Number(line.unit_rate||0).toLocaleString('en-IN')}/mo</td>
                  <td className="erp-amount">₹{Number(line.amount||0).toLocaleString('en-IN')}</td>
                  <td><span className="erp-badge erp-badge-green">{line.assets_allocated}</span></td>
                  <td>
                    {pending > 0
                      ? <span className="erp-badge erp-badge-orange">{pending} pending</span>
                      : <span className="erp-badge erp-badge-green">✓ Complete</span>}
                  </td>
                  {['Confirmed','In Progress','Active'].includes(order.status) && (
                    <td>
                      {pending > 0 && (
                        <button className="erp-btn-icon" style={{ color:'#6366f1' }} title="Allocate Assets" onClick={() => openAllocModal(line)}>
                          <i className="fa fa-cubes" /> Allocate
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Allocated Assets */}
      {allocations.length > 0 && (
        <div className="erp-card">
          <div className="erp-card-header"><div className="erp-card-title">Allocated Assets</div></div>
          <table className="erp-table">
            <thead>
              <tr><th>Asset Code</th><th>Serial No</th><th>Product</th><th>Status</th><th>Location</th><th>Allocated At</th><th>Return Status</th>
              {['Active','In Progress'].includes(order.status) && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {allocations.map(a => (
                <tr key={a.id}>
                  <td><span className="erp-code">{a.asset_code}</span></td>
                  <td>{a.serial_no||'—'}</td>
                  <td>{a.product_name}</td>
                  <td><span className="erp-badge" style={{ background:a.status_color||'#888', color:'#fff' }}>{a.asset_status_name}</span></td>
                  <td>{a.current_location||'—'}</td>
                  <td>{a.allocated_at?.slice(0,16)||'—'}</td>
                  <td>
                    {a.status === 'Returned'
                      ? <span className="erp-badge erp-badge-green">Returned {a.returned_at?.slice(0,10)}</span>
                      : <span className="erp-badge erp-badge-blue">Active</span>}
                  </td>
                  {['Active','In Progress'].includes(order.status) && (
                    <td>
                      {a.status === 'Allocated' && (
                        <button className="erp-btn-icon" style={{ color:'#f59e0b' }} title="Return Asset" onClick={() => openReturn(a)}>
                          <i className="fa fa-undo" /> Return
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Allocate Assets Modal */}
      {showAllocModal && (
        <div className="erp-modal-overlay" onClick={e => e.target===e.currentTarget && setShowAllocModal(false)}>
          <div className="erp-modal erp-modal-lg">
            <div className="erp-modal-header">
              <h2>Allocate Assets — {selLine?.product_name}</h2>
              <button className="erp-modal-close" onClick={() => setShowAllocModal(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="erp-modal-body">
              <p style={{ color:'#64748b', marginBottom:'1rem', fontSize:'0.875rem' }}>
                Need <strong>{selLine?.qty - selLine?.assets_allocated}</strong> more asset(s). 
                Select from available units below:
              </p>
              {assetsLoading ? (
                <div className="erp-loader"><div className="erp-spinner" /></div>
              ) : availableAssets.length === 0 ? (
                <div className="erp-empty">No available assets for this product.</div>
              ) : (
                <table className="erp-table">
                  <thead><tr><th></th><th>Asset Code</th><th>Serial No</th><th>Condition</th><th>Location</th></tr></thead>
                  <tbody>
                    {availableAssets.map(a => {
                      const sel = selectedAssets.find(s => s.id === a.id);
                      return (
                        <tr key={a.id} style={{ cursor:'pointer', background: sel ? '#f0f9ff':'' }} onClick={() => toggleAsset(a)}>
                          <td><input type="checkbox" checked={!!sel} onChange={() => toggleAsset(a)} /></td>
                          <td><span className="erp-code">{a.asset_code}</span></td>
                          <td>{a.serial_no||'—'}</td>
                          <td>{a.condition_name||'—'}</td>
                          <td>{a.current_location||'—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="erp-modal-footer">
              <div style={{ flex:1, fontSize:'0.875rem', color:'#6366f1' }}>
                {selectedAssets.length} asset(s) selected
              </div>
              <button className="erp-btn-ghost" onClick={() => setShowAllocModal(false)}>Cancel</button>
              <button className="erp-btn-primary" onClick={confirmAlloc} disabled={allocating || !selectedAssets.length}>
                {allocating ? <><i className="fa fa-spinner fa-spin" /> Allocating...</> : 'Confirm Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Asset Modal */}
      {showReturnModal && (
        <div className="erp-modal-overlay" onClick={e => e.target===e.currentTarget && setShowReturnModal(false)}>
          <div className="erp-modal">
            <div className="erp-modal-header">
              <h2>Return Asset — {selAlloc?.asset_code}</h2>
              <button className="erp-modal-close" onClick={() => setShowReturnModal(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="erp-modal-body">
              <div className="erp-form-group" style={{ marginBottom:'1rem' }}>
                <label>Return Condition</label>
                <select className="erp-select" value={returnCond} onChange={e=>setReturnCond(e.target.value)}>
                  {['Excellent','Good','Fair','Poor','Damaged'].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="erp-form-group">
                <label>Remarks</label>
                <textarea className="erp-input erp-textarea" value={returnRemarks} onChange={e=>setReturnRemarks(e.target.value)} placeholder="Any damage notes, missing accessories..." rows={3} />
              </div>
            </div>
            <div className="erp-modal-footer">
              <button className="erp-btn-ghost" onClick={() => setShowReturnModal(false)}>Cancel</button>
              <button className="erp-btn-primary" onClick={confirmReturn}>
                <i className="fa fa-undo" /> Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
