import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import '../styles/erp.css';

export default function RentalPlanMaster() {
  const [plans, setPlans]       = useState([]);
  const [products, setProducts] = useState([]);
  const [types, setTypes]       = useState([]);
  const [cycles, setCycles]     = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [loading, setLoading]   = useState(false);

  const blank = {
    plan_code:'', plan_name:'', product_id:'', rental_type_id:'',
    billing_cycle_id:'', duration_months:12, monthly_rent:'',
    security_deposit:'', late_fee_per_day:'', auto_renew:0
  };
  const [form, setForm] = useState(blank);

  const fetch_ = async () => {
    setLoading(true);
    const [p,r,b,t] = await Promise.all([
      fetch('/api/masters/product_master').then(r=>r.json()),
      fetch('/api/masters/rental_plan_master').then(r=>r.json()),
      fetch('/api/masters/billing_cycle_master').then(r=>r.json()),
      fetch('/api/masters/rental_type_master').then(r=>r.json()),
    ]);
    setProducts(p.data||[]);
    setPlans(r.data||[]);
    setCycles(b.data||[]);
    setTypes(t.data||[]);
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.plan_code || !form.plan_name) return toast.error('Plan Code and Name are required');
    const url    = editing ? `/api/masters/rental_plan_master/${editing.id}` : '/api/masters/rental_plan_master';
    const method = editing ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    const data   = await res.json();
    if (data.status === 'success') {
      toast.success(editing ? 'Plan updated!' : 'Plan created!');
      setShowForm(false); setEditing(null); setForm(blank); fetch_();
    } else toast.error(data.message);
  };

  const handleEdit = p => {
    setEditing(p);
    setForm({
      plan_code: p.plan_code, plan_name: p.plan_name, product_id: p.product_id||'',
      rental_type_id: p.rental_type_id||'', billing_cycle_id: p.billing_cycle_id||'',
      duration_months: p.duration_months||12, monthly_rent: p.monthly_rent||'',
      security_deposit: p.security_deposit||'', late_fee_per_day: p.late_fee_per_day||'',
      auto_renew: p.auto_renew||0
    });
    setShowForm(true);
  };

  const handleDelete = async id => {
    if (!confirm('Deactivate this plan?')) return;
    const res  = await fetch(`/api/masters/rental_plan_master/${id}`, { method:'DELETE' });
    const data = await res.json();
    data.status === 'success' ? (toast.success('Plan deactivated!'), fetch_()) : toast.error(data.message);
  };

  return (
    <div className="erp-page">
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">Rental Plan Master</h1>
          <p className="erp-page-sub">Configure product-wise rental pricing, duration, deposit and billing cycle</p>
        </div>
        <button className="erp-btn-primary" onClick={() => { setShowForm(true); setEditing(null); setForm(blank); }}>
          <i className="fa fa-plus" /> Add Plan
        </button>
      </div>

      <div className="erp-card">
        {loading ? (
          <div className="erp-loader"><div className="erp-spinner" /></div>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Plan Code</th><th>Plan Name</th><th>Product</th>
                <th>Type</th><th>Duration</th><th>Monthly Rent</th>
                <th>Security Deposit</th><th>Late Fee/Day</th><th>Auto Renew</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr><td colSpan={10} className="erp-empty">No rental plans configured yet.</td></tr>
              ) : plans.map(p => (
                <tr key={p.id}>
                  <td><span className="erp-code">{p.plan_code}</span></td>
                  <td><div className="erp-cell-main">{p.plan_name}</div></td>
                  <td><div className="erp-cell-sub">{p.product_name||'—'}</div></td>
                  <td>{p.rental_type||'—'}</td>
                  <td>{p.duration_months} Months</td>
                  <td className="erp-amount">₹{Number(p.monthly_rent||0).toLocaleString('en-IN')}</td>
                  <td className="erp-amount">₹{Number(p.security_deposit||0).toLocaleString('en-IN')}</td>
                  <td>₹{Number(p.late_fee_per_day||0).toLocaleString('en-IN')}/day</td>
                  <td>{p.auto_renew ? <span className="erp-badge erp-badge-green">Yes</span> : <span className="erp-badge erp-badge-grey">No</span>}</td>
                  <td>
                    <button className="erp-btn-icon" title="Edit" onClick={() => handleEdit(p)}><i className="fa fa-pencil" /></button>
                    <button className="erp-btn-icon erp-btn-danger" title="Deactivate" onClick={() => handleDelete(p.id)}><i className="fa fa-trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="erp-modal-overlay" onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div className="erp-modal erp-modal-lg">
            <div className="erp-modal-header">
              <h2>{editing ? 'Edit Rental Plan' : 'Add Rental Plan'}</h2>
              <button className="erp-modal-close" onClick={() => setShowForm(false)}><i className="fa fa-times" /></button>
            </div>
            <form onSubmit={handleSubmit} className="erp-modal-body">
              <div className="erp-form-grid">
                <div className="erp-form-group">
                  <label>Plan Code *</label>
                  <input className="erp-input" value={form.plan_code} onChange={e=>setForm({...form,plan_code:e.target.value})} placeholder="CORP-LAP-12M" required disabled={!!editing} />
                </div>
                <div className="erp-form-group">
                  <label>Plan Name *</label>
                  <input className="erp-input" value={form.plan_name} onChange={e=>setForm({...form,plan_name:e.target.value})} placeholder="Corporate Laptop 12 Months" required />
                </div>
                <div className="erp-form-group">
                  <label>Product</label>
                  <select className="erp-select" value={form.product_id} onChange={e=>setForm({...form,product_id:e.target.value})}>
                    <option value="">— Any Product —</option>
                    {products.map(p=><option key={p.id} value={p.id}>{p.product_name}</option>)}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label>Rental Type</label>
                  <select className="erp-select" value={form.rental_type_id} onChange={e=>setForm({...form,rental_type_id:e.target.value})}>
                    <option value="">— Select Type —</option>
                    {types.map(t=><option key={t.id} value={t.id}>{t.type_name}</option>)}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label>Billing Cycle</label>
                  <select className="erp-select" value={form.billing_cycle_id} onChange={e=>setForm({...form,billing_cycle_id:e.target.value})}>
                    <option value="">— Select Cycle —</option>
                    {cycles.map(c=><option key={c.id} value={c.id}>{c.cycle_name}</option>)}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label>Duration (Months)</label>
                  <input type="number" className="erp-input" value={form.duration_months} onChange={e=>setForm({...form,duration_months:e.target.value})} min={1} />
                </div>
                <div className="erp-form-group">
                  <label>Monthly Rent (₹)</label>
                  <input type="number" className="erp-input" value={form.monthly_rent} onChange={e=>setForm({...form,monthly_rent:e.target.value})} placeholder="2500.00" />
                </div>
                <div className="erp-form-group">
                  <label>Security Deposit (₹)</label>
                  <input type="number" className="erp-input" value={form.security_deposit} onChange={e=>setForm({...form,security_deposit:e.target.value})} placeholder="10000.00" />
                </div>
                <div className="erp-form-group">
                  <label>Late Fee per Day (₹)</label>
                  <input type="number" className="erp-input" value={form.late_fee_per_day} onChange={e=>setForm({...form,late_fee_per_day:e.target.value})} placeholder="100.00" />
                </div>
                <div className="erp-form-group">
                  <label>Auto Renew</label>
                  <select className="erp-select" value={form.auto_renew} onChange={e=>setForm({...form,auto_renew:e.target.value})}>
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" className="erp-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="erp-btn-primary">{editing ? 'Update Plan' : 'Create Plan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
