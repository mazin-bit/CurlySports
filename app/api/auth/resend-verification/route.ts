import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendEmail } from "@/lib/email";
import { buildOtpEmail, getMascotAttachment } from "@/lib/email-templates";
import { rateLimiters, rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const limited = await rateLimiters.auth(req);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const { email } = body as { email?: string };

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    // Don't reveal whether email exists
    return NextResponse.json({ success: true });
  }

  if (user.emailVerified) {
    return NextResponse.json({ error: "Email is already verified." }, { status: 400 });
  }

  // Per-email rate limit: max 3 OTP resends per hour
  const resendLimited = await rateLimit(req, {
    name: "otp-resend",
    tokens: 3,
    window: "1h",
    identifier: normalizedEmail,
  });
  if (resendLimited) return resendLimited;

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
    attachments: [getMascotAttachment()],
  }).catch((err) =>
    logger.error("resend otp email failed", { email: user.email, error: String(err) })
  );

  return NextResponse.json({ success: true });
}
