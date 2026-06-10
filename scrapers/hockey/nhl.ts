/**
 * NHL Official API Scraper
 *
 * NHL launched a new official public API in 2023:
 * https://api-web.nhle.com/v1/ — no auth, completely free
 *
 * This replaced the older statsapi.web.nhl.com API.
 * Provides: live scores, play-by-play, rosters, standings, stats.
 *
 * WebSocket: NHL uses server-sent events for live play-by-play.
 * We poll the boxscore endpoint every 8s during live games.
 */

import { fetchJson } from "@/scrapers/base";
import type { NormalizedEvent, NormalizedStanding } from "@/scrapers/base";

const BASE = "https://api-web.nhle.com/v1";

interface NhlGame {
  id: number;
  season: number;
  gameType: number;
  gameDate: string;
  startTimeUTC: string;
  venueLocation?: { default: string };
  gameState: "OFF" | "PRE" | "FUT" | "LIVE" | "CRIT" | "FINAL" | "OVER";
  gameScheduleState: string;
  awayTeam: {
    id: number;
    abbrev: string;
    score?: number;
    sog?: number;
    logo: string;
    commonName?: { default: string };
  };
  homeTeam: {
    id: number;
    abbrev: string;
    score?: number;
    sog?: number;
    logo: string;
    commonName?: { default: string };
  };
  period?: number;
  clock?: { timeRemaining?: string; inIntermission?: boolean };
  teamLeaders?: unknown[];
  threeMinRecap?: string;
}

function normalizeNhlGame(g: NhlGame): NormalizedEvent {
  const isLive = g.gameState === "LIVE" || g.gameState === "CRIT";
  const isFinished = g.gameState === "FINAL" || g.gameState === "OVER";

  let status: NormalizedEvent["status"] = "SCHEDULED";
  if (isLive) status = "LIVE";
  else if (isFinished) status = "FINISHED";

  const periodDisplay = g.period
    ? g.period <= 3
      ? `P${g.period}`
      : g.period === 4
      ? "OT"
      : "SO"
    : "";
  const timeRemaining = g.clock?.timeRemaining ?? "";
  const statusDisplay = isLive
    ? `${periodDisplay} ${timeRemaining}`.trim()
    : isFinished
    ? `Final${g.period && g.period > 3 ? `/${periodDisplay}` : ""}`
    : new Date(g.startTimeUTC).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return {
    id: `nhl_${g.id}`,
    sport: "hockey",
    source: "nhl",
    homeTeam: {
      id: String(g.homeTeam.id),
      name: g.homeTeam.commonName?.default ?? g.homeTeam.abbrev,
      logo: g.homeTeam.logo,
    },
    awayTeam: {
      id: String(g.awayTeam.id),
      name: g.awayTeam.commonName?.default ?? g.awayTeam.abbrev,
      logo: g.awayTeam.logo,
    },
    homeScore: g.homeTeam.score ?? null,
    awayScore: g.awayTeam.score ?? null,
    status,
    statusDisplay,
    minute: g.period ?? null,
    leagueId: "nhl",
    leagueName: "NHL",
    scheduledAt: g.startTimeUTC,
    venue: g.venueLocation?.default,
    raw: g,
  };
}

export class NhlScraper {
  /** Today's schedule */
  async fetchScheduleToday(): Promise<NormalizedEvent[]> {
    const today = new Date().toISOString().split("T")[0];
    return this.fetchScheduleByDate(today);
  }

  /** Schedule for a specific date (YYYY-MM-DD) */
  async fetchScheduleByDate(date: string): Promise<NormalizedEvent[]> {
    const data = await fetchJson<{ gameWeek?: { date: string; games?: NhlGame[] }[] }>(
      `${BASE}/schedule/${date}`
    );
    const day = data?.gameWeek?.find((w) => w.date === date);
    return (day?.games ?? []).map(normalizeNhlGame);
  }

  /** Live boxscore — goals, penalties, shots on goal, period by period */
  async fetchBoxscore(nhlGameId: string) {
    const id = nhlGameId.replace("nhl_", "");
    return fetchJson<{
      id: number;
      gameState: string;
      clock?: { timeRemaining?: string; inIntermission?: boolean };
      periodDescriptor?: { number?: number; periodType?: string };
      homeTeam: { score?: number; sog?: number; name?: { default?: string }; logo?: string };
      awayTeam: { score?: number; sog?: number; name?: { default?: string }; logo?: string };
      goals?: {
        period?: number;
        timeInPeriod?: string;
        teamAbbrev?: { default?: string };
        goalScorer?: { playerId?: number; name?: { default?: string }; goalsToDate?: number };
        assists?: { playerId?: number; name?: { default?: string } }[];
        strength?: string;
        shotType?: string;
        highlightClipSharingUrl?: string;
      }[];
      penalties?: {
        period?: number;
        timeInPeriod?: string;
        team?: { default?: string };
        committedByPlayer?: string;
        descKey?: string;
        duration?: number;
      }[];
    }>(`${BASE}/gamecenter/${id}/boxscore`);
  }

  /** Full play-by-play — every event including shots, faceoffs, hits */
  async fetchPlayByPlay(nhlGameId: string) {
    const id = nhlGameId.replace("nhl_", "");
    return fetchJson<{
      plays?: {
        eventId: number;
        periodDescriptor?: { number?: number };
        timeInPeriod?: string;
        typeDescKey?: string;
        details?: Record<string, unknown>;
        situationCode?: string;
        homeTeamDefendingSide?: string;
      }[];
    }>(`${BASE}/gamecenter/${id}/play-by-play`);
  }

  /** League standings */
  async fetchStandings(): Promise<NormalizedStanding[]> {
    const data = await fetchJson<{
      standings?: {
        teamName: { default: string };
        teamAbbrev: { default: string };
        teamLogo?: string;
        teamId?: number;
        wildcardSequence?: number;
        conferenceSequence?: number;
        divisionSequence?: number;
        leagueSequence?: number;
        gamesPlayed?: number;
        wins?: number;
        losses?: number;
        otLosses?: number;
        points?: number;
        goalFor?: number;
        goalAgainst?: number;
        pointPctg?: number;
        l10Wins?: number;
        l10Losses?: number;
        streakCode?: string;
        streakCount?: number;
      }[];
    }>(`${BASE}/standings/now`);

    return (data?.standings ?? []).map((t, idx) => ({
      rank: (t.leagueSequence ?? idx + 1),
      teamId: String(t.teamId ?? idx),
      teamName: t.teamName?.default ?? t.teamAbbrev?.default ?? "",
      teamLogo: t.teamLogo,
      gamesPlayed: t.gamesPlayed ?? 0,
      wins: t.wins ?? 0,
      losses: (t.losses ?? 0) + (t.otLosses ?? 0),
      draws: t.otLosses ?? 0, // OT losses tracked as draws here
      points: t.points ?? 0,
      goalsFor: t.goalFor ?? 0,
      goalsAgainst: t.goalAgainst ?? 0,
      goalDiff: (t.goalFor ?? 0) - (t.goalAgainst ?? 0),
      form: `${t.l10Wins ?? 0}W-${t.l10Losses ?? 0}L`,
    }));
  }

  /** Team roster with player stats */
  async fetchTeamRoster(teamAbbrev: string, season = "20242025") {
    return fetchJson(`${BASE}/roster/${teamAbbrev}/${season}`);
  }

  /** Player stats landing page */
  async fetchPlayerStats(playerId: number) {
    return fetchJson(`${BASE}/player/${playerId}/landing`);
  }
}
