"use client";

import useSWR from "swr";
import type { EspnTeamEntry } from "@/app/api/espn/teams/route";

interface TeamsResponse {
  teams: EspnTeamEntry[];
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTeams(sport?: string, leagueId?: string) {
  const params = new URLSearchParams();
  if (sport) params.set("sport", sport);
  if (leagueId) params.set("league", leagueId);
  const url = `/api/espn/teams?${params.toString()}`;

  const { data, error, isLoading, isValidating } = useSWR<TeamsResponse>(
    url,
    fetcher,
    { refreshInterval: 60 * 60_000, keepPreviousData: true, dedupingInterval: 60_000 }
  );

  return {
    teams: data?.teams ?? [],
    isLoading,
    isValidating,
    error,
  };
}
