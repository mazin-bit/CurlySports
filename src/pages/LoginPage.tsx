// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { signInWithGoogle, signUpWithEmail, signInWithEmail } from '../services/auth';
import PublicHeader from '../components/public/PublicHeader';

const LoginPage = ({ mode = 'login', isAuthenticated = false, homeTheme = 'light', setHomeTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isRegistering, setIsRegistering] = useState(mode === 'signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsRegistering(mode === 'signup');
    setError('');
  }, [mode]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await signInWithGoogle();
      if (authError) {
        setError(authError.message || 'Sign-in failed. Try again.');
      }
      // Supabase OAuth redirects, so loading state persists until redirect
    } catch (err) {
      setError(err.message || 'Sign-in failed. Try again.');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isRegistering && !termsAccepted) {
      setError('Please agree to the Terms & Conditions to create an account.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        const { error: authError } = await signUpWithEmail(email, password);
        if (authError) throw authError;
      } else {
        const { error: authError } = await signInWithEmail(email, password);
        if (authError) throw authError;
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('User not found') || msg.includes('Invalid login')) {
        setError(isRegistering
          ? "This email may already be registered. Try signing in instead."
          : "Invalid email or password. Check your credentials and try again."
        );
      } else if (msg.includes('Email rate limit')) {
        setError("Too many attempts. Wait a few minutes and try again.");
      } else {
        setError(msg || "Sign-in failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`public-auth-shell public-auth-shell--curly ${homeTheme === 'dark' ? 'public-home--dark' : ''}`}>
      {/* Same background as homepage: waves + gradient */}
      <div className="home-waves-bg" aria-hidden="true">
        <div className="home-waves-bg-track">
          <svg className="home-waves-bg-svg" viewBox="0 0 2400 800" preserveAspectRatio="xMidYMax slice">
            <defs>
              <linearGradient id="login-page-wave-deep" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="login-page-wave-mid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="login-page-wave-light" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="login-page-wave-foam" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path fill="url(#login-page-wave-deep)" className="home-wave-layer home-wave-layer--1" d="M0,400 Q300,350 600,400 T1200,400 T1800,400 T2400,400 L2400,800 L0,800 Z" />
            <path fill="url(#login-page-wave-deep)" className="home-wave-layer home-wave-layer--1b" d="M0,450 Q300,500 600,450 T1200,450 T1800,450 T2400,450 L2400,800 L0,800 Z" />
            <path fill="url(#login-page-wave-mid)" className="home-wave-layer home-wave-layer--2" d="M0,500 Q200,440 400,500 T800,500 T1200,500 T1600,500 T2000,500 T2400,500 L2400,800 L0,800 Z" />
            <path fill="url(#login-page-wave-mid)" className="home-wave-layer home-wave-layer--2b" d="M0,550 Q200,610 400,550 T800,550 T1200,550 T1600,550 T2000,550 T2400,550 L2400,800 L0,800 Z" />
            <path fill="url(#login-page-wave-light)" className="home-wave-layer home-wave-layer--3" d="M0,600 Q150,550 300,600 T600,600 T900,600 T1200,600 T1500,600 T1800,600 T2100,600 T2400,600 L2400,800 L0,800 Z" />
            <path fill="url(#login-page-wave-light)" className="home-wave-layer home-wave-layer--3b" d="M0,650 Q150,700 300,650 T600,650 T900,650 T1200,650 T1500,650 T1800,650 T2100,650 T2400,650 L2400,800 L0,800 Z" />
            <path fill="url(#login-page-wave-foam)" className="home-wave-layer home-wave-layer--4" d="M0,350 Q400,280 800,350 T1200,350 T2000,350 T2400,350 L2400,800 L0,800 Z" />
          </svg>
        </div>
      </div>

      <PublicHeader isAuthenticated={isAuthenticated} homeTheme={homeTheme} setHomeTheme={setHomeTheme} minimal />
      <div className="login-page login-page--curly" role="main" aria-label={isRegistering ? 'Create account' : 'Sign in'}>
        <div className="login-layout login-layout--curly">
          <div className="login-card-curly-wrap">
            <img src={`/login-avatar.png`} alt="" className="login-avatar-peek" aria-hidden="true" />
            <div className="login-card-curly">
              <h1 className="login-card-title login-card-title--split">
                <span className="login-card-title-curly">Curly</span>
                <span className="login-card-title-sports">Sports</span>
              </h1>
              <header className="login-form-header">
                <h2 className="login-form-title">{isRegistering ? 'Create an account' : 'Welcome Back!'}</h2>
              </header>

              {loading ? (
                <div className="login-loading" aria-live="polite" aria-busy="true">
                  <div className="loader" aria-hidden="true" />
                  <p>Authenticating...</p>
                </div>
              ) : (
                <div className="login-body">
                  {error && (
                    <div className="auth-error-msg" role="alert" aria-live="assertive">
                      <span className="material-icons-round" aria-hidden="true">error_outline</span>
                      {error}
                    </div>
                  )}

                  <div className="social-auth-grid">
                    <button type="button" className="google-auth-btn google-auth-btn--curly" onClick={handleGoogleLogin}>
                      <span className="social-icon-box">
                        <img loading="lazy" decoding="async" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" />
                      </span>
                      {isRegistering ? 'Sign up with Google' : 'Continue with Google'}
                    </button>
                  </div>

                  <div className="auth-divider">
                    <span>{isRegistering ? 'Or sign up with email' : 'Or continue with email'}</span>
                  </div>

                  <form onSubmit={handleEmailAuth} className="email-auth-form">
                    {isRegistering && (
                      <div className="login-field-wrap">
                        <label className="login-field-label" htmlFor="login-display-name">Display name</label>
                        <div className="input-group-pro input-group-pro--curly">
                          <span className="material-icons-round" aria-hidden="true">person</span>
                          <input
                            id="login-display-name"
                            type="text"
                            placeholder="Display name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            autoComplete="name"
                            aria-label="Display name"
                          />
                        </div>
                      </div>
                    )}
                    <div className="login-field-wrap">
                      <label className="login-field-label" htmlFor="login-email">Email</label>
                      <div className="input-group-pro input-group-pro--curly">
                        <span className="material-icons-round" aria-hidden="true">email</span>
                        <input
                          id="login-email"
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          aria-label="Email"
                        />
                      </div>
                    </div>
                    <div className="login-field-wrap">
                      <label className="login-field-label" htmlFor="login-password">Password</label>
                      <div className="input-group-pro input-group-pro--curly">
                        <span className="material-icons-round" aria-hidden="true">lock</span>
                        <input
                          id="login-password"
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete={isRegistering ? 'new-password' : 'current-password'}
                          aria-label="Password"
                        />
                      </div>
                    </div>
                    {isRegistering && (
                      <label className="login-terms">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          aria-label="I agree to the Terms & Conditions"
                        />
                        <span>I agree to the Terms & Conditions</span>
                      </label>
                    )}
                    <button type="submit" className="login-main-btn login-main-btn--curly" disabled={isRegistering && !termsAccepted}>
                      {isRegistering ? 'Create account' : 'Sign in'}
                    </button>
                    <p className="login-form-switch">
                      {isRegistering ? 'Already have an account?' : 'Don\'t have an account?'}
                      {' '}
                      <Link to={isRegistering ? '/login' : '/signup'} className="login-form-switch-btn" onClick={() => setError('')}>
                        {isRegistering ? 'Sign in' : 'Sign up'}
                      </Link>
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { LoginPage };
export default LoginPage;
