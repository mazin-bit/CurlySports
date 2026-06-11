'use client';
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import Icon from './ui/Icon';

type Mode = 'login' | 'signup';

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

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, signup, authError, clearAuthError } = useAuth();

  const switchMode = (m: Mode) => {
    clearAuthError();
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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', padding: '0 24px', overflowY: 'auto' }}>
      {/* Hero */}
      <div style={{ paddingTop: 60, paddingBottom: 28 }}>
        <div style={{ width: 72, height: 72, background: 'var(--lime)', borderRadius: 18, border: '2.5px solid var(--ink)', boxShadow: '5px 5px 0 var(--ink)', transform: 'rotate(-6deg)', display: 'grid', placeItems: 'center', overflow: 'hidden', marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/curly-mark.png" alt="" style={{ width: '80%', height: '80%', objectFit: 'contain', transform: 'rotate(6deg)' }} />
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange)' }}>curly.sports</div>
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
          <label style={labelStyle}>Password</label>
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
            <Icon name="x" size={14} style={{ flexShrink: 0, color: 'var(--coral)', marginTop: 1 }} />
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
        CURLY.SPORTS · MADE IN A BEDROOM
      </div>
    </div>
  );
}
