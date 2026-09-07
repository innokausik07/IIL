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
  const [selectedIds, setSelectedIds] = useState([]);

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
    data.status === 'success' ? (toast.success('Plan deactivated!'), setSelectedIds([]), fetch_()) : toast.error(data.message);
  };

  const toggleSelectAll = e => {
    if (e.target.checked) setSelectedIds(plans.map(p => p.id));
    else setSelectedIds([]);
  };

  const toggleSelectRow = id => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="erp-page">
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">Rental Plan Master</h1>
          <p className="erp-page-sub">Configure product-wise rental pricing, duration, deposit and billing cycle</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="erp-btn-ghost" onClick={fetch_}><i className="fa fa-refresh" /> Refresh</button>
          <button className="erp-btn-primary" onClick={() => { setShowForm(true); setEditing(null); setForm(blank); }}>
            <i className="fa fa-plus" /> Add Plan
          </button>
        </div>
      </div>

      {/* Dynamic Action Toolbar */}
      <div className="erp-card" style={{ padding: '12px 18px', marginBottom: '14px', background: selectedIds.length > 0 ? '#eff6ff' : '#ffffff', borderColor: selectedIds.length > 0 ? '#bfdbfe' : '#e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {selectedIds.length > 0 ? (
              <>
                {selectedIds.length === 1 && (
                  <button
                    className="erp-btn-primary"
                    style={{ padding: '6px 14px', fontSize: '13px' }}
                    onClick={() => {
                      const sel = plans.find(x => x.id === selectedIds[0]);
                      if (sel) handleEdit(sel);
                    }}
                  >
                    <i className="fa fa-pencil" /> Edit Plan
                  </button>
                )}
                <button
                  className="erp-btn-ghost"
                  style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '6px 14px', fontSize: '13px' }}
                  onClick={() => {
                    if (confirm(`Deactivate ${selectedIds.length} plan(s)?`)) {
                      selectedIds.forEach(id => handleDelete(id));
                    }
                  }}
                >
                  <i className="fa fa-trash" /> Deactivate ({selectedIds.length})
                </button>
                <button
                  className="erp-btn-ghost"
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                  onClick={() => setSelectedIds([])}
                >
                  <i className="fa fa-times" /> Deselect All
                </button>
              </>
            ) : (
              <>
                <button className="erp-btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => { setShowForm(true); setEditing(null); setForm(blank); }}>
                  <i className="fa fa-plus" /> Add Plan
                </button>
                <button className="erp-btn-ghost" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={fetch_}>
                  <i className="fa fa-refresh" /> Refresh
                </button>
              </>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div style={{ fontWeight: 600, color: '#1e40af', fontSize: '13px' }}>
              {selectedIds.length} of {plans.length} Plan(s) selected
            </div>
          )}
        </div>
      </div>

      <div className="erp-card">
        {loading ? (
          <div className="erp-loader"><div className="erp-spinner" /></div>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: '38px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={plans.length > 0 && selectedIds.length === plans.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Plan Code</th><th>Plan Name</th><th>Product</th>
                <th>Type</th><th>Duration</th><th>Monthly Rent</th>
                <th>Security Deposit</th><th>Late Fee/Day</th><th>Auto Renew</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr><td colSpan={10} className="erp-empty">No rental plans configured yet.</td></tr>
              ) : plans.map(p => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <tr
                    key={p.id}
                    onClick={() => toggleSelectRow(p.id)}
                    style={{ background: isSelected ? '#f0fdf4' : undefined, cursor: 'pointer' }}
                  >
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(p.id)}
                      />
                    </td>
                    <td><span className="erp-code">{p.plan_code}</span></td>
                    <td><div className="erp-cell-main">{p.plan_name}</div></td>
                    <td><div className="erp-cell-sub">{p.product_name||'—'}</div></td>
                    <td>{p.rental_type||'—'}</td>
                    <td>{p.duration_months} Months</td>
                    <td className="erp-amount">₹{Number(p.monthly_rent||0).toLocaleString('en-IN')}</td>
                    <td className="erp-amount">₹{Number(p.security_deposit||0).toLocaleString('en-IN')}</td>
                    <td>₹{Number(p.late_fee_per_day||0).toLocaleString('en-IN')}/day</td>
                    <td>{p.auto_renew ? <span className="erp-badge erp-badge-green">Yes</span> : <span className="erp-badge erp-badge-grey">No</span>}</td>
                  </tr>
                );
              })}
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
