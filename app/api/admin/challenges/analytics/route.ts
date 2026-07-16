import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureChallengeTables } from "@/lib/ensure-challenge-tables";

export const dynamic = "force-dynamic";

/* ── Admin auth ─────────────────────────────────────────────────────── */
function authorize(req: NextRequest): boolean {
  const adminPw = process.env.ADMIN_PASSWORD;
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  return !!(adminPw && token === adminPw);
}

/* ── Interfaces ─────────────────────────────────────────────────────── */
interface CountRow {
  count: bigint;
}

interface TeamVoteRow {
  selectedTeam: string;
  count: bigint;
}

interface TopReferrerRow {
  referrerUserId: string;
  count: bigint;
  username: string | null;
}

interface PlatformRow {
  platform: string;
  count: bigint;
}

interface UserEntryRow {
  userId: string;
  username: string | null;
  email: string | null;
  baseEntries: number;
  referralEntries: number;
  totalEntries: number;
}

interface EntriesBreakdownRow {
  baseTotal: bigint;
  referralTotal: bigint;
  entriesTotal: bigint;
}

/* ── GET — Challenge analytics ──────────────────────────────────────── */
export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureChallengeTables();

    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get("challengeId");

    // ── Global stats ──────────────────────────────────────────────────
    const [totalChallengesResult, totalVotesResult, totalEntriesResult, totalReferralsResult] =
      await Promise.all([
        prisma.$queryRawUnsafe<CountRow[]>(
          `SELECT COUNT(*) AS count FROM prediction_challenges`
        ),
        prisma.$queryRawUnsafe<CountRow[]>(
          `SELECT COUNT(*) AS count FROM challenge_votes`
        ),
        prisma.$queryRawUnsafe<CountRow[]>(
          `SELECT COALESCE(SUM("totalEntries"), 0) AS count FROM challenge_entries`
        ),
        prisma.$queryRawUnsafe<CountRow[]>(
          `SELECT COUNT(*) AS count FROM referrals`
        ),
      ]);

    const global = {
      totalChallenges: Number(totalChallengesResult[0].count),
      totalVotes: Number(totalVotesResult[0].count),
      totalEntries: Number(totalEntriesResult[0].count),
      totalReferrals: Number(totalReferralsResult[0].count),
    };

    // ── Per-challenge stats (if challengeId provided) ──────────────────
    let challenge = null;

    if (challengeId) {
      // Votes by team (pie chart data)
      const teamVotes = await prisma.$queryRawUnsafe<TeamVoteRow[]>(
        `SELECT "selectedTeam", COUNT(*) AS count
         FROM challenge_votes WHERE "challengeId" = $1
         GROUP BY "selectedTeam"`,
        challengeId
      );

      const votesByTeam: Record<string, number> = {};
      for (const row of teamVotes) {
        votesByTeam[row.selectedTeam] = Number(row.count);
      }

      // Entries breakdown
      const entriesBreakdown = await prisma.$queryRawUnsafe<EntriesBreakdownRow[]>(
        `SELECT
           COALESCE(SUM("baseEntries"), 0) AS "baseTotal",
           COALESCE(SUM("referralEntries"), 0) AS "referralTotal",
           COALESCE(SUM("totalEntries"), 0) AS "entriesTotal"
         FROM challenge_entries WHERE "challengeId" = $1`,
        challengeId
      );

      const breakdown = entriesBreakdown[0] || { baseTotal: 0, referralTotal: 0, entriesTotal: 0 };

      // Top referrers for this challenge's voters
      const topReferrers = await prisma.$queryRawUnsafe<TopReferrerRow[]>(
        `SELECT r."referrerUserId", COUNT(*) AS count, u.username
         FROM referrals r
         LEFT JOIN users u ON u.id = r."referrerUserId"
         WHERE r.status = 'verified'
           AND r."referrerUserId" IN (
             SELECT "userId" FROM challenge_votes WHERE "challengeId" = $1
           )
         GROUP BY r."referrerUserId", u.username
         ORDER BY count DESC
         LIMIT 10`,
        challengeId
      );

      // Platform breakdown of voters (from user_sessions if available)
      let platformBreakdown: Record<string, number> = {};
      try {
        const platforms = await prisma.$queryRawUnsafe<PlatformRow[]>(
          `SELECT s.platform, COUNT(DISTINCT s."userId") AS count
           FROM user_sessions s
           WHERE s."userId" IN (
             SELECT "userId" FROM challenge_votes WHERE "challengeId" = $1
           )
           GROUP BY s.platform`,
          challengeId
        );

        for (const row of platforms) {
          platformBreakdown[row.platform] = Number(row.count);
        }
      } catch {
        // user_sessions table may not exist
        platformBreakdown = { web: 0, ios: 0, android: 0 };
      }

      // Per-user entry breakdown (all users with entries for this challenge)
      const userEntries = await prisma.$queryRawUnsafe<UserEntryRow[]>(
        `SELECT ce."userId", u.username, u.email,
                ce."baseEntries", ce."referralEntries", ce."totalEntries"
         FROM challenge_entries ce
         LEFT JOIN users u ON u.id = ce."userId"
         WHERE ce."challengeId" = $1 AND ce."totalEntries" > 0
         ORDER BY ce."totalEntries" DESC
         LIMIT 50`,
        challengeId
      );

      challenge = {
        challengeId,
        votesByTeam,
        entriesBreakdown: {
          baseEntries: Number(breakdown.baseTotal),
          referralEntries: Number(breakdown.referralTotal),
          totalEntries: Number(breakdown.entriesTotal),
        },
        topReferrers: topReferrers.map(r => ({
          userId: r.referrerUserId,
          username: r.username,
          referralCount: Number(r.count),
        })),
        platformBreakdown,
        userEntries: userEntries.map(u => ({
          userId: u.userId,
          username: u.username ?? "Unknown",
          email: u.email ?? "",
          baseEntries: Number(u.baseEntries),
          referralEntries: Number(u.referralEntries),
          totalEntries: Number(u.totalEntries),
        })),
      };
    }

    return NextResponse.json({ global, challenge });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to fetch analytics", debug: msg }, { status: 500 });
  }
}
