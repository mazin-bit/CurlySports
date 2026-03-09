export type SportKey = 'soccer' | 'basketball' | 'football' | 'baseball' | 'hockey' | 'cricket' | 'f1';

export interface LeagueConfig {
  label?: string;
  [key: string]: string | undefined;
}

export interface SportConfig {
  label: string;
  icon: string;
  espnPath: string;
  leagues: Record<string, string>;
  leagueNames: Record<string, string>;
  leagueLogos: Record<string, string>;
  leagueShortNames?: Record<string, string>;
  standingsLeagueIds?: Record<string, string>;
}

export interface Match {
  id: string;
  leagueCode: string;
  league: string;
  home: string;
  away: string;
  homeScore: string;
  awayScore: string;
  time: string;
  rawDate: string | null;
  isLive: boolean;
  isCompleted: boolean;
  status: string;
  statusDetail: string;
  homeLogo: string;
  awayLogo: string;
  winner?: 'home' | 'away' | null;
  round?: string;
}

export interface StandingsRow {
  pos: string;
  team: string;
  logo: string;
  values: Record<string, string>;
}

export interface StandingsTable {
  columns: string[];
  rows: StandingsRow[];
  conferences?: { name: string; columns: string[]; rows: StandingsRow[] }[];
  seasonYear?: number | null;
}

export interface Player {
  id: number;
  name: string;
  club: string;
  position: string;
  rating?: number;
  goals?: number;
  assists?: number;
  image: string;
  age?: number;
  height?: string;
  weight?: string;
  trophies?: string[];
  career?: string[];
  achievements?: string[];
  primaryStatLabel?: string;
  secondaryStatLabel?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  published?: string;
}
