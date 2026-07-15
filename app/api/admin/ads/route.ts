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

// GET /api/admin/ads — list ads with optional filters
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(ENSURE_SPONSORS_TABLE);
  await prisma.$executeRawUnsafe(ENSURE_ADS_TABLE);

  const { searchParams } = new URL(req.url);
  const slot = searchParams.get("slot");
  const active = searchParams.get("active");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (slot) {
    conditions.push(`a.slot = $${paramIndex++}`);
    params.push(slot);
  }
  if (active !== null && active !== undefined && active !== "") {
    conditions.push(`a."isActive" = $${paramIndex++}`);
    params.push(active === "true");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const ads = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT a.*,
            s.name AS "sponsorName",
            s."logoUrl" AS "sponsorLogoUrl",
            s.website AS "sponsorWebsite",
            s.tier AS "sponsorTier",
            CASE WHEN a.impressions > 0
              THEN ROUND((a.clicks::numeric / a.impressions::numeric) * 100, 2)
              ELSE 0
            END AS ctr
     FROM ads a
     LEFT JOIN sponsors s ON a."sponsorId" = s.id
     ${whereClause}
     ORDER BY a."createdAt" DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    ...params,
    limit,
    offset
  );

  const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) AS count FROM ads a ${whereClause}`,
    ...params
  );
  const total = Number(countResult[0].count);

  return NextResponse.json({
    ads,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

// POST /api/admin/ads — create a new ad
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(ENSURE_SPONSORS_TABLE);
  await prisma.$executeRawUnsafe(ENSURE_ADS_TABLE);

  const { title, imageUrl, linkUrl, slot, sponsorId, startDate, endDate } = await req.json();

  if (!title || !linkUrl || !slot || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing required fields: title, linkUrl, slot, startDate, endDate" },
      { status: 400 }
    );
  }

  const validSlots = ["sidebar", "feed", "banner", "match"];
  if (!validSlots.includes(slot)) {
    return NextResponse.json(
      { error: `Invalid slot. Must be one of: ${validSlots.join(", ")}` },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();

  try {
    await prisma.$executeRaw`
      INSERT INTO ads (id, title, "imageUrl", "linkUrl", slot, "sponsorId", "startDate", "endDate", "isActive", impressions, clicks, "createdAt", "updatedAt")
      VALUES (${id}, ${title}, ${imageUrl ?? null}, ${linkUrl}, ${slot}, ${sponsorId ?? null}, ${new Date(startDate)}, ${new Date(endDate)}, true, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    return NextResponse.json({ id, title, slot, status: "created" }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to create ad", debug: msg }, { status: 500 });
  }
}

// PATCH /api/admin/ads — update an ad
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(ENSURE_ADS_TABLE);

  const body = await req.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const setClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (body.title !== undefined) {
    setClauses.push(`title = $${paramIndex++}`);
    params.push(body.title);
  }
  if (body.imageUrl !== undefined) {
    setClauses.push(`"imageUrl" = $${paramIndex++}`);
    params.push(body.imageUrl);
  }
  if (body.linkUrl !== undefined) {
    setClauses.push(`"linkUrl" = $${paramIndex++}`);
    params.push(body.linkUrl);
  }
  if (body.slot !== undefined) {
    const validSlots = ["sidebar", "feed", "banner", "match"];
    if (!validSlots.includes(body.slot)) {
      return NextResponse.json(
        { error: `Invalid slot. Must be one of: ${validSlots.join(", ")}` },
        { status: 400 }
      );
    }
    setClauses.push(`slot = $${paramIndex++}`);
    params.push(body.slot);
  }
  if (body.sponsorId !== undefined) {
    setClauses.push(`"sponsorId" = $${paramIndex++}`);
    params.push(body.sponsorId);
  }
  if (body.startDate !== undefined) {
    setClauses.push(`"startDate" = $${paramIndex++}`);
    params.push(new Date(body.startDate));
  }
  if (body.endDate !== undefined) {
    setClauses.push(`"endDate" = $${paramIndex++}`);
    params.push(new Date(body.endDate));
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
      `UPDATE ads SET ${setClauses.join(", ")} WHERE id = $${paramIndex}`,
      ...params
    );
    return NextResponse.json({ id, success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to update ad", debug: msg }, { status: 500 });
  }
}

// DELETE /api/admin/ads?id=xxx — delete an ad
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(ENSURE_ADS_TABLE);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await prisma.$executeRaw`DELETE FROM ads WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to delete ad", debug: msg }, { status: 500 });
  }
}
