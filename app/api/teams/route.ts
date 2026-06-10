import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Sport } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport") as Sport | null;
  const leagueId = searchParams.get("leagueId");
  const search = searchParams.get("q");

  const teams = await prisma.team.findMany({
    where: {
      ...(sport && { sport }),
      ...(leagueId && { leagueId }),
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    },
    include: {
      league: { select: { id: true, name: true, shortName: true } },
      _count:  { select: { players: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(teams);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const team = await prisma.team.create({
    data: {
      name:      body.name,
      shortName: body.shortName,
      sport:     body.sport,
      leagueId:  body.leagueId,
      city:      body.city,
      country:   body.country,
      logoUrl:   body.logoUrl,
    },
  });

  return NextResponse.json(team, { status: 201 });
}
