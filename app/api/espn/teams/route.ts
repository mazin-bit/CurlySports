import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/redis";

export const dynamic = "force-dynamic";

const ESPN = process.env.ESPN_BASE_URL ?? "https://site.api.espn.com/apis/site/v2/sports";

export interface EspnTeamEntry {
  id: string;
  name: string;
  shortName: string;
  abbr: string;
  logo: string | null;
  color: string | null;
  altColor: string | null;
  leagueId: string;
  leagueName: string;
  sport: string;
  record?: string;
}

const SPORT_TEAM_PATHS: Record<string, { path: string; leagueId: string; leagueName: string }[]> = {
  football: [
    { path: "soccer/eng.1", leagueId: "eng.1", leagueName: "Premier League" },
    { path: "soccer/esp.1", leagueId: "esp.1", leagueName: "La Liga" },
    { path: "soccer/ger.1", leagueId: "ger.1", leagueName: "Bundesliga" },
    { path: "soccer/ita.1", leagueId: "ita.1", leagueName: "Serie A" },
    { path: "soccer/fra.1", leagueId: "fra.1", leagueName: "Ligue 1" },
    { path: "soccer/usa.1", leagueId: "usa.1", leagueName: "MLS" },
    { path: "soccer/uefa.champions", leagueId: "uefa.champions", leagueName: "Champions League" },
    { path: "soccer/uefa.europa", leagueId: "uefa.europa", leagueName: "Europa League" },
    { path: "soccer/por.1", leagueId: "por.1", leagueName: "Primeira Liga" },
    { path: "soccer/ned.1", leagueId: "ned.1", leagueName: "Eredivisie" },
    { path: "soccer/eng.2", leagueId: "eng.2", leagueName: "Championship" },
    { path: "soccer/sco.1", leagueId: "sco.1", leagueName: "Scottish Premiership" },
    { path: "soccer/tur.1", leagueId: "tur.1", leagueName: "Süper Lig" },
    { path: "soccer/mex.1", leagueId: "mex.1", leagueName: "Liga MX" },
    { path: "soccer/bra.1", leagueId: "bra.1", leagueName: "Brasileirão" },
    { path: "soccer/arg.1", leagueId: "arg.1", leagueName: "Liga Profesional" },
  ],
  basketball: [
    { path: "basketball/nba", leagueId: "nba", leagueName: "NBA" },
    { path: "basketball/wnba", leagueId: "wnba", leagueName: "WNBA" },
  ],
  nfl: [
    { path: "football/nfl", leagueId: "nfl", leagueName: "NFL" },
    { path: "football/college-football", leagueId: "college-football", leagueName: "College Football" },
  ],
  hockey: [
    { path: "hockey/nhl", leagueId: "nhl", leagueName: "NHL" },
  ],
  baseball: [
    { path: "baseball/mlb", leagueId: "mlb", leagueName: "MLB" },
  ],
  tennis: [
    { path: "tennis/atp.1", leagueId: "atp.1", leagueName: "ATP Tour" },
    { path: "tennis/wta.1", leagueId: "wta.1", leagueName: "WTA Tour" },
  ],
  f1: [{ path: "racing/f1", leagueId: "f1", leagueName: "Formula 1" }],
  mma: [{ path: "mma/ufc", leagueId: "ufc", leagueName: "UFC" }],
  golf: [{ path: "golf/pga", leagueId: "pga", leagueName: "PGA Tour" }],
  cricket: [
    { path: "cricket/ipl",           leagueId: "ipl",           leagueName: "Indian Premier League"   },
    { path: "cricket/big.bash",      leagueId: "big.bash",      leagueName: "Big Bash League"          },
    { path: "cricket/psl",           leagueId: "psl",           leagueName: "Pakistan Super League"    },
    { path: "cricket/cplt20",        leagueId: "cplt20",        leagueName: "Caribbean Premier Lge"    },
    { path: "cricket/sa.domestic",   leagueId: "sa.domestic",   leagueName: "SA20"                     },
    { path: "cricket/ilt20",         leagueId: "ilt20",         leagueName: "Int'l League T20"          },
    { path: "cricket/mlc",           leagueId: "mlc",           leagueName: "Major League Cricket"     },
    { path: "cricket/lpl",           leagueId: "lpl",           leagueName: "Lanka Premier League"     },
    { path: "cricket/bpl",           leagueId: "bpl",           leagueName: "Bangladesh Premier Lge"   },
    { path: "cricket/gt20",          leagueId: "gt20",          leagueName: "GT20 Canada"              },
    { path: "cricket/icc.t20wc",     leagueId: "icc.t20wc",     leagueName: "ICC T20 World Cup"        },
    { path: "cricket/icc.wc",        leagueId: "icc.wc",        leagueName: "ICC ODI World Cup"        },
    { path: "cricket/icc.champions", leagueId: "icc.champions",  leagueName: "ICC Champions Trophy"     },
    { path: "cricket/icc.wtc",       leagueId: "icc.wtc",       leagueName: "World Test Championship"  },
    { path: "cricket/ashes",         leagueId: "ashes",         leagueName: "The Ashes"                },
    { path: "cricket/icc.test",      leagueId: "icc.test",      leagueName: "International Tests"      },
    { path: "cricket/icc.odi",       leagueId: "icc.odi",       leagueName: "International ODIs"       },
    { path: "cricket/icc.t20i",      leagueId: "icc.t20i",      leagueName: "International T20Is"      },
    { path: "cricket/eng.domestic",  leagueId: "eng.domestic",  leagueName: "County Championship"      },
    { path: "cricket/ind.domestic",  leagueId: "ind.domestic",  leagueName: "Ranji Trophy"             },
    { path: "cricket/aus.domestic",  leagueId: "aus.domestic",  leagueName: "Sheffield Shield"         },
    { path: "cricket/nz.domestic",   leagueId: "nz.domestic",   leagueName: "Plunket Shield"           },
    { path: "cricket/pak.domestic",  leagueId: "pak.domestic",  leagueName: "Quaid-e-Azam Trophy"      },
  ],
};

type RawTeam = {
  team: {
    id: string;
    displayName: string;
    shortDisplayName?: string;
    abbreviation: string;
    logos?: { href: string }[];
    logo?: string;
    color?: string;
    alternateColor?: string;
    record?: { items?: { summary: string }[] };
  };
};

async function fetchTeamsForPath(
  path: string,
  leagueId: string,
  leagueName: string,
  sport: string
): Promise<EspnTeamEntry[]> {
  try {
    const url = `${ESPN}/${path}/teams?limit=100`;
    const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    const rawTeams: RawTeam[] = data.sports?.[0]?.leagues?.[0]?.teams ?? [];

    return rawTeams.map((t) => ({
      id: t.team?.id ?? "",
      name: t.team?.displayName ?? "",
      shortName: t.team?.shortDisplayName ?? t.team?.displayName ?? "",
      abbr: t.team?.abbreviation ?? "",
      logo: t.team?.logos?.[0]?.href ?? t.team?.logo ?? null,
      color: t.team?.color ? `#${t.team.color}` : null,
      altColor: t.team?.alternateColor ? `#${t.team.alternateColor}` : null,
      leagueId,
      leagueName,
      sport,
      record: t.team?.record?.items?.[0]?.summary ?? undefined,
    }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sport = searchParams.get("sport") ?? "football";
  const leagueId = searchParams.get("league");

  // Cricket: ESPN doesn't expose a teams endpoint — use static data
  if (sport === "cricket") {
    const { getCricketTeams } = await import("@/lib/cricket-teams");
    const cricketTeams = getCricketTeams(leagueId ?? undefined);
    const teams: EspnTeamEntry[] = cricketTeams.map(t => ({
      id: t.id,
      name: t.name,
      shortName: t.shortName,
      abbr: t.abbr,
      logo: t.logo,
      color: t.color,
      altColor: null,
      leagueId: t.leagueId,
      leagueName: t.leagueName,
      sport: "cricket",
    }));
    return NextResponse.json({ teams, updatedAt: new Date().toISOString() });
  }

  // Cache key based on sport + optional league filter
  const cacheKey = `teams:${sport}:${leagueId ?? "all"}`;
  const cached = await cacheGet<{ teams: EspnTeamEntry[]; updatedAt: string }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "Cache-Control": "public, max-age=300", "X-Cache": "HIT" } });
  }

  const paths = SPORT_TEAM_PATHS[sport] ?? SPORT_TEAM_PATHS.football;
  const filteredPaths = leagueId ? paths.filter((p) => p.leagueId === leagueId) : paths;

  if (filteredPaths.length === 0) {
    return NextResponse.json({ teams: [], updatedAt: new Date().toISOString() });
  }

  const results = await Promise.allSettled(
    filteredPaths.map((p) => fetchTeamsForPath(p.path, p.leagueId, p.leagueName, sport))
  );

  const allTeams: EspnTeamEntry[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") allTeams.push(...r.value);
  }

  const payload = { teams: allTeams, updatedAt: new Date().toISOString() };
  cacheSet(cacheKey, payload, 3600).catch(() => {}); // Cache teams for 1 hour

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, max-age=300", "X-Cache": "MISS" },
  });
}
