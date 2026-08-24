import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

export default function CreateUser() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    userType: '',
    owner: '',
    empId: '',
    password: '',
    userName: '',
    altMobile: '',
    mobileNo: '',
    emailId: '',
    status: '1',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userName || !form.password) {
      toast.error('User Name and Password are required.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message || 'User created successfully!');
        setForm({ userType:'', owner:'', empId:'', password:'', userName:'', altMobile:'', mobileNo:'', emailId:'', status:'1' });
      } else {
        toast.error(data.message || 'Failed to create user');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = { flex: 1, padding: '7px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', width: '100%' };
  const labelStyle = { flex: '0 0 38%', fontWeight: '500', fontSize: '13px' };
  const rowStyle   = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={20} /> Create New User
        </h1>
      </div>

      <div className="card" style={{ maxWidth: '960px', margin: '0 auto', padding: '30px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

            {/* Left Column */}
            <div>
              <div style={rowStyle}>
                <label style={labelStyle}>User Type</label>
                <select name="userType" value={form.userType} onChange={handleChange} style={fieldStyle}>
                  <option value="">-- Please Select --</option>
                  <option value="1">Admin (1)</option>
                  <option value="2">Manager (2)</option>
                  <option value="9">Standard User (9)</option>
                </select>
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Emp. ID</label>
                <input type="text" name="empId" value={form.empId} onChange={handleChange} style={fieldStyle} />
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>User Name</label>
                <input type="text" name="userName" value={form.userName} onChange={handleChange} required style={fieldStyle} />
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Mobile No.</label>
                <input type="text" name="mobileNo" value={form.mobileNo} onChange={handleChange} style={fieldStyle} />
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Email-Id</label>
                <input type="email" name="emailId" value={form.emailId} onChange={handleChange} style={fieldStyle} />
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Status</label>
                <select name="status" value={form.status} onChange={handleChange} style={fieldStyle}>
                  <option value="1">Activate</option>
                  <option value="0">Deactivate</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div style={rowStyle}>
                <label style={labelStyle}>Owner</label>
                <select name="owner" value={form.owner} onChange={handleChange} style={fieldStyle}>
                  <option value="">-- Please Select --</option>
                  <option value="Innovatiview">Innovatiview</option>
                  <option value="Vendor">Vendor</option>
                </select>
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required style={fieldStyle} />
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Alt. Mobile No.</label>
                <input type="text" name="altMobile" value={form.altMobile} onChange={handleChange} style={fieldStyle} />
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Profile Img.</label>
                <div style={{ flex: 1 }}>
                  <input type="file" accept="image/*" style={fieldStyle} disabled title="Image upload coming soon" />
                  <small style={{ color: 'red', fontSize: '11px' }}>Use (220px X 220px) Image Only</small>
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '9px 36px', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Creating...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
