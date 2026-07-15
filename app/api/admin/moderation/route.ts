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

const ENSURE_TABLE = `
  CREATE TABLE IF NOT EXISTS content_flags (
    id TEXT PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    reason TEXT NOT NULL,
    "userId" TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    "autoHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

// GET /api/admin/moderation — list flagged content
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(ENSURE_TABLE);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const contentType = searchParams.get("contentType");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const offset = (page - 1) * limit;

  // Build conditions for parameterized query
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`f.status = $${paramIndex++}`);
    params.push(status);
  }
  if (contentType) {
    conditions.push(`f."contentType" = $${paramIndex++}`);
    params.push(contentType);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Get flagged items with flag count per contentId
  const flags = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT f.*, g.flag_count
     FROM content_flags f
     LEFT JOIN (
       SELECT "contentId", "contentType", COUNT(*)::int AS flag_count
       FROM content_flags
       GROUP BY "contentId", "contentType"
     ) g ON f."contentId" = g."contentId" AND f."contentType" = g."contentType"
     ${whereClause}
     ORDER BY f."createdAt" DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    ...params,
    limit,
    offset
  );

  const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) AS count FROM content_flags f ${whereClause}`,
    ...params
  );
  const total = Number(countResult[0].count);

  return NextResponse.json({
    flags,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

// PATCH /api/admin/moderation — update flag status
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(ENSURE_TABLE);

  const { id, status } = await req.json();
  if (!id || !status || !["pending", "reviewed", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "Invalid id or status" }, { status: 400 });
  }

  try {
    if (status === "reviewed") {
      await prisma.$executeRaw`
        UPDATE content_flags
        SET status = ${status}, "autoHidden" = true, "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE content_flags
        SET status = ${status}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
    }
    return NextResponse.json({ id, status, success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to update flag", debug: msg }, { status: 500 });
  }
}

// DELETE /api/admin/moderation?id=xxx — delete a flag
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(ENSURE_TABLE);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await prisma.$executeRaw`DELETE FROM content_flags WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to delete flag", debug: msg }, { status: 500 });
  }
}
