import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import axios from 'axios';

// Ensure the frontend hits the correct API base URL
// When deployed on Plesk, this will typically just use relative path if served from the same domain
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CreateUser() {
  const [formData, setFormData] = useState({
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
  
  const [profileImg, setProfileImg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImg(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      // Append all form fields
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      // Append file
      if (profileImg) {
        data.append('profileImg', profileImg);
      }

      // Configure axios with the token for auth
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/users/create`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        toast.success(response.data.message || 'User created successfully!');
        // Reset form
        setFormData({
          userType: '', owner: '', empId: '', password: '',
          userName: '', altMobile: '', mobileNo: '', emailId: '', status: '1'
        });
        setProfileImg(null);
        // Clear file input manually
        document.getElementById('profileImgInput').value = '';
      } else {
        toast.error(response.data.message || 'Failed to create user');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Server error while creating user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><UserPlus className="inline-icon" /> Create New User</h1>
      </div>

      <div className="card p-6" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} className="form-grid">
          
          {/* Left Column */}
          <div className="form-column">
            <div className="form-group">
              <label>User Type</label>
              <select name="userType" value={formData.userType} onChange={handleChange} required className="form-control">
                <option value="">-- Please Select --</option>
                <option value="1">Admin (1)</option>
                <option value="2">Manager (2)</option>
                <option value="9">Standard User (9)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Emp. ID</label>
              <input type="text" name="empId" value={formData.empId} onChange={handleChange} required className="form-control" />
            </div>

            <div className="form-group">
              <label>User Name</label>
              <input type="text" name="userName" value={formData.userName} onChange={handleChange} required className="form-control" />
            </div>

            <div className="form-group">
              <label>Mobile No.</label>
              <input type="text" name="mobileNo" value={formData.mobileNo} onChange={handleChange} className="form-control" />
            </div>

            <div className="form-group">
              <label>Email-Id</label>
              <input type="email" name="emailId" value={formData.emailId} onChange={handleChange} className="form-control" />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="form-control">
                <option value="1">Activate</option>
                <option value="0">Deactivate</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="form-column">
            <div className="form-group">
              <label>Owner</label>
              <select name="owner" value={formData.owner} onChange={handleChange} className="form-control">
                <option value="">-- Please Select --</option>
                <option value="innovatiview">Innovatiview</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required className="form-control" />
            </div>

            <div className="form-group">
              <label>Alt. Mobile No.</label>
              <input type="text" name="altMobile" value={formData.altMobile} onChange={handleChange} className="form-control" />
            </div>

            <div className="form-group">
              <label>Profile Img.</label>
              <div>
                <input type="file" id="profileImgInput" accept="image/*" onChange={handleFileChange} className="form-control" />
                <small style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: 'red' }}>
                  Use (220px X 220px) Image Only
                </small>
              </div>
            </div>
          </div>
          
          <div className="form-actions" style={{ gridColumn: '1 / -1', marginTop: '20px', textAlign: 'center' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '10px 30px' }}>
              {loading ? 'Creating...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Quick CSS for layout matching */}
      <style>{`
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        .form-column {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .form-group {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .form-group label {
          flex: 0 0 30%;
          font-weight: 500;
          font-size: 14px;
        }
        .form-group > div {
           flex: 1;
        }
        .form-control {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          width: 100%;
        }
        @media (max-width: 768px) {
          .form-grid { grid-template-columns: 1fr; gap: 15px; }
        }
      `}</style>
    </div>
  );
}
