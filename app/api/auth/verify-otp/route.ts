import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/jwt";
import { parseBody, verifyOtpSchema } from "@/lib/validation";
import { rateLimiters } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = await rateLimiters.auth(req);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(verifyOtpSchema, body);
  if (!parsed.success) return parsed.response;

  const { email, otp } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return NextResponse.json({ error: "Invalid code." }, { status: 400 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }

  if (!user.otpHash) {
    return NextResponse.json(
      { error: "No verification code pending. Please request a new one." },
      { status: 400 }
    );
  }

  if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 },
    });
    return NextResponse.json(
      { error: "Code expired. Please request a new one." },
      { status: 400 }
    );
  }

  if (user.otpAttempts >= 5) {
    await prisma.user.update({
      where: { id: user.id },
      data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 },
    });
    return NextResponse.json(
      { error: "Too many attempts. Please request a new code." },
      { status: 400 }
    );
  }

  const valid = await verifyOtp(otp, user.otpHash);
  if (!valid) {
    const newAttempts = user.otpAttempts + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: { otpAttempts: newAttempts },
    });
    const remaining = 5 - newAttempts;
    return NextResponse.json(
      { error: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` },
      { status: 400 }
    );
  }

  // OTP is valid — verify user and log them in
  const verified = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
      otpSentAt: null,
    },
  });

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(verified),
    signRefreshToken(verified.id),
  ]);

  const response = NextResponse.json({
    success: true,
    user: {
      id: verified.id,
      email: verified.email,
      username: verified.username,
      name: verified.name,
      avatar: verified.avatar,
    },
  });

  return setAuthCookies(response, accessToken, refreshToken);
}
