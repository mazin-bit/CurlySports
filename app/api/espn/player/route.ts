import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ESPN_V3 = "https://site.web.api.espn.com/apis/common/v3/sports";
const ESPN_V2 = "https://site.api.espn.com/apis/site/v2/sports";

// Map leagueId → ESPN paths + names
const LEAGUE_PATHS: Record<string, { v3: string; v2: string; sport: string; leagueName: string }> = {
  // Football (soccer)
  "eng.1": { v3: "soccer/eng.1", v2: "soccer/eng.1", sport: "soccer", leagueName: "Premier League" },
  "esp.1": { v3: "soccer/esp.1", v2: "soccer/esp.1", sport: "soccer", leagueName: "La Liga" },
  "ger.1": { v3: "soccer/ger.1", v2: "soccer/ger.1", sport: "soccer", leagueName: "Bundesliga" },
  "ita.1": { v3: "soccer/ita.1", v2: "soccer/ita.1", sport: "soccer", leagueName: "Serie A" },
  "fra.1": { v3: "soccer/fra.1", v2: "soccer/fra.1", sport: "soccer", leagueName: "Ligue 1" },
  "por.1": { v3: "soccer/por.1", v2: "soccer/por.1", sport: "soccer", leagueName: "Primeira Liga" },
  "ned.1": { v3: "soccer/ned.1", v2: "soccer/ned.1", sport: "soccer", leagueName: "Eredivisie" },
  "eng.2": { v3: "soccer/eng.2", v2: "soccer/eng.2", sport: "soccer", leagueName: "Championship" },
  "tur.1": { v3: "soccer/tur.1", v2: "soccer/tur.1", sport: "soccer", leagueName: "Süper Lig" },
  "sco.1": { v3: "soccer/sco.1", v2: "soccer/sco.1", sport: "soccer", leagueName: "Scottish Prem" },
  "bel.1": { v3: "soccer/bel.1", v2: "soccer/bel.1", sport: "soccer", leagueName: "Pro League" },
  "gre.1": { v3: "soccer/gre.1", v2: "soccer/gre.1", sport: "soccer", leagueName: "Super League" },
  "usa.1": { v3: "soccer/usa.1", v2: "soccer/usa.1", sport: "soccer", leagueName: "MLS" },
  "mex.1": { v3: "soccer/mex.1", v2: "soccer/mex.1", sport: "soccer", leagueName: "Liga MX" },
  "bra.1": { v3: "soccer/bra.1", v2: "soccer/bra.1", sport: "soccer", leagueName: "Brasileirão" },
  "arg.1": { v3: "soccer/arg.1", v2: "soccer/arg.1", sport: "soccer", leagueName: "Liga Profesional" },
  "col.1": { v3: "soccer/col.1", v2: "soccer/col.1", sport: "soccer", leagueName: "Liga BetPlay" },
  "ksa.1": { v3: "soccer/ksa.1", v2: "soccer/ksa.1", sport: "soccer", leagueName: "Saudi Pro League" },
  "jpn.1": { v3: "soccer/jpn.1", v2: "soccer/jpn.1", sport: "soccer", leagueName: "J1 League" },
  "aus.1": { v3: "soccer/aus.1", v2: "soccer/aus.1", sport: "soccer", leagueName: "A-League" },
  "chi.1": { v3: "soccer/chi.1", v2: "soccer/chi.1", sport: "soccer", leagueName: "Primera División" },
  "ecu.1": { v3: "soccer/ecu.1", v2: "soccer/ecu.1", sport: "soccer", leagueName: "Liga Pro" },
  "rus.1": { v3: "soccer/rus.1", v2: "soccer/rus.1", sport: "soccer", leagueName: "Premier Liga" },
  // Other sports
  "nba":           { v3: "basketball/nba",          v2: "basketball/nba",          sport: "basketball", leagueName: "NBA" },
  "nfl":           { v3: "football/nfl",            v2: "football/nfl",            sport: "football",   leagueName: "NFL" },
  "nhl":           { v3: "hockey/nhl",              v2: "hockey/nhl",              sport: "hockey",     leagueName: "NHL" },
  "mlb":           { v3: "baseball/mlb",            v2: "baseball/mlb",            sport: "baseball",   leagueName: "MLB" },
  "ufc":           { v3: "mma/ufc",                v2: "mma/ufc",                 sport: "mma",        leagueName: "UFC" },
  "pga":           { v3: "golf/pga",               v2: "golf/pga",                sport: "golf",       leagueName: "PGA Tour" },
  "atp.1":         { v3: "tennis/atp.1",            v2: "tennis/atp.1",            sport: "tennis",     leagueName: "ATP Tour" },
  // Cricket — T20 Leagues
  "ipl":           { v3: "cricket/ipl",             v2: "cricket/ipl",             sport: "cricket",    leagueName: "Indian Premier League" },
  "big.bash":      { v3: "cricket/big.bash",        v2: "cricket/big.bash",        sport: "cricket",    leagueName: "Big Bash League" },
  "psl":           { v3: "cricket/psl",             v2: "cricket/psl",             sport: "cricket",    leagueName: "Pakistan Super League" },
  "cplt20":        { v3: "cricket/cplt20",          v2: "cricket/cplt20",          sport: "cricket",    leagueName: "Caribbean Premier League" },
  "sa.domestic":   { v3: "cricket/sa.domestic",     v2: "cricket/sa.domestic",     sport: "cricket",    leagueName: "SA20" },
  "ilt20":         { v3: "cricket/ilt20",           v2: "cricket/ilt20",           sport: "cricket",    leagueName: "Int'l League T20" },
  "mlc":           { v3: "cricket/mlc",             v2: "cricket/mlc",             sport: "cricket",    leagueName: "Major League Cricket" },
  "lpl":           { v3: "cricket/lpl",             v2: "cricket/lpl",             sport: "cricket",    leagueName: "Lanka Premier League" },
  "bpl":           { v3: "cricket/bpl",             v2: "cricket/bpl",             sport: "cricket",    leagueName: "Bangladesh Premier League" },
  // Cricket — ICC & International
  "icc.t20wc":     { v3: "cricket/icc.t20wc",       v2: "cricket/icc.t20wc",       sport: "cricket",    leagueName: "ICC T20 World Cup" },
  "icc.wc":        { v3: "cricket/icc.wc",          v2: "cricket/icc.wc",          sport: "cricket",    leagueName: "ICC ODI World Cup" },
  "icc.champions": { v3: "cricket/icc.champions",   v2: "cricket/icc.champions",   sport: "cricket",    leagueName: "ICC Champions Trophy" },
  "icc.wtc":       { v3: "cricket/icc.wtc",         v2: "cricket/icc.wtc",         sport: "cricket",    leagueName: "World Test Championship" },
  "ashes":         { v3: "cricket/ashes",           v2: "cricket/ashes",           sport: "cricket",    leagueName: "The Ashes" },
  "icc.test":      { v3: "cricket/icc.test",        v2: "cricket/icc.test",        sport: "cricket",    leagueName: "International Tests" },
  "icc.odi":       { v3: "cricket/icc.odi",         v2: "cricket/icc.odi",         sport: "cricket",    leagueName: "International ODIs" },
  "icc.t20i":      { v3: "cricket/icc.t20i",        v2: "cricket/icc.t20i",        sport: "cricket",    leagueName: "International T20Is" },
  // Cricket — Domestic
  "eng.domestic":  { v3: "cricket/eng.domestic",    v2: "cricket/eng.domestic",    sport: "cricket",    leagueName: "County Championship" },
  "ind.domestic":  { v3: "cricket/ind.domestic",    v2: "cricket/ind.domestic",    sport: "cricket",    leagueName: "Ranji Trophy" },
  "aus.domestic":  { v3: "cricket/aus.domestic",    v2: "cricket/aus.domestic",    sport: "cricket",    leagueName: "Sheffield Shield" },
  "nz.domestic":   { v3: "cricket/nz.domestic",     v2: "cricket/nz.domestic",     sport: "cricket",    leagueName: "Plunket Shield" },
  "pak.domestic":  { v3: "cricket/pak.domestic",    v2: "cricket/pak.domestic",    sport: "cricket",    leagueName: "Quaid-e-Azam Trophy" },
};

export interface PlayerDetail {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  jersey: string;
  position: string;
  positionAbbr: string;
  headshot: string | null;
  flagUrl: string | null;
  nationality: string;
  age: number | null;
  displayDOB: string | null;
  height: string;
  weight: string;
  teamId: string;
  teamName: string;
  teamLogo: string | null;
  teamColor: string | null;
  leagueId: string;
  leagueName: string;
  sport: string;
  stats: { name: string; displayName: string; shortName: string; value: number; displayValue: string }[];
  statsSeason: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseStats(statsArr: any[]): PlayerDetail["stats"] {
  return statsArr.map((s: {
    name?: string; displayName?: string; shortDisplayName?: string;
    abbreviation?: string; value?: number; displayValue?: string;
  }) => ({
    name: s.name ?? "",
    displayName: s.displayName ?? s.shortDisplayName ?? s.abbreviation ?? "",
    shortName: s.shortDisplayName ?? s.abbreviation ?? "",
    value: s.value ?? 0,
    displayValue: s.displayValue ?? String(s.value ?? 0),
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const athleteId = searchParams.get("id");
  const leagueId = searchParams.get("league") ?? "eng.1";

  if (!athleteId) {
    return NextResponse.json({ error: "Missing athlete id" }, { status: 400 });
  }

  // Try to resolve league — fall back to eng.1 for unknown leagues
  const paths = LEAGUE_PATHS[leagueId] ?? LEAGUE_PATHS["eng.1"];

  try {
    // ESPN v3 athlete endpoint (rich data incl. statsSummary)
    const v3Url = `${ESPN_V3}/${paths.v3}/athletes/${athleteId}`;
    const res = await fetch(v3Url, { next: { revalidate: 300 } });

    if (!res.ok) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a: Record<string, any> = data.athlete ?? {};

    if (!a.id && !a.displayName) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // ── Headshot ──
    // ESPN CDN works for all sports: soccer, basketball, etc.
    const cdnHeadshot = `https://a.espncdn.com/i/headshots/${paths.sport}/players/full/${athleteId}.png`;
    const headshot = a.headshot?.href ?? cdnHeadshot;

    // ── Flag / nationality ──
    const flagData = a.flag ?? {};
    const flagUrl = typeof flagData === "object" ? (flagData.href ?? null) : null;
    const cc = a.citizenshipCountry ?? {};
    const nationality = a.citizenship ?? (typeof cc === "object" ? (cc.displayName ?? "") : cc) ?? "";

    // ── Stats from statsSummary ──
    const statsSummary = a.statsSummary ?? {};
    let statsArr = parseStats(statsSummary.statistics ?? []);

    // If no stats from v3 statsSummary, try v2 stats endpoint
    if (statsArr.length === 0) {
      try {
        const v2StatsUrl = `${ESPN_V2}/${paths.v2}/athletes/${athleteId}/stats`;
        const statsRes = await fetch(v2StatsUrl, { next: { revalidate: 300 } });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const groups: any[] = statsData.statistics ?? [];
          // Take most recent season
          const latest = groups[0];
          if (latest?.stats) {
            statsArr = parseStats(latest.stats);
          }
        }
      } catch { /* silent */ }
    }

    // ── Team ──
    const team = a.team ?? {};
    const teamLogos: { href: string }[] = team.logos ?? [];
    const teamColor = team.color ? `#${team.color}` : null;

    // ── DOB ── ESPN returns "MM/DD/YYYY" format, parse safely
    const rawDOB: string | null = a.displayDOB ?? null;
    let parsedDOB: string | null = null;
    if (rawDOB) {
      const parts = rawDOB.split("/");
      if (parts.length === 3) {
        // MM/DD/YYYY → YYYY-MM-DD for reliable parsing
        parsedDOB = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
      } else {
        parsedDOB = rawDOB;
      }
    }

    const player: PlayerDetail = {
      id: String(a.id ?? athleteId),
      name: a.displayName ?? a.fullName ?? "",
      firstName: a.firstName ?? "",
      lastName: a.lastName ?? "",
      jersey: a.jersey ?? a.displayJersey ?? "",
      position: a.position?.name ?? (typeof a.position === "string" ? a.position : "") ?? "",
      positionAbbr: a.position?.abbreviation ?? "",
      headshot,
      flagUrl,
      nationality,
      age: a.age ?? null,
      displayDOB: parsedDOB,
      height: a.displayHeight ?? "",
      weight: a.displayWeight ?? "",
      teamId: String(team.id ?? ""),
      teamName: team.displayName ?? team.shortDisplayName ?? "",
      teamLogo: teamLogos[0]?.href ?? team.logo ?? null,
      teamColor,
      leagueId,
      leagueName: paths.leagueName,
      sport: paths.sport,
      stats: statsArr,
      statsSeason: statsSummary.displayName ?? "",
    };

    return NextResponse.json(player);
  } catch (e) {
    console.error("Player fetch error:", e);
    return NextResponse.json({ error: "Failed to fetch player" }, { status: 500 });
  }
}
