import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import prisma from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/jwt";
import { rateLimit } from "@/lib/rate-limit";
import { optionalAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per minute per IP
  const limited = await rateLimit(req, { name: "phone-auth", tokens: 5, window: "1m" });
  if (limited) return limited;

  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    // Verify Firebase ID token using Google's public certs (no service account needed)
    const decoded = await verifyFirebaseIdToken(idToken);
    const phoneNumber = decoded.phone_number;
    if (!phoneNumber) {
      return NextResponse.json({ error: "No phone number in token" }, { status: 400 });
    }

    // Check if user is already authenticated (linking phone to existing account)
    const existingAuthUser = await optionalAuth();

    if (existingAuthUser) {
      // User is logged in — link phone to their existing account
      const phoneUser = await prisma.user.findFirst({ where: { phone: phoneNumber } });
      if (phoneUser && phoneUser.id !== existingAuthUser.id) {
        return NextResponse.json(
          { error: "This phone number is already linked to another account." },
          { status: 409 }
        );
      }

      const user = await prisma.user.update({
        where: { id: existingAuthUser.id },
        data: {
          phone: phoneNumber,
          phoneVerified: true,
          firebaseUid: decoded.uid,
        },
      });

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          avatar: user.avatar,
          phone: user.phone,
          phoneVerified: true,
        },
      });
    }

    // Not authenticated — find or create user by phone number
    let user = await prisma.user.findFirst({ where: { phone: phoneNumber } });

    if (!user) {
      // New user — create account with phone
      user = await prisma.user.create({
        data: {
          email: `phone_${Date.now()}@curlysports.app`, // placeholder email
          phone: phoneNumber,
          phoneVerified: true,
          firebaseUid: decoded.uid,
          username: `user_${Date.now().toString(36)}`,
        },
      });
    } else {
      // Existing user — update phone verification + Firebase UID
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerified: true,
          firebaseUid: decoded.uid,
        },
      });
    }

    // Issue JWT tokens
    const accessToken = await signAccessToken(user);
    const refreshToken = await signRefreshToken(user.id);
    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        phone: user.phone,
        phoneVerified: true,
      },
    });
    setAuthCookies(res, accessToken, refreshToken);
    return res;
  } catch (err: unknown) {
    console.error("[verify-phone] Error:", err);
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
