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

const ENSURE_SPONSORS_TABLE = `
  CREATE TABLE IF NOT EXISTS sponsors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "logoUrl" TEXT,
    website TEXT,
    tier TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

const ENSURE_ADS_TABLE = `
  CREATE TABLE IF NOT EXISTS ads (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    "imageUrl" TEXT,
    "linkUrl" TEXT NOT NULL,
    slot TEXT NOT NULL,
    "sponsorId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

// GET /api/admin/sponsors — list sponsors
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(ENSURE_SPONSORS_TABLE);
  await prisma.$executeRawUnsafe(ENSURE_ADS_TABLE);

  const { searchParams } = new URL(req.url);
  const active = searchParams.get("active");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (active !== null && active !== undefined && active !== "") {
    conditions.push(`s."isActive" = $${paramIndex++}`);
    params.push(active === "true");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sponsors = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT s.*,
            COALESCE(ac.ad_count, 0)::int AS "adCount"
     FROM sponsors s
     LEFT JOIN (
       SELECT "sponsorId", COUNT(*)::int AS ad_count
       FROM ads
       GROUP BY "sponsorId"
     ) ac ON s.id = ac."sponsorId"
     ${whereClause}
     ORDER BY s."createdAt" DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    ...params,
    limit,
    offset
  );

  const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) AS count FROM sponsors s ${whereClause}`,
    ...params
  );
  const total = Number(countResult[0].count);

  return NextResponse.json({
    sponsors,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

// POST /api/admin/sponsors — create a sponsor
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(ENSURE_SPONSORS_TABLE);

  const { name, logoUrl, website, tier } = await req.json();

  if (!name || !tier) {
    return NextResponse.json(
      { error: "Missing required fields: name, tier" },
      { status: 400 }
    );
  }

  const validTiers = ["gold", "silver", "bronze"];
  if (!validTiers.includes(tier)) {
    return NextResponse.json(
      { error: `Invalid tier. Must be one of: ${validTiers.join(", ")}` },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();

  try {
    await prisma.$executeRaw`
      INSERT INTO sponsors (id, name, "logoUrl", website, tier, "isActive", "createdAt", "updatedAt")
      VALUES (${id}, ${name}, ${logoUrl ?? null}, ${website ?? null}, ${tier}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    return NextResponse.json({ id, name, tier, status: "created" }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to create sponsor", debug: msg }, { status: 500 });
  }
}

// PATCH /api/admin/sponsors — update a sponsor
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(ENSURE_SPONSORS_TABLE);

  const body = await req.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const setClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (body.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    params.push(body.name);
  }
  if (body.logoUrl !== undefined) {
    setClauses.push(`"logoUrl" = $${paramIndex++}`);
    params.push(body.logoUrl);
  }
  if (body.website !== undefined) {
    setClauses.push(`website = $${paramIndex++}`);
    params.push(body.website);
  }
  if (body.tier !== undefined) {
    const validTiers = ["gold", "silver", "bronze"];
    if (!validTiers.includes(body.tier)) {
      return NextResponse.json(
        { error: `Invalid tier. Must be one of: ${validTiers.join(", ")}` },
        { status: 400 }
      );
    }
    setClauses.push(`tier = $${paramIndex++}`);
    params.push(body.tier);
  }
  if (body.isActive !== undefined) {
    setClauses.push(`"isActive" = $${paramIndex++}`);
    params.push(body.isActive);
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  setClauses.push(`"updatedAt" = CURRENT_TIMESTAMP`);
  params.push(id);

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE sponsors SET ${setClauses.join(", ")} WHERE id = $${paramIndex}`,
      ...params
    );
    return NextResponse.json({ id, success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to update sponsor", debug: msg }, { status: 500 });
  }
}

// DELETE /api/admin/sponsors?id=xxx — delete a sponsor and unlink ads
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(ENSURE_SPONSORS_TABLE);
  await prisma.$executeRawUnsafe(ENSURE_ADS_TABLE);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await prisma.$executeRaw`UPDATE ads SET "sponsorId" = NULL, "updatedAt" = CURRENT_TIMESTAMP WHERE "sponsorId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM sponsors WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to delete sponsor", debug: msg }, { status: 500 });
  }
}
