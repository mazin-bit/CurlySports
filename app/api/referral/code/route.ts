import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  ensureChallengeTables,
  generateReferralCode,
  cuid,
} from "@/lib/ensure-challenge-tables";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/referral/code — Get or create user's referral code        */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    await ensureChallengeTables();

    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    // Check if user already has a referral code
    const existing: { code: string }[] = await prisma.$queryRawUnsafe(
      `SELECT code FROM referral_codes WHERE "userId" = $1`,
      user.id
    );

    if (existing.length > 0) {
      const code = existing[0].code;
      return NextResponse.json(
        {
          code,
          link: `https://curlysports.com/invite/${code}`,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Generate a new code with collision check (up to 10 attempts)
    let code: string = "";
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      code = generateReferralCode(user.username);
      const collision: { id: string }[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM referral_codes WHERE code = $1`,
        code
      );
      if (collision.length === 0) break;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      // Fallback: append extra random chars
      code = generateReferralCode(user.username) + Math.random().toString(36).slice(2, 5).toUpperCase();
    }

    // Insert the new referral code
    const id = cuid();
    await prisma.$executeRawUnsafe(
      `INSERT INTO referral_codes (id, "userId", code, "totalReferrals", "totalEntries", "createdAt")
       VALUES ($1, $2, $3, 0, 0, NOW())`,
      id,
      user.id,
      code
    );

    return NextResponse.json(
      {
        code,
        link: `https://curlysports.com/invite/${code}`,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    // Handle unique constraint (race condition — another request created the code)
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes("unique") || errMsg.includes("duplicate") || errMsg.includes("UNIQUE")) {
      // Fetch the code that was just created
      try {
        const auth = await requireAuth();
        if (auth instanceof NextResponse) return auth;
        const { user } = auth;

        const rows: { code: string }[] = await prisma.$queryRawUnsafe(
          `SELECT code FROM referral_codes WHERE "userId" = $1`,
          user.id
        );
        if (rows.length > 0) {
          return NextResponse.json(
            {
              code: rows[0].code,
              link: `https://curlysports.com/invite/${rows[0].code}`,
            },
            { headers: { "Cache-Control": "no-store" } }
          );
        }
      } catch {
        // Fall through to generic error
      }
    }

    console.error("[GET /api/referral/code]", error);
    return NextResponse.json(
      { error: "Failed to get referral code" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
