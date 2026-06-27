import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

function isAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(process.env.ADMIN_PASSWORD);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const debate = await prisma.debate.update({ where: { id }, data: body });
    return NextResponse.json(debate);
  } catch (err) {
    logger.error("debate update failed", { debateId: id, error: String(err) });
    return NextResponse.json({ error: "Failed to update debate" }, { status: 503 });
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
