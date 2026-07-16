import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureChallengeTables, cuid } from "@/lib/ensure-challenge-tables";
import { logger } from "@/lib/logger";

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

/* ── Reusable: verify a single pending referral ──────────────────────── */
export async function verifySingleReferral(referral: PendingReferralRow): Promise<"verified" | "rejected" | "ip_abuse" | "not_ready"> {
  // IP-based anti-abuse check
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
      return "ip_abuse";
    }
  }

  // Check user: email verified + has logged in
  const users = await prisma.$queryRawUnsafe<UserRow[]>(
    `SELECT u.id, u.email, u."emailVerified",
            EXISTS(SELECT 1 FROM user_sessions us WHERE us."userId" = u.id) AS "hasSession"
     FROM users u
     WHERE u.id = $1`,
    referral.referredUserId
  );

  if (users.length === 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE referrals SET status = 'rejected' WHERE id = $1`,
      referral.id
    );
    return "rejected";
  }

  const user = users[0];
  const isValid =
    user.email !== null &&
    user.emailVerified === true &&
    user.hasSession === true;

  if (!isValid) return "not_ready";

  // Verify the referral
  await prisma.$executeRawUnsafe(
    `UPDATE referrals SET status = 'verified', "verifiedAt" = NOW() WHERE id = $1`,
    referral.id
  );

  // Increment referral_codes.totalReferrals
  await prisma.$executeRawUnsafe(
    `UPDATE referral_codes SET "totalReferrals" = "totalReferrals" + 1 WHERE id = $1`,
    referral.referralCodeId
  );

  // Grant referral entries for active challenges the referrer has voted on
  const activeEntries = await prisma.$queryRawUnsafe<ChallengeEntryRow[]>(
    `SELECT cv."challengeId"
     FROM challenge_votes cv
     JOIN prediction_challenges pc ON pc.id = cv."challengeId"
     WHERE cv."userId" = $1 AND pc.status = 'active'`,
    referral.referrerUserId
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
      referral.referrerUserId
    );
  }

  if (activeEntries.length > 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE referral_codes SET "totalEntries" = "totalEntries" + $1 WHERE id = $2`,
      activeEntries.length,
      referral.referralCodeId
    );
  }

  // Create notification for the referrer
  try {
    const referredUser = await prisma.$queryRawUnsafe<{ username: string }[]>(
      `SELECT username FROM users WHERE id = $1`,
      referral.referredUserId
    );
    const referredName = referredUser[0]?.username || "Someone";
    const entriesGranted = activeEntries.length;

    await prisma.$executeRawUnsafe(
      `INSERT INTO scheduled_notifications (id, title, body, "targetType", "targetUsers", "scheduledAt", status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'user', ARRAY[$4]::TEXT[], NOW(), 'scheduled', NOW(), NOW())`,
      cuid(),
      "New Entry Earned!",
      `${referredName} joined using your referral code! You earned ${entriesGranted > 0 ? `+${entriesGranted} extra entr${entriesGranted === 1 ? "y" : "ies"}` : "a referral bonus"} for the prediction challenge.`,
      referral.referrerUserId
    );
  } catch {
    // Non-critical — don't fail the verification for a notification error
  }

  return "verified";
}

/* ── Reusable: verify pending referrals for a specific referred user ── */
export async function verifyReferralsForUser(referredUserId: string) {
  try {
    await ensureChallengeTables();

    const pending = await prisma.$queryRawUnsafe<PendingReferralRow[]>(
      `SELECT id, "referrerUserId", "referredUserId", "referralCodeId", ip
       FROM referrals
       WHERE status = 'pending' AND "referredUserId" = $1`,
      referredUserId
    );

    let verified = 0;
    for (const referral of pending) {
      const result = await verifySingleReferral(referral);
      if (result === "verified") verified++;
    }

    if (verified > 0) {
      logger.info("instant referral verification", { referredUserId, verified });
    }

    return verified;
  } catch (err) {
    logger.error("instant referral verification failed", { referredUserId, error: String(err) });
    return 0;
  }
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

    // Reduced from 24h to 5 minutes — the login trigger handles instant verification,
    // this cron catches any stragglers
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);

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
      const result = await verifySingleReferral(referral);
      switch (result) {
        case "verified": verified++; break;
        case "ip_abuse": rejected++; ipAbuse++; break;
        case "rejected": rejected++; break;
        case "not_ready":
          // Still not ready after 5 min cutoff — reject
          await prisma.$executeRawUnsafe(
            `UPDATE referrals SET status = 'rejected' WHERE id = $1`,
            referral.id
          );
          rejected++;
          break;
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
