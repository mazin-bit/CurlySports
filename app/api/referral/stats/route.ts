import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/referral/stats — Referral statistics for current user     */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
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
          verified: 0,
          total: 0,
          totalEntries: 0,
          totalReferrals: 0,
          verifiedReferrals: 0,
          pendingReferrals: 0,
          totalBonusEntries: 0,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const { code, totalReferrals: codeReferrals, totalEntries: codeEntries } = codeRows[0];

    // Single query to get all stats at once (faster than 4 separate queries)
    const statsResult: {
      hasRedeemed: boolean;
      verifiedCount: number;
      pendingCount: number;
      challengeEntries: number;
      referralEntries: number;
    }[] = await prisma.$queryRawUnsafe(
      `SELECT
        (SELECT "referredBy" IS NOT NULL FROM users WHERE id = $1) AS "hasRedeemed",
        COALESCE((SELECT COUNT(*)::int FROM referrals WHERE "referrerUserId" = $1 AND status = 'verified'), 0) AS "verifiedCount",
        COALESCE((SELECT COUNT(*)::int FROM referrals WHERE "referrerUserId" = $1 AND status = 'pending'), 0) AS "pendingCount",
        COALESCE((SELECT SUM("totalEntries")::int FROM challenge_entries WHERE "userId" = $1), 0) AS "challengeEntries",
        COALESCE((SELECT SUM("referralEntries")::int FROM challenge_entries WHERE "userId" = $1), 0) AS "referralEntries"`,
      user.id
    );

    const s = statsResult[0];
    const hasRedeemed = !!s?.hasRedeemed;
    const verifiedReferrals = Number(s?.verifiedCount ?? 0);
    const pendingReferrals = Number(s?.pendingCount ?? 0);
    // Use the higher of referral_codes.totalReferrals vs referrals table count for consistency
    const totalReferrals = Math.max(Number(codeReferrals), verifiedReferrals + pendingReferrals);
    const actualTotalEntries = Math.max(Number(codeEntries), Number(s?.challengeEntries ?? 0));
    const totalBonusEntries = Number(s?.referralEntries ?? 0);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://curlysports.com";

    return NextResponse.json(
      {
        code,
        link: `${baseUrl}/invite/${code}`,
        verified: verifiedReferrals,
        total: totalReferrals,
        totalEntries: actualTotalEntries,
        totalReferrals,
        verifiedReferrals,
        pendingReferrals,
        totalBonusEntries,
        hasRedeemed,
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
