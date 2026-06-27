import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireAuth, optionalAuth } from "@/lib/auth";
import { parseBody, createPostSchema } from "@/lib/validation";
import { rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// GET /api/posts?sport=football&cursor=<iso-date>&limit=20
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await optionalAuth();
  const { searchParams } = new URL(req.url);
  const sport  = searchParams.get("sport");
  const cursor = searchParams.get("cursor");
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "20") || 20, 50);

  let query = supabase
    .from("posts")
    .select("*, post_comments(count)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (sport && sport !== "all") {
    query = query.eq("sport", sport);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;
  if (error) {
    logger.error("posts fetch failed", { code: error.code });
    return NextResponse.json({ posts: [], nextCursor: null, setup_needed: true });
  }
  if (!posts?.length) return NextResponse.json({ posts: [], nextCursor: null });

  let likedSet = new Set<string>();
  let votedMap = new Map<string, number>();

  if (user) {
    const postIds = posts.map((p) => p.id);
    const [{ data: likes }, { data: votes }] = await Promise.all([
      supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
      supabase.from("post_votes").select("post_id,option_index").eq("user_id", user.id).in("post_id", postIds),
    ]);
    likes?.forEach((l) => likedSet.add(l.post_id));
    votes?.forEach((v) => votedMap.set(v.post_id, v.option_index));
  }

  const enriched = posts.map((p) => ({
    ...p,
    liked:         likedSet.has(p.id),
    voted_option:  votedMap.has(p.id) ? votedMap.get(p.id) : null,
    comments_count: (p.post_comments as { count: number }[] | null)?.[0]?.count ?? 0,
    post_comments: undefined,
  }));

  const nextCursor = posts.length === limit ? posts[posts.length - 1].created_at : null;

  return NextResponse.json({ posts: enriched, nextCursor });
}

// POST /api/posts
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const supabase = await createClient();

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

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id:     user.id,
      author_name: authorName,
      content,
      sport,
      tag,
      image_url:   image_url ?? null,
      poll:        pollData,
    })
    .select()
    .single();

  if (error) {
    logger.error("post create failed", { code: error.code });
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }

  logger.info("post created", { postId: data.id });
  return NextResponse.json({ ...data, liked: false, voted_option: null }, { status: 201 });
}
