import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureChallengeTables, cuid } from "@/lib/ensure-challenge-tables";

export const dynamic = "force-dynamic";

/* ── Admin auth ─────────────────────────────────────────────────────── */
function authorize(req: NextRequest): boolean {
  const adminPw = process.env.ADMIN_PASSWORD;
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  return !!(adminPw && token === adminPw);
}

/* ── Interfaces ─────────────────────────────────────────────────────── */
interface ChallengeRow {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  teamA: string;
  teamB: string;
  teamALogo: string | null;
  teamBLogo: string | null;
  matchId: string | null;
  matchDate: Date;
  sport: string;
  leagueId: string | null;
  status: string;
  result: string | null;
  winnerCount: number;
  prizeName: string | null;
  prizeValue: string | null;
  prizeImage: string | null;
  prizeDelivery: string | null;
  totalVotes: number;
  totalEntries: number;
  maxReferralEntries: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CountRow {
  count: bigint;
}

interface ChallengeWithStats extends ChallengeRow {
  correctPredictions: number;
}

/* ── GET — List all challenges with stats ───────────────────────────── */
export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureChallengeTables();

    const challenges = await prisma.$queryRawUnsafe<ChallengeRow[]>(
      `SELECT * FROM prediction_challenges ORDER BY "createdAt" DESC`
    );

    // Fetch stats per challenge
    const enriched: ChallengeWithStats[] = [];
    for (const ch of challenges) {
      const correctResult = await prisma.$queryRawUnsafe<CountRow[]>(
        `SELECT COUNT(*) AS count FROM challenge_votes WHERE "challengeId" = $1 AND "isCorrect" = true`,
        ch.id
      );
      enriched.push({
        ...ch,
        totalVotes: Number(ch.totalVotes),
        totalEntries: Number(ch.totalEntries),
        correctPredictions: Number(correctResult[0].count),
      });
    }

    return NextResponse.json({ challenges: enriched });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to list challenges", debug: msg }, { status: 500 });
  }
}

/* ── POST — Create new challenge ────────────────────────────────────── */
export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureChallengeTables();

    const body = await req.json();
    const {
      title, description, imageUrl,
      teamA, teamB, teamALogo, teamBLogo,
      matchId, matchDate, sport,
      leagueId, winnerCount, maxReferralEntries,
      prizeName, prizeValue, prizeImage, prizeDelivery,
    } = body;

    // Validate required fields
    if (!title || !teamA || !teamB || !matchDate) {
      return NextResponse.json(
        { error: "Missing required fields: title, teamA, teamB, matchDate" },
        { status: 400 }
      );
    }

    const id = cuid();
    const parsedMatchDate = new Date(matchDate);

    await prisma.$executeRawUnsafe(
      `INSERT INTO prediction_challenges
        (id, title, description, "imageUrl", "teamA", "teamB", "teamALogo", "teamBLogo",
         "matchId", "matchDate", sport, "leagueId", status, "winnerCount",
         "maxReferralEntries", "prizeName", "prizeValue", "prizeImage", "prizeDelivery",
         "totalVotes", "totalEntries", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', $13, $14, $15, $16, $17, $18, 0, 0, CURRENT_TIMESTAMP)`,
      id,
      title,
      description || null,
      imageUrl || null,
      teamA,
      teamB,
      teamALogo || null,
      teamBLogo || null,
      matchId || null,
      parsedMatchDate,
      sport || "football",
      leagueId || null,
      winnerCount ?? 10,
      maxReferralEntries ?? 20,
      prizeName || null,
      prizeValue || null,
      prizeImage || null,
      prizeDelivery || null
    );

    // Create auto-notifications (non-blocking — don't fail challenge creation)
    try {
      const notifId1 = cuid();
      await prisma.$executeRawUnsafe(
        `INSERT INTO scheduled_notifications
          (id, title, body, "targetType", "scheduledAt", status, "createdAt")
         VALUES ($1, $2, $3, 'all', CURRENT_TIMESTAMP, 'scheduled', CURRENT_TIMESTAMP)`,
        notifId1,
        "New Prediction Challenge is Live!",
        `${teamA} vs ${teamB} — ${title}. Make your prediction now!`
      );

      const lastChanceDate = new Date(parsedMatchDate.getTime() - 24 * 60 * 60 * 1000);
      const notifId2 = cuid();
      await prisma.$executeRawUnsafe(
        `INSERT INTO scheduled_notifications
          (id, title, body, "targetType", "scheduledAt", status, "createdAt")
         VALUES ($1, $2, $3, 'all', $4, 'scheduled', CURRENT_TIMESTAMP)`,
        notifId2,
        "Last chance to vote!",
        `${teamA} vs ${teamB} — Voting closes soon. Don't miss out!`,
        lastChanceDate
      );
    } catch { /* notifications are optional, don't block challenge creation */ }

    // Return the created challenge
    const created = await prisma.$queryRawUnsafe<ChallengeRow[]>(
      `SELECT * FROM prediction_challenges WHERE id = $1`,
      id
    );

    return NextResponse.json({ challenge: created[0] }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to create challenge", debug: msg }, { status: 500 });
  }
}

/* ── PATCH — Update challenge ───────────────────────────────────────── */
export async function PATCH(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureChallengeTables();

    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing challenge id" }, { status: 400 });
    }

    // Allowed updatable fields
    const allowedFields: Record<string, string> = {
      title: "title",
      description: "description",
      imageUrl: '"imageUrl"',
      teamA: '"teamA"',
      teamB: '"teamB"',
      teamALogo: '"teamALogo"',
      teamBLogo: '"teamBLogo"',
      matchId: '"matchId"',
      matchDate: '"matchDate"',
      sport: "sport",
      leagueId: '"leagueId"',
      status: "status",
      result: "result",
      winnerCount: '"winnerCount"',
      maxReferralEntries: '"maxReferralEntries"',
      prizeName: '"prizeName"',
      prizeValue: '"prizeValue"',
      prizeImage: '"prizeImage"',
      prizeDelivery: '"prizeDelivery"',
      totalVotes: '"totalVotes"',
      totalEntries: '"totalEntries"',
    };

    const sets: string[] = [];
    const vals: unknown[] = [];
    let pi = 1;

    for (const [key, col] of Object.entries(allowedFields)) {
      if (key in fields) {
        let val = fields[key];
        if (key === "matchDate" && val) val = new Date(val);
        sets.push(`${col} = $${pi++}`);
        vals.push(val);
      }
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    sets.push(`"updatedAt" = CURRENT_TIMESTAMP`);

    await prisma.$executeRawUnsafe(
      `UPDATE prediction_challenges SET ${sets.join(", ")} WHERE id = $${pi}`,
      ...vals,
      id
    );

    const updated = await prisma.$queryRawUnsafe<ChallengeRow[]>(
      `SELECT * FROM prediction_challenges WHERE id = $1`,
      id
    );

    if (updated.length === 0) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    return NextResponse.json({ challenge: updated[0] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to update challenge", debug: msg }, { status: 500 });
  }
}

/* ── DELETE — Delete challenge and associated data ──────────────────── */
export async function DELETE(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureChallengeTables();

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing challenge id" }, { status: 400 });
    }

    // Delete in correct order (children first)
    await prisma.$executeRawUnsafe(
      `DELETE FROM challenge_winners WHERE "challengeId" = $1`, id
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM challenge_entries WHERE "challengeId" = $1`, id
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM challenge_votes WHERE "challengeId" = $1`, id
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM prediction_challenges WHERE id = $1`, id
    );

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to delete challenge", debug: msg }, { status: 500 });
  }
}
