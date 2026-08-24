import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Plus, RefreshCw } from 'lucide-react';

const INIT = {
  location_name: '', contact_person: '', department: '', designation: '',
  contact_no: '', contact_email: '', pan: '', gstin: '',
  pincode: '', city: '', state: '', address: '', status: '1'
};

export default function LocationMaster() {
  const [form, setForm]       = useState(INIT);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res  = await fetch('/api/locations/create', { method: 'POST', headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success('Location created successfully!');
        setForm(INIT);
        fetchLocations();
      } else {
        toast.error(data.message || 'Failed to create location');
      }
    } catch (e) { toast.error('Network error: ' + e.message); }
    finally { setLoading(false); }
  };

  const f = { flex: 1, padding: '7px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', width: '100%' };
  const l = { flex: '0 0 38%', fontWeight: '500', fontSize: '13px' };
  const r = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={20} /> Location Master
        </h1>
      </div>

      {/* Form */}
      <div className="card" style={{ maxWidth: '960px', margin: '0 auto 30px', padding: '30px' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <Plus size={15} style={{ marginRight: '6px' }} /> Add New Location
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

            {/* Left */}
            <div>
              <div style={r}><label style={l}>Location Name <span style={{color:'red'}}>*</span></label>
                <input name="location_name" value={form.location_name} onChange={handleChange} required style={f} /></div>

              <div style={r}><label style={l}>Location Status</label>
                <select name="status" value={form.status} onChange={handleChange} style={f}>
                  <option value="1">Active</option><option value="0">Inactive</option>
                </select></div>

              <div style={r}><label style={l}>Contact Person <span style={{color:'red'}}>*</span></label>
                <input name="contact_person" value={form.contact_person} onChange={handleChange} required style={f} /></div>

              <div style={r}><label style={l}>Department</label>
                <input name="department" value={form.department} onChange={handleChange} style={f} /></div>

              <div style={r}><label style={l}>Designation</label>
                <input name="designation" value={form.designation} onChange={handleChange} style={f} /></div>

              <div style={r}><label style={l}>Contact No <span style={{color:'red'}}>*</span></label>
                <input name="contact_no" value={form.contact_no} onChange={handleChange} required style={f} /></div>

              <div style={r}><label style={l}>Contact Email <span style={{color:'red'}}>*</span></label>
                <input type="email" name="contact_email" value={form.contact_email} onChange={handleChange} required style={f} /></div>
            </div>

            {/* Right */}
            <div>
              <div style={r}><label style={l}>PAN</label>
                <input name="pan" value={form.pan} onChange={handleChange} style={f} /></div>

              <div style={r}><label style={l}>GSTIN</label>
                <input name="gstin" value={form.gstin} onChange={handleChange} style={f} /></div>

              <div style={r}><label style={l}>Pincode <span style={{color:'red'}}>*</span></label>
                <input name="pincode" value={form.pincode} onChange={handleChange} required style={f} /></div>

              <div style={r}><label style={l}>City <span style={{color:'red'}}>*</span></label>
                <input name="city" value={form.city} onChange={handleChange} required style={f} /></div>

              <div style={r}><label style={l}>State <span style={{color:'red'}}>*</span></label>
                <input name="state" value={form.state} onChange={handleChange} required style={f} /></div>

              <div style={r}><label style={l}>Address <span style={{color:'red'}}>*</span></label>
                <textarea name="address" value={form.address} onChange={handleChange} required rows={3}
                  style={{ ...f, resize: 'vertical' }} /></div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button type="submit" disabled={loading} className="btn btn-primary"
              style={{ padding: '9px 36px', fontSize: '14px' }}>
              {loading ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card" style={{ maxWidth: '960px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', margin: 0 }}>All Locations</h3>
          <button onClick={fetchLocations} className="btn btn-secondary" style={{ fontSize: '12px', padding: '5px 12px' }}>
            <RefreshCw size={13} style={{ marginRight: '4px' }} /> Refresh
          </button>
        </div>
        {fetching ? <p style={{ textAlign: 'center', color: '#888' }}>Loading...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  {['#','Location Name','City','State','Contact Person','Contact No','Status'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #ddd', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {locations.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#aaa' }}>No locations added yet</td></tr>
                ) : locations.map((loc, i) => (
                  <tr key={loc.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px 10px' }}>{i + 1}</td>
                    <td style={{ padding: '8px 10px' }}>{loc.location_name}</td>
                    <td style={{ padding: '8px 10px' }}>{loc.city}</td>
                    <td style={{ padding: '8px 10px' }}>{loc.state}</td>
                    <td style={{ padding: '8px 10px' }}>{loc.contact_person}</td>
                    <td style={{ padding: '8px 10px' }}>{loc.contact_no}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px',
                        background: loc.status === '1' ? '#d4edda' : '#f8d7da',
                        color: loc.status === '1' ? '#155724' : '#721c24' }}>
                        {loc.status === '1' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
