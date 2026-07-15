import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, optionalAuth } from "@/lib/auth";
import { ensureChallengeTables, cuid } from "@/lib/ensure-challenge-tables";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/challenges — List challenges                              */
/* ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  try {
    await ensureChallengeTables();

    const url = req.nextUrl;
    const status = url.searchParams.get("status");
    const sport = url.searchParams.get("sport");
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20", 10), 1), 100);
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);

    // Build WHERE clauses
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (status) {
      conditions.push(`pc.status = $${paramIdx++}`);
      params.push(status);
    }
    if (sport) {
      conditions.push(`pc.sport = $${paramIdx++}`);
      params.push(sport);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countResult: { count: bigint }[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM prediction_challenges pc ${where}`,
      ...params
    );
    const total = Number(countResult[0]?.count ?? 0);

    // Get challenges sorted: active first, then by matchDate ascending
    const challenges: Record<string, unknown>[] = await prisma.$queryRawUnsafe(
      `SELECT pc.*
       FROM prediction_challenges pc
       ${where}
       ORDER BY
         CASE WHEN pc.status = 'active' THEN 0 ELSE 1 END ASC,
         pc."matchDate" ASC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      ...params,
      limit,
      offset
    );

    // If user is logged in, fetch their votes for these challenges
    const user = await optionalAuth();
    let userVotes: Record<string, string> = {};

    if (user && challenges.length > 0) {
      const challengeIds = challenges.map((c) => c.id as string);
      const placeholders = challengeIds.map((_, i) => `$${i + 2}`).join(", ");

      const votes: { challengeId: string; selectedTeam: string }[] =
        await prisma.$queryRawUnsafe(
          `SELECT "challengeId", "selectedTeam"
           FROM challenge_votes
           WHERE "userId" = $1 AND "challengeId" IN (${placeholders})`,
          user.id,
          ...challengeIds
        );

      userVotes = Object.fromEntries(votes.map((v) => [v.challengeId, v.selectedTeam]));
    }

    // Attach userVote to each challenge
    const enriched = challenges.map((c) => ({
      ...c,
      userVote: userVotes[c.id as string] ?? null,
    }));

    return NextResponse.json(
      { challenges: enriched, total },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[GET /api/challenges]", error);
    return NextResponse.json(
      { error: "Failed to fetch challenges" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/challenges — Vote on a challenge                         */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    await ensureChallengeTables();

    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const body = await req.json();
    const { challengeId, selectedTeam } = body;

    // Validate input
    if (!challengeId || !selectedTeam) {
      return NextResponse.json(
        { error: "challengeId and selectedTeam are required" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }
    if (selectedTeam !== "teamA" && selectedTeam !== "teamB") {
      return NextResponse.json(
        { error: "selectedTeam must be 'teamA' or 'teamB'" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Validate challenge exists and is active
    const challengeRows: Record<string, unknown>[] = await prisma.$queryRawUnsafe(
      `SELECT id, status, "matchDate" FROM prediction_challenges WHERE id = $1`,
      challengeId
    );

    if (challengeRows.length === 0) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const challenge = challengeRows[0];
    if (challenge.status !== "active") {
      return NextResponse.json(
        { error: "Challenge is no longer active" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const matchDate = new Date(challenge.matchDate as string);
    if (matchDate <= new Date()) {
      return NextResponse.json(
        { error: "Voting has closed — match has already started" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Check if user already voted
    const existingVote: Record<string, unknown>[] = await prisma.$queryRawUnsafe(
      `SELECT id FROM challenge_votes WHERE "challengeId" = $1 AND "userId" = $2`,
      challengeId,
      user.id
    );

    if (existingVote.length > 0) {
      return NextResponse.json(
        { error: "You have already voted on this challenge" },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Create vote
    const voteId = cuid();
    await prisma.$executeRawUnsafe(
      `INSERT INTO challenge_votes (id, "challengeId", "userId", "selectedTeam", entries, "createdAt")
       VALUES ($1, $2, $3, $4, 1, NOW())`,
      voteId,
      challengeId,
      user.id,
      selectedTeam
    );

    // Increment totalVotes on the challenge
    await prisma.$executeRawUnsafe(
      `UPDATE prediction_challenges SET "totalVotes" = "totalVotes" + 1, "updatedAt" = NOW() WHERE id = $1`,
      challengeId
    );

    // Upsert challenge_entries (base entry for voting)
    await prisma.$executeRawUnsafe(
      `INSERT INTO challenge_entries (id, "challengeId", "userId", "baseEntries", "referralEntries", "totalEntries", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 1, 0, 1, NOW(), NOW())
       ON CONFLICT ("challengeId", "userId")
       DO UPDATE SET "baseEntries" = challenge_entries."baseEntries" + 1,
                     "totalEntries" = challenge_entries."totalEntries" + 1,
                     "updatedAt" = NOW()`,
      cuid(),
      challengeId,
      user.id
    );

    // Update totalEntries on the challenge
    await prisma.$executeRawUnsafe(
      `UPDATE prediction_challenges SET "totalEntries" = "totalEntries" + 1, "updatedAt" = NOW() WHERE id = $1`,
      challengeId
    );

    const vote = {
      id: voteId,
      challengeId,
      userId: user.id,
      selectedTeam,
      entries: 1,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      { success: true, vote },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    // Handle unique constraint violation (race condition double-vote)
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes("unique") || errMsg.includes("duplicate") || errMsg.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "You have already voted on this challenge" },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }
    console.error("[POST /api/challenges]", error);
    return NextResponse.json(
      { error: "Failed to submit vote" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
