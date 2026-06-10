// ─── Shared TypeScript interfaces for Curly Sports ────────────────────────────

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

export interface NormalizedMatch {
  id: string; // ESPN event ID
  homeTeam: { id: string; name: string; shortName: string; logoUrl?: string };
  awayTeam: { id: string; name: string; shortName: string; logoUrl?: string };
  league: { id: string; name: string; shortName: string };
  homeScore: number | null;
  awayScore: number | null;
  status: "SCHEDULED" | "LIVE" | "HALF_TIME" | "FINISHED" | "POSTPONED" | "CANCELLED";
  statusDisplay: string; // e.g. "45'" or "HT" or "FT"
  minute: number | null;
  sport: SportSlug;
  scheduledAt: string; // ISO string
  venue?: string;
}

export interface LeagueGroup {
  leagueId: string;
  leagueName: string;
  leagueShortName: string;
  sport: SportSlug;
  matches: NormalizedMatch[];
}

export interface NormalizedNews {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  source: string;
  publishedAt: string; // ISO string
  sport: SportSlug | null;
  url?: string;
}

// ─── Raw ESPN shapes ────────────────────────────────────────────────────────

export interface EspnTeam {
  id: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  logo?: string;
  logos?: { href: string }[];
}

export interface EspnCompetitor {
  id: string;
  homeAway: "home" | "away";
  team: EspnTeam;
  score?: string;
}

export interface EspnCompetition {
  id: string;
  competitors: EspnCompetitor[];
  venue?: { fullName?: string };
}

export interface EspnStatus {
  type: {
    name: string; // e.g. "STATUS_IN_PROGRESS", "STATUS_FINAL", "STATUS_HALFTIME"
    completed: boolean;
    shortDetail: string; // e.g. "45'" or "Final"
    description: string;
  };
  displayClock?: string;
  period?: number;
}

export interface EspnLeague {
  id: string;
  name: string;
  abbreviation: string;
  slug?: string;
}

export interface EspnEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  competitions: EspnCompetition[];
  status: EspnStatus;
  season?: { type?: number };
  league?: EspnLeague;
}

export interface EspnScoreboardResponse {
  events?: EspnEvent[];
  leagues?: EspnLeague[];
}

export interface EspnNewsArticle {
  id?: string | number;
  headline: string;
  description?: string;
  published?: string;
  images?: { url: string; type?: string }[];
  links?: { web?: { href?: string } };
}

export interface EspnNewsResponse {
  articles?: EspnNewsArticle[];
}
