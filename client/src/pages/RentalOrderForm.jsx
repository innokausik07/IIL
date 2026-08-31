import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/erp.css';

export default function RentalOrderForm() {
  const { id } = useParams();
  const isEdit  = !!id;
  const nav     = useNavigate();

  const [clients, setClients]   = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocs]    = useState([]);
  const [plans, setPlans]       = useState([]);
  const [saving, setSaving]     = useState(false);

  const blankLine = { product_id:'', plan_id:'', qty:1, unit_rate:'', amount:'' };
  const [form, setForm] = useState({
    client_id:'', delivery_loc_id:'', order_date: new Date().toISOString().slice(0,10),
    start_date:'', end_date:'', remarks:''
  });
  const [lines, setLines] = useState([{ ...blankLine }]);

  const flattenTree = (nodes, depth=0) => {
    const out = [];
    (nodes||[]).forEach(n => {
      out.push({...n, _depth:depth});
      if (n.children?.length) out.push(...flattenTree(n.children, depth+1));
    });
    return out;
  };

  useEffect(() => {
    const loadData = async () => {
      const [cl, pr, lo, pl] = await Promise.all([
        fetch('/api/masters/client_master').then(r=>r.json()),
        fetch('/api/masters/product_master').then(r=>r.json()),
        fetch('/api/masters/locations/tree').then(r=>r.json()),
        fetch('/api/masters/rental_plan_master').then(r=>r.json()),
      ]);
      setClients(cl.data||[]);
      setProducts(pr.data||[]);
      setLocs(flattenTree(lo.data||[]));
      setPlans(pl.data||[]);
    };
    loadData();

    if (isEdit) {
      fetch(`/api/rental/orders/${id}`).then(r=>r.json()).then(res => {
        if (res.status === 'success') {
          const { order, lines: oLines } = res.data;
          setForm({
            client_id: order.client_id||'', delivery_loc_id: order.delivery_loc_id||'',
            order_date: order.order_date?.slice(0,10)||'',
            start_date: order.start_date?.slice(0,10)||'',
            end_date:   order.end_date?.slice(0,10)||'',
            remarks:    order.remarks||''
          });
          setLines(oLines.length ? oLines.map(l => ({
            product_id: l.product_id||'', plan_id: l.plan_id||'',
            qty: l.qty||1, unit_rate: l.unit_rate||'', amount: l.amount||''
          })) : [{ ...blankLine }]);
        }
      });
    }
  }, [id]);

  const updateLine = (idx, key, val) => {
    const updated = lines.map((l,i) => {
      if (i !== idx) return l;
      const newLine = { ...l, [key]: val };
      // If unit_rate or qty changes, recalculate amount
      if (key === 'unit_rate' || key === 'qty') {
        newLine.amount = (parseFloat(newLine.qty||1) * parseFloat(newLine.unit_rate||0)).toFixed(2);
      }
      // If plan changes, auto-fill rate
      if (key === 'plan_id' && val) {
        const plan = plans.find(p => String(p.id) === String(val));
        if (plan) {
          newLine.unit_rate = plan.monthly_rent;
          newLine.amount = (parseFloat(newLine.qty||1) * parseFloat(plan.monthly_rent||0)).toFixed(2);
        }
      }
      return newLine;
    });
    setLines(updated);
  };

  const addLine  = () => setLines(l => [...l, { ...blankLine }]);
  const delLine  = idx => setLines(l => l.filter((_,i) => i !== idx));
  const total    = lines.reduce((s,l) => s + parseFloat(l.amount||0), 0);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.client_id) return toast.error('Client is required');
    if (lines.some(l => !l.product_id)) return toast.error('All lines must have a product selected');
    setSaving(true);
    const url    = isEdit ? `/api/rental/orders/${id}` : '/api/rental/orders';
    const method = isEdit ? 'PUT' : 'POST';
    try {
      const res  = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...form, lines }) });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(isEdit ? 'Order updated!' : `Order created: ${data.order_no}`);
        nav('/rental/rental-orders');
      } else toast.error(data.message);
    } catch { toast.error('Request failed'); }
    setSaving(false);
  };

  const plansByProduct = pid => plans.filter(p => !p.product_id || String(p.product_id) === String(pid));

  return (
    <div className="erp-page">
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">{isEdit ? 'Edit Rental Order' : 'New Rental Order'}</h1>
          <p className="erp-page-sub">Configure client, products, rental plans and delivery details</p>
        </div>
        <button className="erp-btn-ghost" onClick={() => nav('/rental/rental-orders')}>
          <i className="fa fa-arrow-left" /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Order Header */}
        <div className="erp-card" style={{ padding:'1.25rem', marginBottom:'1.25rem' }}>
          <div className="erp-card-title" style={{ marginBottom:'1rem' }}>Order Details</div>
          <div className="erp-form-grid">
            <div className="erp-form-group">
              <label>Client *</label>
              <select className="erp-select" value={form.client_id} onChange={e=>setForm({...form,client_id:e.target.value})} required>
                <option value="">— Select Client —</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.client_name}</option>)}
              </select>
            </div>
            <div className="erp-form-group">
              <label>Delivery Location</label>
              <select className="erp-select" value={form.delivery_loc_id} onChange={e=>setForm({...form,delivery_loc_id:e.target.value})}>
                <option value="">— Select Location —</option>
                {locations.map(l=><option key={l.id} value={l.id}>{'  '.repeat(l._depth)}{l.location_name}</option>)}
              </select>
            </div>
            <div className="erp-form-group">
              <label>Order Date *</label>
              <input type="date" className="erp-input" value={form.order_date} onChange={e=>setForm({...form,order_date:e.target.value})} required />
            </div>
            <div className="erp-form-group">
              <label>Rental Start Date</label>
              <input type="date" className="erp-input" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} />
            </div>
            <div className="erp-form-group">
              <label>Rental End Date</label>
              <input type="date" className="erp-input" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} />
            </div>
            <div className="erp-form-group">
              <label>Remarks</label>
              <input className="erp-input" value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})} placeholder="Internal notes..." />
            </div>
          </div>
        </div>

        {/* Order Lines */}
        <div className="erp-card" style={{ padding:'1.25rem', marginBottom:'1.25rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <div className="erp-card-title">Product Lines</div>
            <button type="button" className="erp-btn-primary erp-btn-sm" onClick={addLine}>
              <i className="fa fa-plus" /> Add Line
            </button>
          </div>

          <table className="erp-table">
            <thead>
              <tr>
                <th style={{width:'30%'}}>Product</th>
                <th style={{width:'25%'}}>Rental Plan</th>
                <th style={{width:'8%'}}>Qty</th>
                <th style={{width:'14%'}}>Unit Rate (₹/mo)</th>
                <th style={{width:'14%'}}>Amount</th>
                <th style={{width:'9%'}}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td>
                    <select className="erp-select" value={line.product_id}
                      onChange={e => updateLine(idx,'product_id',e.target.value)}>
                      <option value="">— Product —</option>
                      {products.map(p=><option key={p.id} value={p.id}>{p.product_name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="erp-select" value={line.plan_id}
                      onChange={e => updateLine(idx,'plan_id',e.target.value)}>
                      <option value="">— Plan (optional) —</option>
                      {plansByProduct(line.product_id).map(p=><option key={p.id} value={p.id}>{p.plan_name} — ₹{p.monthly_rent}/mo</option>)}
                    </select>
                  </td>
                  <td>
                    <input type="number" className="erp-input" min={1} value={line.qty}
                      onChange={e => updateLine(idx,'qty',e.target.value)} style={{textAlign:'center'}} />
                  </td>
                  <td>
                    <input type="number" className="erp-input" value={line.unit_rate}
                      onChange={e => updateLine(idx,'unit_rate',e.target.value)} placeholder="0.00" />
                  </td>
                  <td className="erp-amount">₹{Number(line.amount||0).toLocaleString('en-IN')}</td>
                  <td>
                    {lines.length > 1 && (
                      <button type="button" className="erp-btn-icon erp-btn-danger" onClick={() => delLine(idx)}>
                        <i className="fa fa-trash" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign:'right', fontWeight:600, padding:'0.75rem 1rem', color:'#475569' }}>
                  Total Monthly Rental
                </td>
                <td className="erp-amount" style={{ padding:'0.75rem 1rem' }}>₹{total.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
          <button type="button" className="erp-btn-ghost" onClick={() => nav('/rental/rental-orders')}>Cancel</button>
          <button type="submit" className="erp-btn-primary" disabled={saving}>
            {saving ? <><i className="fa fa-spinner fa-spin" /> Saving...</> : isEdit ? 'Update Order' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
