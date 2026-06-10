import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// POST /api/posts/[id]/like — toggles like for current user
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data, error } = await supabase.rpc("toggle_post_like", {
    p_post_id: id,
    p_user_id: user.id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch updated likes_count
  const { data: post } = await supabase
    .from("posts")
    .select("likes_count")
    .eq("id", id)
    .single();

  return NextResponse.json({ liked: data as boolean, likes_count: post?.likes_count ?? 0 });
}
