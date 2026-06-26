'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import Icon from './ui/Icon';

type Mode = 'login' | 'signup' | 'forgot';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  background: 'var(--surface)',
  border: '2px solid var(--ink)',
  borderRadius: 10,
  fontFamily: 'var(--body)',
  fontSize: 14,
  color: 'var(--ink)',
  outline: 'none',
  boxSizing: 'border-box',
  display: 'block',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-mute)',
  display: 'block',
  marginBottom: 6,
};

/* ── OTP verification screen (mobile) ───────────────────────── */
function OtpVerifyScreen() {
  const { verificationEmail, verifyOtp, resendOtp, cancelVerification } = useAuth();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setTimeLeft(600);
    const interval = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(interval); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { otpRefs.current[0]?.focus(); }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleChange = (i: number, v: string) => {
    if (v && !/^\d$/.test(v)) return;
    const next = [...otp]; next[i] = v; setOtp(next); setOtpError(null);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!p) return;
    const next = [...otp]; for (let i = 0; i < 6; i++) next[i] = p[i] || '';
    setOtp(next);
    const empty = next.findIndex(d => !d);
    otpRefs.current[empty >= 0 ? empty : 5]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;
    setVerifying(true); setOtpError(null);
    try { await verifyOtp(code); }
    catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Verification failed.');
      setOtp(['', '', '', '', '', '']); otpRefs.current[0]?.focus();
    } finally { setVerifying(false); }
  };

  const handleResend = async () => {
    setResending(true); setOtpError(null);
    try { await resendOtp(); setOtp(['', '', '', '', '', '']); otpRefs.current[0]?.focus(); setTimeLeft(600); }
    catch (err: unknown) { setOtpError(err instanceof Error ? err.message : 'Failed to resend.'); }
    finally { setResending(false); }
  };

  const otpInputStyle: React.CSSProperties = {
    width: 44, height: 52, background: 'var(--surface)', border: '2px solid var(--ink)',
    borderRadius: 10, fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 800,
    textAlign: 'center', color: 'var(--ink)', outline: 'none', caretColor: 'var(--orange)',
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', padding: '0 24px', overflowY: 'auto' }}>
      <div style={{ paddingTop: 60, paddingBottom: 20 }}>
        <div style={{ width: 72, height: 72, background: 'var(--lime)', borderRadius: 18, border: '2.5px solid var(--ink)', boxShadow: '5px 5px 0 var(--ink)', transform: 'rotate(-6deg)', display: 'grid', placeItems: 'center', overflow: 'hidden', marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/curly-guy.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange)' }}>verify email</div>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', color: 'var(--ink)', margin: '6px 0 8px', lineHeight: 1.1 }}>
          Enter your code.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
          We sent a 6-digit code to <strong style={{ color: 'var(--ink)' }}>{verificationEmail}</strong>.
        </p>
      </div>

      {/* OTP inputs */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0 12px' }}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => { otpRefs.current[i] = el; }}
            style={otpInputStyle}
            type="text" inputMode="numeric" pattern="[0-9]" maxLength={1}
            value={digit} placeholder="-"
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            onPaste={handlePaste}
          />
        ))}
      </div>

      <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-mute)', letterSpacing: '0.06em', marginBottom: 16 }}>
        {timeLeft > 0 ? <>Code expires in <span style={{ color: 'var(--orange)' }}>{fmt(timeLeft)}</span></> : <span style={{ color: 'var(--coral)' }}>Code expired</span>}
      </div>

      {otpError && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--surface)', border: '2px solid var(--coral)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
          <Icon name="close" size={14} style={{ flexShrink: 0, color: 'var(--coral)', marginTop: 1 }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--coral)', lineHeight: 1.4 }}>{otpError}</span>
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={verifying || otp.join('').length < 6}
        style={{
          padding: '14px 0', background: (verifying || otp.join('').length < 6) ? 'var(--surface-3)' : 'var(--ink)',
          border: '2px solid var(--ink)', borderRadius: 12, fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
          letterSpacing: '0.04em', color: (verifying || otp.join('').length < 6) ? 'var(--text-mute)' : 'var(--accent)',
          cursor: (verifying || otp.join('').length < 6) ? 'not-allowed' : 'pointer',
          boxShadow: (verifying || otp.join('').length < 6) ? 'none' : '3px 3px 0 var(--accent)', transition: 'all .12s',
        }}
      >
        {verifying ? 'Verifying...' : 'Verify Code'}
      </button>

      {/* Resend */}
      <div style={{ background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 16 }}>
        <div style={{ width: 36, height: 36, background: 'var(--lime)', borderRadius: 10, border: '2px solid var(--ink)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="bell" size={16} />
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
          Didn&apos;t get the code? Check spam, or{' '}
          <button
            onClick={handleResend}
            disabled={resending}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--orange)', fontFamily: 'var(--body)', fontSize: 13, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
          >
            {resending ? 'sending...' : 'resend code'}
          </button>.
        </p>
      </div>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button
          onClick={cancelVerification}
          style={{ background: 'none', border: 'none', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-mute)', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          Back to sign in
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 32 }} />
      <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)', letterSpacing: '0.06em', paddingBottom: 32 }}>
        CURLYSPORTS.COM · MADE IN A BEDROOM
      </div>
    </div>
  );
}

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const { login, signup, authError, clearAuthError, needsVerification } = useAuth();

  const switchMode = (m: Mode) => {
    clearAuthError();
    setForgotError(null);
    setForgotSent(false);
    setMode(m);
    setEmail('');
    setPassword('');
    setUsername('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await signup(email.trim(), password, username.trim());
      }
    } catch {
      // error state already set in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setSubmitting(true);
    try {
      const nextPath = encodeURIComponent('/reset-password?mobile=1');
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          redirectTo: `${window.location.origin}/auth/callback?next=${nextPath}`,
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to send reset link.');
      setForgotSent(true);
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── OTP verification screen ───────────────────────────────────
  if (needsVerification) return <OtpVerifyScreen />;

  // ── Forgot: email sent confirmation ──────────────────────────
  if (mode === 'forgot' && forgotSent) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', padding: '0 24px', overflowY: 'auto' }}>
        <div style={{ paddingTop: 60, paddingBottom: 28 }}>
          <div style={{ width: 72, height: 72, background: 'var(--lime)', borderRadius: 18, border: '2.5px solid var(--ink)', boxShadow: '5px 5px 0 var(--ink)', transform: 'rotate(-6deg)', display: 'grid', placeItems: 'center', overflow: 'hidden', marginBottom: 24 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/curly-guy.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange)' }}>curlysports.com</div>
          <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', color: 'var(--ink)', margin: '6px 0 8px', lineHeight: 1.1 }}>
            Check your inbox.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
            We sent a password reset link to <strong style={{ color: 'var(--ink)' }}>{email}</strong>. Click it to set a new password.
          </p>
        </div>

        <div style={{ background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 14, padding: '18px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 40, height: 40, background: 'var(--lime)', borderRadius: 10, border: '2px solid var(--ink)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="bell" size={18} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em', marginBottom: 4 }}>DIDN'T GET IT?</div>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
              Check your spam folder, or{' '}
              <button
                onClick={() => { setForgotSent(false); setEmail(''); }}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--orange)', fontFamily: 'var(--body)', fontSize: 13, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
              >
                try again
              </button>.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => switchMode('login')}
            style={{ width: '100%', padding: '14px 0', background: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 12, fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--accent)', cursor: 'pointer', boxShadow: '3px 3px 0 var(--accent)' }}
          >
            Back to sign in
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 32 }} />
        <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)', letterSpacing: '0.06em', paddingBottom: 32 }}>
          CURLYSPORTS.COM · MADE IN A BEDROOM
        </div>
      </div>
    );
  }

  // ── Forgot password form ──────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', padding: '0 24px', overflowY: 'auto' }}>
        <div style={{ paddingTop: 60, paddingBottom: 28 }}>
          <div style={{ width: 72, height: 72, background: 'var(--lime)', borderRadius: 18, border: '2.5px solid var(--ink)', boxShadow: '5px 5px 0 var(--ink)', transform: 'rotate(-6deg)', display: 'grid', placeItems: 'center', overflow: 'hidden', marginBottom: 24 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/curly-guy.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange)' }}>curlysports.com</div>
          <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', color: 'var(--ink)', margin: '6px 0 8px', lineHeight: 1.1 }}>
            Reset your password.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
            Enter your email and we'll send you a link to set a new password.
          </p>
        </div>

        <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          {forgotError && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--surface)', border: '2px solid var(--coral)', borderRadius: 10, padding: '10px 12px' }}>
              <Icon name="close" size={14} style={{ flexShrink: 0, color: 'var(--coral)', marginTop: 1 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--coral)', lineHeight: 1.4 }}>{forgotError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ marginTop: 2, padding: '14px 0', background: submitting ? 'var(--surface-3)' : 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 12, fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: submitting ? 'var(--text-mute)' : 'var(--accent)', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: submitting ? 'none' : '3px 3px 0 var(--accent)', transition: 'all .12s' }}
          >
            {submitting ? 'Sending…' : 'Send reset link →'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            onClick={() => switchMode('login')}
            style={{ background: 'none', border: 'none', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-mute)', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            ← Back to sign in
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 32 }} />
        <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)', letterSpacing: '0.06em', paddingBottom: 32 }}>
          CURLYSPORTS.COM · MADE IN A BEDROOM
        </div>
      </div>
    );
  }

  // ── Login / Signup form ───────────────────────────────────────
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', padding: '0 24px', overflowY: 'auto' }}>
      {/* Hero */}
      <div style={{ paddingTop: 60, paddingBottom: 28 }}>
        <div style={{ width: 72, height: 72, background: 'var(--lime)', borderRadius: 18, border: '2.5px solid var(--ink)', boxShadow: '5px 5px 0 var(--ink)', transform: 'rotate(-6deg)', display: 'grid', placeItems: 'center', overflow: 'hidden', marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/curly-guy.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange)' }}>curlysports.com</div>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 30, letterSpacing: '-0.03em', color: 'var(--ink)', margin: '6px 0 6px', lineHeight: 1.1 }}>
          {mode === 'login' ? 'Welcome back.' : 'Join the debate.'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
          {mode === 'login' ? 'Sign in to your Curly account.' : 'Create an account and start debating.'}
        </p>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 12, padding: 3, marginBottom: 22 }}>
        {(['login', 'signup'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 9,
              border: `2px solid ${mode === m ? 'var(--ink)' : 'transparent'}`,
              background: mode === m ? 'var(--ink)' : 'transparent',
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: mode === m ? 'var(--accent)' : 'var(--text-mute)',
              cursor: 'pointer', transition: 'all .14s',
            }}
          >
            {m === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {mode === 'signup' && (
          <div>
            <label style={labelStyle}>Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="your_handle"
              required
              minLength={3}
              maxLength={30}
              autoComplete="username"
              style={inputStyle}
            />
          </div>
        )}

        <div>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            style={inputStyle}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--orange)', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                Forgot?
              </button>
            )}
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? '8+ characters' : '••••••••'}
            required
            minLength={mode === 'signup' ? 8 : 1}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            style={inputStyle}
          />
        </div>

        {authError && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--surface)', border: '2px solid var(--coral)', borderRadius: 10, padding: '10px 12px' }}>
            <Icon name="close" size={14} style={{ flexShrink: 0, color: 'var(--coral)', marginTop: 1 }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--coral)', lineHeight: 1.4 }}>{authError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 2,
            padding: '14px 0',
            background: submitting ? 'var(--surface-3)' : 'var(--ink)',
            border: '2px solid var(--ink)',
            borderRadius: 12,
            fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
            color: submitting ? 'var(--text-mute)' : 'var(--accent)',
            cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: submitting ? 'none' : '3px 3px 0 var(--accent)',
            transition: 'all .12s',
          }}
        >
          {submitting ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
        </button>
      </form>

      <div style={{ flex: 1, minHeight: 32 }} />
      <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)', letterSpacing: '0.06em', paddingBottom: 32 }}>
        CURLYSPORTS.COM · MADE IN A BEDROOM
      </div>
    </div>
  );
}
