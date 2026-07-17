"use client";

import useSWR from "swr";
import type { BracketData } from "@/app/api/espn/bracket/route";

export type { BracketData, BracketRound, BracketMatch, BracketTeam } from "@/app/api/espn/bracket/route";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useBracket(leagueId: string | null, season?: string) {
  const params = new URLSearchParams();
  if (leagueId) params.set("league", leagueId);
  if (season) params.set("season", season);

  const { data, error, isLoading } = useSWR<BracketData>(
    leagueId ? `/api/espn/bracket?${params.toString()}` : null,
    fetcher,
    { refreshInterval: 60_000, keepPreviousData: true, dedupingInterval: 30_000 }
  );

  return {
    bracket: data ?? null,
    rounds: data?.rounds ?? [],
    isLoading,
    error,
  };
}
