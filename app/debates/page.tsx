import type { Metadata } from "next";
import FunZoneClient from "./FunZoneClient";

export const metadata: Metadata = {
  title: "Sports Debates, Polls & Hot Takes — Messi vs Ronaldo, GOAT Debates & More",
  description:
    "Join live sports debates, vote in polls, and settle arguments with real stats on Curly Sports. GOAT debates, Messi vs Ronaldo, best team ever, hot takes — backed by actual data, not just opinions.",
  keywords: [
    // Core debates
    "sports debates", "sports debate", "sports debates online", "sports polls",
    "sports opinions", "sports hot takes", "sports arguments",
    "sports discussion", "sports forum", "sports community",
    "sports debate app", "sports debate website",
    // Famous debates
    "Messi vs Ronaldo", "GOAT debate", "GOAT sports debate",
    "best player ever", "best footballer ever", "greatest of all time",
    "Messi or Ronaldo", "who is better Messi or Ronaldo",
    "best team ever", "best sports team ever",
    "LeBron vs Jordan", "LeBron vs MJ", "greatest basketball player",
    "best NBA player ever", "Brady vs Manning",
    // Football debates
    "football debates", "soccer debates", "best football player",
    "best footballer in the world", "best premier league player",
    "best striker in the world", "football hot takes",
    "premier league debate", "champions league debate",
    // Cricket debates
    "cricket debates", "best cricketer ever", "Sachin vs Virat",
    "best batsman ever", "best bowler ever", "IPL debate",
    // NBA debates
    "NBA debates", "basketball debates", "best NBA player",
    "NBA hot takes", "NBA GOAT debate",
    // Polls & voting
    "sports polls", "sports voting", "fan polls", "sports survey",
    "sports predictions", "match predictions", "score predictions",
    "who will win", "sports fan community",
    // General
    "sports talk", "sports chat", "sports conversation",
    "sports opinion app", "sports fan app", "argue about sports",
    "sports social media", "sports engagement",
  ],
  alternates: { canonical: "https://curlysports.com/debates" },
  openGraph: {
    title: "Sports Debates & Hot Takes — Curly Sports",
    description: "Join GOAT debates, Messi vs Ronaldo polls, and sports arguments backed by real stats.",
    url: "https://curlysports.com/debates",
  },
};

export default function FunZonePage() {
  return <FunZoneClient />;
}
