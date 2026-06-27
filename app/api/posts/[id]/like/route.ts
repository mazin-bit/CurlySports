import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
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

  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase.rpc("toggle_post_like", {
    p_post_id: id,
    p_user_id: user.id,
  });

  if (error) {
    logger.error("post like failed", { postId: id, code: error.code });
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }

  const { data: post } = await supabase
    .from("posts")
    .select("likes_count")
    .eq("id", id)
    .single();

  return NextResponse.json({ liked: data as boolean, likes_count: post?.likes_count ?? 0 });
}
