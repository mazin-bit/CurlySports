import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    const predictions = await prisma.prediction.findMany({
      where: {
        userId: user.id,
        ...(matchId && { matchId }),
      },
      include: {
        match: {
          include: {
            homeTeam: { select: { name: true, shortName: true } },
            awayTeam: { select: { name: true, shortName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(predictions);
  } catch (err) {
    logger.error("predictions GET error", { error: String(err) });
    return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const body = await req.json().catch(() => ({}));
    const { matchId, homeScore, awayScore } = body;

    if (!matchId || homeScore == null || awayScore == null) {
      return NextResponse.json({ error: "matchId, homeScore, awayScore required" }, { status: 400 });
    }

    const prediction = await prisma.prediction.upsert({
      where: { userId_matchId: { userId: user.id, matchId } },
      update: { homeScore, awayScore },
      create: { userId: user.id, matchId, homeScore, awayScore },
    });

    return NextResponse.json(prediction, { status: 201 });
  } catch (err) {
    logger.error("predictions POST error", { error: String(err) });
    return NextResponse.json({ error: "Failed to save prediction" }, { status: 500 });
  }
}
