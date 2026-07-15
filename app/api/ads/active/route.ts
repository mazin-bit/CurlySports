import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ENSURE_TABLE = `
  CREATE TABLE IF NOT EXISTS ads (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    "imageUrl" TEXT,
    "linkUrl" TEXT NOT NULL,
    slot TEXT NOT NULL,
    "sponsorId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

// GET /api/ads/active?slot=sidebar — return active ads for a given slot (public, no auth)
export async function GET(req: NextRequest) {
  try {
    const slot = req.nextUrl.searchParams.get("slot");
    if (!slot) {
      return NextResponse.json({ ads: [] });
    }

    await prisma.$executeRawUnsafe(ENSURE_TABLE);

    // Map AdSlot size to db slot name
    const slotMap: Record<string, string[]> = {
      banner: ["banner", "feed"],
      square: ["sidebar"],
      strip: ["feed"],
      compact: ["sidebar"],
      card: ["feed"],
    };
    const dbSlots = slotMap[slot] || [slot];

    const now = new Date();
    const ads: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, title, "imageUrl", "linkUrl", slot
       FROM ads
       WHERE "isActive" = true
         AND "startDate" <= $1
         AND "endDate" >= $1
         AND slot = ANY($2::text[])
       ORDER BY RANDOM()
       LIMIT 1`,
      now,
      dbSlots
    );

    if (ads.length === 0) {
      return NextResponse.json({ ads: [] });
    }

    // Track impression
    await prisma.$executeRawUnsafe(
      `UPDATE ads SET impressions = impressions + 1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1`,
      ads[0].id
    );

    return NextResponse.json({ ads });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ads: [], debug: msg });
  }
}
