import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getSessionFromCookie, COOKIE_NAME } from '@/lib/auth';
import { ROLES } from '@/types';

const LOGIN_PATH = '/login';
const APP_PREFIX = '/app';
const ADMIN_PREFIX = '/admin';
const SUPER_ADMIN_PREFIX = '/super-admin';

const MEMBER_DASHBOARD = '/app/dashboard';
const ADMIN_DASHBOARD = '/admin/dashboard';
const SUPER_ADMIN_DASHBOARD = '/super-admin/dashboard';

/** Single login at /login. After auth, redirect by role. Strict access: /app/* Member, /admin/* Admin, /super-admin/* Super Admin. 403 otherwise. */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token =
    request.cookies.get(COOKIE_NAME)?.value ??
    getSessionFromCookie(request.headers.get('cookie'));

  const payload = token ? await verifyToken(token) : null;

  // Single login URL: same for all account types
  if (pathname === LOGIN_PATH) {
    if (payload) {
      if (payload.role === ROLES.SUPER_ADMIN) {
        return NextResponse.redirect(new URL(SUPER_ADMIN_DASHBOARD, request.url));
      }
      if (payload.role === ROLES.ADMIN) {
        return NextResponse.redirect(new URL(ADMIN_DASHBOARD, request.url));
      }
      if (payload.role === ROLES.MEMBER) {
        return NextResponse.redirect(new URL(MEMBER_DASHBOARD, request.url));
      }
    }
    return NextResponse.next();
  }

  // Member app: /app/* — Member only. Admin and Super Admin get 403.
  if (pathname.startsWith(APP_PREFIX)) {
    if (!payload) {
      const login = new URL(LOGIN_PATH, request.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
    if (payload.role !== ROLES.MEMBER) {
      return NextResponse.json({ error: 'Forbidden', code: 'ROLE_MEMBER_ONLY' }, { status: 403 });
    }
    return NextResponse.next();
  }

  // Admin panel: /admin/* — Admin only. Member and Super Admin get 403.
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!payload) {
      const login = new URL(LOGIN_PATH, request.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
    if (payload.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden', code: 'ROLE_ADMIN_ONLY' }, { status: 403 });
    }
    return NextResponse.next();
  }

  // Super Admin panel: /super-admin/* — Super Admin only.
  if (pathname.startsWith(SUPER_ADMIN_PREFIX)) {
    if (!payload) {
      const login = new URL(LOGIN_PATH, request.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
    if (payload.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden', code: 'ROLE_SUPER_ADMIN_ONLY' }, { status: 403 });
    }
    return NextResponse.next();
  }

  // Root: redirect to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/app/:path*', '/admin/:path*', '/super-admin/:path*'],
};
