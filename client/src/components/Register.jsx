import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineUser } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { HiOutlineSparkles, HiOutlineGlobe, HiOutlineUserGroup } from 'react-icons/hi';
import { authAPI } from '../api/auth';
import './Auth.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      navigate('/login', {
        state: { message: 'Account created successfully! Please sign in.' }
      });
    } catch (err) {
      if (err.errors) {
        const errorMessages = [];
        for (const [field, fieldError] of Object.entries(err.errors)) {
          if (field === '_errors') continue;
          if (fieldError?._errors?.length) {
            errorMessages.push(fieldError._errors[0]);
          }
        }
        setError(errorMessages.length > 0 ? errorMessages.join('. ') : err.message);
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {};


  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, label: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Za-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', className: 'weak' };
    if (score <= 2) return { level: 2, label: 'Medium', className: 'medium' };
    return { level: 3, label: 'Strong', className: 'strong' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
            Join thousands of event organizers who trust Eventra to bring their vision to life.
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
            <h2 className="auth-form-title">Create an account</h2>
            <p className="auth-form-subtitle">Start your journey with Eventra today</p>
          </div>

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
              <label className="form-label" htmlFor="register-username">Username</label>
              <div className="form-input-wrapper">
                <HiOutlineUser className="form-input-icon" />
                <input
                  id="register-username"
                  type="text"
                  name="username"
                  className="form-input"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                  minLength={3}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-email">Email</label>
              <div className="form-input-wrapper">
                <HiOutlineMail className="form-input-icon" />
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-password">Password</label>
              <div className="form-input-wrapper">
                <HiOutlineLockClosed className="form-input-icon" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-input"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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
              {formData.password && (
                <>
                  <div className="password-strength">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`password-strength-bar ${i <= passwordStrength.level ? `active ${passwordStrength.className}` : ''}`}
                      />
                    ))}
                  </div>
                  <span className="password-strength-text">{passwordStrength.label} password</span>
                </>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-confirmPassword">Confirm Password</label>
              <div className="form-input-wrapper">
                <HiOutlineLockClosed className="form-input-icon" />
                <input
                  id="register-confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="form-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                </button>
              </div>
            </div>

            <label className="form-checkbox-label">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
              />
              I agree to the <Link to="/terms" className="form-link" style={{ marginLeft: '4px', marginRight: '4px' }}>Terms of Service</Link> and <Link to="/privacy" className="form-link" style={{ marginLeft: '4px' }}>Privacy Policy</Link>
            </label>

            <button
              type="submit"
              className="auth-submit-btn"
              id="register-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="spinner" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">or sign up with</span>
            <div className="auth-divider-line" />
          </div>

          <div className="auth-social-buttons">
            <button
              type="button"
              className="auth-social-btn auth-social-btn--google"
              onClick={handleGoogleSignup}
              id="google-signup-btn"
            >
              <span className="auth-social-icon"><FcGoogle size={22} /></span>
              Continue with Google
            </button>
          </div>

          <div className="auth-footer">
            Already have an account?
            <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
