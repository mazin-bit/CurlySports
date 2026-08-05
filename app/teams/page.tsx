import type { Metadata } from "next";
import TeamsClient from "./TeamsClient";

export const metadata: Metadata = {
  title: "Sports Teams — Squads, Rosters, Stats & Schedules for Every Sport",
  description:
    "Browse every sports team on Curly Sports — full squad rosters, player stats, standings, schedules, and season form for Premier League, La Liga, NBA, NFL, IPL, MLB, NHL, F1 and 150+ leagues worldwide.",
  keywords: [
    // Core teams
    "sports teams", "team rosters", "team squads", "team stats",
    "team standings", "team schedules", "sports team profiles",
    "team players", "team lineup", "team information",
    // Football / Soccer teams
    "football teams", "soccer teams", "premier league teams",
    "la liga teams", "serie a teams", "bundesliga teams",
    "MLS teams", "champions league teams", "EPL teams",
    "Manchester United squad", "Liverpool squad", "Arsenal squad",
    "Barcelona squad", "Real Madrid squad", "Chelsea squad",
    "Manchester City squad", "PSG squad", "Bayern Munich squad",
    "football club", "soccer club", "football squad",
    // Cricket teams
    "cricket teams", "IPL teams", "IPL teams 2026",
    "cricket squad", "national cricket teams",
    "Mumbai Indians squad", "CSK squad", "RCB squad",
    // NBA teams
    "NBA teams", "basketball teams", "NBA team rosters",
    "NBA roster", "Lakers roster", "Celtics roster",
    "Warriors roster", "NBA team stats",
    // NFL teams
    "NFL teams", "NFL rosters", "NFL team stats",
    "NFL team roster", "football teams NFL",
    // Other
    "MLB teams", "NHL teams", "F1 teams", "MMA fighters",
    "team rankings", "best sports teams", "sports clubs",
    "team performance", "team history", "team records",
  ],
  alternates: { canonical: "https://curlysports.com/teams" },
  openGraph: {
    title: "Sports Teams — Rosters, Stats & Schedules",
    description: "Full squad rosters, player stats and standings for every team across 150+ leagues.",
    url: "https://curlysports.com/teams",
  },
};

export default function TeamsPage() {
  return <TeamsClient />;
}
