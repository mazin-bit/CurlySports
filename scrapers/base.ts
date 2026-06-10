/**
 * BaseScraper — abstract base class for all data source adapters.
 *
 * Provides:
 * - Adaptive rate limiting per domain
 * - Automatic retry with exponential backoff
 * - Request deduplication via in-flight tracking
 * - User-agent rotation
 * - Response caching headers
 */

export interface FetchOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cacheTtl?: number; // seconds — 0 = no cache
}

export interface NormalizedEvent {
  id: string;
  sport: string;
  source: string;
  homeTeam: { id: string; name: string; logo?: string };
  awayTeam: { id: string; name: string; logo?: string };
  homeScore: number | null;
  awayScore: number | null;
  status: "SCHEDULED" | "LIVE" | "HALF_TIME" | "FINISHED" | "POSTPONED" | "CANCELLED";
  statusDisplay: string;
  minute: number | null;
  leagueId: string;
  leagueName: string;
  scheduledAt: string;
  venue?: string;
  raw?: unknown;
}

export interface NormalizedPlayer {
  id: string;
  name: string;
  position?: string;
  nationality?: string;
  teamId?: string;
  teamName?: string;
  age?: number;
  photo?: string;
  stats?: Record<string, number | string>;
  source: string;
}

export interface NormalizedStanding {
  rank: number;
  teamId: string;
  teamName: string;
  teamLogo?: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  form?: string; // e.g. "WWLDW"
  note?: string;
}

// Rotating user agents to avoid bot detection
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
];

// Per-domain rate limiting state
const domainLastCall: Record<string, number> = {};
const domainMinInterval: Record<string, number> = {
  "api.sofascore.com": 1000,       // 1 req/s
  "www.fotmob.com": 1500,          // ~40 req/min
  "api.cricapi.com": 2000,         // conservative
  "statsapi.mlb.com": 500,         // official, generous
  "api-web.nhle.com": 500,         // official NHL API
  "ergast.com": 500,               // official Ergast
  "api.openf1.org": 200,           // real-time, fast
  "site.api.espn.com": 300,        // ESPN unofficial
  "site.web.api.espn.com": 300,
  "stats.nba.com": 2000,           // strict bot detection
  "cdn.nba.com": 200,              // CDN, fast
  "www.hltv.org": 3000,            // aggressive bot detection
  "default": 500,
};

async function waitForRateLimit(hostname: string): Promise<void> {
  const minInterval = domainMinInterval[hostname] ?? domainMinInterval["default"];
  const last = domainLastCall[hostname] ?? 0;
  const now = Date.now();
  const wait = minInterval - (now - last);
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  domainLastCall[hostname] = Date.now();
}

// In-flight request deduplication
const inFlight: Map<string, Promise<Response>> = new Map();

export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { headers = {}, timeout = 10000, retries = 3 } = options;
  const hostname = new URL(url).hostname;

  // Dedup concurrent identical requests
  if (inFlight.has(url)) {
    return inFlight.get(url)!;
  }

  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  const attempt = async (triesLeft: number): Promise<Response> => {
    await waitForRateLimit(hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": ua,
          "Accept": "application/json, */*",
          "Accept-Language": "en-US,en;q=0.9",
          ...headers,
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status === 429 && triesLeft > 0) {
        const retryAfter = parseInt(res.headers.get("Retry-After") ?? "5") * 1000;
        await new Promise((r) => setTimeout(r, retryAfter));
        return attempt(triesLeft - 1);
      }

      if (!res.ok && triesLeft > 0 && res.status >= 500) {
        const backoff = (retries - triesLeft + 1) * 1000;
        await new Promise((r) => setTimeout(r, backoff));
        return attempt(triesLeft - 1);
      }

      return res;
    } catch (e) {
      clearTimeout(timer);
      if (triesLeft > 0) {
        const backoff = (retries - triesLeft + 1) * 1500;
        await new Promise((r) => setTimeout(r, backoff));
        return attempt(triesLeft - 1);
      }
      throw e;
    }
  };

  const promise = attempt(retries).finally(() => inFlight.delete(url));
  inFlight.set(url, promise);
  return promise;
}

export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T | null> {
  try {
    const res = await fetchWithRetry(url, options);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

export abstract class BaseScraper {
  abstract readonly name: string;
  abstract readonly sport: string;
  abstract readonly baseUrl: string;

  protected headers: Record<string, string> = {};

  protected fetch<T>(path: string, opts: FetchOptions = {}): Promise<T | null> {
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    return fetchJson<T>(url, { headers: { ...this.headers, ...opts.headers }, ...opts });
  }

  abstract fetchLiveEvents(): Promise<NormalizedEvent[]>;
  abstract fetchEventById(id: string): Promise<NormalizedEvent | null>;
  abstract fetchStandings(leagueId: string): Promise<NormalizedStanding[]>;
}
