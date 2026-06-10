/**
 * MMA/UFC Scraper
 *
 * UFC Stats (ufcstats.com): The most comprehensive fight stats database.
 * No official API — must parse HTML tables.
 * Uses: fight history, strikes, takedowns, submission attempts.
 *
 * ESPN unofficial API: Has UFC event schedules and results.
 *
 * Tapology: Unofficial API endpoints discoverable via DevTools.
 *
 * For production: Use ufcstats.com + ESPN hybrid.
 */

import { fetchJson, fetchWithRetry } from "@/scrapers/base";
import type { NormalizedEvent } from "@/scrapers/base";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/mma/ufc";

interface EspnMmaEvent {
  id: string;
  name: string;
  date: string;
  competitions: {
    id: string;
    name?: string;
    note?: string;
    competitors: {
      homeAway: "home" | "away";
      score?: string;
      winner?: boolean;
      team?: {
        id: string;
        displayName: string;
        logos?: { href: string }[];
      };
      athlete?: {
        id: string;
        displayName: string;
        headshot?: { href: string };
        record?: string;
      };
    }[];
    status?: {
      type?: { name?: string; shortDetail?: string; state?: string };
    };
    venue?: { fullName?: string };
    broadcast?: string;
    weightClass?: string;
  }[];
}

function normalizeEspnMma(e: EspnMmaEvent): NormalizedEvent {
  const comp = e.competitions[0];
  const c1 = comp?.competitors?.[0];
  const c2 = comp?.competitors?.[1];
  const statusName = comp?.status?.type?.name ?? "";

  let status: NormalizedEvent["status"] = "SCHEDULED";
  if (statusName.includes("IN_PROGRESS")) status = "LIVE";
  else if (statusName.includes("FINAL") || comp?.status?.type?.state === "post") status = "FINISHED";

  return {
    id: `mma_${e.id}`,
    sport: "mma",
    source: "espn",
    homeTeam: {
      id: c1?.team?.id ?? c1?.athlete?.id ?? "",
      name: c1?.team?.displayName ?? c1?.athlete?.displayName ?? "Fighter 1",
      logo: c1?.team?.logos?.[0]?.href ?? c1?.athlete?.headshot?.href,
    },
    awayTeam: {
      id: c2?.team?.id ?? c2?.athlete?.id ?? "",
      name: c2?.team?.displayName ?? c2?.athlete?.displayName ?? "Fighter 2",
      logo: c2?.team?.logos?.[0]?.href ?? c2?.athlete?.headshot?.href,
    },
    homeScore: c1?.score ? parseInt(c1.score) : null,
    awayScore: c2?.score ? parseInt(c2.score) : null,
    status,
    statusDisplay: `${comp?.note ?? ""} ${comp?.status?.type?.shortDetail ?? ""}`.trim(),
    minute: null,
    leagueId: "ufc",
    leagueName: e.name ?? "UFC",
    scheduledAt: e.date,
    venue: comp?.venue?.fullName,
    raw: e,
  };
}

export class UfcScraper {
  async fetchUpcomingEvents(): Promise<NormalizedEvent[]> {
    const data = await fetchJson<{ events?: EspnMmaEvent[] }>(
      `${ESPN_BASE}/scoreboard`
    );
    return (data?.events ?? []).map(normalizeEspnMma);
  }

  async fetchEventDetail(eventId: string) {
    const id = eventId.replace("mma_", "");
    return fetchJson(`${ESPN_BASE}/summary?event=${id}`);
  }

  /** UFC Stats fight history for a fighter (HTML parsing required) */
  async fetchFighterStats(fighterUrlSlug: string) {
    try {
      const res = await fetchWithRetry(
        `http://www.ufcstats.com/fighter-details/${fighterUrlSlug}`,
        { headers: { "Accept": "text/html" }, retries: 2 }
      );
      if (!res.ok) return null;
      const html = await res.text();

      // Extract fighter stats from HTML (without full DOM parser)
      const extractStat = (label: string): string => {
        const regex = new RegExp(`${label}[\\s\\S]*?<span[^>]*>([^<]+)<\/span>`, "i");
        return html.match(regex)?.[1]?.trim() ?? "";
      };

      return {
        slpm: extractStat("SLpM"),        // Significant Strikes Landed per Minute
        stracc: extractStat("Str. Acc"),  // Strike Accuracy
        sapm: extractStat("SApM"),        // Significant Strikes Absorbed per Minute
        strdef: extractStat("Str. Def"),  // Strike Defense
        tdavg: extractStat("TD Avg"),     // Takedown Average per 15 min
        tdacc: extractStat("TD Acc"),     // Takedown Accuracy
        tddef: extractStat("TD Def"),     // Takedown Defense
        subavg: extractStat("Sub. Avg"),  // Submission Average per 15 min
      };
    } catch {
      return null;
    }
  }

  /** UFC rankings by weight class */
  async fetchRankings() {
    const data = await fetchJson<{
      categories?: {
        title: string;
        athlete?: { displayName?: string; rank?: string; headshot?: { href?: string }; record?: string }[];
      }[];
    }>("https://site.api.espn.com/apis/site/v2/sports/mma/ufc/rankings");
    return data?.categories ?? [];
  }
}
