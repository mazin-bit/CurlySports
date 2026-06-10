/**
 * Tennis Scraper — ESPN ATP/WTA + TennisAbstract
 *
 * ESPN has live tennis data via their unofficial API.
 * ATP/WTA official sites use JavaScript rendering — requires either
 * headless browser or their unofficial API endpoints.
 *
 * TennisAbstract (tennisabstract.com): Match stats via CSV-style downloads.
 *
 * Best free source: ESPN unofficial API covers ATP, WTA, Grand Slams.
 */

import { fetchJson } from "@/scrapers/base";
import type { NormalizedEvent, NormalizedStanding } from "@/scrapers/base";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/tennis";

export const TENNIS_TOURS = [
  { id: "atp.1", name: "ATP Tour", path: "atp.1" },
  { id: "wta.1", name: "WTA Tour", path: "wta.1" },
  { id: "atp.slam.french", name: "French Open", path: "atp.slam.french" },
  { id: "atp.slam.wimbledon", name: "Wimbledon", path: "atp.slam.wimbledon" },
  { id: "atp.slam.us", name: "US Open", path: "atp.slam.us" },
  { id: "atp.slam.australian", name: "Australian Open", path: "atp.slam.australian" },
  { id: "wta.slam.french", name: "Roland Garros (W)", path: "wta.slam.french" },
  { id: "wta.slam.wimbledon", name: "Wimbledon (W)", path: "wta.slam.wimbledon" },
];

interface EspnTennisEvent {
  id: string;
  date: string;
  name?: string;
  competitions: {
    id: string;
    competitors: {
      homeAway: "home" | "away";
      score?: string;
      serveIndicator?: number;
      winner?: boolean;
      team?: {
        id: string;
        displayName: string;
        abbreviation?: string;
        logos?: { href: string }[];
        flag?: { href?: string };
      };
      linescores?: { displayValue?: string }[];
      records?: { displayValue?: string }[];
    }[];
    status?: {
      type?: { name?: string; shortDetail?: string; state?: string };
      displayClock?: string;
    };
    venue?: { fullName?: string };
    note?: string; // Round info: "Round of 32", "Quarterfinal" etc
    format?: {
      regulation?: { periods?: number };
    };
  }[];
}

function normalizeEspnTennis(e: EspnTennisEvent, tourId: string, tourName: string): NormalizedEvent {
  const comp = e.competitions[0];
  const home = comp?.competitors?.[0];
  const away = comp?.competitors?.[1];
  const statusName = comp?.status?.type?.name ?? "";

  let status: NormalizedEvent["status"] = "SCHEDULED";
  if (statusName.includes("IN_PROGRESS")) status = "LIVE";
  else if (statusName.includes("FINAL") || comp?.status?.type?.state === "post") status = "FINISHED";
  else if (statusName.includes("POSTPONED")) status = "POSTPONED";

  // Build set scores from linescores
  const homeSets = (home?.linescores ?? []).map((l) => l.displayValue ?? "").join(" ");
  const awaySets = (away?.linescores ?? []).map((l) => l.displayValue ?? "").join(" ");

  return {
    id: `tennis_${e.id}`,
    sport: "tennis",
    source: "espn",
    homeTeam: {
      id: home?.team?.id ?? "",
      name: home?.team?.displayName ?? "Player 1",
      logo: home?.team?.logos?.[0]?.href ?? home?.team?.flag?.href,
    },
    awayTeam: {
      id: away?.team?.id ?? "",
      name: away?.team?.displayName ?? "Player 2",
      logo: away?.team?.logos?.[0]?.href ?? away?.team?.flag?.href,
    },
    homeScore: home?.score ? parseInt(home.score) : null,
    awayScore: away?.score ? parseInt(away.score) : null,
    status,
    statusDisplay: `${comp?.note ?? ""} ${comp?.status?.type?.shortDetail ?? ""}`.trim(),
    minute: null,
    leagueId: tourId,
    leagueName: tourName,
    scheduledAt: e.date,
    venue: comp?.venue?.fullName,
    raw: { event: e, homeSets, awaySets },
  };
}

export class TennisScraper {
  async fetchLiveMatches(): Promise<NormalizedEvent[]> {
    const all: NormalizedEvent[] = [];
    await Promise.allSettled(
      TENNIS_TOURS.map(async (tour) => {
        const data = await fetchJson<{ events?: EspnTennisEvent[] }>(
          `${ESPN_BASE}/${tour.path}/scoreboard`
        );
        if (data?.events) {
          all.push(...data.events.map((e) => normalizeEspnTennis(e, tour.id, tour.name)));
        }
      })
    );
    return all;
  }

  async fetchMatchDetail(eventId: string, tourPath: string) {
    const id = eventId.replace("tennis_", "");
    return fetchJson(`${ESPN_BASE}/${tourPath}/summary?event=${id}`);
  }

  /** ATP live rankings */
  async fetchAtpRankings(): Promise<NormalizedStanding[]> {
    const data = await fetchJson<{
      athletes?: {
        id: string;
        displayName: string;
        flag?: { href?: string };
        headshot?: { href?: string };
        rank?: number;
        previousRank?: number;
        points?: number;
        age?: number;
      }[];
    }>(`https://site.web.api.espn.com/apis/common/v3/sports/tennis/atp.1/athletes?limit=100&sort=rank%3Aasc`);

    return (data?.athletes ?? []).map((a, idx) => ({
      rank: a.rank ?? idx + 1,
      teamId: a.id,
      teamName: a.displayName,
      teamLogo: a.headshot?.href ?? a.flag?.href,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      points: a.points ?? 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
    }));
  }
}
