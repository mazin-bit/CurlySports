import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }

  const payload = await verifyToken(token);
  if (!payload || payload.purpose !== "verify" || !payload.email) {
    return NextResponse.json(
      { error: "Invalid or expired verification link." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(updated),
    signRefreshToken(updated.id),
  ]);

  const response = NextResponse.json({ success: true });
  return setAuthCookies(response, accessToken, refreshToken);
}
