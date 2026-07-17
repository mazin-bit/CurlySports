"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { LeagueGroup } from "@/lib/types";

interface ScorePayload {
  groups: LeagueGroup[];
  updatedAt: string;
}

interface StreamState {
  groups: LeagueGroup[];
  updatedAt: string | null;
  isConnected: boolean;
  error: string | null;
  liveCount: number;
}

/**
 * Real-time scores via Server-Sent Events.
 * Falls back to polling if SSE is not available (e.g., browser restriction).
 */
export function useScoresStream(sport?: string, date?: string): StreamState & { refresh: () => void } {
  const [state, setState] = useState<StreamState>({
    groups: [],
    updatedAt: null,
    isConnected: false,
    error: null,
    liveCount: 0,
  });

  const esRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (sport) params.set("sport", sport);
    if (date) params.set("date", date);
    const qs = params.toString();
    return `/api/stream/scores${qs ? "?" + qs : ""}`;
  }, [sport, date]);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    const url = buildUrl();
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("snapshot", (e) => {
      try {
        const data: ScorePayload = JSON.parse(e.data);
        const liveCount = data.groups
          .flatMap((g) => g.matches)
          .filter((m) => m.status === "LIVE" || m.status === "HALF_TIME").length;
        setState({ groups: data.groups, updatedAt: data.updatedAt, isConnected: true, error: null, liveCount });
        retryCountRef.current = 0;
      } catch {}
    });

    es.addEventListener("update", (e) => {
      try {
        const data: ScorePayload = JSON.parse(e.data);
        const liveCount = data.groups
          .flatMap((g) => g.matches)
          .filter((m) => m.status === "LIVE" || m.status === "HALF_TIME").length;
        setState((prev) => ({ ...prev, groups: data.groups, updatedAt: data.updatedAt, liveCount }));
      } catch {}
    });

    es.addEventListener("heartbeat", () => {
      setState((prev) => ({ ...prev, isConnected: true }));
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setState((prev) => ({ ...prev, isConnected: false }));

      // Exponential backoff retry: 2s, 4s, 8s, max 30s
      const backoff = Math.min(2000 * Math.pow(2, retryCountRef.current), 30_000);
      retryCountRef.current++;
      retryTimeoutRef.current = setTimeout(connect, backoff);
    };
  }, [buildUrl]);

  // Immediately fetch REST data while SSE connects (parallel strategy)
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    connect();

    // Fire REST fetch immediately — don't wait for SSE to fail
    (async () => {
      try {
        const params = new URLSearchParams();
        if (sport) params.set("sport", sport);
        if (date) params.set("date", date);
        const qs = params.toString();
        const res = await fetch(`/api/espn/scoreboard${qs ? "?" + qs : ""}`);
        if (res.ok) {
          const data = await res.json();
          const groups = data.groups ?? [];
          const liveCount = groups
            .flatMap((g: { matches: { status: string }[] }) => g.matches)
            .filter((m: { status: string }) => m.status === "LIVE" || m.status === "HALF_TIME").length;
          // Only apply if SSE hasn't delivered data yet
          setState((prev) => prev.groups.length === 0
            ? { groups, updatedAt: data.updatedAt ?? new Date().toISOString(), isConnected: true, error: null, liveCount }
            : prev
          );
        }
      } catch { /* ignore — SSE will deliver data */ }
    })();

    return () => {
      esRef.current?.close();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
    };
  }, [connect, sport]);

  const refresh = useCallback(() => {
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    retryCountRef.current = 0;
    connect();
  }, [connect]);

  return { ...state, refresh };
}
