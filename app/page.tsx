import LandingPage from "./LandingClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curly Sports — Free Live Scores, Teams, Players & Sports News | CurlySports.com",
  description:
    "Curly Sports (CurlySports.com) is a free sports platform with real-time live scores, team stats, player profiles, league standings, debates, and breaking news for football, cricket, basketball, F1, NFL, tennis, baseball, hockey, MMA, and more. Not curling — Curly Sports!",
  keywords: [
    "curly sports", "curlysports", "curlysports.com", "curly sports app",
    "live scores", "sports scores today", "live sports", "live sports scores",
    "football scores today", "soccer scores today", "cricket live score",
    "NBA scores today", "NFL scores today", "F1 live", "tennis scores",
    "sports news today", "latest sports news", "breaking sports news",
    "sports app", "free sports app", "best sports app", "sports hub",
    "premier league scores", "la liga scores", "IPL scores", "MLB scores",
    "NHL scores", "UFC results", "sports trivia", "sports mini games",
    "sports debate", "sports predictions", "sports highlights",
    "live score app", "sports tracker", "sports dashboard",
    "match scores today", "today match score", "real time scores",
    "sports updates", "sports results", "match results today",
    "football live", "cricket live", "basketball live", "soccer live",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Curly Sports — Free Live Scores, Teams, Players & Sports News",
    description: "Your free sports hub — live scores, stats, news, debates, mini-games for football, cricket, NBA, NFL, F1, tennis and 10+ sports.",
    url: "https://curlysports.com",
  },
};

export default function Page() {
  return <LandingPage />;
}
