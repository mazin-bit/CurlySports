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

// POST /api/ads/track — record an ad impression or click (public)
export async function POST(req: NextRequest) {
  const { adId, type } = await req.json().catch(() => ({ adId: null, type: null }));

  if (!adId || !type || !["impression", "click"].includes(type)) {
    return NextResponse.json(
      { error: "Invalid request. Required: adId, type (impression|click)" },
      { status: 400 }
    );
  }

  await prisma.$executeRawUnsafe(ENSURE_TABLE);

  const column = type === "click" ? "clicks" : "impressions";

  await prisma.$executeRawUnsafe(
    `UPDATE ads SET "${column}" = "${column}" + 1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1`,
    adId
  );

  return NextResponse.json({ ok: true });
}
