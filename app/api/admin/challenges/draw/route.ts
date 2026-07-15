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
  winnerCount: number;
  teamA: string;
  teamB: string;
  title: string;
}

interface EntryRow {
  userId: string;
  totalEntries: number;
}

interface UserInfoRow {
  id: string;
  username: string | null;
  email: string | null;
}

/* ── POST — Draw winners ────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureChallengeTables();

    const { challengeId } = await req.json();

    if (!challengeId) {
      return NextResponse.json({ error: "Missing challengeId" }, { status: 400 });
    }

    // 1. Get the challenge
    const challenges = await prisma.$queryRawUnsafe<ChallengeRow[]>(
      `SELECT id, "winnerCount", "teamA", "teamB", title
       FROM prediction_challenges WHERE id = $1`,
      challengeId
    );

    if (challenges.length === 0) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const challenge = challenges[0];
    const winnerCount = Number(challenge.winnerCount);

    // 2. Get all challenge_entries with totalEntries > 0
    const entries = await prisma.$queryRawUnsafe<EntryRow[]>(
      `SELECT "userId", "totalEntries" FROM challenge_entries
       WHERE "challengeId" = $1 AND "totalEntries" > 0`,
      challengeId
    );

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No eligible entries for this challenge" },
        { status: 400 }
      );
    }

    // 3. Create weighted ticket pool
    const ticketPool: string[] = [];
    for (const entry of entries) {
      const numEntries = Number(entry.totalEntries);
      for (let i = 0; i < numEntries; i++) {
        ticketPool.push(entry.userId);
      }
    }

    // 4. Randomly select N winners (each user can only win once)
    const selectedWinners: string[] = [];
    const remainingPool = [...ticketPool];
    const maxWinners = Math.min(winnerCount, entries.length);

    while (selectedWinners.length < maxWinners && remainingPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * remainingPool.length);
      const selectedUserId = remainingPool[randomIndex];

      if (!selectedWinners.includes(selectedUserId)) {
        selectedWinners.push(selectedUserId);
      }

      // Remove ALL tickets for this user from the pool to prevent re-selection
      for (let i = remainingPool.length - 1; i >= 0; i--) {
        if (remainingPool[i] === selectedUserId) {
          remainingPool.splice(i, 1);
        }
      }
    }

    // 5. Insert into challenge_winners
    for (const userId of selectedWinners) {
      const entry = entries.find(e => e.userId === userId);
      const entryCount = entry ? Number(entry.totalEntries) : 0;
      const winnerId = cuid();

      await prisma.$executeRawUnsafe(
        `INSERT INTO challenge_winners (id, "challengeId", "userId", entries, "drawnAt", notified)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, false)
         ON CONFLICT ("challengeId", "userId") DO NOTHING`,
        winnerId,
        challengeId,
        userId,
        entryCount
      );
    }

    // 6. Create winner notification targeting specific users
    const notifId = cuid();
    const pgArray = selectedWinners.length > 0
      ? `{${selectedWinners.map(u => `"${u.replace(/"/g, '\\"')}"`).join(",")}}`
      : "{}";

    await prisma.$executeRawUnsafe(
      `INSERT INTO scheduled_notifications
        (id, title, body, "targetType", "targetUsers", "scheduledAt", status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'user', $4::text[], CURRENT_TIMESTAMP, 'scheduled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      notifId,
      "You won the prediction challenge!",
      `Congratulations! You've been selected as a winner for "${challenge.title}" (${challenge.teamA} vs ${challenge.teamB}).`,
      pgArray
    );

    // 7. Fetch winner user info for the response
    const winners: { userId: string; username: string | null; email: string | null; entries: number }[] = [];

    for (const userId of selectedWinners) {
      const entry = entries.find(e => e.userId === userId);
      const entryCount = entry ? Number(entry.totalEntries) : 0;

      const userRows = await prisma.$queryRawUnsafe<UserInfoRow[]>(
        `SELECT id, username, email FROM users WHERE id = $1`,
        userId
      );

      winners.push({
        userId,
        username: userRows.length > 0 ? userRows[0].username : null,
        email: userRows.length > 0 ? userRows[0].email : null,
        entries: entryCount,
      });
    }

    return NextResponse.json({ winners });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to draw winners", debug: msg }, { status: 500 });
  }
}
