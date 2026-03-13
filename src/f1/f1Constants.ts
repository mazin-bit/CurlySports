// @ts-nocheck
/** F1 session type labels for display */
export const SESSION_LABELS = {
  FP1: 'Practice 1',
  FP2: 'Practice 2',
  FP3: 'Practice 3',
  Qual: 'Qualifying',
  Sprint: 'Sprint Qualifying',
  SR: 'Sprint Race',
  Race: 'Race',
};

/** Map ESPN competition type id to session key */
export const ESPN_SESSION_TYPE_MAP = {
  1: 'FP1',
  2: 'Qual',
  3: 'Race',
  4: 'Sprint',
  5: 'FP2',
  6: 'SR',
  7: 'FP3',
};

export const F1_CACHE_TTL_MS = 60 * 1000;       // 1 min for live/schedule
export const F1_STANDINGS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min for standings

/** Known F1 constructor logo URLs (ESPN CDN) – use when API doesn’t return a working logo */
export const F1_TEAM_LOGO_URLS = {
  106842: 'https://a.espncdn.com/i/teamlogos/f1/500/106842.png', // Ferrari
  106921: 'https://a.espncdn.com/i/teamlogos/f1/500/106921.png', // Red Bull Racing
  106892: 'https://a.espncdn.com/i/teamlogos/f1/500/106892.png', // McLaren
  106893: 'https://a.espncdn.com/i/teamlogos/f1/500/106893.png', // Mercedes
  123986: 'https://a.espncdn.com/i/teamlogos/f1/500/123986.png', // Aston Martin
  106922: 'https://a.espncdn.com/i/teamlogos/f1/500/106922.png', // Alpine
  111427: 'https://a.espncdn.com/i/teamlogos/f1/500/111427.png', // Haas
  106967: 'https://a.espncdn.com/i/teamlogos/f1/500/106967.png', // Williams
  123988: 'https://a.espncdn.com/i/teamlogos/f1/500/123988.png', // Racing Bulls
  132211: 'https://a.espncdn.com/i/teamlogos/f1/500/132211.png', // Cadillac
  132212: 'https://a.espncdn.com/i/teamlogos/f1/500/132212.png', // Audi
  106925: 'https://a.espncdn.com/i/teamlogos/f1/500/106925.png', // Sauber
};
