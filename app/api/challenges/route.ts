import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, optionalAuth } from "@/lib/auth";
import { ensureChallengeTables, cuid } from "@/lib/ensure-challenge-tables";

export const dynamic = "force-dynamic";

// Pre-warm table creation at module load (non-blocking)
const tablesReady = ensureChallengeTables().catch(() => {});

// In-memory cache (faster than remote Redis for frequently-hit routes)
const memCache = new Map<string, { data: unknown; expires: number }>();
function memGet<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (!entry || Date.now() > entry.expires) { memCache.delete(key); return null; }
  return entry.data as T;
}
function memSet(key: string, data: unknown, ttlSec: number) {
  memCache.set(key, { data, expires: Date.now() + ttlSec * 1000 });
}

/* ------------------------------------------------------------------ */
/*  GET /api/challenges — List challenges                              */
/* ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const status = url.searchParams.get("status");
    const sport = url.searchParams.get("sport");
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20", 10), 1), 100);
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);

    // Wait for pre-warmed tables + auth in parallel
    const [, user] = await Promise.all([
      tablesReady,
      optionalAuth(),
    ]);

    // In-memory cache for challenge list (keyed by query params)
    const cacheKey = `challenges:${status || "all"}:${sport || "all"}:${limit}:${offset}`;
    let challenges: Record<string, unknown>[] | null = null;
    let total = 0;

    const cached = memGet<{ challenges: Record<string, unknown>[]; total: number }>(cacheKey);
    if (cached) {
      challenges = cached.challenges;
      total = cached.total;
    } else {
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

      // Combined count + select in a single query using window function
      const rows: (Record<string, unknown> & { _total: number })[] = await prisma.$queryRawUnsafe(
        `SELECT pc.*, COUNT(*) OVER()::int AS _total
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

      total = rows.length > 0 ? Number(rows[0]._total) : 0;
      challenges = rows.map(({ _total, ...rest }) => rest);

      // Cache for 60 seconds in-memory (challenges don't change often)
      memSet(cacheKey, { challenges, total }, 60);
    }

    // If user is logged in, fetch their votes for these challenges
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
    const [, auth, body] = await Promise.all([
      tablesReady,
      requireAuth(),
      req.json(),
    ]);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

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

    // Validate challenge + check existing vote in parallel
    const [challengeRows, existingVote] = await Promise.all([
      prisma.$queryRawUnsafe(
        `SELECT id, status, "matchDate" FROM prediction_challenges WHERE id = $1`,
        challengeId
      ) as Promise<Record<string, unknown>[]>,
      prisma.$queryRawUnsafe(
        `SELECT id FROM challenge_votes WHERE "challengeId" = $1 AND "userId" = $2`,
        challengeId,
        user.id
      ) as Promise<Record<string, unknown>[]>,
    ]);

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

    if (existingVote.length > 0) {
      return NextResponse.json(
        { error: "You have already voted on this challenge" },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Create vote + entry + update challenge counts in parallel
    const voteId = cuid();
    const entryId = cuid();

    // Insert vote
    const insertVote = prisma.$executeRawUnsafe(
      `INSERT INTO challenge_votes (id, "challengeId", "userId", "selectedTeam", entries, "createdAt")
       VALUES ($1, $2, $3, $4, 0, NOW())`,
      voteId, challengeId, user.id, selectedTeam
    );

    // Upsert entry row (1 base entry for voting)
    const upsertEntry = prisma.$executeRawUnsafe(
      `INSERT INTO challenge_entries (id, "challengeId", "userId", "baseEntries", "referralEntries", "totalEntries", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 1, 0, 1, NOW(), NOW())
       ON CONFLICT ("challengeId", "userId") DO UPDATE SET
         "baseEntries" = GREATEST(challenge_entries."baseEntries", 1),
         "totalEntries" = GREATEST(challenge_entries."baseEntries", 1) + challenge_entries."referralEntries",
         "updatedAt" = NOW()`,
      entryId, challengeId, user.id
    );

    // Increment both totalVotes and totalEntries in one query
    const updateChallenge = prisma.$executeRawUnsafe(
      `UPDATE prediction_challenges SET "totalVotes" = "totalVotes" + 1, "totalEntries" = "totalEntries" + 1, "updatedAt" = NOW() WHERE id = $1`,
      challengeId
    );

    await Promise.all([insertVote, upsertEntry, updateChallenge]);

    // Invalidate challenge list cache so next GET returns fresh data
    for (const key of memCache.keys()) {
      if (key.startsWith("challenges:")) memCache.delete(key);
    }

    const vote = {
      id: voteId,
      challengeId,
      userId: user.id,
      selectedTeam,
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
