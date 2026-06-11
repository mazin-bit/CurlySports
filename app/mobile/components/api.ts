'use client';
import useSWR from 'swr';
import type { NormalizedMatch } from '@/lib/types';
import type { Match } from '../data';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ─── NormalizedMatch → mobile Match ────────────────────────────────────────
export function normalizedToMobile(nm: NormalizedMatch): Match {
  const statusMap: Record<string, Match['status']> = {
    LIVE: 'live', HALF_TIME: 'live', FINISHED: 'ft',
    SCHEDULED: 'up', POSTPONED: 'up', CANCELLED: 'up',
  };
  return {
    id: nm.id,
    home: {
      code: nm.homeTeam.shortName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4),
      abbr: nm.homeTeam.shortName.toUpperCase().slice(0, 3),
      name: nm.homeTeam.name,
      score: nm.homeScore ?? 0,
      logoUrl: nm.homeTeam.logoUrl ?? null,
    },
    away: {
      code: nm.awayTeam.shortName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4),
      abbr: nm.awayTeam.shortName.toUpperCase().slice(0, 3),
      name: nm.awayTeam.name,
      score: nm.awayScore ?? 0,
      logoUrl: nm.awayTeam.logoUrl ?? null,
    },
    status: statusMap[nm.status] ?? 'up',
    clock: nm.statusDisplay,
    league: nm.league.shortName,
    leagueId: nm.league.id,
    sport: nm.sport,
    focus: false,
  };
}

// ─── Match Detail ────────────────────────────────────────────────────────────
export interface RealMatchDetail {
  id: string;
  leagueName: string;
  leagueShortName: string;
  homeTeam: { id: string; name: string; shortName: string; logoUrl: string | null; color: string | null };
  awayTeam: { id: string; name: string; shortName: string; logoUrl: string | null; color: string | null };
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  statusDisplay: string;
  minute: string | null;
  scheduledAt: string;
  venue: string | null;
  events: {
    id: string; clock: string; type: string; text: string;
    teamSide: 'home' | 'away' | null; teamName: string | null;
    teamLogo: string | null; isPrimary: boolean;
  }[];
  homeStats: Record<string, string>;
  awayStats: Record<string, string>;
  homeLineup: { formation: string; starters: { id: string; name: string; jersey: string; position: string }[]; subs: { id: string; name: string; jersey: string; position: string }[] };
  awayLineup: { formation: string; starters: { id: string; name: string; jersey: string; position: string }[]; subs: { id: string; name: string; jersey: string; position: string }[] };
}

export function useMatchDetail(matchId?: string | number | null, leagueId?: string | null) {
  const id = matchId ? String(matchId) : null;
  const league = leagueId ?? 'eng.1';
  const url = id ? `/api/espn/match?id=${encodeURIComponent(id)}&league=${encodeURIComponent(league)}` : null;
  const { data, isLoading, error } = useSWR<RealMatchDetail>(url, fetcher, { refreshInterval: 15_000 });
  return { detail: data ?? null, isLoading, error };
}

// ─── Player Detail ───────────────────────────────────────────────────────────
export interface RealPlayerDetail {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  jersey: string;
  position: string;
  positionAbbr: string;
  headshot: string | null;
  flagUrl: string | null;
  nationality: string;
  age: number | null;
  height: string;
  weight: string;
  teamId: string;
  teamName: string;
  teamLogo: string | null;
  teamColor: string | null;
  leagueId: string;
  leagueName: string;
  sport: string;
  stats: { name: string; displayName: string; shortName: string; value: number; displayValue: string }[];
  statsSeason: string;
}

export function usePlayerDetail(playerId?: string | null, leagueId?: string | null) {
  const id = playerId ?? null;
  const league = leagueId ?? 'eng.1';
  const url = id ? `/api/espn/player?id=${encodeURIComponent(id)}&league=${encodeURIComponent(league)}` : null;
  const { data, isLoading, error } = useSWR<RealPlayerDetail>(url, fetcher, { refreshInterval: 300_000 });
  return { player: data ?? null, isLoading, error };
}

// ─── Debates ─────────────────────────────────────────────────────────────────
export interface RealDebate {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  sport: string | null;
  isLive: boolean;
  votesA: number;
  votesB: number;
  expiresAt: string | null;
  createdAt: string;
  _count: { votes: number };
}

export function useDebatesList() {
  const { data, isLoading, error, mutate } = useSWR<RealDebate[]>('/api/debates', fetcher, { refreshInterval: 60_000 });
  return { debates: data ?? [], isLoading, error, mutate };
}

// ─── Teams search ─────────────────────────────────────────────────────────────
export interface RealTeam {
  id: string;
  name: string;
  shortName: string;
  abbr: string;
  logo: string | null;
  color: string | null;
  leagueId: string;
  leagueName: string;
  sport: string;
}

export function useTeamsList(sport = 'football', leagueId?: string) {
  const params = new URLSearchParams({ sport });
  if (leagueId) params.set('league', leagueId);
  const { data, isLoading } = useSWR<{ teams: RealTeam[] }>(`/api/espn/teams?${params}`, fetcher, { revalidateOnFocus: false });
  return { teams: data?.teams ?? [], isLoading };
}

// ─── Stat helpers ────────────────────────────────────────────────────────────
// Map ESPN stat key → display label
const STAT_LABELS: Record<string, string> = {
  possessionPct: 'Possession', totalShots: 'Shots',
  shotsOnTarget: 'Shots on target', wonCorners: 'Corners',
  accuratePasses: 'Pass accuracy', foulsCommitted: 'Fouls',
  yellowCards: 'Yellow cards', redCards: 'Red cards',
  saves: 'Saves', offsides: 'Offsides',
};

export function mapStatsToRows(homeStats: Record<string, string>, awayStats: Record<string, string>): [string, string, number][] {
  const rows: [string, string, number][] = [];
  const keys = ['possessionPct', 'totalShots', 'shotsOnTarget', 'wonCorners', 'accuratePasses'];
  for (const key of keys) {
    const hv = parseFloat(homeStats[key] ?? '0') || 0;
    const av = parseFloat(awayStats[key] ?? '0') || 0;
    const total = hv + av || 1;
    const pct = Math.round((hv / total) * 100);
    const label = STAT_LABELS[key] ?? key;
    const displayVal = key === 'possessionPct' ? `${homeStats[key] ?? '0'}%` : (homeStats[key] ?? '0');
    rows.push([label, displayVal, pct]);
  }
  return rows.filter(r => r[1] !== '0' && r[1] !== '0%');
}

// Map ESPN event type → mobile timeline type
export function mapEventType(espnType: string): 'goal' | 'yellow' | 'sub' | 'chance' | 'half' {
  const t = espnType.toLowerCase();
  if (t.includes('goal')) return 'goal';
  if (t.includes('yellow')) return 'yellow';
  if (t.includes('sub')) return 'sub';
  if (t.includes('half') || t.includes('full time') || t.includes('end')) return 'half';
  return 'chance';
}
