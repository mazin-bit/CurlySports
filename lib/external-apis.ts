/**
 * External free sports APIs:
 * - OpenF1 (Formula 1): https://api.openf1.org/v1/ — no key required
 * - NBA Stats: https://stats.nba.com/stats/ — no key required (needs specific headers)
 * - CricInfo via ESPN: https://site.api.espn.com/apis/site/v2/sports/cricket
 * - ATP/WTA via ESPN: https://site.api.espn.com/apis/site/v2/sports/tennis
 */

// ─── OpenF1 API ────────────────────────────────────────────────────────────

export interface F1Session {
  session_key: number;
  session_name: string;
  date_start: string;
  date_end: string;
  meeting_key: number;
  meeting_name: string;
  location: string;
  country_name: string;
  circuit_key: number;
  circuit_short_name: string;
  session_type: string;
  gmt_offset: string;
  year: number;
}

export interface F1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url?: string;
  country_code: string;
  session_key: number;
}

export interface F1Position {
  driver_number: number;
  date: string;
  position: number;
  session_key: number;
}

export interface F1Interval {
  driver_number: number;
  date: string;
  gap_to_leader?: string;
  interval?: string;
  session_key: number;
}

export interface F1LapData {
  driver_number: number;
  lap_number: number;
  lap_duration?: number;
  is_pit_out_lap: boolean;
  duration_sector_1?: number;
  duration_sector_2?: number;
  duration_sector_3?: number;
  i1_speed?: number;
  i2_speed?: number;
  st_speed?: number;
  segments_sector_1?: number[];
  segments_sector_2?: number[];
  segments_sector_3?: number[];
  session_key: number;
}

const OPENF1 = "https://api.openf1.org/v1";

export async function fetchF1Sessions(year?: number): Promise<F1Session[]> {
  try {
    const y = year ?? new Date().getFullYear();
    const res = await fetch(`${OPENF1}/sessions?year=${y}`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchF1LatestSession(): Promise<F1Session | null> {
  try {
    const res = await fetch(`${OPENF1}/sessions?session_key=latest`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] ?? null : data ?? null;
  } catch {
    return null;
  }
}

export async function fetchF1Drivers(sessionKey: number | "latest"): Promise<F1Driver[]> {
  try {
    const res = await fetch(`${OPENF1}/drivers?session_key=${sessionKey}`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchF1Positions(sessionKey: number | "latest"): Promise<F1Position[]> {
  try {
    const res = await fetch(`${OPENF1}/position?session_key=${sessionKey}`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchF1Intervals(sessionKey: number | "latest"): Promise<F1Interval[]> {
  try {
    const res = await fetch(`${OPENF1}/intervals?session_key=${sessionKey}`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/** Get latest lap data for a session — trimmed to last lap per driver */
export async function fetchF1LatestLaps(sessionKey: number | "latest"): Promise<Record<number, F1LapData>> {
  try {
    const res = await fetch(`${OPENF1}/laps?session_key=${sessionKey}`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return {};
    const laps: F1LapData[] = await res.json();
    // Keep only the latest lap per driver
    const latest: Record<number, F1LapData> = {};
    for (const lap of laps) {
      const existing = latest[lap.driver_number];
      if (!existing || lap.lap_number > existing.lap_number) {
        latest[lap.driver_number] = lap;
      }
    }
    return latest;
  } catch {
    return {};
  }
}

// ─── NBA Stats API ─────────────────────────────────────────────────────────

export interface NbaScoreboard {
  gameId: string;
  gameStatus: number; // 1=pre, 2=live, 3=final
  gameStatusText: string;
  period: number;
  gameClock: string;
  homeTeam: NbaTeamScore;
  awayTeam: NbaTeamScore;
}

export interface NbaTeamScore {
  teamId: number;
  teamName: string;
  teamTricode: string;
  score: number;
  losses: number;
  wins: number;
  inBonus: string;
  timeoutsRemaining: number;
  periods: { period: number; score: number }[];
}

const NBA_STATS = "https://stats.nba.com/stats";
const NBA_CDN = "https://cdn.nba.com";

// NBA Stats API needs these headers to bypass bot detection
const NBA_HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.5",
  "Origin": "https://www.nba.com",
  "Referer": "https://www.nba.com/",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "x-nba-stats-origin": "stats",
  "x-nba-stats-token": "true",
};

export async function fetchNbaScoreboard(): Promise<NbaScoreboard[]> {
  try {
    // Use the CDN live scoreboard — faster and no auth needed
    const res = await fetch(`${NBA_CDN}/static/json/liveData/scoreboard/todaysScoreboard_00.json`, {
      headers: { "Accept": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.scoreboard?.games ?? [];
  } catch {
    return [];
  }
}

export async function fetchNbaBoxscore(gameId: string) {
  try {
    const res = await fetch(`${NBA_CDN}/static/json/liveData/boxscore/boxscore_${gameId}.json`, {
      headers: { "Accept": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchNbaPlaybyPlay(gameId: string) {
  try {
    const res = await fetch(`${NBA_CDN}/static/json/liveData/playbyplay/playbyplay_${gameId}.json`, {
      headers: { "Accept": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.game?.actions ?? [];
  } catch {
    return [];
  }
}

export interface NbaPlayerStats {
  playerId: number;
  playerName: string;
  teamId: number;
  teamAbbreviation: string;
  pts: number;
  ast: number;
  reb: number;
  stl: number;
  blk: number;
  tov: number;
  min: string;
  fgPct: number;
  fg3Pct: number;
  ftPct: number;
  gamesPlayed: number;
}

export async function fetchNbaPlayerStatsSeason(season = "2024-25"): Promise<NbaPlayerStats[]> {
  try {
    const params = new URLSearchParams({
      MeasureType: "Base",
      PerMode: "PerGame",
      PlusMinus: "N",
      PaceAdjust: "N",
      Rank: "N",
      Season: season,
      SeasonType: "Regular Season",
      Outcome: "",
      Location: "",
      Month: "0",
      SeasonSegment: "",
      DateFrom: "",
      DateTo: "",
      OpponentTeamID: "0",
      VsConference: "",
      VsDivision: "",
      GameSegment: "",
      Period: "0",
      LastNGames: "0",
      GameScope: "",
      PlayerExperience: "",
      PlayerPosition: "",
      StarterBench: "",
    });
    const res = await fetch(`${NBA_STATS}/leaguedashplayerstats?${params}`, {
      headers: NBA_HEADERS,
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const headers: string[] = data.resultSets?.[0]?.headers ?? [];
    const rows: (string | number)[][] = data.resultSets?.[0]?.rowSet ?? [];

    const idx = (name: string) => headers.indexOf(name);

    return rows.slice(0, 200).map((row) => ({
      playerId: row[idx("PLAYER_ID")] as number,
      playerName: row[idx("PLAYER_NAME")] as string,
      teamId: row[idx("TEAM_ID")] as number,
      teamAbbreviation: row[idx("TEAM_ABBREVIATION")] as string,
      pts: row[idx("PTS")] as number,
      ast: row[idx("AST")] as number,
      reb: row[idx("REB")] as number,
      stl: row[idx("STL")] as number,
      blk: row[idx("BLK")] as number,
      tov: row[idx("TOV")] as number,
      min: row[idx("MIN")] as string,
      fgPct: row[idx("FG_PCT")] as number,
      fg3Pct: row[idx("FG3_PCT")] as number,
      ftPct: row[idx("FT_PCT")] as number,
      gamesPlayed: row[idx("GP")] as number,
    }));
  } catch {
    return [];
  }
}

// ─── Cricket via ESPN ──────────────────────────────────────────────────────

export const CRICKET_LEAGUES = [
  { id: "icc.worldcup", name: "ICC Cricket World Cup", short: "CWC" },
  { id: "eng.domestic", name: "County Championship", short: "CC" },
  { id: "ipl", name: "IPL", short: "IPL" },
  { id: "big.bash", name: "Big Bash League", short: "BBL" },
  { id: "cplt20", name: "Caribbean Premier League", short: "CPL" },
];

export async function fetchCricketMatches(leagueId = "icc.worldcup") {
  try {
    const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
    const res = await fetch(`${ESPN_BASE}/cricket/${leagueId}/scoreboard`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

// ─── OpenF1 live race stream helper ───────────────────────────────────────

/** Builds a unified live race leaderboard combining positions + intervals */
export async function fetchF1RaceLive() {
  const [session, positions, intervals] = await Promise.all([
    fetchF1LatestSession(),
    fetchF1Positions("latest"),
    fetchF1Intervals("latest"),
  ]);
  if (!session) return null;

  const drivers = await fetchF1Drivers(session.session_key);

  // Build position map (latest position per driver)
  const posMap: Record<number, number> = {};
  for (const pos of positions) {
    if (!posMap[pos.driver_number] || new Date(pos.date) > new Date()) {
      posMap[pos.driver_number] = pos.position;
    }
  }

  // Build interval map (latest per driver)
  const intMap: Record<number, F1Interval> = {};
  for (const intv of intervals) {
    intMap[intv.driver_number] = intv;
  }

  const leaderboard = drivers
    .map((d) => ({
      driverNumber: d.driver_number,
      name: d.full_name,
      nameShort: d.name_acronym,
      team: d.team_name,
      teamColor: `#${d.team_colour}`,
      headshot: d.headshot_url,
      country: d.country_code,
      position: posMap[d.driver_number] ?? 99,
      gap: intMap[d.driver_number]?.gap_to_leader ?? "+?",
      interval: intMap[d.driver_number]?.interval ?? "+?",
    }))
    .sort((a, b) => a.position - b.position);

  return {
    session: {
      name: session.session_name,
      type: session.session_type,
      circuit: session.circuit_short_name,
      location: session.location,
      country: session.country_name,
      startTime: session.date_start,
    },
    leaderboard,
  };
}
