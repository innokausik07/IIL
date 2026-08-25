import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, ArrowLeft, Save } from 'lucide-react';

const INIT = {
  location_name: '', contact_person: '', department: '', designation: '',
  contact_no: '', contact_email: '', pan: '', gstin: '',
  pincode: '', city: '', state: '', address: '', status: '1'
};

export default function LocationForm() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const editId = paramId || searchParams.get('id');

  const [form, setForm]         = useState(INIT);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };

  useEffect(() => {
    if (editId) {
      setFetching(true);
      fetch('/api/locations', { headers })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.data) {
            const loc = data.data.find(x => String(x.id) === String(editId));
            if (loc) {
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
            }
          }
        })
        .catch(() => toast.error('Failed to load location details'))
        .finally(() => setFetching(false));
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
        navigate('/admin/location-master');
      } else {
        toast.error(data.message || 'Failed to save location');
      }
    } catch (e) { toast.error('Network error: ' + e.message); }
    finally { setLoading(false); }
  };

  const f = { flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', width: '100%', background: '#fff' };
  const l = { flex: '0 0 38%', fontWeight: '500', fontSize: '13px', color: '#334155' };
  const r = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' };

  if (fetching) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: '#64748b' }}>Loading location details...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <MapPin size={20} /> {editId ? `Edit Location #${editId}` : 'Add New Location'}
        </h1>
        <button
          onClick={() => navigate('/admin/location-master')}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
        >
          <ArrowLeft size={14} /> Back to Locations List
        </button>
      </div>

      {/* Form Card */}
      <div className="card" style={{ maxWidth: '960px', margin: '0 auto 30px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

            {/* Left */}
            <div>
              <div style={r}><label style={l}>Location Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input name="location_name" value={form.location_name} onChange={handleChange} required style={f} /></div>

              <div style={r}><label style={l}>Location Status</label>
                <select name="status" value={form.status} onChange={handleChange} style={f}>
                  <option value="1">Active</option><option value="0">Inactive</option>
                </select></div>

              <div style={r}><label style={l}>Contact Person <span style={{ color: '#ef4444' }}>*</span></label>
                <input name="contact_person" value={form.contact_person} onChange={handleChange} required style={f} /></div>

              <div style={r}><label style={l}>Department</label>
                <input name="department" value={form.department} onChange={handleChange} style={f} /></div>

              <div style={r}><label style={l}>Designation</label>
                <input name="designation" value={form.designation} onChange={handleChange} style={f} /></div>

              <div style={r}><label style={l}>Contact No <span style={{ color: '#ef4444' }}>*</span></label>
                <input name="contact_no" value={form.contact_no} onChange={handleChange} required style={f} /></div>

              <div style={r}><label style={l}>Contact Email <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="email" name="contact_email" value={form.contact_email} onChange={handleChange} required style={f} /></div>
            </div>

            {/* Right */}
            <div>
              <div style={r}><label style={l}>PAN</label>
                <input name="pan" value={form.pan} onChange={handleChange} style={f} /></div>

              <div style={r}><label style={l}>GSTIN</label>
                <input name="gstin" value={form.gstin} onChange={handleChange} style={f} /></div>

              <div style={r}><label style={l}>Pincode <span style={{ color: '#ef4444' }}>*</span></label>
                <input name="pincode" value={form.pincode} onChange={handleChange} required style={f} /></div>

              <div style={r}><label style={l}>City <span style={{ color: '#ef4444' }}>*</span></label>
                <input name="city" value={form.city} onChange={handleChange} required style={f} /></div>

              <div style={r}><label style={l}>State <span style={{ color: '#ef4444' }}>*</span></label>
                <input name="state" value={form.state} onChange={handleChange} required style={f} /></div>

              <div style={r}><label style={l}>Address <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea name="address" value={form.address} onChange={handleChange} required rows={3}
                  style={{ ...f, resize: 'vertical' }} /></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'center' }}>
            <button type="submit" disabled={loading} className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 40px', fontSize: '14px', fontWeight: '600' }}>
              <Save size={15} />
              {loading ? 'Saving...' : (editId ? 'Update Location' : 'Save Location')}
            </button>
            <button type="button" className="btn btn-secondary"
              style={{ padding: '10px 24px', fontSize: '14px' }}
              onClick={() => navigate('/admin/location-master')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
