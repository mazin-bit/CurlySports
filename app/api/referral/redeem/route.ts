import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ensureChallengeTables, ensureNotificationsTable, cuid } from "@/lib/ensure-challenge-tables";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/referral/redeem — Check if user already redeemed a code   */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const rows: { referredBy: string | null }[] = await prisma.$queryRawUnsafe(
      `SELECT "referredBy" FROM users WHERE id = $1`,
      user.id
    );
    const redeemed = rows.length > 0 && !!rows[0].referredBy;

    return NextResponse.json({ redeemed });
  } catch {
    return NextResponse.json({ redeemed: false });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/referral/redeem — Redeem a referral code after signup    */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    await ensureChallengeTables();

    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!code) {
      return NextResponse.json(
        { error: "Please enter a referral code." },
        { status: 400 }
      );
    }

    // Check if user was already referred
    const alreadyReferred: { referredBy: string | null }[] = await prisma.$queryRawUnsafe(
      `SELECT "referredBy" FROM users WHERE id = $1`,
      user.id
    );
    if (alreadyReferred.length > 0 && alreadyReferred[0].referredBy) {
      return NextResponse.json(
        { error: "You have already used a referral code." },
        { status: 409 }
      );
    }

    // Check if a referral record already exists for this user
    const existingReferral: { id: string }[] = await prisma.$queryRawUnsafe(
      `SELECT id FROM referrals WHERE "referredUserId" = $1 LIMIT 1`,
      user.id
    );
    if (existingReferral.length > 0) {
      return NextResponse.json(
        { error: "You have already used a referral code." },
        { status: 409 }
      );
    }

    // Look up the referral code
    const codeRows: { id: string; userId: string }[] = await prisma.$queryRawUnsafe(
      `SELECT id, "userId" FROM referral_codes WHERE code = $1 LIMIT 1`,
      code
    );

    if (codeRows.length === 0) {
      return NextResponse.json(
        { error: "Invalid referral code. Please check and try again." },
        { status: 404 }
      );
    }

    const refCode = codeRows[0];

    // Prevent self-referral
    if (refCode.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot use your own referral code." },
        { status: 400 }
      );
    }

    const referralId = cuid();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    // Create referral record
    await prisma.$executeRawUnsafe(
      `INSERT INTO referrals (id, "referrerUserId", "referredUserId", "referralCodeId", status, ip, "createdAt")
       VALUES ($1, $2, $3, $4, 'pending', $5, NOW())
       ON CONFLICT ("referredUserId") DO NOTHING`,
      referralId,
      refCode.userId,
      user.id,
      refCode.id,
      ip
    );

    // Set user's referredBy
    await prisma.$executeRawUnsafe(
      `UPDATE users SET "referredBy" = $1 WHERE id = $2`,
      refCode.userId,
      user.id
    );

    // Since the user is already logged in and (presumably) verified,
    // we can verify the referral immediately
    const userInfo: { emailVerified: boolean }[] = await prisma.$queryRawUnsafe(
      `SELECT "emailVerified" FROM users WHERE id = $1`,
      user.id
    );

    if (userInfo.length > 0 && userInfo[0].emailVerified) {
      // Verify immediately
      await prisma.$executeRawUnsafe(
        `UPDATE referrals SET status = 'verified', "verifiedAt" = NOW() WHERE id = $1`,
        referralId
      );

      // Increment referral_codes.totalReferrals
      await prisma.$executeRawUnsafe(
        `UPDATE referral_codes SET "totalReferrals" = "totalReferrals" + 1 WHERE id = $1`,
        refCode.id
      );

      // Grant referral entries for active challenges the referrer has voted on
      const activeEntries: { challengeId: string }[] = await prisma.$queryRawUnsafe(
        `SELECT cv."challengeId"
         FROM challenge_votes cv
         JOIN prediction_challenges pc ON pc.id = cv."challengeId"
         WHERE cv."userId" = $1 AND pc.status = 'active'`,
        refCode.userId
      );

      for (const entry of activeEntries) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO challenge_entries (id, "challengeId", "userId", "baseEntries", "referralEntries", "totalEntries", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, 0, 1, 1, NOW(), NOW())
           ON CONFLICT ("challengeId", "userId")
           DO UPDATE SET
             "referralEntries" = challenge_entries."referralEntries" + 1,
             "totalEntries" = challenge_entries."totalEntries" + 1,
             "updatedAt" = NOW()`,
          cuid(),
          entry.challengeId,
          refCode.userId
        );
      }

      if (activeEntries.length > 0) {
        await prisma.$executeRawUnsafe(
          `UPDATE referral_codes SET "totalEntries" = "totalEntries" + $1 WHERE id = $2`,
          activeEntries.length,
          refCode.id
        );
      }

      // Create notification for the referrer
      try {
        const entriesGranted = activeEntries.length;
        await ensureNotificationsTable();
        await prisma.$executeRawUnsafe(
          `INSERT INTO scheduled_notifications (id, title, body, "targetType", "targetUsers", "scheduledAt", status, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, 'user', ARRAY[$4]::TEXT[], NOW(), 'scheduled', NOW(), NOW())`,
          cuid(),
          "New Entry Earned!",
          `${user.username || "Someone"} joined using your referral code! You earned ${entriesGranted > 0 ? `+${entriesGranted} extra entr${entriesGranted === 1 ? "y" : "ies"}` : "a referral bonus"} for the prediction challenge.`,
          refCode.userId
        );
      } catch {
        // Non-critical
      }

      return NextResponse.json({
        success: true,
        message: "Referral code redeemed and verified! The referrer has been credited.",
        verified: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Referral code redeemed! It will be verified once your email is confirmed.",
      verified: false,
    });
  } catch (error) {
    console.error("[POST /api/referral/redeem]", error);
    return NextResponse.json(
      { error: "Failed to redeem referral code." },
      { status: 500 }
    );
  }
}
