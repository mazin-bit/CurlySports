"use client";

import useSWR from "swr";

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
  netRunRate?: number;   // cricket T20 leagues
  note?: string;
}

export interface GroupStandings {
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

interface StandingsResponse {
  standings: LeagueStandings[];
  updatedAt: string;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

export function useStandings(sport?: string, leagueId?: string, season?: string) {
  const params = new URLSearchParams();
  if (sport) params.set("sport", sport);
  if (leagueId) params.set("league", leagueId);
  if (season) params.set("season", season);
  const url = `/api/espn/standings?${params.toString()}`;

  const { data, error, isLoading, isValidating } = useSWR<StandingsResponse>(
    url,
    fetcher,
    { refreshInterval: 60_000 }
  );

  return {
    standings: data?.standings ?? [],
    isLoading,
    isValidating,
    error,
  };
}

export function useSingleStandings(leagueId: string, season?: string) {
  const params = new URLSearchParams({ league: leagueId });
  if (season) params.set("season", season);

  const { data, error, isLoading } = useSWR<LeagueStandings>(
    `/api/espn/standings?${params.toString()}`,
    fetcher,
    { refreshInterval: 60_000 }
  );

  return { standings: data ?? null, isLoading, error };
}
