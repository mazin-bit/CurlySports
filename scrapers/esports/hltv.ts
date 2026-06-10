/**
 * Esports Scraper — HLTV (CS2) + Liquipedia
 *
 * HLTV: Heavy bot detection (Cloudflare).
 * Workaround: Use hltv.org's JSON API paths discovered via DevTools.
 * Real approach for production: Use Playwright with stealth mode.
 *
 * Liquipedia: More scraper-friendly, has a public API:
 * https://liquipedia.net/api.php
 *
 * Tracker.gg: Has unofficial JSON APIs per game.
 *
 * Free alternatives with actual APIs:
 * - PandaScore: https://pandascore.co (free tier: 1k req/hour)
 * - FACEIT: https://developers.faceit.com (free tier)
 */

import { fetchJson } from "@/scrapers/base";

// PandaScore free API (registration required for key, but generous free tier)
const PANDASCORE_BASE = "https://api.pandascore.co";

// Liquipedia API (MediaWiki-based, no key for reads)
const LIQUIPEDIA_BASE = "https://liquipedia.net";

export const ESPORTS_GAMES = [
  { slug: "cs-go", name: "CS2/CS:GO", icon: "ESPORTS" },
  { slug: "lol", name: "League of Legends", icon: "ESPORTS" },
  { slug: "dota-2", name: "Dota 2", icon: "ESPORTS" },
  { slug: "valorant", name: "VALORANT", icon: "ESPORTS" },
  { slug: "overwatch", name: "Overwatch 2", icon: "ESPORTS" },
];

export class PandaScoreScraper {
  private apiKey: string;

  constructor(apiKey = process.env.PANDASCORE_API_KEY ?? "") {
    this.apiKey = apiKey;
  }

  private get headers(): Record<string, string> {
    return this.apiKey
      ? { Authorization: `Bearer ${this.apiKey}` }
      : {};
  }

  /** Live matches across all esports */
  async fetchLiveMatches(game?: string) {
    const path = game ? `/games/${game}/matches/running` : "/matches/running";
    return fetchJson<{
      id: number;
      name: string;
      status: string;
      game: { slug: string; name: string };
      league: { name: string; imageUrl?: string };
      serie: { name: string };
      tournament: { name: string };
      opponents?: { opponent: { name: string; imageUrl?: string; id: number } }[];
      results?: { team_id?: number; score?: number }[];
      begin_at?: string;
      streams?: { rawUrl?: string }[];
    }[]>(`${PANDASCORE_BASE}${path}?per_page=50`, { headers: this.headers });
  }

  /** Upcoming matches */
  async fetchUpcomingMatches(game?: string) {
    const path = game ? `/games/${game}/matches/upcoming` : "/matches/upcoming";
    return fetchJson(`${PANDASCORE_BASE}${path}?per_page=50`, { headers: this.headers });
  }

  /** Match details with maps, rounds, player stats */
  async fetchMatchDetails(matchId: number) {
    return fetchJson(`${PANDASCORE_BASE}/matches/${matchId}`, { headers: this.headers });
  }

  /** CS2/CSGO match — map by map breakdown */
  async fetchCsMatchGames(matchId: number) {
    return fetchJson(`${PANDASCORE_BASE}/csgo/matches/${matchId}`, { headers: this.headers });
  }

  /** Player stats for a tournament */
  async fetchPlayerStats(playerId: number) {
    return fetchJson(`${PANDASCORE_BASE}/players/${playerId}/stats`, { headers: this.headers });
  }

  /** Tournament standings / bracket */
  async fetchTournamentBracket(tournamentId: number) {
    return fetchJson(`${PANDASCORE_BASE}/tournaments/${tournamentId}/brackets`, { headers: this.headers });
  }
}

export class LiquipediaScraper {
  /** Fetch wiki content for a page — parses tables for standings */
  async fetchPage(game: string, pageTitle: string) {
    const url = `${LIQUIPEDIA_BASE}/${game}/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=text&format=json&origin=*`;
    return fetchJson(url, {
      headers: { "Accept-Encoding": "gzip" },
    });
  }

  /** Liquipedia full content API */
  async fetchFullData(game: string, title: string) {
    const url = `https://liquipedia.net/${game}/api.php?action=query&titles=${encodeURIComponent(title)}&prop=revisions&rvprop=content&format=json&origin=*`;
    return fetchJson(url);
  }
}

/**
 * Tracker.gg — Player performance stats
 * Unofficial JSON API discovered via DevTools
 * Note: Requires specific headers to bypass Cloudflare
 */
export class TrackerGgScraper {
  async fetchPlayerProfile(game: string, platform: string, playerId: string) {
    // tracker.gg uses a consistent URL pattern
    const gameMap: Record<string, string> = {
      "valorant": "valorant",
      "apex": "apex",
      "warzone": "warzone",
      "fortnite": "fortnite",
    };
    const g = gameMap[game] ?? game;
    const url = `https://api.tracker.gg/api/v2/${g}/standard/profile/${platform}/${encodeURIComponent(playerId)}`;
    return fetchJson(url, {
      headers: {
        "TRN-Api-Key": process.env.TRACKER_GG_KEY ?? "",
        "Referer": "https://tracker.gg/",
      },
    });
  }
}
