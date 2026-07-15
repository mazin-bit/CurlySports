import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { optionalAuth } from "@/lib/auth";
import { ensureChallengeTables } from "@/lib/ensure-challenge-tables";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/challenges/[id] — Challenge detail                        */
/* ------------------------------------------------------------------ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureChallengeTables();

    const { id } = await params;

    // Fetch challenge
    const challengeRows: Record<string, unknown>[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM prediction_challenges WHERE id = $1`,
      id
    );

    if (challengeRows.length === 0) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const challenge = challengeRows[0];

    // Get vote counts per team
    const voteCounts: { selectedTeam: string; count: bigint }[] =
      await prisma.$queryRawUnsafe(
        `SELECT "selectedTeam", COUNT(*)::int as count
         FROM challenge_votes
         WHERE "challengeId" = $1
         GROUP BY "selectedTeam"`,
        id
      );

    const teamAVotes = Number(
      voteCounts.find((v) => v.selectedTeam === "teamA")?.count ?? 0
    );
    const teamBVotes = Number(
      voteCounts.find((v) => v.selectedTeam === "teamB")?.count ?? 0
    );

    // If user is logged in, get their vote + entries
    const user = await optionalAuth();
    let userVote: Record<string, unknown> | null = null;
    let userEntries: Record<string, unknown> | null = null;
    let userWon = false;

    if (user) {
      const voteRows: Record<string, unknown>[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM challenge_votes WHERE "challengeId" = $1 AND "userId" = $2`,
        id,
        user.id
      );
      userVote = voteRows[0] ?? null;

      const entryRows: Record<string, unknown>[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM challenge_entries WHERE "challengeId" = $1 AND "userId" = $2`,
        id,
        user.id
      );
      userEntries = entryRows[0] ?? null;

      // Check if user is a winner (if challenge is settled)
      if (challenge.status === "settled") {
        const winnerRows: Record<string, unknown>[] = await prisma.$queryRawUnsafe(
          `SELECT id FROM challenge_winners WHERE "challengeId" = $1 AND "userId" = $2`,
          id,
          user.id
        );
        userWon = winnerRows.length > 0;
      }
    }

    // Get leaderboard top 10
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
       ORDER BY ce."totalEntries" DESC
       LIMIT 10`,
      id
    );

    // Add rank
    const rankedLeaderboard = leaderboard.map((entry, idx) => ({
      rank: idx + 1,
      ...entry,
    }));

    // Get winners (if challenge is settled)
    let winners: Record<string, unknown>[] = [];
    if (challenge.status === "settled") {
      winners = await prisma.$queryRawUnsafe(
        `SELECT
           cw."userId",
           cw.entries,
           cw."drawnAt",
           u.username,
           u.avatar
         FROM challenge_winners cw
         LEFT JOIN users u ON u.id = cw."userId"
         WHERE cw."challengeId" = $1
         ORDER BY cw.entries DESC`,
        id
      );
    }

    return NextResponse.json(
      {
        challenge: {
          ...challenge,
          teamAVotes,
          teamBVotes,
        },
        userVote,
        userEntries,
        userWon,
        leaderboard: rankedLeaderboard,
        winners,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[GET /api/challenges/[id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch challenge details" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
