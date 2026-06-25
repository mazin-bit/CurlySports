import { NextResponse } from "next/server";
import { verifyToken, getAccessTokenFromCookies } from "./jwt";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string | null;
  avatar: string | null;
}

/**
 * Gets the authenticated user from the JWT cookie.
 *
 * Returns { user: AuthUser } on success, or a 401 NextResponse when no
 * valid session is present — caller should `return` the response immediately.
 *
 * Usage:
 *   const auth = await requireAuth();
 *   if (auth instanceof NextResponse) return auth;
 *   const { user } = auth;
 */
export async function requireAuth(): Promise<{ user: AuthUser } | NextResponse> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload || payload.purpose !== "access") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return {
    user: {
      id: payload.sub!,
      email: payload.email,
      username: payload.username,
      name: payload.name ?? null,
      avatar: payload.avatar ?? null,
    },
  };
}

/** Optional auth — returns user or null, never a 401 */
export async function optionalAuth(): Promise<AuthUser | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || payload.purpose !== "access") return null;

  return {
    id: payload.sub!,
    email: payload.email,
    username: payload.username,
    name: payload.name ?? null,
    avatar: payload.avatar ?? null,
  };
}
