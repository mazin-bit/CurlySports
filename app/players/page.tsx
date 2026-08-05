import type { Metadata } from "next";
import PlayersClient from "./PlayersClient";

export const metadata: Metadata = {
  title: "Sports Players — Stats, Profiles, Rankings & Career Data",
  description:
    "Search and explore detailed player profiles on Curly Sports. Stats, career history, performance data, and rankings for football, soccer, cricket, NBA, NFL, F1, tennis, MLB, and more. Find any player across 150+ leagues.",
  keywords: [
    // Core players
    "sports players", "player stats", "player profiles", "player rankings",
    "sports statistics", "player performance", "career stats",
    "player database", "player search", "athlete profiles",
    "player biography", "player information", "player records",
    // Football / Soccer players
    "football players", "soccer players", "premier league players",
    "best football players", "top scorers", "football player stats",
    "Messi stats", "Ronaldo stats", "Haaland stats", "Mbappe stats",
    "Salah stats", "football goalscorers", "soccer player profiles",
    "player transfer history", "player career",
    // Cricket players
    "cricket players", "cricket player stats", "IPL players",
    "best cricket batsman", "best cricket bowler", "cricket batting stats",
    "cricket bowling stats", "T20 player stats",
    // NBA players
    "NBA players", "basketball players", "NBA player stats",
    "best NBA players", "NBA player rankings", "basketball player stats",
    "LeBron stats", "Curry stats", "NBA scoring leaders",
    // NFL players
    "NFL players", "NFL player stats", "football players NFL",
    "NFL player rankings", "NFL quarterback stats",
    // Other
    "F1 drivers", "F1 driver stats", "tennis players", "ATP rankings",
    "WTA rankings", "MLB players", "NHL players", "UFC fighters",
    "MMA fighters", "boxing fighters", "golf players",
    "sports stars", "famous athletes", "top athletes",
    "athlete statistics", "player comparison",
  ],
  alternates: { canonical: "https://curlysports.com/players" },
  openGraph: {
    title: "Sports Players — Stats, Profiles & Rankings",
    description: "Detailed player profiles, stats and career data across all sports on Curly Sports.",
    url: "https://curlysports.com/players",
  },
};

export default function PlayersPage() {
  return <PlayersClient />;
}
