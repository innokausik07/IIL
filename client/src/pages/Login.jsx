import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn, Eye, EyeOff, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api/erpApi';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Please enter username and password.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(username, password);
      const { token, user } = res.data;
      login(token, user);
      toast.success(`Welcome back, ${user.userid}!`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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

        <h2 className="login-title">Sign In</h2>
        <p className="login-subtitle">Enter your credentials to access the portal</p>

        {error && (
          <div className="error-msg">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username / Email / Emp ID</label>
            <input
              id="login-username"
              type="text"
              className="form-control"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username, email or Emp ID"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
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
            id="login-submit"
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
              <><LogIn size={16} /> Sign In</>
            )}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13 }}>
          <span style={{ color: '#94a3b8' }}>Don't have an account? </span>
          <Link to="/signup" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
            Sign up here
          </Link>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 11 }}>
          <Database size={12} />
          Connected to MySQL · innovatiview_new
        </div>
      </div>
    </div>
  );
}
