'use client';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  name: string | null;
  avatar: string | null;
  favTeam: { code: string; name: string } | null;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  /** Logged-in but hasn't chosen a favourite team yet */
  isNewUser: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  setFavTeam: (team: { code: string; name: string }) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabaseRef = useRef((() => { try { return createClient(); } catch { return null; } })());
  const supabase = supabaseRef.current;
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async (u: User) => {
    try {
      const res = await fetch('/api/user/profile');
      if (!mountedRef.current) return;
      if (res.ok) {
        const data = await res.json();
        const favTeam = u.user_metadata?.favTeam ?? null;
        setProfile({ ...data, favTeam });
      }
    } catch {
      // best-effort — don't crash if profile fetch fails
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // If Supabase client failed to create, skip auth entirely
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Track whether init already resolved so onAuthStateChange doesn't
    // duplicate work during the initial load.
    let initResolved = false;

    const init = async () => {
      try {
        const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 2000));
        const sessionReq = supabase.auth.getSession().then(r => r.data.session);
        const session = await Promise.race([sessionReq, timeout]);
        if (!mountedRef.current) return;
        const u = session?.user ?? null;
        setUser(u);
        // Stop showing the loading screen immediately — fetch profile in background
        setIsLoading(false);
        initResolved = true;
        if (u) fetchProfile(u); // fire-and-forget
      } catch {
        // network error — treat as logged out
        if (mountedRef.current) setIsLoading(false);
        initResolved = true;
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mountedRef.current) return;
      // Skip the INITIAL_SESSION event if init() already handled it
      if (!initResolved && _event === 'INITIAL_SESSION') return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await fetchProfile(u);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const sb = supabase;
    if (!sb) { setAuthError('Auth service unavailable'); throw new Error('Auth service unavailable'); }
    setAuthError(null);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message.includes('Invalid login') ? 'Incorrect email or password.' : error.message;
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signup = async (email: string, password: string, username: string) => {
    const sb = supabase;
    if (!sb) { setAuthError('Auth service unavailable'); throw new Error('Auth service unavailable'); }
    setAuthError(null);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string };
      const msg = data.error || 'Signup failed. Please try again.';
      setAuthError(msg);
      throw new Error(msg);
    }
    // Sign in immediately after account creation
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message;
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    await fetch('/api/user/logout', { method: 'POST' }).catch(() => {});
    await supabase?.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const setFavTeam = async (team: { code: string; name: string }) => {
    setProfile(p => p ? { ...p, favTeam: team } : p);
    const sb = supabase;
    if (!sb) return;
    await sb.auth.updateUser({ data: { favTeam: team } });
    const { data: { user: u } } = await sb.auth.getUser();
    if (u && mountedRef.current) setUser(u);
  };

  const clearAuthError = () => setAuthError(null);

  const isNewUser = !!user && !user.user_metadata?.favTeam && !profile?.favTeam;

  return (
    <AuthContext.Provider value={{
      user, profile, isLoading, isNewUser, authError,
      login, signup, logout, setFavTeam, clearAuthError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
