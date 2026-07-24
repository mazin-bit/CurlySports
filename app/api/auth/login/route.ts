import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/jwt";
import { rateLimiters, rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { logger } from "@/lib/logger";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendEmail } from "@/lib/email";
import { buildOtpEmail } from "@/lib/email-templates";
import { verifyReferralsForUser } from "@/app/api/cron/verify-referrals/route";


export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimiters.auth(req);
    if (limited) return limited;

    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && user.isBanned) {
      return NextResponse.json(
        { error: "Your account has been suspended. Contact support for assistance." },
        { status: 403 }
      );
    }

    if (user && user.passwordHash) {
      // Existing Prisma user with password — verify normally
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
      }
    } else if (!user) {
      // No Prisma user — try Supabase auth as migration fallback
      try {
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error || !data.user) {
          return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
        }

        // Supabase auth succeeded — migrate user to Prisma
        const passwordHash = await bcrypt.hash(password, 12);

        const baseUsername = normalizedEmail
          .split("@")[0]
          .replace(/[^a-zA-Z0-9_.-]/g, "_")
          .slice(0, 25);
        let username = baseUsername;
        let suffix = 1;
        while (await prisma.user.findUnique({ where: { username } })) {
          username = `${baseUsername.slice(0, 24)}_${suffix}`;
          suffix++;
        }

        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            username,
            passwordHash,
            emailVerified: true,
            name: data.user.user_metadata?.full_name ?? null,
            avatar: data.user.user_metadata?.avatar_url ?? null,
          },
        });

        logger.info("supabase user migrated to prisma", { email: normalizedEmail });
      } catch (err) {
        logger.error("supabase fallback auth failed", {
          email: normalizedEmail,
          error: String(err),
        });
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
      }
    } else {
      // User exists but no passwordHash (Google-only account)
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (!user.emailVerified) {
      // Auto-send a new OTP for unverified users trying to log in
      const resendLimited = await rateLimit(req, {
        name: "otp-resend",
        tokens: 3,
        window: "1h",
        identifier: normalizedEmail,
      });

      if (!resendLimited) {
        try {
          const otp = generateOtp();
          const otpHashed = await hashOtp(otp);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              otpHash: otpHashed,
              otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
              otpAttempts: 0,
              otpSentAt: new Date(),
            },
          });
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin.replace("://0.0.0.0", "://localhost");
          await sendEmail({
            to: user.email,
            subject: "Your verification code - Curly Sports",
            html: buildOtpEmail(otp, appUrl),
          });
        } catch (err) {
          logger.error("login otp email failed", { email: user.email, error: String(err) });
        }
      }

      return NextResponse.json(
        { error: "Please verify your email. We sent you a verification code.", needsVerification: true, email: user.email },
        { status: 403 }
      );
    }

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user),
      signRefreshToken(user.id),
    ]);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
      },
    });

    // Fire-and-forget session tracking — don't block login
    const ua = req.headers.get("user-agent") ?? "";
    const platform = /CurlySports-iOS/i.test(ua) || (/iPhone|iPad|iPod/i.test(ua) && /Expo|ReactNative|okhttp/i.test(ua))
      ? "ios"
      : /CurlySports-Android/i.test(ua) || (/Android/i.test(ua) && /Expo|ReactNative|okhttp/i.test(ua))
      ? "android"
      : "web";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;
    const country = req.headers.get("x-vercel-ip-country") ?? null;
    const city = req.headers.get("x-vercel-ip-city") ?? null;
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    prisma.$executeRaw`
      INSERT INTO user_sessions (id, "userId", platform, "ipAddress", country, city, "userAgent", "createdAt")
      VALUES (${sessionId}, ${user.id}, ${platform}, ${ip}, ${country}, ${city}, ${ua.slice(0, 500)}, NOW())
    `.catch(() => {});

    // Fire-and-forget: verify any pending referrals where this user is the referred user
    // This triggers instant verification when a referred user logs in after email verification
    verifyReferralsForUser(user.id).catch(() => {});

    return setAuthCookies(response, accessToken, refreshToken);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack?.split("\n").slice(0, 3).join(" | ") : "";
    logger.error("login error", { error: errMsg, stack: errStack });
    return NextResponse.json({ error: "Login failed. Please try again.", debug: errMsg }, { status: 500 });
  }
}
