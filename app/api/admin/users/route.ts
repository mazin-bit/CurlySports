import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTrackingTables } from "@/lib/ensure-tracking-tables";

function isAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(process.env.ADMIN_PASSWORD);
  if (a.length !== b.length) return false;
  const { timingSafeEqual } = require("crypto");
  return timingSafeEqual(a, b);
}

async function ensureIsBannedColumn() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "isBanned" BOOLEAN NOT NULL DEFAULT false
    `);
  } catch {
    /* column may already exist */
  }
}

interface UserRow {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  avatar: string | null;
  emailVerified: boolean;
  favTeam: string | null;
  googleId: string | null;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
  favoriteCount: number;
  predictionCount: number;
  debateVoteCount: number;
  lastPlatform: string | null;
  lastCountry: string | null;
  lastCity: string | null;
}

// GET /api/admin/users — list all users (admin only)
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const offset = (page - 1) * limit;

  await ensureIsBannedColumn();
  await ensureTrackingTables();

  try {
    const searchFilter = search
      ? `WHERE LOWER(u.email) LIKE '%' || $3 || '%' OR LOWER(COALESCE(u.username, '')) LIKE '%' || $3 || '%' OR LOWER(COALESCE(u.name, '')) LIKE '%' || $3 || '%'`
      : "";

    const countFilter = search
      ? `WHERE LOWER(email) LIKE '%' || $1 || '%' OR LOWER(COALESCE(username, '')) LIKE '%' || $1 || '%' OR LOWER(COALESCE(name, '')) LIKE '%' || $1 || '%'`
      : "";

    let users: UserRow[];
    let totalRows: Array<{ count: bigint }>;

    if (search) {
      users = await prisma.$queryRawUnsafe<UserRow[]>(`
        SELECT u.id, u.email, u.username, u.name, u.avatar, u."emailVerified",
               u."favTeam", u."googleId",
               COALESCE(u."isBanned", false) as "isBanned",
               u."createdAt", u."updatedAt",
               COALESCE(fav.cnt, 0)::int as "favoriteCount",
               COALESCE(pred.cnt, 0)::int as "predictionCount",
               COALESCE(dv.cnt, 0)::int as "debateVoteCount",
               ls.platform as "lastPlatform",
               ls.country as "lastCountry",
               ls.city as "lastCity"
        FROM users u
        LEFT JOIN (SELECT "userId", COUNT(*) as cnt FROM favorites GROUP BY "userId") fav ON fav."userId" = u.id
        LEFT JOIN (SELECT "userId", COUNT(*) as cnt FROM predictions GROUP BY "userId") pred ON pred."userId" = u.id
        LEFT JOIN (SELECT "userId", COUNT(*) as cnt FROM debate_votes GROUP BY "userId") dv ON dv."userId" = u.id
        LEFT JOIN LATERAL (
          SELECT platform, country, city FROM user_sessions
          WHERE "userId" = u.id ORDER BY "createdAt" DESC LIMIT 1
        ) ls ON true
        ${searchFilter}
        ORDER BY u."createdAt" DESC
        LIMIT $1 OFFSET $2
      `, limit, offset, search);

      totalRows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
        SELECT COUNT(*)::int as count FROM users ${countFilter}
      `, search);
    } else {
      users = await prisma.$queryRawUnsafe<UserRow[]>(`
        SELECT u.id, u.email, u.username, u.name, u.avatar, u."emailVerified",
               u."favTeam", u."googleId",
               COALESCE(u."isBanned", false) as "isBanned",
               u."createdAt", u."updatedAt",
               COALESCE(fav.cnt, 0)::int as "favoriteCount",
               COALESCE(pred.cnt, 0)::int as "predictionCount",
               COALESCE(dv.cnt, 0)::int as "debateVoteCount",
               ls.platform as "lastPlatform",
               ls.country as "lastCountry",
               ls.city as "lastCity"
        FROM users u
        LEFT JOIN (SELECT "userId", COUNT(*) as cnt FROM favorites GROUP BY "userId") fav ON fav."userId" = u.id
        LEFT JOIN (SELECT "userId", COUNT(*) as cnt FROM predictions GROUP BY "userId") pred ON pred."userId" = u.id
        LEFT JOIN (SELECT "userId", COUNT(*) as cnt FROM debate_votes GROUP BY "userId") dv ON dv."userId" = u.id
        LEFT JOIN LATERAL (
          SELECT platform, country, city FROM user_sessions
          WHERE "userId" = u.id ORDER BY "createdAt" DESC LIMIT 1
        ) ls ON true
        ORDER BY u."createdAt" DESC
        LIMIT $1 OFFSET $2
      `, limit, offset);

      totalRows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
        SELECT COUNT(*)::int as count FROM users
      `);
    }

    const total = Number(totalRows[0]?.count ?? 0);

    return NextResponse.json({
      users: users.map((u) => {
        const location = [u.lastCity, u.lastCountry].filter(Boolean).join(", ");
        return {
          id: u.id,
          email: u.email,
          username: u.username,
          name: u.name,
          avatar: u.avatar,
          emailVerified: u.emailVerified,
          favTeam: u.favTeam,
          isBanned: u.isBanned,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          authMethod: u.googleId ? "google" : "email",
          platform: u.lastPlatform || undefined,
          lastLoginLocation: location || undefined,
          _count: {
            favorites: Number(u.favoriteCount),
            predictions: Number(u.predictionCount),
            debateVotes: Number(u.debateVoteCount),
          },
        };
      }),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Users GET error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to fetch users", debug: msg }, { status: 500 });
  }
}

// DELETE /api/admin/users?id=xxx — delete a user (admin only)
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    // Delete related records first to avoid foreign key constraints
    await prisma.$executeRaw`DELETE FROM favorites WHERE "userId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM predictions WHERE "userId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM debate_votes WHERE "userId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM users WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Users DELETE error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to delete user", debug: msg }, { status: 500 });
  }
}

// PATCH /api/admin/users — ban/unban a user (admin only)
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, isBanned } = await req.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }
    if (typeof isBanned !== "boolean") {
      return NextResponse.json({ error: "isBanned must be a boolean" }, { status: 400 });
    }

    await ensureIsBannedColumn();

    await prisma.$executeRaw`
      UPDATE users SET "isBanned" = ${isBanned}, "updatedAt" = NOW() WHERE id = ${id}
    `;

    interface PatchUserRow {
      id: string;
      email: string;
      username: string;
      name: string | null;
      isBanned: boolean;
      updatedAt: Date;
    }

    const rows = await prisma.$queryRaw<PatchUserRow[]>`
      SELECT id, email, username, name, "isBanned", "updatedAt"
      FROM users WHERE id = ${id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: rows[0], success: true });
  } catch (err) {
    console.error("Ban/unban error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to update user", debug: msg }, { status: 500 });
  }
}
