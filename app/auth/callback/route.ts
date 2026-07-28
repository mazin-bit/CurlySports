import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/jwt";
import { ensureChallengeTables, cuid } from "@/lib/ensure-challenge-tables";
import { logger } from "@/lib/logger";
import { cacheSet } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url);
  const searchParams = reqUrl.searchParams;
  // Use x-forwarded headers for reliable origin on Vercel (avoids http vs https mismatch)
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || reqUrl.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host") || reqUrl.host;
  const origin = `${proto}://${host}`.replace("://0.0.0.0", "://localhost").replace(/\/$/, "");
  const code = searchParams.get("code");
  const state = searchParams.get("state") ?? "/dashboard";
  const safeState =
    state.startsWith("/") && !state.startsWith("//") ? state : "/dashboard";

  // Detect if the OAuth flow originated from the mobile app
  const isMobile = safeState.startsWith("/mobile");
  const errorRedirectBase = isMobile ? "/mobile" : "/login";

  // Extract referral code, newSignup flag, and native flag from state
  let referralCode: string | null = null;
  let hasNewSignupFlag = false;
  let isNativeFromState = false;
  let safeNext = safeState;
  try {
    const stateUrl = new URL(safeState, origin);
    referralCode = stateUrl.searchParams.get("ref") || null;
    hasNewSignupFlag = stateUrl.searchParams.get("newSignup") === "1";
    isNativeFromState = stateUrl.searchParams.get("native") === "1";
    // Strip ref param from redirect so it doesn't leak into the dashboard URL
    if (referralCode) {
      stateUrl.searchParams.delete("ref");
    }
    // Strip newSignup — we'll re-add it only for genuinely new users
    if (hasNewSignupFlag) {
      stateUrl.searchParams.delete("newSignup");
    }
    // Strip native flag from redirect
    stateUrl.searchParams.delete("native");
    safeNext = stateUrl.pathname + (stateUrl.search || "");
  } catch {
    // state wasn't a valid relative URL, ignore
  }

  if (!code) {
    return NextResponse.redirect(`${origin}${errorRedirectBase}?error=no_code`);
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}${errorRedirectBase}?error=google_not_configured`);
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/auth/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text().catch(() => "");
      logger.error("Google token exchange failed", { status: tokenRes.status, body: errBody, redirect_uri: `${origin}/auth/callback` });
      return NextResponse.redirect(`${origin}${errorRedirectBase}?error=google_token_failed`);
    }

    const { access_token } = await tokenRes.json();

    // Get user info from Google
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!userInfoRes.ok) {
      return NextResponse.redirect(
        `${origin}${errorRedirectBase}?error=google_userinfo_failed`
      );
    }

    const googleUser = (await userInfoRes.json()) as {
      id: string;
      email: string;
      name: string;
      picture: string;
    };

    // Upsert user in Prisma
    let isNewGoogleUser = false;
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: googleUser.id }, { email: googleUser.email }] },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.id,
          name: user.name || googleUser.name,
          avatar: user.avatar || googleUser.picture,
          emailVerified: true,
        },
      });
    } else {
      isNewGoogleUser = true;
      const baseUsername = googleUser.email.split("@")[0];
      const username = `${baseUsername}_${Date.now().toString(36)}`;
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          username,
          googleId: googleUser.id,
          name: googleUser.name,
          avatar: googleUser.picture,
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
          // Don't fail OAuth callback if referral processing fails
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
    let redirectPath = safeNext;
    if (hasNewSignupFlag && isNewGoogleUser) {
      const sep = redirectPath.includes("?") ? "&" : "?";
      redirectPath = `${redirectPath}${sep}newSignup=1`;
    }

    const ua = request.headers.get("user-agent") ?? "";
    const isWebViewUA = /CurlySportsApp|CurlySports-iOS|CurlySports-Android/i.test(ua);
    // Only use deep link when OAuth happened in an external browser (not in WebView).
    // If the UA contains the app identifier, the request is FROM the WebView — just redirect normally.
    const needsDeepLink = isMobile && isNativeFromState && !isWebViewUA;

    let response: NextResponse;
    if (needsDeepLink) {
      // OAuth completed in Chrome Custom Tab — 302 redirect to custom scheme.
      // Chrome Custom Tabs properly follow HTTP redirects to custom schemes,
      // triggering the Android intent filter and closing the tab automatically.
      const otc = `otc_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
      await cacheSet(`auth:otc:${otc}`, JSON.stringify({
        accessToken,
        refreshToken,
        redirectPath,
        userId: user.id,
      }), 120); // 2 minute TTL

      const deepLink = `curlysports://auth-callback?code=${encodeURIComponent(otc)}`;
      response = new NextResponse(null, {
        status: 302,
        headers: { "Location": deepLink },
      });
    } else {
      // WebView or regular browser — just redirect normally with cookies
      response = NextResponse.redirect(`${origin}${redirectPath}`);
    }

    // Fire-and-forget session tracking — don't block OAuth callback
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

    return setAuthCookies(response, accessToken, refreshToken);
  } catch {
    return NextResponse.redirect(`${origin}${errorRedirectBase}?error=auth_callback_failed`);
  }
}
