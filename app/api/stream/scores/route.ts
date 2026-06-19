/**
 * Live Scores SSE Stream
 *
 * Uses sport-specific data sources:
 * - Football/Soccer: ESPN unofficial API (7 leagues)
 * - Basketball/NBA: NBA CDN official (live scores)
 * - Hockey/NHL: NHL official API (api-web.nhle.com)
 * - Baseball/MLB: MLB Stats API (statsapi.mlb.com)
 * - Other sports: ESPN unofficial API
 *
 * Delivery modes:
 * Option A (Redis pub/sub): Worker → Redis → SSE → browser (when REDIS_URL set)
 * Option B (direct polling): This endpoint polls sources every 10s (fallback)
 */

import { NextRequest } from "next/server";
import { fetchScoreboard, normalizeEvent } from "@/lib/sports-api";
import { cacheGet, cacheSet } from "@/lib/redis";
import type { LeagueGroup, NormalizedMatch, SportSlug } from "@/lib/types";
import type { NormalizedEvent } from "@/scrapers/base";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ESPN paths for sports that use it
const ESPN_PATHS: {
  sport: SportSlug;
  path: string;
  leagueId: string;
  leagueName: string;
  leagueShortName: string;
}[] = [
  // Top European leagues
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
  { sport: "football", path: "soccer/conmebol.sudamericana", leagueId: "conmebol.sudamericana", leagueName: "Copa Sudamericana", leagueShortName: "SUDM" },
  { sport: "football", path: "soccer/concacaf.champions", leagueId: "concacaf.champions", leagueName: "CONCACAF Champions", leagueShortName: "CCL" },
  // Asia / Other
  { sport: "football", path: "soccer/jpn.1", leagueId: "jpn.1", leagueName: "J-League", leagueShortName: "J1" },
  { sport: "football", path: "soccer/aus.1", leagueId: "aus.1", leagueName: "A-League", leagueShortName: "ALE" },
  { sport: "football", path: "soccer/ksa.1", leagueId: "ksa.1", leagueName: "Saudi Pro League", leagueShortName: "SPL" },
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

const LIVE_TTL = 3;
const IDLE_TTL = 15;
const POLL_INTERVAL = 3_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Sport-specific fetch functions ──────────────────────────────────────────

async function fetchNhlGroups(date?: string): Promise<LeagueGroup[]> {
  try {
    const { NhlScraper } = await import("@/scrapers/hockey/nhl");
    const nhl = new NhlScraper();
    const events = date
      ? await nhl.fetchScheduleByDate(date)
      : await nhl.fetchScheduleToday();
    const matches = events.map(e => toMatch(e, "hockey"));
    return matches.length > 0
      ? [{ leagueId: "nhl", leagueName: "NHL", leagueShortName: "NHL", sport: "hockey" as SportSlug, matches }]
      : [];
  } catch {
    const events = await fetchScoreboard("hockey/nhl");
    const matches = events.map(e => normalizeEvent(e, "hockey", "NHL", "NHL", "nhl"));
    return matches.length > 0
      ? [{ leagueId: "nhl", leagueName: "NHL", leagueShortName: "NHL", sport: "hockey" as SportSlug, matches }]
      : [];
  }
}

async function fetchMlbGroups(date?: string): Promise<LeagueGroup[]> {
  try {
    const { MlbScraper } = await import("@/scrapers/baseball/mlb");
    const mlb = new MlbScraper();
    const isoDate = date ?? new Date().toISOString().split("T")[0];
    const events = await mlb.fetchScheduleByDate(isoDate);
    const matches = events.map(e => toMatch(e, "baseball"));
    return matches.length > 0
      ? [{ leagueId: "mlb", leagueName: "MLB", leagueShortName: "MLB", sport: "baseball" as SportSlug, matches }]
      : [];
  } catch {
    const events = await fetchScoreboard("baseball/mlb");
    const matches = events.map(e => normalizeEvent(e, "baseball", "MLB", "MLB", "mlb"));
    return matches.length > 0
      ? [{ leagueId: "mlb", leagueName: "MLB", leagueShortName: "MLB", sport: "baseball" as SportSlug, matches }]
      : [];
  }
}

async function fetchNbaGroups(): Promise<LeagueGroup[]> {
  let cdnMatches: NormalizedMatch[] = [];
  try {
    const { fetchNbaScoreboard } = await import("@/lib/external-apis");
    const games = await fetchNbaScoreboard();
    const statusMap: Record<number, NormalizedMatch["status"]> = { 1: "SCHEDULED", 2: "LIVE", 3: "FINISHED" };
    cdnMatches = games.map(g => ({
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

  if (cdnMatches.length > 0) {
    return [{ leagueId: "nba", leagueName: "NBA", leagueShortName: "NBA", sport: "basketball" as SportSlug, matches: cdnMatches }];
  }

  // CDN empty → try ESPN with today's date only (prevents stale scheduled-game bleed-through)
  const todayKey = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const events = await fetchScoreboard("basketball/nba", todayKey);
  const matches = events.map(e => normalizeEvent(e, "basketball", "NBA", "NBA", "nba"));
  return matches.length > 0
    ? [{ leagueId: "nba", leagueName: "NBA", leagueShortName: "NBA", sport: "basketball" as SportSlug, matches }]
    : [];
}

// ─── Cricket via TheSportsDB ──────────────────────────────────────────────────

const TSDB_CRICKET = "https://www.thesportsdb.com/api/v1/json/3";
const CRICKET_LEAGUES_TSDB: { id: string; tsdbId: string; name: string; shortName: string }[] = [
  { id: "ipl",           tsdbId: "4460", name: "Indian Premier League",     shortName: "IPL"  },
  { id: "eng.domestic",  tsdbId: "4458", name: "County Championship Div 1", shortName: "CC1"  },
  { id: "eng.domestic2", tsdbId: "4459", name: "County Championship Div 2", shortName: "CC2"  },
  { id: "eng.t20",       tsdbId: "4463", name: "Vitality T20 Blast",        shortName: "T20B" },
  { id: "psl",           tsdbId: "5067", name: "Pakistan Super League",      shortName: "PSL"  },
  { id: "big.bash",      tsdbId: "4461", name: "Big Bash League",            shortName: "BBL"  },
  { id: "aus.domestic",  tsdbId: "5530", name: "Sheffield Shield",           shortName: "SS"   },
  { id: "bpl",           tsdbId: "5529", name: "Bangladesh Premier League",  shortName: "BPL"  },
  { id: "cplt20",        tsdbId: "5176", name: "Caribbean Premier League",   shortName: "CPL"  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTsdb(e: any, leagueId: string, leagueName: string, shortName: string): NormalizedMatch {
  const parseScore = (raw: string | null, intV: string | null) => {
    if (raw && raw !== "null" && raw.trim()) return raw.trim();
    if (intV != null && intV !== "null") return String(intV);
    return null;
  };
  const mapSt = (s: string | null): NormalizedMatch["status"] => {
    if (!s) return "SCHEDULED";
    const u = s.toUpperCase();
    if (u === "FT" || u === "AOT" || u.includes("FINISH") || u.includes("COMPLETE")) return "FINISHED";
    if (u.includes("LIVE") || u.includes("PROGRESS") || u.includes("INPROG")) return "LIVE";
    if (u.includes("POSTPONED") || u.includes("ABANDONED")) return "POSTPONED";
    if (u.includes("CANCEL")) return "CANCELLED";
    return "SCHEDULED";
  };
  const hs = parseScore(e.strHomeScore, e.intHomeScore);
  const as = parseScore(e.strAwayScore, e.intAwayScore);
  const status = mapSt(e.strStatus);
  const dateStr = e.dateEvent ?? new Date().toISOString().slice(0, 10);
  const timeStr = e.strTime ? `T${e.strTime}Z` : "T00:00:00Z";
  const statusDisplay = status === "FINISHED" && hs && as ? `${hs} | ${as}` : (e.strStatus ?? "vs");
  return {
    id: String(e.idEvent),
    homeTeam: { id: String(e.idHomeTeam ?? e.idEvent + "_h"), name: e.strHomeTeam ?? "TBD", shortName: (e.strHomeTeam ?? "TBD").split(" ").pop()?.slice(0, 3).toUpperCase() ?? "HOM", logoUrl: e.strHomeTeamBadge ?? null },
    awayTeam: { id: String(e.idAwayTeam ?? e.idEvent + "_a"), name: e.strAwayTeam ?? "TBD", shortName: (e.strAwayTeam ?? "TBD").split(" ").pop()?.slice(0, 3).toUpperCase() ?? "AWY", logoUrl: e.strAwayTeamBadge ?? null },
    league: { id: leagueId, name: leagueName, shortName },
    homeScore: e.intHomeScore != null ? parseInt(String(e.intHomeScore)) : null,
    awayScore: e.intAwayScore != null ? parseInt(String(e.intAwayScore)) : null,
    status, statusDisplay, minute: null, sport: "cricket",
    scheduledAt: `${dateStr}${timeStr}`,
    venue: e.strVenue ?? undefined,
  };
}

async function fetchCricketStreamGroups(): Promise<LeagueGroup[]> {
  const results = await Promise.allSettled(
    CRICKET_LEAGUES_TSDB.map(async league => {
      const [pastRes, nextRes] = await Promise.allSettled([
        fetch(`${TSDB_CRICKET}/eventspastleague.php?id=${league.tsdbId}`, { next: { revalidate: 120 } }),
        fetch(`${TSDB_CRICKET}/eventsnextleague.php?id=${league.tsdbId}`, { next: { revalidate: 120 } }),
      ]);
      const matches: NormalizedMatch[] = [];
      if (pastRes.status === "fulfilled" && pastRes.value.ok) {
        const d = await pastRes.value.json();
        for (const e of (d.events ?? [])) matches.push(normalizeTsdb(e, league.id, league.name, league.shortName));
      }
      if (nextRes.status === "fulfilled" && nextRes.value.ok) {
        const d = await nextRes.value.json();
        for (const e of (d.events ?? [])) matches.push(normalizeTsdb(e, league.id, league.name, league.shortName));
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

// ─── Unified fetcher by sport ─────────────────────────────────────────────────

async function fetchGroupsForSport(sport: SportSlug, date?: string): Promise<LeagueGroup[]> {
  // Convert YYYYMMDD to ISO YYYY-MM-DD if needed
  const isoDate = date
    ? (date.length === 8 ? `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}` : date)
    : undefined;

  // Detect if the requested date is today (or no date = today)
  const todayIso = new Date().toISOString().slice(0, 10);
  const isToday = !isoDate || isoDate === todayIso;

  const cacheKey = `scores:${sport}:${date ?? "now"}`;
  const cached = await cacheGet<LeagueGroup[]>(cacheKey);
  if (cached) return cached;

  let groups: LeagueGroup[] = [];

  if (sport === "hockey") {
    groups = await fetchNhlGroups(isoDate);
  } else if (sport === "baseball") {
    groups = await fetchMlbGroups(isoDate);
  } else if (sport === "cricket") {
    groups = await fetchCricketStreamGroups();
  } else if (sport === "basketball") {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const espnDate = date ?? todayStr;

    // NBA: CDN for today (live accuracy), ESPN fallback
    let nbaMatches: NormalizedMatch[] = [];
    if (isToday) {
      const nbaGroups = await fetchNbaGroups();
      if (nbaGroups.length > 0) {
        nbaMatches = nbaGroups[0].matches;
      }
    }
    if (nbaMatches.length === 0) {
      const events = await fetchScoreboard("basketball/nba", espnDate);
      nbaMatches = events.map(e => normalizeEvent(e, "basketball", "NBA", "NBA", "nba"));
    }
    if (nbaMatches.length > 0) {
      groups.push({ leagueId: "nba", leagueName: "NBA", leagueShortName: "NBA", sport: "basketball", matches: nbaMatches });
    }

    // WNBA via ESPN
    const wnbaEvents = await fetchScoreboard("basketball/wnba", espnDate);
    const wnbaMatches = wnbaEvents.map(e => normalizeEvent(e, "basketball", "WNBA", "WNBA", "wnba"));
    if (wnbaMatches.length > 0) {
      groups.push({ leagueId: "wnba", leagueName: "WNBA", leagueShortName: "WNBA", sport: "basketball", matches: wnbaMatches });
    }

    // NCAA Men's
    const ncaabEvents = await fetchScoreboard("basketball/mens-college-basketball", espnDate);
    const ncaabMatches = ncaabEvents.map(e => normalizeEvent(e, "basketball", "NCAA Men's Basketball", "NCAAB", "ncaab"));
    if (ncaabMatches.length > 0) {
      groups.push({ leagueId: "ncaab", leagueName: "NCAA Men's Basketball", leagueShortName: "NCAAB", sport: "basketball", matches: ncaabMatches });
    }

    // NCAA Women's
    const ncaawEvents = await fetchScoreboard("basketball/womens-college-basketball", espnDate);
    const ncaawMatches = ncaawEvents.map(e => normalizeEvent(e, "basketball", "NCAA Women's Basketball", "NCAAW", "ncaaw"));
    if (ncaawMatches.length > 0) {
      groups.push({ leagueId: "ncaaw", leagueName: "NCAA Women's Basketball", leagueShortName: "NCAAW", sport: "basketball", matches: ncaawMatches });
    }
  } else {
    const paths = ESPN_PATHS.filter(p => p.sport === sport);
    const results = await Promise.allSettled(
      paths.map(async cfg => {
        const events = await fetchScoreboard(cfg.path, date);
        const matches = events.map(e =>
          normalizeEvent(e, cfg.sport, cfg.leagueName, cfg.leagueShortName, cfg.leagueId)
        );
        return { ...cfg, matches } as LeagueGroup;
      })
    );
    groups = results
      .filter((r): r is PromiseFulfilledResult<LeagueGroup> => r.status === "fulfilled" && r.value.matches.length > 0)
      .map(r => r.value);
  }

  const hasLive = groups.some(g => g.matches.some(m => m.status === "LIVE" || m.status === "HALF_TIME"));
  await cacheSet(cacheKey, groups, hasLive ? LIVE_TTL : IDLE_TTL);
  return groups;
}

// ─── SSE handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sport = (searchParams.get("sport") ?? "football") as SportSlug;
  const date = searchParams.get("date") ?? undefined;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // ── Try Redis pub/sub first ────────────────────────────────────────
      const redisUrl = process.env.REDIS_URL;
      let usePolling = !redisUrl;

      if (redisUrl) {
        try {
          const { default: IORedis } = await import("ioredis");
          const sub = new IORedis(redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: false });
          const channel = `sport:scores:${sport}`;
          await sub.subscribe(channel);

          sub.on("message", (_ch: string, msg: string) => {
            try {
              const data = JSON.parse(msg);
              send("update", data);
            } catch {}
          });

          const initial = await fetchGroupsForSport(sport, date);
          send("snapshot", { groups: initial, updatedAt: new Date().toISOString() });

          const hbInterval = setInterval(() => send("heartbeat", { ts: Date.now() }), 5_000);

          req.signal.addEventListener("abort", async () => {
            closed = true;
            clearInterval(hbInterval);
            await sub.unsubscribe(channel);
            sub.disconnect();
            try { controller.close(); } catch {}
          });
          return;
        } catch {
          usePolling = true;
        }
      }

      // ── Polling fallback ───────────────────────────────────────────────
      if (usePolling) {
        const initial = await fetchGroupsForSport(sport, date);
        send("snapshot", { groups: initial, updatedAt: new Date().toISOString() });

        let lastHash = JSON.stringify(initial.map(g =>
          g.matches.map(m => `${m.id}:${m.homeScore}:${m.awayScore}:${m.status}:${m.minute}`)
        ));

        const { cacheDel } = await import("@/lib/redis");

        const interval = setInterval(async () => {
          if (closed) { clearInterval(interval); return; }
          try {
            // Bust cache for fresh data
            await cacheDel(`scores:${sport}:${date ?? "now"}`);
            const groups = await fetchGroupsForSport(sport, date);
            const hash = JSON.stringify(groups.map(g =>
              g.matches.map(m => `${m.id}:${m.homeScore}:${m.awayScore}:${m.status}:${m.minute}`)
            ));
            if (hash !== lastHash) {
              lastHash = hash;
              send("update", { groups, updatedAt: new Date().toISOString() });
            } else {
              send("heartbeat", { ts: Date.now() });
            }
          } catch {
            send("heartbeat", { ts: Date.now() });
          }
        }, POLL_INTERVAL);

        req.signal.addEventListener("abort", () => {
          closed = true;
          clearInterval(interval);
          try { controller.close(); } catch {}
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
