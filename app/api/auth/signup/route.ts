import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendEmail } from "@/lib/email";
import { buildOtpEmail, getMascotAttachment } from "@/lib/email-templates";
import { parseBody, signupSchema } from "@/lib/validation";
import { rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { ensureChallengeTables, cuid } from "@/lib/ensure-challenge-tables";


export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimiters.auth(req);
    if (limited) return limited;

    const body = await req.json().catch(() => ({}));

    const parsed = parseBody(signupSchema, body);
    if (!parsed.success) return parsed.response;
    const { email, password, username } = parsed.data;
    const referralCode: string | undefined = typeof body.referralCode === "string" ? body.referralCode.trim() : undefined;

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email or username already taken
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: normalizedEmail }, { username }] },
    });
    if (existing) {
      const msg =
        existing.email === normalizedEmail
          ? "Email already in use."
          : "Username already taken.";
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username,
        passwordHash,
        emailVerified: false,
      },
    });

    // Generate OTP and send via email
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

    // Handle referral code
    if (referralCode) {
      try {
        await ensureChallengeTables();
        const signupIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

        // Look up the referral code
        const codeRows: { id: string; userId: string }[] = await prisma.$queryRawUnsafe(
          `SELECT id, "userId" FROM referral_codes WHERE code = $1 LIMIT 1`,
          referralCode
        );

        if (codeRows.length > 0) {
          const refCode = codeRows[0];
          const referralId = cuid();

          // Create referrals record
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

          // Set the user's referredBy column
          await prisma.$executeRawUnsafe(
            `UPDATE users SET "referredBy" = $1, "signupIp" = $2 WHERE id = $3`,
            refCode.userId,
            signupIp,
            user.id
          );
        }
      } catch (err) {
        logger.error("referral processing failed", { userId: user.id, referralCode, error: String(err) });
        // Don't fail signup if referral processing fails
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://curlysports.com";

    let emailFailed = false;
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Your verification code - Curly Sports",
        html: buildOtpEmail(otp, appUrl),
        attachments: [getMascotAttachment()],
      });
    } catch (err) {
      emailFailed = true;
      logger.error("otp email failed", { email: normalizedEmail, error: String(err) });
    }

    logger.info("user signup", { email: normalizedEmail });

    return NextResponse.json(
      {
        user: { id: user.id, email: user.email, username: user.username },
        needsVerification: true,
        ...(emailFailed && {
          emailWarning:
            "Account created, but the verification email could not be sent. Please use 'Resend code' to try again.",
        }),
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error("signup error", { error: String(err), stack: (err as Error).stack });
    return NextResponse.json(
      { error: "Signup failed. Please try again." },
      { status: 500 }
    );
  }
}
