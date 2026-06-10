import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TSDB = "https://www.thesportsdb.com/api/v1/json/3";

// searchName must match TheSportsDB's strLeague exactly for search_all_teams.php?l=
const CRICKET_LEAGUES: Record<string, { tsdbId: string; leagueName: string; searchName: string }> = {
  "ipl":           { tsdbId: "4460", leagueName: "Indian Premier League",     searchName: "Indian Premier League"      },
  "psl":           { tsdbId: "5067", leagueName: "Pakistan Super League",      searchName: "Pakistan Super League"      },
  "big.bash":      { tsdbId: "4461", leagueName: "Big Bash League",            searchName: "Australian Big Bash League" },
  "aus.domestic":  { tsdbId: "5530", leagueName: "Sheffield Shield",           searchName: "Sheffield Shield"           },
  "bpl":           { tsdbId: "5529", leagueName: "Bangladesh Premier League",  searchName: "Bangladesh Premier League"  },
  "cplt20":        { tsdbId: "5176", leagueName: "Caribbean Premier League",   searchName: "Caribbean Premier League"   },
  "sa.domestic":   { tsdbId: "5561", leagueName: "SA20",                      searchName: "SA20"                       },
  "eng.domestic":  { tsdbId: "4458", leagueName: "County Championship Div 1", searchName: ""                           },
  "eng.domestic2": { tsdbId: "4459", leagueName: "County Championship Div 2", searchName: ""                           },
  "eng.t20":       { tsdbId: "4463", leagueName: "Vitality T20 Blast",        searchName: ""                           },
};

export interface CricketPlayer {
  id: string;
  name: string;
  jersey: string;
  position: string;
  headshot: string | null;
  age: number | null;
  teamName: string;
  teamLogo: string | null;
  teamId: string;
  leagueId: string;
  leagueName: string;
  nationality: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  return Math.floor((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

async function getTeamIdsFromLeague(
  tsdbId: string,
  searchName: string
): Promise<{ id: string; name: string; badge: string | null }[]> {
  const teamMap = new Map<string, { id: string; name: string; badge: string | null }>();

  // Primary: search teams by league name — returns ALL teams in the league with correct IDs
  if (searchName) {
    try {
      const searchRes = await fetch(
        `${TSDB}/search_all_teams.php?l=${encodeURIComponent(searchName)}`,
        { next: { revalidate: 3600 } }
      );
      if (searchRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await searchRes.json();
        for (const t of (data.teams ?? [])) {
          // Only accept cricket teams (guards against wrong sport data)
          if (t.idTeam && t.strTeam && String(t.strSport ?? "").toLowerCase() === "cricket") {
            teamMap.set(String(t.idTeam), {
              id: String(t.idTeam),
              name: t.strTeam,
              badge: t.strTeamBadge ?? t.strBadge ?? null,
            });
          }
        }
      }
    } catch { /* fall through */ }
  }

  // Fallback: discover teams from recent events when search yields nothing
  if (teamMap.size === 0) {
    const [pastRes, nextRes] = await Promise.allSettled([
      fetch(`${TSDB}/eventspastleague.php?id=${tsdbId}`, { next: { revalidate: 300 } }),
      fetch(`${TSDB}/eventsnextleague.php?id=${tsdbId}`, { next: { revalidate: 300 } }),
    ]);

    for (const res of [pastRes, nextRes]) {
      if (res.status !== "fulfilled" || !res.value.ok) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.value.json();
      for (const e of (data.events ?? [])) {
        // Only add teams from cricket events
        if (e.strSport && String(e.strSport).toLowerCase() !== "cricket") continue;
        if (e.idHomeTeam && e.strHomeTeam) {
          teamMap.set(String(e.idHomeTeam), {
            id: String(e.idHomeTeam),
            name: e.strHomeTeam,
            badge: e.strHomeTeamBadge ?? null,
          });
        }
        if (e.idAwayTeam && e.strAwayTeam) {
          teamMap.set(String(e.idAwayTeam), {
            id: String(e.idAwayTeam),
            name: e.strAwayTeam,
            badge: e.strAwayTeamBadge ?? null,
          });
        }
      }
    }
  }

  return [...teamMap.values()];
}

async function getPlayersForTeam(
  team: { id: string; name: string; badge: string | null },
  leagueId: string,
  leagueName: string
): Promise<CricketPlayer[]> {
  try {
    const res = await fetch(`${TSDB}/lookup_all_players.php?id=${team.id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawPlayers: any[] = data.player ?? [];
    return rawPlayers
      .filter(p => !p.strSport || String(p.strSport).toLowerCase() === "cricket")
      .map(p => ({
        id: String(p.idPlayer ?? Math.random()),
        name: p.strPlayer ?? "",
        jersey: p.strNumber ?? "",
        position: p.strPosition ?? "Cricketer",
        headshot: p.strThumb ?? p.strCutout ?? null,
        age: calcAge(p.dateBorn ?? null),
        teamName: team.name,
        teamLogo: team.badge,
        teamId: team.id,
        leagueId,
        leagueName,
        nationality: p.strNationality ?? null,
      }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const leagueId = searchParams.get("league") ?? "ipl";
  const cfg = CRICKET_LEAGUES[leagueId];

  if (!cfg) {
    return NextResponse.json({ players: [] });
  }

  const cacheKey = `cricket:players:v2:${leagueId}`;
  const cached = await cacheGet<{ players: CricketPlayer[]; updatedAt: string }>(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });

  const teams = await getTeamIdsFromLeague(cfg.tsdbId, cfg.searchName);
  if (teams.length === 0) {
    return NextResponse.json({ players: [], updatedAt: new Date().toISOString() });
  }

  const results = await Promise.allSettled(
    teams.map(team => getPlayersForTeam(team, leagueId, cfg.leagueName))
  );

  const players: CricketPlayer[] = results
    .filter((r): r is PromiseFulfilledResult<CricketPlayer[]> => r.status === "fulfilled")
    .flatMap(r => r.value)
    .filter(p => p.name);

  const payload = { players, updatedAt: new Date().toISOString() };
  await cacheSet(cacheKey, payload, 3600);

  return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } });
}
