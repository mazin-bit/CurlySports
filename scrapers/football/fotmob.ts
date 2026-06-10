/**
 * FotMob Football Scraper
 *
 * FotMob exposes a clean JSON API at fotmob.com/api/
 * Endpoint discovery: DevTools → Network → filter fotmob.com/api
 *
 * Key difference from Sofascore: FotMob returns match momentum graphs,
 * expected goals (xG), heatmaps, and shot maps — richer match analytics.
 *
 * Rate limit: ~40 req/min. We throttle to 1.5s between calls.
 * Anti-bot: Standard browser headers required.
 * No API key needed.
 */

import { fetchJson } from "@/scrapers/base";
import type { NormalizedEvent, NormalizedStanding } from "@/scrapers/base";

const BASE = "https://www.fotmob.com/api";

const HEADERS = {
  "Referer": "https://www.fotmob.com/",
  "Origin": "https://www.fotmob.com",
  "x-fm-req": `eyJhbGciOiJIUzI1NiJ9`, // Required token (public, static)
};

interface FotmobMatch {
  id: number;
  parentLeagueId: number;
  parentLeagueName: string;
  parentLeagueCCode: string;
  home: { id: number; name: string; score?: number };
  away: { id: number; name: string; score?: number };
  status: {
    utcTime: string;
    started: boolean;
    finished: boolean;
    cancelled: boolean;
    liveTime?: { short: string; long: string; maxTime?: number; addedTime?: number };
    reason?: { short: string; long: string };
  };
  pageUrl: string;
}

function normalizeFotmobMatch(m: FotmobMatch, leagueCCode?: string): NormalizedEvent {
  const isLive = m.status.started && !m.status.finished;
  const isFinished = m.status.finished;
  const isCancelled = m.status.cancelled;

  let status: NormalizedEvent["status"] = "SCHEDULED";
  if (isLive) {
    const shortTime = m.status.liveTime?.short ?? "";
    status = shortTime === "HT" ? "HALF_TIME" : "LIVE";
  } else if (isFinished) status = "FINISHED";
  else if (isCancelled) status = "CANCELLED";

  // Extract minute from liveTime.long e.g. "45+2'"
  const minuteStr = m.status.liveTime?.short ?? "";
  const minuteNum = parseInt(minuteStr.replace(/[^0-9]/g, "")) || null;

  return {
    id: `fotmob_${m.id}`,
    sport: "football",
    source: "fotmob",
    homeTeam: {
      id: String(m.home.id),
      name: m.home.name,
      logo: `https://images.fotmob.com/image_resources/logo/teamlogo/${m.home.id}_xsmall.png`,
    },
    awayTeam: {
      id: String(m.away.id),
      name: m.away.name,
      logo: `https://images.fotmob.com/image_resources/logo/teamlogo/${m.away.id}_xsmall.png`,
    },
    homeScore: m.home.score ?? null,
    awayScore: m.away.score ?? null,
    status,
    statusDisplay: m.status.liveTime?.short ?? m.status.reason?.short ?? (isFinished ? "FT" : "SCH"),
    minute: minuteNum,
    leagueId: String(m.parentLeagueId),
    leagueName: m.parentLeagueName,
    scheduledAt: m.status.utcTime,
    raw: m,
  };
}

export class FotmobScraper {
  /** All matches for a given date (YYYYMMDD or YYYY-MM-DD) */
  async fetchMatchesByDate(date: string): Promise<NormalizedEvent[]> {
    const d = date.replace(/-/g, "");
    const data = await fetchJson<{
      leagues?: {
        id: number;
        name: string;
        ccode: string;
        matches?: FotmobMatch[];
      }[];
    }>(`${BASE}/matches?date=${d}`, { headers: HEADERS });

    if (!data?.leagues) return [];
    return data.leagues.flatMap((l) =>
      (l.matches ?? []).map((m) => normalizeFotmobMatch({ ...m, parentLeagueId: l.id, parentLeagueName: l.name, parentLeagueCCode: l.ccode }))
    );
  }

  /** Detailed match data: xG, shots, timeline, lineups, momentum */
  async fetchMatchDetails(fotmobMatchId: string) {
    const id = fotmobMatchId.replace("fotmob_", "");
    const data = await fetchJson<{
      header?: {
        teams?: { id: number; name: string; score?: number; imageUrl?: string }[];
        status?: { utcTime?: string; liveTime?: { short: string }; started?: boolean; finished?: boolean };
      };
      content?: {
        matchFacts?: {
          matchSummary?: { homeScore?: number; awayScore?: number };
          events?: {
            id?: number;
            type: string;
            time?: number;
            player?: { id: number; name: string; imageUrl?: string };
            playerIn?: { id: number; name: string };
            playerOut?: { id: number; name: string };
            team?: { id: number; name: string };
            isHome?: boolean;
            suffixComment?: string;
          }[];
          timelineHighlights?: unknown[];
          momentum?: { main?: { entries?: { minute: number; value: number }[] } };
        };
        stats?: {
          Periods?: {
            All?: {
              stats?: {
                stats?: {
                  title: string;
                  stats?: { title: string; home: string; away: string; type: string }[];
                }[];
              };
            };
          };
        };
        lineup?: {
          homeTeam?: {
            players?: { id: number; name: string; position?: string; positionId?: number; starter?: boolean }[];
            formation?: string;
          };
          awayTeam?: {
            players?: { id: number; name: string; position?: string; starter?: boolean }[];
            formation?: string;
          };
        };
        superlive?: {
          superLiveData?: unknown;
        };
      };
      playerRatings?: {
        homeTeam?: { player: { id: number; name: string }; rating?: string }[];
        awayTeam?: { player: { id: number; name: string }; rating?: string }[];
      };
    }>(`${BASE}/matchDetails?matchId=${id}`, { headers: HEADERS });

    return data;
  }

  /** Expected goals (xG) data — FotMob exclusive */
  async fetchXgData(fotmobMatchId: string) {
    const details = await this.fetchMatchDetails(fotmobMatchId);
    // xG is embedded in match stats - extract shot map data
    const stats = details?.content?.stats?.Periods?.All?.stats?.stats ?? [];
    return stats;
  }

  /** League standings */
  async fetchStandings(fotmobLeagueId: string, season?: string): Promise<NormalizedStanding[]> {
    const url = season
      ? `${BASE}/leagues?id=${fotmobLeagueId}&ccode3=GBR&season=${season}`
      : `${BASE}/leagues?id=${fotmobLeagueId}&ccode3=GBR`;

    const data = await fetchJson<{
      standing?: {
        data?: {
          table?: {
            all?: {
              rank: number;
              id: number;
              name: string;
              played: number;
              wins: number;
              draws: number;
              losses: number;
              scoresStr: string;
              goalConDiff: number;
              pts: number;
              reason?: { key: string; text: string };
            }[];
          };
        }[];
      }[];
    }>(url, { headers: HEADERS });

    const rows = data?.standing?.[0]?.data?.[0]?.table?.all ?? [];
    return rows.map((r) => {
      const [gf, ga] = r.scoresStr.split("-").map(Number);
      return {
        rank: r.rank,
        teamId: String(r.id),
        teamName: r.name,
        teamLogo: `https://images.fotmob.com/image_resources/logo/teamlogo/${r.id}_xsmall.png`,
        gamesPlayed: r.played,
        wins: r.wins,
        draws: r.draws,
        losses: r.losses,
        points: r.pts,
        goalsFor: gf ?? 0,
        goalsAgainst: ga ?? 0,
        goalDiff: r.goalConDiff,
        note: r.reason?.text,
      };
    });
  }

  /** FotMob league IDs for major competitions */
  static LEAGUE_IDS = {
    "eng.1": 47,          // Premier League
    "esp.1": 87,          // La Liga
    "ger.1": 54,          // Bundesliga
    "ita.1": 55,          // Serie A
    "fra.1": 53,          // Ligue 1
    "uefa.champions": 42, // Champions League
    "usa.1": 130,         // MLS
    "ned.1": 57,          // Eredivisie
    "por.1": 61,          // Primeira Liga
  } as const;
}
