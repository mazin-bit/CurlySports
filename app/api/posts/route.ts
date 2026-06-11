import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/posts?sport=football&cursor=<iso-date>&limit=20
// sport=all (or omitted) returns posts from all sports
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const sport  = searchParams.get("sport");   // null = all sports
  const cursor = searchParams.get("cursor");
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  // Get current user (optional — not required to read)
  const { data: { user } } = await supabase.auth.getUser();
  console.log(`[/api/posts GET] table=posts sport=${sport ?? "all"} user_id=${user?.id ?? "anon"} limit=${limit}`);

  let query = supabase
    .from("posts")
    .select("*, post_comments(count)")
    .order("created_at", { ascending: false })
    .limit(limit);

  // Only filter by sport when explicitly requested (not "all" and not null)
  if (sport && sport !== "all") {
    query = query.eq("sport", sport);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;
  if (error) {
    console.error("[/api/posts GET] ERROR table=posts", error.code, error.message);
    return NextResponse.json({ posts: [], nextCursor: null, setup_needed: true });
  }
  console.log(`[/api/posts GET] result count=${posts?.length ?? 0}`);
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { content, sport, tag, image_url, poll } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  console.log(`[/api/posts POST] table=posts INSERT user_id=${user.id} sport=${sport ?? "football"} tag=${tag ?? "DEBATE"}`);
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

  if (error) { console.error("[/api/posts POST] ERROR", error.message); return NextResponse.json({ error: error.message }, { status: 500 }); }
  console.log(`[/api/posts POST] INSERT OK id=${data.id} author=${data.author_name}`);
  return NextResponse.json({ ...data, liked: false, voted_option: null }, { status: 201 });
}
