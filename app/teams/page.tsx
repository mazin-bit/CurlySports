import type { Metadata } from "next";
import TeamsClient from "./TeamsClient";

export const metadata: Metadata = {
  title: "Sports Teams — Squads, Stats & Rosters",
  description:
    "Explore every team on Curly Sports — squad rosters, player stats, standings and season form for football, basketball, cricket, F1 and more.",
  alternates: { canonical: "https://curlysports.com/teams" },
  openGraph: {
    title: "Sports Teams — Curly Sports",
    description: "Full squad rosters, player stats and standings for every team.",
    url: "https://curlysports.com/teams",
  },
};

export default function TeamsPage() {
  return <TeamsClient />;
}
