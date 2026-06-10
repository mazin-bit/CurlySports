"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type SportSlug =
  | "football"
  | "basketball"
  | "nfl"
  | "cricket"
  | "tennis"
  | "f1"
  | "mma"
  | "baseball"
  | "golf"
  | "hockey";

export interface SportConfig {
  slug: SportSlug;
  label: string;
  icon: string;
  color: string;
  espnScorePaths: { path: string; leagueName: string; shortName: string; id: string }[];
  espnNewsPath: string | null;
  espnStandingsPath: string | null;
  tavilyQuery: string;
  statsLabel: string; // e.g. "Goals" for football, "Points" for basketball
}

export const SPORT_CONFIGS: SportConfig[] = [
  {
    slug: "football",
    label: "Football",
    icon: "SOC",
    color: "#c8ff3d",
    espnScorePaths: [
      { path: "soccer/eng.1", leagueName: "Premier League", shortName: "EPL", id: "eng.1" },
      { path: "soccer/esp.1", leagueName: "La Liga", shortName: "LaLiga", id: "esp.1" },
      { path: "soccer/ger.1", leagueName: "Bundesliga", shortName: "BL", id: "ger.1" },
      { path: "soccer/ita.1", leagueName: "Serie A", shortName: "SA", id: "ita.1" },
      { path: "soccer/fra.1", leagueName: "Ligue 1", shortName: "L1", id: "fra.1" },
      { path: "soccer/uefa.champions", leagueName: "Champions League", shortName: "UCL", id: "uefa.champions" },
    ],
    espnNewsPath: "soccer/eng.1",
    espnStandingsPath: "soccer/eng.1",
    tavilyQuery: "football soccer premier league latest news transfers today",
    statsLabel: "Goals",
  },
  {
    slug: "basketball",
    label: "Basketball",
    icon: "NBA",
    color: "#ff5b3d",
    espnScorePaths: [
      { path: "basketball/nba",  leagueName: "NBA",  shortName: "NBA",  id: "nba"  },
      { path: "basketball/wnba", leagueName: "WNBA", shortName: "WNBA", id: "wnba" },
    ],
    espnNewsPath: "basketball/nba",
    espnStandingsPath: "basketball/nba",
    tavilyQuery: "NBA basketball latest news today",
    statsLabel: "Points",
  },
  {
    slug: "nfl",
    label: "NFL",
    icon: "NFL",
    color: "#1a3c8f",
    espnScorePaths: [
      { path: "football/nfl", leagueName: "NFL", shortName: "NFL", id: "nfl" },
    ],
    espnNewsPath: "football/nfl",
    espnStandingsPath: "football/nfl",
    tavilyQuery: "NFL american football latest news today",
    statsLabel: "TDs",
  },
  {
    slug: "cricket",
    label: "Cricket",
    icon: "CRI",
    color: "#ff8c42",
    espnScorePaths: [
      // ── Premier T20 Leagues ────────────────────────────────────────────────
      { path: "cricket/ipl",          leagueName: "Indian Premier League",   shortName: "IPL",   id: "ipl"          },
      { path: "cricket/big.bash",     leagueName: "Big Bash League",         shortName: "BBL",   id: "big.bash"     },
      { path: "cricket/psl",          leagueName: "Pakistan Super League",   shortName: "PSL",   id: "psl"          },
      { path: "cricket/cplt20",       leagueName: "Caribbean Premier Lge",   shortName: "CPL",   id: "cplt20"       },
      { path: "cricket/sa.domestic",  leagueName: "SA20",                    shortName: "SA20",  id: "sa.domestic"  },
      { path: "cricket/ilt20",        leagueName: "Int'l League T20",        shortName: "ILT20", id: "ilt20"        },
      { path: "cricket/mlc",          leagueName: "Major League Cricket",    shortName: "MLC",   id: "mlc"          },
      { path: "cricket/lpl",          leagueName: "Lanka Premier League",    shortName: "LPL",   id: "lpl"          },
      { path: "cricket/bpl",          leagueName: "Bangladesh Premier Lge",  shortName: "BPL",   id: "bpl"          },
      { path: "cricket/gt20",         leagueName: "GT20 Canada",             shortName: "GT20",  id: "gt20"         },
      // ── ICC Events ────────────────────────────────────────────────────────
      { path: "cricket/icc.t20wc",    leagueName: "ICC T20 World Cup",       shortName: "T20WC", id: "icc.t20wc"    },
      { path: "cricket/icc.wc",       leagueName: "ICC ODI World Cup",       shortName: "CWC",   id: "icc.wc"       },
      { path: "cricket/icc.champions",leagueName: "ICC Champions Trophy",    shortName: "CT",    id: "icc.champions" },
      { path: "cricket/icc.wtc",      leagueName: "World Test Championship", shortName: "WTC",   id: "icc.wtc"      },
      // ── International Series ──────────────────────────────────────────────
      { path: "cricket/ashes",        leagueName: "The Ashes",               shortName: "ASHES", id: "ashes"        },
      { path: "cricket/icc.test",     leagueName: "International Tests",     shortName: "TEST",  id: "icc.test"     },
      { path: "cricket/icc.odi",      leagueName: "International ODIs",      shortName: "ODI",   id: "icc.odi"      },
      { path: "cricket/icc.t20i",     leagueName: "International T20Is",     shortName: "T20I",  id: "icc.t20i"     },
      // ── Domestic ──────────────────────────────────────────────────────────
      { path: "cricket/eng.domestic", leagueName: "County Championship",     shortName: "CC",    id: "eng.domestic" },
      { path: "cricket/ind.domestic", leagueName: "Ranji Trophy",            shortName: "RAN",   id: "ind.domestic" },
      { path: "cricket/aus.domestic", leagueName: "Sheffield Shield",        shortName: "SS",    id: "aus.domestic" },
      { path: "cricket/nz.domestic",  leagueName: "Plunket Shield",          shortName: "PLK",   id: "nz.domestic"  },
      { path: "cricket/pak.domestic", leagueName: "Quaid-e-Azam Trophy",     shortName: "QAT",   id: "pak.domestic" },
      { path: "cricket/sa.domestic2", leagueName: "CSA 4-Day Series",        shortName: "CSA4",  id: "sa.domestic2" },
    ],
    espnNewsPath: "cricket/ipl",
    espnStandingsPath: "cricket/ipl",
    tavilyQuery: "cricket IPL test ODI T20 match results news today",
    statsLabel: "Runs",
  },
  {
    slug: "tennis",
    label: "Tennis",
    icon: "TEN",
    color: "#4caf50",
    espnScorePaths: [
      { path: "tennis/atp.1", leagueName: "ATP Tour", shortName: "ATP", id: "atp.1" },
    ],
    espnNewsPath: "tennis/atp.1",
    espnStandingsPath: "tennis/atp.1",
    tavilyQuery: "tennis ATP WTA Grand Slam tournament news today",
    statsLabel: "Sets",
  },
  {
    slug: "f1",
    label: "Formula 1",
    icon: "F1",
    color: "#e10600",
    espnScorePaths: [
      { path: "racing/f1", leagueName: "Formula 1", shortName: "F1", id: "f1" },
    ],
    espnNewsPath: "racing/f1",
    espnStandingsPath: "racing/f1",
    tavilyQuery: "Formula 1 F1 race Grand Prix news results today",
    statsLabel: "Points",
  },
  {
    slug: "mma",
    label: "MMA · UFC",
    icon: "MMA",
    color: "#9c27b0",
    espnScorePaths: [
      { path: "mma/ufc", leagueName: "UFC", shortName: "UFC", id: "ufc" },
    ],
    espnNewsPath: "mma/ufc",
    espnStandingsPath: null,
    tavilyQuery: "UFC MMA fight news results today",
    statsLabel: "KOs",
  },
  {
    slug: "baseball",
    label: "Baseball",
    icon: "MLB",
    color: "#1a73e8",
    espnScorePaths: [
      { path: "baseball/mlb", leagueName: "MLB", shortName: "MLB", id: "mlb" },
    ],
    espnNewsPath: "baseball/mlb",
    espnStandingsPath: "baseball/mlb",
    tavilyQuery: "MLB baseball latest news today",
    statsLabel: "HRs",
  },
  {
    slug: "golf",
    label: "Golf",
    icon: "PGA",
    color: "#2e7d32",
    espnScorePaths: [
      { path: "golf/pga", leagueName: "PGA Tour", shortName: "PGA", id: "pga" },
    ],
    espnNewsPath: "golf/pga",
    espnStandingsPath: null,
    tavilyQuery: "PGA Tour golf tournament leaderboard news today",
    statsLabel: "Score",
  },
  {
    slug: "hockey",
    label: "Hockey",
    icon: "NHL",
    color: "#00acc1",
    espnScorePaths: [
      { path: "hockey/nhl", leagueName: "NHL", shortName: "NHL", id: "nhl" },
    ],
    espnNewsPath: "hockey/nhl",
    espnStandingsPath: "hockey/nhl",
    tavilyQuery: "NHL hockey latest news today",
    statsLabel: "Goals",
  },
];

interface SportContextValue {
  activeSport: SportSlug;
  activeSportConfig: SportConfig;
  setActiveSport: (s: SportSlug) => void;
}

const SportContext = createContext<SportContextValue>({
  activeSport: "football",
  activeSportConfig: SPORT_CONFIGS[0],
  setActiveSport: () => {},
});

export function SportProvider({ children }: { children: ReactNode }) {
  const [activeSport, setActiveSportState] = useState<SportSlug>("football");

  useEffect(() => {
    const saved = localStorage.getItem("curly-sport") as SportSlug | null;
    if (saved && SPORT_CONFIGS.find((s) => s.slug === saved)) {
      setActiveSportState(saved);
    }
  }, []);

  const setActiveSport = (s: SportSlug) => {
    setActiveSportState(s);
    localStorage.setItem("curly-sport", s);
  };

  const activeSportConfig =
    SPORT_CONFIGS.find((s) => s.slug === activeSport) ?? SPORT_CONFIGS[0];

  return (
    <SportContext.Provider value={{ activeSport, activeSportConfig, setActiveSport }}>
      {children}
    </SportContext.Provider>
  );
}

export function useActiveSport() {
  return useContext(SportContext);
}
