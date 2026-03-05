import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth-api';
import { ROLES } from '@/types';
import type { Role } from '@/types';

/** Use in API routes. Returns payload or 401/403 response. */
export async function requireRole(allowedRoles: Role[]): Promise<
  { payload: Awaited<ReturnType<typeof getAuthPayload>>; response: null } |
  { payload: null; response: NextResponse }
> {
  const payload = await getAuthPayload();
  if (!payload) {
    return { payload: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!allowedRoles.includes(payload.role)) {
    return { payload: null, response: NextResponse.json({ error: 'Forbidden', code: 'ROLE' }, { status: 403 }) };
  }
  return { payload, response: null };
}

/** Member app APIs: member or admin only. */
export async function requireAppAccess() {
  return requireRole([ROLES.MEMBER, ROLES.ADMIN]);
}

/** Admin panel APIs: admin only. Member and Super Admin get 403. */
export async function requireAdminAccess() {
  return requireRole([ROLES.ADMIN]);
}

/** Super Admin APIs: super_admin only. */
export async function requireSuperAdminAccess() {
  return requireRole([ROLES.SUPER_ADMIN]);
}
