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

async function ensureTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      platform TEXT NOT NULL DEFAULT 'web',
      "ipAddress" TEXT,
      country TEXT,
      city TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

interface SessionRow {
  id: string;
  userId: string;
  platform: string;
  ipAddress: string | null;
  country: string | null;
  city: string | null;
  userAgent: string | null;
  createdAt: Date;
}

interface CountRow {
  count: bigint;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureTables();

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
    const userId = url.searchParams.get("userId") || null;
    const offset = (page - 1) * limit;

    let sessions: SessionRow[];
    let countResult: CountRow[];

    if (userId) {
      sessions = await prisma.$queryRaw<SessionRow[]>`
        SELECT id, "userId", platform, "ipAddress", country, city, "userAgent", "createdAt"
        FROM user_sessions
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) as count FROM user_sessions
        WHERE "userId" = ${userId}
      `;
    } else {
      sessions = await prisma.$queryRaw<SessionRow[]>`
        SELECT id, "userId", platform, "ipAddress", country, city, "userAgent", "createdAt"
        FROM user_sessions
        ORDER BY "createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) as count FROM user_sessions
      `;
    }

    const total = Number(countResult[0].count);

    return NextResponse.json({
      sessions,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Sessions error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to fetch sessions", debug: msg }, { status: 500 });
  }
}
