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
  CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetUsers" TEXT[],
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

// GET /api/admin/notifications — list scheduled notifications
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(ENSURE_TABLE);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const notifications = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT * FROM scheduled_notifications ${whereClause} ORDER BY "scheduledAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    ...params,
    limit,
    offset
  );

  const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) AS count FROM scheduled_notifications ${whereClause}`,
    ...params
  );
  const total = Number(countResult[0].count);

  return NextResponse.json({
    notifications,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

// POST /api/admin/notifications — create a scheduled notification
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(ENSURE_TABLE);

  const { title, body, targetType, target, targetUsers, scheduledAt } = await req.json();

  // Accept both "targetType" and "target" (client compat)
  const resolvedTarget = targetType || target;

  if (!title || !body || !resolvedTarget) {
    return NextResponse.json(
      { error: "Missing required fields: title, body, targetType" },
      { status: 400 }
    );
  }

  const validTargetTypes = ["all", "ios", "android", "web", "user", "specific"];
  if (!validTargetTypes.includes(resolvedTarget)) {
    return NextResponse.json(
      { error: `Invalid targetType. Must be one of: ${validTargetTypes.join(", ")}` },
      { status: 400 }
    );
  }

  // "specific" is an alias for "user" on the client side
  const finalTarget = resolvedTarget === "specific" ? "user" : resolvedTarget;

  if (finalTarget === "user" && (!targetUsers || (Array.isArray(targetUsers) && targetUsers.length === 0))) {
    return NextResponse.json(
      { error: "targetUsers is required when targeting specific users" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  // Accept targetUsers as string (comma-separated) or array
  let usersArray: string[] = [];
  if (targetUsers) {
    if (Array.isArray(targetUsers)) {
      usersArray = targetUsers;
    } else if (typeof targetUsers === "string") {
      usersArray = targetUsers.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  }

  // scheduledAt is optional — default to now (send immediately)
  const scheduleDate = scheduledAt ? new Date(scheduledAt) : new Date();

  await prisma.$executeRaw`
    INSERT INTO scheduled_notifications (id, title, body, "targetType", "targetUsers", "scheduledAt", status, "createdAt", "updatedAt")
    VALUES (${id}, ${title}, ${body}, ${finalTarget}, ${usersArray}, ${scheduleDate}, 'scheduled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;

  return NextResponse.json({ id, title, body, targetType: finalTarget, targetUsers: usersArray, scheduledAt: scheduleDate.toISOString(), status: "scheduled" }, { status: 201 });
}

// PATCH /api/admin/notifications — update notification (cancel or reschedule)
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(ENSURE_TABLE);

  const { id, status, scheduledAt } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (status && !["scheduled", "sent", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (status && scheduledAt) {
    await prisma.$executeRaw`
      UPDATE scheduled_notifications
      SET status = ${status}, "scheduledAt" = ${new Date(scheduledAt)}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
  } else if (status) {
    await prisma.$executeRaw`
      UPDATE scheduled_notifications
      SET status = ${status}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
  } else if (scheduledAt) {
    await prisma.$executeRaw`
      UPDATE scheduled_notifications
      SET "scheduledAt" = ${new Date(scheduledAt)}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
  } else {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  return NextResponse.json({ id, success: true });
}

// DELETE /api/admin/notifications?id=xxx — delete a notification
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

  await prisma.$executeRaw`DELETE FROM scheduled_notifications WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
