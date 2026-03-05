'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '';
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || 'Login failed');
        return;
      }
      const redirectTo = data.redirect || next || (data.role === 'super_admin' ? '/super-admin/dashboard' : data.role === 'admin' ? '/admin/dashboard' : '/app/dashboard');
      router.push(redirectTo);
      router.refresh();
    } catch {
      setErr('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-900/80 p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-center mb-2">Sign in</h1>
        <p className="text-slate-400 text-center text-sm mb-6">
          One login for all. After sign-in you’ll be redirected to your dashboard: Member → app, Admin → admin panel, Super Admin → system panel.
        </p>

      {(error === 'forbidden' || err || message) && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            error === 'forbidden' || err
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
          }`}
        >
          {error === 'forbidden' && !err && 'You do not have access to that panel.'}
          {err}
          {message && !err && typeof message === 'string' && message !== 'forbidden' && message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="admin@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Demo: super@test.com → Super Admin panel; admin@test.com → Admin panel; any other email → Member app dashboard.
        </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <Suspense fallback={<div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-900/80 p-8 shadow-xl text-center text-slate-400">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
