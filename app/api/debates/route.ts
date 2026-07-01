import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { parseBody, createDebateSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

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
    logger.error("debates fetch failed", { error: String(err) });
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createDebateSchema, body);
  if (!parsed.success) return parsed.response;
  const { question, optionA, optionB, sport, expiresAt } = parsed.data;

  try {
    const debate = await prisma.debate.create({
      data: {
        question,
        optionA,
        optionB,
        sport,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });
    logger.info("debate created", { debateId: debate.id });
    return NextResponse.json(debate, { status: 201 });
  } catch (err) {
    logger.error("debate create failed", { error: String(err) });
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
}
