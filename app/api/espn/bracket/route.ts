/**
 * Knockout Bracket API
 *
 * Fetches ESPN scoreboard data for cup competitions and organises
 * results into structured knockout rounds (Playoffs → R16 → QF → SF → Final).
 *
 * Key discoveries:
 *  - ESPN uses `event.season.slug` for round names (e.g. "round-of-16")
 *  - `notes[].headline` is always empty — don't use it
 *  - When no real knockout data exists, generate placeholder rounds from group structure
 */

import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

// ─── Cricket bracket via ESPNcricinfo HTML scraping ──────────────────────────

// Browser-like headers to pass Akamai bot detection on ESPNcricinfo
const CRICINFO_HDR = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
};

// ICC event series data for match-results scraping
// slug + seriesId → /series/{slug}-{seriesId}/match-results
const CRICKET_SERIES_DATA: Record<string, { series: { slug: string; seriesId: number; season: string }[] }> = {
  "icc.champions": {
    series: [
      { slug: "icc-champions-trophy-2024-25",      seriesId: 1459031, season: "2025" },
    ],
  },
  "icc.t20wc": {
    series: [
      { slug: "icc-men-s-t20-world-cup-2025-26",   seriesId: 1502138, season: "2026" },
    ],
  },
};

// ─── Cricket country abbreviations ───────────────────────────────────────────
const CRICKET_ABBR: Record<string, string> = {
  "Afghanistan": "AFG", "Australia": "AUS", "Bangladesh": "BAN",
  "England": "ENG", "India": "IND", "Ireland": "IRE",
  "Nepal": "NEP", "Netherlands": "NED", "New Zealand": "NZL",
  "Oman": "OMA", "Pakistan": "PAK", "Papua New Guinea": "PNG",
  "Scotland": "SCO", "South Africa": "RSA", "Sri Lanka": "SL",
  "Uganda": "UGA", "West Indies": "WI", "Zimbabwe": "ZIM",
  "Namibia": "NAM", "UAE": "UAE", "Canada": "CAN", "USA": "USA",
};

function cricketAbbr(name: string): string {
  if (CRICKET_ABBR[name]) return CRICKET_ABBR[name];
  const words = name.split(" ");
  if (words.length === 1) return name.slice(0, 3).toUpperCase();
  return words.map(w => w[0]).join("").slice(0, 3).toUpperCase();
}

// ─── Static bracket data for completed/scheduled ICC tournaments ──────────────
// ESPNcricinfo blocks all server-side requests (403). For finished tournaments
// results never change; for scheduled ones the teams+dates are known in advance.

interface StaticBracketData {
  leagueName: string;
  rounds: Array<{
    slug: string;
    matches: Array<{
      id: string;
      home: { id: string; name: string };
      away: { id: string; name: string };
      homeWon: boolean;
      statusDisplay: string;
      scheduledAt: string;
    }>;
  }>;
}

const STATIC_CRICKET_BRACKETS: Record<string, StaticBracketData> = {
  // ICC Men's T20 World Cup 2026 — in progress (India/Sri Lanka co-hosts)
  // SF1 (Jun 11): New Zealand vs South Africa
  // SF2 (Jun 11): India vs England
  // Final (Jun 14): TBD
  "icc.t20wc:2026": {
    leagueName: "ICC Men's T20 World Cup",
    rounds: [
      {
        slug: "semifinals",
        matches: [
          {
            id: "t20wc26-sf1",
            home: { id: "new-zealand", name: "New Zealand" },
            away: { id: "south-africa", name: "South Africa" },
            homeWon: false,
            statusDisplay: "TBD",
            scheduledAt: "2026-06-11T10:00:00Z",
          },
          {
            id: "t20wc26-sf2",
            home: { id: "india", name: "India" },
            away: { id: "england", name: "England" },
            homeWon: false,
            statusDisplay: "TBD",
            scheduledAt: "2026-06-11T14:00:00Z",
          },
        ],
      },
      {
        slug: "final",
        matches: [
          {
            id: "t20wc26-final",
            home: { id: "tbd-sf1-winner", name: "SF1 Winner" },
            away: { id: "tbd-sf2-winner", name: "SF2 Winner" },
            homeWon: false,
            statusDisplay: "TBD",
            scheduledAt: "2026-06-14T10:00:00Z",
          },
        ],
      },
    ],
  },
  // ICC Champions Trophy 2025 — completed March 9, 2025
  // SF1 (Mar 4, Dubai): India beat Australia by 4 wickets (11 balls remaining)
  // SF2 (Mar 5, Lahore): New Zealand beat South Africa by 50 runs
  // Final (Mar 9, Dubai): India beat New Zealand by 4 wickets (6 balls remaining)
  "icc.champions:2025": {
    leagueName: "ICC Champions Trophy",
    rounds: [
      {
        slug: "semifinals",
        matches: [
          {
            id: "ct25-sf1",
            home: { id: "australia", name: "Australia" },
            away: { id: "india",     name: "India" },
            homeWon: false,
            statusDisplay: "India won by 4 wickets",
            scheduledAt: "2025-03-04T10:00:00Z",
          },
          {
            id: "ct25-sf2",
            home: { id: "new-zealand",   name: "New Zealand" },
            away: { id: "south-africa",  name: "South Africa" },
            homeWon: true,
            statusDisplay: "New Zealand won by 50 runs",
            scheduledAt: "2025-03-05T10:00:00Z",
          },
        ],
      },
      {
        slug: "final",
        matches: [
          {
            id: "ct25-final",
            home: { id: "india",       name: "India" },
            away: { id: "new-zealand", name: "New Zealand" },
            homeWon: true,
            statusDisplay: "India won by 4 wickets",
            scheduledAt: "2025-03-09T10:00:00Z",
          },
        ],
      },
    ],
  },
};

/** Build a full BracketData from a static entry */
function buildStaticBracket(leagueId: string, season: string, entry: StaticBracketData): BracketData {
  const rounds: BracketRound[] = entry.rounds.map(r => {
    const meta = SLUG_META[r.slug]!;
    return {
      name: meta.name,
      shortName: meta.short,
      order: meta.order,
      matches: r.matches.map(m => {
        const completed = m.statusDisplay !== "TBD" && m.statusDisplay !== "";
        const isHomePh = m.home.id.startsWith("tbd");
        const isAwayPh = m.away.id.startsWith("tbd");
        return {
          id: m.id,
          home: {
            id: m.home.id,
            name: m.home.name,
            shortName: isHomePh ? "TBD" : cricketAbbr(m.home.name),
            score: null,
            winner: completed && m.homeWon,
            isPlaceholder: isHomePh,
          },
          away: {
            id: m.away.id,
            name: m.away.name,
            shortName: isAwayPh ? "TBD" : cricketAbbr(m.away.name),
            score: null,
            winner: completed && !m.homeWon,
            isPlaceholder: isAwayPh,
          },
          status: completed ? "STATUS_FULL_TIME" : "STATUS_SCHEDULED",
          statusDisplay: m.statusDisplay,
          scheduledAt: m.scheduledAt,
          slug: r.slug,
          isPlaceholder: isHomePh || isAwayPh,
        };
      }),
    };
  }).sort((a, b) => a.order - b.order);

  return { leagueId, leagueName: entry.leagueName, season, rounds, hasPlaceholder: false };
}

// Parse home/away team names from ESPNcricinfo match URL slug.
// Slug format: {team1}-vs-{team2}-{ordinal?}-{round}-{matchId}
// Examples: "australia-vs-india-1st-semi-final-1466426"
//           "india-vs-new-zealand-final-1466428"
function parseMatchTeams(matchSlug: string): { team1: string; team2: string } | null {
  const vsIdx = matchSlug.indexOf("-vs-");
  if (vsIdx < 0) return null;

  const team1Raw = matchSlug.slice(0, vsIdx);
  let right = matchSlug.slice(vsIdx + 4);

  // Strip trailing match ID (5+ digit number)
  right = right.replace(/-\d{5,}$/, "");
  // Strip round suffix: -Xst/nd/rd/th-semi-final, -final, -quarter-final
  right = right.replace(/-\d+(?:st|nd|rd|th)-(?:semi-|quarter-)?final$/i, "");
  right = right.replace(/-(?:semi-|quarter-)?final$/i, "");

  const titleCase = (s: string) =>
    s.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return { team1: titleCase(team1Raw), team2: titleCase(right) };
}

// Map round label from ESPNcricinfo HTML to SLUG_META key
function cricketRoundToSlug(label: string): string | null {
  const t = label.toLowerCase();
  if (t.includes("final") && !t.includes("semi") && !t.includes("quarter")) return "final";
  if (t.includes("semi")) return "semifinals";
  if (t.includes("quarter")) return "quarterfinals";
  return null;
}

// Parse knockout match cards from the ESPNcricinfo match-results page HTML
function parseCricketKnockoutMatches(html: string): BracketMatch[] {
  const matches: BracketMatch[] = [];

  // Each match card is an <a href="…full-scorecard"> block
  const linkRe = /<a\s+href="([^"]+\/full-scorecard)"[^>]*>([\s\S]*?)<\/a>/g;
  let lm: RegExpExecArray | null;

  while ((lm = linkRe.exec(html)) !== null) {
    const href = lm[1];
    const cardHtml = lm[2];

    // Only process knockout rounds (skip group stage)
    const isKnockout = /semi-final|quarter-final|(?<![a-z])final(?!s)/i.test(href);
    if (!isKnockout) continue;

    // Match slug = second-to-last path segment
    const parts = href.split("/");
    const matchSlug = parts[parts.length - 2];
    const teams = parseMatchTeams(matchSlug);
    if (!teams) continue;

    // Round label from span with specific classes
    const roundM = cardHtml.match(/ds-text-tight-s ds-font-medium ds-text-typo[^"]*">([^<]+)<\/span>/);
    const roundLabel = roundM?.[1]?.trim() ?? "";
    const slug = cricketRoundToSlug(roundLabel);
    if (!slug) continue;

    // Result text is in the title attribute of the result paragraph
    // e.g. title="India won by 4 wickets (with 11 balls remaining)"
    const resM = cardHtml.match(/title="([^"]*(?:won|beat|tied|no result)[^"]*)"/i);
    const resultText = resM?.[1]?.trim() ?? "";

    // Determine winner by checking which team name starts the result sentence
    const resultLower = resultText.toLowerCase();
    const t1Words = teams.team1.toLowerCase().split(" ");
    const t2Words = teams.team2.toLowerCase().split(" ");
    const reWords = resultLower.split(" ");

    const team1Won = resultText !== "" && t1Words.every((w, i) => reWords[i] === w);
    const team2Won = resultText !== "" && !team1Won && t2Words.every((w, i) => reWords[i] === w);

    matches.push({
      id: `cricket-${matchSlug}`,
      home: {
        id: teams.team1.toLowerCase().replace(/\s+/g, "-"),
        name: teams.team1,
        shortName: cricketAbbr(teams.team1),
        score: null,  // Cricket scores are complex strings; winner flag drives the UI
        winner: team1Won,
      },
      away: {
        id: teams.team2.toLowerCase().replace(/\s+/g, "-"),
        name: teams.team2,
        shortName: cricketAbbr(teams.team2),
        score: null,
        winner: team2Won,
      },
      status: resultText ? "STATUS_FULL_TIME" : "STATUS_SCHEDULED",
      statusDisplay: resultText || "TBD",
      scheduledAt: new Date().toISOString(),
      slug,
    });
  }

  return matches;
}

async function fetchCricketBracket(leagueId: string, season: string): Promise<BracketData | null> {
  // 1. Check static hardcoded data first (for completed tournaments)
  const staticKey = `${leagueId}:${season}`;
  const staticEntry = STATIC_CRICKET_BRACKETS[staticKey];
  if (staticEntry) {
    return buildStaticBracket(leagueId, season, staticEntry);
  }

  const cfg = CRICKET_SERIES_DATA[leagueId];
  if (!cfg) return null;

  const pick = cfg.series.find(s => s.season === season) ?? cfg.series[0];
  if (!pick) return null;

  const cacheKey = `bracket:cricket:html:${leagueId}:${pick.season}`;
  const cached = await cacheGet<BracketData>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://www.espncricinfo.com/series/${pick.slug}-${pick.seriesId}/match-results`;
    const res = await fetch(url, { headers: CRICINFO_HDR, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const html = await res.text();

    const matches = parseCricketKnockoutMatches(html);
    if (matches.length === 0) return null;

    // Group matches into rounds
    const roundMap = new Map<string, BracketMatch[]>();
    for (const m of matches) {
      if (!roundMap.has(m.slug)) roundMap.set(m.slug, []);
      roundMap.get(m.slug)!.push(m);
    }

    const rounds: BracketRound[] = Array.from(roundMap.entries())
      .map(([slug, ms]) => {
        const meta = SLUG_META[slug];
        if (!meta) return null;
        return { name: meta.name, shortName: meta.short, order: meta.order, matches: ms };
      })
      .filter((r): r is BracketRound => r !== null)
      .sort((a, b) => a.order - b.order);

    if (rounds.length === 0) return null;

    const data: BracketData = {
      leagueId, leagueName: CUP_PATHS[leagueId]?.name ?? leagueId,
      season: pick.season, rounds, hasPlaceholder: false,
    };

    await cacheSet(cacheKey, data, 3600);
    return data;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

// Cup competition ESPN paths (cricket entries use empty path — placeholder bracket only)
const CUP_PATHS: Record<string, { path: string; name: string; cricket?: boolean }> = {
  "uefa.champions":        { path: "soccer/uefa.champions",       name: "Champions League" },
  "uefa.europa":           { path: "soccer/uefa.europa",          name: "Europa League" },
  "uefa.europa_conf":      { path: "soccer/uefa.europa_conf",     name: "Conference League" },
  "fifa.world":            { path: "soccer/fifa.world",           name: "FIFA World Cup" },
  "uefa.euro":             { path: "soccer/uefa.euro",            name: "UEFA Euro" },
  "conmebol.america":      { path: "soccer/conmebol.america",     name: "Copa América" },
  "caf.nations":           { path: "soccer/caf.nations",          name: "Africa Cup of Nations" },
  "concacaf.gold":         { path: "soccer/concacaf.gold",        name: "CONCACAF Gold Cup" },
  "concacaf.nations":      { path: "soccer/concacaf.nations",     name: "CONCACAF Nations League" },
  "afc.cup":               { path: "soccer/afc.cup",              name: "AFC Asian Cup" },
  "conmebol.libertadores": { path: "soccer/conmebol.libertadores",name: "Copa Libertadores" },
  "conmebol.sudamericana": { path: "soccer/conmebol.sudamericana",name: "Copa Sudamericana" },
  "concacaf.champions":    { path: "soccer/concacaf.champions",   name: "CONCACAF Champions" },
  // Cricket ICC events — no ESPN API path; always generate placeholder bracket
  "icc.t20wc":     { path: "", name: "ICC T20 World Cup",     cricket: true },
  "icc.wc":        { path: "", name: "ICC ODI World Cup",     cricket: true },
  "icc.champions": { path: "", name: "ICC Champions Trophy",  cricket: true },
};

// ESPN season.slug → display name + sort order
const SLUG_META: Record<string, { name: string; short: string; order: number }> = {
  "knockout-round-playoffs": { name: "Playoff Round",   short: "Playoff", order: 10 },
  "round-of-32":             { name: "Round of 32",     short: "R32",     order: 20 },
  "round-of-16":             { name: "Round of 16",     short: "R16",     order: 30 },
  "quarterfinals":           { name: "Quarter-finals",  short: "QF",      order: 40 },
  "quarter-finals":          { name: "Quarter-finals",  short: "QF",      order: 40 },
  "semifinals":              { name: "Semi-finals",     short: "SF",      order: 50 },
  "semi-finals":             { name: "Semi-finals",     short: "SF",      order: 50 },
  "3rd-place-match":         { name: "Third Place",     short: "3rd",     order: 55 },
  "third-place":             { name: "Third Place",     short: "3rd",     order: 55 },
  "final":                   { name: "Final",           short: "Final",   order: 60 },
};

// Slugs that are NOT knockout rounds (skip these)
const NON_KNOCKOUT = new Set([
  "group-stage", "league-phase", "league-stage",
  "regular-season", "pre-season", "preseason",
]);

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface BracketTeam {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  score: number | null;
  winner: boolean;
  aggScore?: number | null;
  isPlaceholder?: boolean;
}

export interface BracketMatch {
  id: string;
  home: BracketTeam;
  away: BracketTeam;
  status: string;
  statusDisplay: string;
  scheduledAt: string;
  slug: string;
  leg?: number;
  isPlaceholder?: boolean;
}

export interface BracketRound {
  name: string;
  shortName: string;
  order: number;
  matches: BracketMatch[];
  isPlaceholder?: boolean;
}

export interface BracketData {
  leagueId: string;
  leagueName: string;
  season: string;
  rounds: BracketRound[];
  hasPlaceholder?: boolean;
}

// ─── Placeholder bracket templates ───────────────────────────────────────────

// Groups per competition for generating placeholder brackets
const COMP_GROUPS: Record<string, string[]> = {
  "fifa.world":        ["A","B","C","D","E","F","G","H","I","J","K","L"], // 12 groups → R32
  "uefa.euro":         ["A","B","C","D","E","F"],                          // 6 groups → R16
  "conmebol.america":  ["A","B","C","D"],                                  // 4 groups → QF
  "caf.nations":       ["A","B","C","D","E","F"],                          // 6 groups → R16
  "concacaf.gold":     ["A","B","C","D"],                                  // 4 groups → QF
  "afc.cup":           ["A","B","C","D","E","F"],                          // 6 groups → R16
  "concacaf.nations":  ["A","B","C"],                                       // 3 groups → SF
  "conmebol.libertadores": ["A","B","C","D","E","F","G","H"],               // 8 groups → R16
  "conmebol.sudamericana": ["A","B","C","D","E","F","G","H"],               // 8 groups → R16
  // Cricket ICC events
  "icc.t20wc":     ["A","B","C","D"],    // 4 groups → Super 8 → SF → Final
  "icc.wc":        ["A","B","C","D"],    // 4 groups → SF → Final
  "icc.champions": ["A","B"],           // 2 groups → SF → Final
};

const COMP_FIRST_ROUND: Record<string, string> = {
  "fifa.world":        "round-of-32",
  "uefa.euro":         "round-of-16",
  "conmebol.america":  "quarterfinals",
  "caf.nations":       "round-of-16",
  "concacaf.gold":     "quarterfinals",
  "afc.cup":           "round-of-16",
  "concacaf.nations":  "semifinals",
  "conmebol.libertadores": "round-of-16",
  "conmebol.sudamericana": "round-of-16",
  // Cricket ICC events
  "icc.t20wc":     "semifinals",
  "icc.wc":        "semifinals",
  "icc.champions": "semifinals",
};

function makePlaceholderTeam(id: string, name: string): BracketTeam {
  return {
    id,
    name,
    shortName: name.replace(/Group\s+/i, "").slice(0, 4).toUpperCase(),
    score: null,
    winner: false,
    isPlaceholder: true,
  };
}

function generatePlaceholderRounds(leagueId: string): BracketRound[] {
  const groups = COMP_GROUPS[leagueId];
  const firstSlug = COMP_FIRST_ROUND[leagueId];
  if (!groups || !firstSlug) return [];

  const meta = SLUG_META[firstSlug];
  if (!meta) return [];

  const matches: BracketMatch[] = [];

  if (firstSlug === "round-of-32") {
    // WC 2026: 12 groups, 48 teams → 32 in knockout
    // 12 matches: each group winner vs paired group runner-up
    const pairs: [string, string][] = [
      ["A", "B"], ["C", "D"], ["E", "F"],
      ["G", "H"], ["I", "J"], ["K", "L"],
    ];
    for (const [g1, g2] of pairs) {
      matches.push({
        id: `ph-${leagueId}-${g1}${g2}-1`,
        home: makePlaceholderTeam(`ph-h-${g1}`, `Group ${g1} Winner`),
        away: makePlaceholderTeam(`ph-a-${g2}`, `Group ${g2} Runner-up`),
        status: "STATUS_SCHEDULED", statusDisplay: "TBD",
        scheduledAt: new Date().toISOString(), slug: firstSlug, isPlaceholder: true,
      });
      matches.push({
        id: `ph-${leagueId}-${g2}${g1}-2`,
        home: makePlaceholderTeam(`ph-h-${g2}`, `Group ${g2} Winner`),
        away: makePlaceholderTeam(`ph-a-${g1}`, `Group ${g1} Runner-up`),
        status: "STATUS_SCHEDULED", statusDisplay: "TBD",
        scheduledAt: new Date().toISOString(), slug: firstSlug, isPlaceholder: true,
      });
    }
    // 8 "best 3rd place" qualifier spots
    const best3rdGroups = ["A/B/C/D", "A/B/C/E", "D/E/F/G", "G/H/I/J", "H/I/K/L", "A/F/G/H", "B/C/D/I", "E/J/K/L"];
    for (let i = 0; i < 4; i++) {
      matches.push({
        id: `ph-${leagueId}-3rd-${i}`,
        home: makePlaceholderTeam(`ph-3h-${i}`, `Best 3rd (Groups ${best3rdGroups[i * 2]})`),
        away: makePlaceholderTeam(`ph-3a-${i}`, `Best 3rd (Groups ${best3rdGroups[i * 2 + 1]})`),
        status: "STATUS_SCHEDULED", statusDisplay: "TBD",
        scheduledAt: new Date().toISOString(), slug: firstSlug, isPlaceholder: true,
      });
    }
  } else if (firstSlug === "round-of-16") {
    // 6 or 8 groups → 16 teams
    for (let i = 0; i < groups.length; i += 2) {
      const g1 = groups[i];
      const g2 = groups[i + 1] ?? groups[0];
      matches.push({
        id: `ph-${leagueId}-${i}a`,
        home: makePlaceholderTeam(`ph-h-${g1}w`, `Group ${g1} Winner`),
        away: makePlaceholderTeam(`ph-a-${g2}r`, `Group ${g2} Runner-up`),
        status: "STATUS_SCHEDULED", statusDisplay: "TBD",
        scheduledAt: new Date().toISOString(), slug: firstSlug, isPlaceholder: true,
      });
      matches.push({
        id: `ph-${leagueId}-${i}b`,
        home: makePlaceholderTeam(`ph-h-${g2}w`, `Group ${g2} Winner`),
        away: makePlaceholderTeam(`ph-a-${g1}r`, `Group ${g1} Runner-up`),
        status: "STATUS_SCHEDULED", statusDisplay: "TBD",
        scheduledAt: new Date().toISOString(), slug: firstSlug, isPlaceholder: true,
      });
    }
    // For 6-group comps (Euro-style): add 4 best 3rd place matches
    if (groups.length === 6) {
      const bestOf3Labels = ["B/C/D/E/F", "A/D/E/F", "A/B/C/D", "A/B/C/E/F"];
      for (let i = 0; i < 4; i++) {
        const g = groups[i];
        matches.push({
          id: `ph-${leagueId}-b3rd-${i}`,
          home: makePlaceholderTeam(`ph-b3h-${i}`, `Group ${g} Winner`),
          away: makePlaceholderTeam(`ph-b3a-${i}`, `Best 3rd (${bestOf3Labels[i]})`),
          status: "STATUS_SCHEDULED", statusDisplay: "TBD",
          scheduledAt: new Date().toISOString(), slug: firstSlug, isPlaceholder: true,
        });
      }
    }
  } else {
    // QF or SF: pair group winners sequentially
    const half = Math.ceil(groups.length / 2);
    for (let i = 0; i < half; i++) {
      const g1 = groups[i];
      const g2 = groups[i + half] ?? groups[(i + 1) % groups.length];
      matches.push({
        id: `ph-${leagueId}-qf-${i}`,
        home: makePlaceholderTeam(`ph-h-${g1}`, `Group ${g1} Winner`),
        away: makePlaceholderTeam(`ph-a-${g2}`, `Group ${g2} Runner-up`),
        status: "STATUS_SCHEDULED", statusDisplay: "TBD",
        scheduledAt: new Date().toISOString(), slug: firstSlug, isPlaceholder: true,
      });
    }
  }

  return [{
    name: meta.name,
    shortName: meta.short,
    order: meta.order,
    matches,
    isPlaceholder: true,
  }];
}

// ─── Date range helpers ───────────────────────────────────────────────────────

function buildDateRanges(season: string): string[] {
  const yr = parseInt(season);
  if (isNaN(yr)) return [];
  return [
    `${yr}0101-${yr}1231`,
    `${yr + 1}0101-${yr + 1}0831`,
  ];
}

// ─── Bracket fetcher ──────────────────────────────────────────────────────────

type EspnEvent = {
  id: string;
  date?: string;
  season?: { year?: number; type?: number; slug?: string };
  competitions?: {
    id?: string;
    date?: string;
    status?: { type?: { name?: string; shortDetail?: string } };
    competitors?: {
      homeAway?: string;
      team?: { id?: string; displayName?: string; abbreviation?: string; logos?: { href?: string }[] };
      score?: string;
      winner?: boolean;
    }[];
    series?: {
      competitors?: { id?: string; score?: string | number }[];
    };
    notes?: { type?: string; headline?: string }[];
  }[];
};

async function fetchBracketMatches(path: string, season: string): Promise<BracketMatch[]> {
  const ranges = buildDateRanges(season);
  const seen = new Set<string>();
  const all: BracketMatch[] = [];

  for (const range of ranges) {
    const url = `${ESPN_BASE}/${path}/scoreboard?limit=200&dates=${range}&season=${season}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const data = await res.json();
      const events: EspnEvent[] = data.events ?? [];

      const seasonYear = parseInt(season);

      for (const ev of events) {
        if (seen.has(ev.id)) continue;

        if (ev.season?.year !== undefined && ev.season.year !== seasonYear) continue;

        const slug = ev.season?.slug ?? "";
        if (!slug || NON_KNOCKOUT.has(slug)) continue;
        if (!SLUG_META[slug]) continue;

        seen.add(ev.id);
        const comp = ev.competitions?.[0];
        if (!comp) continue;

        const homeComp = comp.competitors?.find(c => c.homeAway === "home");
        const awayComp = comp.competitors?.find(c => c.homeAway === "away");
        if (!homeComp?.team || !awayComp?.team) continue;

        const seriesComps = comp.series?.competitors ?? [];
        const homeAgg = seriesComps.find(s => s.id === homeComp.team?.id)?.score;
        const awayAgg = seriesComps.find(s => s.id === awayComp.team?.id)?.score;
        const hasAgg = homeAgg !== undefined && awayAgg !== undefined;

        const noteText = comp.notes?.find(n => n.headline)?.headline ?? "";
        const leg = /2nd.?leg|second.?leg/i.test(noteText) ? 2
                  : /1st.?leg|first.?leg/i.test(noteText) ? 1
                  : undefined;

        const homeName = homeComp.team.displayName ?? "TBD";
        const awayName = awayComp.team.displayName ?? "TBD";
        const homeIsPlaceholder = homeName === "TBD" || homeName.toLowerCase().includes("winner") || homeName.toLowerCase().includes("runner");
        const awayIsPlaceholder = awayName === "TBD" || awayName.toLowerCase().includes("winner") || awayName.toLowerCase().includes("runner");

        all.push({
          id: ev.id,
          home: {
            id: homeComp.team.id ?? "",
            name: homeName,
            shortName: homeComp.team.abbreviation ?? "TBD",
            logo: homeIsPlaceholder ? undefined : homeComp.team.logos?.[0]?.href,
            score: homeComp.score != null ? parseInt(homeComp.score) : null,
            winner: homeComp.winner ?? false,
            aggScore: hasAgg ? Number(homeAgg) : null,
            isPlaceholder: homeIsPlaceholder,
          },
          away: {
            id: awayComp.team.id ?? "",
            name: awayName,
            shortName: awayComp.team.abbreviation ?? "TBD",
            logo: awayIsPlaceholder ? undefined : awayComp.team.logos?.[0]?.href,
            score: awayComp.score != null ? parseInt(awayComp.score) : null,
            winner: awayComp.winner ?? false,
            aggScore: hasAgg ? Number(awayAgg) : null,
            isPlaceholder: awayIsPlaceholder,
          },
          status: comp.status?.type?.name ?? "STATUS_SCHEDULED",
          statusDisplay: comp.status?.type?.shortDetail ?? "TBD",
          scheduledAt: comp.date ?? ev.date ?? new Date().toISOString(),
          slug,
          leg,
        });
      }
    } catch {
      // continue to next range
    }
  }

  return all;
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const leagueId = searchParams.get("league");
  const season = searchParams.get("season") ?? String(new Date().getFullYear());

  if (!leagueId) {
    return NextResponse.json({ error: "league param required" }, { status: 400 });
  }

  const cfg = CUP_PATHS[leagueId];
  if (!cfg) {
    return NextResponse.json({ error: "Unknown league" }, { status: 404 });
  }

  // Static hardcoded data for completed cricket tournaments takes priority over cache.
  // If the requested season has no static entry, fall back to the most recent season that does.
  if (cfg.cricket) {
    const exactEntry = STATIC_CRICKET_BRACKETS[`${leagueId}:${season}`];
    if (exactEntry) {
      return NextResponse.json(
        buildStaticBracket(leagueId, season, exactEntry),
        { headers: { "X-Cache": "STATIC" } }
      );
    }
    // Try nearest season with static data (useful when global season is newer than last tournament)
    const allKeys = Object.keys(STATIC_CRICKET_BRACKETS)
      .filter(k => k.startsWith(`${leagueId}:`))
      .sort((a, b) => b.localeCompare(a)); // descending — most recent first
    if (allKeys.length > 0) {
      const fallbackKey = allKeys[0];
      const fallbackSeason = fallbackKey.split(":")[1];
      const fallbackEntry = STATIC_CRICKET_BRACKETS[fallbackKey];
      return NextResponse.json(
        buildStaticBracket(leagueId, fallbackSeason, fallbackEntry),
        { headers: { "X-Cache": "STATIC-FALLBACK" } }
      );
    }
  }

  const cacheKey = `bracket:${leagueId}:${season}`;
  const cached = await cacheGet<BracketData>(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });

  // Cricket ICC events: try ESPNcricinfo HTML scraper first, then fall back to placeholders
  if (cfg.cricket) {
    const cricketData = await fetchCricketBracket(leagueId, season);
    if (cricketData) {
      // Cache at outer key too so subsequent requests hit
      await cacheSet(cacheKey, cricketData, 3600);
      return NextResponse.json(cricketData, { headers: { "X-Cache": "MISS" } });
    }
    // Akamai blocked or not yet available — fall through to placeholder
    const placeholders = generatePlaceholderRounds(leagueId);
    const payload: BracketData = {
      leagueId, leagueName: cfg.name, season,
      rounds: placeholders, hasPlaceholder: true,
    };
    await cacheSet(cacheKey, payload, 60); // short TTL — retry soon
    return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } });
  }

  // Non-cricket: fetch from ESPN scoreboard
  const matches = await fetchBracketMatches(cfg.path, season);

  // Group by slug → round
  const roundMap = new Map<string, BracketMatch[]>();
  for (const m of matches) {
    if (!roundMap.has(m.slug)) roundMap.set(m.slug, []);
    roundMap.get(m.slug)!.push(m);
  }

  let rounds: BracketRound[] = Array.from(roundMap.entries())
    .map(([slug, ms]) => {
      const meta = SLUG_META[slug]!;
      return {
        name: meta.name,
        shortName: meta.short,
        order: meta.order,
        matches: ms.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
      };
    })
    .sort((a, b) => a.order - b.order);

  let hasPlaceholder = false;

  // If no real knockout data found, generate placeholders
  if (rounds.length === 0) {
    const placeholders = generatePlaceholderRounds(leagueId);
    if (placeholders.length > 0) {
      rounds = placeholders;
      hasPlaceholder = true;
    }
  }

  const payload: BracketData = {
    leagueId,
    leagueName: cfg.name,
    season,
    rounds,
    hasPlaceholder,
  };

  // Cache placeholder data briefly (60s), real data longer (300s)
  await cacheSet(cacheKey, payload, hasPlaceholder ? 60 : 300);

  return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } });
}
