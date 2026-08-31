import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/erp.css';

const STATUS_COLORS = {
  Draft:      { bg:'#f1f5f9', color:'#475569' },
  Sent:       { bg:'#dbeafe', color:'#1e40af' },
  Partial:    { bg:'#fef3c7', color:'#92400e' },
  Paid:       { bg:'#dcfce7', color:'#166534' },
  Overdue:    { bg:'#fee2e2', color:'#991b1b' },
  Cancelled:  { bg:'#f1f5f9', color:'#94a3b8' },
};

export default function InvoiceMaster() {
  const nav = useNavigate();
  const [invoices, setInvoices]   = useState([]);
  const [clients, setClients]     = useState([]);
  const [orders, setOrders]       = useState([]);
  const [invTypes, setInvTypes]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [showForm, setShowForm]   = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selInvoice, setSelInvoice] = useState(null);
  const [payModes, setPayModes]   = useState([]);
  const [payForm, setPayForm]     = useState({ amount:'', mode_id:'', payment_date: new Date().toISOString().slice(0,10), ref_no:'', remarks:'' });

  const blankForm = { client_id:'', order_id:'', invoice_type_id:'', invoice_date: new Date().toISOString().slice(0,10), due_date:'', billing_period_from:'', billing_period_to:'', lines:[] };
  const [form, setForm] = useState(blankForm);

  const load = async () => {
    setLoading(true);
    const [inv, cl, ord, it, pm] = await Promise.all([
      fetch('/api/finance/invoices').then(r=>r.json()),
      fetch('/api/masters/client_master').then(r=>r.json()),
      fetch('/api/rental/orders').then(r=>r.json()),
      fetch('/api/masters/invoice_type_master').then(r=>r.json()),
      fetch('/api/masters/payment_mode_master').then(r=>r.json()),
    ]);
    setInvoices(inv.data||[]);
    setClients(cl.data||[]);
    setOrders(ord.data||[]);
    setInvTypes(it.data||[]);
    setPayModes(pm.data||[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Auto-build lines from order
  const handleOrderChange = async ordId => {
    setForm(f => ({ ...f, order_id: ordId }));
    if (!ordId) return;
    const res = await fetch(`/api/rental/orders/${ordId}`).then(r=>r.json());
    if (res.status === 'success') {
      const { order, lines } = res.data;
      setForm(f => ({
        ...f, client_id: order.client_id||'',
        billing_period_from: order.start_date?.slice(0,10)||'',
        billing_period_to:   order.end_date?.slice(0,10)||'',
        lines: lines.map(l => ({
          description: `${l.product_name} - ${l.plan_name||'Rental'} (${l.qty} unit${l.qty>1?'s':''})`,
          qty: l.qty, unit_rate: l.unit_rate, tax_rate: 18, amount: l.amount, asset_id: null
        }))
      }));
    }
  };

  const updateLine = (idx, key, val) => {
    const updated = form.lines.map((l,i) => {
      if (i !== idx) return l;
      const nl = { ...l, [key]: val };
      if (key === 'unit_rate' || key === 'qty') nl.amount = (parseFloat(nl.qty||1) * parseFloat(nl.unit_rate||0)).toFixed(2);
      return nl;
    });
    setForm(f => ({ ...f, lines: updated }));
  };

  const addLine = () => setForm(f => ({ ...f, lines:[...f.lines, { description:'', qty:1, unit_rate:'', tax_rate:18, amount:'', asset_id:null }] }));
  const delLine = idx => setForm(f => ({ ...f, lines: f.lines.filter((_,i)=>i!==idx) }));

  const subtotal   = form.lines.reduce((s,l) => s + parseFloat(l.amount||0), 0);
  const taxTotal   = form.lines.reduce((s,l) => s + parseFloat(l.amount||0) * parseFloat(l.tax_rate||0)/100, 0);
  const grandTotal = subtotal + taxTotal;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.client_id) return toast.error('Client is required');
    const res  = await fetch('/api/finance/invoices', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    const data = await res.json();
    if (data.status === 'success') { toast.success(`Invoice ${data.invoice_no} created!`); setShowForm(false); setForm(blankForm); load(); }
    else toast.error(data.message);
  };

  const sendInvoice = async id => {
    const res  = await fetch(`/api/finance/invoices/${id}/send`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:'{}' });
    const data = await res.json();
    data.status === 'success' ? (toast.success('Invoice sent!'), load()) : toast.error(data.message);
  };

  const openPayment = inv => { setSelInvoice(inv); setPayForm({ amount: inv.balance_due, mode_id:'', payment_date: new Date().toISOString().slice(0,10), ref_no:'', remarks:'' }); setShowPayModal(true); };

  const submitPayment = async () => {
    if (!payForm.amount) return toast.error('Amount is required');
    const res  = await fetch('/api/finance/payments', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ client_id: selInvoice.client_id, invoice_id: selInvoice.id, ...payForm })
    });
    const data = await res.json();
    if (data.status === 'success') { toast.success(`Payment ${data.payment_no} recorded!`); setShowPayModal(false); load(); }
    else toast.error(data.message);
  };

  const filtered = invoices.filter(i =>
    (statusFilter === 'all' || i.status === statusFilter) &&
    ((i.invoice_no||'').toLowerCase().includes(search.toLowerCase()) ||
     (i.client_name||'').toLowerCase().includes(search.toLowerCase()))
  );

  const sb = status => {
    const c = STATUS_COLORS[status] || { bg:'#f1f5f9', color:'#475569' };
    return <span className="erp-badge" style={{ background:c.bg, color:c.color }}>{status}</span>;
  };

  const totalBilling     = invoices.reduce((s,i) => s + parseFloat(i.total||0), 0);
  const totalCollected   = invoices.reduce((s,i) => s + parseFloat(i.paid_amount||0), 0);
  const totalOutstanding = invoices.filter(i=>['Sent','Partial'].includes(i.status)).reduce((s,i) => s + parseFloat(i.balance_due||0), 0);

  return (
    <div className="erp-page">
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">Invoice Management</h1>
          <p className="erp-page-sub">Create, send and track rental invoices</p>
        </div>
        <button className="erp-btn-primary" onClick={() => { setShowForm(true); setForm(blankForm); }}>
          <i className="fa fa-plus" /> New Invoice
        </button>
      </div>

      {/* Finance Stats */}
      <div className="erp-stat-row">
        {[
          { label:'Total Billing',   val:`₹${(totalBilling/1000).toFixed(1)}K`,       color:'#6366f1' },
          { label:'Collected',       val:`₹${(totalCollected/1000).toFixed(1)}K`,     color:'#22c55e' },
          { label:'Outstanding',     val:`₹${(totalOutstanding/1000).toFixed(1)}K`,   color:'#f59e0b' },
          { label:'Total Invoices',  val: invoices.length,                             color:'#3b82f6' },
        ].map(s => (
          <div className="erp-stat-card" key={s.label} style={{ borderLeftColor:s.color }}>
            <div className="erp-stat-val" style={{ color:s.color }}>{s.val}</div>
            <div className="erp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="erp-toolbar">
        <div className="erp-search-wrap">
          <i className="fa fa-search erp-search-icon" />
          <input className="erp-search" placeholder="Search by invoice no, client..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="erp-select" style={{width:160}} value={statusFilter} onChange={e=>setStatus(e.target.value)}>
          <option value="all">All Status</option>
          {Object.keys(STATUS_COLORS).map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="erp-card">
        {loading ? <div className="erp-loader"><div className="erp-spinner" /></div> : (
          <table className="erp-table">
            <thead>
              <tr><th>Invoice No</th><th>Client</th><th>Order No</th><th>Invoice Date</th><th>Due Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="erp-empty">No invoices found.</td></tr>
              ) : filtered.map(i => (
                <tr key={i.id}>
                  <td><span className="erp-code">{i.invoice_no}</span></td>
                  <td><div className="erp-cell-main">{i.client_name}</div></td>
                  <td>{i.order_no||'—'}</td>
                  <td>{i.invoice_date?.slice(0,10)||'—'}</td>
                  <td style={{ color: i.status==='Overdue'?'#dc2626':'' }}>{i.due_date?.slice(0,10)||'—'}</td>
                  <td className="erp-amount">₹{Number(i.total||0).toLocaleString('en-IN')}</td>
                  <td style={{ color:'#16a34a', fontWeight:600 }}>₹{Number(i.paid_amount||0).toLocaleString('en-IN')}</td>
                  <td style={{ color: parseFloat(i.balance_due)>0?'#dc2626':'#16a34a', fontWeight:600 }}>
                    ₹{Number(i.balance_due||0).toLocaleString('en-IN')}
                  </td>
                  <td>{sb(i.status)}</td>
                  <td>
                    {i.status === 'Draft' && (
                      <button className="erp-btn-icon" style={{ color:'#6366f1' }} title="Send Invoice" onClick={() => sendInvoice(i.id)}>
                        <i className="fa fa-send" />
                      </button>
                    )}
                    {['Sent','Partial'].includes(i.status) && parseFloat(i.balance_due) > 0 && (
                      <button className="erp-btn-icon" style={{ color:'#16a34a' }} title="Record Payment" onClick={() => openPayment(i)}>
                        <i className="fa fa-money" />
                      </button>
                    )}
                    <button className="erp-btn-icon" title="View Detail" onClick={() => nav(`/finance/invoices/${i.id}`)}>
                      <i className="fa fa-eye" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Invoice Form Modal */}
      {showForm && (
        <div className="erp-modal-overlay" onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div className="erp-modal erp-modal-lg" style={{ maxWidth:900 }}>
            <div className="erp-modal-header">
              <h2>New Invoice</h2>
              <button className="erp-modal-close" onClick={() => setShowForm(false)}><i className="fa fa-times" /></button>
            </div>
            <form onSubmit={handleSubmit} className="erp-modal-body">
              <div className="erp-form-grid" style={{ marginBottom:'1rem' }}>
                <div className="erp-form-group">
                  <label>Rental Order (auto-fills lines)</label>
                  <select className="erp-select" value={form.order_id} onChange={e=>handleOrderChange(e.target.value)}>
                    <option value="">— Select Order (optional) —</option>
                    {orders.filter(o=>o.status==='Active').map(o=><option key={o.id} value={o.id}>{o.order_no} — {o.client_name}</option>)}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label>Client *</label>
                  <select className="erp-select" value={form.client_id} onChange={e=>setForm({...form,client_id:e.target.value})} required>
                    <option value="">— Select Client —</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.client_name}</option>)}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label>Invoice Type</label>
                  <select className="erp-select" value={form.invoice_type_id} onChange={e=>setForm({...form,invoice_type_id:e.target.value})}>
                    <option value="">— Invoice Type —</option>
                    {invTypes.map(t=><option key={t.id} value={t.id}>{t.type_name}</option>)}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label>Invoice Date</label>
                  <input type="date" className="erp-input" value={form.invoice_date} onChange={e=>setForm({...form,invoice_date:e.target.value})} required />
                </div>
                <div className="erp-form-group">
                  <label>Due Date</label>
                  <input type="date" className="erp-input" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} />
                </div>
                <div className="erp-form-group">
                  <label>Billing Period From</label>
                  <input type="date" className="erp-input" value={form.billing_period_from} onChange={e=>setForm({...form,billing_period_from:e.target.value})} />
                </div>
                <div className="erp-form-group">
                  <label>Billing Period To</label>
                  <input type="date" className="erp-input" value={form.billing_period_to} onChange={e=>setForm({...form,billing_period_to:e.target.value})} />
                </div>
              </div>

              {/* Invoice Lines */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                <div style={{ fontWeight:600, color:'#1e293b' }}>Invoice Lines</div>
                <button type="button" className="erp-btn-primary erp-btn-sm" onClick={addLine}><i className="fa fa-plus" /> Add Line</button>
              </div>
              <table className="erp-table erp-table-compact" style={{ marginBottom:'1rem' }}>
                <thead><tr><th>Description</th><th style={{width:50}}>Qty</th><th style={{width:100}}>Rate (₹)</th><th style={{width:70}}>GST%</th><th style={{width:100}}>Amount</th><th style={{width:40}}></th></tr></thead>
                <tbody>
                  {form.lines.length === 0 ? (
                    <tr><td colSpan={6} className="erp-empty">No lines. Add a line or select an order above.</td></tr>
                  ) : form.lines.map((l, idx) => (
                    <tr key={idx}>
                      <td><input className="erp-input" value={l.description} onChange={e=>updateLine(idx,'description',e.target.value)} placeholder="Description..." /></td>
                      <td><input type="number" className="erp-input" value={l.qty} onChange={e=>updateLine(idx,'qty',e.target.value)} min={1} /></td>
                      <td><input type="number" className="erp-input" value={l.unit_rate} onChange={e=>updateLine(idx,'unit_rate',e.target.value)} /></td>
                      <td><input type="number" className="erp-input" value={l.tax_rate} onChange={e=>updateLine(idx,'tax_rate',e.target.value)} /></td>
                      <td className="erp-amount">₹{Number(l.amount||0).toLocaleString('en-IN')}</td>
                      <td><button type="button" className="erp-btn-icon erp-btn-danger" onClick={()=>delLine(idx)}><i className="fa fa-trash" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px', marginBottom:'1rem' }}>
                <div style={{ fontSize:'0.875rem', color:'#64748b' }}>Subtotal: <strong>₹{subtotal.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div>
                <div style={{ fontSize:'0.875rem', color:'#64748b' }}>GST: <strong>₹{taxTotal.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div>
                <div style={{ fontSize:'1.1rem', fontWeight:700, color:'#059669' }}>Total: ₹{grandTotal.toLocaleString('en-IN',{minimumFractionDigits:2})}</div>
              </div>

              <div className="erp-modal-footer">
                <button type="button" className="erp-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="erp-btn-primary">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && selInvoice && (
        <div className="erp-modal-overlay" onClick={e => e.target===e.currentTarget && setShowPayModal(false)}>
          <div className="erp-modal">
            <div className="erp-modal-header">
              <h2>Record Payment — {selInvoice.invoice_no}</h2>
              <button className="erp-modal-close" onClick={() => setShowPayModal(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="erp-modal-body">
              <div style={{ background:'#f8fafc', borderRadius:8, padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.875rem' }}>
                <div>Client: <strong>{selInvoice.client_name}</strong></div>
                <div>Invoice Total: <strong>₹{Number(selInvoice.total||0).toLocaleString('en-IN')}</strong></div>
                <div>Already Paid: <strong style={{ color:'#16a34a' }}>₹{Number(selInvoice.paid_amount||0).toLocaleString('en-IN')}</strong></div>
                <div>Balance Due: <strong style={{ color:'#dc2626' }}>₹{Number(selInvoice.balance_due||0).toLocaleString('en-IN')}</strong></div>
              </div>
              <div className="erp-form-grid">
                <div className="erp-form-group erp-form-full">
                  <label>Amount (₹) *</label>
                  <input type="number" className="erp-input" value={payForm.amount} onChange={e=>setPayForm({...payForm,amount:e.target.value})} max={selInvoice.balance_due} />
                </div>
                <div className="erp-form-group">
                  <label>Payment Mode</label>
                  <select className="erp-select" value={payForm.mode_id} onChange={e=>setPayForm({...payForm,mode_id:e.target.value})}>
                    <option value="">— Select Mode —</option>
                    {payModes.map(m=><option key={m.id} value={m.id}>{m.mode_name}</option>)}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label>Payment Date</label>
                  <input type="date" className="erp-input" value={payForm.payment_date} onChange={e=>setPayForm({...payForm,payment_date:e.target.value})} />
                </div>
                <div className="erp-form-group erp-form-full">
                  <label>Reference No (UTR / Cheque / UPI)</label>
                  <input className="erp-input" value={payForm.ref_no} onChange={e=>setPayForm({...payForm,ref_no:e.target.value})} placeholder="UTR12345..." />
                </div>
                <div className="erp-form-group erp-form-full">
                  <label>Remarks</label>
                  <input className="erp-input" value={payForm.remarks} onChange={e=>setPayForm({...payForm,remarks:e.target.value})} placeholder="Optional notes..." />
                </div>
              </div>
            </div>
            <div className="erp-modal-footer">
              <button className="erp-btn-ghost" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button className="erp-btn-primary" onClick={submitPayment}>
                <i className="fa fa-money" /> Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
