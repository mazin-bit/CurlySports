"use client";

import useSWR from "swr";
import type { LeagueGroup } from "@/lib/types";

interface ScoreboardResponse {
  groups: LeagueGroup[];
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLiveScores(sport?: string, date?: string, pollInterval = 5_000) {
  const params = new URLSearchParams();
  if (sport) params.set("sport", sport);
  if (date) params.set("date", date);
  const qs = params.toString();
  const url = `/api/espn/scoreboard${qs ? "?" + qs : ""}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<ScoreboardResponse>(
    url,
    fetcher,
    { refreshInterval: pollInterval }
  );

  const groups = data?.groups ?? [];
  const liveCount = groups
    .flatMap((g) => g.matches)
    .filter((m) => m.status === "LIVE" || m.status === "HALF_TIME").length;

  return { groups, liveCount, isLoading, isValidating, error, refresh: mutate };
}
