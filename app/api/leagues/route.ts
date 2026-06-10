import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Sport } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport") as Sport | null;

  const leagues = await prisma.league.findMany({
    where: { ...(sport && { sport }) },
    include: { _count: { select: { teams: true, matches: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(leagues);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const league = await prisma.league.create({
    data: {
      name:      body.name,
      shortName: body.shortName,
      sport:     body.sport,
      country:   body.country,
      logoUrl:   body.logoUrl,
      season:    body.season,
    },
  });

  return NextResponse.json(league, { status: 201 });
}
