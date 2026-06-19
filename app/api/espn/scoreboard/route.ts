import { NextRequest, NextResponse } from "next/server";
import { fetchScoreboard, normalizeEvent } from "@/lib/sports-api";
import { cacheGet, cacheSet } from "@/lib/redis";
import type { LeagueGroup, NormalizedMatch, SportSlug } from "@/lib/types";
import type { NormalizedEvent } from "@/scrapers/base";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ESPN sport paths (football, NFL, tennis, F1, MMA, golf)
const ESPN_SPORT_PATHS: {
  sport: SportSlug;
  path: string;
  leagueId: string;
  leagueName: string;
  leagueShortName: string;
}[] = [
  // Top European leagues (season Aug-May)
  { sport: "football", path: "soccer/eng.1", leagueId: "eng.1", leagueName: "Premier League", leagueShortName: "EPL" },
  { sport: "football", path: "soccer/esp.1", leagueId: "esp.1", leagueName: "La Liga", leagueShortName: "LaLiga" },
  { sport: "football", path: "soccer/ger.1", leagueId: "ger.1", leagueName: "Bundesliga", leagueShortName: "BL" },
  { sport: "football", path: "soccer/ita.1", leagueId: "ita.1", leagueName: "Serie A", leagueShortName: "SA" },
  { sport: "football", path: "soccer/fra.1", leagueId: "fra.1", leagueName: "Ligue 1", leagueShortName: "L1" },
  // European cups
  { sport: "football", path: "soccer/uefa.champions", leagueId: "uefa.champions", leagueName: "Champions League", leagueShortName: "UCL" },
  { sport: "football", path: "soccer/uefa.europa", leagueId: "uefa.europa", leagueName: "Europa League", leagueShortName: "EL" },
  { sport: "football", path: "soccer/uefa.europa_conf", leagueId: "uefa.europa_conf", leagueName: "Conference League", leagueShortName: "UECL" },
  // Other European
  { sport: "football", path: "soccer/por.1", leagueId: "por.1", leagueName: "Primeira Liga", leagueShortName: "PL" },
  { sport: "football", path: "soccer/ned.1", leagueId: "ned.1", leagueName: "Eredivisie", leagueShortName: "ERE" },
  { sport: "football", path: "soccer/tur.1", leagueId: "tur.1", leagueName: "Süper Lig", leagueShortName: "TSL" },
  { sport: "football", path: "soccer/sco.1", leagueId: "sco.1", leagueName: "Scottish Premiership", leagueShortName: "SPL" },
  // Americas (year-round)
  { sport: "football", path: "soccer/usa.1", leagueId: "usa.1", leagueName: "MLS", leagueShortName: "MLS" },
  { sport: "football", path: "soccer/mex.1", leagueId: "mex.1", leagueName: "Liga MX", leagueShortName: "LMX" },
  { sport: "football", path: "soccer/bra.1", leagueId: "bra.1", leagueName: "Brasileirão", leagueShortName: "BRA" },
  { sport: "football", path: "soccer/arg.1", leagueId: "arg.1", leagueName: "Liga Profesional", leagueShortName: "ARG" },
  { sport: "football", path: "soccer/conmebol.libertadores", leagueId: "conmebol.libertadores", leagueName: "Copa Libertadores", leagueShortName: "LIBERT" },
  { sport: "football", path: "soccer/concacaf.champions", leagueId: "concacaf.champions", leagueName: "CONCACAF Champions", leagueShortName: "CCL" },
  // Asia / Other
  { sport: "football", path: "soccer/jpn.1", leagueId: "jpn.1", leagueName: "J-League", leagueShortName: "J1" },
  { sport: "football", path: "soccer/aus.1", leagueId: "aus.1", leagueName: "A-League", leagueShortName: "ALE" },
  { sport: "football", path: "soccer/sau.1", leagueId: "sau.1", leagueName: "Saudi Pro League", leagueShortName: "SPL" },
  // International — National Teams
  { sport: "football", path: "soccer/fifa.world", leagueId: "fifa.world", leagueName: "FIFA World Cup", leagueShortName: "WC" },
  { sport: "football", path: "soccer/fifa.worldq.uefa", leagueId: "fifa.worldq.uefa", leagueName: "WC Qualifiers (UEFA)", leagueShortName: "WCQE" },
  { sport: "football", path: "soccer/fifa.worldq.conmebol", leagueId: "fifa.worldq.conmebol", leagueName: "WC Qualifiers (CONMEBOL)", leagueShortName: "WCQS" },
  { sport: "football", path: "soccer/fifa.worldq.concacaf", leagueId: "fifa.worldq.concacaf", leagueName: "WC Qualifiers (CONCACAF)", leagueShortName: "WCQC" },
  { sport: "football", path: "soccer/fifa.worldq.africa", leagueId: "fifa.worldq.africa", leagueName: "WC Qualifiers (CAF)", leagueShortName: "WCQA" },
  { sport: "football", path: "soccer/fifa.worldq.asia", leagueId: "fifa.worldq.asia", leagueName: "WC Qualifiers (AFC)", leagueShortName: "WCQAS" },
  { sport: "football", path: "soccer/uefa.euro", leagueId: "uefa.euro", leagueName: "UEFA Euro", leagueShortName: "EURO" },
  { sport: "football", path: "soccer/conmebol.america", leagueId: "conmebol.america", leagueName: "Copa América", leagueShortName: "CA" },
  { sport: "football", path: "soccer/caf.nations", leagueId: "caf.nations", leagueName: "Africa Cup of Nations", leagueShortName: "AFCON" },
  { sport: "football", path: "soccer/concacaf.gold", leagueId: "concacaf.gold", leagueName: "CONCACAF Gold Cup", leagueShortName: "GC" },
  { sport: "football", path: "soccer/concacaf.nations", leagueId: "concacaf.nations", leagueName: "CONCACAF Nations League", leagueShortName: "CNL" },
  { sport: "football", path: "soccer/afc.cup", leagueId: "afc.cup", leagueName: "AFC Asian Cup", leagueShortName: "AFCC" },
  { sport: "football", path: "soccer/uefa.nations", leagueId: "uefa.nations", leagueName: "UEFA Nations League", leagueShortName: "UNL" },
  // Other sports
  { sport: "nfl", path: "football/nfl", leagueId: "nfl", leagueName: "NFL", leagueShortName: "NFL" },
  { sport: "tennis", path: "tennis/atp.1", leagueId: "atp.1", leagueName: "ATP Tour", leagueShortName: "ATP" },
  { sport: "f1", path: "racing/f1", leagueId: "f1", leagueName: "Formula 1", leagueShortName: "F1" },
  { sport: "mma", path: "mma/ufc", leagueId: "ufc", leagueName: "UFC", leagueShortName: "UFC" },
  { sport: "golf", path: "golf/pga", leagueId: "pga", leagueName: "PGA Tour", leagueShortName: "PGA" },
];

// Convert YYYYMMDD → YYYY-MM-DD for NHL/MLB APIs
function yyyymmddToIso(s: string): string {
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

// Convert NormalizedEvent (scrapers/base) → NormalizedMatch (lib/types)
function toMatch(e: NormalizedEvent, sport: SportSlug): NormalizedMatch {
  const abbrev = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return (parts[parts.length - 1] ?? name).slice(0, 3).toUpperCase();
  };
  return {
    id: e.id,
    homeTeam: { id: e.homeTeam.id, name: e.homeTeam.name, shortName: abbrev(e.homeTeam.name), logoUrl: e.homeTeam.logo },
    awayTeam: { id: e.awayTeam.id, name: e.awayTeam.name, shortName: abbrev(e.awayTeam.name), logoUrl: e.awayTeam.logo },
    league: { id: e.leagueId, name: e.leagueName, shortName: e.leagueId.toUpperCase() },
    homeScore: e.homeScore,
    awayScore: e.awayScore,
    status: e.status,
    statusDisplay: e.statusDisplay,
    minute: e.minute,
    sport,
    scheduledAt: e.scheduledAt,
    venue: e.venue,
  };
}

// ─── Sport-specific fetchers ─────────────────────────────────────────────────

async function fetchHockeyGroups(dateParam?: string): Promise<LeagueGroup[]> {
  try {
    const { NhlScraper } = await import("@/scrapers/hockey/nhl");
    const nhl = new NhlScraper();
    const events = dateParam
      ? await nhl.fetchScheduleByDate(yyyymmddToIso(dateParam))
      : await nhl.fetchScheduleToday();
    const matches = events.map(e => toMatch(e, "hockey"));
    return matches.length > 0
      ? [{ leagueId: "nhl", leagueName: "NHL", leagueShortName: "NHL", sport: "hockey" as SportSlug, matches }]
      : [];
  } catch {
    // Fallback to ESPN
    const events = await fetchScoreboard("hockey/nhl", dateParam);
    const matches = events.map(e => normalizeEvent(e, "hockey", "NHL", "NHL", "nhl"));
    return matches.length > 0
      ? [{ leagueId: "nhl", leagueName: "NHL", leagueShortName: "NHL", sport: "hockey" as SportSlug, matches }]
      : [];
  }
}

async function fetchBaseballGroups(dateParam?: string): Promise<LeagueGroup[]> {
  try {
    const { MlbScraper } = await import("@/scrapers/baseball/mlb");
    const mlb = new MlbScraper();
    const date = dateParam ? yyyymmddToIso(dateParam) : new Date().toISOString().split("T")[0];
    const events = await mlb.fetchScheduleByDate(date);
    const matches = events.map(e => toMatch(e, "baseball"));
    return matches.length > 0
      ? [{ leagueId: "mlb", leagueName: "MLB", leagueShortName: "MLB", sport: "baseball" as SportSlug, matches }]
      : [];
  } catch {
    // Fallback to ESPN
    const events = await fetchScoreboard("baseball/mlb", dateParam);
    const matches = events.map(e => normalizeEvent(e, "baseball", "MLB", "MLB", "mlb"));
    return matches.length > 0
      ? [{ leagueId: "mlb", leagueName: "MLB", leagueShortName: "MLB", sport: "baseball" as SportSlug, matches }]
      : [];
  }
}

async function fetchBasketballGroups(dateParam?: string): Promise<LeagueGroup[]> {
  const todayKey = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  // ── NBA ────────────────────────────────────────────────────────────────────
  const isHistorical = dateParam && dateParam !== todayKey;
  let nbaMatches: NormalizedMatch[] = [];

  if (isHistorical) {
    const events = await fetchScoreboard("basketball/nba", dateParam);
    nbaMatches = events.map(e => normalizeEvent(e, "basketball", "NBA", "NBA", "nba"));
  } else {
    // Today: try NBA CDN first, fall back to ESPN
    try {
      const { fetchNbaScoreboard } = await import("@/lib/external-apis");
      const games = await fetchNbaScoreboard();
      const statusMap: Record<number, NormalizedMatch["status"]> = { 1: "SCHEDULED", 2: "LIVE", 3: "FINISHED" };
      nbaMatches = games.map(g => ({
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
      }));
    } catch {}

    if (nbaMatches.length === 0) {
      const events = await fetchScoreboard("basketball/nba", todayKey);
      nbaMatches = events.map(e => normalizeEvent(e, "basketball", "NBA", "NBA", "nba"));
    }
  }

  // ── WNBA + NCAA (via ESPN) ─────────────────────────────────────────────────
  const [wnbaRes, ncaaRes] = await Promise.allSettled([
    fetchScoreboard("basketball/wnba", dateParam ?? todayKey),
    fetchScoreboard("basketball/mens-college-basketball", dateParam ?? todayKey),
  ]);

  const wnbaMatches = wnbaRes.status === "fulfilled"
    ? wnbaRes.value.map(e => normalizeEvent(e, "basketball", "WNBA", "WNBA", "wnba"))
    : [];

  const ncaaMatches = ncaaRes.status === "fulfilled"
    ? ncaaRes.value.map(e => normalizeEvent(e, "basketball", "NCAA Basketball", "NCAA", "ncaab"))
    : [];

  // ── Build groups ───────────────────────────────────────────────────────────
  const groups: LeagueGroup[] = [];
  if (nbaMatches.length > 0)
    groups.push({ leagueId: "nba", leagueName: "NBA", leagueShortName: "NBA", sport: "basketball" as SportSlug, matches: nbaMatches });
  if (wnbaMatches.length > 0)
    groups.push({ leagueId: "wnba", leagueName: "WNBA", leagueShortName: "WNBA", sport: "basketball" as SportSlug, matches: wnbaMatches });
  if (ncaaMatches.length > 0)
    groups.push({ leagueId: "ncaab", leagueName: "NCAA Basketball", leagueShortName: "NCAA", sport: "basketball" as SportSlug, matches: ncaaMatches });

  return groups;
}

// ─── Cricket via TheSportsDB (ESPN cricket API returns no data) ───────────────

const TSDB = "https://www.thesportsdb.com/api/v1/json/3";

const CRICKET_TSDB_LEAGUES: { id: string; tsdbId: string; name: string; shortName: string }[] = [
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
function normalizeTsdbEvent(e: any, leagueId: string, leagueName: string, leagueShortName: string): NormalizedMatch {
  const parseScore = (raw: string | null, intVal: string | null): string | null => {
    if (raw && raw !== "null" && raw.trim()) return raw.trim();
    if (intVal != null && intVal !== "null") return String(intVal);
    return null;
  };
  const mapStatus = (s: string | null): NormalizedMatch["status"] => {
    if (!s) return "SCHEDULED";
    const u = s.toUpperCase();
    if (u === "FT" || u === "AOT" || u.includes("FINISH") || u.includes("COMPLETE")) return "FINISHED";
    if (u.includes("LIVE") || u.includes("PROGRESS") || u.includes("INPROG")) return "LIVE";
    if (u.includes("POSTPONED") || u.includes("ABANDONED")) return "POSTPONED";
    if (u.includes("CANCEL")) return "CANCELLED";
    return "SCHEDULED";
  };

  const homeScoreStr = parseScore(e.strHomeScore, e.intHomeScore);
  const awayScoreStr = parseScore(e.strAwayScore, e.intAwayScore);
  const status = mapStatus(e.strStatus);
  const dateStr = e.dateEvent ?? new Date().toISOString().slice(0, 10);
  const timeStr = e.strTime ? `T${e.strTime}Z` : "T00:00:00Z";

  let statusDisplay: string = e.strStatus ?? "vs";
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
    homeScore: e.intHomeScore != null ? parseInt(String(e.intHomeScore)) : null,
    awayScore: e.intAwayScore != null ? parseInt(String(e.intAwayScore)) : null,
    status,
    statusDisplay,
    minute: null,
    sport: "cricket",
    scheduledAt: `${dateStr}${timeStr}`,
    venue: e.strVenue ?? undefined,
  };
}

async function fetchCricketGroups(leagueFilter?: string): Promise<LeagueGroup[]> {
  const leagues = leagueFilter
    ? CRICKET_TSDB_LEAGUES.filter(l => l.id === leagueFilter)
    : CRICKET_TSDB_LEAGUES;

  const results = await Promise.allSettled(
    leagues.map(async league => {
      const [pastRes, nextRes] = await Promise.allSettled([
        fetch(`${TSDB}/eventspastleague.php?id=${league.tsdbId}`, { next: { revalidate: 120 }, signal: AbortSignal.timeout(8000) }),
        fetch(`${TSDB}/eventsnextleague.php?id=${league.tsdbId}`, { next: { revalidate: 120 }, signal: AbortSignal.timeout(8000) }),
      ]);

      const matches: NormalizedMatch[] = [];
      if (pastRes.status === "fulfilled" && pastRes.value.ok) {
        const data = await pastRes.value.json();
        for (const e of (data.events ?? [])) {
          matches.push(normalizeTsdbEvent(e, league.id, league.name, league.shortName));
        }
      }
      if (nextRes.status === "fulfilled" && nextRes.value.ok) {
        const data = await nextRes.value.json();
        for (const e of (data.events ?? [])) {
          matches.push(normalizeTsdbEvent(e, league.id, league.name, league.shortName));
        }
      }
      return { ...league, matches };
    })
  );

  const groups: LeagueGroup[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled" || r.value.matches.length === 0) continue;
    const { id, name, shortName, matches } = r.value;
    groups.push({ leagueId: id, leagueName: name, leagueShortName: shortName, sport: "cricket" as SportSlug, matches });
  }
  return groups;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sportFilter = searchParams.get("sport");
  const dateParam = searchParams.get("date") ?? undefined;

  const cacheKey = `scoreboard:${sportFilter ?? "all"}:${dateParam ?? "now"}`;
  const cacheTTL = dateParam ? 120 : 20;

  const cached = await cacheGet<{ groups: LeagueGroup[]; updatedAt: string }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  let groups: LeagueGroup[] = [];

  if (sportFilter === "hockey") {
    groups = await fetchHockeyGroups(dateParam);
  } else if (sportFilter === "baseball") {
    groups = await fetchBaseballGroups(dateParam);
  } else if (sportFilter === "basketball") {
    groups = await fetchBasketballGroups(dateParam);
  } else if (sportFilter === "cricket") {
    groups = await fetchCricketGroups();
  } else {
    // ESPN-sourced sports
    const paths = sportFilter
      ? ESPN_SPORT_PATHS.filter(s => s.sport === sportFilter)
      : ESPN_SPORT_PATHS;

    const results = await Promise.allSettled(
      paths.map(async cfg => {
        const events = await fetchScoreboard(cfg.path, dateParam);
        const matches = events.map(e =>
          normalizeEvent(e, cfg.sport, cfg.leagueName, cfg.leagueShortName, cfg.leagueId)
        );
        return { ...cfg, matches };
      })
    );

    for (const result of results) {
      if (result.status !== "fulfilled" || result.value.matches.length === 0) continue;
      const { leagueId, leagueName, leagueShortName, sport, matches } = result.value;
      groups.push({ leagueId, leagueName, leagueShortName, sport, matches });
    }

    // No sport filter → also fetch from official sport APIs
    if (!sportFilter) {
      const [hockeyRes, baseballRes, basketballRes, cricketRes] = await Promise.allSettled([
        fetchHockeyGroups(dateParam),
        fetchBaseballGroups(dateParam),
        fetchBasketballGroups(dateParam),
        fetchCricketGroups(),
      ]);
      if (hockeyRes.status === "fulfilled") groups.push(...hockeyRes.value);
      if (baseballRes.status === "fulfilled") groups.push(...baseballRes.value);
      if (basketballRes.status === "fulfilled") groups.push(...basketballRes.value);
      if (cricketRes.status === "fulfilled") groups.push(...cricketRes.value);
    }
  }

  const payload = { groups, updatedAt: new Date().toISOString() };
  const hasLive = groups.some(g => g.matches.some(m => m.status === "LIVE" || m.status === "HALF_TIME"));
  await cacheSet(cacheKey, payload, hasLive ? 3 : cacheTTL);

  upsertMatchesToDb(groups).catch(() => {});

  return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } });
}

// ─── DB persistence (non-blocking, best-effort) ───────────────────────────────

const DB_SUPPORTED: SportSlug[] = ["football", "basketball", "nfl", "hockey", "baseball", "f1", "cricket"];

async function upsertMatchesToDb(groups: LeagueGroup[]) {
  for (const group of groups) {
    if (!DB_SUPPORTED.includes(group.sport)) continue;
    try {
      await prisma.league.upsert({
        where: { espnId: group.leagueId },
        update: { name: group.leagueName, shortName: group.leagueShortName },
        create: {
          espnId: group.leagueId,
          name: group.leagueName,
          shortName: group.leagueShortName,
          sport: mapSportEnum(group.sport),
        },
      });

      for (const m of group.matches) {
        const homeTeam = await prisma.team.upsert({
          where: { espnId: m.homeTeam.id },
          update: { name: m.homeTeam.name, shortName: m.homeTeam.shortName, logoUrl: m.homeTeam.logoUrl },
          create: {
            espnId: m.homeTeam.id,
            name: m.homeTeam.name,
            shortName: m.homeTeam.shortName,
            logoUrl: m.homeTeam.logoUrl,
            sport: mapSportEnum(m.sport),
          },
        });

        const awayTeam = await prisma.team.upsert({
          where: { espnId: m.awayTeam.id },
          update: { name: m.awayTeam.name, shortName: m.awayTeam.shortName, logoUrl: m.awayTeam.logoUrl },
          create: {
            espnId: m.awayTeam.id,
            name: m.awayTeam.name,
            shortName: m.awayTeam.shortName,
            logoUrl: m.awayTeam.logoUrl,
            sport: mapSportEnum(m.sport),
          },
        });

        const league = await prisma.league.findUnique({ where: { espnId: group.leagueId } });

        await prisma.match.upsert({
          where: { espnId: m.id },
          update: {
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            status: m.status,
            minute: m.minute,
            period: m.statusDisplay,
          },
          create: {
            espnId: m.id,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: league?.id,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            status: m.status,
            sport: mapSportEnum(m.sport),
            scheduledAt: new Date(m.scheduledAt),
            minute: m.minute,
            period: m.statusDisplay,
            venue: m.venue,
          },
        });
      }
    } catch {
      // Non-blocking
    }
  }
}

function mapSportEnum(sport: SportSlug): "FOOTBALL" | "BASKETBALL" | "NFL" | "HOCKEY" | "BASEBALL" | "F1" | "CRICKET" {
  const map: Record<string, "FOOTBALL" | "BASKETBALL" | "NFL" | "HOCKEY" | "BASEBALL" | "F1" | "CRICKET"> = {
    football: "FOOTBALL",
    basketball: "BASKETBALL",
    nfl: "NFL",
    hockey: "HOCKEY",
    baseball: "BASEBALL",
    f1: "F1",
    cricket: "CRICKET",
  };
  return map[sport] ?? "FOOTBALL";
}
