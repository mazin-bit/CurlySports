import { NextResponse, type NextRequest } from "next/server";
import { cacheGet, cacheDel } from "@/lib/redis";
import { setAuthCookies } from "@/lib/jwt";

/**
 * One-time auth code exchange for mobile app.
 * After Google OAuth completes in external browser, the callback stores
 * JWT tokens in Redis with a one-time code. The mobile app's WebView
 * calls this endpoint with the code to set auth cookies.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "missing_code" }, { status: 400 });
  }

  const key = `auth:otc:${code}`;
  const raw = await cacheGet(key);
  if (!raw) {
    return NextResponse.json({ error: "invalid_or_expired_code" }, { status: 401 });
  }

  // Delete immediately — one-time use
  await cacheDel(key);

  let data: { accessToken: string; refreshToken: string; redirectPath?: string; redirect?: string };
  try {
    data = JSON.parse(raw as string);
  } catch {
    return NextResponse.json({ error: "invalid_data" }, { status: 500 });
  }

  const redirectPath = data.redirectPath || data.redirect || "/mobile";
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host") || "curlysports.com";
  const origin = `${proto}://${host}`;

  const response = NextResponse.redirect(`${origin}${redirectPath}`);
  return setAuthCookies(response, data.accessToken, data.refreshToken);
}
