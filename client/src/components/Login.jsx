import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { HiOutlineSparkles, HiOutlineGlobe, HiOutlineUserGroup } from 'react-icons/hi';
import { authAPI } from '../api/auth';
import { setAuth } from '../utils/auth';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage] = useState(location.state?.message || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });

      setAuth(response.token, response.data, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {};


  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="floating-shape" />
        <div className="floating-shape" />
        <div className="floating-shape" />
        <div className="floating-shape" />
        <div className="auth-brand-content">
          <h1 className="auth-brand-logo">eventra</h1>
          <p className="auth-brand-tagline">
            Create unforgettable events. Connect with your audience. Make every moment count.
          </p>
          <div className="auth-brand-features">
            <div className="auth-brand-feature">
              <HiOutlineSparkles size={18} />
              <span>Smart event creation & management</span>
            </div>
            <div className="auth-brand-feature">
              <HiOutlineGlobe size={18} />
              <span>Reach audiences worldwide</span>
            </div>
            <div className="auth-brand-feature">
              <HiOutlineUserGroup size={18} />
              <span>Real-time collaboration tools</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <div className="auth-mobile-logo">eventra</div>
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-subtitle">Sign in to your account to continue</p>
          </div>

          {successMessage && (
            <div className="form-success">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.22 5.97l-3.5 3.5a.75.75 0 01-1.06 0l-1.5-1.5a.75.75 0 111.06-1.06l.97.97 2.97-2.97a.75.75 0 011.06 1.06z"/>
              </svg>
              {successMessage}
            </div>
          )}

          {error && (
            <div className="form-error">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V5zm.75 6.25a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
              </svg>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <div className="form-input-wrapper">
                <HiOutlineMail className="form-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="form-input-wrapper">
                <HiOutlineLockClosed className="form-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="form-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                </button>
              </div>
            </div>

            <div className="form-row">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="form-link">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              id="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="spinner" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">or continue with</span>
            <div className="auth-divider-line" />
          </div>

          <div className="auth-social-buttons">
            <button
              type="button"
              className="auth-social-btn auth-social-btn--google"
              onClick={handleGoogleLogin}
              id="google-login-btn"
            >
              <span className="auth-social-icon"><FcGoogle size={22} /></span>
              Continue with Google
            </button>
          </div>

          <div className="auth-footer">
            Don't have an account?
            <Link to="/register">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
