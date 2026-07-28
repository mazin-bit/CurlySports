import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/auth/google-redirect
 *
 * Initiates Google OAuth from native mobile apps.
 * Redirects to Google's OAuth consent page with the appropriate callback URL.
 * Used by the Expo app's WebBrowser.openAuthSessionAsync flow.
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

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth not configured" },
      { status: 500 }
    );
  }

  const redirectUri = `${origin}/auth/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state: "/mobile?newSignup=1",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
}
