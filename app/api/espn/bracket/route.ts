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
import { getCricketTeams } from "@/lib/cricket-teams";

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
      { slug: "icc-men-s-t20-world-cup-2025-26",   seriesId: 1502138, season: "2025" },
      { slug: "icc-men-s-t20-world-cup-2024",       seriesId: 1411166, season: "2024" },
    ],
  },
  // T20 domestic leagues
  "ipl": {
    series: [
      { slug: "ipl-2026",                            seriesId: 1510719, season: "2026" },
      { slug: "ipl-2025",                            seriesId: 1449924, season: "2025" },
      { slug: "indian-premier-league-2024",           seriesId: 1410320, season: "2024" },
      { slug: "indian-premier-league-2023",           seriesId: 1345038, season: "2023" },
      { slug: "indian-premier-league-2022",           seriesId: 1298423, season: "2022" },
    ],
  },
  "psl": {
    series: [
      { slug: "pakistan-super-league-2025",           seriesId: 1434269, season: "2025" },
      { slug: "pakistan-super-league-2023-24",        seriesId: 1412744, season: "2024" },
      { slug: "pakistan-super-league-2022-23",        seriesId: 1332128, season: "2023" },
    ],
  },
  "big.bash": {
    series: [
      { slug: "big-bash-league-2024-25",             seriesId: 1443056, season: "2025" },
      { slug: "big-bash-league-2023-24",             seriesId: 1386092, season: "2024" },
      { slug: "big-bash-league-2022-23",             seriesId: 1324623, season: "2023" },
    ],
  },
  "cplt20": {
    series: [
      { slug: "caribbean-premier-league-2025",       seriesId: 1468498, season: "2025" },
      { slug: "caribbean-premier-league-2024",       seriesId: 1428674, season: "2024" },
      { slug: "caribbean-premier-league-2023",       seriesId: 1369538, season: "2023" },
      { slug: "caribbean-premier-league-2022",       seriesId: 1320379, season: "2022" },
    ],
  },
  "sa.domestic": {
    series: [
      { slug: "sa20-2025-26",                        seriesId: 1494252, season: "2026" },
      { slug: "sa20-2024-25",                        seriesId: 1437327, season: "2025" },
      { slug: "sa20-2023-24",                        seriesId: 1392651, season: "2024" },
      { slug: "sa20-2022-23",                        seriesId: 1335268, season: "2023" },
    ],
  },
  "ilt20": {
    series: [
      { slug: "international-league-t20-2025-26",    seriesId: 1501317, season: "2026" },
      { slug: "international-league-t20-2024-25",    seriesId: 1462172, season: "2025" },
      { slug: "international-league-t20-2023-24",    seriesId: 1406886, season: "2024" },
      { slug: "international-league-t20-2022-23",    seriesId: 1326657, season: "2023" },
    ],
  },
  "mlc": {
    series: [
      { slug: "major-league-cricket-2025",           seriesId: 1481991, season: "2025" },
      { slug: "major-league-cricket-2024",           seriesId: 1432722, season: "2024" },
      { slug: "major-league-cricket-2023",           seriesId: 1357742, season: "2023" },
    ],
  },
  "bpl": {
    series: [
      { slug: "bangladesh-premier-league-2024-25",   seriesId: 1459492, season: "2025" },
      { slug: "bangladesh-premier-league-2023-24",   seriesId: 1412272, season: "2024" },
      { slug: "bangladesh-premier-league-2022-23",   seriesId: 1346160, season: "2023" },
    ],
  },
  "lpl": {
    series: [
      { slug: "lanka-premier-league-2024",           seriesId: 1421415, season: "2024" },
      { slug: "lanka-premier-league-2023",           seriesId: 1382875, season: "2023" },
    ],
  },
};

// ─── Cricket abbreviations (national + franchise teams) ──────────────────────
const CRICKET_ABBR: Record<string, string> = {
  // National teams
  "Afghanistan": "AFG", "Australia": "AUS", "Bangladesh": "BAN",
  "England": "ENG", "India": "IND", "Ireland": "IRE",
  "Nepal": "NEP", "Netherlands": "NED", "New Zealand": "NZL",
  "Oman": "OMA", "Pakistan": "PAK", "Papua New Guinea": "PNG",
  "Scotland": "SCO", "South Africa": "RSA", "Sri Lanka": "SL",
  "Uganda": "UGA", "West Indies": "WI", "Zimbabwe": "ZIM",
  "Namibia": "NAM", "UAE": "UAE", "Canada": "CAN", "USA": "USA",
  // IPL franchises
  "Chennai Super Kings": "CSK", "Mumbai Indians": "MI", "Royal Challengers Bengaluru": "RCB",
  "Kolkata Knight Riders": "KKR", "Sunrisers Hyderabad": "SRH", "Rajasthan Royals": "RR",
  "Delhi Capitals": "DC", "Punjab Kings": "PBKS", "Gujarat Titans": "GT",
  "Lucknow Super Giants": "LSG",
  // PSL franchises
  "Lahore Qalandars": "LQ", "Islamabad United": "IU", "Karachi Kings": "KK",
  "Quetta Gladiators": "QG", "Peshawar Zalmi": "PZ", "Multan Sultans": "MS",
  // BBL franchises
  "Sydney Sixers": "SIX", "Melbourne Stars": "STA", "Perth Scorchers": "SCO",
  "Brisbane Heat": "HEA", "Sydney Thunder": "THU", "Hobart Hurricanes": "HUR",
  "Adelaide Strikers": "STR", "Melbourne Renegades": "REN",
  // CPL franchises
  "Guyana Amazon Warriors": "GAW", "Trinbago Knight Riders": "TKR",
  "St Lucia Kings": "SLK", "Saint Lucia Kings": "SLK", "Jamaica Tallawahs": "JT",
  "Barbados Royals": "BR", "Antigua And Barbuda Falcons": "ABF",
  // SA20 franchises
  "Pretoria Capitals": "PC", "Sunrisers Eastern Cape": "SEC",
  "Joburg Super Kings": "JSK", "Paarl Royals": "PR",
  "Durban S Super Giants": "DSG", "MI Cape Town": "MICT",
  // MLC franchises
  "Seattle Orcas": "SEO", "Texas Super Kings": "TSK",
  "Washington Freedom": "WSF", "MI New York": "MINY",
  "San Francisco Unicorns": "SFU",
  // ILT20 franchises
  "Desert Vipers": "DV", "Gulf Giants": "GG", "MI Emirates": "MIE",
  "Dubai Capitals": "DUB", "Abu Dhabi Knight Riders": "ADKR",
  "Sharjah Warriorz": "SW",
  // BPL franchises
  "Sylhet Strikers": "SS", "Comilla Victorians": "CV",
  "Rangpur Riders": "RGR", "Fortune Barishal": "FB",
  "Chattogram Challengers": "CC", "Khulna Tigers": "KT",
  "Chittagong Kings": "CK",
  // LPL franchises
  "Dambulla Aura": "DA", "Galle Titans": "GLT", "B Love Kandy": "BLK",
  "Jaffna Kings": "JK", "Galle Marvels": "GM", "Colombo Strikers": "CS",
  "Kandy Falcons": "KF",
};

function cricketAbbr(name: string): string {
  if (CRICKET_ABBR[name]) return CRICKET_ABBR[name];
  const words = name.split(" ");
  if (words.length === 1) return name.slice(0, 3).toUpperCase();
  return words.map(w => w[0]).join("").slice(0, 3).toUpperCase();
}

// ─── Static bracket data for completed tournaments ────────────────────────────
// ESPNcricinfo blocks all server-side requests (403). For finished tournaments
// results never change, so static data is reliable and always available.

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
  // ICC Men's T20 World Cup 2026 — completed Mar 8, 2026 (India/Sri Lanka)
  "icc.t20wc:2025": {
    leagueName: "ICC Men's T20 World Cup",
    rounds: [
      {
        slug: "semifinals",
        matches: [
          {
            id: "t20wc26-sf1",
            home: { id: "new-zealand", name: "New Zealand" },
            away: { id: "south-africa", name: "South Africa" },
            homeWon: true,
            statusDisplay: "NZ won by 9 wickets",
            scheduledAt: "2026-03-04T10:00:00Z",
          },
          {
            id: "t20wc26-sf2",
            home: { id: "india", name: "India" },
            away: { id: "england", name: "England" },
            homeWon: true,
            statusDisplay: "India won by 7 runs",
            scheduledAt: "2026-03-05T14:00:00Z",
          },
        ],
      },
      {
        slug: "final",
        matches: [
          {
            id: "t20wc26-final",
            home: { id: "india", name: "India" },
            away: { id: "new-zealand", name: "New Zealand" },
            homeWon: true,
            statusDisplay: "India won by 96 runs",
            scheduledAt: "2026-03-08T10:00:00Z",
          },
        ],
      },
    ],
  },
  // ICC Men's T20 World Cup 2024 — completed Jun 29, 2024 (West Indies/USA)
  "icc.t20wc:2024": {
    leagueName: "ICC Men's T20 World Cup",
    rounds: [
      {
        slug: "semifinals",
        matches: [
          {
            id: "t20wc24-sf1",
            home: { id: "south-africa", name: "South Africa" },
            away: { id: "afghanistan", name: "Afghanistan" },
            homeWon: true,
            statusDisplay: "SA won by 9 wickets",
            scheduledAt: "2024-06-26T14:00:00Z",
          },
          {
            id: "t20wc24-sf2",
            home: { id: "india", name: "India" },
            away: { id: "england", name: "England" },
            homeWon: true,
            statusDisplay: "India won by 68 runs",
            scheduledAt: "2024-06-27T14:00:00Z",
          },
        ],
      },
      {
        slug: "final",
        matches: [
          {
            id: "t20wc24-final",
            home: { id: "india", name: "India" },
            away: { id: "south-africa", name: "South Africa" },
            homeWon: true,
            statusDisplay: "India won by 7 runs",
            scheduledAt: "2024-06-29T14:00:00Z",
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
  // ─── IPL 2025 — completed June 3, 2025 ─────────────────────
  "ipl:2025": {
    leagueName: "Indian Premier League",
    rounds: [
      {
        slug: "qualifier-1",
        matches: [{
          id: "ipl25-q1", home: { id: "pbks", name: "Punjab Kings" }, away: { id: "rcb", name: "Royal Challengers Bengaluru" },
          homeWon: false, statusDisplay: "RCB won by 8 wickets", scheduledAt: "2025-05-29T14:00:00Z",
        }],
      },
      {
        slug: "eliminator",
        matches: [{
          id: "ipl25-el", home: { id: "gt", name: "Gujarat Titans" }, away: { id: "mi", name: "Mumbai Indians" },
          homeWon: false, statusDisplay: "MI won by 20 runs", scheduledAt: "2025-05-30T14:00:00Z",
        }],
      },
      {
        slug: "qualifier-2",
        matches: [{
          id: "ipl25-q2", home: { id: "pbks", name: "Punjab Kings" }, away: { id: "mi", name: "Mumbai Indians" },
          homeWon: true, statusDisplay: "PBKS won by 5 wickets", scheduledAt: "2025-06-01T14:00:00Z",
        }],
      },
      {
        slug: "final",
        matches: [{
          id: "ipl25-final", home: { id: "rcb", name: "Royal Challengers Bengaluru" }, away: { id: "pbks", name: "Punjab Kings" },
          homeWon: true, statusDisplay: "RCB won by 6 runs", scheduledAt: "2025-06-03T14:00:00Z",
        }],
      },
    ],
  },
  // ─── IPL 2024 — completed May 26, 2024 ─────────────────────
  "ipl:2024": {
    leagueName: "Indian Premier League",
    rounds: [
      {
        slug: "qualifier-1",
        matches: [{
          id: "ipl24-q1", home: { id: "kkr", name: "Kolkata Knight Riders" }, away: { id: "srh", name: "Sunrisers Hyderabad" },
          homeWon: true, statusDisplay: "KKR won by 8 wickets", scheduledAt: "2024-05-21T14:00:00Z",
        }],
      },
      {
        slug: "eliminator",
        matches: [{
          id: "ipl24-el", home: { id: "rr", name: "Rajasthan Royals" }, away: { id: "rcb", name: "Royal Challengers Bengaluru" },
          homeWon: true, statusDisplay: "RR won by 4 wickets", scheduledAt: "2024-05-22T14:00:00Z",
        }],
      },
      {
        slug: "qualifier-2",
        matches: [{
          id: "ipl24-q2", home: { id: "srh", name: "Sunrisers Hyderabad" }, away: { id: "rr", name: "Rajasthan Royals" },
          homeWon: true, statusDisplay: "SRH won by 36 runs", scheduledAt: "2024-05-24T14:00:00Z",
        }],
      },
      {
        slug: "final",
        matches: [{
          id: "ipl24-final", home: { id: "kkr", name: "Kolkata Knight Riders" }, away: { id: "srh", name: "Sunrisers Hyderabad" },
          homeWon: true, statusDisplay: "KKR won by 8 wickets", scheduledAt: "2024-05-26T14:00:00Z",
        }],
      },
    ],
  },
  // ─── PSL 2025 — completed May 25, 2025 ─────────────────────
  "psl:2025": {
    leagueName: "Pakistan Super League",
    rounds: [
      {
        slug: "qualifier",
        matches: [{
          id: "psl25-q", home: { id: "qg", name: "Quetta Gladiators" }, away: { id: "iu", name: "Islamabad United" },
          homeWon: true, statusDisplay: "Quetta won by 30 runs", scheduledAt: "2025-05-21T14:00:00Z",
        }],
      },
      {
        slug: "eliminator",
        matches: [
          {
            id: "psl25-el1", home: { id: "lq", name: "Lahore Qalandars" }, away: { id: "kk", name: "Karachi Kings" },
            homeWon: true, statusDisplay: "Lahore won by 6 wickets", scheduledAt: "2025-05-22T14:00:00Z",
          },
          {
            id: "psl25-el2", home: { id: "lq", name: "Lahore Qalandars" }, away: { id: "iu", name: "Islamabad United" },
            homeWon: true, statusDisplay: "Lahore won by 95 runs", scheduledAt: "2025-05-23T14:00:00Z",
          },
        ],
      },
      {
        slug: "final",
        matches: [{
          id: "psl25-final", home: { id: "qg", name: "Quetta Gladiators" }, away: { id: "lq", name: "Lahore Qalandars" },
          homeWon: false, statusDisplay: "Lahore won by 6 wickets", scheduledAt: "2025-05-25T14:00:00Z",
        }],
      },
    ],
  },

  // ─── IPL 2023 ───────────────────────────────────────────────────────────────
  "ipl:2023": {
    leagueName: "Indian Premier League",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "ipl23-q1", home: { id: "csk", name: "Chennai Super Kings" }, away: { id: "gt", name: "Gujarat Titans" }, homeWon: true, statusDisplay: "CSK won by 15 runs", scheduledAt: "2023-05-23T14:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "ipl23-el", home: { id: "mi", name: "Mumbai Indians" }, away: { id: "lsg", name: "Lucknow Super Giants" }, homeWon: true, statusDisplay: "MI won by 81 runs", scheduledAt: "2023-05-24T14:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "ipl23-q2", home: { id: "gt", name: "Gujarat Titans" }, away: { id: "mi", name: "Mumbai Indians" }, homeWon: true, statusDisplay: "GT won by 62 runs", scheduledAt: "2023-05-26T14:00:00Z" }] },
      { slug: "final", matches: [{ id: "ipl23-final", home: { id: "csk", name: "Chennai Super Kings" }, away: { id: "gt", name: "Gujarat Titans" }, homeWon: true, statusDisplay: "CSK won by 5 wickets", scheduledAt: "2023-05-29T14:00:00Z" }] },
    ],
  },

  // ─── PSL 2023 ───────────────────────────────────────────────────────────────
  "psl:2023": {
    leagueName: "Pakistan Super League",
    rounds: [
      { slug: "qualifier", matches: [{ id: "psl23-q", home: { id: "ms", name: "Multan Sultans" }, away: { id: "lq", name: "Lahore Qalandars" }, homeWon: true, statusDisplay: "Multan won by 84 runs", scheduledAt: "2023-03-15T14:00:00Z" }] },
      { slug: "eliminator", matches: [
        { id: "psl23-el1", home: { id: "pz", name: "Peshawar Zalmi" }, away: { id: "iu", name: "Islamabad United" }, homeWon: true, statusDisplay: "Peshawar won by 12 runs", scheduledAt: "2023-03-16T14:00:00Z" },
        { id: "psl23-el2", home: { id: "lq", name: "Lahore Qalandars" }, away: { id: "pz", name: "Peshawar Zalmi" }, homeWon: true, statusDisplay: "Lahore won by 4 wickets", scheduledAt: "2023-03-17T14:00:00Z" },
      ] },
      { slug: "final", matches: [{ id: "psl23-final", home: { id: "lq", name: "Lahore Qalandars" }, away: { id: "ms", name: "Multan Sultans" }, homeWon: true, statusDisplay: "Lahore won by 1 run", scheduledAt: "2023-03-18T14:00:00Z" }] },
    ],
  },

  // ─── PSL 2024 ───────────────────────────────────────────────────────────────
  "psl:2024": {
    leagueName: "Pakistan Super League",
    rounds: [
      { slug: "qualifier", matches: [{ id: "psl24-q", home: { id: "ms", name: "Multan Sultans" }, away: { id: "pz", name: "Peshawar Zalmi" }, homeWon: true, statusDisplay: "Multan won by 7 wickets", scheduledAt: "2024-03-14T14:00:00Z" }] },
      { slug: "eliminator", matches: [
        { id: "psl24-el1", home: { id: "iu", name: "Islamabad United" }, away: { id: "qg", name: "Quetta Gladiators" }, homeWon: true, statusDisplay: "Islamabad won by 39 runs", scheduledAt: "2024-03-15T14:00:00Z" },
        { id: "psl24-el2", home: { id: "iu", name: "Islamabad United" }, away: { id: "pz", name: "Peshawar Zalmi" }, homeWon: true, statusDisplay: "Islamabad won by 5 wickets", scheduledAt: "2024-03-16T14:00:00Z" },
      ] },
      { slug: "final", matches: [{ id: "psl24-final", home: { id: "iu", name: "Islamabad United" }, away: { id: "ms", name: "Multan Sultans" }, homeWon: true, statusDisplay: "Islamabad won by 2 wickets", scheduledAt: "2024-03-18T14:00:00Z" }] },
    ],
  },

  // ─── BBL 2022-23 ────────────────────────────────────────────────────────────
  "big.bash:2023": {
    leagueName: "Big Bash League",
    rounds: [
      { slug: "qualifier", matches: [
        { id: "bbl23-q", home: { id: "sco", name: "Perth Scorchers" }, away: { id: "six", name: "Sydney Sixers" }, homeWon: true, statusDisplay: "Scorchers won by 7 wickets", scheduledAt: "2023-01-25T08:00:00Z" },
        { id: "bbl23-elim", home: { id: "thu", name: "Sydney Thunder" }, away: { id: "hea", name: "Brisbane Heat" }, homeWon: false, statusDisplay: "Heat won by 8 runs (DLS)", scheduledAt: "2023-01-25T03:00:00Z" },
      ] },
      { slug: "eliminator", matches: [
        { id: "bbl23-ko", home: { id: "ren", name: "Melbourne Renegades" }, away: { id: "hea", name: "Brisbane Heat" }, homeWon: false, statusDisplay: "Heat won by 7 wickets", scheduledAt: "2023-01-27T08:00:00Z" },
        { id: "bbl23-ch", home: { id: "six", name: "Sydney Sixers" }, away: { id: "hea", name: "Brisbane Heat" }, homeWon: false, statusDisplay: "Heat won by 4 wickets", scheduledAt: "2023-01-29T08:00:00Z" },
      ] },
      { slug: "final", matches: [{ id: "bbl23-final", home: { id: "sco", name: "Perth Scorchers" }, away: { id: "hea", name: "Brisbane Heat" }, homeWon: true, statusDisplay: "Scorchers won by 5 wickets", scheduledAt: "2023-02-04T08:00:00Z" }] },
    ],
  },

  // ─── BBL 2023-24 ────────────────────────────────────────────────────────────
  "big.bash:2024": {
    leagueName: "Big Bash League",
    rounds: [
      { slug: "qualifier", matches: [
        { id: "bbl24-q", home: { id: "hea", name: "Brisbane Heat" }, away: { id: "six", name: "Sydney Sixers" }, homeWon: false, statusDisplay: "Sixers won by 39 runs", scheduledAt: "2024-01-24T08:00:00Z" },
        { id: "bbl24-ko", home: { id: "str", name: "Adelaide Strikers" }, away: { id: "sco", name: "Perth Scorchers" }, homeWon: true, statusDisplay: "Strikers won by 50 runs", scheduledAt: "2024-01-24T03:00:00Z" },
      ] },
      { slug: "eliminator", matches: [{ id: "bbl24-ch", home: { id: "hea", name: "Brisbane Heat" }, away: { id: "str", name: "Adelaide Strikers" }, homeWon: true, statusDisplay: "Heat won by 54 runs", scheduledAt: "2024-01-26T08:00:00Z" }] },
      { slug: "final", matches: [{ id: "bbl24-final", home: { id: "six", name: "Sydney Sixers" }, away: { id: "hea", name: "Brisbane Heat" }, homeWon: false, statusDisplay: "Heat won by 54 runs", scheduledAt: "2024-01-27T08:00:00Z" }] },
    ],
  },

  // ─── BBL 2024-25 ────────────────────────────────────────────────────────────
  "big.bash:2025": {
    leagueName: "Big Bash League",
    rounds: [
      { slug: "qualifier", matches: [
        { id: "bbl25-q", home: { id: "hur", name: "Hobart Hurricanes" }, away: { id: "six", name: "Sydney Sixers" }, homeWon: true, statusDisplay: "Hurricanes won by 12 runs", scheduledAt: "2025-01-22T08:00:00Z" },
        { id: "bbl25-ko", home: { id: "thu", name: "Sydney Thunder" }, away: { id: "sta", name: "Melbourne Stars" }, homeWon: true, statusDisplay: "Thunder won by 21 runs (DLS)", scheduledAt: "2025-01-22T03:00:00Z" },
      ] },
      { slug: "eliminator", matches: [{ id: "bbl25-ch", home: { id: "six", name: "Sydney Sixers" }, away: { id: "thu", name: "Sydney Thunder" }, homeWon: false, statusDisplay: "Thunder won by 4 wickets", scheduledAt: "2025-01-24T08:00:00Z" }] },
      { slug: "final", matches: [{ id: "bbl25-final", home: { id: "hur", name: "Hobart Hurricanes" }, away: { id: "thu", name: "Sydney Thunder" }, homeWon: true, statusDisplay: "Hurricanes won by 7 wickets", scheduledAt: "2025-01-27T08:00:00Z" }] },
    ],
  },

  // ─── CPL 2023 ───────────────────────────────────────────────────────────────
  "cplt20:2023": {
    leagueName: "Caribbean Premier League",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "cpl23-q1", home: { id: "gaw", name: "Guyana Amazon Warriors" }, away: { id: "tkr", name: "Trinbago Knight Riders" }, homeWon: false, statusDisplay: "TKR won by 7 wickets", scheduledAt: "2023-09-20T00:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "cpl23-el", home: { id: "slk", name: "St Lucia Kings" }, away: { id: "jt", name: "Jamaica Tallawahs" }, homeWon: false, statusDisplay: "Tallawahs won by 5 wickets", scheduledAt: "2023-09-22T00:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "cpl23-q2", home: { id: "gaw", name: "Guyana Amazon Warriors" }, away: { id: "jt", name: "Jamaica Tallawahs" }, homeWon: true, statusDisplay: "GAW won by 81 runs", scheduledAt: "2023-09-22T20:00:00Z" }] },
      { slug: "final", matches: [{ id: "cpl23-final", home: { id: "tkr", name: "Trinbago Knight Riders" }, away: { id: "gaw", name: "Guyana Amazon Warriors" }, homeWon: false, statusDisplay: "GAW won by 9 wickets", scheduledAt: "2023-09-24T00:00:00Z" }] },
    ],
  },

  // ─── CPL 2024 ───────────────────────────────────────────────────────────────
  "cplt20:2024": {
    leagueName: "Caribbean Premier League",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "cpl24-q1", home: { id: "gaw", name: "Guyana Amazon Warriors" }, away: { id: "slk", name: "St Lucia Kings" }, homeWon: false, statusDisplay: "SLK won by 15 runs (DLS)", scheduledAt: "2024-10-02T00:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "cpl24-el", home: { id: "br", name: "Barbados Royals" }, away: { id: "tkr", name: "Trinbago Knight Riders" }, homeWon: true, statusDisplay: "Royals won by 9 wickets (DLS)", scheduledAt: "2024-10-01T00:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "cpl24-q2", home: { id: "gaw", name: "Guyana Amazon Warriors" }, away: { id: "br", name: "Barbados Royals" }, homeWon: true, statusDisplay: "GAW won by 8 wickets", scheduledAt: "2024-10-05T00:00:00Z" }] },
      { slug: "final", matches: [{ id: "cpl24-final", home: { id: "gaw", name: "Guyana Amazon Warriors" }, away: { id: "slk", name: "St Lucia Kings" }, homeWon: false, statusDisplay: "SLK won by 6 wickets", scheduledAt: "2024-10-06T00:00:00Z" }] },
    ],
  },

  // ─── CPL 2025 ───────────────────────────────────────────────────────────────
  "cplt20:2025": {
    leagueName: "Caribbean Premier League",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "cpl25-q1", home: { id: "gaw", name: "Guyana Amazon Warriors" }, away: { id: "slk", name: "St Lucia Kings" }, homeWon: true, statusDisplay: "GAW won by 14 runs", scheduledAt: "2025-09-17T00:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "cpl25-el", home: { id: "abf", name: "Antigua And Barbuda Falcons" }, away: { id: "tkr", name: "Trinbago Knight Riders" }, homeWon: false, statusDisplay: "TKR won by 9 wickets", scheduledAt: "2025-09-16T00:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "cpl25-q2", home: { id: "slk", name: "St Lucia Kings" }, away: { id: "tkr", name: "Trinbago Knight Riders" }, homeWon: false, statusDisplay: "TKR won by 56 runs", scheduledAt: "2025-09-19T00:00:00Z" }] },
      { slug: "final", matches: [{ id: "cpl25-final", home: { id: "gaw", name: "Guyana Amazon Warriors" }, away: { id: "tkr", name: "Trinbago Knight Riders" }, homeWon: false, statusDisplay: "TKR won by 3 wickets", scheduledAt: "2025-09-21T00:00:00Z" }] },
    ],
  },

  // ─── SA20 2022-23 ───────────────────────────────────────────────────────────
  "sa.domestic:2023": {
    leagueName: "SA20",
    rounds: [
      { slug: "semifinals", matches: [
        { id: "sa23-sf1", home: { id: "pc", name: "Pretoria Capitals" }, away: { id: "pr", name: "Paarl Royals" }, homeWon: true, statusDisplay: "Pretoria won by 29 runs", scheduledAt: "2023-02-08T16:00:00Z" },
        { id: "sa23-sf2", home: { id: "jsk", name: "Joburg Super Kings" }, away: { id: "sec", name: "Sunrisers Eastern Cape" }, homeWon: false, statusDisplay: "SEC won by 14 runs", scheduledAt: "2023-02-09T16:00:00Z" },
      ] },
      { slug: "final", matches: [{ id: "sa23-final", home: { id: "pc", name: "Pretoria Capitals" }, away: { id: "sec", name: "Sunrisers Eastern Cape" }, homeWon: false, statusDisplay: "SEC won by 4 wickets", scheduledAt: "2023-02-12T16:00:00Z" }] },
    ],
  },

  // ─── SA20 2023-24 ───────────────────────────────────────────────────────────
  "sa.domestic:2024": {
    leagueName: "SA20",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "sa24-q1", home: { id: "sec", name: "Sunrisers Eastern Cape" }, away: { id: "dsg", name: "Durban S Super Giants" }, homeWon: true, statusDisplay: "SEC won by 51 runs", scheduledAt: "2024-02-06T16:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "sa24-el", home: { id: "pr", name: "Paarl Royals" }, away: { id: "jsk", name: "Joburg Super Kings" }, homeWon: false, statusDisplay: "JSK won by 9 wickets", scheduledAt: "2024-02-07T16:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "sa24-q2", home: { id: "dsg", name: "Durban S Super Giants" }, away: { id: "jsk", name: "Joburg Super Kings" }, homeWon: true, statusDisplay: "DSG won by 69 runs", scheduledAt: "2024-02-08T16:00:00Z" }] },
      { slug: "final", matches: [{ id: "sa24-final", home: { id: "sec", name: "Sunrisers Eastern Cape" }, away: { id: "dsg", name: "Durban S Super Giants" }, homeWon: true, statusDisplay: "SEC won by 89 runs", scheduledAt: "2024-02-10T16:00:00Z" }] },
    ],
  },

  // ─── SA20 2024-25 ───────────────────────────────────────────────────────────
  "sa.domestic:2025": {
    leagueName: "SA20",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "sa25-q1", home: { id: "mict", name: "MI Cape Town" }, away: { id: "pr", name: "Paarl Royals" }, homeWon: true, statusDisplay: "MICT won by 39 runs", scheduledAt: "2025-02-04T16:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "sa25-el", home: { id: "jsk", name: "Joburg Super Kings" }, away: { id: "sec", name: "Sunrisers Eastern Cape" }, homeWon: false, statusDisplay: "SEC won by 32 runs", scheduledAt: "2025-02-05T16:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "sa25-q2", home: { id: "pr", name: "Paarl Royals" }, away: { id: "sec", name: "Sunrisers Eastern Cape" }, homeWon: false, statusDisplay: "SEC won by 8 wickets", scheduledAt: "2025-02-06T16:00:00Z" }] },
      { slug: "final", matches: [{ id: "sa25-final", home: { id: "mict", name: "MI Cape Town" }, away: { id: "sec", name: "Sunrisers Eastern Cape" }, homeWon: true, statusDisplay: "MICT won by 76 runs", scheduledAt: "2025-02-08T16:00:00Z" }] },
    ],
  },

  // ─── MLC 2023 ───────────────────────────────────────────────────────────────
  "mlc:2023": {
    leagueName: "Major League Cricket",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "mlc23-q1", home: { id: "seo", name: "Seattle Orcas" }, away: { id: "tsk", name: "Texas Super Kings" }, homeWon: true, statusDisplay: "Orcas won by 9 wickets", scheduledAt: "2023-07-27T00:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "mlc23-el", home: { id: "wsf", name: "Washington Freedom" }, away: { id: "miny", name: "MI New York" }, homeWon: false, statusDisplay: "MINY won by 16 runs", scheduledAt: "2023-07-27T20:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "mlc23-q2", home: { id: "tsk", name: "Texas Super Kings" }, away: { id: "miny", name: "MI New York" }, homeWon: false, statusDisplay: "MINY won by 6 wickets", scheduledAt: "2023-07-28T00:00:00Z" }] },
      { slug: "final", matches: [{ id: "mlc23-final", home: { id: "seo", name: "Seattle Orcas" }, away: { id: "miny", name: "MI New York" }, homeWon: false, statusDisplay: "MINY won by 7 wickets", scheduledAt: "2023-07-30T00:00:00Z" }] },
    ],
  },

  // ─── MLC 2024 ───────────────────────────────────────────────────────────────
  "mlc:2024": {
    leagueName: "Major League Cricket",
    rounds: [
      { slug: "qualifier", matches: [{ id: "mlc24-q", home: { id: "sfu", name: "San Francisco Unicorns" }, away: { id: "wsf", name: "Washington Freedom" }, homeWon: false, statusDisplay: "Freedom won by 7 wickets", scheduledAt: "2024-07-25T00:00:00Z" }] },
      { slug: "eliminator", matches: [
        { id: "mlc24-el", home: { id: "miny", name: "MI New York" }, away: { id: "tsk", name: "Texas Super Kings" }, homeWon: false, statusDisplay: "TSK won by 9 wickets", scheduledAt: "2024-07-24T00:00:00Z" },
        { id: "mlc24-ch", home: { id: "tsk", name: "Texas Super Kings" }, away: { id: "sfu", name: "San Francisco Unicorns" }, homeWon: false, statusDisplay: "Unicorns won by 10 runs", scheduledAt: "2024-07-26T00:00:00Z" },
      ] },
      { slug: "final", matches: [{ id: "mlc24-final", home: { id: "wsf", name: "Washington Freedom" }, away: { id: "sfu", name: "San Francisco Unicorns" }, homeWon: true, statusDisplay: "Freedom won by 96 runs", scheduledAt: "2024-07-28T00:00:00Z" }] },
    ],
  },

  // ─── MLC 2025 ───────────────────────────────────────────────────────────────
  "mlc:2025": {
    leagueName: "Major League Cricket",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "mlc25-q1", home: { id: "tsk", name: "Texas Super Kings" }, away: { id: "wsf", name: "Washington Freedom" }, homeWon: false, statusDisplay: "No result (rain)", scheduledAt: "2025-07-08T00:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "mlc25-el", home: { id: "miny", name: "MI New York" }, away: { id: "sfu", name: "San Francisco Unicorns" }, homeWon: true, statusDisplay: "MINY won by 2 wickets", scheduledAt: "2025-07-09T00:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "mlc25-q2", home: { id: "miny", name: "MI New York" }, away: { id: "tsk", name: "Texas Super Kings" }, homeWon: true, statusDisplay: "MINY won by 7 wickets", scheduledAt: "2025-07-11T00:00:00Z" }] },
      { slug: "final", matches: [{ id: "mlc25-final", home: { id: "miny", name: "MI New York" }, away: { id: "wsf", name: "Washington Freedom" }, homeWon: true, statusDisplay: "MINY won by 5 runs", scheduledAt: "2025-07-13T00:00:00Z" }] },
    ],
  },

  // ─── ILT20 2022-23 ──────────────────────────────────────────────────────────
  "ilt20:2023": {
    leagueName: "International League T20",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "ilt23-q1", home: { id: "dv", name: "Desert Vipers" }, away: { id: "gg", name: "Gulf Giants" }, homeWon: true, statusDisplay: "Vipers won by 19 runs", scheduledAt: "2023-02-08T16:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "ilt23-el", home: { id: "mie", name: "MI Emirates" }, away: { id: "dub", name: "Dubai Capitals" }, homeWon: true, statusDisplay: "MIE won by 8 wickets", scheduledAt: "2023-02-09T16:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "ilt23-q2", home: { id: "gg", name: "Gulf Giants" }, away: { id: "mie", name: "MI Emirates" }, homeWon: true, statusDisplay: "Giants won by 4 wickets", scheduledAt: "2023-02-10T16:00:00Z" }] },
      { slug: "final", matches: [{ id: "ilt23-final", home: { id: "dv", name: "Desert Vipers" }, away: { id: "gg", name: "Gulf Giants" }, homeWon: false, statusDisplay: "Giants won by 7 wickets", scheduledAt: "2023-02-12T16:00:00Z" }] },
    ],
  },

  // ─── ILT20 2023-24 ──────────────────────────────────────────────────────────
  "ilt20:2024": {
    leagueName: "International League T20",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "ilt24-q1", home: { id: "mie", name: "MI Emirates" }, away: { id: "gg", name: "Gulf Giants" }, homeWon: true, statusDisplay: "MIE won by 45 runs", scheduledAt: "2024-02-14T16:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "ilt24-el", home: { id: "adkr", name: "Abu Dhabi Knight Riders" }, away: { id: "dub", name: "Dubai Capitals" }, homeWon: false, statusDisplay: "Dubai won by 85 runs", scheduledAt: "2024-02-13T16:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "ilt24-q2", home: { id: "gg", name: "Gulf Giants" }, away: { id: "dub", name: "Dubai Capitals" }, homeWon: false, statusDisplay: "Dubai won by 9 wickets", scheduledAt: "2024-02-15T16:00:00Z" }] },
      { slug: "final", matches: [{ id: "ilt24-final", home: { id: "mie", name: "MI Emirates" }, away: { id: "dub", name: "Dubai Capitals" }, homeWon: true, statusDisplay: "MIE won by 45 runs", scheduledAt: "2024-02-17T16:00:00Z" }] },
    ],
  },

  // ─── ILT20 2024-25 ──────────────────────────────────────────────────────────
  "ilt20:2025": {
    leagueName: "International League T20",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "ilt25-q1", home: { id: "dv", name: "Desert Vipers" }, away: { id: "dub", name: "Dubai Capitals" }, homeWon: false, statusDisplay: "Dubai won by 5 wickets", scheduledAt: "2025-02-05T16:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "ilt25-el", home: { id: "mie", name: "MI Emirates" }, away: { id: "sw", name: "Sharjah Warriorz" }, homeWon: false, statusDisplay: "Warriorz won by 6 wickets", scheduledAt: "2025-02-06T16:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "ilt25-q2", home: { id: "dv", name: "Desert Vipers" }, away: { id: "sw", name: "Sharjah Warriorz" }, homeWon: true, statusDisplay: "Vipers won by 7 wickets", scheduledAt: "2025-02-07T16:00:00Z" }] },
      { slug: "final", matches: [{ id: "ilt25-final", home: { id: "dub", name: "Dubai Capitals" }, away: { id: "dv", name: "Desert Vipers" }, homeWon: true, statusDisplay: "Dubai won by 4 wickets", scheduledAt: "2025-02-09T16:00:00Z" }] },
    ],
  },

  // ─── BPL 2022-23 ────────────────────────────────────────────────────────────
  "bpl:2023": {
    leagueName: "Bangladesh Premier League",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "bpl23-q1", home: { id: "ss", name: "Sylhet Strikers" }, away: { id: "cv", name: "Comilla Victorians" }, homeWon: false, statusDisplay: "Comilla won by 4 wickets", scheduledAt: "2023-02-12T09:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "bpl23-el", home: { id: "rgr", name: "Rangpur Riders" }, away: { id: "fb", name: "Fortune Barishal" }, homeWon: true, statusDisplay: "Rangpur won by 4 wickets", scheduledAt: "2023-02-12T14:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "bpl23-q2", home: { id: "rgr", name: "Rangpur Riders" }, away: { id: "ss", name: "Sylhet Strikers" }, homeWon: false, statusDisplay: "Sylhet won by 19 runs", scheduledAt: "2023-02-14T09:00:00Z" }] },
      { slug: "final", matches: [{ id: "bpl23-final", home: { id: "cv", name: "Comilla Victorians" }, away: { id: "ss", name: "Sylhet Strikers" }, homeWon: true, statusDisplay: "Comilla won by 7 wickets", scheduledAt: "2023-02-16T14:00:00Z" }] },
    ],
  },

  // ─── BPL 2023-24 ────────────────────────────────────────────────────────────
  "bpl:2024": {
    leagueName: "Bangladesh Premier League",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "bpl24-q1", home: { id: "rgr", name: "Rangpur Riders" }, away: { id: "cv", name: "Comilla Victorians" }, homeWon: false, statusDisplay: "Comilla won by 6 wickets", scheduledAt: "2024-02-26T09:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "bpl24-el", home: { id: "fb", name: "Fortune Barishal" }, away: { id: "cc", name: "Chattogram Challengers" }, homeWon: true, statusDisplay: "Barishal won by 7 wickets", scheduledAt: "2024-02-26T14:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "bpl24-q2", home: { id: "rgr", name: "Rangpur Riders" }, away: { id: "fb", name: "Fortune Barishal" }, homeWon: false, statusDisplay: "Barishal won by 6 wickets", scheduledAt: "2024-02-28T09:00:00Z" }] },
      { slug: "final", matches: [{ id: "bpl24-final", home: { id: "cv", name: "Comilla Victorians" }, away: { id: "fb", name: "Fortune Barishal" }, homeWon: false, statusDisplay: "Barishal won by 6 wickets", scheduledAt: "2024-03-01T14:00:00Z" }] },
    ],
  },

  // ─── BPL 2024-25 ────────────────────────────────────────────────────────────
  "bpl:2025": {
    leagueName: "Bangladesh Premier League",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "bpl25-q1", home: { id: "fb", name: "Fortune Barishal" }, away: { id: "ck", name: "Chittagong Kings" }, homeWon: true, statusDisplay: "Barishal won by 9 wickets", scheduledAt: "2025-02-03T09:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "bpl25-el", home: { id: "kt", name: "Khulna Tigers" }, away: { id: "rgr", name: "Rangpur Riders" }, homeWon: true, statusDisplay: "Khulna won by 9 wickets", scheduledAt: "2025-02-03T14:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "bpl25-q2", home: { id: "ck", name: "Chittagong Kings" }, away: { id: "kt", name: "Khulna Tigers" }, homeWon: true, statusDisplay: "Chittagong won by 2 wickets", scheduledAt: "2025-02-05T09:00:00Z" }] },
      { slug: "final", matches: [{ id: "bpl25-final", home: { id: "ck", name: "Chittagong Kings" }, away: { id: "fb", name: "Fortune Barishal" }, homeWon: false, statusDisplay: "Barishal won by 3 wickets", scheduledAt: "2025-02-07T14:00:00Z" }] },
    ],
  },

  // ─── LPL 2023 ───────────────────────────────────────────────────────────────
  "lpl:2023": {
    leagueName: "Lanka Premier League",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "lpl23-q1", home: { id: "da", name: "Dambulla Aura" }, away: { id: "glt", name: "Galle Titans" }, homeWon: true, statusDisplay: "Dambulla won by 6 wickets", scheduledAt: "2023-08-17T14:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "lpl23-el", home: { id: "blk", name: "B Love Kandy" }, away: { id: "jk", name: "Jaffna Kings" }, homeWon: true, statusDisplay: "Kandy won by 61 runs", scheduledAt: "2023-08-17T09:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "lpl23-q2", home: { id: "blk", name: "B Love Kandy" }, away: { id: "glt", name: "Galle Titans" }, homeWon: true, statusDisplay: "Kandy won by 34 runs", scheduledAt: "2023-08-19T14:00:00Z" }] },
      { slug: "final", matches: [{ id: "lpl23-final", home: { id: "da", name: "Dambulla Aura" }, away: { id: "blk", name: "B Love Kandy" }, homeWon: false, statusDisplay: "Kandy won by 5 wickets", scheduledAt: "2023-08-20T14:00:00Z" }] },
    ],
  },

  // ─── LPL 2024 ───────────────────────────────────────────────────────────────
  "lpl:2024": {
    leagueName: "Lanka Premier League",
    rounds: [
      { slug: "qualifier-1", matches: [{ id: "lpl24-q1", home: { id: "gm", name: "Galle Marvels" }, away: { id: "jk", name: "Jaffna Kings" }, homeWon: true, statusDisplay: "Marvels won by 7 wickets", scheduledAt: "2024-07-18T14:00:00Z" }] },
      { slug: "eliminator", matches: [{ id: "lpl24-el", home: { id: "cs", name: "Colombo Strikers" }, away: { id: "kf", name: "Kandy Falcons" }, homeWon: false, statusDisplay: "Falcons won by 2 wickets", scheduledAt: "2024-07-18T09:00:00Z" }] },
      { slug: "qualifier-2", matches: [{ id: "lpl24-q2", home: { id: "jk", name: "Jaffna Kings" }, away: { id: "kf", name: "Kandy Falcons" }, homeWon: true, statusDisplay: "Jaffna won by 1 run", scheduledAt: "2024-07-20T14:00:00Z" }] },
      { slug: "final", matches: [{ id: "lpl24-final", home: { id: "gm", name: "Galle Marvels" }, away: { id: "jk", name: "Jaffna Kings" }, homeWon: false, statusDisplay: "Jaffna won by 9 wickets", scheduledAt: "2024-07-21T14:00:00Z" }] },
    ],
  },
};

/** Cricket team logo lookup — cached lazily */
let _cricketLogoMap: Map<string, string> | null = null;
function getCricketLogo(teamId: string): string | undefined {
  if (!_cricketLogoMap) {
    _cricketLogoMap = new Map();
    for (const t of getCricketTeams()) {
      if (!t.logo) continue;
      _cricketLogoMap.set(t.id, t.logo);
      // Index by lowercase name and hyphenated form for fuzzy matching
      const lower = t.name.toLowerCase();
      _cricketLogoMap.set(lower, t.logo);
      _cricketLogoMap.set(lower.replace(/\s+/g, "-"), t.logo);
    }
  }
  const key = teamId.toLowerCase();
  return _cricketLogoMap.get(key) ?? _cricketLogoMap.get(key.replace(/-/g, " "));
}

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
            logo: isHomePh ? undefined : getCricketLogo(m.home.id),
            score: null,
            winner: completed && m.homeWon,
            isPlaceholder: isHomePh,
          },
          away: {
            id: m.away.id,
            name: m.away.name,
            shortName: isAwayPh ? "TBD" : cricketAbbr(m.away.name),
            logo: isAwayPh ? undefined : getCricketLogo(m.away.id),
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
  // Strip round suffix: -Xst/nd/rd/th-semi-final, -final, -quarter-final, -qualifier-N, -eliminator
  right = right.replace(/-\d+(?:st|nd|rd|th)-(?:semi-|quarter-)?final$/i, "");
  right = right.replace(/-(?:semi-|quarter-)?final$/i, "");
  right = right.replace(/-(?:\d+(?:st|nd|rd|th)-)?qualifier(?:-\d)?$/i, "");
  right = right.replace(/-eliminator$/i, "");

  const titleCase = (s: string) =>
    s.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return { team1: titleCase(team1Raw), team2: titleCase(right) };
}

// Map round label from ESPNcricinfo HTML to SLUG_META key
function cricketRoundToSlug(label: string): string | null {
  const t = label.toLowerCase();
  if (t.includes("final") && !t.includes("semi") && !t.includes("quarter") && !t.includes("qualifier")) return "final";
  if (t.includes("semi")) return "semifinals";
  if (t.includes("quarter")) return "quarterfinals";
  if (t.includes("qualifier 1") || t.includes("1st qualifier")) return "qualifier-1";
  if (t.includes("qualifier 2") || t.includes("2nd qualifier")) return "qualifier-2";
  if (t.includes("eliminator")) return "eliminator";
  if (t.includes("qualifier")) return "qualifier";
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

    // Only process knockout rounds (skip group stage / league matches)
    const isKnockout = /semi-final|quarter-final|(?<![a-z])final(?!s)|qualifier|eliminator/i.test(href);
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

    const homeId = teams.team1.toLowerCase().replace(/\s+/g, "-");
    const awayId = teams.team2.toLowerCase().replace(/\s+/g, "-");
    matches.push({
      id: `cricket-${matchSlug}`,
      home: {
        id: homeId,
        name: teams.team1,
        shortName: cricketAbbr(teams.team1),
        logo: getCricketLogo(homeId) ?? getCricketLogo(teams.team1.toLowerCase()),
        score: null,  // Cricket scores are complex strings; winner flag drives the UI
        winner: team1Won,
      },
      away: {
        id: awayId,
        name: teams.team2,
        shortName: cricketAbbr(teams.team2),
        logo: getCricketLogo(awayId) ?? getCricketLogo(teams.team2.toLowerCase()),
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

  const pick = cfg.series.find(s => s.season === season);
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
  // Cricket T20 domestic leagues — use ESPNcricinfo HTML scraping for knockout data
  "ipl":           { path: "", name: "Indian Premier League",      cricket: true },
  "psl":           { path: "", name: "Pakistan Super League",      cricket: true },
  "big.bash":      { path: "", name: "Big Bash League",            cricket: true },
  "cplt20":        { path: "", name: "Caribbean Premier League",   cricket: true },
  "sa.domestic":   { path: "", name: "SA20",                       cricket: true },
  "ilt20":         { path: "", name: "International League T20",   cricket: true },
  "mlc":           { path: "", name: "Major League Cricket",       cricket: true },
  "bpl":           { path: "", name: "Bangladesh Premier League",  cricket: true },
  "lpl":           { path: "", name: "Lanka Premier League",       cricket: true },
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
  // Cricket T20 playoff rounds
  "qualifier-1":             { name: "Qualifier 1",     short: "Q1",      order: 42 },
  "eliminator":              { name: "Eliminator",      short: "EL",      order: 44 },
  "qualifier-2":             { name: "Qualifier 2",     short: "Q2",      order: 46 },
  "qualifier":               { name: "Qualifier",       short: "Q",       order: 42 },
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
    // No static data for this exact season — continue to scraper/placeholder below
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
