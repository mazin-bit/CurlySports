"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface KeyEvent {
  id: string;
  type?: string;
  typeId?: string;
  clock?: string;
  text?: string;
  playerName?: string;
  teamId?: string;
  scoreValue?: number;
  isYellowCard?: boolean;
  isRedCard?: boolean;
  isSubstitution?: boolean;
  isShootout?: boolean;
}

interface TeamInfo {
  id?: string;
  name?: string;
  logo?: string;
  score?: string;
  record?: string;
}

interface StatEntry {
  name?: string;
  value?: string;
  label?: string;
}

interface TeamStats {
  teamId?: string;
  teamName?: string;
  teamLogo?: string;
  stats: StatEntry[];
}

interface PlayerEntry {
  id?: string;
  name?: string;
  headshot?: string;
  position?: string;
  starter?: boolean;
  subbedOut?: boolean;
  jerseyPosition?: string;
}

interface RosterEntry {
  teamId?: string;
  teamName?: string;
  teamLogo?: string;
  formation?: string;
  players: PlayerEntry[];
}

export interface MatchDetail {
  matchId: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  status?: string;
  statusDisplay?: string;
  clock?: string;
  period?: number;
  venue?: string;
  attendance?: number;
  keyEvents: KeyEvent[];
  stats: TeamStats[];
  rosters: RosterEntry[];
}

interface MatchStreamState {
  data: MatchDetail | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useMatchStream(matchId: string, sport: string, league: string): MatchStreamState {
  const [state, setState] = useState<MatchStreamState>({
    data: null,
    isConnected: false,
    isLoading: true,
    error: null,
  });

  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();

    const url = `/api/stream/match?id=${encodeURIComponent(matchId)}&sport=${sport}&league=${league}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("snapshot", (e) => {
      try {
        setState({ data: JSON.parse(e.data), isConnected: true, isLoading: false, error: null });
        retryCountRef.current = 0;
      } catch {}
    });

    es.addEventListener("update", (e) => {
      try {
        setState((prev) => ({ ...prev, data: JSON.parse(e.data) }));
      } catch {}
    });

    es.addEventListener("error", (e) => {
      try {
        const err = JSON.parse((e as MessageEvent).data);
        setState((prev) => ({ ...prev, error: err.message, isLoading: false }));
        es.close();
      } catch {}
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setState((prev) => ({ ...prev, isConnected: false }));
      const backoff = Math.min(2000 * Math.pow(2, retryCountRef.current), 30_000);
      retryCountRef.current++;
      retryRef.current = setTimeout(connect, backoff);
    };
  }, [matchId, sport, league]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [connect]);

  return state;
}
