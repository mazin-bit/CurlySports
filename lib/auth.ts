import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * Gets the authenticated Supabase user for use inside API route handlers.
 *
 * Returns { user, supabase } on success, or a 401 NextResponse when no
 * session is present — caller should `return` the response immediately.
 *
 * Usage:
 *   const auth = await requireAuth();
 *   if (auth instanceof NextResponse) return auth;
 *   const { user } = auth;
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { user, supabase };
}
