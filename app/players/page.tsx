import type { Metadata } from "next";
import PlayersClient from "./PlayersClient";

export const metadata: Metadata = {
  title: "Sports Players — Stats, Profiles & Performance",
  description:
    "Search and explore player profiles on Curly Sports. Detailed stats, performance history, and career data for football, basketball, cricket, F1 and more.",
  alternates: { canonical: "https://curlysports.com/players" },
  openGraph: {
    title: "Sports Players — Curly Sports",
    description: "Detailed player profiles, stats and career performance across all sports.",
    url: "https://curlysports.com/players",
  },
};

export default function PlayersPage() {
  return <PlayersClient />;
}
