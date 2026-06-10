import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const matchId = searchParams.get("matchId");

  const predictions = await prisma.prediction.findMany({
    where: {
      ...(userId && { userId }),
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
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, matchId, homeScore, awayScore } = body;

  if (!userId || !matchId || homeScore == null || awayScore == null) {
    return NextResponse.json({ error: "userId, matchId, homeScore, awayScore required" }, { status: 400 });
  }

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId, matchId } },
    update: { homeScore, awayScore },
    create: { userId, matchId, homeScore, awayScore },
  });

  return NextResponse.json(prediction, { status: 201 });
}
