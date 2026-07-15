import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

function isAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(process.env.ADMIN_PASSWORD);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch { return false; }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    // Ensure isPinned column exists
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "debates" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false`
    ).catch(() => {});

    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;
    if (body.isLive !== undefined) { sets.push(`"isLive" = $${idx++}`); vals.push(!!body.isLive); }
    if (body.isPinned !== undefined) { sets.push(`"isPinned" = $${idx++}`); vals.push(!!body.isPinned); }
    if (body.question) { sets.push(`"question" = $${idx++}`); vals.push(body.question); }
    if (body.optionA) { sets.push(`"optionA" = $${idx++}`); vals.push(body.optionA); }
    if (body.optionB) { sets.push(`"optionB" = $${idx++}`); vals.push(body.optionB); }

    if (sets.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

    sets.push(`"updatedAt" = NOW()`);
    vals.push(id);

    const rows = await prisma.$queryRawUnsafe(
      `UPDATE debates SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      ...vals
    ) as unknown[];
    return NextResponse.json((rows as Record<string, unknown>[])[0] ?? { id });
  } catch (err) {
    logger.error("debate update failed", { debateId: id, error: String(err) });
    return NextResponse.json({ error: "Failed to update debate", debug: String(err) }, { status: 503 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.debate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("debate delete failed", { debateId: id, error: String(err) });
    return NextResponse.json({ error: "Failed to delete debate" }, { status: 503 });
  }
}
