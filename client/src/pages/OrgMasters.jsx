import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import '../styles/erp.css';

const MasterTable = ({ title, sub, fields, table, idCol = 'id' }) => {
  const [rows, setRows]         = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const blank = Object.fromEntries(fields.map(f => [f.key, f.default ?? '']));
  const [form, setForm]         = useState(blank);

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/masters/${table}`).then(r => r.json());
    setRows(r.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const submit = async e => {
    e.preventDefault();
    const url    = editing ? `/api/masters/${table}/${editing[idCol]}` : `/api/masters/${table}`;
    const method = editing ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data   = await res.json();
    if (data.status === 'success') { toast.success('Saved!'); setShowForm(false); setEditing(null); setForm(blank); load(); }
    else toast.error(data.message);
  };

  const del = async id => {
    if (!confirm('Deactivate this record?')) return;
    const res  = await fetch(`/api/masters/${table}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    data.status === 'success' ? (toast.success('Deactivated!'), load()) : toast.error(data.message);
  };

  const edit = row => {
    setEditing(row);
    setForm(Object.fromEntries(fields.map(f => [f.key, row[f.key] ?? f.default ?? ''])));
    setShowForm(true);
  };

  return (
    <div className="erp-card" style={{ marginBottom: '1.5rem' }}>
      <div className="erp-card-header">
        <div><div className="erp-card-title">{title}</div><div className="erp-card-sub">{sub}</div></div>
        <button className="erp-btn-primary erp-btn-sm" onClick={() => { setForm(blank); setEditing(null); setShowForm(true); }}>
          <i className="fa fa-plus" /> Add
        </button>
      </div>
      {loading ? <div className="erp-loader"><div className="erp-spinner" /></div> : (
        <table className="erp-table erp-table-compact">
          <thead><tr>{fields.filter(f=>!f.hidden).map(f=><th key={f.key}>{f.label}</th>)}<th>Actions</th></tr></thead>
          <tbody>
            {rows.filter(r=>r.status!=='D').length === 0 ? (
              <tr><td colSpan={fields.length+1} className="erp-empty">No records. Click Add to create.</td></tr>
            ) : rows.filter(r=>r.status!=='D').map(r=>(
              <tr key={r[idCol]}>
                {fields.filter(f=>!f.hidden).map(f=>(
                  <td key={f.key}>
                    {f.badge ? <span className="erp-badge" style={{ background: r.color||'#6366f1', color:'#fff' }}>{r[f.key]||'—'}</span>
                    : f.key==='color' ? <span style={{ display:'inline-block', width:20, height:20, borderRadius:4, background:r.color||'#888', verticalAlign:'middle' }} />
                    : (f.prefix||'')+String(r[f.key]||'—')}
                  </td>
                ))}
                <td>
                  <button className="erp-btn-icon" onClick={() => edit(r)}><i className="fa fa-pencil" /></button>
                  <button className="erp-btn-icon erp-btn-danger" onClick={() => del(r[idCol])}><i className="fa fa-trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showForm && (
        <div className="erp-modal-overlay" onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div className="erp-modal">
            <div className="erp-modal-header">
              <h2>{editing ? `Edit ${title}` : `Add ${title}`}</h2>
              <button className="erp-modal-close" onClick={() => setShowForm(false)}><i className="fa fa-times" /></button>
            </div>
            <form onSubmit={submit} className="erp-modal-body">
              <div className="erp-form-grid">
                {fields.map(f => (
                  <div className="erp-form-group" key={f.key}>
                    <label>{f.label}{f.required && ' *'}</label>
                    {f.type === 'color' ? (
                      <input type="color" className="erp-input erp-input-color" value={form[f.key]||'#888888'} onChange={e=>setForm({...form,[f.key]:e.target.value})} />
                    ) : f.type === 'select' ? (
                      <select className="erp-select" value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}>
                        {f.options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    ) : (
                      <input type={f.type||'text'} className="erp-input" value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} placeholder={f.placeholder||f.label} required={f.required} />
                    )}
                  </div>
                ))}
              </div>
              <div className="erp-modal-footer">
                <button type="button" className="erp-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="erp-btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default function OrgMasters() {
  return (
    <div className="erp-page">
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">Organization & Location Masters</h1>
          <p className="erp-page-sub">Configure hierarchy levels, units, location types and asset statuses</p>
        </div>
      </div>

      <MasterTable
        title="Organization Levels"
        sub="Define the hierarchy: Company → Region → Zone → Branch → Dept → Team"
        table="org_levels"
        fields={[
          { key:'level_code', label:'Level Code', required:true, placeholder:'REGION' },
          { key:'level_name', label:'Level Name', required:true, placeholder:'Region' },
          { key:'level_order', label:'Order', type:'number', required:true, default:1 },
          { key:'status', label:'Status', type:'select', options:[{v:'1',l:'Active'},{v:'0',l:'Inactive'}], default:'1' },
        ]}
      />

      <MasterTable
        title="Location Types"
        sub="Head Office, Plant, Mother Warehouse, Child Warehouse, Repair Center, Client Site ..."
        table="location_types"
        fields={[
          { key:'type_code', label:'Type Code', required:true, placeholder:'MOTHER_WH' },
          { key:'type_name', label:'Type Name', required:true, placeholder:'Mother Warehouse' },
          { key:'status', label:'Status', type:'select', options:[{v:'1',l:'Active'},{v:'0',l:'Inactive'}], default:'1' },
        ]}
      />

      <MasterTable
        title="Asset Status Master"
        sub="Configurable asset lifecycle statuses — Available, Rented, Maintenance, Scrap ..."
        table="asset_status_master"
        fields={[
          { key:'status_code',  label:'Status Code', required:true, placeholder:'AVAILABLE' },
          { key:'status_name',  label:'Status Name', required:true, badge:true },
          { key:'color',        label:'Color',        type:'color', default:'#888888' },
          { key:'is_available', label:'Is Available', type:'select', options:[{v:1,l:'Yes'},{v:0,l:'No'}], default:0 },
          { key:'is_rented',    label:'Is Rented',    type:'select', options:[{v:1,l:'Yes'},{v:0,l:'No'}], default:0 },
          { key:'sort_order',   label:'Sort Order',   type:'number', default:0 },
          { key:'status',       label:'Active',       type:'select', options:[{v:'1',l:'Active'},{v:'0',l:'Inactive'}], default:'1' },
        ]}
      />

      <MasterTable
        title="Asset Condition Master"
        sub="Excellent, Good, Fair, Poor, Damaged, Scrapped"
        table="asset_condition_master"
        fields={[
          { key:'cond_code', label:'Condition Code', required:true, placeholder:'GOOD' },
          { key:'cond_name', label:'Condition Name', required:true, placeholder:'Good' },
          { key:'status', label:'Status', type:'select', options:[{v:'1',l:'Active'},{v:'0',l:'Inactive'}], default:'1' },
        ]}
      />

      <MasterTable
        title="Rental Type Master"
        sub="Monthly Rental, Quarterly, Annual, Daily, One-Time"
        table="rental_type_master"
        fields={[
          { key:'type_code', label:'Type Code', required:true, placeholder:'MONTHLY' },
          { key:'type_name', label:'Type Name', required:true, placeholder:'Monthly Rental' },
          { key:'status', label:'Status', type:'select', options:[{v:'1',l:'Active'},{v:'0',l:'Inactive'}], default:'1' },
        ]}
      />

      <MasterTable
        title="Billing Cycle Master"
        sub="Monthly (30 days), Quarterly (90 days), Annual (365 days) ..."
        table="billing_cycle_master"
        fields={[
          { key:'cycle_code', label:'Cycle Code', required:true, placeholder:'MONTHLY' },
          { key:'cycle_name', label:'Cycle Name', required:true, placeholder:'Monthly' },
          { key:'cycle_days', label:'Cycle Days', type:'number', default:30 },
          { key:'status', label:'Status', type:'select', options:[{v:'1',l:'Active'},{v:'0',l:'Inactive'}], default:'1' },
        ]}
      />

      <MasterTable
        title="Invoice Type Master"
        sub="Rental Invoice, Security Deposit, Late Fee, Maintenance Charge"
        table="invoice_type_master"
        fields={[
          { key:'type_code', label:'Type Code', required:true, placeholder:'RENTAL' },
          { key:'type_name', label:'Type Name', required:true, placeholder:'Rental Invoice' },
          { key:'status', label:'Status', type:'select', options:[{v:'1',l:'Active'},{v:'0',l:'Inactive'}], default:'1' },
        ]}
      />

      <MasterTable
        title="Payment Mode Master"
        sub="Cash, Bank Transfer, UPI, Cheque, Card"
        table="payment_mode_master"
        fields={[
          { key:'mode_code', label:'Mode Code', required:true, placeholder:'UPI' },
          { key:'mode_name', label:'Mode Name', required:true, placeholder:'UPI' },
          { key:'status', label:'Status', type:'select', options:[{v:'1',l:'Active'},{v:'0',l:'Inactive'}], default:'1' },
        ]}
      />

      <MasterTable
        title="Roles Master"
        sub="Super Admin, Admin, Branch Manager, Sales Executive, Technician ..."
        table="roles"
        fields={[
          { key:'role_code',    label:'Role Code', required:true, placeholder:'BRANCH_MANAGER' },
          { key:'role_name',    label:'Role Name', required:true, placeholder:'Branch Manager' },
          { key:'description',  label:'Description', placeholder:'Role description' },
          { key:'status', label:'Status', type:'select', options:[{v:'1',l:'Active'},{v:'0',l:'Inactive'}], default:'1' },
        ]}
      />
    </div>
  );
}
