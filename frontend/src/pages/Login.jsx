import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('admin@mil.local');
  const [password, setPassword] = useState('admin123');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, completeMfaLogin, mfaChallenge } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mfaChallenge?.mfaToken) {
        await completeMfaLogin(mfaCode);
        navigate('/dashboard');
        return;
      }

      const response = await login(email, password);
      if (response?.mfaRequired) {
        setError('Enter the MFA code from your authenticator app.');
        setMfaCode('');
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-grid-bg" />

      <section className="auth-card auth-hero">
        <div className="auth-hero-badge">SECURE OPERATIONS</div>
        <h1>Communication Monitoring System</h1>
        <p className="auth-copy">
          Enterprise-grade threat detection and real-time network intelligence. Monitor anomalies, analyze patterns, and respond to threats with precision.
        </p>

        <div className="auth-hero-stats">
          <div className="stat-card">
            <strong>Real-Time Analytics</strong>
            <span>Live traffic monitoring</span>
          </div>
          <div className="stat-card">
            <strong>Threat Detection</strong>
            <span>ML-powered anomalies</span>
          </div>
          <div className="stat-card">
            <strong>Network Visibility</strong>
            <span>Full packet inspection</span>
          </div>
        </div>

        <div className="auth-hero-footer">
          <p className="auth-footer-text">Trusted by security teams worldwide</p>
        </div>
      </section>

      <section className="auth-card auth-form-card auth-form-login">
        <div className="auth-form-header">
          <h2>Welcome Back</h2>
          <p>Enter your credentials to access the monitoring dashboard</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                id="password"
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {mfaChallenge?.mfaToken ? (
            <div className="form-group">
              <label htmlFor="mfaCode">MFA Code</label>
              <input
                id="mfaCode"
                className="input"
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                maxLength={6}
                required
              />
            </div>
          ) : null}

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <button
            className="btn-auth btn-auth-primary"
            disabled={loading}
            type="submit"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                {mfaChallenge?.mfaToken ? 'Verifying Code...' : 'Authenticating...'}
              </>
            ) : (
              mfaChallenge?.mfaToken ? 'Verify MFA' : 'Sign In'
            )}
          </button>
        </form>

        <div className="auth-form-divider">
          <span>New user?</span>
        </div>

        <Link to="/register" className="btn-auth btn-auth-secondary">
          Create Account
        </Link>

        <p className="auth-form-footer">Secure server • AES-256 encrypted • Multi-factor ready</p>
      </section>
    </main>
  );
}
