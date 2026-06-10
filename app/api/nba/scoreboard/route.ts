import { NextResponse } from "next/server";
import { fetchNbaScoreboard } from "@/lib/external-apis";
import { cacheGet, cacheSet } from "@/lib/redis";
import { normalizeEvent, mapStatus } from "@/lib/sports-api";
import type { LeagueGroup, NormalizedMatch } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const cacheKey = "nba:scoreboard";
  const cached = await cacheGet<{ groups: LeagueGroup[]; updatedAt: string }>(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });

  const games = await fetchNbaScoreboard();

  // Normalize NBA CDN data to NormalizedMatch format
  const matches: NormalizedMatch[] = games.map((g) => {
    const statusMap: Record<number, NormalizedMatch["status"]> = {
      1: "SCHEDULED",
      2: "LIVE",
      3: "FINISHED",
    };
    return {
      id: g.gameId,
      homeTeam: {
        id: String(g.homeTeam.teamId),
        name: g.homeTeam.teamName,
        shortName: g.homeTeam.teamTricode,
        logoUrl: `https://cdn.nba.com/logos/nba/${g.homeTeam.teamId}/global/L/logo.svg`,
      },
      awayTeam: {
        id: String(g.awayTeam.teamId),
        name: g.awayTeam.teamName,
        shortName: g.awayTeam.teamTricode,
        logoUrl: `https://cdn.nba.com/logos/nba/${g.awayTeam.teamId}/global/L/logo.svg`,
      },
      league: { id: "nba", name: "NBA", shortName: "NBA" },
      homeScore: g.homeTeam.score,
      awayScore: g.awayTeam.score,
      status: statusMap[g.gameStatus] ?? "SCHEDULED",
      statusDisplay: g.gameStatusText,
      minute: g.gameStatus === 2 ? g.period : null,
      sport: "basketball",
      scheduledAt: new Date().toISOString(),
      venue: undefined,
    };
  });

  const hasLive = matches.some((m) => m.status === "LIVE");
  const groups: LeagueGroup[] = matches.length > 0
    ? [{ leagueId: "nba", leagueName: "NBA", leagueShortName: "NBA", sport: "basketball", matches }]
    : [];

  const payload = { groups, updatedAt: new Date().toISOString() };
  await cacheSet(cacheKey, payload, hasLive ? 15 : 60);

  return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } });
}
