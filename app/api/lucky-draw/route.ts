import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

let tableEnsured = false;
async function ensureLuckyDrawTable() {
  if (tableEnsured) return;
  try {
    await prisma.$queryRawUnsafe(`SELECT 1 FROM lucky_draws LIMIT 0`);
    tableEnsured = true;
    return;
  } catch {
    /* table doesn't exist, create it */
  }
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS lucky_draws (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Lucky Draw',
      "prizeName" TEXT NOT NULL,
      "prizeValue" TEXT,
      "prizeImage" TEXT,
      "scheduledAt" TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      "winnerId" TEXT,
      "winnerName" TEXT,
      "winnerReferrals" INTEGER,
      "winnerAvatar" TEXT,
      "drawnAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "updatedAt" TIMESTAMPTZ DEFAULT now()
    )
  `);
  tableEnsured = true;
}

export async function GET() {
  try {
    await ensureLuckyDrawTable();

    // Check for a currently spinning draw first
    const spinning: Record<string, unknown>[] = await prisma.$queryRawUnsafe(`
      SELECT * FROM lucky_draws
      WHERE status = 'spinning'
      ORDER BY "updatedAt" DESC
      LIMIT 1
    `);

    let spinData = null;
    if (spinning.length > 0) {
      // Get winner info
      const draw = spinning[0];
      spinData = {
        id: draw.id,
        title: draw.title,
        prizeName: draw.prizeName,
        prizeValue: draw.prizeValue,
        winner: draw.winnerName ? {
          userId: String(draw.winnerId),
          username: String(draw.winnerName),
          avatar: draw.winnerAvatar ? String(draw.winnerAvatar) : null,
          referrals: Number(draw.winnerReferrals || 0),
        } : null,
        participants: [] as { userId: string; username: string; avatar: string | null; referrals: number }[],
      };

      // Fetch participants using same query as admin spin
      try {
        const rows: Record<string, unknown>[] = await prisma.$queryRawUnsafe(`
          SELECT rc."userId",
                 COALESCE(u.username, u.name, 'User') as username,
                 u.avatar,
                 rc."totalReferrals" as referrals
          FROM referral_codes rc
          LEFT JOIN users u ON u.id = rc."userId"
          WHERE rc."totalReferrals" >= 1
            AND (rc."isPromo" IS NOT TRUE)
        `);
        spinData.participants = rows.map(r => ({
          userId: String(r.userId),
          username: String(r.username || "User"),
          avatar: r.avatar ? String(r.avatar) : null,
          referrals: Number(r.referrals),
        }));
      } catch {
        try {
          // Fallback without isPromo
          const rows: Record<string, unknown>[] = await prisma.$queryRawUnsafe(`
            SELECT rc."userId",
                   COALESCE(u.username, u.name, 'User') as username,
                   u.avatar,
                   rc."totalReferrals" as referrals
            FROM referral_codes rc
            LEFT JOIN users u ON u.id = rc."userId"
            WHERE rc."totalReferrals" >= 1
          `);
          spinData.participants = rows.map(r => ({
            userId: String(r.userId),
            username: String(r.username || "User"),
            avatar: r.avatar ? String(r.avatar) : null,
            referrals: Number(r.referrals),
          }));
        } catch {
          if (spinData.winner) spinData.participants = [spinData.winner];
        }
      }
    }

    const upcoming: Record<string, unknown>[] = await prisma.$queryRawUnsafe(`
      SELECT * FROM lucky_draws
      WHERE status = 'scheduled' AND "scheduledAt" > now()
      ORDER BY "scheduledAt" ASC
      LIMIT 1
    `);

    const pastWinners: Record<string, unknown>[] = await prisma.$queryRawUnsafe(`
      SELECT * FROM lucky_draws
      WHERE status = 'completed'
      ORDER BY "drawnAt" DESC
      LIMIT 5
    `);

    return NextResponse.json({
      upcoming: upcoming.length > 0 ? upcoming[0] : null,
      pastWinners,
      spinning: spinData,
    });
  } catch (err) {
    console.error("[lucky-draw] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch lucky draw data" },
      { status: 500 }
    );
  }
}
