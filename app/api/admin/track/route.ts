import { NextRequest, NextResponse } from "next/server";

// In-memory page view counter — resets on server restart.
// For persistent analytics, use a database or analytics service.
const pageViews: Record<string, number> = {};

export async function POST(req: NextRequest) {
  const { page } = await req.json().catch(() => ({ page: "unknown" }));
  pageViews[page] = (pageViews[page] ?? 0) + 1;
  return NextResponse.json({ ok: true });
}
