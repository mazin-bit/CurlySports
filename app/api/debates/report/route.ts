import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { optionalAuth } from "@/lib/auth";

const ENSURE_TABLE = `
  CREATE TABLE IF NOT EXISTS content_flags (
    id TEXT PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    reason TEXT NOT NULL,
    "userId" TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    "autoHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

// POST /api/debates/report — report a debate (public, optional auth)
export async function POST(req: NextRequest) {
  const { debateId, reason } = await req.json().catch(() => ({ debateId: null, reason: null }));

  if (!debateId || !reason) {
    return NextResponse.json(
      { error: "Missing required fields: debateId, reason" },
      { status: 400 }
    );
  }

  await prisma.$executeRawUnsafe(ENSURE_TABLE);

  // Get optional user
  const user = await optionalAuth();
  const userId = user?.id ?? null;

  const id = crypto.randomUUID();

  // Insert the flag
  await prisma.$executeRaw`
    INSERT INTO content_flags (id, "contentId", "contentType", reason, "userId", status, "autoHidden", "createdAt", "updatedAt")
    VALUES (${id}, ${debateId}, 'debate', ${reason}, ${userId}, 'pending', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;

  // Count total flags for this debate
  const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) AS count FROM content_flags
    WHERE "contentId" = ${debateId} AND "contentType" = 'debate'
  `;
  const flagCount = Number(countResult[0].count);

  // Auto-hide debate if 3 or more flags
  if (flagCount >= 3) {
    try {
      await prisma.debate.update({
        where: { id: debateId },
        data: { isLive: false },
      });
    } catch {
      // If Prisma model doesn't exist or debate not found, try raw SQL
      await prisma.$executeRaw`
        UPDATE "Debate" SET "isLive" = false WHERE id = ${debateId}
      `;
    }
  }

  return NextResponse.json({ ok: true, flagCount });
}
