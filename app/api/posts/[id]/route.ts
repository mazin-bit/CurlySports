import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

// DELETE /api/posts/[id] — delete own post
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { id } = await params;

  try {
    const supabase = await createClient();

    // Only allow deleting own posts
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("post delete failed", { postId: id, code: error.code });
      return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }

    logger.info("post deleted", { postId: id });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    logger.error("post delete error", { postId: id, error: String(err) });
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
