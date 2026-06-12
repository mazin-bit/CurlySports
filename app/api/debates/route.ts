import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const live = searchParams.get("live");

  try {
    const debates = await prisma.debate.findMany({
      where: {
        ...(live === "true" && { isLive: true }),
      },
      include: { _count: { select: { votes: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(debates);
  } catch (err) {
    console.error("[/api/debates GET] DB error:", err);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const debate = await prisma.debate.create({
      data: {
        question:  body.question,
        optionA:   body.optionA,
        optionB:   body.optionB,
        sport:     body.sport,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      },
    });
    return NextResponse.json(debate, { status: 201 });
  } catch (err) {
    console.error("[/api/debates POST] DB error:", err);
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
}
