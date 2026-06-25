import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

const COOKIE_ACCESS = "cs_auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that never require auth
  const publicPaths = [
    "/login", "/auth/callback", "/auth/check-email",
    "/reset-password", "/verify-email", "/", "/mobile", "/privacy", "/terms",
  ];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "?") || pathname.startsWith(p + "/")
  );

  // API routes handle their own auth
  const isApi = pathname.startsWith("/api/");

  if (isPublic || isApi) {
    return NextResponse.next({ request });
  }

  const token = request.cookies.get(COOKIE_ACCESS)?.value;

  if (!token) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET ?? "dev-secret-change-in-production"
    );
    await jwtVerify(token, secret);

    // Logged-in user hitting /login → redirect to dashboard
    if (pathname === "/login") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next({ request });
  } catch {
    // Token invalid/expired — redirect to login
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)",
  ],
};
