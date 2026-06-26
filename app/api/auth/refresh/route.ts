import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyToken,
  getRefreshTokenFromCookies,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from "@/lib/jwt";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    const refreshToken = await getRefreshTokenFromCookies();
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const payload = await verifyToken(refreshToken);
    if (!payload || payload.purpose !== "refresh" || !payload.sub) {
      const res = NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
      return clearAuthCookies(res);
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, username: true, name: true, avatar: true },
    });

    if (!user) {
      const res = NextResponse.json({ error: "User not found" }, { status: 401 });
      return clearAuthCookies(res);
    }

    // Issue new token pair
    const [newAccess, newRefresh] = await Promise.all([
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

    return setAuthCookies(response, newAccess, newRefresh);
  } catch (err) {
    logger.error("token refresh error", { error: String(err) });
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
