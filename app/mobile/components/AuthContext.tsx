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
  /** Whether OTP verification is needed (signup or unverified login) */
  needsVerification: boolean;
  verificationEmail: string;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  setFavTeam: (team: { code: string; name: string }) => Promise<void>;
  clearAuthError: () => void;
  verifyOtp: (code: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  cancelVerification: () => void;
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
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async () => {
    try {
      const signal = AbortSignal.timeout(8000); // 8s safety net
      let res = await fetch('/api/user/profile', { signal });
      if (!mountedRef.current) return null;

      // If access token expired, try refreshing
      if (res.status === 401) {
        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', signal });
        if (refreshRes.ok) {
          res = await fetch('/api/user/profile', { signal });
          if (!mountedRef.current) return null;
        }
      }

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
        await fetchProfile();
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
      const data = await res.json().catch(() => ({})) as { error?: string; needsVerification?: boolean; email?: string };
      if (data.needsVerification) {
        setNeedsVerification(true);
        setVerificationEmail(data.email || email);
        return;
      }
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
    const data = await res.json().catch(() => ({})) as { error?: string; needsVerification?: boolean };
    if (!res.ok) {
      const msg = data.error || 'Signup failed. Please try again.';
      setAuthError(msg);
      throw new Error(msg);
    }
    if (data.needsVerification) {
      setNeedsVerification(true);
      setVerificationEmail(email);
      return;
    }
    await fetchProfile();
  };

  const logout = async () => {
    await fetch('/api/user/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setProfile(null);
  };

  const deleteAccount = async (password?: string) => {
    const res = await fetch('/api/user/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(password ? { password } : {}),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string; requiresPassword?: boolean };
      throw new Error(data.error || 'Failed to delete account.');
    }
    setUser(null);
    setProfile(null);
  };

  const setFavTeam = async (team: { code: string; name: string }) => {
    setProfile(p => p ? { ...p, favTeam: team } : p);
    setUser(u => u ? { ...u, favTeam: team } : u);
    await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favTeam: team }),
    }).catch(() => {});
  };

  const clearAuthError = () => setAuthError(null);

  const verifyOtp = async (code: string) => {
    setAuthError(null);
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verificationEmail, otp: code }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(data.error || 'Verification failed.');
    }
    setNeedsVerification(false);
    setVerificationEmail('');
    await fetchProfile();
  };

  const resendOtp = async () => {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verificationEmail }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(data.error || 'Failed to resend code.');
    }
  };

  const cancelVerification = () => {
    setNeedsVerification(false);
    setVerificationEmail('');
    setAuthError(null);
  };

  const isNewUser = !!user && !profile?.favTeam;

  return (
    <AuthContext.Provider value={{
      user, profile, isLoading, isNewUser, authError,
      needsVerification, verificationEmail,
      login, signup, logout, deleteAccount, setFavTeam, clearAuthError,
      verifyOtp, resendOtp, cancelVerification,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
