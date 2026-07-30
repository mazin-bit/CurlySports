import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import prisma from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/jwt";
import { ensureChallengeTables, cuid } from "@/lib/ensure-challenge-tables";
import { logger } from "@/lib/logger";
import { cacheSet } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url);
  const searchParams = reqUrl.searchParams;
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || reqUrl.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host") || reqUrl.host;
  let origin = `${proto}://${host}`.replace("://0.0.0.0", "://localhost").replace(/\/$/, "");
  if (origin.includes("curlysports.com") && !origin.startsWith("https")) {
    origin = "https://curlysports.com";
  }

  const code = searchParams.get("code");
  const allCookies = request.cookies.getAll();
  const hasCodeVerifier = allCookies.some(c => c.name.includes("code-verifier"));
  logger.info("Auth callback hit", {
    origin,
    hasCode: !!code,
    hasCodeVerifier,
    cookieCount: allCookies.length,
  });

  // Read redirect info from oauth_state cookie (set before OAuth redirect)
  // Falls back to query params for backward compatibility
  let next = searchParams.get("next") ?? "/dashboard";
  let referralCode = searchParams.get("ref") || null;
  try {
    const oauthStateCookie = request.cookies.get("oauth_state")?.value;
    if (oauthStateCookie) {
      const state = JSON.parse(decodeURIComponent(oauthStateCookie));
      if (state.next) next = state.next;
      if (state.ref) referralCode = state.ref;
    }
  } catch {
    // cookie parse failed, use query params
  }

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  // Detect if the OAuth flow originated from the mobile app
  const isMobile = safeNext.startsWith("/mobile");
  const errorRedirectBase = isMobile ? "/mobile" : "/login";

  // Extract newSignup and native flags from next param
  let hasNewSignupFlag = false;
  let isNativeFromState = false;
  let cleanNext = safeNext;
  try {
    const nextUrl = new URL(safeNext, origin);
    if (!referralCode) referralCode = nextUrl.searchParams.get("ref") || null;
    hasNewSignupFlag = nextUrl.searchParams.get("newSignup") === "1";
    isNativeFromState = nextUrl.searchParams.get("native") === "1";
    nextUrl.searchParams.delete("ref");
    nextUrl.searchParams.delete("newSignup");
    nextUrl.searchParams.delete("native");
    cleanNext = nextUrl.pathname + (nextUrl.search || "");
  } catch {
    // not a valid relative URL, ignore
  }

  if (!code) {
    return NextResponse.redirect(`${origin}${errorRedirectBase}?error=no_code`);
  }

  try {
    // Create a Supabase server client that can read PKCE verifier from cookies
    const response = NextResponse.redirect(`${origin}${cleanNext}`);
    // Clear the oauth_state cookie
    response.cookies.set("oauth_state", "", { path: "/", maxAge: 0 });
    // Hardcoded: Vercel build doesn't reliably inject NEXT_PUBLIC_* env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xbswslbgrlhyqigpzdwz.supabase.co";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhic3dzbGJncmxoeXFpZ3B6ZHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTI0MzksImV4cCI6MjA5NTEyODQzOX0.31dKgGujVd1HbrDYl2cq3pNY9FepXO9FfmkS--mXEIE";
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    // Exchange the Supabase PKCE code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data.user) {
      logger.error("Supabase code exchange failed", {
        error: exchangeError?.message,
        errorStatus: exchangeError?.status,
        code: code.slice(0, 10) + "...",
        origin,
        hasCookies: request.cookies.getAll().length,
        cookieNames: request.cookies.getAll().map(c => c.name).join(", "),
      });
      return NextResponse.redirect(`${origin}${errorRedirectBase}?error=google_token_failed`);
    }

    const supabaseUser = data.user;
    const googleId = supabaseUser.user_metadata?.provider_id
      || supabaseUser.user_metadata?.sub
      || supabaseUser.id;
    const email = supabaseUser.email!;
    const name = supabaseUser.user_metadata?.full_name
      || supabaseUser.user_metadata?.name
      || "";
    const picture = supabaseUser.user_metadata?.avatar_url
      || supabaseUser.user_metadata?.picture
      || "";

    // Upsert user in Prisma
    let isNewGoogleUser = false;
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          name: user.name || name,
          avatar: user.avatar || picture,
          emailVerified: true,
        },
      });
    } else {
      isNewGoogleUser = true;
      const baseUsername = email.split("@")[0];
      const username = `${baseUsername}_${Date.now().toString(36)}`;
      user = await prisma.user.create({
        data: {
          email,
          username,
          googleId,
          name,
          avatar: picture,
          emailVerified: true,
        },
      });

      // Process referral code for new Google OAuth signups
      if (referralCode) {
        try {
          await ensureChallengeTables();
          const signupIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

          const codeRows: { id: string; userId: string }[] = await prisma.$queryRawUnsafe(
            `SELECT id, "userId" FROM referral_codes WHERE code = $1 LIMIT 1`,
            referralCode
          );

          if (codeRows.length > 0) {
            const refCode = codeRows[0];
            const referralId = cuid();

            await prisma.$executeRawUnsafe(
              `INSERT INTO referrals (id, "referrerUserId", "referredUserId", "referralCodeId", status, ip, "createdAt")
               VALUES ($1, $2, $3, $4, 'pending', $5, NOW())
               ON CONFLICT ("referredUserId") DO NOTHING`,
              referralId,
              refCode.userId,
              user.id,
              refCode.id,
              signupIp
            );

            await prisma.$executeRawUnsafe(
              `UPDATE users SET "referredBy" = $1, "signupIp" = $2 WHERE id = $3`,
              refCode.userId,
              signupIp,
              user.id
            );
          }
        } catch (err) {
          logger.error("referral processing failed (OAuth)", { userId: user.id, referralCode, error: String(err) });
        }
      }
    }

    if (user.isBanned) {
      return NextResponse.redirect(`${origin}${errorRedirectBase}?error=account_suspended`);
    }

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user),
      signRefreshToken(user.id),
    ]);

    // Re-add newSignup flag for genuinely new users so the mobile app shows referral popup
    let redirectPath = cleanNext;
    if (hasNewSignupFlag && isNewGoogleUser) {
      const sep = redirectPath.includes("?") ? "&" : "?";
      redirectPath = `${redirectPath}${sep}newSignup=1`;
    }

    const ua = request.headers.get("user-agent") ?? "";
    const isWebViewUA = /CurlySportsApp|CurlySports-iOS|CurlySports-Android/i.test(ua);
    const needsDeepLink = isMobile && isNativeFromState && !isWebViewUA;

    let finalResponse: NextResponse;
    if (needsDeepLink) {
      const otc = `otc_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
      await cacheSet(`auth:otc:${otc}`, JSON.stringify({
        accessToken,
        refreshToken,
        redirectPath,
        userId: user.id,
      }), 120);

      const deepLink = `curlysports://auth-callback?code=${encodeURIComponent(otc)}`;
      finalResponse = new NextResponse(null, {
        status: 302,
        headers: { "Location": deepLink },
      });
    } else {
      finalResponse = NextResponse.redirect(`${origin}${redirectPath}`);
    }

    // Copy Supabase cookies to the final response (clears PKCE verifier)
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value);
    });

    // Fire-and-forget session tracking
    const platform = /CurlySports-iOS/i.test(ua) || (/iPhone|iPad|iPod/i.test(ua) && /Expo|ReactNative|okhttp/i.test(ua))
      ? "ios"
      : /CurlySports-Android/i.test(ua) || (/Android/i.test(ua) && /Expo|ReactNative|okhttp/i.test(ua))
      ? "android"
      : "web";
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
    const country = request.headers.get("x-vercel-ip-country") ?? null;
    const city = request.headers.get("x-vercel-ip-city") ?? null;
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    prisma.$executeRaw`
      INSERT INTO user_sessions (id, "userId", platform, "ipAddress", country, city, "userAgent", "createdAt")
      VALUES (${sessionId}, ${user.id}, ${platform}, ${ip}, ${country}, ${city}, ${ua.slice(0, 500)}, NOW())
    `.catch(() => {});

    return setAuthCookies(finalResponse, accessToken, refreshToken);
  } catch (err) {
    logger.error("auth callback failed", { error: String(err) });
    return NextResponse.redirect(`${origin}${errorRedirectBase}?error=auth_callback_failed`);
  }
}
