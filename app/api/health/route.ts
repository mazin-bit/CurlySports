import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};

  // Check Redis
  try {
    const testKey = "health:test";
    await cacheSet(testKey, "1", 10);
    const val = await cacheGet<string>(testKey);
    checks.redis = val === "1" ? "ok" : "error";
  } catch {
    checks.redis = "error";
  }

  // Check ESPN connectivity
  try {
    const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard", {
      signal: AbortSignal.timeout(5000),
    });
    checks.espn = res.ok ? "ok" : "error";
  } catch {
    checks.espn = "error";
  }

  // Check OpenF1
  try {
    const res = await fetch("https://api.openf1.org/v1/sessions?session_key=latest", {
      signal: AbortSignal.timeout(5000),
    });
    checks.openf1 = res.ok ? "ok" : "error";
  } catch {
    checks.openf1 = "error";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      checks,
      version: process.env.npm_package_version ?? "1.0.0",
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 207 }
  );
}
