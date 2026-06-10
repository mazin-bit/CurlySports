import type { Metadata } from "next";
import LeaguesClient from "./LeaguesClient";

export const metadata: Metadata = {
  title: "Sports Leagues & Standings — Premier League, NBA, IPL & More",
  description:
    "Full league tables, standings, and season stats on Curly Sports — Premier League, La Liga, NBA, NFL, IPL, Formula 1 and more. Updated live.",
  alternates: { canonical: "https://curlysports.com/leagues" },
  openGraph: {
    title: "Sports Leagues & Standings — Curly Sports",
    description: "Live league tables and standings for Premier League, NBA, IPL, F1 and more.",
    url: "https://curlysports.com/leagues",
  },
};

export default function LeaguesPage() {
  return <LeaguesClient />;
}
