import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAdmin(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (!process.env.ADMIN_PASSWORD) return false;
  return token === process.env.ADMIN_PASSWORD;
}

interface FeedbackRow {
  id: string;
  userId: string | null;
  email: string | null;
  category: string;
  subject: string;
  message: string;
  rating: number | null;
  status: string;
  createdAt: Date;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const status = url.searchParams.get("status") || undefined;
  const category = url.searchParams.get("category") || undefined;

  const conditions: string[] = [];
  if (status) conditions.push(`status = '${status}'`);
  if (category) conditions.push(`category = '${category}'`);
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (page - 1) * limit;

  const feedback = await prisma.$queryRawUnsafe<FeedbackRow[]>(
    `SELECT * FROM feedback ${whereClause} ORDER BY "createdAt" DESC LIMIT ${limit} OFFSET ${offset}`
  );
  const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) as count FROM feedback ${whereClause}`
  );
  const total = Number(countResult[0].count);

  return NextResponse.json({
    feedback,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await req.json();
  if (!id || !status || !["open", "reviewed", "resolved", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "Invalid id or status" }, { status: 400 });
  }

  await prisma.$executeRaw`UPDATE feedback SET status = ${status} WHERE id = ${id}`;
  return NextResponse.json({ id, status, success: true });
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await prisma.$executeRaw`DELETE FROM feedback WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
