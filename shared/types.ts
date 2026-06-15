// ─────────────────────────────────────────────────────────────────────────────
// @curly/shared — Canonical types
// Both the Next.js web app and Expo mobile app import from here.
// When you change a type, it updates everywhere automatically.
// ─────────────────────────────────────────────────────────────────────────────

export type SportSlug =
  | "football"
  | "basketball"
  | "nfl"
  | "cricket"
  | "tennis"
  | "f1"
  | "mma"
  | "baseball"
  | "golf"
  | "hockey";

// ─── Match ───────────────────────────────────────────────────────────────────

export interface NormalizedMatch {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    logoUrl?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    logoUrl?: string;
  };
  league: {
    id: string;
    name: string;
    shortName: string;
  };
  homeScore: number | null;
  awayScore: number | null;
  status: "SCHEDULED" | "LIVE" | "HALF_TIME" | "FINISHED" | "POSTPONED" | "CANCELLED";
  statusDisplay: string;
  minute: number | null;
  sport: SportSlug;
  scheduledAt: string;
  venue?: string;
}

// ─── News ─────────────────────────────────────────────────────────────────────

export interface NormalizedNews {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  source: string;
  publishedAt: string;
  sport: SportSlug | null;
  url?: string;
}

// ─── Standings ────────────────────────────────────────────────────────────────

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
  netRunRate?: number;
  note?: string;
}

export interface GroupStandings {
  groupId: string;
  groupName: string;
  entries: StandingEntry[];
}

export interface LeagueStandings {
  leagueId: string;
  leagueName: string;
  leagueLogo?: string;
  season: string;
  entries: StandingEntry[];
  groups?: GroupStandings[];
  hasGroups: boolean;
}

// ─── Players ──────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  jersey: string;
  position: string;
  headshot: string | null;
  age: number | null;
  teamName: string;
  teamLogo: string | null;
  teamId: string;
  leagueId: string;
  nationality: string | null;
}
