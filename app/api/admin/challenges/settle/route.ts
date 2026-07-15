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
  maxReferralEntries: number;
  winnerCount: number;
  teamA: string;
  teamB: string;
  title: string;
}

interface VoteRow {
  userId: string;
  selectedTeam: string;
}

interface ReferralCountRow {
  count: bigint;
}

/* ── POST — Settle a challenge result ───────────────────────────────── */
export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureChallengeTables();

    const { challengeId, result } = await req.json();

    if (!challengeId || !result) {
      return NextResponse.json(
        { error: "Missing required fields: challengeId, result" },
        { status: 400 }
      );
    }

    if (!["teamA", "teamB", "draw"].includes(result)) {
      return NextResponse.json(
        { error: "Invalid result. Must be 'teamA', 'teamB', or 'draw'" },
        { status: 400 }
      );
    }

    // 1. Get the challenge
    const challenges = await prisma.$queryRawUnsafe<ChallengeRow[]>(
      `SELECT id, "maxReferralEntries", "winnerCount", "teamA", "teamB", title
       FROM prediction_challenges WHERE id = $1`,
      challengeId
    );

    if (challenges.length === 0) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const challenge = challenges[0];

    // Guard against re-settling
    const statusCheck = await prisma.$queryRawUnsafe<{ status: string }[]>(
      `SELECT status FROM prediction_challenges WHERE id = $1`,
      challengeId
    );
    if (statusCheck.length > 0 && statusCheck[0].status === "settled") {
      return NextResponse.json(
        { error: "Challenge already settled" },
        { status: 400 }
      );
    }

    const maxRefEntries = Number(challenge.maxReferralEntries);

    // Clean up existing entries for this challenge (handles re-settle edge case)
    await prisma.$executeRawUnsafe(
      `DELETE FROM challenge_entries WHERE "challengeId" = $1`,
      challengeId
    );

    // 2. Update challenge status to 'settled' and set result
    await prisma.$executeRawUnsafe(
      `UPDATE prediction_challenges
       SET status = 'settled', result = $1, "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $2`,
      result,
      challengeId
    );

    // 3. Mark all votes: isCorrect based on result
    if (result === "draw") {
      // Draw = nobody is correct
      await prisma.$executeRawUnsafe(
        `UPDATE challenge_votes SET "isCorrect" = false, entries = 0
         WHERE "challengeId" = $1`,
        challengeId
      );
    } else {
      // Correct: those who voted for the winning team
      await prisma.$executeRawUnsafe(
        `UPDATE challenge_votes
         SET "isCorrect" = CASE WHEN "selectedTeam" = $1 THEN true ELSE false END,
             entries = CASE WHEN "selectedTeam" = $1 THEN 1 ELSE 0 END
         WHERE "challengeId" = $2`,
        result,
        challengeId
      );
    }

    // 4. Get correct voters and create entries
    let correctCount = 0;
    let wrongCount = 0;
    let totalEntries = 0;

    if (result !== "draw") {
      // Get all votes for this challenge
      const allVotes = await prisma.$queryRawUnsafe<VoteRow[]>(
        `SELECT "userId", "selectedTeam" FROM challenge_votes WHERE "challengeId" = $1`,
        challengeId
      );

      const correctVoters = allVotes.filter(v => v.selectedTeam === result);
      correctCount = correctVoters.length;
      wrongCount = allVotes.length - correctCount;

      // For each correct voter, compute entries
      for (const voter of correctVoters) {
        // Count verified referrals for this user
        const refResult = await prisma.$queryRawUnsafe<ReferralCountRow[]>(
          `SELECT COUNT(*) AS count FROM referrals
           WHERE "referrerUserId" = $1 AND status = 'verified'`,
          voter.userId
        );
        const referralCount = Number(refResult[0].count);
        const cappedReferrals = Math.min(referralCount, maxRefEntries);
        const baseEntries = 1;
        const entryTotal = baseEntries + cappedReferrals;
        totalEntries += entryTotal;

        // Upsert challenge_entries
        const entryId = cuid();
        await prisma.$executeRawUnsafe(
          `INSERT INTO challenge_entries
            (id, "challengeId", "userId", "baseEntries", "referralEntries", "totalEntries", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT ("challengeId", "userId") DO UPDATE
           SET "baseEntries" = $4, "referralEntries" = $5, "totalEntries" = $6, "updatedAt" = CURRENT_TIMESTAMP`,
          entryId,
          challengeId,
          voter.userId,
          baseEntries,
          cappedReferrals,
          entryTotal
        );
      }
    } else {
      // Draw: count votes but no entries
      const voteCountResult = await prisma.$queryRawUnsafe<ReferralCountRow[]>(
        `SELECT COUNT(*) AS count FROM challenge_votes WHERE "challengeId" = $1`,
        challengeId
      );
      wrongCount = Number(voteCountResult[0].count);
    }

    // 5. Update challenge totalEntries
    await prisma.$executeRawUnsafe(
      `UPDATE prediction_challenges SET "totalEntries" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`,
      totalEntries,
      challengeId
    );

    // 6. Create "Results are in!" notification
    const notifId = cuid();
    const resultText = result === "draw"
      ? "It's a draw!"
      : `${result === "teamA" ? challenge.teamA : challenge.teamB} wins!`;

    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO scheduled_notifications
          (id, title, body, "targetType", "scheduledAt", status, "createdAt")
         VALUES ($1, $2, $3, 'all', CURRENT_TIMESTAMP, 'scheduled', CURRENT_TIMESTAMP)`,
        notifId,
        "Results are in!",
        `${challenge.teamA} vs ${challenge.teamB} — ${resultText} ${correctCount} users predicted correctly.`
      );
    } catch (notifErr) {
      console.error("Failed to create settle notification:", notifErr);
    }

    return NextResponse.json({
      correctCount,
      wrongCount,
      totalEntries,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to settle challenge", debug: msg }, { status: 500 });
  }
}
