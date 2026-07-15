import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

// GET /api/admin/users — list all users (admin only)
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { username: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  await ensureIsBannedColumn();

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        emailVerified: true,
        favTeam: true,
        googleId: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { favorites: true, predictions: true, debateVotes: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      authMethod: u.googleId ? "google" : "email",
      googleId: undefined,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
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

  await prisma.user.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
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

    // Fetch updated user info
    interface UserRow {
      id: string;
      email: string;
      username: string;
      name: string | null;
      isBanned: boolean;
      updatedAt: Date;
    }

    const rows = await prisma.$queryRaw<UserRow[]>`
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
