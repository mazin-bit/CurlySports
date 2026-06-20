import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { parseBody, createCommentSchema, commentLikeSchema } from "@/lib/validation";
import { rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// GET /api/posts/[id]/comments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: comments, error } = await supabase
    .from("post_comments")
    .select("*")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("comments fetch failed", { postId: id, code: error.code });
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  let likedSet = new Set<string>();

  if (user && comments?.length) {
    const { data: likes } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", user.id)
      .in("comment_id", comments.map((c) => c.id));
    likes?.forEach((l) => likedSet.add(l.comment_id));
  }

  const enriched = (comments ?? []).map((c) => ({ ...c, liked: likedSet.has(c.id) }));
  return NextResponse.json({ comments: enriched });
}

// POST /api/posts/[id]/comments  body: { content }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 30 comments per hour per user
  const limited = await rateLimiters.createComment(req, user.id);
  if (limited) return limited;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createCommentSchema, body);
  if (!parsed.success) return parsed.response;
  const { content } = parsed.data;

  const authorName = user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email?.split("@")[0]
    || "Anonymous";

  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: id, user_id: user.id, author_name: authorName, content })
    .select()
    .single();

  if (error) {
    logger.error("comment create failed", { postId: id, code: error.code });
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }

  logger.info("comment created", { postId: id, commentId: data.id });
  return NextResponse.json({ ...data, liked: false }, { status: 201 });
}

// PATCH — toggle comment like
export async function PATCH(
  req: NextRequest,
  _ctx: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(commentLikeSchema, body);
  if (!parsed.success) return parsed.response;
  const { commentId } = parsed.data;

  const { data, error } = await supabase.rpc("toggle_comment_like", {
    p_comment_id: commentId,
    p_user_id: user.id,
  });

  if (error) {
    logger.error("comment like failed", { commentId, code: error.code });
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }

  const { data: comment } = await supabase
    .from("post_comments")
    .select("likes_count")
    .eq("id", commentId)
    .single();

  return NextResponse.json({ liked: data as boolean, likes_count: comment?.likes_count ?? 0 });
}
