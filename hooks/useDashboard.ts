"use client";

import { useLiveScores } from "./useLiveScores";
import { useNews } from "./useNews";
import type { NormalizedMatch } from "@/lib/types";

export function useDashboard() {
  const { groups, liveCount, isLoading: scoresLoading, isValidating: scoresValidating } = useLiveScores("football");
  const { articles, isLoading: newsLoading, isValidating: newsValidating } = useNews(6);

  // Flatten all football matches, prioritize live ones
  const allMatches: NormalizedMatch[] = groups
    .flatMap((g) => g.matches)
    .sort((a, b) => {
      const priority = (s: string) =>
        s === "LIVE" ? 0 : s === "HALF_TIME" ? 1 : s === "SCHEDULED" ? 2 : 3;
      return priority(a.status) - priority(b.status);
    })
    .slice(0, 6);

  return {
    matches: allMatches,
    news: articles,
    liveCount,
    isLoading: scoresLoading || newsLoading,
    isValidating: scoresValidating || newsValidating,
  };
}
