"use client";

import useSWR from "swr";
import type { VideoHighlight } from "@/app/api/espn/videos/route";

interface VideosResponse {
  videos: VideoHighlight[];
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useVideos(sport?: string) {
  const url = sport ? `/api/espn/videos?sport=${sport}` : "/api/espn/videos";

  const { data, error, isLoading, isValidating } = useSWR<VideosResponse>(
    url,
    fetcher,
    {
      refreshInterval: 5 * 60_000,  // re-fetch every 5 minutes
      dedupingInterval: 60_000,     // allow refetch after 1 min (not 2s default)
      revalidateOnFocus: true,      // fresh videos when user returns to tab
    }
  );

  return {
    videos: data?.videos ?? [],
    updatedAt: data?.updatedAt,
    isLoading,
    isValidating,
    error,
  };
}
