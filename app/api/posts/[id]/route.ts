import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// DELETE /api/posts/[id] — delete own post
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  console.log(`[/api/posts/${id} DELETE] user_id=${user.id} post_id=${id}`);

  // Only allow deleting own posts
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error(`[/api/posts/${id} DELETE] ERROR`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[/api/posts/${id} DELETE] OK`);
  return NextResponse.json({ deleted: true });
}
