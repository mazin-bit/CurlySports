import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/posts/debug — diagnostic endpoint to test posts connectivity
export async function GET() {
  const steps: Record<string, string> = {};

  steps.DATABASE_URL = process.env.DATABASE_URL ? "set" : "MISSING";
  steps.JWT_SECRET = process.env.JWT_SECRET ? "set" : "MISSING";

  try {
    const count = await prisma.post.count();
    steps.posts_query = `ok (${count} total rows)`;
  } catch (err) {
    steps.posts_query = `error: ${(err as Error).message}`;
  }

  try {
    const count = await prisma.postComment.count();
    steps.post_comments_table = `ok (${count} rows)`;
  } catch (err) {
    steps.post_comments_table = `error: ${(err as Error).message}`;
  }

  try {
    const { optionalAuth } = await import("@/lib/auth");
    const user = await optionalAuth();
    steps.optional_auth = user ? `ok (user: ${user.id.slice(0, 8)}...)` : "ok (no user)";
  } catch (err) {
    steps.optional_auth = `threw: ${(err as Error).message}`;
  }

  return NextResponse.json({ diagnostic: "posts", steps });
}
