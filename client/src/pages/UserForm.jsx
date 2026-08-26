import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, ArrowLeft, Save, Upload, X, User } from 'lucide-react';

const INIT_FORM = {
  userType: '',
  owner: '',
  empId: '',
  password: '',
  userName: '',
  altMobile: '',
  mobileNo: '',
  emailId: '',
  status: '1',
  profileImg: null,
};

export default function UserForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const editId = paramId || searchParams.get('id');

  const [form, setForm] = useState(INIT_FORM);
  const [imgPreview, setImgPreview] = useState(null);
  const [userTypes, setUserTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };

  useEffect(() => {
    // 1. Fetch User Types from usertype_master table
    fetch('/api/masters/usertype_master', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setUserTypes(data.data);
        }
      })
      .catch(() => console.error('Failed to load user types'));

    // 2. Fetch Locations from locations table
    fetch('/api/locations', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setLocations(data.data);
        }
      })
      .catch(() => console.error('Failed to load locations'));

    // 3. If editing, fetch existing user data
    if (editId) {
      setFetching(true);
      fetch('/api/users', { headers })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.data) {
            const u = data.data.find(x => String(x.id) === String(editId));
            if (u) {
              setForm({
                userType: String(u.utype ?? ''),
                owner: u.owner ?? '',
                empId: u.emp_id ?? '',
                password: '', // Blank unless changing
                userName: u.full_name ?? '',
                altMobile: u.alt_mobile ?? '',
                mobileNo: u.mobile ?? '',
                emailId: u.email ?? '',
                status: String(u.status ?? '1'),
                profileImg: u.profile_img || null,
              });
              if (u.profile_img) {
                setImgPreview(u.profile_img);
              }
            }
          }
        })
        .catch(() => toast.error('Failed to load user details'))
        .finally(() => setFetching(false));
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Image Selection & Base64 preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, JPEG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setImgPreview(base64);
      setForm(prev => ({ ...prev, profileImg: base64 }));
      toast.success('Image selected!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImgPreview(null);
    setForm(prev => ({ ...prev, profileImg: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userName) {
      toast.error('User Name is required.');
      return;
    }
    if (!editId && !form.password) {
      toast.error('Password is required for new users.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = editId ? `/api/users/${editId}` : '/api/users/create';
      const method   = editId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message || (editId ? 'User updated successfully!' : 'User created successfully!'));
        navigate('/admin/user-master');
      } else {
        toast.error(data.message || 'Failed to save user');
      }
    } catch (err) {
      toast.error('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = { flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', width: '100%', background: '#fff' };
  const labelStyle = { flex: '0 0 36%', fontWeight: '500', fontSize: '13px', color: '#334155' };
  const rowStyle   = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' };

  if (fetching) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: '#64748b' }}>Loading user details...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <UserPlus size={20} /> {editId ? `Edit User #${editId}` : 'Add New User'}
        </h1>
        <button
          onClick={() => navigate('/admin/user-master')}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
        >
          <ArrowLeft size={14} /> Back to Users List
        </button>
      </div>

      {/* Form Card */}
      <div className="card" style={{ maxWidth: '960px', margin: '0 auto', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

            {/* Left Column */}
            <div>
              {/* User Type from usertype_master */}
              <div style={rowStyle}>
                <label style={labelStyle}>User Type <span style={{ color: '#ef4444' }}>*</span></label>
                <select name="userType" value={form.userType} onChange={handleChange} required style={fieldStyle}>
                  <option value="">-- Select User Type --</option>
                  {userTypes
                    .filter(u => u.status !== 'D')
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.typename} {u.utype ? `(${u.utype})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Emp. ID</label>
                <input type="text" name="empId" value={form.empId} onChange={handleChange} style={fieldStyle} placeholder="e.g. EMP1001" />
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>User Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" name="userName" value={form.userName} onChange={handleChange} required style={fieldStyle} placeholder="Full Name" />
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Mobile No.</label>
                <input type="text" name="mobileNo" value={form.mobileNo} onChange={handleChange} style={fieldStyle} placeholder="10-digit mobile" />
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Email-Id</label>
                <input type="email" name="emailId" value={form.emailId} onChange={handleChange} style={fieldStyle} placeholder="name@company.com" />
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
              {/* Owner from locations table */}
              <div style={rowStyle}>
                <label style={labelStyle}>Owner (Location)</label>
                <select name="owner" value={form.owner} onChange={handleChange} style={fieldStyle}>
                  <option value="">-- Select Location / Owner --</option>
                  {locations
                    .filter(l => l.status === '1' || l.status === 1)
                    .map(l => (
                      <option key={l.id} value={l.location_name}>
                        {l.location_name} {l.city ? `(${l.city})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>
                  Password {editId ? <span style={{ fontSize: '11px', color: '#64748b' }}>(Keep blank if unchanged)</span> : <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required={!editId}
                  style={fieldStyle}
                  placeholder={editId ? '••••••••' : 'Enter password'}
                />
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Alt. Mobile No.</label>
                <input type="text" name="altMobile" value={form.altMobile} onChange={handleChange} style={fieldStyle} placeholder="Alternate contact" />
              </div>

              {/* Profile Image with Live Preview */}
              <div style={rowStyle}>
                <label style={labelStyle}>Profile Img.</label>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    {/* Thumbnail Preview */}
                    <div style={{
                      width: '54px', height: '54px', borderRadius: '8px', border: '1px solid #cbd5e1',
                      background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', flexShrink: 0
                    }}>
                      {imgPreview ? (
                        <img src={imgPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={26} color="#94a3b8" />
                      )}
                    </div>

                    {/* Choose file & Remove button */}
                    <div style={{ flex: 1 }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleImageChange}
                        style={{ fontSize: '12px', width: '100%' }}
                      />
                      {imgPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                            marginTop: '4px', fontSize: '11px', color: '#ef4444', background: 'none',
                            border: 'none', cursor: 'pointer', padding: 0
                          }}
                        >
                          <X size={12} /> Remove image
                        </button>
                      )}
                    </div>
                  </div>
                  <small style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Standard 220px × 220px (Max 5MB)</small>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'center' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 40px', fontSize: '14px', fontWeight: '600' }}
            >
              <Save size={15} />
              {loading ? 'Saving...' : (editId ? 'Update User' : 'Submit User')}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '10px 24px', fontSize: '14px' }}
              onClick={() => navigate('/admin/user-master')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
