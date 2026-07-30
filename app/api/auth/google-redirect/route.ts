import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * GET /api/auth/google-redirect
 *
 * Initiates Google OAuth from native mobile apps via Supabase Auth.
 * Uses @supabase/ssr so the PKCE code_verifier is stored in cookies
 * and available when /auth/callback exchanges the code.
 */
export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    reqUrl.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    reqUrl.host;
  const origin = `${proto}://${host}`
    .replace("://0.0.0.0", "://localhost")
    .replace(/\/$/, "");

  const supabaseUrl = "https://xbswslbgrlhyqigpzdwz.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhic3dzbGJncmxoeXFpZ3B6ZHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTI0MzksImV4cCI6MjA5NTEyODQzOX0.31dKgGujVd1HbrDYl2cq3pNY9FepXO9FfmkS--mXEIE";

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  // Use a temporary response to collect cookies from Supabase (PKCE verifier)
  const tempResponse = NextResponse.next();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          tempResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const redirectTo = new URL("/auth/callback", origin);
  // Check if request came from Expo native shell or regular mobile WebView
  const platformParam = reqUrl.searchParams.get("platform");
  const returnScheme = reqUrl.searchParams.get("returnScheme");
  const isNativeShell = !!platformParam && !!returnScheme;
  redirectTo.searchParams.set("next", isNativeShell ? "/mobile?newSignup=1&native=1" : "/mobile?newSignup=1");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo.toString(),
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return NextResponse.json(
      { error: error?.message || "Failed to generate OAuth URL" },
      { status: 500 }
    );
  }

  // Redirect to OAuth URL and carry the PKCE cookies
  const redirectResponse = NextResponse.redirect(data.url);
  tempResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });

  return redirectResponse;
}
