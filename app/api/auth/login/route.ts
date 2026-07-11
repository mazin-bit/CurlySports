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

    return setAuthCookies(response, accessToken, refreshToken);
  } catch (err) {
    logger.error("login error", { error: String(err) });
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
