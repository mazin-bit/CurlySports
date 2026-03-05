import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { ROLES } from '@/types';
import { logAudit } from '@/lib/audit';

const COOKIE_NAME = 'admin_session';
const COOKIE_OPTIONS = 'Path=/; HttpOnly; SameSite=Lax; Max-Age=604800'; // 7d

const SUPER_ADMIN_EMAIL = 'mazcis2011@gmail.com';

// Role by email. Replace with DB lookup (PostgreSQL) in production.
function getRoleForEmail(email: string): (typeof ROLES)[keyof typeof ROLES] {
  const e = email.toLowerCase().trim();
  if (e === SUPER_ADMIN_EMAIL || e === 'super@test.com' || e === 'superadmin@test.com') return ROLES.SUPER_ADMIN;
  if (e === 'admin@test.com' || e.endsWith('@admin.test')) return ROLES.ADMIN;
  return ROLES.MEMBER;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || '').toString().trim();
    const password = (body.password || '').toString();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const role = getRoleForEmail(email);
    // All roles can log in; redirect by role
    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const token = await createSession({
      sub: `demo-${email}-${Date.now()}`,
      email,
      role,
    });

    logAudit({
      actorId: `demo-${email}`,
      actorEmail: email,
      action: 'LOGIN',
      resource: 'auth',
      details: { role },
    });

    const redirect =
      role === ROLES.SUPER_ADMIN ? '/super-admin/dashboard' : role === ROLES.ADMIN ? '/admin/dashboard' : '/app/dashboard';
    const res = NextResponse.json({ success: true, role, redirect });
    res.headers.set(
      'Set-Cookie',
      `${COOKIE_NAME}=${encodeURIComponent(token)}; ${COOKIE_OPTIONS}`
    );
    return res;
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
