import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureChallengeTables } from "@/lib/ensure-challenge-tables";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/challenges/[id]/leaderboard — Full paginated leaderboard  */
/* ------------------------------------------------------------------ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureChallengeTables();

    const { id } = await params;
    const url = req.nextUrl;
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10), 1), 100);
    const offset = (page - 1) * limit;

    // Verify challenge exists
    const challengeRows: { id: string }[] = await prisma.$queryRawUnsafe(
      `SELECT id FROM prediction_challenges WHERE id = $1`,
      id
    );

    if (challengeRows.length === 0) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Get total participants
    const countResult: { count: bigint }[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM challenge_entries WHERE "challengeId" = $1`,
      id
    );
    const total = Number(countResult[0]?.count ?? 0);
    const pages = Math.max(Math.ceil(total / limit), 1);

    // Get leaderboard page ranked by totalEntries descending
    const leaderboard: Record<string, unknown>[] = await prisma.$queryRawUnsafe(
      `SELECT
         ce."userId",
         ce."baseEntries",
         ce."referralEntries",
         ce."totalEntries",
         u.username,
         u.avatar
       FROM challenge_entries ce
       LEFT JOIN users u ON u.id = ce."userId"
       WHERE ce."challengeId" = $1
       ORDER BY ce."totalEntries" DESC, ce."createdAt" ASC
       LIMIT $2 OFFSET $3`,
      id,
      limit,
      offset
    );

    // Add rank (offset-aware)
    const rankedLeaderboard = leaderboard.map((entry, idx) => ({
      rank: offset + idx + 1,
      userId: entry.userId,
      username: entry.username,
      avatar: entry.avatar,
      baseEntries: entry.baseEntries,
      referralEntries: entry.referralEntries,
      totalEntries: entry.totalEntries,
    }));

    return NextResponse.json(
      {
        leaderboard: rankedLeaderboard,
        total,
        page,
        pages,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[GET /api/challenges/[id]/leaderboard]", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
