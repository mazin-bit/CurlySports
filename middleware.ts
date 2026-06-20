import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that never require auth
  const publicPaths = ["/login", "/auth/callback", "/auth/check-email", "/reset-password", "/", "/mobile"];
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "?") || pathname.startsWith(p + "/"));

  // API routes handle their own auth
  const isApi = pathname.startsWith("/api/");

  // Skip Supabase entirely for public pages and API routes — avoids hanging
  // requests when Supabase is slow/unreachable (critical for mobile via IP)
  if (isPublic || isApi) {
    return NextResponse.next({ request });
  }

  // Skip Supabase if env vars are missing
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Race getUser against a timeout to prevent middleware from hanging
    const userResult = await Promise.race([
      supabase.auth.getUser(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);

    const user = userResult && "data" in userResult ? userResult.data.user : null;

    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (user && pathname === "/login") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }

    return supabaseResponse;
  } catch {
    // If Supabase fails, allow the request through rather than crashing
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)",
  ],
};
