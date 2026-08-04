import type { Metadata } from "next";
import LandingPage from "./LandingClient";

const SITE_URL = "https://curlysports.com";

export const metadata: Metadata = {
  title: "Curly Sports — Live Scores, Teams, Players & News | CurlySports.com",
  description:
    "Curly Sports is the free sports platform for live scores, match details, team stats, player profiles, league standings, fan debates, and breaking news across football, cricket, basketball, F1, NFL, tennis, baseball, hockey, MMA and more. Not curling — Curly Sports!",
  keywords: [
    "curly sports", "curlysports", "curlysports.com", "curly sports app",
    "curly sports live scores", "curly sports news",
    "live scores", "football scores", "basketball scores", "cricket scores",
    "sports news", "match results", "player stats", "team stats",
    "sports app", "F1 live", "NBA scores", "NFL scores",
    "free sports app", "sports hub", "sports dashboard",
    "EPL live scores", "IPL live scores", "La Liga scores",
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Curly Sports",
    title: "Curly Sports — Live Scores, Teams, Players & News",
    description:
      "Your free sports hub — live scores, match details, team stats, player profiles, leagues, debates, and breaking sports news for 10+ sports.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Curly Sports — Your Sports Hub" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@curlysportsofcl",
    creator: "@curlysportsofcl",
    title: "Curly Sports — Live Scores, Teams, Players & News",
    description:
      "Your free sports hub — live scores, match details, team stats, player profiles, leagues, debates, and breaking sports news.",
    images: ["/opengraph-image"],
  },
};

export default function Page() {
  return (
    <>
      {/* Server-rendered SEO content — visible to crawlers, hidden visually */}
      <div
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          borderWidth: 0,
        }}
      >
        <h1>Curly Sports — Live Scores, Teams, Players &amp; Sports News</h1>
        <p>
          Welcome to Curly Sports (CurlySports.com) — the free sports platform delivering real-time live scores,
          in-depth match details, team statistics, player profiles, league standings, fan debates, prediction challenges,
          and breaking sports news. Curly Sports covers football (soccer), cricket, basketball, Formula 1, NFL,
          tennis, baseball, ice hockey, MMA, golf, boxing, and esports.
        </p>
        <h2>Live Scores &amp; Real-Time Updates</h2>
        <p>
          Get live scores updated every 10 seconds via server-sent events. Follow Premier League, La Liga, Serie A,
          Bundesliga, Ligue 1, MLS, IPL, NBA, MLB, NHL, and 150+ leagues worldwide on Curly Sports.
        </p>
        <h2>Sports Covered by Curly Sports</h2>
        <ul>
          <li>Football / Soccer — EPL, La Liga, Serie A, Bundesliga, Ligue 1, MLS, Champions League</li>
          <li>Cricket — IPL, T20 World Cup, Test matches, ODI, BBL, CPL, PSL</li>
          <li>Basketball — NBA, EuroLeague, FIBA, NCAA</li>
          <li>Formula 1 — Race results, qualifying, practice, driver standings</li>
          <li>NFL — American Football scores, standings, player stats</li>
          <li>Tennis — ATP, WTA, Grand Slams (Australian Open, French Open, Wimbledon, US Open)</li>
          <li>Baseball — MLB scores, standings, player statistics</li>
          <li>Ice Hockey — NHL scores, standings, player stats</li>
          <li>MMA — UFC events, fight results, fighter profiles</li>
          <li>Golf — PGA Tour, DP World Tour, major championships</li>
          <li>Boxing — Fight results, rankings, upcoming bouts</li>
        </ul>
        <h2>Features</h2>
        <ul>
          <li>Real-time live scores for 10+ sports and 150+ leagues</li>
          <li>Detailed match pages with lineups, goals, cards, and momentum</li>
          <li>Team profiles with rosters, form, and standings</li>
          <li>Player profiles with career stats and performance data</li>
          <li>Breaking sports news aggregated from top sources</li>
          <li>Fan debates and polls on trending sports topics</li>
          <li>Prediction challenges and mini-games</li>
          <li>Favorite teams and players tracking</li>
          <li>Free mobile app for iOS and Android</li>
        </ul>
        <h2>Download Curly Sports App</h2>
        <p>
          Download the free Curly Sports app on the App Store and Google Play for live score notifications
          and on-the-go sports updates. Available at curlysports.com/download.
        </p>
      </div>
      <LandingPage />
    </>
  );
}
