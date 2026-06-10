/**
 * Cricket Scraper — ESPN Cricinfo + CricAPI
 *
 * ESPN Cricinfo API (unofficial but consistent):
 * Base: https://hs-consumer-api.espncricinfo.com/v1/
 * Discovered via DevTools on espncricinfo.com — XHR requests
 *
 * Also uses ESPN's public cricket scoreboard:
 * https://site.api.espn.com/apis/site/v2/sports/cricket/{league}/scoreboard
 *
 * Live match websocket: Cricinfo uses long-polling XHR for live scores
 * (not WebSocket), updating every ~10s. We replicate this with SSE.
 */

import { fetchJson } from "@/scrapers/base";
import type { NormalizedEvent } from "@/scrapers/base";

const CRICINFO_API = "https://hs-consumer-api.espncricinfo.com/v1";
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/cricket";

const HEADERS = {
  "Origin": "https://www.espncricinfo.com",
  "Referer": "https://www.espncricinfo.com/",
};

// Known ESPN cricket league IDs
export const CRICKET_LEAGUES = [
  { id: "icc.t20wc", name: "ICC T20 World Cup", espnId: "icc.t20wc" },
  { id: "icc.wc", name: "ICC ODI World Cup", espnId: "icc.wc" },
  { id: "ipl", name: "Indian Premier League", espnId: "ipl" },
  { id: "bbl", name: "Big Bash League", espnId: "big.bash" },
  { id: "psl", name: "Pakistan Super League", espnId: "psl" },
  { id: "cpl", name: "Caribbean Premier League", espnId: "cplt20" },
  { id: "eng.domestic", name: "County Championship", espnId: "eng.domestic" },
];

function mapCricketStatus(
  status: { type?: { name?: string; state?: string; description?: string }; displayClock?: string }
): NormalizedEvent["status"] {
  const name = status.type?.name ?? "";
  const state = status.type?.state ?? "";
  if (name === "STATUS_IN_PROGRESS" || state === "in") return "LIVE";
  if (name === "STATUS_FINAL" || state === "post") return "FINISHED";
  if (name === "STATUS_POSTPONED") return "POSTPONED";
  if (name === "STATUS_CANCELLED") return "CANCELLED";
  return "SCHEDULED";
}

interface EspnCricketEvent {
  id: string;
  date: string;
  name: string;
  competitions: {
    id: string;
    competitors: {
      homeAway: "home" | "away";
      score?: string;
      team: {
        id: string;
        displayName: string;
        abbreviation: string;
        logo?: string;
        logos?: { href: string }[];
      };
    }[];
    venue?: { fullName?: string };
    status?: {
      type?: { name?: string; state?: string; shortDetail?: string };
      displayClock?: string;
    };
    series?: { title?: string };
    format?: string;
  }[];
  season?: { displayName?: string };
}

function normalizeEspnCricket(e: EspnCricketEvent, leagueId: string, leagueName: string): NormalizedEvent {
  const comp = e.competitions[0];
  const home = comp?.competitors?.find((c) => c.homeAway === "home");
  const away = comp?.competitors?.find((c) => c.homeAway === "away");

  return {
    id: `cricket_${e.id}`,
    sport: "cricket",
    source: "espncricinfo",
    homeTeam: {
      id: home?.team?.id ?? "",
      name: home?.team?.displayName ?? "Home",
      logo: home?.team?.logos?.[0]?.href ?? home?.team?.logo,
    },
    awayTeam: {
      id: away?.team?.id ?? "",
      name: away?.team?.displayName ?? "Away",
      logo: away?.team?.logos?.[0]?.href ?? away?.team?.logo,
    },
    homeScore: home?.score ? parseFloat(home.score) : null,
    awayScore: away?.score ? parseFloat(away.score) : null,
    status: mapCricketStatus(comp?.status ?? {}),
    statusDisplay: comp?.status?.type?.shortDetail ?? "",
    minute: null,
    leagueId,
    leagueName,
    scheduledAt: e.date,
    venue: comp?.venue?.fullName,
    raw: e,
  };
}

export class CricInfoScraper {
  /** Live cricket matches from ESPN */
  async fetchLiveMatches(): Promise<NormalizedEvent[]> {
    const all: NormalizedEvent[] = [];
    await Promise.allSettled(
      CRICKET_LEAGUES.map(async (league) => {
        const data = await fetchJson<{ events?: EspnCricketEvent[] }>(
          `${ESPN_BASE}/${league.espnId}/scoreboard`,
          { headers: HEADERS }
        );
        if (data?.events) {
          all.push(...data.events.map((e) => normalizeEspnCricket(e, league.id, league.name)));
        }
      })
    );
    return all;
  }

  /** Full match scorecard — innings, overs, wickets, player scores */
  async fetchMatchScorecard(espnEventId: string, leagueId: string) {
    const data = await fetchJson<{
      header?: unknown;
      scorecard?: {
        innings?: {
          team?: { name?: string };
          runs?: number;
          wickets?: number;
          overs?: string;
          batsmen?: {
            player?: { name?: string };
            runs?: number;
            balls?: number;
            fours?: number;
            sixes?: number;
            strikeRate?: string;
            out?: boolean;
            howDismissed?: string;
          }[];
          bowlers?: {
            player?: { name?: string };
            overs?: string;
            maidens?: number;
            runs?: number;
            wickets?: number;
            economy?: string;
          }[];
        }[];
        winnerTeamId?: string;
        description?: string;
      };
      commentary?: unknown;
    }>(
      `${ESPN_BASE}/${leagueId}/summary?event=${espnEventId}`,
      { headers: HEADERS }
    );
    return data;
  }

  /** Live commentary / ball-by-ball */
  async fetchCommentary(espnEventId: string, leagueId: string) {
    const data = await fetchJson<{ commentary?: unknown[] }>(
      `${CRICINFO_API}/pages/match/live?appKey=miscellaneous&lang=en&seriesId=${leagueId}&matchId=${espnEventId}`,
      { headers: HEADERS }
    );
    return data?.commentary ?? [];
  }
}
