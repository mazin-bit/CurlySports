import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/posts/debug — diagnostic endpoint to test Supabase posts connectivity
export async function GET() {
  const steps: Record<string, string> = {};

  // Step 1: Check env vars
  steps.DATABASE_URL = process.env.DATABASE_URL ? "set" : "MISSING";
  steps.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "MISSING";
  steps.JWT_SECRET = process.env.JWT_SECRET ? "set" : "MISSING";

  // Show derived URL (project ID only, not full URL)
  const dbUrl = process.env.DATABASE_URL || "";
  const match = dbUrl.match(/postgres(?:ql)?:\/\/postgres\.([^:]+):/);
  steps.derived_supabase_project = match?.[1] ? `${match[1].slice(0, 8)}...` : "NONE";

  // Step 2: Try creating the Supabase client
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    steps.supabase_client = "ok";

    // Step 3: Try querying the posts table
    try {
      const { data, error, count } = await supabase
        .from("posts")
        .select("id", { count: "exact" })
        .limit(1);

      if (error) {
        steps.posts_query = `error: ${error.code} - ${error.message}`;
      } else {
        steps.posts_query = `ok (${count ?? data?.length ?? 0} total rows)`;
      }
    } catch (err) {
      steps.posts_query = `threw: ${(err as Error).message}`;
    }

    // Step 4: Try querying with the embedded join (post_comments)
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*, post_comments(count)")
        .limit(1);

      if (error) {
        steps.posts_with_comments = `error: ${error.code} - ${error.message}`;
      } else {
        steps.posts_with_comments = `ok (${data?.length ?? 0} rows)`;
      }
    } catch (err) {
      steps.posts_with_comments = `threw: ${(err as Error).message}`;
    }

    // Step 5: Check post_comments table exists
    try {
      const { error } = await supabase
        .from("post_comments")
        .select("id")
        .limit(1);

      if (error) {
        steps.post_comments_table = `error: ${error.code} - ${error.message}`;
      } else {
        steps.post_comments_table = "ok";
      }
    } catch (err) {
      steps.post_comments_table = `threw: ${(err as Error).message}`;
    }

  } catch (err) {
    steps.supabase_client = `threw: ${(err as Error).message}`;
  }

  // Step 6: Test optionalAuth
  try {
    const { optionalAuth } = await import("@/lib/auth");
    const user = await optionalAuth();
    steps.optional_auth = user ? `ok (user: ${user.id.slice(0, 8)}...)` : "ok (no user)";
  } catch (err) {
    steps.optional_auth = `threw: ${(err as Error).message}`;
  }

  return NextResponse.json({ diagnostic: "posts", steps });
}
