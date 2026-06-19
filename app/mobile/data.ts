// Mobile app type definitions.
// All screen data comes from the real backend — these types are shared across components.

export interface TeamRef {
  code: string;
  abbr: string;
  name: string;
  score: number | null;
  logoUrl?: string | null;
}

export interface Match {
  id: string | number;
  home: TeamRef;
  away: TeamRef;
  league: string;
  leagueId?: string;
  sport?: string;
  status: 'live' | 'ft' | 'up';
  clock: string;
  scheduledAt?: string | null;
  focus?: boolean;
}

export interface MatchDetail {
  home: TeamRef;
  away: TeamRef;
  league: string;
  clock: string;
  half: string;
  venue: string;
  stats: [string, string, number][];
  momentum: number[];
  momentumB: number[];
  timeline: {
    min: string;
    type: 'goal' | 'yellow' | 'sub' | 'chance' | 'half';
    side: 'home' | 'away' | null;
    title: string;
    sub: string;
    score?: string;
  }[];
  lineups: {
    home: { formation: string; players: [string, string][] };
    away: { formation: string; players: [string, string][] };
  };
}

export interface Player {
  name: string; first: string; last: string; num: number; pos: string;
  team: string; teamCode: string; country: string; age: number; height: string;
  season: string;
  headline: [string, string][];
  radar: [string, number][];
  form: number[];
  note: string;
}

export interface NewsItem {
  id: number; tag: string; tone?: string; title: string; meta: string; src: string; icon: string; color: string;
}

export interface Notification {
  id: number; group: 'today' | 'earlier'; icon: string; color: string;
  title: string; body: string; time: string; unread: boolean;
}

// Static mascot asset path (not data)
export const MASCOT_SRC = '/curly-mark.png';

// DATA is kept as a minimal object for components that still reference DATA.mascot
// while being migrated. Components should use MASCOT_SRC or '/curly-mark.png' directly.
export const DATA = {
  mascot: '/curly-mark.png',
} as const;
