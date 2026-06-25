import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

// GET /api/user/stats — returns post count, debate vote count for the current user
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;
  const supabase = await createClient();

  const [{ count: posts }, { count: votes }] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("debate_votes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return NextResponse.json({ posts: posts ?? 0, votes: votes ?? 0 });
}
