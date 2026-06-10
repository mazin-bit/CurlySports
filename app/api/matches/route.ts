import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MatchStatus, Sport } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as MatchStatus | null;
  const sport = searchParams.get("sport") as Sport | null;
  const leagueId = searchParams.get("leagueId");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const matches = await prisma.match.findMany({
    where: {
      ...(status && { status }),
      ...(sport && { sport }),
      ...(leagueId && { leagueId }),
    },
    include: {
      homeTeam: { select: { id: true, name: true, shortName: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, shortName: true, logoUrl: true } },
      league:   { select: { id: true, name: true, shortName: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });

  return NextResponse.json(matches);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const match = await prisma.match.create({
    data: {
      homeTeamId: body.homeTeamId,
      awayTeamId: body.awayTeamId,
      leagueId:   body.leagueId,
      sport:      body.sport,
      scheduledAt: new Date(body.scheduledAt),
      venue:      body.venue,
    },
  });

  return NextResponse.json(match, { status: 201 });
}
