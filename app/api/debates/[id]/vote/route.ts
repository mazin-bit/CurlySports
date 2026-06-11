import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/debates/[id]/vote  —  body: { option: "A" | "B" }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { option?: string };
  const option = body.option;
  if (option !== "A" && option !== "B") {
    return NextResponse.json({ error: "option must be 'A' or 'B'" }, { status: 400 });
  }

  // Ensure Prisma User record exists (upsert by email)
  let dbUser = await prisma.user.findFirst({ where: { email: user.email! } });
  if (!dbUser) {
    const base = user.user_metadata?.username || user.email!.split("@")[0];
    const username = `${base}_${Date.now().toString(36)}`;
    try {
      dbUser = await prisma.user.create({ data: { email: user.email!, username } });
    } catch {
      dbUser = await prisma.user.findFirst({ where: { email: user.email! } });
    }
  }
  if (!dbUser) return NextResponse.json({ error: "User record not found" }, { status: 500 });

  // Check if already voted
  const existing = await prisma.debateVote.findUnique({
    where: { debateId_userId: { debateId: id, userId: dbUser.id } },
  });

  if (existing) {
    const debate = await prisma.debate.findUnique({ where: { id } });
    return NextResponse.json({
      votesA: debate?.votesA ?? 0,
      votesB: debate?.votesB ?? 0,
      userVote: existing.option,
      alreadyVoted: true,
    });
  }

  // Record vote + increment counter atomically
  const [, debate] = await prisma.$transaction([
    prisma.debateVote.create({ data: { debateId: id, userId: dbUser.id, option } }),
    prisma.debate.update({
      where: { id },
      data: option === "A" ? { votesA: { increment: 1 } } : { votesB: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ votesA: debate.votesA, votesB: debate.votesB, userVote: option });
}
