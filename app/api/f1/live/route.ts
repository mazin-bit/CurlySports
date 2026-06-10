import { NextResponse } from "next/server";
import { fetchF1RaceLive, fetchF1Sessions } from "@/lib/external-apis";
import { cacheGet, cacheSet } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;

  // If year is requested, return sessions list
  if (year) {
    const cacheKey = `f1:sessions:${year}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const sessions = await fetchF1Sessions(year);
    await cacheSet(cacheKey, sessions, 3600); // Cache sessions for 1 hour
    return NextResponse.json(sessions);
  }

  // Otherwise return live race state
  const cacheKey = "f1:live";
  const cached = await cacheGet(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });

  const data = await fetchF1RaceLive();
  if (!data) {
    return NextResponse.json({ error: "No active F1 session" }, { status: 404 });
  }

  await cacheSet(cacheKey, data, 10); // Cache for 10s during live session
  return NextResponse.json(data, { headers: { "X-Cache": "MISS" } });
}
