import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, ArrowLeft, Save, Upload, X, User, Shield, CheckSquare, Square, Search, Lock } from 'lucide-react';

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
  plantId: '',
  departmentId: '',
  designationId: '',
  reportingManagerId: '',
};

export default function UserForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const editId = paramId || searchParams.get('id');

  const [form, setForm]                 = useState(INIT_FORM);
  const [imgPreview, setImgPreview]     = useState(null);
  const [userTypes, setUserTypes]       = useState([]);
  const [locations, setLocations]       = useState([]);
  const [designations, setDesignations] = useState([]);
  const [allUsers, setAllUsers]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [fetching, setFetching]         = useState(false);

  // Rights Modal State
  const [rightsModal, setRightsModal] = useState(false);
  const [rightsLoading, setRightsLoading] = useState(false);
  const [savingRights, setSavingRights] = useState(false);
  const [rightsData, setRightsData] = useState({ functions: [], subFunctions: [] });
  const [selectedSubIds, setSelectedSubIds] = useState(new Set());
  const [rightsSearch, setRightsSearch] = useState('');

  const token = localStorage.getItem('erp_token') || localStorage.getItem('token');
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
      .catch(() => {});

    // 2. Fetch Locations/Plants from locations table
    fetch('/api/locations', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setLocations(data.data.filter(l => l.status !== 'D'));
        }
      })
      .catch(() => {});

    // 3. Fetch Designations
    fetch('/api/masters/designation_master', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setDesignations(data.data.filter(d => d.status !== 'D'));
        }
      })
      .catch(() => {});

    // 4. Fetch Users for Reporting Manager dropdown
    fetch('/api/users', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setAllUsers(data.data.filter(u => u.status === '1' && (!editId || String(u.id) !== String(editId))));
        }
      })
      .catch(() => {});

    // 5. If editing, fetch existing user data
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
                plantId: String(u.plant_id || ''),
                departmentId: String(u.department_id || ''),
                designationId: String(u.designation_id || ''),
                reportingManagerId: String(u.reporting_manager_id || '')
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

    // 6. Auto-open rights if ?rights=1 in URL
    if (editId && searchParams.get('rights') === '1') {
      handleOpenRights();
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

  // Open Rights Modal & Fetch User's Module Rights
  const handleOpenRights = async () => {
    if (!editId) return;
    setRightsModal(true);
    setRightsLoading(true);
    try {
      const res = await fetch(`/api/users/${editId}/rights`, { headers });
      const data = await res.json();
      if (data.status === 'success') {
        setRightsData({
          functions: data.data.functions || [],
          subFunctions: data.data.subFunctions || []
        });
        setSelectedSubIds(new Set(data.data.assignedIds || []));
      } else {
        toast.error(data.message || 'Failed to load access rights');
      }
    } catch (err) {
      toast.error('Network error loading rights');
    } finally {
      setRightsLoading(false);
    }
  };

  // Toggle Single Sub-Function Right
  const toggleSubRight = (subId) => {
    setSelectedSubIds(prev => {
      const next = new Set(prev);
      if (next.has(subId)) {
        next.delete(subId);
      } else {
        next.add(subId);
      }
      return next;
    });
  };

  // Toggle All Sub-Functions in a Function (Module)
  const toggleFunctionGroup = (fnId, subList) => {
    const fnSubIds = subList.filter(s => s.function_id === fnId).map(s => s.id);
    const allSelected = fnSubIds.every(id => selectedSubIds.has(id));

    setSelectedSubIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        fnSubIds.forEach(id => next.delete(id));
      } else {
        fnSubIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  // Select / Deselect All Globally
  const handleSelectAllRights = (select) => {
    if (select) {
      const allIds = rightsData.subFunctions.map(s => s.id);
      setSelectedSubIds(new Set(allIds));
    } else {
      setSelectedSubIds(new Set());
    }
  };

  // Save Module Access Rights
  const handleSaveRights = async () => {
    setSavingRights(true);
    try {
      const res = await fetch(`/api/users/${editId}/rights`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ subFunctionIds: Array.from(selectedSubIds) })
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message || 'User rights updated successfully!');
        setRightsModal(false);
      } else {
        toast.error(data.message || 'Failed to update rights');
      }
    } catch (err) {
      toast.error('Network error saving rights');
    } finally {
      setSavingRights(false);
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
      <div className="page-body" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: '#64748b' }}>Loading user details...</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div className="topbar">
        <div>
          <span className="topbar-title">{editId ? `Edit User #${editId}` : 'Add New User'}</span>
          <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>
            {form.userName ? form.userName : 'User Form'}
          </span>
        </div>
        <div className="topbar-actions">
          <button
            onClick={() => navigate('/admin/user-master')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Back to Users List
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Form Card */}
        <div className="card" style={{ maxWidth: '980px', margin: '0 auto', padding: '32px', boxShadow: 'var(--shadow-sm)', borderRadius: '8px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

              {/* Left Column */}
              <div>
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
                <div style={rowStyle}>
                  <label style={labelStyle}>Assigned Plant / Hub</label>
                  <select name="plantId" value={form.plantId} onChange={handleChange} style={fieldStyle}>
                    <option value="">-- Select Plant / Warehouse Hub --</option>
                    {locations
                      .filter(l => l.status === '1' || l.status === 1)
                      .map(l => (
                        <option key={l.id} value={l.id}>
                          {l.location_name} {l.plant_code ? `(${l.plant_code})` : ''} {l.plant_type_name ? `• ${l.plant_type_name}` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>Designation (Position)</label>
                  <select name="designationId" value={form.designationId} onChange={handleChange} style={fieldStyle}>
                    <option value="">-- Select Designation --</option>
                    {designations.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.designation_name} ({d.designation_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>Reporting Manager</label>
                  <select name="reportingManagerId" value={form.reportingManagerId} onChange={handleChange} style={fieldStyle}>
                    <option value="">-- Select Reporting Manager --</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.emp_id || `USR_${u.id}`})
                      </option>
                    ))}
                  </select>
                </div>


                <div style={rowStyle}>
                  <label style={labelStyle}>
                    Password {editId ? <span style={{ fontSize: '11px', color: '#64748b' }}>(Blank if unchanged)</span> : <span style={{ color: '#ef4444' }}>*</span>}
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

            {/* ── Buttons Row (Matching Reference Portal) ─────────────── */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '8px 24px', fontSize: '13px', fontWeight: '600' }}
              >
                <Save size={14} />
                {loading ? 'Saving...' : (editId ? 'Update' : 'Create User')}
              </button>

              {/* Update Rights Button (Devsite Dedicated Rights Page) */}
              {editId && (
                <button
                  type="button"
                  onClick={() => navigate(`/admin/user-master/rights/${editId}`)}
                  className="btn"
                  style={{ background: '#1e293b', color: '#fff', padding: '8px 20px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Shield size={14} /> Update Rights
                </button>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '8px 20px', fontSize: '13px' }}
                onClick={() => navigate('/admin/user-master')}
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── 🛡️ Update Rights Modal (Module & Sub-Module Access Control) ─ */}
      {rightsModal && (
        <div className="modal-overlay" onClick={() => setRightsModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 840, width: '92%' }}>
            <div className="modal-header" style={{ background: '#1e293b', color: '#fff', padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="#60a5fa" />
                <h3 style={{ margin: 0, fontSize: '15px', color: '#fff' }}>
                  Module & Sub-Module Access Rights — <span style={{ color: '#93c5fd' }}>{form.userName}</span> ({form.empId || `USR_${editId}`})
                </h3>
              </div>
              <button className="modal-close" onClick={() => setRightsModal(false)} style={{ color: '#fff' }}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '20px' }}>
              {rightsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <div className="spinner" style={{ margin: '0 auto 10px', width: 24, height: 24 }}></div>
                  Loading access permissions...
                </div>
              ) : (
                <>
                  {/* Global Toolbar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSelectAllRights(true)}
                        style={{ fontSize: '12px' }}
                      >
                        <CheckSquare size={12} /> Select All Modules
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleSelectAllRights(false)}
                        style={{ fontSize: '12px' }}
                      >
                        <Square size={12} /> Deselect All
                      </button>
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                      Granted: <strong>{selectedSubIds.size}</strong> of {rightsData.subFunctions.length} sub-modules
                    </div>
                  </div>

                  {/* Function & Sub-Function Permission Accordion / Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {rightsData.functions.map(fn => {
                      const fnSubs = rightsData.subFunctions.filter(s => s.function_id === fn.function_id);
                      if (fnSubs.length === 0) return null;

                      const selectedInFn = fnSubs.filter(s => selectedSubIds.has(s.id)).length;
                      const isAllSelected = selectedInFn === fnSubs.length;
                      const isPartial = selectedInFn > 0 && selectedInFn < fnSubs.length;

                      return (
                        <div key={fn.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                          {/* Module Header */}
                          <div style={{
                            background: '#f8fafc', padding: '10px 14px', display: 'flex',
                            justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                checked={isAllSelected}
                                ref={el => { if (el) el.indeterminate = isPartial; }}
                                onChange={() => toggleFunctionGroup(fn.function_id, rightsData.subFunctions)}
                                style={{ width: '16px', height: '16px' }}
                              />
                              <strong style={{ fontSize: '13px', color: '#1e293b' }}>
                                {fn.function_name}
                              </strong>
                              <span style={{ fontSize: '11px', color: '#64748b', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                                {selectedInFn}/{fnSubs.length} granted
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleFunctionGroup(fn.function_id, rightsData.subFunctions)}
                              style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                            >
                              {isAllSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>

                          {/* Sub-Modules Grid */}
                          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', background: '#fff' }}>
                            {fnSubs.map(sub => {
                              const isChecked = selectedSubIds.has(sub.id);
                              return (
                                <label
                                  key={sub.id}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px',
                                    padding: '6px 10px', borderRadius: '6px', cursor: 'pointer',
                                    background: isChecked ? '#eff6ff' : '#f8fafc',
                                    border: isChecked ? '1px solid #bfdbfe' : '1px solid #f1f5f9',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleSubRight(sub.id)}
                                    style={{ width: '14px', height: '14px' }}
                                  />
                                  <span style={{ color: isChecked ? '#1e40af' : '#334155', fontWeight: isChecked ? '500' : 'normal' }}>
                                    {sub.sub_name}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRightsModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingRights || rightsLoading}
                className="btn btn-primary"
                onClick={handleSaveRights}
                style={{ padding: '8px 28px', fontSize: '13px', fontWeight: '600' }}
              >
                <Save size={14} /> {savingRights ? 'Saving...' : 'Save Rights'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
