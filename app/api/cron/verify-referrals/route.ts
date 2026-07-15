import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureChallengeTables } from "@/lib/ensure-challenge-tables";

export const dynamic = "force-dynamic";

/* ── Interfaces ─────────────────────────────────────────────────────── */
interface PendingReferralRow {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referralCodeId: string;
}

interface UserRow {
  id: string;
  email: string | null;
  emailVerified: Date | null;
  lastLoginAt: Date | null;
}

/* ── GET — Cron job for referral verification ───────────────────────── */
export async function GET(req: NextRequest) {
  // Simple auth check: CRON_SECRET or ADMIN_PASSWORD
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  const cronSecret = process.env.CRON_SECRET;
  const adminPw = process.env.ADMIN_PASSWORD;

  if (token && (token === cronSecret || token === adminPw)) {
    // Authorized
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureChallengeTables();

    // Find referrals where status='pending' and createdAt < now - 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pending = await prisma.$queryRawUnsafe<PendingReferralRow[]>(
      `SELECT id, "referrerUserId", "referredUserId", "referralCodeId"
       FROM referrals
       WHERE status = 'pending' AND "createdAt" < $1`,
      cutoff
    );

    let verified = 0;
    let rejected = 0;

    for (const referral of pending) {
      // Check if referred user exists and meets criteria
      const users = await prisma.$queryRawUnsafe<UserRow[]>(
        `SELECT id, email, "emailVerified", "lastLoginAt" FROM users WHERE id = $1`,
        referral.referredUserId
      );

      if (users.length === 0) {
        // User doesn't exist — reject
        await prisma.$executeRawUnsafe(
          `UPDATE referrals SET status = 'rejected' WHERE id = $1`,
          referral.id
        );
        rejected++;
        continue;
      }

      const user = users[0];

      // Check: user exists, has email, has logged in at least once
      const isValid =
        user.email !== null &&
        user.lastLoginAt !== null;

      if (isValid) {
        // Verify the referral
        await prisma.$executeRawUnsafe(
          `UPDATE referrals SET status = 'verified', "verifiedAt" = CURRENT_TIMESTAMP WHERE id = $1`,
          referral.id
        );

        // Increment referral_codes.totalReferrals
        await prisma.$executeRawUnsafe(
          `UPDATE referral_codes SET "totalReferrals" = "totalReferrals" + 1 WHERE id = $1`,
          referral.referralCodeId
        );

        verified++;
      } else {
        // Reject
        await prisma.$executeRawUnsafe(
          `UPDATE referrals SET status = 'rejected' WHERE id = $1`,
          referral.id
        );
        rejected++;
      }
    }

    return NextResponse.json({
      processed: pending.length,
      verified,
      rejected,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to verify referrals", debug: msg }, { status: 500 });
  }
}
