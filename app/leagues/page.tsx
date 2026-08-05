import type { Metadata } from "next";
import LeaguesClient from "./LeaguesClient";

export const metadata: Metadata = {
  title: "Sports Leagues & Standings — Premier League Table, NBA Standings, IPL Points Table & More",
  description:
    "Live league tables, standings, points tables and season stats on Curly Sports. Premier League, La Liga, Serie A, Bundesliga, NBA, NFL, IPL, F1, MLB, NHL — updated in real time. Full season standings for 150+ leagues.",
  keywords: [
    // Core standings
    "league standings", "league tables", "sports standings", "standings today",
    "points table", "league rankings", "team standings",
    "league table today", "current standings", "season standings",
    // Football / Soccer standings
    "premier league table", "premier league standings", "EPL table",
    "EPL standings", "premier league table 2026", "premier league points table",
    "la liga table", "la liga standings", "serie a table", "serie a standings",
    "bundesliga table", "bundesliga standings", "ligue 1 table",
    "MLS standings", "champions league standings", "champions league table",
    "football standings", "soccer standings", "football league table",
    "premier league table today", "EPL table today",
    // Cricket standings
    "IPL standings", "IPL points table", "IPL points table 2026",
    "cricket standings", "cricket points table", "T20 standings",
    "World Cup standings", "cricket league table",
    // NBA standings
    "NBA standings", "NBA standings 2026", "NBA standings today",
    "NBA conference standings", "NBA Eastern conference standings",
    "NBA Western conference standings", "basketball standings",
    "NBA playoff standings", "NBA rankings",
    // NFL standings
    "NFL standings", "NFL standings 2026", "NFL standings today",
    "NFL division standings", "NFL conference standings",
    "NFL playoff standings", "NFL rankings",
    // Other standings
    "F1 standings", "F1 driver standings", "F1 constructor standings",
    "Formula 1 standings", "F1 standings 2026",
    "MLB standings", "baseball standings", "NHL standings",
    "hockey standings", "tennis rankings", "ATP rankings",
    "WTA rankings", "golf rankings", "PGA standings",
    // General
    "sports tables", "sports rankings", "league results",
    "season results", "all leagues", "sports leagues",
    "football leagues", "basketball leagues", "cricket leagues",
  ],
  alternates: { canonical: "https://curlysports.com/leagues" },
  openGraph: {
    title: "Sports Leagues & Standings — Curly Sports",
    description: "Live league tables and standings for Premier League, La Liga, NBA, NFL, IPL, F1 and 150+ leagues.",
    url: "https://curlysports.com/leagues",
  },
};

export default function LeaguesPage() {
  return <LeaguesClient />;
}
