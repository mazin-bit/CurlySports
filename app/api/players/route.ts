import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Sport } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport") as Sport | null;
  const teamId = searchParams.get("teamId");
  const search = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") ?? "30");

  const players = await prisma.player.findMany({
    where: {
      ...(sport && { sport }),
      ...(teamId && { teamId }),
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    },
    include: {
      team: { select: { id: true, name: true, shortName: true, logoUrl: true } },
    },
    orderBy: { name: "asc" },
    take: limit,
  });

  return NextResponse.json(players);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const player = await prisma.player.create({
    data: {
      name:        body.name,
      sport:       body.sport,
      teamId:      body.teamId,
      position:    body.position,
      nationality: body.nationality,
      age:         body.age,
      photoUrl:    body.photoUrl,
      stats:       body.stats,
    },
  });

  return NextResponse.json(player, { status: 201 });
}
