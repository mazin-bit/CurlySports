/**
 * Sofascore Football Scraper
 *
 * Uses Sofascore's undocumented but publicly accessible JSON API.
 * Endpoint discovery: Open DevTools → Network → XHR/Fetch → filter "api.sofascore"
 * All responses are JSON with consistent structure across sports.
 *
 * Rate limit: ~60 req/min observed. We throttle to 1 req/s.
 * Anti-bot: Requires "Referer: https://www.sofascore.com" header.
 * No API key needed for public read-only data.
 */

import { BaseScraper, fetchJson } from "@/scrapers/base";
import type { NormalizedEvent, NormalizedStanding, NormalizedPlayer } from "@/scrapers/base";

const BASE = "https://api.sofascore.com/api/v1";

const HEADERS = {
  "Referer": "https://www.sofascore.com/",
  "Origin": "https://www.sofascore.com",
  "Cache-Control": "no-cache",
};

// Sofascore status IDs → normalized status
function mapSofascoreStatus(status: { type?: string; code?: number; description?: string }): NormalizedEvent["status"] {
  const t = status.type ?? "";
  if (t === "inprogress") return "LIVE";
  if (t === "halftime") return "HALF_TIME";
  if (t === "finished") return "FINISHED";
  if (t === "postponed") return "POSTPONED";
  if (t === "canceled" || t === "cancelled") return "CANCELLED";
  return "SCHEDULED";
}

interface SofascoreEvent {
  id: number;
  slug: string;
  tournament: { id: number; name: string; slug: string; uniqueTournament?: { id: number; name: string } };
  homeTeam: { id: number; name: string; slug: string; logo?: string };
  awayTeam: { id: number; name: string; slug: string; logo?: string };
  homeScore?: { current?: number; period1?: number; period2?: number; normaltime?: number };
  awayScore?: { current?: number; period1?: number; period2?: number; normaltime?: number };
  status: { type: string; description?: string; code?: number };
  time?: { played?: number; periodLength?: number; overtimeLength?: number };
  startTimestamp: number;
  venue?: { city?: { name?: string }; name?: string };
}

function normalizeEvent(e: SofascoreEvent): NormalizedEvent {
  return {
    id: `sofascore_${e.id}`,
    sport: "football",
    source: "sofascore",
    homeTeam: {
      id: String(e.homeTeam.id),
      name: e.homeTeam.name,
      logo: `https://api.sofascore.com/api/v1/team/${e.homeTeam.id}/image`,
    },
    awayTeam: {
      id: String(e.awayTeam.id),
      name: e.awayTeam.name,
      logo: `https://api.sofascore.com/api/v1/team/${e.awayTeam.id}/image`,
    },
    homeScore: e.homeScore?.current ?? null,
    awayScore: e.awayScore?.current ?? null,
    status: mapSofascoreStatus(e.status),
    statusDisplay: e.status.description ?? e.status.type,
    minute: e.time?.played ?? null,
    leagueId: String(e.tournament.uniqueTournament?.id ?? e.tournament.id),
    leagueName: e.tournament.uniqueTournament?.name ?? e.tournament.name,
    scheduledAt: new Date(e.startTimestamp * 1000).toISOString(),
    venue: e.venue?.name,
    raw: e,
  };
}

export class SofascoreScraper extends BaseScraper {
  readonly name = "sofascore-football";
  readonly sport = "football";
  readonly baseUrl = BASE;
  protected headers = HEADERS;

  /** All live football events across all leagues */
  async fetchLiveEvents(): Promise<NormalizedEvent[]> {
    const data = await fetchJson<{ events?: SofascoreEvent[] }>(
      `${BASE}/sport/football/events/live`,
      { headers: HEADERS }
    );
    return (data?.events ?? []).map(normalizeEvent);
  }

  /** Scheduled events for a given date (YYYY-MM-DD) */
  async fetchEventsByDate(date: string): Promise<NormalizedEvent[]> {
    const data = await fetchJson<{ events?: SofascoreEvent[] }>(
      `${BASE}/sport/football/scheduled-events/${date}`,
      { headers: HEADERS }
    );
    return (data?.events ?? []).map(normalizeEvent);
  }

  async fetchEventById(id: string): Promise<NormalizedEvent | null> {
    // Strip "sofascore_" prefix if present
    const rawId = id.replace("sofascore_", "");
    const data = await fetchJson<{ event?: SofascoreEvent }>(
      `${BASE}/event/${rawId}`,
      { headers: HEADERS }
    );
    return data?.event ? normalizeEvent(data.event) : null;
  }

  /** Live match statistics (possession, shots, passes etc) */
  async fetchMatchStatistics(sofascoreId: string) {
    return fetchJson(
      `${BASE}/event/${sofascoreId}/statistics`,
      { headers: HEADERS }
    );
  }

  /** Goal, card, substitution timeline */
  async fetchMatchTimeline(sofascoreId: string) {
    const data = await fetchJson<{
      incidents?: {
        id: number;
        incidentType: string;
        incidentClass?: string;
        time?: number;
        player?: { name: string; id: number };
        playerIn?: { name: string };
        playerOut?: { name: string };
        homeScore?: number;
        awayScore?: number;
        isHome?: boolean;
        description?: string;
        addedTime?: number;
      }[];
    }>(
      `${BASE}/event/${sofascoreId}/incidents`,
      { headers: HEADERS }
    );
    return data?.incidents ?? [];
  }

  /** Line-ups / formations */
  async fetchLineups(sofascoreId: string) {
    return fetchJson(
      `${BASE}/event/${sofascoreId}/lineups`,
      { headers: HEADERS }
    );
  }

  /** Head-to-head history */
  async fetchH2H(homeTeamId: string, awayTeamId: string) {
    return fetchJson(
      `${BASE}/team/${homeTeamId}/team/${awayTeamId}/h2h-events`,
      { headers: HEADERS }
    );
  }

  /** League standings */
  async fetchStandings(leagueId: string, season?: string): Promise<NormalizedStanding[]> {
    // Sofascore uses season ID not year strings
    const url = season
      ? `${BASE}/unique-tournament/${leagueId}/season/${season}/standings/total`
      : `${BASE}/unique-tournament/${leagueId}/standings/total`;

    const data = await fetchJson<{
      standings?: {
        rows?: {
          id: number;
          position: number;
          team: { id: number; name: string };
          matches: number;
          wins: number;
          losses: number;
          draws: number;
          scoresFor: number;
          scoresAgainst: number;
          points: number;
          promotionDescription?: string;
        }[];
      }[];
    }>(url, { headers: HEADERS });

    return (data?.standings?.[0]?.rows ?? []).map((r) => ({
      rank: r.position,
      teamId: String(r.team.id),
      teamName: r.team.name,
      teamLogo: `https://api.sofascore.com/api/v1/team/${r.team.id}/image`,
      gamesPlayed: r.matches,
      wins: r.wins,
      losses: r.losses,
      draws: r.draws,
      points: r.points,
      goalsFor: r.scoresFor,
      goalsAgainst: r.scoresAgainst,
      goalDiff: r.scoresFor - r.scoresAgainst,
      note: r.promotionDescription,
    }));
  }

  /** Player search */
  async searchPlayers(query: string): Promise<NormalizedPlayer[]> {
    const data = await fetchJson<{
      players?: {
        player: {
          id: number;
          name: string;
          position?: string;
          nationality?: { name: string };
          team?: { id: number; name: string };
          dateOfBirthTimestamp?: number;
          photo?: string;
        };
      }[];
    }>(`${BASE}/search/players/${encodeURIComponent(query)}`, { headers: HEADERS });

    return (data?.players ?? []).map((p) => ({
      id: String(p.player.id),
      name: p.player.name,
      position: p.player.position,
      nationality: p.player.nationality?.name,
      teamId: String(p.player.team?.id ?? ""),
      teamName: p.player.team?.name,
      photo: `https://api.sofascore.com/api/v1/player/${p.player.id}/image`,
      source: "sofascore",
    }));
  }

  /** Player season statistics */
  async fetchPlayerStats(playerId: string, tournamentId: string, seasonId: string) {
    return fetchJson(
      `${BASE}/player/${playerId}/unique-tournament/${tournamentId}/season/${seasonId}/statistics/overall`,
      { headers: HEADERS }
    );
  }

  /** Known Sofascore unique tournament IDs for major leagues */
  static LEAGUE_IDS = {
    "eng.1": 17,           // Premier League
    "esp.1": 8,            // La Liga
    "ger.1": 35,           // Bundesliga
    "ita.1": 23,           // Serie A
    "fra.1": 34,           // Ligue 1
    "uefa.champions": 7,   // Champions League
    "uefa.europa": 679,    // Europa League
    "usa.1": 242,          // MLS
    "bra.1": 325,          // Brazilian Serie A
    "arg.1": 155,          // Argentine Primera
  } as const;
}
