import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";

// DELETE /api/posts/[id] — delete own post
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

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
}
