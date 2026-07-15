import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTrackingTables } from "@/lib/ensure-tracking-tables";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, platform, appVersion } = body;

    if (!deviceId || typeof deviceId !== "string") {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }
    if (!platform || typeof platform !== "string" || !["ios", "android"].includes(platform)) {
      return NextResponse.json({ error: "platform must be 'ios' or 'android'" }, { status: 400 });
    }

    await ensureTrackingTables();

    const country = req.headers.get("x-vercel-ip-country") || null;
    const id = `inst_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    await prisma.$executeRaw`
      INSERT INTO app_installs (id, "deviceId", platform, "appVersion", country, "createdAt", "updatedAt")
      VALUES (${id}, ${deviceId}, ${platform}, ${appVersion || null}, ${country}, NOW(), NOW())
      ON CONFLICT ("deviceId")
      DO UPDATE SET
        platform = EXCLUDED.platform,
        "appVersion" = EXCLUDED."appVersion",
        country = EXCLUDED.country,
        "updatedAt" = NOW()
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Install tracking error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to record install", debug: msg }, { status: 500 });
  }
}
