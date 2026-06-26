import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

const COOKIE_ACCESS = "cs_auth";
const COOKIE_REFRESH = "cs_refresh";

function getSecret(): Uint8Array | null {
  const raw = process.env.JWT_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "dev-secret-change-in-production");
  if (!raw) return null;
  return new TextEncoder().encode(raw);
}

function loginRedirect(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that never require auth
  const publicPaths = [
    "/login", "/auth/callback", "/auth/check-email",
    "/reset-password", "/verify-email", "/", "/mobile", "/privacy", "/terms", "/admin",
  ];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "?") || pathname.startsWith(p + "/")
  );

  // API routes handle their own auth
  const isApi = pathname.startsWith("/api/");

  if (isPublic || isApi) {
    return NextResponse.next({ request });
  }

  const secret = getSecret();
  if (!secret) return loginRedirect(request);

  const accessToken = request.cookies.get(COOKIE_ACCESS)?.value;
  const refreshToken = request.cookies.get(COOKIE_REFRESH)?.value;

  if (!accessToken) {
    // No access token — try refresh
    if (refreshToken) {
      try {
        const { payload } = await jwtVerify(refreshToken, secret);
        if (payload.purpose === "refresh") {
          // Redirect through the refresh endpoint to get new tokens
          const refreshUrl = request.nextUrl.clone();
          refreshUrl.pathname = "/api/auth/refresh";
          refreshUrl.searchParams.set("next", pathname);
          // Can't call fetch in middleware (Edge), so redirect to login with a hint
        }
      } catch {
        // Refresh token also invalid
      }
    }
    return loginRedirect(request);
  }

  try {
    await jwtVerify(accessToken, secret);

    // Logged-in user hitting /login → redirect to dashboard
    if (pathname === "/login") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next({ request });
  } catch {
    // Access token expired — redirect to login
    // Client-side code should call /api/auth/refresh proactively
    return loginRedirect(request);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)",
  ],
};
