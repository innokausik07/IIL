import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Plus, RefreshCw, ArrowLeft, Search, Pencil, Ban, CheckCircle2 } from 'lucide-react';

const INIT = {
  location_name: '', contact_person: '', department: '', designation: '',
  contact_no: '', contact_email: '', pan: '', gstin: '',
  pincode: '', city: '', state: '', address: '', status: '1'
};

export default function LocationMaster() {
  const [form, setForm]           = useState(INIT);
  const [locations, setLocations] = useState([]);
  const [editId, setEditId]       = useState(null);
  const [view, setView]           = useState('list'); // 'list' or 'form'
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(false);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };

  const fetchLocations = async () => {
    setFetching(true);
    try {
      const res  = await fetch('/api/locations', { headers });
      const data = await res.json();
      if (data.status === 'success') setLocations(data.data || []);
    } catch (e) { toast.error('Failed to load locations'); }
    finally { setFetching(false); }
  };

  useEffect(() => { fetchLocations(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNew = () => {
    setForm(INIT);
    setEditId(null);
    setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = editId ? `/api/locations/${editId}` : '/api/locations/create';
      const method   = editId ? 'PUT' : 'POST';

      const res  = await fetch(endpoint, { method, headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message || (editId ? 'Location updated successfully!' : 'Location created successfully!'));
        setForm(INIT);
        setEditId(null);
        setView('list');
        fetchLocations();
      } else {
        toast.error(data.message || 'Failed to save location');
      }
    } catch (e) { toast.error('Network error: ' + e.message); }
    finally { setLoading(false); }
  };

  const handleEdit = (loc) => {
    setEditId(loc.id);
    setForm({
      location_name: loc.location_name || '',
      contact_person: loc.contact_person || '',
      department: loc.department || '',
      designation: loc.designation || '',
      contact_no: loc.contact_no || '',
      contact_email: loc.contact_email || '',
      pan: loc.pan || '',
      gstin: loc.gstin || '',
      pincode: loc.pincode || '',
      city: loc.city || '',
      state: loc.state || '',
      address: loc.address || '',
      status: String(loc.status ?? '1')
    });
    setView('form');
  };

  const filteredLocations = locations.filter(loc => {
    if (statusFilter !== 'ALL' && String(loc.status ?? '1') !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (loc.location_name || '').toLowerCase().includes(q) ||
      (loc.city || '').toLowerCase().includes(q) ||
      (loc.state || '').toLowerCase().includes(q) ||
      (loc.contact_person || '').toLowerCase().includes(q) ||
      (loc.contact_no || '').toLowerCase().includes(q)
    );
  });

  const f = { flex: 1, padding: '7px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', width: '100%' };
  const l = { flex: '0 0 38%', fontWeight: '500', fontSize: '13px' };
  const r = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' };

  return (
    <div className="page-container">
      {/* Page Header with Add Button */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <MapPin size={20} /> Location Master
        </h1>

        {view === 'list' ? (
          <button
            onClick={handleAddNew}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '13px', borderRadius: '4px', fontWeight: '600' }}
          >
            <Plus size={15} /> Add Location
          </button>
        ) : (
          <button
            onClick={() => { setView('list'); setEditId(null); setForm(INIT); }}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
          >
            <ArrowLeft size={14} /> Back to Locations List
          </button>
        )}
      </div>

      {/* ─── View 1: List / Table View (Default) ───────────────── */}
      {view === 'list' && (
        <div className="card" style={{ maxWidth: '1080px', margin: '0 auto', padding: '20px' }}>
          {/* Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: '500' }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ padding: '5px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', background: '#fff' }}
                >
                  <option value="ALL">All Status</option>
                  <option value="1">Active Only</option>
                  <option value="0">Inactive Only</option>
                </select>
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '8px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search location, city, person..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: '5px 10px 5px 30px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', width: '220px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Total: <strong>{filteredLocations.length}</strong>
              </span>
              <button onClick={fetchLocations} className="btn btn-secondary" style={{ fontSize: '12px', padding: '5px 12px' }}>
                <RefreshCw size={12} className={fetching ? 'spin' : ''} style={{ marginRight: '4px' }} /> Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          {fetching ? (
            <p style={{ textAlign: 'center', padding: '24px', color: '#888' }}>Loading locations...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['#', 'Location Name', 'City', 'State', 'Contact Person', 'Contact No', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: h === 'Status' || h === 'Actions' ? 'center' : 'left', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '28px', color: '#94a3b8' }}>
                        No locations found
                      </td>
                    </tr>
                  ) : (
                    filteredLocations.map((loc, i) => (
                      <tr key={loc.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '9px 12px' }}>{i + 1}</td>
                        <td style={{ padding: '9px 12px', fontWeight: '600', color: '#1e293b' }}>{loc.location_name}</td>
                        <td style={{ padding: '9px 12px' }}>{loc.city}</td>
                        <td style={{ padding: '9px 12px' }}>{loc.state}</td>
                        <td style={{ padding: '9px 12px' }}>{loc.contact_person}</td>
                        <td style={{ padding: '9px 12px' }}>{loc.contact_no}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500',
                            background: loc.status === '1' ? '#d4edda' : '#f8d7da',
                            color: loc.status === '1' ? '#155724' : '#721c24'
                          }}>
                            {loc.status === '1' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => handleEdit(loc)}
                            title="Edit"
                            style={{
                              background: 'none', border: '1px solid #3b82f6', borderRadius: '4px',
                              color: '#3b82f6', padding: '3px 8px', marginRight: '6px', cursor: 'pointer', fontSize: '12px'
                            }}
                          >
                            <Pencil size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── View 2: Add / Edit Form ───────────────────────────── */}
      {view === 'form' && (
        <div className="card" style={{ maxWidth: '960px', margin: '0 auto 30px', padding: '30px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={15} /> {editId ? `Edit Location #${editId}` : 'Add New Location'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

              {/* Left */}
              <div>
                <div style={r}><label style={l}>Location Name <span style={{ color: 'red' }}>*</span></label>
                  <input name="location_name" value={form.location_name} onChange={handleChange} required style={f} /></div>

                <div style={r}><label style={l}>Location Status</label>
                  <select name="status" value={form.status} onChange={handleChange} style={f}>
                    <option value="1">Active</option><option value="0">Inactive</option>
                  </select></div>

                <div style={r}><label style={l}>Contact Person <span style={{ color: 'red' }}>*</span></label>
                  <input name="contact_person" value={form.contact_person} onChange={handleChange} required style={f} /></div>

                <div style={r}><label style={l}>Department</label>
                  <input name="department" value={form.department} onChange={handleChange} style={f} /></div>

                <div style={r}><label style={l}>Designation</label>
                  <input name="designation" value={form.designation} onChange={handleChange} style={f} /></div>

                <div style={r}><label style={l}>Contact No <span style={{ color: 'red' }}>*</span></label>
                  <input name="contact_no" value={form.contact_no} onChange={handleChange} required style={f} /></div>

                <div style={r}><label style={l}>Contact Email <span style={{ color: 'red' }}>*</span></label>
                  <input type="email" name="contact_email" value={form.contact_email} onChange={handleChange} required style={f} /></div>
              </div>

              {/* Right */}
              <div>
                <div style={r}><label style={l}>PAN</label>
                  <input name="pan" value={form.pan} onChange={handleChange} style={f} /></div>

                <div style={r}><label style={l}>GSTIN</label>
                  <input name="gstin" value={form.gstin} onChange={handleChange} style={f} /></div>

                <div style={r}><label style={l}>Pincode <span style={{ color: 'red' }}>*</span></label>
                  <input name="pincode" value={form.pincode} onChange={handleChange} required style={f} /></div>

                <div style={r}><label style={l}>City <span style={{ color: 'red' }}>*</span></label>
                  <input name="city" value={form.city} onChange={handleChange} required style={f} /></div>

                <div style={r}><label style={l}>State <span style={{ color: 'red' }}>*</span></label>
                  <input name="state" value={form.state} onChange={handleChange} required style={f} /></div>

                <div style={r}><label style={l}>Address <span style={{ color: 'red' }}>*</span></label>
                  <textarea name="address" value={form.address} onChange={handleChange} required rows={3}
                    style={{ ...f, resize: 'vertical' }} /></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
              <button type="submit" disabled={loading} className="btn btn-primary"
                style={{ padding: '9px 36px', fontSize: '14px' }}>
                {loading ? 'Saving...' : (editId ? 'Update Location' : 'Save Location')}
              </button>
              <button type="button" className="btn btn-secondary"
                style={{ padding: '9px 24px', fontSize: '14px' }}
                onClick={() => { setView('list'); setEditId(null); setForm(INIT); }}>
                Back to Locations List
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
