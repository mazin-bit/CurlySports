'use client';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  name: string | null;
  avatar: string | null;
  favTeam: { code: string; name: string } | null;
}

interface AuthContextValue {
  user: UserProfile | null;
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (!mountedRef.current) return null;
      if (res.ok) {
        const data = await res.json();
        const p: UserProfile = {
          id: data.id,
          email: data.email,
          username: data.username,
          name: data.name,
          avatar: data.avatar,
          favTeam: data.favTeam ?? null,
        };
        setUser(p);
        setProfile(p);
        return p;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 2000));
        const profileReq = fetchProfile();
        await Promise.race([profileReq, timeout]);
      } catch {
        // network error — treat as logged out
      }
      if (mountedRef.current) setIsLoading(false);
    };

    init();

    return () => {
      mountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    setAuthError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string };
      const msg = data.error || 'Incorrect email or password.';
      setAuthError(msg);
      throw new Error(msg);
    }
    // Fetch profile after successful login
    await fetchProfile();
  };

  const signup = async (email: string, password: string, username: string) => {
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
    // Signup now logs in automatically (JWT cookies set by response)
    await fetchProfile();
  };

  const logout = async () => {
    await fetch('/api/user/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setProfile(null);
  };

  const setFavTeam = async (team: { code: string; name: string }) => {
    setProfile(p => p ? { ...p, favTeam: team } : p);
    setUser(u => u ? { ...u, favTeam: team } : u);
    // TODO: persist favTeam to user profile via API if needed
  };

  const clearAuthError = () => setAuthError(null);

  const isNewUser = !!user && !profile?.favTeam;

  return (
    <AuthContext.Provider value={{
      user, profile, isLoading, isNewUser, authError,
      login, signup, logout, setFavTeam, clearAuthError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
