import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/jwt";
import { ensureChallengeTables, cuid } from "@/lib/ensure-challenge-tables";
import { logger } from "@/lib/logger";

/**
 * POST /api/auth/google-token
 * Accepts either:
 *   - { credential: "..." } — Google ID token from GIS One Tap / popup (no client secret needed)
 *   - { code: "..." } — Google authorization code from GIS code flow
 * Verifies the token, upserts user, returns auth cookies.
 * Used by the /mobile WebView so OAuth stays in-page (no redirect to Chrome).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.credential && !body?.code) {
    return NextResponse.json({ error: "missing_credential_or_code" }, { status: 400 });
  }

  const { credential, code, referralCode } = body as {
    credential?: string;
    code?: string;
    referralCode?: string;
  };

  const clientId = "512124239392-velrug04ps35ihhig7spbe3fv4nqh103.apps.googleusercontent.com";

  try {
    let googleUser: { id: string; email: string; name: string; picture: string };

    if (credential) {
      // ID token flow — verify the JWT with Google's tokeninfo endpoint
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );

      if (!verifyRes.ok) {
        const errBody = await verifyRes.text().catch(() => "");
        logger.error("Google ID token verification failed", { status: verifyRes.status, body: errBody });
        return NextResponse.json({ error: "google_token_failed" }, { status: 400 });
      }

      const tokenInfo = await verifyRes.json();

      // Verify the token was issued for our app
      if (tokenInfo.aud !== clientId) {
        logger.error("Google ID token audience mismatch", { aud: tokenInfo.aud, expected: clientId });
        return NextResponse.json({ error: "google_token_failed" }, { status: 400 });
      }

      googleUser = {
        id: tokenInfo.sub,
        email: tokenInfo.email,
        name: tokenInfo.name || tokenInfo.email.split("@")[0],
        picture: tokenInfo.picture || "",
      };
    } else {
      // Authorization code flow — exchange code for tokens
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientSecret) {
        return NextResponse.json({ error: "google_not_configured" }, { status: 500 });
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code!,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: "postmessage",
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text().catch(() => "");
        logger.error("Google token exchange failed (popup)", { status: tokenRes.status, body: errBody });
        return NextResponse.json({ error: "google_token_failed" }, { status: 400 });
      }

      const { access_token } = await tokenRes.json();

      const userInfoRes = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      if (!userInfoRes.ok) {
        return NextResponse.json({ error: "google_userinfo_failed" }, { status: 400 });
      }

      googleUser = (await userInfoRes.json()) as {
        id: string;
        email: string;
        name: string;
        picture: string;
      };
    }

    // Upsert user in Prisma
    let isNewUser = false;
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
      isNewUser = true;
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

      // Process referral code for new users
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
          logger.error("referral processing failed (google-token)", { userId: user.id, referralCode, error: String(err) });
        }
      }
    }

    if (user.isBanned) {
      return NextResponse.json({ error: "account_suspended" }, { status: 403 });
    }

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user),
      signRefreshToken(user.id),
    ]);

    // Session tracking
    const ua = request.headers.get("user-agent") ?? "";
    const platform = /CurlySports-iOS/i.test(ua) || /iPhone|iPad|iPod/i.test(ua)
      ? "ios"
      : /CurlySports-Android/i.test(ua) || /Android/i.test(ua)
      ? "android"
      : "web";
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const country = request.headers.get("x-vercel-ip-country") ?? null;
    const city = request.headers.get("x-vercel-ip-city") ?? null;
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    prisma.$executeRaw`
      INSERT INTO user_sessions (id, "userId", platform, "ipAddress", country, city, "userAgent", "createdAt")
      VALUES (${sessionId}, ${user.id}, ${platform}, ${ip}, ${country}, ${city}, ${ua.slice(0, 500)}, NOW())
    `.catch(() => {});

    // Set auth cookies on a JSON response
    const jsonResponse = NextResponse.json({
      success: true,
      isNewUser,
      user: { id: user.id, email: user.email, name: user.name, username: user.username, avatar: user.avatar },
    });

    return setAuthCookies(jsonResponse, accessToken, refreshToken);
  } catch (err) {
    logger.error("google-token endpoint failed", { error: String(err) });
    return NextResponse.json({ error: "auth_failed" }, { status: 500 });
  }
}
