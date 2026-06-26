import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const jwtSecretRaw = process.env.JWT_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "dev-secret-change-in-production");
if (!jwtSecretRaw) throw new Error("JWT_SECRET environment variable is required in production");
const JWT_SECRET = new TextEncoder().encode(jwtSecretRaw);

export const COOKIE_ACCESS = "cs_auth";
export const COOKIE_REFRESH = "cs_refresh";

const ACCESS_TTL = "7d";
const REFRESH_TTL = "30d";

export interface AuthPayload extends JWTPayload {
  sub: string;
  email: string;
  username: string;
  name?: string | null;
  avatar?: string | null;
  purpose: "access" | "refresh" | "reset";
}

export async function signAccessToken(user: {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  avatar?: string | null;
}) {
  return new SignJWT({
    email: user.email,
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    purpose: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(userId: string) {
  return new SignJWT({ purpose: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(JWT_SECRET);
}

export async function signResetToken(email: string) {
  return new SignJWT({ email, purpose: "reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as AuthPayload;
  } catch {
    return null;
  }
}

/** For middleware (Edge runtime) — verify without importing `cookies` */
export async function verifyTokenEdge(token: string): Promise<AuthPayload | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET ?? "dev-secret-change-in-production"
    );
    const { payload } = await jwtVerify(token, secret);
    return payload as AuthPayload;
  } catch {
    return null;
  }
}

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  response.cookies.set(COOKIE_ACCESS, accessToken, {
    ...cookieOpts,
    maxAge: 7 * 24 * 60 * 60,
  });
  response.cookies.set(COOKIE_REFRESH, refreshToken, {
    ...cookieOpts,
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(COOKIE_ACCESS, "", { path: "/", maxAge: 0 });
  response.cookies.set(COOKIE_REFRESH, "", { path: "/", maxAge: 0 });
  return response;
}

/** Read the access token from cookies (server component / route handler) */
export async function getAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_ACCESS)?.value ?? null;
}

export async function getRefreshTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_REFRESH)?.value ?? null;
}
