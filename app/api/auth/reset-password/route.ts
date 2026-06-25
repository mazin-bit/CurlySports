import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { verifyToken, signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { token, password } = body as { token?: string; password?: string };

  if (!token || !password) {
    return NextResponse.json(
      { error: "Token and password are required." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const payload = await verifyToken(token);
  if (!payload || payload.purpose !== "reset" || !payload.email) {
    return NextResponse.json(
      { error: "Invalid or expired reset link." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Account not found." },
      { status: 404 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(updated),
    signRefreshToken(updated.id),
  ]);

  const response = NextResponse.json({ success: true });
  return setAuthCookies(response, accessToken, refreshToken);
}
