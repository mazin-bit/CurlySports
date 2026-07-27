import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureChallengeTables } from "@/lib/ensure-challenge-tables";
import { optionalAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/referral/leaderboard — Paginated users by referrals       */
/*  Query params:                                                      */
/*    limit  — max rows (default 10, 0 = all)                          */
/*    offset — skip rows (default 0)                                   */
/* ------------------------------------------------------------------ */

interface LeaderboardRow {
  userId: string;
  username: string;
  avatar: string | null;
  totalReferrals: number;
  totalEntries: number;
}

interface CountRow {
  count: number;
}

// In-memory cache keyed by limit+offset (15s TTL)
const cacheMap = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 15_000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get("limit") ?? "10", 10);
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));
    const limit = Math.max(0, Number.isFinite(limitParam) ? limitParam : 10);

    const cacheKey = `${limit}:${offset}`;

    // Return cached if fresh
    const cached = cacheMap.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: { "Cache-Control": "no-store", "X-Cache": "HIT" },
      });
    }

    await ensureChallengeTables();

    const auth = await optionalAuth();
    const currentUserId = auth?.id ?? null;

    // Get total count of users with referrals
    const countRows = await prisma.$queryRawUnsafe<CountRow[]>(
      `SELECT COUNT(*)::int AS count
       FROM referral_codes rc
       WHERE rc."totalReferrals" > 0`
    );
    const total = countRows[0]?.count ?? 0;

    // Build paginated query
    const limitClause = limit > 0 ? `LIMIT ${limit}` : "";
    const offsetClause = offset > 0 ? `OFFSET ${offset}` : "";

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
       ${limitClause} ${offsetClause}`
    );

    const leaderboard = rows.map((row, idx) => ({
      rank: offset + idx + 1,
      userId: row.userId,
      username: row.username,
      avatar: row.avatar,
      totalReferrals: Number(row.totalReferrals),
      totalEntries: Number(row.totalEntries),
      isCurrentUser: row.userId === currentUserId,
    }));

    const hasMore =
      limit > 0 ? offset + leaderboard.length < total : false;

    const result = { leaderboard, total, hasMore };
    cacheMap.set(cacheKey, { data: result, ts: Date.now() });

    // Evict stale cache entries
    for (const [key, entry] of cacheMap) {
      if (Date.now() - entry.ts >= CACHE_TTL) cacheMap.delete(key);
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store", "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("[GET /api/referral/leaderboard]", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard", leaderboard: [], total: 0, hasMore: false },
      { status: 500 }
    );
  }
}
