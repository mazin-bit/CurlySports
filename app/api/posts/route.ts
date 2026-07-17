import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, optionalAuth } from "@/lib/auth";
import { parseBody, createPostSchema } from "@/lib/validation";
import { rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// GET /api/posts?sport=football&cursor=<iso-date>&limit=20
export async function GET(req: NextRequest) {
  try {
    const user = await optionalAuth();
    const { searchParams } = new URL(req.url);
    const sport = searchParams.get("sport");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20") || 20, 50);

    const where: Record<string, unknown> = {};
    if (sport && sport !== "all") {
      where.sport = sport;
    }
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        _count: { select: { comments: true } },
      },
    });

    if (!posts.length) return NextResponse.json({ posts: [], nextCursor: null });

    let likedSet = new Set<string>();
    let votedMap = new Map<string, number>();

    if (user) {
      const postIds = posts.map((p) => p.id);
      const [likes, votes] = await Promise.all([
        prisma.postLike.findMany({
          where: { userId: user.id, postId: { in: postIds } },
          select: { postId: true },
        }),
        prisma.postVote.findMany({
          where: { userId: user.id, postId: { in: postIds } },
          select: { postId: true, optionIndex: true },
        }),
      ]);
      likes.forEach((l) => likedSet.add(l.postId));
      votes.forEach((v) => votedMap.set(v.postId, v.optionIndex));
    }

    const enriched = posts.map((p) => ({
      id: p.id,
      user_id: p.userId,
      author_name: p.authorName,
      content: p.content,
      sport: p.sport,
      tag: p.tag,
      image_url: p.imageUrl,
      poll: p.poll,
      likes_count: p.likesCount,
      created_at: p.createdAt.toISOString(),
      liked: likedSet.has(p.id),
      voted_option: votedMap.has(p.id) ? votedMap.get(p.id) : null,
      comments_count: p._count.comments,
    }));

    const nextCursor = posts.length === limit ? posts[posts.length - 1].createdAt.toISOString() : null;

    return NextResponse.json({ posts: enriched, nextCursor });
  } catch (err) {
    const msg = (err as Error).message;
    logger.error("posts GET error", { message: msg, stack: (err as Error).stack?.slice(0, 300) });
    return NextResponse.json({ posts: [], nextCursor: null, error: msg || "Service unavailable" }, { status: 503 });
  }
}

// POST /api/posts
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    // Rate limit: 10 posts per hour per user
    const limited = await rateLimiters.createPost(req, user.id);
    if (limited) return limited;

    const body = await req.json().catch(() => ({}));
    const parsed = parseBody(createPostSchema, body);
    if (!parsed.success) return parsed.response;
    const { content, sport, tag, image_url, poll } = parsed.data;

    const authorName = user.name || user.username || "Anonymous";

    const pollData = poll?.options?.length
      ? { options: poll.options, votes: poll.options.map(() => 0) }
      : null;

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        authorName,
        content,
        sport,
        tag,
        imageUrl: image_url ?? null,
        poll: pollData ?? undefined,
      },
    });

    logger.info("post created", { postId: post.id });
    return NextResponse.json({
      id: post.id,
      user_id: post.userId,
      author_name: post.authorName,
      content: post.content,
      sport: post.sport,
      tag: post.tag,
      image_url: post.imageUrl,
      poll: post.poll,
      likes_count: 0,
      created_at: post.createdAt.toISOString(),
      liked: false,
      voted_option: null,
    }, { status: 201 });
  } catch (err) {
    logger.error("posts POST error", { message: (err as Error).message });
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
