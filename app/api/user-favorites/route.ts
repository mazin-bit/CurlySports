import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/user-favorites — list authenticated user's favorites
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const rows = await prisma.userFavorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // Map to snake_case keys the UI expects
    const favorites = rows.map((r) => ({
      id: r.id,
      type: r.type,
      espn_id: r.espnId,
      data: r.data,
      created_at: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ favorites });
  } catch (err) {
    logger.error("user-favorites GET error", { error: String(err) });
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

// POST /api/user-favorites — add a favorite
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { type, espn_id, data: itemData } = (await req.json()) as {
      type: "team" | "player";
      espn_id: string;
      data: Record<string, unknown>;
    };

    if (!type || !espn_id) {
      return NextResponse.json({ error: "type and espn_id required" }, { status: 400 });
    }

    const row = await prisma.userFavorite.upsert({
      where: {
        userId_type_espnId: { userId: user.id, type, espnId: espn_id },
      },
      update: { data: itemData ?? {} },
      create: {
        userId: user.id,
        type,
        espnId: espn_id,
        data: itemData ?? {},
      },
    });

    return NextResponse.json(
      { id: row.id, type: row.type, espn_id: row.espnId, data: row.data, created_at: row.createdAt.toISOString() },
      { status: 201 }
    );
  } catch (err) {
    logger.error("user-favorites POST error", { error: String(err) });
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}

// DELETE /api/user-favorites — remove a favorite
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { type, espn_id } = (await req.json()) as { type: string; espn_id: string };

    await prisma.userFavorite.deleteMany({
      where: { userId: user.id, type, espnId: espn_id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("user-favorites DELETE error", { error: String(err) });
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }
}
