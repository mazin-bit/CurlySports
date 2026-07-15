import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ensureChallengeTables } from "@/lib/ensure-challenge-tables";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/referral/stats — Referral statistics for current user     */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    await ensureChallengeTables();

    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    // Get referral code
    const codeRows: { code: string; totalReferrals: number; totalEntries: number }[] =
      await prisma.$queryRawUnsafe(
        `SELECT code, "totalReferrals", "totalEntries" FROM referral_codes WHERE "userId" = $1`,
        user.id
      );

    if (codeRows.length === 0) {
      return NextResponse.json(
        {
          code: null,
          link: null,
          totalReferrals: 0,
          verifiedReferrals: 0,
          pendingReferrals: 0,
          totalBonusEntries: 0,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const { code } = codeRows[0];

    // Count verified referrals
    const verifiedResult: { count: bigint }[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM referrals WHERE "referrerUserId" = $1 AND status = 'verified'`,
      user.id
    );
    const verifiedReferrals = Number(verifiedResult[0]?.count ?? 0);

    // Count pending referrals
    const pendingResult: { count: bigint }[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM referrals WHERE "referrerUserId" = $1 AND status = 'pending'`,
      user.id
    );
    const pendingReferrals = Number(pendingResult[0]?.count ?? 0);

    const totalReferrals = verifiedReferrals + pendingReferrals;

    // Sum total bonus entries earned from referrals across all challenges
    const bonusResult: { total: bigint | null }[] = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM("referralEntries"), 0)::int as total
       FROM challenge_entries
       WHERE "userId" = $1 AND "referralEntries" > 0`,
      user.id
    );
    const totalBonusEntries = Number(bonusResult[0]?.total ?? 0);

    return NextResponse.json(
      {
        code,
        link: `https://curlysports.com/invite/${code}`,
        totalReferrals,
        verifiedReferrals,
        pendingReferrals,
        totalBonusEntries,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[GET /api/referral/stats]", error);
    return NextResponse.json(
      { error: "Failed to fetch referral stats" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
