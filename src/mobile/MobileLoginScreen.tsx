import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface MobileLoginScreenProps {
  mode: 'login' | 'signup';
  onGoogleLogin: () => Promise<void>;
  onEmailAuth: (email: string, password: string, displayName?: string) => Promise<{ error?: string; confirmMessage?: string }>;
  loading: boolean;
}

export function MobileLoginScreen({ mode, onGoogleLogin, onEmailAuth, loading }: MobileLoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegistering = mode === 'signup';

  const handleGoogle = async () => {
    setError('');
    try {
      await onGoogleLogin();
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isRegistering && !termsAccepted) {
      setError('Please agree to the Terms & Conditions');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setConfirmMessage('');
    try {
      const result = await onEmailAuth(email, password, isRegistering ? displayName : undefined);
      if (result?.error) setError(result.error);
      if (result?.confirmMessage) setConfirmMessage(result.confirmMessage);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <div className="m-login">
      <div className="m-login__safe-top" />

      <div className="m-login__content">
        {/* Logo + branding */}
        <div className="m-login__brand">
          <img src="/curlysports-logo.png" alt="Curly Sports" className="m-login__logo" />
          <h1 className="m-login__app-name">
            <span className="m-login__app-name--curly">Curly</span>
            <span className="m-login__app-name--sports">Sports</span>
          </h1>
          <p className="m-login__tagline">The Future of Sports Intelligence</p>
        </div>

        {/* Auth card */}
        <div className="m-login__card">
          <h2 className="m-login__title">
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h2>

          {isLoading ? (
            <div className="m-login__loading">
              <div className="m-login__spinner" />
              <p>Authenticating...</p>
            </div>
          ) : (
            <>
              {confirmMessage && (
                <div className="m-login__success">{confirmMessage}</div>
              )}
              {error && (
                <div className="m-login__error">
                  <span className="material-icons-round" style={{ fontSize: 16 }}>error_outline</span>
                  {error}
                </div>
              )}

              {/* Google button */}
              <button type="button" className="m-login__google" onClick={handleGoogle}>
                <img src="https://www.google.com/favicon.ico" alt="" width={18} height={18} />
                {isRegistering ? 'Sign up with Google' : 'Continue with Google'}
              </button>

              <div className="m-login__divider">
                <span>or</span>
              </div>

              {/* Email form */}
              <form onSubmit={handleSubmit} className="m-login__form">
                {isRegistering && (
                  <div className="m-login__field">
                    <label htmlFor="m-login-name">Name</label>
                    <input
                      id="m-login-name"
                      type="text"
                      placeholder="Your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                )}
                <div className="m-login__field">
                  <label htmlFor="m-login-email">Email</label>
                  <input
                    id="m-login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="m-login__field">
                  <label htmlFor="m-login-pass">Password</label>
                  <input
                    id="m-login-pass"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  />
                </div>

                {isRegistering && (
                  <label className="m-login__terms">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <span>I agree to the Terms & Conditions</span>
                  </label>
                )}

                <button
                  type="submit"
                  className="m-login__submit"
                  disabled={isRegistering && !termsAccepted}
                >
                  {isRegistering ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              <p className="m-login__switch">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                {' '}
                <Link to={isRegistering ? '/login' : '/signup'} className="m-login__switch-link">
                  {isRegistering ? 'Sign In' : 'Sign Up'}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
