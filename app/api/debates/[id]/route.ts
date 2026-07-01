import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    await prisma.debate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("debate delete failed", { debateId: id, error: String(err) });
    return NextResponse.json({ error: "Failed to delete debate" }, { status: 503 });
  }
}
