import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ESPN leagues to search across — football
const FOOTBALL_SEARCH_LEAGUES = [
  { id: "eng.1",  path: "soccer/eng.1",  name: "Premier League"  },
  { id: "esp.1",  path: "soccer/esp.1",  name: "La Liga"          },
  { id: "ger.1",  path: "soccer/ger.1",  name: "Bundesliga"       },
  { id: "ita.1",  path: "soccer/ita.1",  name: "Serie A"          },
  { id: "fra.1",  path: "soccer/fra.1",  name: "Ligue 1"          },
  { id: "por.1",  path: "soccer/por.1",  name: "Primeira Liga"    },
  { id: "ned.1",  path: "soccer/ned.1",  name: "Eredivisie"       },
  { id: "eng.2",  path: "soccer/eng.2",  name: "Championship"     },
  { id: "tur.1",  path: "soccer/tur.1",  name: "Süper Lig"        },
  { id: "sco.1",  path: "soccer/sco.1",  name: "Scottish Prem"    },
  { id: "bel.1",  path: "soccer/bel.1",  name: "Pro League"       },
  { id: "gre.1",  path: "soccer/gre.1",  name: "Super League"     },
  { id: "usa.1",  path: "soccer/usa.1",  name: "MLS"              },
  { id: "mex.1",  path: "soccer/mex.1",  name: "Liga MX"          },
  { id: "bra.1",  path: "soccer/bra.1",  name: "Brasileirão"      },
  { id: "arg.1",  path: "soccer/arg.1",  name: "Liga Profesional" },
  { id: "col.1",  path: "soccer/col.1",  name: "Liga BetPlay"     },
  { id: "ksa.1",  path: "soccer/ksa.1",  name: "Saudi Pro League" },
  { id: "jpn.1",  path: "soccer/jpn.1",  name: "J1 League"        },
  { id: "aus.1",  path: "soccer/aus.1",  name: "A-League"         },
  { id: "chi.1",  path: "soccer/chi.1",  name: "Primera División" },
  { id: "ecu.1",  path: "soccer/ecu.1",  name: "Liga Pro"         },
  { id: "rus.1",  path: "soccer/rus.1",  name: "Premier Liga"     },
];

// Basketball leagues to search
const BASKETBALL_SEARCH_LEAGUES = [
  { id: "nba",  path: "basketball/nba",  name: "NBA"  },
  { id: "wnba", path: "basketball/wnba", name: "WNBA" },
];

// Hockey, Baseball, NFL
const HOCKEY_SEARCH_LEAGUES   = [{ id: "nhl",     path: "hockey/nhl",          name: "NHL"   }];
const BASEBALL_SEARCH_LEAGUES = [{ id: "mlb",     path: "baseball/mlb",        name: "MLB"   }];
const NFL_SEARCH_LEAGUES      = [{ id: "nfl",     path: "football/nfl",        name: "NFL"   }];

// Cricket leagues to search
const CRICKET_SEARCH_LEAGUES = [
  { id: "ipl",          path: "cricket/ipl",          name: "IPL"              },
  { id: "big.bash",     path: "cricket/big.bash",     name: "Big Bash"         },
  { id: "psl",          path: "cricket/psl",          name: "PSL"              },
  { id: "cplt20",       path: "cricket/cplt20",       name: "CPL"              },
  { id: "eng.domestic", path: "cricket/eng.domestic", name: "County"           },
];

const SPORT_LEAGUES: Record<string, typeof FOOTBALL_SEARCH_LEAGUES> = {
  football:   FOOTBALL_SEARCH_LEAGUES,
  basketball: BASKETBALL_SEARCH_LEAGUES,
  hockey:     HOCKEY_SEARCH_LEAGUES,
  baseball:   BASEBALL_SEARCH_LEAGUES,
  nfl:        NFL_SEARCH_LEAGUES,
  cricket:    CRICKET_SEARCH_LEAGUES,
};

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

interface PlayerResult {
  id: string; name: string; jersey: string; position: string;
  headshot: string | null; age: number | null;
  teamName: string; teamId: string;
  leagueId: string; leagueName: string;
  nationality: string | null;
}

// In-memory cache for league rosters (keyed by leagueId)
const rosterCache = new Map<string, { players: PlayerResult[]; fetchedAt: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// "soccer/eng.1" → "soccer", "cricket/ipl" → "cricket", "basketball/nba" → "nba", etc.
function cdnSport(leaguePath: string, leagueId: string): string {
  if (leaguePath.startsWith("soccer/"))  return "soccer";
  if (leaguePath.startsWith("cricket/")) return "cricket";
  return leagueId;
}

async function fetchLeagueRoster(leagueId: string, leaguePath: string, leagueName: string): Promise<PlayerResult[]> {
  const cached = rosterCache.get(leagueId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.players;

  try {
    // Get all teams
    const teamsRes = await fetch(`${ESPN_BASE}/${leaguePath}/teams?limit=100`, { next: { revalidate: 3600 } });
    if (!teamsRes.ok) return [];
    const teamsData = await teamsRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawTeams: any[] = teamsData.sports?.[0]?.leagues?.[0]?.teams ?? [];

    // Fetch all rosters in parallel — no cap, all teams included
    const teams = rawTeams.map((t) => ({
      id: String(t.team?.id ?? ""),
      name: String(t.team?.displayName ?? ""),
    }));

    const results = await Promise.allSettled(
      teams.map(async (team) => {
        const res = await fetch(`${ESPN_BASE}/${leaguePath}/teams/${team.id}/roster`, { next: { revalidate: 3600 } });
        if (!res.ok) return [] as PlayerResult[];
        const data = await res.json();
        const players: PlayerResult[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sport = cdnSport(leaguePath, leagueId);
        for (const entry of (data.athletes ?? []) as any[]) {
          const groupPos = entry.position;
          const groupAbbr = typeof groupPos === "string" ? groupPos : (groupPos?.abbreviation ?? "?");
          const items: typeof entry[] = entry.items?.length ? entry.items : [entry];
          for (const item of items) {
            if (!item.id && !item.displayName) continue;
            const pos: string = item.position?.abbreviation ?? groupAbbr;
            const playerId = item.id ?? "";
            const headshot = item.headshot?.href
              ?? (playerId ? `https://a.espncdn.com/i/headshots/${sport}/players/full/${playerId}.png` : null);
            players.push({
              id: playerId,
              name: item.displayName ?? item.fullName ?? "",
              jersey: item.jersey ?? "",
              position: pos,
              headshot,
              age: item.age ?? null,
              teamName: team.name,
              teamId: team.id,
              leagueId, leagueName,
              nationality: item.citizenship ?? item.birthPlace?.country ?? null,
            });
          }
        }
        return players;
      })
    );

    const allPlayers = results.flatMap((r) => r.status === "fulfilled" ? r.value : []);
    rosterCache.set(leagueId, { players: allPlayers, fetchedAt: Date.now() });
    return allPlayers;
  } catch { return []; }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.toLowerCase().trim() ?? "";
  if (q.length < 2) return NextResponse.json({ players: [] });

  const sport = req.nextUrl.searchParams.get("sport") ?? "football";
  const leagues = SPORT_LEAGUES[sport] ?? FOOTBALL_SEARCH_LEAGUES;

  // Search across all leagues in parallel
  const allResults = await Promise.allSettled(
    leagues.map((l) => fetchLeagueRoster(l.id, l.path, l.name))
  );

  const allPlayers = allResults.flatMap((r) => r.status === "fulfilled" ? r.value : []);

  // Filter by name match
  const matched = allPlayers.filter((p) =>
    p.name.toLowerCase().includes(q)
  );

  // Sort by relevance: exact start match first
  matched.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    return aStarts - bStarts;
  });

  return NextResponse.json({ players: matched.slice(0, 100) });
}
