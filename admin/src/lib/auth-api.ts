import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import type { JWTPayload } from '@/types';

/** Use in API routes (App Router) to get JWT payload from cookie. Returns null if missing or invalid. */
export async function getAuthPayload(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
  if (!token) return null;
  return verifyToken(token);
}

/** Require Super Admin. Returns 403 response if not. */
export async function requireSuperAdmin(): Promise<JWTPayload | null> {
  const payload = await getAuthPayload();
  if (!payload) return null;
  if (payload.role !== 'super_admin') return null;
  return payload;
}
