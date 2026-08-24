import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Pencil, Ban } from 'lucide-react';

/**
 * Generic Master Page Component
 * Props:
 *  - title: string
 *  - icon: JSX element
 *  - apiPath: string  (e.g. 'state_master')
 *  - fields: array of { name, label, type?, required?, options? }
 *  - columns: array of { key, label }
 */
export default function MasterPage({ title, icon, apiPath, fields, columns }) {
  const INIT = Object.fromEntries(fields.map(f => [f.name, f.default ?? '']));
  const [list, setList]     = useState([]);
  const [form, setForm]     = useState(INIT);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);

  const token = localStorage.getItem('token');
  const hdr   = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };
  const url   = `/api/masters/${apiPath}`;

  const fetchList = async () => {
    setFetching(true);
    try {
      const res  = await fetch(url, { headers: hdr });
      const data = await res.json();
      if (data.status === 'success') setList(data.data || []);
    } catch (e) { toast.error('Failed to load data'); }
    finally { setFetching(false); }
  };

  useEffect(() => { fetchList(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = editId ? 'PUT' : 'POST';
      const endpoint = editId ? `${url}/${editId}` : url;
      const res  = await fetch(endpoint, { method, headers: hdr, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message);
        setForm(INIT);
        setEditId(null);
        fetchList();
      } else {
        toast.error(data.message || 'Error');
      }
    } catch (e) { toast.error('Network error: ' + e.message); }
    finally { setLoading(false); }
  };

  const handleEdit = (row) => {
    const idKeys = ['sno','id'];
    const id = idKeys.map(k => row[k]).find(v => v != null);
    setEditId(id);
    const populated = {};
    fields.forEach(f => { populated[f.name] = row[f.name] ?? ''; });
    setForm(populated);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this record?')) return;
    try {
      const res  = await fetch(`${url}/${id}`, { method: 'DELETE', headers: hdr });
      const data = await res.json();
      if (data.status === 'success') { toast.success(data.message); fetchList(); }
      else toast.error(data.message);
    } catch (e) { toast.error('Network error'); }
  };

  const fs = { flex: 1, padding: '7px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', width: '100%' };
  const ls = { flex: '0 0 35%', fontWeight: '500', fontSize: '13px' };
  const rs = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon} {title}
        </h1>
      </div>

      {/* Form Card */}
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto 24px', padding: '28px' }}>
        <h3 style={{ marginBottom: '18px', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <Plus size={14} style={{ marginRight: '6px' }} />
          {editId ? `Edit Record #${editId}` : `Add New ${title}`}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: fields.length > 4 ? '1fr 1fr' : '1fr', gap: '0 30px' }}>
            {fields.map(f => (
              <div key={f.name} style={rs}>
                <label style={ls}>{f.label} {f.required && <span style={{ color: 'red' }}>*</span>}</label>
                {f.type === 'select' ? (
                  <select name={f.name} value={form[f.name]} onChange={handleChange} required={f.required} style={fs}>
                    <option value="">-- Select --</option>
                    {(f.options || []).map(o => (
                      <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
                    ))}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea name={f.name} value={form[f.name]} onChange={handleChange} required={f.required}
                    rows={3} style={{ ...fs, resize: 'vertical' }} />
                ) : (
                  <input type={f.type || 'text'} name={f.name} value={form[f.name]}
                    onChange={handleChange} required={f.required} style={fs} />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="submit" disabled={loading} className="btn btn-primary"
              style={{ padding: '8px 28px', fontSize: '13px' }}>
              {loading ? 'Saving...' : (editId ? 'Update' : 'Save')}
            </button>
            {editId && (
              <button type="button" className="btn btn-secondary"
                style={{ padding: '8px 20px', fontSize: '13px' }}
                onClick={() => { setEditId(null); setForm(INIT); }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Card */}
      <div className="card" style={{ maxWidth: '960px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '14px', margin: 0 }}>All Records ({list.length})</h3>
          <button onClick={fetchList} className="btn btn-secondary" style={{ fontSize: '12px', padding: '5px 12px' }}>
            <RefreshCw size={12} style={{ marginRight: '4px' }} /> Refresh
          </button>
        </div>
        {fetching ? <p style={{ textAlign: 'center', color: '#888' }}>Loading...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f5f7fa' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>#</th>
                  {columns.map(c => (
                    <th key={c.key} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                      {c.label}
                    </th>
                  ))}
                  <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={columns.length + 2} style={{ textAlign: 'center', padding: '20px', color: '#aaa' }}>
                    No records found
                  </td></tr>
                ) : list.map((row, i) => {
                  const idKeys = ['sno','id'];
                  const id = idKeys.map(k => row[k]).find(v => v != null);
                  return (
                    <tr key={id} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '8px 10px' }}>{i + 1}</td>
                      {columns.map(c => (
                        <td key={c.key} style={{ padding: '8px 10px' }}>
                          {c.key === 'status' ? (
                            <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px',
                              background: row[c.key] === '1' || row[c.key] === 'A' ? '#d4edda' : '#f8d7da',
                              color: row[c.key] === '1' || row[c.key] === 'A' ? '#155724' : '#721c24' }}>
                              {row[c.key] === '1' || row[c.key] === 'A' ? 'Active' : 'Inactive'}
                            </span>
                          ) : (row[c.key] ?? '—')}
                        </td>
                      ))}
                      <td style={{ padding: '8px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button onClick={() => handleEdit(row)} title="Edit"
                          style={{ background: 'none', border: '1px solid #007bff', borderRadius: '4px',
                            color: '#007bff', padding: '3px 8px', marginRight: '6px', cursor: 'pointer', fontSize: '12px' }}>
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => handleDeactivate(id)} title="Deactivate"
                          style={{ background: 'none', border: '1px solid #dc3545', borderRadius: '4px',
                            color: '#dc3545', padding: '3px 8px', cursor: 'pointer', fontSize: '12px' }}>
                          <Ban size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
