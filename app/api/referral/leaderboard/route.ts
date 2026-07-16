import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureChallengeTables } from "@/lib/ensure-challenge-tables";
import { optionalAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/referral/leaderboard — Top 10 users by referrals          */
/* ------------------------------------------------------------------ */

interface LeaderboardRow {
  userId: string;
  username: string;
  avatar: string | null;
  totalReferrals: number;
  totalEntries: number;
}

// In-memory cache (15s TTL)
let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 15_000;

export async function GET() {
  try {
    // Return cached if fresh
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data, {
        headers: { "Cache-Control": "no-store", "X-Cache": "HIT" },
      });
    }

    await ensureChallengeTables();

    const auth = await optionalAuth();
    const currentUserId = auth?.user?.id ?? null;

    const rows = await prisma.$queryRawUnsafe<LeaderboardRow[]>(
      `SELECT
         rc."userId",
         u.username,
         u.avatar,
         rc."totalReferrals"::int AS "totalReferrals",
         COALESCE((
           SELECT SUM(ce."totalEntries")::int
           FROM challenge_entries ce
           WHERE ce."userId" = rc."userId"
         ), 0) AS "totalEntries"
       FROM referral_codes rc
       JOIN users u ON rc."userId" = u.id
       WHERE rc."totalReferrals" > 0
       ORDER BY rc."totalReferrals" DESC, "totalEntries" DESC
       LIMIT 10`
    );

    const entries = rows.map((row, idx) => ({
      rank: idx + 1,
      userId: row.userId,
      username: row.username,
      avatar: row.avatar,
      totalReferrals: Number(row.totalReferrals),
      totalEntries: Number(row.totalEntries),
      isCurrentUser: row.userId === currentUserId,
    }));

    const result = { entries };
    cache = { data: result, ts: Date.now() };

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store", "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("[GET /api/referral/leaderboard]", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard", entries: [] },
      { status: 500 }
    );
  }
}
