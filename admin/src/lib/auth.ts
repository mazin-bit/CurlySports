import { SignJWT, jwtVerify } from 'jose';
import { type Role, type JWTPayload, type UserSession, ROLES } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'change-me-in-production-min-32-chars'
);

const COOKIE_NAME = 'admin_session';

export async function createSession(payload: {
  sub: string;
  email?: string;
  role: Role;
  displayName?: string;
}): Promise<string> {
  const token = await new SignJWT({
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = (payload.role as Role) ?? ROLES.MEMBER;
    if (![ROLES.MEMBER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
      return null;
    }
    return {
      sub: payload.sub as string,
      email: payload.email as string | undefined,
      role,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function getSessionFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export { COOKIE_NAME };

export function sessionToUserSession(payload: JWTPayload, displayName?: string): UserSession {
  return {
    uid: payload.sub,
    email: payload.email ?? null,
    role: payload.role,
    displayName,
  };
}
