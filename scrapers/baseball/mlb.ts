/**
 * MLB Stats API Scraper (OFFICIAL FREE API)
 *
 * MLB provides a public, undocumented but stable REST API:
 * https://statsapi.mlb.com/api/v1/
 *
 * All data is free, no API key required.
 * Covers: live scores, play-by-play, Statcast data, standings, rosters.
 *
 * For Statcast (exit velocity, launch angle, spin rate):
 * https://baseballsavant.mlb.com/statcast_search — scrape CSV exports
 *
 * Live feed: MLB uses a long-polling gameFeed endpoint that updates ~every 5s.
 */

import { fetchJson } from "@/scrapers/base";
import type { NormalizedEvent, NormalizedStanding } from "@/scrapers/base";

const BASE = "https://statsapi.mlb.com/api/v1";

interface MlbGame {
  gamePk: number;
  gameDate: string;
  officialDate: string;
  status: {
    abstractGameState: "Preview" | "Live" | "Final";
    detailedState: string;
    statusCode: string;
    startTimeTBD?: boolean;
  };
  teams: {
    home: {
      score?: number;
      isWinner?: boolean;
      team: { id: number; name: string };
      leagueRecord: { wins: number; losses: number };
    };
    away: {
      score?: number;
      isWinner?: boolean;
      team: { id: number; name: string };
      leagueRecord: { wins: number; losses: number };
    };
  };
  venue: { id?: number; name?: string };
  content?: { link?: string };
  linescore?: {
    currentInning?: number;
    currentInningOrdinal?: string;
    inningState?: string; // Top/Middle/Bottom/End
    balls?: number;
    strikes?: number;
    outs?: number;
    innings?: { num: number; home: { runs?: number; hits?: number; errors?: number }; away: { runs?: number; hits?: number; errors?: number } }[];
  };
}

function normalizeMlbGame(g: MlbGame): NormalizedEvent {
  const state = g.status.abstractGameState;
  const isLive = state === "Live";
  const isFinished = state === "Final";

  let status: NormalizedEvent["status"] = "SCHEDULED";
  if (isLive) status = "LIVE";
  else if (isFinished) status = "FINISHED";

  const inning = g.linescore?.currentInningOrdinal ?? "";
  const inningState = g.linescore?.inningState ?? "";
  const outs = g.linescore?.outs;
  const statusDisplay = isLive
    ? `${inningState} ${inning}${outs != null ? ` · ${outs} out` : ""}`.trim()
    : isFinished
    ? "Final"
    : new Date(g.gameDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return {
    id: `mlb_${g.gamePk}`,
    sport: "baseball",
    source: "mlb",
    homeTeam: {
      id: String(g.teams.home.team.id),
      name: g.teams.home.team.name,
      logo: `https://www.mlbstatic.com/team-logos/${g.teams.home.team.id}.svg`,
    },
    awayTeam: {
      id: String(g.teams.away.team.id),
      name: g.teams.away.team.name,
      logo: `https://www.mlbstatic.com/team-logos/${g.teams.away.team.id}.svg`,
    },
    homeScore: g.teams.home.score ?? null,
    awayScore: g.teams.away.score ?? null,
    status,
    statusDisplay,
    minute: g.linescore?.currentInning ?? null,
    leagueId: "mlb",
    leagueName: "MLB",
    scheduledAt: g.gameDate,
    venue: g.venue?.name,
    raw: g,
  };
}

export class MlbScraper {
  /** Today's schedule */
  async fetchTodaySchedule(): Promise<NormalizedEvent[]> {
    const today = new Date().toISOString().split("T")[0];
    return this.fetchScheduleByDate(today);
  }

  /** Schedule for a date */
  async fetchScheduleByDate(date: string): Promise<NormalizedEvent[]> {
    const data = await fetchJson<{
      dates?: { games?: MlbGame[] }[];
    }>(`${BASE}/schedule?sportId=1&date=${date}&hydrate=linescore,decisions,probablePitcher`);
    return (data?.dates?.[0]?.games ?? []).map(normalizeMlbGame);
  }

  /** Live game feed — pitches, hits, runs in real time */
  async fetchLiveFeed(gamePk: string) {
    const id = gamePk.replace("mlb_", "");
    return fetchJson<{
      gameData?: {
        game?: { pk?: number };
        status?: { abstractGameState?: string; detailedState?: string };
        teams?: unknown;
        players?: Record<string, {
          id: number;
          fullName: string;
          primaryPosition?: { abbreviation?: string };
          stats?: unknown;
        }>;
        venue?: { name?: string };
        weather?: { condition?: string; temp?: string; wind?: string };
      };
      liveData?: {
        plays?: {
          currentPlay?: {
            result?: { description?: string; event?: string; rbi?: number; awayScore?: number; homeScore?: number };
            about?: { inning?: number; halfInning?: string; outs?: number; balls?: number; strikes?: number };
            matchup?: {
              batter?: { fullName?: string; id?: number };
              pitcher?: { fullName?: string; id?: number };
              batSide?: { code?: string };
              pitchHand?: { code?: string };
              postOnFirst?: { fullName?: string };
              postOnSecond?: { fullName?: string };
              postOnThird?: { fullName?: string };
            };
            pitchIndex?: number[];
            pitchData?: unknown;
          };
          allPlays?: unknown[];
        };
        linescore?: MlbGame["linescore"];
        boxscore?: unknown;
        decisions?: {
          winner?: { id?: number; fullName?: string };
          loser?: { id?: number; fullName?: string };
          save?: { id?: number; fullName?: string };
        };
      };
    }>(`${BASE}.1/game/${id}/feed/live`);
  }

  /** League standings */
  async fetchStandings(leagueId = 103): Promise<NormalizedStanding[]> { // 103=AL, 104=NL
    const data = await fetchJson<{
      records?: {
        divisionRank?: string;
        leagueRank?: string;
        wildCardRank?: string;
        teamRecords?: {
          team: { id: number; name: string };
          wins: number;
          losses: number;
          pct: string;
          gamesBack: string;
          runsScored: number;
          runsAllowed: number;
          runDifferential: number;
          streak?: { streakCode?: string };
          records?: { splitRecords?: { type: string; wins: number; losses: number }[] };
        }[];
      }[];
    }>(`${BASE}/standings?leagueId=${leagueId}&season=${new Date().getFullYear()}&standingsTypes=regularSeason`);

    return (data?.records ?? []).flatMap((div, divIdx) =>
      (div.teamRecords ?? []).map((t, idx) => ({
        rank: parseInt(div.leagueRank ?? String(divIdx * 5 + idx + 1)),
        teamId: String(t.team.id),
        teamName: t.team.name,
        teamLogo: `https://www.mlbstatic.com/team-logos/${t.team.id}.svg`,
        gamesPlayed: t.wins + t.losses,
        wins: t.wins,
        losses: t.losses,
        draws: 0,
        points: t.wins,
        goalsFor: t.runsScored,
        goalsAgainst: t.runsAllowed,
        goalDiff: t.runDifferential,
        form: t.streak?.streakCode,
      }))
    );
  }

  /** Player stats — batting or pitching */
  async fetchPlayerStats(playerId: number, group: "hitting" | "pitching" | "fielding" = "hitting") {
    return fetchJson(
      `${BASE}/people/${playerId}/stats?stats=season&group=${group}&season=${new Date().getFullYear()}`
    );
  }

  /** Statcast data via Baseball Savant CSV export */
  async fetchStatcastData(playerId: number, year: number) {
    // Baseball Savant allows CSV download — parse into usable format
    const url = `https://baseballsavant.mlb.com/statcast_search/csv?type=batter&player_type=batter&mlb_id=${playerId}&year=${year}&min_pitches=0&position=&team=&pitch_type=&outcome=&x0=&z0=&hfGT=R%7C&sort_col=pitches&player_event_sort=api_p_release_speed&sort_order=desc&limit=100`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!res.ok) return null;
      const csv = await res.text();
      // Parse CSV
      const lines = csv.trim().split("\n");
      const headers = lines[0].split(",");
      return lines.slice(1).map((line) => {
        const vals = line.split(",");
        return Object.fromEntries(headers.map((h, i) => [h, vals[i]]));
      });
    } catch {
      return null;
    }
  }
}
