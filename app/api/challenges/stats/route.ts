import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { optionalAuth } from "@/lib/auth";
import { ensureChallengeTables } from "@/lib/ensure-challenge-tables";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/challenges/stats — User's challenge stats                  */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    await ensureChallengeTables();

    const user = await optionalAuth();
    if (!user) {
      return NextResponse.json(
        { totalEntries: 0, referrals: 0, challengesJoined: 0 },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Count challenges the user has voted in
    const votesResult: { count: bigint }[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(DISTINCT "challengeId")::int as count
       FROM challenge_votes WHERE "userId" = $1`,
      user.id
    );
    const challengesJoined = Number(votesResult[0]?.count ?? 0);

    // Sum total entries across all challenges
    const entriesResult: { total: bigint }[] = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM("totalEntries"), 0)::int as total
       FROM challenge_entries WHERE "userId" = $1`,
      user.id
    );
    const totalEntries = Number(entriesResult[0]?.total ?? 0);

    // Count verified referrals
    const referralsResult: { count: bigint }[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count
       FROM referrals WHERE "referrerUserId" = $1 AND status = 'verified'`,
      user.id
    );
    const referrals = Number(referralsResult[0]?.count ?? 0);

    return NextResponse.json(
      { totalEntries, referrals, challengesJoined },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[GET /api/challenges/stats]", error);
    return NextResponse.json(
      { totalEntries: 0, referrals: 0, challengesJoined: 0 },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
