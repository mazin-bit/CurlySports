import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { optionalAuth } from "@/lib/auth";

async function ensureTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS page_views (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      route TEXT NOT NULL,
      platform TEXT NOT NULL DEFAULT 'web',
      country TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function detectPlatform(userAgent: string | null): string {
  if (!userAgent) return "web";
  if (/CurlySports-iOS/i.test(userAgent) || (/iPhone|iPad|iPod/i.test(userAgent) && /Expo|ReactNative|okhttp/i.test(userAgent))) return "ios";
  if (/CurlySports-Android/i.test(userAgent) || (/Android/i.test(userAgent) && /Expo|ReactNative|okhttp/i.test(userAgent))) return "android";
  return "web";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { route } = body;

    if (!route || typeof route !== "string") {
      return NextResponse.json({ error: "route is required" }, { status: 400 });
    }

    await ensureTables();

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
