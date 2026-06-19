/**
 * Live Match Detail SSE Stream
 *
 * Primary source: ESPN unofficial API (events, stats, rosters)
 * Enrichment: Sofascore API (player names on incidents, possession/xG stats)
 *
 * Sofascore enrichment is attempted by searching the match date for
 * the same fixture, then using the Sofascore event ID for rich data.
 * Falls back gracefully to ESPN-only if Sofascore is unavailable.
 */

import { NextRequest } from "next/server";
import { cacheGet, cacheSet } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ESPN_WEB = "https://site.api.espn.com/apis/site/v2/sports";

const SPORT_LEAGUE_PATHS: Record<string, string> = {
  "football:eng.1": "soccer/eng.1",
  "football:esp.1": "soccer/esp.1",
  "football:ger.1": "soccer/ger.1",
  "football:ita.1": "soccer/ita.1",
  "football:fra.1": "soccer/fra.1",
  "football:uefa.champions": "soccer/uefa.champions",
  "football:uefa.europa": "soccer/uefa.europa",
  "football:uefa.europa_conf": "soccer/uefa.europa_conf",
  "football:por.1": "soccer/por.1",
  "football:ned.1": "soccer/ned.1",
  "football:tur.1": "soccer/tur.1",
  "football:sco.1": "soccer/sco.1",
  "football:usa.1": "soccer/usa.1",
  "football:mex.1": "soccer/mex.1",
  "football:bra.1": "soccer/bra.1",
  "football:arg.1": "soccer/arg.1",
  "football:conmebol.libertadores": "soccer/conmebol.libertadores",
  "football:concacaf.champions": "soccer/concacaf.champions",
  "football:conmebol.sudamericana": "soccer/conmebol.sudamericana",
  "football:jpn.1": "soccer/jpn.1",
  "football:aus.1": "soccer/aus.1",
  "football:ksa.1": "soccer/ksa.1",
  "football:chn.1": "soccer/chn.1",
  "football:idn.1": "soccer/idn.1",
  "football:bel.1": "soccer/bel.1",
  "football:rus.1": "soccer/rus.1",
  "football:gre.1": "soccer/gre.1",
  "football:col.1": "soccer/col.1",
  "football:chi.1": "soccer/chi.1",
  "football:ecu.1": "soccer/ecu.1",
  // International — FIFA World Cup & Qualifiers
  "football:fifa.world": "soccer/fifa.world",
  "football:fifa.worldq.uefa": "soccer/fifa.worldq.uefa",
  "football:fifa.worldq.conmebol": "soccer/fifa.worldq.conmebol",
  "football:fifa.worldq.concacaf": "soccer/fifa.worldq.concacaf",
  "football:fifa.worldq.africa": "soccer/fifa.worldq.africa",
  "football:fifa.worldq.asia": "soccer/fifa.worldq.asia",
  // International — Continental Tournaments
  "football:uefa.euro": "soccer/uefa.euro",
  "football:conmebol.america": "soccer/conmebol.america",
  "football:caf.nations": "soccer/caf.nations",
  "football:concacaf.gold": "soccer/concacaf.gold",
  "football:concacaf.nations": "soccer/concacaf.nations",
  "football:afc.cup": "soccer/afc.cup",
  "football:uefa.nations": "soccer/uefa.nations",
  "basketball:nba": "basketball/nba",
  "nfl:nfl": "football/nfl",
  "hockey:nhl": "hockey/nhl",
  "baseball:mlb": "baseball/mlb",
  "tennis:atp.1": "tennis/atp.1",
  "f1:f1": "racing/f1",
  "mma:ufc": "mma/ufc",
  "golf:pga": "golf/pga",
};

// ─── Sofascore matching helpers ───────────────────────────────────────────────

function normalizeTeamName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function teamsMatch(espnName: string, sofascoreName: string): boolean {
  const e = normalizeTeamName(espnName);
  const s = normalizeTeamName(sofascoreName);
  if (e === s) return true;
  const len = Math.min(e.length, s.length, 6);
  if (len >= 4 && e.slice(0, len) === s.slice(0, len)) return true;
  return (e.length >= 5 && s.includes(e.slice(0, 5))) || (s.length >= 5 && e.includes(s.slice(0, 5)));
}

// ─── Sofascore incident → KeyEvent mapper ─────────────────────────────────────

interface SofaIncident {
  id: number;
  incidentType: string;
  incidentClass?: string;
  time?: number;
  addedTime?: number;
  player?: { name: string; id: number };
  playerIn?: { name: string };
  playerOut?: { name: string };
  isHome?: boolean;
  description?: string;
}

function mapIncidentsToKeyEvents(
  incidents: SofaIncident[],
  homeTeamId: string,
  awayTeamId: string
) {
  return incidents
    .filter(i => ["goal", "card", "substitution", "period"].includes(i.incidentType))
    .map(i => {
      const minute = i.addedTime
        ? `${i.time ?? 0}+${i.addedTime}'`
        : `${i.time ?? ""}${i.time ? "'" : ""}`;
      const teamId = (i.isHome ?? false) ? homeTeamId : awayTeamId;

      if (i.incidentType === "goal") {
        return {
          id: String(i.id),
          type: i.incidentClass === "ownGoal" ? "Own Goal" : "Goal",
          clock: minute,
          text: i.player?.name ?? "Goal",
          playerName: i.player?.name,
          teamId,
          isYellowCard: false,
          isRedCard: false,
          isSubstitution: false,
        };
      }
      if (i.incidentType === "card") {
        const isRed = i.incidentClass === "red" || i.incidentClass === "yellowred";
        return {
          id: String(i.id),
          type: isRed ? "Red Card" : "Yellow Card",
          clock: minute,
          text: i.player?.name ?? (isRed ? "Red Card" : "Yellow Card"),
          playerName: i.player?.name,
          teamId,
          isYellowCard: !isRed,
          isRedCard: isRed,
          isSubstitution: false,
        };
      }
      if (i.incidentType === "substitution") {
        return {
          id: String(i.id),
          type: "Substitution",
          clock: minute,
          text: i.playerIn?.name ? `↑ ${i.playerIn.name}` : "Substitution",
          playerName: i.playerIn?.name ?? i.playerOut?.name,
          teamId,
          isYellowCard: false,
          isRedCard: false,
          isSubstitution: true,
        };
      }
      return {
        id: String(i.id),
        type: i.description ?? i.incidentType,
        clock: minute,
        text: i.description ?? i.incidentType,
        playerName: undefined,
        teamId: undefined,
        isYellowCard: false,
        isRedCard: false,
        isSubstitution: false,
      };
    });
}

// ─── Sofascore stats mapper ────────────────────────────────────────────────────

interface SofaStatsItem { name: string; home: string; away: string }
interface SofaStatsGroup { groupName: string; statisticsItems?: SofaStatsItem[] }
interface SofaStatsPeriod { period: string; groups?: SofaStatsGroup[] }

function mapSofascoreStats(
  statsData: { statistics?: SofaStatsPeriod[] } | null,
  homeTeamId: string, homeTeamName: string, homeTeamLogo: string | undefined,
  awayTeamId: string, awayTeamName: string, awayTeamLogo: string | undefined
) {
  const allPeriod = statsData?.statistics?.find(s => s.period === "ALL") ?? statsData?.statistics?.[0];
  if (!allPeriod?.groups?.length) return null;

  const homeStats: { name: string; value: string; label: string }[] = [];
  const awayStats: { name: string; value: string; label: string }[] = [];

  for (const group of allPeriod.groups) {
    for (const item of group.statisticsItems ?? []) {
      homeStats.push({ name: item.name, value: item.home, label: item.name });
      awayStats.push({ name: item.name, value: item.away, label: item.name });
    }
  }

  if (!homeStats.length) return null;

  return [
    { teamId: homeTeamId, teamName: homeTeamName, teamLogo: homeTeamLogo, stats: homeStats },
    { teamId: awayTeamId, teamName: awayTeamName, teamLogo: awayTeamLogo, stats: awayStats },
  ];
}

// ─── Core match detail fetcher ────────────────────────────────────────────────

async function fetchMatchDetail(matchId: string, sport: string, league: string) {
  const cacheKey = `match:${matchId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const leaguePath = SPORT_LEAGUE_PATHS[`${sport}:${league}`];
  if (!leaguePath) return null;

  const url = `${ESPN_WEB}/${leaguePath}/summary?event=${matchId}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = await res.json();

  const header = data.header;
  const competition = header?.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const homeComp = competitors.find((c: { homeAway: string }) => c.homeAway === "home");
  const awayComp = competitors.find((c: { homeAway: string }) => c.homeAway === "away");

  const homeTeamId: string = homeComp?.team?.id ?? "";
  const awayTeamId: string = awayComp?.team?.id ?? "";
  const homeTeamName: string = homeComp?.team?.displayName ?? "Home";
  const awayTeamName: string = awayComp?.team?.displayName ?? "Away";
  const homeTeamLogo: string | undefined = homeComp?.team?.logos?.[0]?.href ?? homeComp?.team?.logo;
  const awayTeamLogo: string | undefined = awayComp?.team?.logos?.[0]?.href ?? awayComp?.team?.logo;

  // ESPN key events
  const espnKeyEvents = (data.keyEvents ?? []).map((e: {
    id?: string;
    type?: { id?: string; text?: string };
    clock?: { displayValue?: string };
    text?: string;
    athletesInvolved?: { displayName?: string; team?: { id?: string } }[];
    team?: { id?: string };
    scoreValue?: number;
    yellowCard?: boolean;
    redCard?: boolean;
    substitution?: boolean;
    shootout?: boolean;
  }) => ({
    id: e.id ?? String(Math.random()),
    type: e.type?.text,
    typeId: e.type?.id,
    clock: e.clock?.displayValue,
    text: e.text,
    playerName: e.athletesInvolved?.[0]?.displayName,
    teamId: e.team?.id ?? e.athletesInvolved?.[0]?.team?.id,
    scoreValue: e.scoreValue,
    isYellowCard: e.yellowCard,
    isRedCard: e.redCard,
    isSubstitution: e.substitution,
    isShootout: e.shootout,
  }));

  // ESPN boxscore stats
  const bsTeams = data.boxscore?.teams ?? [];
  const espnStats = bsTeams.map((t: {
    team?: { id?: string; displayName?: string; logo?: string; logos?: { href?: string }[] };
    statistics?: { name?: string; displayValue?: string; label?: string }[];
  }) => ({
    teamId: t.team?.id,
    teamName: t.team?.displayName,
    teamLogo: t.team?.logos?.[0]?.href ?? t.team?.logo,
    stats: (t.statistics ?? []).map((s: { name?: string; displayValue?: string; label?: string }) => ({
      name: s.name,
      value: s.displayValue,
      label: s.label,
    })),
  }));

  // Rosters/lineups
  const rosters = (data.rosters ?? []).map((r: {
    team?: { id?: string; displayName?: string; logo?: string; logos?: { href?: string }[] };
    formation?: { slot?: string };
    roster?: {
      athlete?: { id?: string; displayName?: string; headshot?: { href?: string }; position?: { abbreviation?: string } };
      starter?: boolean;
      subbedOut?: boolean;
      position?: string;
    }[];
  }) => ({
    teamId: r.team?.id,
    teamName: r.team?.displayName,
    teamLogo: r.team?.logos?.[0]?.href ?? r.team?.logo,
    formation: r.formation?.slot,
    players: (r.roster ?? []).map((p: {
      athlete?: { id?: string; displayName?: string; headshot?: { href?: string }; position?: { abbreviation?: string } };
      starter?: boolean;
      subbedOut?: boolean;
      position?: string;
    }) => ({
      id: p.athlete?.id,
      name: p.athlete?.displayName,
      headshot: p.athlete?.headshot?.href,
      position: p.athlete?.position?.abbreviation,
      starter: p.starter,
      subbedOut: p.subbedOut,
      jerseyPosition: p.position,
    })),
  }));

  const scheduledAt: string = competition?.date ?? header?.gameInfo?.date ?? new Date().toISOString();

  const result = {
    matchId,
    homeTeam: {
      id: homeTeamId,
      name: homeTeamName,
      logo: homeTeamLogo,
      score: homeComp?.score,
      record: homeComp?.record?.[0]?.displayValue,
    },
    awayTeam: {
      id: awayTeamId,
      name: awayTeamName,
      logo: awayTeamLogo,
      score: awayComp?.score,
      record: awayComp?.record?.[0]?.displayValue,
    },
    status: competition?.status?.type?.name,
    statusDisplay: competition?.status?.type?.shortDetail,
    clock: competition?.status?.displayClock,
    period: competition?.status?.period,
    venue: competition?.venue?.fullName,
    attendance: competition?.attendance,
    scheduledAt,
    keyEvents: espnKeyEvents,
    stats: espnStats,
    rosters,
    source: "espn",
  };

  // ── Sofascore enrichment (football only) ──────────────────────────────────
  if (leaguePath.startsWith("soccer")) {
    try {
      const matchDate = new Date(scheduledAt).toISOString().split("T")[0];
      const { SofascoreScraper } = await import("@/scrapers/football/sofascore");
      const scraper = new SofascoreScraper();

      // Search by date and find matching fixture
      const dayEvents = await scraper.fetchEventsByDate(matchDate);
      const matched = dayEvents.find(e =>
        teamsMatch(homeTeamName, e.homeTeam.name) &&
        teamsMatch(awayTeamName, e.awayTeam.name)
      );

      if (matched) {
        const sofascoreId = matched.id.replace("sofascore_", "");

        const [incidentsRes, statsRes] = await Promise.allSettled([
          scraper.fetchMatchTimeline(sofascoreId),
          scraper.fetchMatchStatistics(sofascoreId),
        ]);

        // Replace ESPN incidents with Sofascore ones (have player names)
        if (incidentsRes.status === "fulfilled" && incidentsRes.value.length > 0) {
          result.keyEvents = mapIncidentsToKeyEvents(incidentsRes.value, homeTeamId, awayTeamId);
          result.source = "sofascore";
        }

        // Replace ESPN stats with Sofascore stats (possession, shots, xG etc.)
        if (statsRes.status === "fulfilled" && statsRes.value) {
          const richStats = mapSofascoreStats(
            statsRes.value as { statistics?: SofaStatsPeriod[] },
            homeTeamId, homeTeamName, homeTeamLogo,
            awayTeamId, awayTeamName, awayTeamLogo
          );
          if (richStats) {
            result.stats = richStats;
            result.source = "sofascore";
          }
        }
      }
    } catch {
      // Sofascore unavailable — ESPN data remains
    }
  }

  const isLive = result.status?.includes("IN_PROGRESS") || result.status?.includes("HALFTIME");
  await cacheSet(cacheKey, result, isLive ? 3 : 15);

  return result;
}

// ─── SSE endpoint ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const matchId = searchParams.get("id");
  const sport = searchParams.get("sport") ?? "football";
  const league = searchParams.get("league") ?? "eng.1";

  if (!matchId) {
    return new Response("Missing match id", { status: 400 });
  }

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

      const initial = await fetchMatchDetail(matchId, sport, league);
      if (!initial) {
        send("error", { message: "Match not found" });
        try { controller.close(); } catch {}
        return;
      }
      send("snapshot", initial);

      const isLive = (d: unknown) => {
        const status = (d as { status?: string }).status ?? "";
        return status.includes("IN_PROGRESS") || status.includes("HALFTIME");
      };

      let pollMs = isLive(initial) ? 3_000 : 10_000;
      let pollTimer: ReturnType<typeof setTimeout> | null = null;

      const { cacheDel } = await import("@/lib/redis");

      const poll = async () => {
        if (closed) return;
        try {
          await cacheDel(`match:${matchId}`);
          const fresh = await fetchMatchDetail(matchId, sport, league);
          if (!fresh || closed) return;
          send("update", fresh);
          pollMs = isLive(fresh) ? 3_000 : 10_000;
          const freshStatus = (fresh as { status?: string }).status ?? "";
          if (freshStatus.includes("FINAL") || freshStatus.includes("STATUS_FULL_TIME")) {
            return; // Match ended, stop polling
          }
        } catch {
          if (!closed) send("heartbeat", { ts: Date.now() });
        }
        if (!closed) pollTimer = setTimeout(poll, pollMs);
      };

      pollTimer = setTimeout(poll, pollMs);

      req.signal.addEventListener("abort", () => {
        closed = true;
        if (pollTimer) clearTimeout(pollTimer);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
