import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/auth-context';
import { useNavigate, Link } from 'react-router-dom';
import '../assets/css/Auth.css';

const Login = () => {
  const { login, error: loginError, loading } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    
    if (!username.trim() || !password.trim()) {
      setErr("Please fill in all fields");
      return;
    }

    try {
      const success = await login(username, password);
      if (success?.user?.role === 'HR') navigate('/dashboard');
      if (success?.user?.role === 'USER') navigate('/employee-dashboard');
      if (success?.user?.role === 'MANAGER') navigate('/manager-dashboard');
    } catch (error) {
      setErr(error.message || "Could not log in");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="bg-pattern"></div>
        <div className="bg-overlay"></div>
      </div>

      <div className="auth-content">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="brand-content">
            <div className="brand-logo">
              <div className="logo-icon">PM</div>
              <div className="logo-text">
                <h1>ProjectFlow</h1>
                <p>Management Suite</p>
              </div>
            </div>
            
            <div className="brand-features">
              <div className="feature-item">
                <div className="feature-icon">🚀</div>
                <div className="feature-text">
                  <h3>Boost Productivity</h3>
                  <p>Streamline your project workflows</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">👥</div>
                <div className="feature-text">
                  <h3>Team Collaboration</h3>
                  <p>Work together seamlessly</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <div className="feature-text">
                  <h3>Real-time Analytics</h3>
                  <p>Track progress and performance</p>
                </div>
              </div>
            </div>

            <div className="brand-testimonial">
              <div className="testimonial-quote">
                "ProjectFlow has transformed how we manage our projects and teams. Highly recommended!"
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">JD</div>
                <div className="author-info">
                  <span className="author-name">John Doe</span>
                  <span className="author-role">Project Manager</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="auth-form-container">
          <div className="auth-form-content">
            <div className="form-header">
              <div className="form-logo">
                <div className="form-logo-icon">PM</div>
                <span>ProjectFlow</span>
              </div>
              <h2>Welcome Back!</h2>
              <p>Please sign in to your account to continue</p>
            </div>

            {/* Error Messages */}
            {(err || loginError) && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <span>{err || loginError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="username">Username or Email</label>
                <div className="input-wrapper">
                  <div className="input-icon">👤</div>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username or email"
                    className="form-input"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <div className="input-icon">🔒</div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="form-input"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-wrapper">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <div className="btn-arrow">→</div>
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="auth-link">
                  Create Account
                </Link>
              </p>
            </div>

            <div className="security-note">
              <div className="security-icon">🔐</div>
              <span>Your data is protected with enterprise-grade security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
