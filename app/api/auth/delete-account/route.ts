import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { clearAuthCookies } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";

// DELETE /api/auth/delete-account — permanently delete account and all data
export async function DELETE() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    // 1. Delete user-generated content from Supabase (posts, likes, comments, votes)
    const supabase = await createClient();

    // Delete in order: child records first
    await supabase.from("post_comments").delete().eq("user_id", user.id);
    await supabase.from("post_likes").delete().eq("user_id", user.id);
    await supabase.from("post_votes").delete().eq("user_id", user.id);
    await supabase.from("posts").delete().eq("user_id", user.id);

    // 2. Delete Prisma user record (cascades: favorites, debate_votes, predictions, etc.)
    const prismaUser = await prisma.user.findFirst({ where: { email: user.email } });
    if (prismaUser) {
      await prisma.user.delete({ where: { id: prismaUser.id } });
    }

    logger.info("account deleted", { userId: user.id, email: user.email });

    // 3. Clear auth cookies and return success
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
