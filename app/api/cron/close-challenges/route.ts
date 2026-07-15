import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureChallengeTables } from "@/lib/ensure-challenge-tables";

export const dynamic = "force-dynamic";

/* ── Interfaces ─────────────────────────────────────────────────────── */
interface CountRow {
  count: bigint;
}

/* ── GET — Auto-close voting for expired challenges ─────────────────── */
export async function GET(req: NextRequest) {
  // Simple auth check: CRON_SECRET or ADMIN_PASSWORD
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  const cronSecret = process.env.CRON_SECRET;
  const adminPw = process.env.ADMIN_PASSWORD;

  if (token && (token === cronSecret || token === adminPw)) {
    // Authorized
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureChallengeTables();

    const now = new Date();

    // Count how many will be closed
    const countResult = await prisma.$queryRawUnsafe<CountRow[]>(
      `SELECT COUNT(*) AS count FROM prediction_challenges
       WHERE status = 'active' AND "matchDate" <= $1`,
      now
    );
    const closedCount = Number(countResult[0].count);

    // Close them
    if (closedCount > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE prediction_challenges
         SET status = 'closed', "updatedAt" = CURRENT_TIMESTAMP
         WHERE status = 'active' AND "matchDate" <= $1`,
        now
      );
    }

    return NextResponse.json({
      closed: closedCount,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to close challenges", debug: msg }, { status: 500 });
  }
}
