import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTrackingTables, detectPlatform } from "@/lib/ensure-tracking-tables";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await ensureTrackingTables();

    const userAgent = req.headers.get("user-agent") || null;
    const platform = detectPlatform(userAgent);
    const country = req.headers.get("x-vercel-ip-country") || null;
    const city = req.headers.get("x-vercel-ip-city") || null;
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    await prisma.$executeRaw`
      INSERT INTO user_sessions (id, "userId", platform, "ipAddress", country, city, "userAgent", "createdAt")
      VALUES (${id}, ${userId}, ${platform}, ${ipAddress}, ${country}, ${city}, ${userAgent}, NOW())
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Session tracking error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to record session", debug: msg }, { status: 500 });
  }
}
