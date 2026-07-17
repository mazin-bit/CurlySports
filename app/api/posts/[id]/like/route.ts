import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

// POST /api/posts/[id]/like — toggles like for current user
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { id } = await params;

  try {
    // Check if already liked
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId: id, userId: user.id } },
    });

    let liked: boolean;

    if (existing) {
      // Unlike: delete the like and decrement count
      await prisma.$transaction([
        prisma.postLike.delete({ where: { id: existing.id } }),
        prisma.post.update({ where: { id }, data: { likesCount: { decrement: 1 } } }),
      ]);
      liked = false;
    } else {
      // Like: create the like and increment count
      await prisma.$transaction([
        prisma.postLike.create({ data: { postId: id, userId: user.id } }),
        prisma.post.update({ where: { id }, data: { likesCount: { increment: 1 } } }),
      ]);
      liked = true;
    }

    const post = await prisma.post.findUnique({ where: { id }, select: { likesCount: true } });

    return NextResponse.json({ liked, likes_count: post?.likesCount ?? 0 });
  } catch (err) {
    logger.error("post like failed", { postId: id, error: String(err) });
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
