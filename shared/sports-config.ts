// ─────────────────────────────────────────────────────────────────────────────
// @curly/shared — Sports & leagues configuration
//
// THIS IS THE SINGLE SOURCE OF TRUTH.
// Add a new sport or league here → it appears in the web AND mobile app.
// ─────────────────────────────────────────────────────────────────────────────

import type { SportSlug } from "./types";

// ─── League metadata (used by web Leagues page) ───────────────────────────────

export const LEAGUE_META: Record<
  string,
  { name: string; country: string; flag: string; color: string }
> = {
  // Top 5 European Football
  "eng.1": { name: "Premier League",       country: "England",       flag: "gb-eng", color: "#3d195b" },
  "esp.1": { name: "La Liga",              country: "Spain",         flag: "es",     color: "#e8401c" },
  "ger.1": { name: "Bundesliga",           country: "Germany",       flag: "de",     color: "#d20515" },
  "ita.1": { name: "Serie A",              country: "Italy",         flag: "it",     color: "#1a56db" },
  "fra.1": { name: "Ligue 1",              country: "France",        flag: "fr",     color: "#00389a" },
  // More European Football
  "por.1": { name: "Primeira Liga",        country: "Portugal",      flag: "pt",     color: "#006600" },
  "ned.1": { name: "Eredivisie",           country: "Netherlands",   flag: "nl",     color: "#e77000" },
  "eng.2": { name: "Championship",         country: "England",       flag: "gb-eng", color: "#6a0dad" },
  "sco.1": { name: "Scottish Prem",        country: "Scotland",      flag: "gb-sct", color: "#003399" },
  "tur.1": { name: "Süper Lig",            country: "Turkey",        flag: "tr",     color: "#e30a17" },
  "bel.1": { name: "Belgian Pro League",   country: "Belgium",       flag: "be",     color: "#c8000a" },
  "rus.1": { name: "RPL",                  country: "Russia",        flag: "ru",     color: "#d52b1e" },
  "gre.1": { name: "Super League",         country: "Greece",        flag: "gr",     color: "#0d5eaf" },
  // European Cups
  "uefa.champions":   { name: "Champions League",  country: "Europe",        flag: "cup",  color: "#1a237e" },
  "uefa.europa":      { name: "Europa League",      country: "Europe",        flag: "cup",  color: "#e65100" },
  "uefa.europa_conf": { name: "Conference League",  country: "Europe",        flag: "cup",  color: "#00897b" },
  // Americas Football
  "usa.1": { name: "MLS",                  country: "USA",           flag: "us",     color: "#005293" },
  "mex.1": { name: "Liga MX",              country: "Mexico",        flag: "mx",     color: "#006847" },
  "bra.1": { name: "Brasileirão",          country: "Brazil",        flag: "br",     color: "#009c3b" },
  "arg.1": { name: "Liga Profesional",     country: "Argentina",     flag: "ar",     color: "#74acdf" },
  "col.1": { name: "Liga BetPlay",         country: "Colombia",      flag: "co",     color: "#fcd116" },
  "chi.1": { name: "Primera División",     country: "Chile",         flag: "cl",     color: "#d52b1e" },
  "ecu.1": { name: "Serie A Ecuador",      country: "Ecuador",       flag: "ec",     color: "#ffd100" },
  // South American Cups
  "conmebol.libertadores": { name: "Copa Libertadores",  country: "S. America", flag: "cup",  color: "#f5c518" },
  "conmebol.sudamericana": { name: "Copa Sudamericana",  country: "S. America", flag: "cup",  color: "#e65100" },
  "concacaf.champions":    { name: "CONCACAF Champions", country: "CONCACAF",   flag: "cup",  color: "#002868" },
  // Asia / Pacific Football
  "jpn.1": { name: "J-League",             country: "Japan",         flag: "jp",     color: "#bc002d" },
  "aus.1": { name: "A-League",             country: "Australia",     flag: "au",     color: "#00008b" },
  "ksa.1": { name: "Saudi Pro League",     country: "Saudi Arabia",  flag: "sa",     color: "#006c35" },
  "chn.1": { name: "Chinese Super League", country: "China",         flag: "cn",     color: "#de2910" },
  "idn.1": { name: "Liga 1",               country: "Indonesia",     flag: "id",     color: "#ce1126" },
  // International Football
  "fifa.world":           { name: "FIFA World Cup",    country: "International", flag: "intl", color: "#003087" },
  "uefa.euro":            { name: "UEFA Euro",          country: "Europe",        flag: "intl", color: "#1a237e" },
  "conmebol.america":     { name: "Copa América",       country: "South America", flag: "intl", color: "#004d00" },
  "caf.nations":          { name: "AFCON",              country: "Africa",        flag: "intl", color: "#cc5500" },
  "concacaf.gold":        { name: "Gold Cup",           country: "CONCACAF",      flag: "intl", color: "#c8a000" },
  "concacaf.nations":     { name: "CONCACAF Nations",   country: "CONCACAF",      flag: "intl", color: "#005f73" },
  "afc.cup":              { name: "AFC Asian Cup",      country: "Asia",          flag: "intl", color: "#9c0000" },
  "uefa.nations":         { name: "UEFA Nations Lge",   country: "Europe",        flag: "intl", color: "#283593" },
  // Basketball
  "nba":   { name: "NBA",            country: "USA",           flag: "us",   color: "#c9082a" },
  "wnba":  { name: "WNBA",           country: "USA",           flag: "us",   color: "#e45c9a" },
  "ncaab": { name: "NCAA Men's",     country: "USA",           flag: "us",   color: "#003087" },
  "ncaaw": { name: "NCAA Women's",   country: "USA",           flag: "us",   color: "#c8102e" },
  // American Football, Hockey, Baseball
  "nfl":   { name: "NFL",            country: "USA",           flag: "us",   color: "#013369" },
  "nhl":   { name: "NHL",            country: "Canada / USA",  flag: "ca",   color: "#00acc1" },
  "mlb":   { name: "MLB",            country: "USA",           flag: "us",   color: "#003087" },
  // Tennis, Golf, F1, MMA
  "atp.1": { name: "ATP Rankings",   country: "International", flag: "intl", color: "#6aaa64" },
  "wta.1": { name: "WTA Rankings",   country: "International", flag: "intl", color: "#e91e8c" },
  "f1":    { name: "Formula 1",      country: "International", flag: "intl", color: "#e10600" },
  "pga":   { name: "PGA Tour",       country: "USA",           flag: "us",   color: "#007a3d" },
  "ufc":   { name: "UFC",            country: "International", flag: "intl", color: "#d20a0a" },
  // Cricket — T20 Leagues
  "ipl":          { name: "Indian Premier League",   country: "India",        flag: "in",   color: "#1e3a5f" },
  "big.bash":     { name: "Big Bash League",          country: "Australia",    flag: "au",   color: "#003087" },
  "psl":          { name: "Pakistan Super League",    country: "Pakistan",     flag: "pk",   color: "#006400" },
  "cplt20":       { name: "Caribbean Premier Lge",    country: "Caribbean",    flag: "intl", color: "#c8241a" },
  "sa.domestic":  { name: "SA20",                     country: "South Africa", flag: "za",   color: "#007a4d" },
  "ilt20":        { name: "Int'l League T20",         country: "UAE",          flag: "ae",   color: "#c8a000" },
  "mlc":          { name: "Major League Cricket",     country: "USA",          flag: "us",   color: "#003087" },
  "lpl":          { name: "Lanka Premier League",     country: "Sri Lanka",    flag: "lk",   color: "#8B0000" },
  "bpl":          { name: "Bangladesh Premier Lge",   country: "Bangladesh",   flag: "bd",   color: "#006a4e" },
  "gt20":         { name: "GT20 Canada",              country: "Canada",       flag: "ca",   color: "#c8102e" },
  // Cricket — ICC Events
  "icc.t20wc":    { name: "ICC T20 World Cup",        country: "International", flag: "intl", color: "#0047ab" },
  "icc.wc":       { name: "ICC ODI World Cup",        country: "International", flag: "intl", color: "#006400" },
  "icc.champions":{ name: "ICC Champions Trophy",     country: "International", flag: "cup",  color: "#c8a000" },
  "icc.wtc":      { name: "World Test Championship",  country: "International", flag: "cup",  color: "#4a0080" },
  // Cricket — International Series
  "ashes":        { name: "The Ashes",                country: "AUS vs ENG",   flag: "gb-eng", color: "#6b3a2a" },
  "icc.test":     { name: "International Tests",      country: "International", flag: "intl",   color: "#1a3c5e" },
  "icc.odi":      { name: "International ODIs",       country: "International", flag: "intl",   color: "#1a5c2a" },
  "icc.t20i":     { name: "International T20Is",      country: "International", flag: "intl",   color: "#5c1a5c" },
  // Cricket — Domestic
  "eng.t20":      { name: "Vitality T20 Blast",       country: "England",      flag: "gb-eng", color: "#8b0000" },
  "eng.domestic": { name: "County Championship Div 1",country: "England",      flag: "gb-eng", color: "#003087" },
  "eng.domestic2":{ name: "County Championship Div 2",country: "England",      flag: "gb-eng", color: "#1c4f9c" },
  "ind.domestic": { name: "Ranji Trophy",              country: "India",        flag: "in",     color: "#ff9800" },
  "aus.domestic": { name: "Sheffield Shield",          country: "Australia",    flag: "au",     color: "#003087" },
  "nz.domestic":  { name: "Plunket Shield",            country: "New Zealand",  flag: "nz",     color: "#000000" },
  "pak.domestic": { name: "Quaid-e-Azam Trophy",       country: "Pakistan",     flag: "pk",     color: "#006400" },
};

// ─── Football leagues (ordered by prestige) ───────────────────────────────────
// Used by PlayersClient and Players screen on mobile.
// Add a new league here → appears in both apps automatically.

export const FOOTBALL_LEAGUES: { id: string; name: string; path: string }[] = [
  { id: "eng.1",  name: "Premier League",    path: "soccer/eng.1"  },
  { id: "esp.1",  name: "La Liga",           path: "soccer/esp.1"  },
  { id: "ger.1",  name: "Bundesliga",        path: "soccer/ger.1"  },
  { id: "ita.1",  name: "Serie A",           path: "soccer/ita.1"  },
  { id: "fra.1",  name: "Ligue 1",           path: "soccer/fra.1"  },
  { id: "por.1",  name: "Primeira Liga",     path: "soccer/por.1"  },
  { id: "ned.1",  name: "Eredivisie",        path: "soccer/ned.1"  },
  { id: "eng.2",  name: "Championship",      path: "soccer/eng.2"  },
  { id: "tur.1",  name: "Süper Lig",         path: "soccer/tur.1"  },
  { id: "sco.1",  name: "Scottish Prem",     path: "soccer/sco.1"  },
  { id: "bel.1",  name: "Pro League",        path: "soccer/bel.1"  },
  { id: "gre.1",  name: "Super League",      path: "soccer/gre.1"  },
  { id: "usa.1",  name: "MLS",               path: "soccer/usa.1"  },
  { id: "mex.1",  name: "Liga MX",           path: "soccer/mex.1"  },
  { id: "bra.1",  name: "Brasileirão",       path: "soccer/bra.1"  },
  { id: "arg.1",  name: "Liga Profesional",  path: "soccer/arg.1"  },
  { id: "col.1",  name: "Liga BetPlay",      path: "soccer/col.1"  },
  { id: "ksa.1",  name: "Saudi Pro League",  path: "soccer/ksa.1"  },
  { id: "jpn.1",  name: "J1 League",         path: "soccer/jpn.1"  },
  { id: "aus.1",  name: "A-League",          path: "soccer/aus.1"  },
  { id: "chi.1",  name: "Primera División",  path: "soccer/chi.1"  },
  { id: "ecu.1",  name: "Liga Pro",          path: "soccer/ecu.1"  },
  { id: "rus.1",  name: "Premier Liga",      path: "soccer/rus.1"  },
];

// ─── Other sport leagues (Players + Leagues screens) ─────────────────────────

export const OTHER_LEAGUES: Record<
  string,
  { id: string; name: string; path: string }[]
> = {
  basketball: [
    { id: "nba",  name: "NBA",  path: "basketball/nba"  },
    { id: "wnba", name: "WNBA", path: "basketball/wnba" },
  ],
  nfl:      [{ id: "nfl",          name: "NFL",               path: "football/nfl"          }],
  hockey:   [{ id: "nhl",          name: "NHL",               path: "hockey/nhl"            }],
  baseball: [{ id: "mlb",          name: "MLB",               path: "baseball/mlb"          }],
  tennis:   [{ id: "atp.1",        name: "ATP",               path: "tennis/atp.1"          },
             { id: "wta.1",        name: "WTA",               path: "tennis/wta.1"          }],
  golf:     [{ id: "pga",          name: "PGA Tour",          path: "golf/pga"              }],
  mma:      [{ id: "ufc",          name: "UFC",               path: "mma/ufc"               }],
  f1:       [{ id: "f1",           name: "Formula 1",         path: "racing/f1"             }],
  cricket:  [
    { id: "ipl",          name: "IPL",         path: "cricket/ipl"          },
    { id: "big.bash",     name: "Big Bash",    path: "cricket/big.bash"     },
    { id: "psl",          name: "PSL",         path: "cricket/psl"          },
    { id: "cplt20",       name: "CPL",         path: "cricket/cplt20"       },
    { id: "sa.domestic",  name: "SA20",        path: "cricket/sa.domestic"  },
    { id: "eng.domestic", name: "County",      path: "cricket/eng.domestic" },
  ],
};

// ─── Sport tabs (used in Live Scores, Players, Leagues screens) ───────────────

export interface SportTab {
  slug: SportSlug;
  label: string;
  espnSport: string;    // ESPN API sport segment  e.g. "soccer", "basketball"
  espnLeague: string;   // ESPN API league segment e.g. "eng.1", "nba"
}

export const SPORT_TABS: SportTab[] = [
  { slug: "football",   label: "Football",   espnSport: "soccer",     espnLeague: "eng.1"        },
  { slug: "cricket",    label: "Cricket",    espnSport: "cricket",    espnLeague: "ipl"          },
  { slug: "basketball", label: "Basketball", espnSport: "basketball", espnLeague: "nba"          },
  { slug: "f1",         label: "F1",         espnSport: "racing",     espnLeague: "f1"           },
  { slug: "nfl",        label: "NFL",        espnSport: "football",   espnLeague: "nfl"          },
  { slug: "tennis",     label: "Tennis",     espnSport: "tennis",     espnLeague: "atp.1"        },
  { slug: "baseball",   label: "Baseball",   espnSport: "baseball",   espnLeague: "mlb"          },
  { slug: "hockey",     label: "Hockey",     espnSport: "hockey",     espnLeague: "nhl"          },
  { slug: "mma",        label: "MMA",        espnSport: "mma",        espnLeague: "ufc"          },
  { slug: "golf",       label: "Golf",       espnSport: "golf",       espnLeague: "pga"          },
];

// ─── Leagues grouped by sport (for Leagues & Players filter UI) ───────────────
// Derived automatically from FOOTBALL_LEAGUES + OTHER_LEAGUES so you never
// have to maintain a third list.

export const LEAGUES_BY_SPORT: Record<string, { id: string; label: string }[]> = {
  football:   FOOTBALL_LEAGUES.map(l => ({ id: l.id, label: l.name })),
  basketball: OTHER_LEAGUES.basketball.map(l => ({ id: l.id, label: l.name })),
  nfl:        OTHER_LEAGUES.nfl.map(l => ({ id: l.id, label: l.name })),
  hockey:     OTHER_LEAGUES.hockey.map(l => ({ id: l.id, label: l.name })),
  baseball:   OTHER_LEAGUES.baseball.map(l => ({ id: l.id, label: l.name })),
  tennis:     OTHER_LEAGUES.tennis.map(l => ({ id: l.id, label: l.name })),
  golf:       OTHER_LEAGUES.golf.map(l => ({ id: l.id, label: l.name })),
  mma:        OTHER_LEAGUES.mma.map(l => ({ id: l.id, label: l.name })),
  f1:         OTHER_LEAGUES.f1.map(l => ({ id: l.id, label: l.name })),
  cricket:    OTHER_LEAGUES.cricket.map(l => ({ id: l.id, label: l.name })),
};

// ─── API path constants ───────────────────────────────────────────────────────
// Shared so both apps always call the same endpoints.

export const API_PATHS = {
  scoreboard: "/api/espn/scoreboard",
  news:       "/api/espn/news",
  standings:  "/api/espn/standings",
  match:      "/api/espn/match",
  player:     "/api/espn/player",
  teams:      "/api/espn/teams",
  f1Live:     "/api/f1/live",
  nbaScores:  "/api/nba/scoreboard",
} as const;
