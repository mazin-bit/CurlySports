import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureChallengeTables, cuid } from "@/lib/ensure-challenge-tables";

export const dynamic = "force-dynamic";

/* ── Interfaces ─────────────────────────────────────────────────────── */
interface PendingReferralRow {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referralCodeId: string;
  ip: string | null;
}

interface UserRow {
  id: string;
  email: string | null;
  emailVerified: boolean;
  hasSession: boolean;
}

interface IpCountRow {
  count: bigint;
}

interface ChallengeEntryRow {
  challengeId: string;
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
      `SELECT id, "referrerUserId", "referredUserId", "referralCodeId", ip
       FROM referrals
       WHERE status = 'pending' AND "createdAt" < $1`,
      cutoff
    );

    let verified = 0;
    let rejected = 0;
    let ipAbuse = 0;

    for (const referral of pending) {
      /* ── Bug 3: IP-based anti-abuse check ───────────────────────── */
      // Reject if the same IP was used for more than 3 referral signups
      if (referral.ip) {
        const ipCounts = await prisma.$queryRawUnsafe<IpCountRow[]>(
          `SELECT COUNT(*)::bigint AS count FROM referrals
           WHERE ip = $1 AND status IN ('pending', 'verified')`,
          referral.ip
        );
        if (ipCounts.length > 0 && Number(ipCounts[0].count) > 3) {
          await prisma.$executeRawUnsafe(
            `UPDATE referrals SET status = 'rejected' WHERE id = $1`,
            referral.id
          );
          rejected++;
          ipAbuse++;
          continue;
        }
      }

      /* ── Bug 1 & 2: Check user with session existence + emailVerified ── */
      // Instead of selecting non-existent lastLoginAt, check if the user
      // has at least one row in user_sessions (meaning they logged in).
      const users = await prisma.$queryRawUnsafe<UserRow[]>(
        `SELECT u.id, u.email, u."emailVerified",
                EXISTS(SELECT 1 FROM user_sessions us WHERE us."userId" = u.id) AS "hasSession"
         FROM users u
         WHERE u.id = $1`,
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

      // Check: user has email, email is verified, and has logged in at least once
      const isValid =
        user.email !== null &&
        user.emailVerified === true &&
        user.hasSession === true;

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

        /* ── Bug 4: Grant referral entries for active challenges ───── */
        // Find all active challenges where the referrer has voted correctly
        const activeEntries = await prisma.$queryRawUnsafe<ChallengeEntryRow[]>(
          `SELECT cv."challengeId"
           FROM challenge_votes cv
           JOIN prediction_challenges pc ON pc.id = cv."challengeId"
           WHERE cv."userId" = $1 AND pc.status = 'active'`,
          referral.referrerUserId
        );

        for (const entry of activeEntries) {
          // Upsert challenge_entries: increment referralEntries and totalEntries
          await prisma.$executeRawUnsafe(
            `INSERT INTO challenge_entries (id, "challengeId", "userId", "baseEntries", "referralEntries", "totalEntries", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT ("challengeId", "userId")
             DO UPDATE SET
               "referralEntries" = challenge_entries."referralEntries" + 1,
               "totalEntries" = challenge_entries."totalEntries" + 1,
               "updatedAt" = CURRENT_TIMESTAMP`,
            cuid(),
            entry.challengeId,
            referral.referrerUserId
          );
        }

        // Increment referral_codes.totalEntries by the number of challenges affected
        if (activeEntries.length > 0) {
          await prisma.$executeRawUnsafe(
            `UPDATE referral_codes SET "totalEntries" = "totalEntries" + $1 WHERE id = $2`,
            activeEntries.length,
            referral.referralCodeId
          );
        }

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
      ipAbuse,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to verify referrals", debug: msg }, { status: 500 });
  }
}
