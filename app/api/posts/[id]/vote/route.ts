import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { parseBody, voteSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

// POST /api/posts/[id]/vote  body: { optionIndex: number }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(voteSchema, body);
  if (!parsed.success) return parsed.response;
  const { optionIndex } = parsed.data;

  const { error } = await supabase.rpc("cast_post_vote", {
    p_post_id:      id,
    p_user_id:      user.id,
    p_option_index: optionIndex,
  });

  if (error) {
    if (error.message.includes("already_voted")) {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }
    logger.error("post vote failed", { postId: id, code: error.code });
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
  }

  const { data: post } = await supabase
    .from("posts")
    .select("poll")
    .eq("id", id)
    .single();

  return NextResponse.json({ poll: post?.poll, voted_option: optionIndex });
}
