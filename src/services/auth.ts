import { supabase } from '../lib/supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export type { User, Session };

// ============================================================
// Google OAuth Client ID
// ============================================================

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const GOOGLE_SESSION_KEY = 'curly_google_session';

// ============================================================
// Unified auth state
// ============================================================

let _cachedUser: any = null;

type AuthCallback = (event: string, session: any, user: any) => void;
const _googleListeners = new Set<AuthCallback>();

function _broadcastGoogle(event: string, session: any, user: any) {
  _cachedUser = user;
  _googleListeners.forEach((cb) => cb(event, session, user));
}

// Restore Google session from localStorage on module load
const _storedGoogle = localStorage.getItem(GOOGLE_SESSION_KEY);
if (_storedGoogle) {
  try {
    _cachedUser = JSON.parse(_storedGoogle).user;
  } catch {
    localStorage.removeItem(GOOGLE_SESSION_KEY);
  }
}

// Supabase auth cache (only when no Google session)
supabase.auth.onAuthStateChange((_event, session) => {
  if (!localStorage.getItem(GOOGLE_SESSION_KEY)) {
    _cachedUser = session?.user ?? null;
  }
});
if (!_storedGoogle) {
  supabase.auth.getSession().then(({ data }) => {
    if (!localStorage.getItem(GOOGLE_SESSION_KEY)) {
      _cachedUser = data.session?.user ?? null;
    }
  }).catch(() => {});
}

/** Synchronous access to the current user. */
export function getCurrentUser() {
  return _cachedUser;
}

/** Convenience accessor so existing code can use `auth.currentUser?.email`. */
export const auth = {
  get currentUser() {
    return _cachedUser;
  },
};

// ============================================================
// Google Sign-In (direct OAuth — no Supabase auth)
// ============================================================

export async function signInWithGoogle(): Promise<{ data: any; error: any }> {
  if (!GOOGLE_CLIENT_ID) {
    return {
      data: null,
      error: { message: 'Google Client ID is not configured. Set VITE_GOOGLE_CLIENT_ID in your .env file.' },
    };
  }

  if (typeof google === 'undefined' || !google?.accounts?.oauth2) {
    return {
      data: null,
      error: { message: 'Google sign-in is still loading. Please try again in a moment.' },
    };
  }

  try {
    // Open Google consent popup to get an access token
    const tokenResponse = await new Promise<google.accounts.oauth2.TokenResponse>(
      (resolve, reject) => {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: (response) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
            } else {
              resolve(response);
            }
          },
          error_callback: (err) => {
            reject(new Error(err.message || 'Google sign-in failed'));
          },
        });
        client.requestAccessToken();
      }
    );

    // Fetch user info from Google using the access token
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch Google user info');
    const info = await res.json();

    // Build a user object matching the shape App.tsx expects
    const user = {
      id: info.sub,
      email: info.email,
      user_metadata: {
        full_name: info.name,
        name: info.name,
        avatar_url: info.picture,
        picture: info.picture,
      },
    };

    const session = { user, access_token: tokenResponse.access_token, provider: 'google' };
    localStorage.setItem(GOOGLE_SESSION_KEY, JSON.stringify(session));
    _broadcastGoogle('SIGNED_IN', session, user);

    return { data: { user, session }, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: { message: err?.message || 'Google sign-in was cancelled or failed. Please try again.' },
    };
  }
}

// ============================================================
// Email / Password auth (via Supabase)
// ============================================================

/** Sign up with email and password. */
export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

/** Sign in with email and password. */
export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

// ============================================================
// Sign out (handles both Google-direct and Supabase)
// ============================================================

/** Sign out. */
export async function signOut() {
  const hadGoogle = !!localStorage.getItem(GOOGLE_SESSION_KEY);
  localStorage.removeItem(GOOGLE_SESSION_KEY);

  if (hadGoogle) {
    try { google?.accounts?.id?.disableAutoSelect(); } catch {}
    _broadcastGoogle('SIGNED_OUT', null, null);
  }

  return supabase.auth.signOut();
}

// ============================================================
// Session / user helpers
// ============================================================

/** Get the current session. */
export async function getSession(): Promise<any> {
  const gs = localStorage.getItem(GOOGLE_SESSION_KEY);
  if (gs) {
    try { return JSON.parse(gs); } catch {}
  }
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Get the current user. */
export async function getUser(): Promise<any> {
  const gs = localStorage.getItem(GOOGLE_SESSION_KEY);
  if (gs) {
    try { return JSON.parse(gs).user; } catch {}
  }
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// ============================================================
// Unified auth state change listener (Google + Supabase)
// ============================================================

/** Subscribe to auth state changes. Returns unsubscribe function. */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null, user: User | null) => void
): () => void {
  // Supabase events (only when no Google session)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (!localStorage.getItem(GOOGLE_SESSION_KEY)) {
        callback(event, session, session?.user ?? null);
      }
    }
  );

  // Google events
  const googleCb: AuthCallback = (event, session, user) => {
    callback(event as AuthChangeEvent, session, user);
  };
  _googleListeners.add(googleCb);

  // Fire initial event if a Google session already exists
  const stored = localStorage.getItem(GOOGLE_SESSION_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      setTimeout(() => callback('SIGNED_IN' as AuthChangeEvent, parsed, parsed.user), 0);
    } catch {
      localStorage.removeItem(GOOGLE_SESSION_KEY);
    }
  }

  return () => {
    subscription.unsubscribe();
    _googleListeners.delete(googleCb);
  };
}
