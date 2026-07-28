import { NextResponse, type NextRequest } from "next/server";
import { cacheGet, cacheDel } from "@/lib/redis";
import { jwtVerify } from "jose";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

/**
 * POST /api/auth/exchange-otc
 *
 * Exchanges a one-time code (OTC) from the OAuth callback for user data
 * and a Supabase magic-link token so the native app can establish a session.
 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    // Look up the OTC in Redis
    const cached = await cacheGet<string>(`auth:otc:${code}`);
    if (!cached) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 401 }
      );
    }

    // Delete the OTC so it can't be reused
    await cacheDel(`auth:otc:${code}`);

    const { accessToken, refreshToken, redirect } = JSON.parse(
      typeof cached === "string" ? cached : JSON.stringify(cached)
    );

    // Decode the JWT to get user info
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET ??
        (process.env.NODE_ENV === "production"
          ? ""
          : "dev-secret-change-in-production")
    );

    let userEmail = "";
    let userName = "";
    let userAvatar = "";
    let userId = "";

    try {
      const { payload } = await jwtVerify(accessToken, secret);
      userEmail = (payload as any).email || "";
      userName = (payload as any).name || "";
      userAvatar = (payload as any).avatar || "";
      userId = (payload as any).sub || "";
    } catch {
      return NextResponse.json(
        { error: "Invalid token in OTC" },
        { status: 401 }
      );
    }

    // Ensure the user exists in Supabase and generate a magic link token
    let supabaseTokenHash: string | null = null;

    try {
      // Try to create the user in Supabase (will fail if exists, that's fine)
      await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        user_metadata: { name: userName, avatar_url: userAvatar },
      }).catch(() => {});

      // Generate a magic link for the user — this gives us a token_hash
      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: userEmail,
        });

      if (!linkError && linkData?.properties?.hashed_token) {
        supabaseTokenHash = linkData.properties.hashed_token;
      }
    } catch (err) {
      logger.error("Failed to generate Supabase session for native app", {
        error: String(err),
        email: userEmail,
      });
      // Non-fatal — the app can still use the custom JWT tokens
    }

    return NextResponse.json({
      accessToken,
      refreshToken,
      supabaseTokenHash,
      user: {
        id: userId,
        email: userEmail,
        name: userName,
        avatar: userAvatar,
      },
      redirect,
    });
  } catch (err) {
    logger.error("exchange-otc failed", { error: String(err) });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
