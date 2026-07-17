import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/user/stats — returns post count, debate vote count for the current user
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const [posts, votes] = await Promise.all([
    prisma.post.count({ where: { userId: user.id } }),
    prisma.debateVote.count({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({ posts, votes });
}
