import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { UserPlus, Eye, EyeOff, Database } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axiosInstance.post('/auth/signup', { username, password, name });
      if (res.data.status === 'success') {
        toast.success('Signup successful! You can now log in.');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">IIL</div>
          <div className="logo-text">
            <h1>Innovatiview ERP</h1>
            <p>CCTV Audit Management System</p>
          </div>
        </div>

        <h2 className="login-title">Create Account</h2>
        <p className="login-subtitle">Register to access the ERP portal</p>

        {error && (
          <div className="error-msg">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sanjeev Kumar"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Choose a password"
                required
                style={{ paddingRight: '38px' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: 8, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: '#94a3b8', padding: 2
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? (
              <span className="loading-dots">
                <span /><span /><span />
              </span>
            ) : (
              <><UserPlus size={16} /> Sign Up</>
            )}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13 }}>
          <span style={{ color: '#94a3b8' }}>Already have an account? </span>
          <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
            Log in here
          </Link>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 11 }}>
          <Database size={12} />
          Connected to MySQL · innovatiview_2
        </div>
      </div>
    </div>
  );
}
