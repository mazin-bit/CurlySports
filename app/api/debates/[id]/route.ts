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
  const data: Record<string, unknown> = {};
  try {
    if (body.isLive !== undefined) data.isLive = !!body.isLive;
    if (body.isPinned !== undefined) data.isPinned = !!body.isPinned;
    if (body.question) data.question = body.question;
    if (body.optionA) data.optionA = body.optionA;
    if (body.optionB) data.optionB = body.optionB;

    if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

    const updated = await prisma.debate.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    // If isPinned column doesn't exist, retry without it
    const msg = String(err);
    if (body.isPinned !== undefined && (msg.includes("isPinned") || msg.includes("Unknown arg"))) {
      logger.warn("debate update: isPinned column missing, retrying without it");
      delete data.isPinned;
      if (Object.keys(data).length === 0) return NextResponse.json({ error: "isPinned not available yet" }, { status: 400 });
      try {
        const updated = await prisma.debate.update({ where: { id }, data });
        return NextResponse.json(updated);
      } catch (fallbackErr) {
        logger.error("debate update fallback failed", { debateId: id, error: String(fallbackErr) });
        return NextResponse.json({ error: "Failed to update debate" }, { status: 503 });
      }
    }
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
