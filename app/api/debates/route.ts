import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { parseBody, createDebateSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

function isAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(process.env.ADMIN_PASSWORD);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch { return false; }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const live = searchParams.get("live");

  try {
    const debates = await prisma.debate.findMany({
      where: live === "true" ? { isLive: true } : undefined,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(debates);
  } catch (err) {
    // Fallback: if isPinned column doesn't exist yet, query without it
    const msg = String(err);
    if (msg.includes("isPinned") || msg.includes("column") || msg.includes("Unknown arg")) {
      logger.warn("debates: isPinned column missing, falling back to createdAt order");
      try {
        const debates = await prisma.debate.findMany({
          where: live === "true" ? { isLive: true } : undefined,
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(debates);
      } catch (fallbackErr) {
        logger.error("debates fallback fetch failed", { error: String(fallbackErr) });
        return NextResponse.json([]);
      }
    }
    logger.error("debates fetch failed", { error: String(err) });
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  // Allow admin token (admin panel) or a logged-in user (mobile)
  if (!isAdmin(req)) {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
  }

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
