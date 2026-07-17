import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { clearAuthCookies } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// DELETE /api/auth/delete-account — permanently delete account and all data
export async function DELETE() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    // Delete user-generated content (child records first)
    await prisma.commentLike.deleteMany({ where: { userId: user.id } });
    await prisma.postComment.deleteMany({ where: { userId: user.id } });
    await prisma.postLike.deleteMany({ where: { userId: user.id } });
    await prisma.postVote.deleteMany({ where: { userId: user.id } });
    await prisma.post.deleteMany({ where: { userId: user.id } });

    // Delete Prisma user record (cascades: favorites, debate_votes, predictions, etc.)
    const prismaUser = await prisma.user.findFirst({ where: { email: user.email } });
    if (prismaUser) {
      await prisma.user.delete({ where: { id: prismaUser.id } });
    }

    logger.info("account deleted", { userId: user.id, email: user.email });

    // Clear auth cookies and return success
    const response = NextResponse.json({ deleted: true });
    clearAuthCookies(response);
    return response;
  } catch (err) {
    logger.error("account deletion failed", { userId: user.id, error: String(err) });
    return NextResponse.json(
      { error: "Failed to delete account. Please try again or contact support." },
      { status: 500 }
    );
  }
}
