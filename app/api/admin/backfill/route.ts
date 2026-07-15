import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { ensureTrackingTables } from "@/lib/ensure-tracking-tables";
import crypto from "crypto";

function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token") ?? "";
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!token || !expected) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

interface SupabaseUser {
  id: string;
  email?: string;
  created_at: string;
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
}

interface SupabaseSession {
  id: string;
  user_id: string;
  created_at: string;
  ip?: string;
  user_agent?: string;
}

/**
 * POST /api/admin/backfill
 *
 * One-time backfill endpoint that:
 * 1. Pulls all users from Supabase auth.users and inserts missing ones into the app's users table
 * 2. Pulls all sessions from Supabase auth.sessions and inserts them into user_sessions
 *
 * Idempotent — uses ON CONFLICT DO NOTHING so it's safe to run multiple times.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const errors: string[] = [];
  let usersBackfilled = 0;
  let sessionsBackfilled = 0;

  try {
    // Ensure tracking tables exist before inserting sessions
    await ensureTrackingTables();

    // --- Step 1: Backfill users ---
    // Fetch all users from Supabase auth.users using the admin API
    // The listUsers API paginates, so we loop until we have them all
    const allSupabaseUsers: SupabaseUser[] = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        errors.push(`Failed to fetch Supabase users page ${page}: ${error.message}`);
        break;
      }

      if (!data?.users || data.users.length === 0) break;

      for (const u of data.users) {
        allSupabaseUsers.push(u as unknown as SupabaseUser);
      }

      // If we got fewer than perPage, we've reached the last page
      if (data.users.length < perPage) break;
      page++;
    }

    // Get existing user IDs from our users table to skip them
    const existingUsers = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM users`
    );
    const existingIds = new Set(existingUsers.map((u) => u.id));

    // Insert missing users
    for (const supaUser of allSupabaseUsers) {
      if (existingIds.has(supaUser.id)) continue;

      const email = supaUser.email ?? "";
      const username = email.split("@")[0] || supaUser.id.slice(0, 8);

      // Extract name and avatar from user_metadata if available
      const name =
        supaUser.user_metadata?.full_name ??
        supaUser.user_metadata?.name ??
        null;
      const avatar = supaUser.user_metadata?.avatar_url ?? null;

      const createdAt = supaUser.created_at;

      try {
        const result = await prisma.$executeRawUnsafe(
          `INSERT INTO users (id, email, username, name, avatar, "isBanned", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, false, $6::timestamptz, $6::timestamptz)
           ON CONFLICT DO NOTHING`,
          supaUser.id,
          email,
          username,
          name,
          avatar,
          createdAt
        );
        usersBackfilled += result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to insert user ${supaUser.id}: ${msg}`);
      }
    }

    // --- Step 2: Backfill sessions ---
    // Supabase auth.sessions is not exposed via the admin SDK,
    // so we query it directly via Supabase's RPC / raw SQL on the auth schema.
    // The supabaseAdmin client with service_role key can query auth.sessions.
    let sessionPage = 0;
    const sessionPageSize = 1000;

    // Build a mapping of supabase user IDs to our user IDs
    // (they should be the same since we use Supabase user IDs as our user IDs,
    //  but we verify the user exists in our table)
    const ourUsers = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM users`
    );
    const ourUserIds = new Set(ourUsers.map((u) => u.id));

    // Query auth.sessions directly via Prisma raw SQL (we have direct DB access)
    try {
      const sessions = await prisma.$queryRawUnsafe<SupabaseSession[]>(
        `SELECT id::text, user_id::text, created_at::text, ip::text, user_agent
         FROM auth.sessions
         ORDER BY created_at ASC`
      );

      for (const sess of sessions) {
        if (!ourUserIds.has(sess.user_id)) continue;

        try {
          const result = await prisma.$executeRawUnsafe(
            `INSERT INTO user_sessions (id, "userId", platform, "ipAddress", "userAgent", "createdAt")
             VALUES ($1, $2, 'web', $3, $4, $5::timestamptz)
             ON CONFLICT (id) DO NOTHING`,
            sess.id,
            sess.user_id,
            sess.ip ?? null,
            sess.user_agent ?? null,
            sess.created_at
          );
          sessionsBackfilled += result;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Failed to insert session ${sess.id}: ${msg}`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to query auth.sessions: ${msg}`);
    }

    return NextResponse.json({
      usersBackfilled,
      sessionsBackfilled,
      errors,
    });
  } catch (err) {
    console.error("Backfill error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "Backfill failed",
        debug: msg,
        usersBackfilled,
        sessionsBackfilled,
        errors,
      },
      { status: 500 }
    );
  }
}
