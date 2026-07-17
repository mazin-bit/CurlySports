import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, optionalAuth } from "@/lib/auth";
import { parseBody, createCommentSchema, commentLikeSchema } from "@/lib/validation";
import { rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// GET /api/posts/[id]/comments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await optionalAuth();
  const { id } = await params;

  try {
    const comments = await prisma.postComment.findMany({
      where: { postId: id },
      orderBy: { createdAt: "asc" },
    });

    let likedSet = new Set<string>();

    if (user && comments.length) {
      const likes = await prisma.commentLike.findMany({
        where: { userId: user.id, commentId: { in: comments.map((c) => c.id) } },
        select: { commentId: true },
      });
      likes.forEach((l) => likedSet.add(l.commentId));
    }

    const enriched = comments.map((c) => ({
      id: c.id,
      post_id: c.postId,
      user_id: c.userId,
      author_name: c.authorName,
      content: c.content,
      likes_count: c.likesCount,
      created_at: c.createdAt.toISOString(),
      liked: likedSet.has(c.id),
    }));

    return NextResponse.json({ comments: enriched });
  } catch (err) {
    logger.error("comments fetch failed", { postId: id, error: String(err) });
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

// POST /api/posts/[id]/comments  body: { content }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  // Rate limit: 30 comments per hour per user
  const limited = await rateLimiters.createComment(req, user.id);
  if (limited) return limited;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createCommentSchema, body);
  if (!parsed.success) return parsed.response;
  const { content } = parsed.data;

  const authorName = user.name || user.username || "Anonymous";

  try {
    const comment = await prisma.postComment.create({
      data: { postId: id, userId: user.id, authorName, content },
    });

    logger.info("comment created", { postId: id, commentId: comment.id });
    return NextResponse.json({
      id: comment.id,
      post_id: comment.postId,
      user_id: comment.userId,
      author_name: comment.authorName,
      content: comment.content,
      likes_count: 0,
      created_at: comment.createdAt.toISOString(),
      liked: false,
    }, { status: 201 });
  } catch (err) {
    logger.error("comment create failed", { postId: id, error: String(err) });
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

// PATCH — toggle comment like
export async function PATCH(
  req: NextRequest,
  _ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(commentLikeSchema, body);
  if (!parsed.success) return parsed.response;
  const { commentId } = parsed.data;

  try {
    const existing = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId: user.id } },
    });

    let liked: boolean;

    if (existing) {
      await prisma.$transaction([
        prisma.commentLike.delete({ where: { commentId_userId: { commentId, userId: user.id } } }),
        prisma.postComment.update({ where: { id: commentId }, data: { likesCount: { decrement: 1 } } }),
      ]);
      liked = false;
    } else {
      await prisma.$transaction([
        prisma.commentLike.create({ data: { commentId, userId: user.id } }),
        prisma.postComment.update({ where: { id: commentId }, data: { likesCount: { increment: 1 } } }),
      ]);
      liked = true;
    }

    const comment = await prisma.postComment.findUnique({ where: { id: commentId }, select: { likesCount: true } });

    return NextResponse.json({ liked, likes_count: comment?.likesCount ?? 0 });
  } catch (err) {
    logger.error("comment like failed", { commentId, error: String(err) });
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
