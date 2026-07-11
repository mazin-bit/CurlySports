import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendEmail } from "@/lib/email";
import { buildOtpEmail, getMascotAttachment } from "@/lib/email-templates";
import { parseBody, signupSchema } from "@/lib/validation";
import { rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";


export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimiters.auth(req);
    if (limited) return limited;

    const body = await req.json().catch(() => ({}));

    const parsed = parseBody(signupSchema, body);
    if (!parsed.success) return parsed.response;
    const { email, password, username } = parsed.data;

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
