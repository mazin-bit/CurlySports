import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/posts/[id]/comments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  console.log(`[/api/posts/${id}/comments GET] table=post_comments post_id=${id}`);

  const { data: comments, error } = await supabase
    .from("post_comments")
    .select("*")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) { console.error(`[/api/posts/${id}/comments GET] ERROR`, error.message); return NextResponse.json({ error: error.message }, { status: 500 }); }
  console.log(`[/api/posts/${id}/comments GET] count=${comments?.length ?? 0}`);

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

  const { id } = await params;
  const body = await req.json();
  const content = body.content?.trim();
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });
  console.log(`[/api/posts/${id}/comments POST] table=post_comments INSERT user_id=${user.id} post_id=${id}`);

  const authorName = user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email?.split("@")[0]
    || "Anonymous";

  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: id, user_id: user.id, author_name: authorName, content })
    .select()
    .single();

  if (error) { console.error(`[/api/posts/${id}/comments POST] ERROR`, error.message); return NextResponse.json({ error: error.message }, { status: 500 }); }
  console.log(`[/api/posts/${id}/comments POST] INSERT OK id=${data.id}`);
  return NextResponse.json({ ...data, liked: false }, { status: 201 });
}

// POST /api/posts/[id]/comments/[commentId]/like handled separately via like endpoint
// For comment likes we expose it as: POST /api/posts/[id]/comments with action=like&commentId=...
// Or we can create a separate route. Let's add it here as a PATCH:
export async function PATCH(
  req: NextRequest,
  _ctx: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const commentId = body.commentId;
  if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

  const { data, error } = await supabase.rpc("toggle_comment_like", {
    p_comment_id: commentId,
    p_user_id: user.id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: comment } = await supabase
    .from("post_comments")
    .select("likes_count")
    .eq("id", commentId)
    .single();

  return NextResponse.json({ liked: data as boolean, likes_count: comment?.likes_count ?? 0 });
}
