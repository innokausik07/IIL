import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/erp.css';

export default function AssetMaster() {
  const [assets, setAssets]     = useState([]);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors]   = useState([]);
  const [locations, setLocs]    = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(false);
  const nav = useNavigate();

  const blank = {
    asset_code:'', serial_no:'', product_id:'', vendor_id:'',
    current_loc_id:'', custodian_id:'', asset_status_id:'',
    condition_id:'', purchase_date:'', purchase_cost:'',
    purchase_ref:'', warranty_expiry:'', notes:''
  };
  const [form, setForm] = useState(blank);

  const fetchAll = async () => {
    setLoading(true);
    const [a,p,v,l,s,c] = await Promise.all([
      fetch('/api/masters/asset_master').then(r=>r.json()),
      fetch('/api/masters/product_master').then(r=>r.json()),
      fetch('/api/masters/vendor_master').then(r=>r.json()),
      fetch('/api/masters/locations/tree').then(r=>r.json()),
      fetch('/api/masters/asset_status_master').then(r=>r.json()),
      fetch('/api/masters/asset_condition_master').then(r=>r.json()),
    ]);
    setAssets(a.data||[]);
    setProducts(p.data||[]);
    setVendors(v.data||[]);
    setLocs(flattenTree(l.data||[]));
    setStatuses(s.data||[]);
    setConditions(c.data||[]);
    setLoading(false);
  };

  const flattenTree = (nodes, depth=0) => {
    const out = [];
    (nodes||[]).forEach(n => {
      out.push({...n, _depth: depth});
      if (n.children?.length) out.push(...flattenTree(n.children, depth+1));
    });
    return out;
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.asset_code || !form.product_id) return toast.error('Asset Code and Product are required');
    const url    = editing ? `/api/masters/asset_master/${editing.id}` : '/api/masters/asset_master';
    const method = editing ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method, headers: {'Content-Type':'application/json'},
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(editing ? 'Asset updated!' : 'Asset created!');
        setShowForm(false); setEditing(null); setForm(blank);
        fetchAll();
      } else toast.error(data.message);
    } catch { toast.error('Request failed'); }
  };

  const handleEdit = a => {
    setEditing(a);
    setForm({
      asset_code: a.asset_code, serial_no: a.serial_no||'', product_id: a.product_id||'',
      vendor_id: a.vendor_id||'', current_loc_id: a.current_loc_id||'',
      custodian_id: a.custodian_id||'', asset_status_id: a.asset_status_id||'',
      condition_id: a.condition_id||'', purchase_date: a.purchase_date?.slice(0,10)||'',
      purchase_cost: a.purchase_cost||'', purchase_ref: a.purchase_ref||'',
      warranty_expiry: a.warranty_expiry?.slice(0,10)||'', notes: a.notes||''
    });
    setShowForm(true);
  };

  const handleDelete = async id => {
    if (!confirm('Remove this asset?')) return;
    const res  = await fetch(`/api/masters/asset_master/${id}`, { method:'DELETE' });
    const data = await res.json();
    data.status === 'success' ? (toast.success('Asset removed!'), fetchAll()) : toast.error(data.message);
  };

  const filtered = assets.filter(a =>
    (a.asset_code||'').toLowerCase().includes(search.toLowerCase()) ||
    (a.serial_no||'').toLowerCase().includes(search.toLowerCase()) ||
    (a.product_name||'').toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = a => (
    <span className="erp-badge" style={{ background: a.status_color||'#888', color:'#fff' }}>
      {a.asset_status || '—'}
    </span>
  );

  return (
    <div className="erp-page">
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">Asset Master</h1>
          <p className="erp-page-sub">Physical IT assets — laptops, desktops, monitors, accessories</p>
        </div>
        <button className="erp-btn-primary" onClick={() => { setShowForm(true); setEditing(null); setForm(blank); }}>
          <i className="fa fa-plus" /> Add Asset
        </button>
      </div>

      {/* Stats Row */}
      <div className="erp-stat-row">
        {[
          { label:'Total',       val: assets.length,                                             color:'#6366f1' },
          { label:'Available',   val: assets.filter(a=>a.status_color==='#22c55e').length,       color:'#22c55e' },
          { label:'Rented',      val: assets.filter(a=>a.asset_status==='Rented').length,        color:'#10b981' },
          { label:'Maintenance', val: assets.filter(a=>a.asset_status==='Under Maintenance').length, color:'#f97316' },
        ].map(s => (
          <div className="erp-stat-card" key={s.label} style={{ borderLeftColor: s.color }}>
            <div className="erp-stat-val" style={{ color: s.color }}>{s.val}</div>
            <div className="erp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="erp-toolbar">
        <div className="erp-search-wrap">
          <i className="fa fa-search erp-search-icon" />
          <input className="erp-search" placeholder="Search by asset code, serial no, product..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="erp-card">
        {loading ? (
          <div className="erp-loader"><div className="erp-spinner" /></div>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Asset Code</th><th>Product</th><th>Serial No</th>
                <th>Location</th><th>Status</th><th>Condition</th>
                <th>Purchase Cost</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="erp-empty">No assets found. Click "Add Asset" to create one.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id}>
                  <td><span className="erp-code">{a.asset_code}</span></td>
                  <td><div className="erp-cell-main">{a.product_name}</div><div className="erp-cell-sub">{a.model}</div></td>
                  <td>{a.serial_no||'—'}</td>
                  <td>{a.current_location||'—'}</td>
                  <td>{statusBadge(a)}</td>
                  <td>{a.condition_name||'—'}</td>
                  <td>₹{Number(a.purchase_cost||0).toLocaleString('en-IN')}</td>
                  <td>
                    <button className="erp-btn-icon" title="Print Barcode Label" onClick={() => nav(`/assets/asset-master/${a.id}/barcode`)} style={{ color: '#6366f1' }}>
                      <i className="fa fa-barcode" />
                    </button>

                    <button className="erp-btn-icon" title="View Movements" onClick={() => nav(`/assets/asset-movements?id=${a.id}&code=${a.asset_code}`)}>
                      <i className="fa fa-exchange" />
                    </button>

                    <button className="erp-btn-icon" title="Edit" onClick={() => handleEdit(a)}>
                      <i className="fa fa-pencil" />
                    </button>
                    <button className="erp-btn-icon erp-btn-danger" title="Remove" onClick={() => handleDelete(a.id)}>
                      <i className="fa fa-trash" />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="erp-modal-overlay" onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div className="erp-modal erp-modal-lg">
            <div className="erp-modal-header">
              <h2>{editing ? 'Edit Asset' : 'Add Asset'}</h2>
              <button className="erp-modal-close" onClick={() => setShowForm(false)}><i className="fa fa-times" /></button>
            </div>
            <form onSubmit={handleSubmit} className="erp-modal-body">
              <div className="erp-form-grid">
                <div className="erp-form-group">
                  <label>Asset Code *</label>
                  <input className="erp-input" value={form.asset_code} onChange={e=>setForm({...form,asset_code:e.target.value})} placeholder="AST-000001" required disabled={!!editing} />
                </div>
                <div className="erp-form-group">
                  <label>Serial Number</label>
                  <input className="erp-input" value={form.serial_no} onChange={e=>setForm({...form,serial_no:e.target.value})} placeholder="Serial No" />
                </div>
                <div className="erp-form-group">
                  <label>Product *</label>
                  <select className="erp-select" value={form.product_id} onChange={e=>setForm({...form,product_id:e.target.value})} required>
                    <option value="">— Select Product —</option>
                    {products.map(p=><option key={p.id} value={p.id}>{p.product_name} {p.model?`(${p.model})`:''}</option>)}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label>Vendor</label>
                  <select className="erp-select" value={form.vendor_id} onChange={e=>setForm({...form,vendor_id:e.target.value})}>
                    <option value="">— Select Vendor —</option>
                    {vendors.map(v=><option key={v.sno} value={v.sno}>{v.name}</option>)}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label>Current Location</label>
                  <select className="erp-select" value={form.current_loc_id} onChange={e=>setForm({...form,current_loc_id:e.target.value})}>
                    <option value="">— Select Location —</option>
                    {locations.map(l=><option key={l.id} value={l.id}>{'  '.repeat(l._depth)}{l.location_name} {l.type_name?`[${l.type_name}]`:''}</option>)}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label>Asset Status</label>
                  <select className="erp-select" value={form.asset_status_id} onChange={e=>setForm({...form,asset_status_id:e.target.value})}>
                    <option value="">— Select Status —</option>
                    {statuses.filter(s=>s.status==='1').map(s=><option key={s.id} value={s.id}>{s.status_name}</option>)}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label>Condition</label>
                  <select className="erp-select" value={form.condition_id} onChange={e=>setForm({...form,condition_id:e.target.value})}>
                    <option value="">— Select Condition —</option>
                    {conditions.map(c=><option key={c.id} value={c.id}>{c.cond_name}</option>)}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label>Purchase Date</label>
                  <input type="date" className="erp-input" value={form.purchase_date} onChange={e=>setForm({...form,purchase_date:e.target.value})} />
                </div>
                <div className="erp-form-group">
                  <label>Purchase Cost (₹)</label>
                  <input type="number" className="erp-input" value={form.purchase_cost} onChange={e=>setForm({...form,purchase_cost:e.target.value})} placeholder="0.00" />
                </div>
                <div className="erp-form-group">
                  <label>Purchase Ref / GRN No</label>
                  <input className="erp-input" value={form.purchase_ref} onChange={e=>setForm({...form,purchase_ref:e.target.value})} placeholder="GRN-001" />
                </div>
                <div className="erp-form-group">
                  <label>Warranty Expiry</label>
                  <input type="date" className="erp-input" value={form.warranty_expiry} onChange={e=>setForm({...form,warranty_expiry:e.target.value})} />
                </div>
                <div className="erp-form-group erp-form-full">
                  <label>Notes</label>
                  <textarea className="erp-input erp-textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Additional notes..." rows={2} />
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" className="erp-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="erp-btn-primary">{editing ? 'Update Asset' : 'Create Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
