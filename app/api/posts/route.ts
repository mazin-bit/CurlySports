import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/posts?sport=football&cursor=<iso-date>&limit=20
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const sport  = searchParams.get("sport") ?? "football";
  const cursor = searchParams.get("cursor");
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  // Get current user (optional — not required to read)
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("posts")
    .select("*")
    .eq("sport", sport)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;
  if (error) {
    // Table not yet created or other DB issue — return empty gracefully so UI shows empty state
    console.error("[/api/posts GET]", error.code, error.message);
    return NextResponse.json({ posts: [], nextCursor: null, setup_needed: true });
  }
  if (!posts?.length) return NextResponse.json({ posts: [], nextCursor: null });

  // Fetch user's likes and votes in parallel (only if logged in)
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
    liked:      likedSet.has(p.id),
    voted_option: votedMap.has(p.id) ? votedMap.get(p.id) : null,
  }));

  const nextCursor = posts.length === limit ? posts[posts.length - 1].created_at : null;

  return NextResponse.json({ posts: enriched, nextCursor });
}

// POST /api/posts
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { content, sport, tag, image_url, poll } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const authorName = user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email?.split("@")[0]
    || "Anonymous";

  const pollData = poll?.options?.length >= 2
    ? { options: poll.options, votes: poll.options.map(() => 0) }
    : null;

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id:     user.id,
      author_name: authorName,
      content:     content.trim(),
      sport:       sport ?? "football",
      tag:         tag ?? "DEBATE",
      image_url:   image_url ?? null,
      poll:        pollData,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, liked: false, voted_option: null }, { status: 201 });
}
