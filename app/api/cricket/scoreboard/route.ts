import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/redis";
import type { NormalizedMatch } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TSDB = "https://www.thesportsdb.com/api/v1/json/3";

// TheSportsDB league IDs for cricket
const CRICKET_LEAGUES: {
  id: string;          // our internal leagueId
  tsdbId: string;      // TheSportsDB numeric league ID
  name: string;
  shortName: string;
}[] = [
  { id: "ipl",          tsdbId: "4460", name: "Indian Premier League",     shortName: "IPL"  },
  { id: "eng.domestic", tsdbId: "4458", name: "County Championship Div 1", shortName: "CC1"  },
  { id: "eng.domestic2",tsdbId: "4459", name: "County Championship Div 2", shortName: "CC2"  },
  { id: "eng.t20",      tsdbId: "4463", name: "Vitality T20 Blast",        shortName: "T20B" },
  { id: "psl",          tsdbId: "5067", name: "Pakistan Super League",      shortName: "PSL"  },
  { id: "big.bash",     tsdbId: "4461", name: "Big Bash League",            shortName: "BBL"  },
  { id: "aus.domestic", tsdbId: "5530", name: "Sheffield Shield",           shortName: "SS"   },
  { id: "bpl",          tsdbId: "5529", name: "Bangladesh Premier League",  shortName: "BPL"  },
  { id: "cplt20",       tsdbId: "5176", name: "Caribbean Premier League",   shortName: "CPL"  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseScore(raw: string | null | undefined, intScore: string | null | undefined): string | null {
  if (raw && raw !== "null" && raw.trim()) return raw.trim();
  if (intScore != null && intScore !== "null") return String(intScore);
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStatus(strStatus: string | null): NormalizedMatch["status"] {
  if (!strStatus) return "SCHEDULED";
  const s = strStatus.toUpperCase();
  if (s === "FT" || s === "AOT" || s.includes("FINISHED") || s.includes("COMPLETE")) return "FINISHED";
  if (s.includes("LIVE") || s.includes("PROGRESS") || s.includes("INPROG")) return "LIVE";
  if (s.includes("POSTPONED") || s.includes("ABANDONED")) return "POSTPONED";
  if (s.includes("CANCEL")) return "CANCELLED";
  return "SCHEDULED";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEvent(e: any, leagueId: string, leagueName: string, leagueShortName: string): NormalizedMatch {
  const homeScoreStr = parseScore(e.strHomeScore, e.intHomeScore);
  const awayScoreStr = parseScore(e.strAwayScore, e.intAwayScore);

  // For cricket, scores are strings like "156/5 (20 Ov)" — display them as statusDisplay
  // Use integer part as numeric score for sorting/comparison
  const homeScore = e.intHomeScore != null ? parseInt(String(e.intHomeScore)) : null;
  const awayScore = e.intAwayScore != null ? parseInt(String(e.intAwayScore)) : null;

  const status = mapStatus(e.strStatus);
  const dateStr = e.dateEvent ?? new Date().toISOString().slice(0, 10);
  const timeStr = e.strTime ? `T${e.strTime}Z` : "T00:00:00Z";

  // Build cricket-specific status display
  let statusDisplay = e.strStatus ?? "vs";
  if (status === "FINISHED" && homeScoreStr && awayScoreStr) {
    statusDisplay = `${homeScoreStr} | ${awayScoreStr}`;
  }

  return {
    id: String(e.idEvent),
    homeTeam: {
      id: String(e.idHomeTeam ?? e.idEvent + "_home"),
      name: e.strHomeTeam ?? "TBD",
      shortName: (e.strHomeTeam ?? "TBD").split(" ").pop()?.slice(0, 3).toUpperCase() ?? "HOM",
      logoUrl: e.strHomeTeamBadge ?? null,
    },
    awayTeam: {
      id: String(e.idAwayTeam ?? e.idEvent + "_away"),
      name: e.strAwayTeam ?? "TBD",
      shortName: (e.strAwayTeam ?? "TBD").split(" ").pop()?.slice(0, 3).toUpperCase() ?? "AWY",
      logoUrl: e.strAwayTeamBadge ?? null,
    },
    league: { id: leagueId, name: leagueName, shortName: leagueShortName },
    homeScore,
    awayScore,
    status,
    statusDisplay,
    minute: null,
    sport: "cricket",
    scheduledAt: `${dateStr}${timeStr}`,
    venue: e.strVenue ?? undefined,
  };
}

async function fetchLeagueMatches(
  league: typeof CRICKET_LEAGUES[0]
): Promise<NormalizedMatch[]> {
  try {
    const [pastRes, nextRes] = await Promise.allSettled([
      fetch(`${TSDB}/eventspastleague.php?id=${league.tsdbId}`, { next: { revalidate: 300 } }),
      fetch(`${TSDB}/eventsnextleague.php?id=${league.tsdbId}`, { next: { revalidate: 300 } }),
    ]);

    const matches: NormalizedMatch[] = [];

    if (pastRes.status === "fulfilled" && pastRes.value.ok) {
      const data = await pastRes.value.json();
      const events = data.events ?? [];
      for (const e of events) {
        matches.push(normalizeEvent(e, league.id, league.name, league.shortName));
      }
    }

    if (nextRes.status === "fulfilled" && nextRes.value.ok) {
      const data = await nextRes.value.json();
      const events = data.events ?? [];
      for (const e of events) {
        matches.push(normalizeEvent(e, league.id, league.name, league.shortName));
      }
    }

    return matches;
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const leagueFilter = searchParams.get("league");

  const cacheKey = `cricket:scoreboard:${leagueFilter ?? "all"}`;
  const cached = await cacheGet<{ groups: { leagueId: string; leagueName: string; leagueShortName: string; sport: string; matches: NormalizedMatch[] }[]; updatedAt: string }>(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });

  const leaguesToFetch = leagueFilter
    ? CRICKET_LEAGUES.filter(l => l.id === leagueFilter)
    : CRICKET_LEAGUES;

  const results = await Promise.allSettled(
    leaguesToFetch.map(async league => {
      const matches = await fetchLeagueMatches(league);
      return { ...league, matches };
    })
  );

  const groups = [];
  for (const result of results) {
    if (result.status !== "fulfilled" || result.value.matches.length === 0) continue;
    const { id, name, shortName, matches } = result.value;
    groups.push({ leagueId: id, leagueName: name, leagueShortName: shortName, sport: "cricket", matches });
  }

  const payload = { groups, updatedAt: new Date().toISOString() };
  await cacheSet(cacheKey, payload, 120); // 2 min cache

  return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } });
}
