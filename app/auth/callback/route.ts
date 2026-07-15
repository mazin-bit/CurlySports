import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/jwt";
import { ensureChallengeTables, cuid } from "@/lib/ensure-challenge-tables";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url);
  const searchParams = reqUrl.searchParams;
  const origin = reqUrl.origin.replace("://0.0.0.0", "://localhost");
  const code = searchParams.get("code");
  const state = searchParams.get("state") ?? "/dashboard";
  const safeState =
    state.startsWith("/") && !state.startsWith("//") ? state : "/dashboard";

  // Extract referral code from state (e.g. "/dashboard?ref=ABC123")
  let referralCode: string | null = null;
  let safeNext = safeState;
  try {
    const stateUrl = new URL(safeState, origin);
    referralCode = stateUrl.searchParams.get("ref") || null;
    // Strip ref param from redirect so it doesn't leak into the dashboard URL
    if (referralCode) {
      stateUrl.searchParams.delete("ref");
      safeNext = stateUrl.pathname + (stateUrl.search || "");
    }
  } catch {
    // state wasn't a valid relative URL, ignore
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/login?error=google_not_configured`);
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
      return NextResponse.redirect(`${origin}/login?error=google_token_failed`);
    }

    const { access_token } = await tokenRes.json();

    // Get user info from Google
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!userInfoRes.ok) {
      return NextResponse.redirect(
        `${origin}/login?error=google_userinfo_failed`
      );
    }

    const googleUser = (await userInfoRes.json()) as {
      id: string;
      email: string;
      name: string;
      picture: string;
    };

    // Upsert user in Prisma
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
      return NextResponse.redirect(`${origin}/login?error=account_suspended`);
    }

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user),
      signRefreshToken(user.id),
    ]);

    const response = NextResponse.redirect(`${origin}${safeNext}`);

    // Fire-and-forget session tracking — don't block OAuth callback
    const ua = request.headers.get("user-agent") ?? "";
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
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }
}
