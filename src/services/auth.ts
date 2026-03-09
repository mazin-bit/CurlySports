import { supabase } from '../lib/supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export type { User, Session };

// ============================================================
// Cached current user (synchronous access, mirrors Firebase's auth.currentUser)
// ============================================================

let _cachedUser: User | null = null;

// Auto-initialize: listen for auth changes and cache the user.
supabase.auth.onAuthStateChange((_event, session) => {
  _cachedUser = session?.user ?? null;
});
// Also try to seed from existing session on module load.
supabase.auth.getSession().then(({ data }) => {
  _cachedUser = data.session?.user ?? null;
}).catch(() => { /* Supabase not configured yet */ });

/** Synchronous access to the current user (like Firebase's auth.currentUser). */
export function getCurrentUser(): User | null {
  return _cachedUser;
}

/**
 * Compatibility shim: mirrors Firebase's `auth` object shape so existing code
 * that does `auth.currentUser?.email` works without rewriting every call site.
 */
export const auth = {
  get currentUser() {
    return _cachedUser;
  },
};

/** Sign in with Google OAuth (redirect flow). */
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });
}

/** Sign up with email and password. */
export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

/** Sign in with email and password. */
export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/** Sign out. */
export async function signOut() {
  return supabase.auth.signOut();
}

/** Get the current session. */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Get the current user. */
export async function getUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/** Subscribe to auth state changes. Returns unsubscribe function. */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null, user: User | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session, session?.user ?? null);
    }
  );
  return () => subscription.unsubscribe();
}
