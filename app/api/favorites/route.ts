import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseBody, favoriteSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

// GET /api/favorites — returns the authenticated user's favorites only
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      team:   { select: { id: true, name: true, shortName: true, logoUrl: true, sport: true } },
      player: { select: { id: true, name: true, position: true, photoUrl: true, sport: true } },
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(favorites);
}

// POST /api/favorites — add a favorite for the authenticated user
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const body = await request.json().catch(() => ({}));
  const parsed = parseBody(favoriteSchema, body);
  if (!parsed.success) return parsed.response;
  const { teamId, playerId } = parsed.data;

  try {
    const favorite = await prisma.favorite.create({
      data: {
        userId: user.id,
        teamId: teamId ?? null,
        playerId: playerId ?? null,
      },
    });
    return NextResponse.json(favorite, { status: 201 });
  } catch (err) {
    logger.error("favorite create failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}

// DELETE /api/favorites — remove a favorite belonging to the authenticated user
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const body = await request.json().catch(() => ({}));
  const { teamId, playerId } = body;

  await prisma.favorite.deleteMany({
    where: {
      userId: user.id,
      ...(teamId   ? { teamId }   : {}),
      ...(playerId ? { playerId } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
