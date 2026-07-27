import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/challenges/active — Returns the current active challenge  */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    // Query for an active challenge whose matchDate is in the future
    const rows: Record<string, unknown>[] = await prisma.$queryRawUnsafe(
      `SELECT id, title, description, "matchDate" as deadline, "prizeName" as reward,
              "teamA", "teamB", "teamALogo", "teamBLogo", sport, "imageUrl",
              "totalVotes", "totalEntries", status
       FROM prediction_challenges
       WHERE status = 'active' AND "matchDate" > NOW()
       ORDER BY "matchDate" ASC
       LIMIT 1`
    );

    const challenge = rows.length > 0 ? rows[0] : null;

    return NextResponse.json(
      { challenge },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // If table doesn't exist yet, return null gracefully
    if (
      msg.includes("does not exist") ||
      msg.includes("relation") ||
      msg.includes("42P01")
    ) {
      return NextResponse.json(
        { challenge: null },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    console.error("[GET /api/challenges/active]", error);
    return NextResponse.json(
      { challenge: null },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
