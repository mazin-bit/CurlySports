"use client";

import useSWR from "swr";
import type { NormalizedNews } from "@/lib/types";

interface NewsResponse {
  articles: NormalizedNews[];
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useNews(limit = 20, sport?: string) {
  const url = sport ? `/api/espn/news?sport=${sport}` : "/api/espn/news";

  const { data, error, isLoading, isValidating } = useSWR<NewsResponse>(
    url,
    fetcher,
    { refreshInterval: 60_000, keepPreviousData: true, dedupingInterval: 30_000 }
  );

  const articles = (data?.articles ?? []).slice(0, limit);
  return { articles, isLoading, isValidating, error };
}
