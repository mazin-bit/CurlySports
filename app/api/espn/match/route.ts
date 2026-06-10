import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports";

// Map leagueId → ESPN path
const LEAGUE_PATHS: Record<string, string> = {
  "eng.1": "soccer/eng.1",
  "esp.1": "soccer/esp.1",
  "ger.1": "soccer/ger.1",
  "ita.1": "soccer/ita.1",
  "fra.1": "soccer/fra.1",
  "uefa.champions": "soccer/uefa.champions",
  "usa.1": "soccer/usa.1",
  "por.1": "soccer/por.1",
  "ned.1": "soccer/ned.1",
  "mex.1": "soccer/mex.1",
  "nba": "basketball/nba",
  "nfl": "football/nfl",
  "nhl": "hockey/nhl",
  "mlb": "baseball/mlb",
  "atp.1": "tennis/atp.1",
  "wta.1": "tennis/wta.1",
  "f1": "racing/f1",
  "ufc": "mma/ufc",
  "pga": "golf/pga",
};

export interface MatchEvent {
  id: string;
  clock: string;
  type: string;      // "Goal" | "Yellow Card" | "Red Card" | "Substitution" | "Halftime" | "Full Time" | "Kickoff"
  text: string;
  teamSide: "home" | "away" | null;
  teamName: string | null;
  teamLogo: string | null;
  isPrimary: boolean; // Goals, cards, subs are primary; kickoff is secondary
}

export interface MatchLineupPlayer {
  id: string;
  name: string;
  jersey: string;
  position: string;
  positionAbbr: string;
  headshot: string | null;
  starter: boolean;
  subbedIn: boolean;
  subbedOut: boolean;
  formationPlace: number | null;
}

export interface MatchDetail {
  id: string;
  sport: string;
  leagueName: string;
  leagueShortName: string;
  homeTeam: { id: string; name: string; shortName: string; logoUrl: string | null; color: string | null };
  awayTeam: { id: string; name: string; shortName: string; logoUrl: string | null; color: string | null };
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  statusDisplay: string;
  minute: string | null;
  scheduledAt: string;
  venue: string | null;
  events: MatchEvent[];
  homeStats: Record<string, string>;
  awayStats: Record<string, string>;
  homeLineup: { formation: string; starters: MatchLineupPlayer[]; subs: MatchLineupPlayer[] };
  awayLineup: { formation: string; starters: MatchLineupPlayer[]; subs: MatchLineupPlayer[] };
  updatedAt: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const eventId = searchParams.get("id");
  const leagueId = searchParams.get("league") ?? "eng.1";

  if (!eventId) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  const leaguePath = LEAGUE_PATHS[leagueId] ?? `soccer/${leagueId}`;

  try {
    const url = `${ESPN}/${leaguePath}/summary?event=${eventId}`;
    const res = await fetch(url, { next: { revalidate: 15 } });
    if (!res.ok) return NextResponse.json({ error: "ESPN error" }, { status: 502 });

    const data = await res.json();
    if (data.code) return NextResponse.json({ error: data.message }, { status: 404 });

    const header = data.header ?? {};
    const competition = header.competitions?.[0] ?? {};
    const competitors: {
      homeAway: string;
      score?: string;
      winner?: boolean;
      team: {
        id?: string;
        displayName?: string;
        shortDisplayName?: string;
        abbreviation?: string;
        logos?: { href: string }[];
        logo?: string;
        color?: string;
        alternateColor?: string;
      };
    }[] = competition.competitors ?? [];
    const homeComp = competitors.find((c) => c.homeAway === "home");
    const awayComp = competitors.find((c) => c.homeAway === "away");

    const statusType = competition.status?.type ?? {};
    const statusName: string = statusType.name ?? "";
    let status = "SCHEDULED";
    if (statusType.completed) status = "FINISHED";
    else if (statusName.includes("IN_PROGRESS")) status = "LIVE";
    else if (statusName.includes("HALFTIME") || statusName.includes("HALF_TIME")) status = "HALF_TIME";
    else if (statusName.includes("POSTPONED")) status = "POSTPONED";

    // Key events
    const rawEvents: {
      id?: string | number;
      clock?: { displayValue?: string };
      type?: { text?: string };
      text?: string;
      team?: { displayName?: string; logos?: { href: string }[]; homeAway?: string };
    }[] = data.keyEvents ?? [];

    const events: MatchEvent[] = rawEvents.map((ke, i) => {
      const typeText = ke.type?.text ?? "";
      const isGoal = typeText.toLowerCase().includes("goal");
      const isYellow = typeText.toLowerCase().includes("yellow");
      const isRed = typeText.toLowerCase().includes("red");
      const isSub = typeText.toLowerCase().includes("sub");
      const isHalf = typeText.toLowerCase().includes("half");
      const isFull = typeText.toLowerCase().includes("full time") || typeText.toLowerCase().includes("end");

      // Determine team side
      const teamName = ke.team?.displayName ?? null;
      const teamLogo = ke.team?.logos?.[0]?.href ?? null;
      let teamSide: "home" | "away" | null = null;
      if (teamName) {
        if (teamName === homeComp?.team?.displayName) teamSide = "home";
        else if (teamName === awayComp?.team?.displayName) teamSide = "away";
      }

      return {
        id: String(ke.id ?? i),
        clock: ke.clock?.displayValue ?? "",
        type: typeText,
        text: ke.text ?? "",
        teamSide,
        teamName,
        teamLogo,
        isPrimary: isGoal || isYellow || isRed || isSub || isHalf || isFull,
      };
    });

    // Stats
    const bsTeams: {
      homeAway?: string;
      statistics?: { name: string; displayValue?: string }[];
    }[] = data.boxscore?.teams ?? [];
    const homeStatArr = bsTeams.find((t) => t.homeAway === "home")?.statistics ?? [];
    const awayStatArr = bsTeams.find((t) => t.homeAway === "away")?.statistics ?? [];

    const statsToShow = [
      "possessionPct", "totalShots", "shotsOnTarget", "saves",
      "foulsCommitted", "yellowCards", "redCards", "offsides",
      "wonCorners", "accuratePasses", "totalPasses",
    ];

    const pickStats = (arr: { name: string; displayValue?: string }[]) => {
      const out: Record<string, string> = {};
      for (const s of arr) {
        if (statsToShow.includes(s.name)) out[s.name] = s.displayValue ?? "0";
      }
      return out;
    };

    const homeStats = pickStats(homeStatArr);
    const awayStats = pickStats(awayStatArr);

    // Lineups
    const rosters: {
      homeAway?: string;
      formation?: string;
      roster?: {
        starter?: boolean;
        subbedIn?: boolean;
        subbedOut?: boolean;
        jersey?: string;
        formationPlace?: number;
        athlete?: { id?: string; displayName?: string; headshot?: { href?: string } };
        position?: { name?: string; abbreviation?: string };
        stats?: { name: string; value?: number; displayValue?: string }[];
      }[];
    }[] = data.rosters ?? [];

    const buildLineup = (homeAway: string) => {
      const r = rosters.find((r) => r.homeAway === homeAway);
      const formation = r?.formation ?? "";
      const allPlayers: MatchLineupPlayer[] = (r?.roster ?? []).map((p) => ({
        id: p.athlete?.id ?? "",
        name: p.athlete?.displayName ?? "",
        jersey: p.jersey ?? "",
        position: p.position?.name ?? "",
        positionAbbr: p.position?.abbreviation ?? "",
        headshot: p.athlete?.headshot?.href ?? null,
        starter: p.starter ?? false,
        subbedIn: p.subbedIn ?? false,
        subbedOut: p.subbedOut ?? false,
        formationPlace: p.formationPlace ?? null,
      }));
      return {
        formation,
        starters: allPlayers.filter((p) => p.starter),
        subs: allPlayers.filter((p) => !p.starter),
      };
    };

    const leagueName = header.league?.name ?? header.league?.shortName ?? leagueId.toUpperCase();

    const detail: MatchDetail = {
      id: eventId,
      sport: leaguePath.split("/")[0],
      leagueName,
      leagueShortName: header.league?.abbreviation ?? leagueId.toUpperCase(),
      homeTeam: {
        id: homeComp?.team?.id ?? "",
        name: homeComp?.team?.displayName ?? "Home",
        shortName: homeComp?.team?.shortDisplayName ?? homeComp?.team?.abbreviation ?? "HOM",
        logoUrl: homeComp?.team?.logos?.[0]?.href ?? homeComp?.team?.logo ?? null,
        color: homeComp?.team?.color ? `#${homeComp.team.color}` : null,
      },
      awayTeam: {
        id: awayComp?.team?.id ?? "",
        name: awayComp?.team?.displayName ?? "Away",
        shortName: awayComp?.team?.shortDisplayName ?? awayComp?.team?.abbreviation ?? "AWY",
        logoUrl: awayComp?.team?.logos?.[0]?.href ?? awayComp?.team?.logo ?? null,
        color: awayComp?.team?.color ? `#${awayComp.team.color}` : null,
      },
      homeScore: homeComp?.score != null ? parseInt(String(homeComp.score)) : null,
      awayScore: awayComp?.score != null ? parseInt(String(awayComp.score)) : null,
      status,
      statusDisplay: statusType.shortDetail ?? statusType.description ?? "",
      minute: competition.status?.displayClock ?? null,
      scheduledAt: competition.date ?? header.gameInfo?.date ?? new Date().toISOString(),
      venue: data.gameInfo?.venue?.fullName ?? null,
      events,
      homeStats,
      awayStats,
      homeLineup: buildLineup("home"),
      awayLineup: buildLineup("away"),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(detail);
  } catch (e) {
    console.error("Match fetch error:", e);
    return NextResponse.json({ error: "Failed to fetch match" }, { status: 500 });
  }
}
