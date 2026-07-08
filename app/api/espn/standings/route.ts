import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Use the v2 web API for standings (more complete data)
const ESPN_V2 = "https://site.web.api.espn.com/apis/v2/sports";

export interface StandingEntry {
  rank: number;
  teamId: string;
  teamName: string;
  teamAbbr: string;
  teamLogo: string | null;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  netRunRate?: number;   // cricket T20 leagues
  note?: string;
}

export interface GroupStandings {
  groupName: string;
  entries: StandingEntry[];
}

export interface LeagueStandings {
  leagueId: string;
  leagueName: string;
  leagueLogo?: string;
  season: string;
  entries: StandingEntry[];      // flat list (all teams for single-table; flattened groups for multi-group)
  groups?: GroupStandings[];     // populated for multi-group competitions (WC, Euro, etc.)
  hasGroups: boolean;
}

// ESPN v2 paths for standings
const STANDINGS_PATHS: Record<string, { path: string; leagueName: string }> = {
  // ── Top European Leagues ─────────────────────────────────────────────────
  "eng.1":  { path: "soccer/eng.1",  leagueName: "Premier League" },
  "esp.1":  { path: "soccer/esp.1",  leagueName: "La Liga" },
  "ger.1":  { path: "soccer/ger.1",  leagueName: "Bundesliga" },
  "ita.1":  { path: "soccer/ita.1",  leagueName: "Serie A" },
  "fra.1":  { path: "soccer/fra.1",  leagueName: "Ligue 1" },
  "por.1":  { path: "soccer/por.1",  leagueName: "Primeira Liga" },
  "ned.1":  { path: "soccer/ned.1",  leagueName: "Eredivisie" },
  "eng.2":  { path: "soccer/eng.2",  leagueName: "Championship" },
  "sco.1":  { path: "soccer/sco.1",  leagueName: "Scottish Premiership" },
  "tur.1":  { path: "soccer/tur.1",  leagueName: "Süper Lig" },
  "bel.1":  { path: "soccer/bel.1",  leagueName: "Belgian Pro League" },
  "rus.1":  { path: "soccer/rus.1",  leagueName: "Russian Premier League" },
  "gre.1":  { path: "soccer/gre.1",  leagueName: "Super League" },
  // ── European Club Cups ──────────────────────────────────────────────────
  "uefa.champions":   { path: "soccer/uefa.champions",  leagueName: "Champions League" },
  "uefa.europa":      { path: "soccer/uefa.europa",     leagueName: "Europa League" },
  "uefa.europa_conf": { path: "soccer/uefa.europa_conf",leagueName: "Conference League" },
  // ── Americas ────────────────────────────────────────────────────────────
  "usa.1":  { path: "soccer/usa.1",  leagueName: "MLS" },
  "mex.1":  { path: "soccer/mex.1",  leagueName: "Liga MX" },
  "bra.1":  { path: "soccer/bra.1",  leagueName: "Brasileirão" },
  "arg.1":  { path: "soccer/arg.1",  leagueName: "Liga Profesional" },
  "col.1":  { path: "soccer/col.1",  leagueName: "Liga BetPlay" },
  "chi.1":  { path: "soccer/chi.1",  leagueName: "Primera División" },
  "ecu.1":  { path: "soccer/ecu.1",  leagueName: "Serie A Ecuador" },
  "conmebol.libertadores": { path: "soccer/conmebol.libertadores", leagueName: "Copa Libertadores" },
  "conmebol.sudamericana": { path: "soccer/conmebol.sudamericana", leagueName: "Copa Sudamericana" },
  "concacaf.champions":    { path: "soccer/concacaf.champions",    leagueName: "CONCACAF Champions" },
  // ── Asia / Pacific ──────────────────────────────────────────────────────
  "jpn.1":  { path: "soccer/jpn.1",  leagueName: "J-League" },
  "aus.1":  { path: "soccer/aus.1",  leagueName: "A-League" },
  "ksa.1":  { path: "soccer/ksa.1",  leagueName: "Saudi Pro League" },
  "chn.1":  { path: "soccer/chn.1",  leagueName: "Chinese Super League" },
  "idn.1":  { path: "soccer/idn.1",  leagueName: "Liga 1 (Indonesia)" },
  // ── International — FIFA World Cup & Qualifiers ─────────────────────────
  "fifa.world":            { path: "soccer/fifa.world",            leagueName: "FIFA World Cup" },
  "fifa.worldq.uefa":      { path: "soccer/fifa.worldq.uefa",      leagueName: "WC Qualifiers (UEFA)" },
  "fifa.worldq.conmebol":  { path: "soccer/fifa.worldq.conmebol",  leagueName: "WC Qualifiers (CONMEBOL)" },
  "fifa.worldq.concacaf":  { path: "soccer/fifa.worldq.concacaf",  leagueName: "WC Qualifiers (CONCACAF)" },
  "fifa.worldq.africa":    { path: "soccer/fifa.worldq.africa",    leagueName: "WC Qualifiers (CAF)" },
  "fifa.worldq.asia":      { path: "soccer/fifa.worldq.asia",      leagueName: "WC Qualifiers (AFC)" },
  // ── International — Continental Tournaments ────────────────────────────
  "uefa.euro":      { path: "soccer/uefa.euro",      leagueName: "UEFA Euro" },
  "conmebol.america": { path: "soccer/conmebol.america", leagueName: "Copa América" },
  "caf.nations":    { path: "soccer/caf.nations",    leagueName: "Africa Cup of Nations" },
  "concacaf.gold":  { path: "soccer/concacaf.gold",  leagueName: "CONCACAF Gold Cup" },
  "concacaf.nations": { path: "soccer/concacaf.nations", leagueName: "CONCACAF Nations League" },
  "afc.cup":        { path: "soccer/afc.cup",        leagueName: "AFC Asian Cup" },
  "uefa.nations":   { path: "soccer/uefa.nations",   leagueName: "UEFA Nations League" },
  // ── Other Sports ────────────────────────────────────────────────────────
  "nba":    { path: "basketball/nba",                    leagueName: "NBA" },
  "wnba":   { path: "basketball/wnba",                   leagueName: "WNBA" },
  "ncaab":  { path: "basketball/mens-college-basketball", leagueName: "NCAA Men's Basketball" },
  "ncaaw":  { path: "basketball/womens-college-basketball", leagueName: "NCAA Women's Basketball" },
  "nba.gl": { path: "basketball/nba.glLeague",           leagueName: "NBA G League" },
  "nfl":   { path: "football/nfl",    leagueName: "NFL" },
  "nhl":   { path: "hockey/nhl",      leagueName: "NHL" },
  "mlb":   { path: "baseball/mlb",    leagueName: "MLB" },
  "atp.1": { path: "tennis/atp.1",    leagueName: "ATP Rankings" },
  "wta.1": { path: "tennis/wta.1",    leagueName: "WTA Rankings" },
  "f1":    { path: "racing/f1",       leagueName: "Formula 1" },
  "pga":   { path: "golf/pga",        leagueName: "PGA Tour" },
  "ufc":   { path: "mma/ufc",         leagueName: "UFC" },
};

// Sport → leagues to show standings for (international first for user engagement)
const SPORT_LEAGUES: Record<string, string[]> = {
  football: [
    // International first
    "fifa.world", "fifa.worldq.uefa", "fifa.worldq.conmebol",
    "uefa.euro", "conmebol.america", "caf.nations", "concacaf.gold",
    "uefa.nations",
    // European cups
    "uefa.champions", "uefa.europa", "uefa.europa_conf",
    // American cups
    "conmebol.libertadores",
    // Top 5
    "eng.1", "esp.1", "ger.1", "ita.1", "fra.1",
    // More European
    "por.1", "ned.1", "tur.1", "sco.1", "bel.1",
    // Americas
    "usa.1", "mex.1", "bra.1", "arg.1",
    // Asia
    "jpn.1", "ksa.1", "idn.1",
  ],
  cricket: ["icc.t20wc", "icc.champions", "ipl", "psl", "big.bash", "sa.domestic", "cplt20", "ilt20", "mlc", "bpl", "lpl"],
  basketball: ["nba", "wnba", "ncaab", "ncaaw", "nba.gl"],
  nfl: ["nfl"],
  hockey: ["nhl"],
  baseball: ["mlb"],
  tennis: ["atp.1", "wta.1"],
  f1: ["f1"],
  golf: ["pga"],
  mma: ["ufc"],
};

// ─── stat helper ─────────────────────────────────────────────────────────────

function getStat(stats: { name: string; value: number }[], ...names: string[]): number {
  for (const n of names) {
    const found = stats.find((s) => s.name === n);
    if (found !== undefined) return found.value ?? 0;
  }
  return 0;
}

// ─── entry parser ─────────────────────────────────────────────────────────────

type RawEntry = {
  team?: { id: string; displayName: string; abbreviation: string; logos?: { href: string }[] };
  athlete?: { id: string; displayName?: string; name?: string; abbreviation?: string; flag?: { href: string } };
  stats: { name: string; value: number; displayValue?: string }[];
  note?: { rank?: number; description?: string; color?: string };
};

function parseEntries(rawEntries: RawEntry[]): StandingEntry[] {
  return rawEntries.map((entry, idx) => {
    const stats = entry.stats ?? [];
    const rank = (entry.note?.rank ?? getStat(stats, "rank")) || idx + 1;
    const wins = getStat(stats, "wins");
    const losses = getStat(stats, "losses");
    const gamesPlayedRaw = getStat(stats, "gamesPlayed");
    const gamesPlayed = gamesPlayedRaw > 0 ? gamesPlayedRaw : (wins + losses > 0 ? wins + losses : 0);
    return {
      rank,
      teamId: entry.team?.id ?? entry.athlete?.id ?? "",
      teamName: entry.team?.displayName ?? entry.athlete?.displayName ?? entry.athlete?.name ?? "Unknown",
      teamAbbr: entry.team?.abbreviation ?? entry.athlete?.abbreviation ?? "???",
      teamLogo: entry.team?.logos?.[0]?.href ?? entry.athlete?.flag?.href ?? null,
      gamesPlayed,
      wins,
      losses,
      draws: getStat(stats, "ties", "draws"),
      points: getStat(stats, "points", "championshipPts"),
      goalsFor: getStat(stats, "pointsFor", "goalsFor"),
      goalsAgainst: getStat(stats, "pointsAgainst", "goalsAgainst"),
      goalDiff: getStat(stats, "pointDifferential", "goalDifferential"),
      note: entry.note?.description,
    };
  }).sort((a, b) => a.rank - b.rank);
}

// ─── main fetcher ─────────────────────────────────────────────────────────────

async function tryFetch(cfg: { path: string; leagueName: string }, leagueId: string, season: string | undefined): Promise<LeagueStandings | null> {
  const url = season
    ? `${ESPN_V2}/${cfg.path}/standings?season=${season}`
    : `${ESPN_V2}/${cfg.path}/standings`;
  const res = await fetch(url, { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;

  const data = await res.json();
  if (data.code === 400 || data.code === 404) return null;

  const seasonLabel = data.season?.displayName ?? data.season?.year?.toString() ?? season ?? "–";
  const leagueLogo: string | undefined = data.leagues?.[0]?.logos?.[0]?.href ?? undefined;

  const children: {
    name?: string;
    abbreviation?: string;
    standings?: { entries?: RawEntry[]; seasonDisplayName?: string };
  }[] = data.children ?? [];

  if (children.length > 1) {
    const groups: GroupStandings[] = children
      .filter(c => (c.standings?.entries?.length ?? 0) > 0)
      .map(c => ({
        groupName: c.name ?? (c.abbreviation ? `Group ${c.abbreviation}` : "Group"),
        entries: parseEntries(c.standings!.entries!),
      }));

    if (groups.length > 0) {
      return {
        leagueId, leagueName: cfg.leagueName, leagueLogo,
        season: children[0]?.standings?.seasonDisplayName ?? seasonLabel,
        entries: groups.flatMap(g => g.entries), groups, hasGroups: true,
      };
    }
  }

  const standingsObj = children[0]?.standings ?? data.standings;
  if (!standingsObj) return null;

  const entries = parseEntries(standingsObj.entries ?? []);
  if (entries.length === 0) return null;  // empty = not found for this season

  return {
    leagueId, leagueName: cfg.leagueName, leagueLogo,
    season: standingsObj.seasonDisplayName ?? seasonLabel,
    entries, hasGroups: false,
  };
}

async function fetchLeagueStandings(leagueId: string, season?: string): Promise<LeagueStandings | null> {
  const cfg = STANDINGS_PATHS[leagueId];
  if (!cfg) return null;

  try {
    // Try requested season, then fall back to season-1 if no data returned
    const result = await tryFetch(cfg, leagueId, season);
    if (result) return result;

    // Fallback: try previous season (handles Aug-May seasons stored under start year)
    if (season) {
      const prev = String(parseInt(season) - 1);
      return await tryFetch(cfg, leagueId, prev);
    }
    return null;
  } catch {
    return null;
  }
}

// ─── IPL standings via official Sports Mechanic S3 API ───────────────────────

const IPL_S3_BASE = "https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl";

// Hardcoded competition IDs from the S3 competition.js endpoint
const IPL_COMPETITION_IDS: Record<string, string> = {
  "2026": "284",
  "2025": "203",
  "2024": "148",
  "2023": "107",
  "2022": "60",
  "2021": "10013",
};

interface IplPoint {
  TeamCode: string;
  TeamName: string;
  TeamLogo: string;
  Matches: string;
  Wins: string;
  Loss: string;
  Points: string;
  NetRunRate: string;
  IsQualified: string;
  OrderNo: string;
}

interface IplCompetition {
  CompetitionID: number | string;
  CompetitionName: string;
  CompetitionYear?: string;
}

async function fetchIplCompetitionId(): Promise<{ id: string; year: string }> {
  try {
    const res = await fetch(
      `${IPL_S3_BASE}/mc/competition.js?callback=oncomptetion&_=${Date.now()}`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return { id: "284", year: "2026" };
    const text = await res.text();
    // Callback is literally "oncomptetion" (typo in their API)
    const m = text.match(/oncomptetion\(([\s\S]*)\)/);
    if (!m) return { id: "284", year: "2026" };
    const data = JSON.parse(m[1]);
    // "livecompetition" has current; fallback to first entry in "competition" array
    const liveComps: IplCompetition[] = data.livecompetition ?? [];
    const allComps: IplCompetition[] = data.competition ?? [];
    const pick = liveComps[0] ?? allComps[0];
    // Year is in CompetitionName e.g. "IPL 2026"
    const yearMatch = pick?.CompetitionName?.match(/\d{4}/);
    const year = yearMatch?.[0] ?? "2026";
    return { id: String(pick?.CompetitionID ?? "284"), year };
  } catch {
    return { id: "284", year: "2026" };
  }
}

async function fetchIPLStandings(season?: string): Promise<LeagueStandings | null> {
  try {
    // Use hardcoded competition ID for historical seasons; live lookup for current
    let competitionId: string;
    let year: string;
    if (season && IPL_COMPETITION_IDS[season]) {
      competitionId = IPL_COMPETITION_IDS[season];
      year = season;
    } else {
      ({ id: competitionId, year } = await fetchIplCompetitionId());
    }
    const url = `${IPL_S3_BASE}/feeds/stats/${competitionId}-groupstandings.js?ongroupstandings=_jqjsp&_${Date.now()}=`;
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const text = await res.text();
    // Callback is "ongroupstandings" (the query param name, not "_jqjsp")
    const m = text.match(/ongroupstandings\(([\s\S]*)\)/);
    if (!m) return null;
    const data = JSON.parse(m[1]);
    const points: IplPoint[] = data.points ?? [];
    if (points.length === 0) return null;

    const entries: StandingEntry[] = points
      .sort((a, b) => parseInt(a.OrderNo ?? "99") - parseInt(b.OrderNo ?? "99"))
      .map((p, idx) => ({
        rank: parseInt(p.OrderNo ?? String(idx + 1)) || idx + 1,
        teamId: p.TeamCode,
        teamName: p.TeamName,
        teamAbbr: p.TeamCode,
        teamLogo: p.TeamLogo || null,
        gamesPlayed: parseInt(p.Matches ?? "0") || 0,
        wins: parseInt(p.Wins ?? "0") || 0,
        losses: parseInt(p.Loss ?? "0") || 0,
        draws: 0,
        points: parseInt(p.Points ?? "0") || 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        netRunRate: parseFloat(p.NetRunRate ?? "0") || 0,
        note: p.IsQualified === "1" ? "Q" : undefined,
      }));

    return { leagueId: "ipl", leagueName: "Indian Premier League", season: year, entries, hasGroups: false };
  } catch {
    return null;
  }
}

// ─── Cricket standings via TheSportsDB (fallback for other leagues) ───────────

const TSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3";

// TSDB only used for domestic/county leagues (T20 leagues moved to ESPNcricinfo for accurate data)
const CRICKET_TSDB_MAP: Record<string, { tsdbId: string; leagueName: string; searchName: string }> = {
  "aus.domestic":  { tsdbId: "5530", leagueName: "Sheffield Shield",           searchName: "Sheffield Shield" },
  "eng.domestic":  { tsdbId: "4458", leagueName: "County Championship Div 1", searchName: ""                 },
  "eng.domestic2": { tsdbId: "4459", leagueName: "County Championship Div 2", searchName: ""                 },
};

async function fetchCricketStandingsFromTsdb(leagueId: string): Promise<LeagueStandings | null> {
  const cfg = CRICKET_TSDB_MAP[leagueId];
  if (!cfg) return null;
  try {
    const teamStats = new Map<string, {
      id: string; name: string; logo: string | null;
      played: number; wins: number; losses: number; noresult: number;
    }>();

    const ensureTeam = (id: string, name: string, logo: string | null) => {
      if (!teamStats.has(id)) teamStats.set(id, { id, name, logo, played: 0, wins: 0, losses: 0, noresult: 0 });
      return teamStats.get(id)!;
    };

    if (cfg.searchName) {
      try {
        const searchRes = await fetch(
          `${TSDB_BASE}/search_all_teams.php?l=${encodeURIComponent(cfg.searchName)}`,
          { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) }
        );
        if (searchRes.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d: any = await searchRes.json();
          for (const t of (d.teams ?? [])) {
            if (t.idTeam && t.strTeam && String(t.strSport ?? "").toLowerCase() === "cricket") {
              ensureTeam(String(t.idTeam), t.strTeam, t.strTeamBadge ?? t.strBadge ?? null);
            }
          }
        }
      } catch { /* ignore */ }
    }

    const [pastRes, nextRes] = await Promise.allSettled([
      fetch(`${TSDB_BASE}/eventspastleague.php?id=${cfg.tsdbId}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) }),
      fetch(`${TSDB_BASE}/eventsnextleague.php?id=${cfg.tsdbId}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) }),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: any[] = [];
    for (const r of [pastRes, nextRes]) {
      if (r.status === "fulfilled" && r.value.ok) {
        const d = await r.value.json();
        events.push(...(d.events ?? []));
      }
    }

    for (const e of events) {
      const homeId = String(e.idHomeTeam ?? "");
      const awayId = String(e.idAwayTeam ?? "");
      if (!homeId || !awayId) continue;
      ensureTeam(homeId, e.strHomeTeam ?? homeId, e.strHomeTeamBadge ?? null);
      ensureTeam(awayId, e.strAwayTeam ?? awayId, e.strAwayTeamBadge ?? null);
      const strStatus = (e.strStatus ?? "").toUpperCase();
      const finished = strStatus === "FT" || strStatus === "AOT" || strStatus.includes("FINISH");
      if (!finished) continue;
      const homeScore = parseFloat(e.intHomeScore ?? "0") || 0;
      const awayScore = parseFloat(e.intAwayScore ?? "0") || 0;
      const home = teamStats.get(homeId)!;
      const away = teamStats.get(awayId)!;
      home.played++; away.played++;
      if (homeScore > awayScore) { home.wins++; away.losses++; }
      else if (awayScore > homeScore) { away.wins++; home.losses++; }
      else { home.noresult++; away.noresult++; }
    }

    if (teamStats.size === 0) return null;

    const entries: StandingEntry[] = [...teamStats.values()]
      .map((t) => ({
        rank: 0,
        teamId: t.id,
        teamName: t.name,
        teamAbbr: t.name.split(" ").pop()?.slice(0, 3).toUpperCase() ?? "UNK",
        teamLogo: t.logo,
        gamesPlayed: t.played,
        wins: t.wins,
        losses: t.losses,
        draws: t.noresult,
        points: t.wins * 2 + t.noresult,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        note: undefined,
      }))
      .sort((a, b) => b.points - a.points || b.wins - a.wins)
      .map((e, idx) => ({ ...e, rank: idx + 1 }));

    return { leagueId, leagueName: cfg.leagueName, season: String(new Date().getFullYear()), entries, hasGroups: false };
  } catch {
    return null;
  }
}

// ─── ESPNcricinfo HTML scraper ────────────────────────────────────────────────
// Pages are server-side rendered; the standings table is in the static HTML.
// Key: must include Accept-Encoding + Connection headers to pass Akamai bot detection.

const CRICINFO_PAGE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
};

// Hardcoded series IDs from ESPNcricinfo for all T20 leagues and ICC events.
// slug + seriesId form the URL: /series/{slug}-{seriesId}/points-table-standings
const CRICINFO_SERIES_MAP: Record<string, {
  leagueName: string;
  series: { slug: string; seriesId: number; season: string }[];
}> = {
  // ── IPL (ESPNcricinfo fallback — S3 API is primary for current season) ──────
  "ipl": {
    leagueName: "Indian Premier League",
    series: [
      { slug: "ipl-2026",                            seriesId: 1510719, season: "2026" },
      { slug: "ipl-2025",                            seriesId: 1449924, season: "2025" },
      { slug: "indian-premier-league-2024",           seriesId: 1410320, season: "2024" },
      { slug: "indian-premier-league-2023",           seriesId: 1345038, season: "2023" },
      { slug: "indian-premier-league-2022",           seriesId: 1298423, season: "2022" },
    ],
  },
  // ── Top T20 leagues ──────────────────────────────────────────────────────────
  "psl": {
    leagueName: "Pakistan Super League",
    series: [
      { slug: "pakistan-super-league-2025",            seriesId: 1434269, season: "2025" },
      { slug: "pakistan-super-league-2023-24",         seriesId: 1412744, season: "2024" },
      { slug: "pakistan-super-league-2022-23",         seriesId: 1332128, season: "2023" },
    ],
  },
  "big.bash": {
    leagueName: "Big Bash League",
    series: [
      { slug: "big-bash-league-2024-25",              seriesId: 1443056, season: "2025" },
      { slug: "big-bash-league-2023-24",              seriesId: 1386092, season: "2024" },
      { slug: "big-bash-league-2022-23",              seriesId: 1324623, season: "2023" },
    ],
  },
  "cplt20": {
    leagueName: "Caribbean Premier League",
    series: [
      { slug: "caribbean-premier-league-2025",        seriesId: 1468498, season: "2025" },
      { slug: "caribbean-premier-league-2024",        seriesId: 1428674, season: "2024" },
      { slug: "caribbean-premier-league-2023",        seriesId: 1369538, season: "2023" },
      { slug: "caribbean-premier-league-2022",        seriesId: 1320379, season: "2022" },
    ],
  },
  "sa.domestic": {
    leagueName: "SA20",
    series: [
      { slug: "sa20-2025-26",                         seriesId: 1494252, season: "2026" },
      { slug: "sa20-2024-25",                         seriesId: 1437327, season: "2025" },
      { slug: "sa20-2023-24",                         seriesId: 1392651, season: "2024" },
      { slug: "sa20-2022-23",                         seriesId: 1335268, season: "2023" },
    ],
  },
  "ilt20": {
    leagueName: "International League T20",
    series: [
      { slug: "international-league-t20-2025-26",     seriesId: 1501317, season: "2026" },
      { slug: "international-league-t20-2024-25",     seriesId: 1462172, season: "2025" },
      { slug: "international-league-t20-2023-24",     seriesId: 1406886, season: "2024" },
      { slug: "international-league-t20-2022-23",     seriesId: 1326657, season: "2023" },
    ],
  },
  "mlc": {
    leagueName: "Major League Cricket",
    series: [
      { slug: "major-league-cricket-2025",            seriesId: 1481991, season: "2025" },
      { slug: "major-league-cricket-2024",            seriesId: 1432722, season: "2024" },
      { slug: "major-league-cricket-2023",            seriesId: 1357742, season: "2023" },
    ],
  },
  "bpl": {
    leagueName: "Bangladesh Premier League",
    series: [
      { slug: "bangladesh-premier-league-2024-25",    seriesId: 1459492, season: "2025" },
      { slug: "bangladesh-premier-league-2023-24",    seriesId: 1412272, season: "2024" },
      { slug: "bangladesh-premier-league-2022-23",    seriesId: 1346160, season: "2023" },
    ],
  },
  "lpl": {
    leagueName: "Lanka Premier League",
    series: [
      { slug: "lanka-premier-league-2024",            seriesId: 1421415, season: "2024" },
      { slug: "lanka-premier-league-2023",            seriesId: 1382875, season: "2023" },
    ],
  },
  // ── ICC Events ───────────────────────────────────────────────────────────────
  "icc.t20wc": {
    leagueName: "ICC Men's T20 World Cup",
    series: [
      { slug: "icc-men-s-t20-world-cup-2025-26",      seriesId: 1502138, season: "2025" },
      { slug: "icc-men-s-t20-world-cup-2024",          seriesId: 1411166, season: "2024" },
    ],
  },
  "icc.champions": {
    leagueName: "ICC Champions Trophy",
    series: [
      { slug: "icc-champions-trophy-2024-25",         seriesId: 1459031, season: "2025" },
    ],
  },
};

function parseEspnCricinfoTable(
  html: string, leagueId: string, leagueName: string, season: string
): LeagueStandings | null {
  // Build column index map from first thead so we handle varying column sets (e.g. no T in MLC)
  const theadMatch = html.match(/<thead[^>]*>([\s\S]*?)<\/thead>/);
  const colHeaders: string[] = [];
  if (theadMatch) {
    const thRe = /<th[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/g;
    let hm;
    while ((hm = thRe.exec(theadMatch[1])) !== null) {
      colHeaders.push(hm[1].trim().toUpperCase());
    }
    if (colHeaders[0]?.includes("TEAM") || colHeaders[0] === "TEAMS") colHeaders.shift();
  }
  const defaultCols = ["M", "W", "L", "T", "N/R", "PTS", "NRR"];
  const cols = colHeaders.length >= 5 ? colHeaders : defaultCols;
  const ci = (name: string) => cols.findIndex(c => c === name || c.replace("/", "") === name.replace("/", ""));

  const iM   = ci("M");
  const iW   = ci("W");
  const iL   = ci("L");
  const iT   = ci("T");
  const iNR  = ci("N/R");
  const iPTS = ci("PTS");
  const iNRR = ci("NRR");

  // Parse all rows from a single tbody string
  function parseTbody(tbody: string, baseRank = 0): StandingEntry[] {
    const rowRe = /<tr class="ds-text-tight-s ds-text-typo-mid2[^"]*">([\s\S]*?)<\/tr>/g;
    const entries: StandingEntry[] = [];
    let m;
    while ((m = rowRe.exec(tbody)) !== null) {
      const rowHtml = m[1];
      const rankMatch = rowHtml.match(/ds-w-\[14px\][^>]*>(\d+)<\/span>/);
      const rank = rankMatch ? parseInt(rankMatch[1]) : entries.length + 1;
      const altMatch = rowHtml.match(/alt="([^"]+)"/);
      const spanMatch = rowHtml.match(/ds-text-tight-s ds-font-medium ds-uppercase[^"]*">([^<]+)</);
      const rawName = altMatch?.[1] ?? spanMatch?.[1] ?? "Unknown";
      const teamName = rawName
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#\d+;/g, "");
      const stats = [
        ...rowHtml.matchAll(/<td class="ds-w-0 ds-whitespace-nowrap[^"]*">([^<]+)<\/td>/g),
      ].map(x => x[1].trim());
      if (stats.length < 5) continue;
      const get = (idx: number) => (idx >= 0 && idx < stats.length ? stats[idx] : "0");
      entries.push({
        rank,
        teamId: `${baseRank + rank}`,
        teamName,
        teamAbbr: teamName.split(/\s+/).map(w => w[0]).join("").slice(0, 4).toUpperCase(),
        teamLogo: null, // images are lazy-loaded client-side; unavailable in static HTML
        gamesPlayed: parseInt(get(iM))   || 0,
        wins:        parseInt(get(iW))   || 0,
        losses:      parseInt(get(iL))   || 0,
        draws:       (iT  >= 0 ? parseInt(get(iT))  || 0 : 0) + (iNR >= 0 ? parseInt(get(iNR)) || 0 : 0),
        points:      parseInt(get(iPTS)) || 0,
        goalsFor: 0, goalsAgainst: 0, goalDiff: 0,
        netRunRate:  parseFloat(get(iNRR)) || 0,
      });
    }
    return entries.sort((a, b) => a.rank - b.rank);
  }

  // Collect all <tbody> sections (ICC group-stage pages have one per group)
  const tbodyRe = /<tbody[^>]*>([\s\S]*?)<\/tbody>/g;
  const tbodies: string[] = [];
  let tb;
  while ((tb = tbodyRe.exec(html)) !== null) {
    tbodies.push(tb[1]);
  }
  if (tbodies.length === 0) return null;

  // Single table (regular T20 league)
  if (tbodies.length === 1) {
    const entries = parseTbody(tbodies[0]);
    if (entries.length === 0) return null;
    return { leagueId, leagueName, season, entries, hasGroups: false };
  }

  // Multiple tables → group stage (ICC events)
  // Try to extract group labels from nearby headings
  const groupLabelRe = /(?:Group|Pool)\s+([A-Z\d]+)/gi;
  const groupLabels: string[] = [];
  let gl;
  while ((gl = groupLabelRe.exec(html)) !== null) {
    const label = `Group ${gl[1].toUpperCase()}`;
    if (!groupLabels.includes(label)) groupLabels.push(label);
  }

  const groups: GroupStandings[] = [];
  for (let i = 0; i < tbodies.length; i++) {
    const entries = parseTbody(tbodies[i], i * 20);
    if (entries.length === 0) continue;
    groups.push({
      groupName: groupLabels[i] ?? `Group ${String.fromCharCode(65 + i)}`,
      entries,
    });
  }

  if (groups.length === 0) return null;
  if (groups.length === 1) {
    return { leagueId, leagueName, season, entries: groups[0].entries, hasGroups: false };
  }

  return {
    leagueId, leagueName, season,
    entries: groups.flatMap(g => g.entries),
    groups,
    hasGroups: true,
  };
}

async function fetchFromCricinfoHtml(leagueId: string, season?: string): Promise<LeagueStandings | null> {
  const cfg = CRICINFO_SERIES_MAP[leagueId];
  if (!cfg) return null;

  // Pick the entry that matches the requested season; fall back to the closest available
  let pick = season ? cfg.series.find(s => s.season === season) : cfg.series[0];
  if (!pick && season) {
    // No exact match — fall back to closest season (prefer most recent <= requested)
    const reqYear = parseInt(season);
    const sorted = [...cfg.series].sort((a, b) =>
      Math.abs(parseInt(a.season) - reqYear) - Math.abs(parseInt(b.season) - reqYear)
    );
    pick = sorted[0];
  }
  if (!pick) return null;

  const cacheKey = `cricinfo:html:${leagueId}:${pick.season}`;
  const cached = await cacheGet<LeagueStandings>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://www.espncricinfo.com/series/${pick.slug}-${pick.seriesId}/points-table-standings`;
    const res = await fetch(url, { headers: CRICINFO_PAGE_HEADERS, next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const html = await res.text();
    const result = parseEspnCricinfoTable(html, leagueId, cfg.leagueName, pick.season);
    if (result) await cacheSet(cacheKey, result, 3600);
    return result;
  } catch {
    return null;
  }
}

// ─── Unified cricket standings ────────────────────────────────────────────────

async function fetchCricketStandings(leagueId: string, season?: string): Promise<LeagueStandings | null> {
  if (leagueId === "ipl") return fetchIPLStandings(season);

  // TheSportsDB covers: big.bash, psl, bpl, cplt20, eng.t20, aus.domestic, eng.domestic(1/2)
  const tsdb = await fetchCricketStandingsFromTsdb(leagueId);
  if (tsdb) return tsdb;

  // ESPNcricinfo HTML scraper covers: sa.domestic (SA20), ilt20, mlc, lpl, gt20
  return fetchFromCricinfoHtml(leagueId, season);
}

// ─── route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sport = searchParams.get("sport") ?? "football";
  const leagueId = searchParams.get("league");
  const season = searchParams.get("season") ?? undefined;

  const cacheKey = `standings:${sport}:${leagueId ?? "all"}:${season ?? "current"}`;
  const cached = await cacheGet<{ standings: LeagueStandings[]; updatedAt: string } | LeagueStandings>(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });

  const CRICKET_LEAGUE_IDS = new Set(["ipl", ...Object.keys(CRICKET_TSDB_MAP), ...Object.keys(CRICINFO_SERIES_MAP)]);
  const isCricket = sport === "cricket" || (leagueId != null && CRICKET_LEAGUE_IDS.has(leagueId));

  if (leagueId) {
    const standings = isCricket
      ? await fetchCricketStandings(leagueId, season)
      : await fetchLeagueStandings(leagueId, season);
    if (!standings) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await cacheSet(cacheKey, standings, 300);
    return NextResponse.json(standings, { headers: { "X-Cache": "MISS" } });
  }

  const leagues = SPORT_LEAGUES[sport] ?? [];

  const results = isCricket
    ? await Promise.allSettled(leagues.map((id) => fetchCricketStandings(id, season)))
    : await Promise.allSettled(leagues.map((id) => fetchLeagueStandings(id, season)));

  const all: LeagueStandings[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) all.push(r.value);
  }

  const payload = { standings: all, updatedAt: new Date().toISOString() };
  await cacheSet(cacheKey, payload, 300);
  return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } });
}
