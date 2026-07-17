import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
    // Only allow deleting own posts
    const deleted = await prisma.post.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Post not found or not yours" }, { status: 404 });
    }

    logger.info("post deleted", { postId: id });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    logger.error("post delete error", { postId: id, error: String(err) });
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
