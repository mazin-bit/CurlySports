import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { optionalAuth } from "@/lib/auth";
import { ensureTrackingTables, detectPlatform } from "@/lib/ensure-tracking-tables";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { route } = body;

    if (!route || typeof route !== "string") {
      return NextResponse.json({ error: "route is required" }, { status: 400 });
    }

    await ensureTrackingTables();

    let userId: string | null = null;
    try {
      const user = await optionalAuth();
      userId = user?.id ?? null;
    } catch {
      /* not logged in */
    }

    const userAgent = req.headers.get("user-agent") || null;
    const platform = detectPlatform(userAgent);
    const country = req.headers.get("x-vercel-ip-country") || null;

    const id = `pv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    await prisma.$executeRaw`
      INSERT INTO page_views (id, "userId", route, platform, country, "createdAt")
      VALUES (${id}, ${userId}, ${route}, ${platform}, ${country}, NOW())
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Pageview tracking error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to record pageview", debug: msg }, { status: 500 });
  }
}
