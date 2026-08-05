import AppShell from "@/components/AppShell";
import LiveScoresClient from "./LiveScoresClient";

export const metadata = {
  title: "Live Sports Scores Today — Football, Cricket, NBA, NFL, F1 | Real-Time Updates",
  description:
    "Free real-time live sports scores updated every 10 seconds. Football, soccer, cricket, NBA, NFL, F1, tennis, MLB, NHL, UFC — all live scores in one place on Curly Sports. Never miss a goal, wicket, touchdown, or lap.",
  keywords: [
    "live scores", "live sports scores", "live scores today", "live score updates",
    "sports scores today", "scores today", "real time scores", "live score app",
    "free live scores", "live match scores", "today match score",
    "sports score tracker", "live scoreboard", "match scores today",
    "football scores today", "football live scores", "soccer scores today",
    "premier league scores today", "premier league live scores", "EPL scores today",
    "la liga scores today", "serie a scores today", "bundesliga scores today",
    "champions league scores", "football results today", "soccer results today",
    "who is playing today football", "football match today",
    "cricket scores today", "cricket live scores", "IPL scores today",
    "IPL live score", "T20 scores today", "test match scores",
    "live cricket score", "cricket results today",
    "NBA scores today", "NBA live scores", "basketball scores today",
    "NBA scores right now", "NBA games today scores",
    "who is winning the NBA game", "NBA scoreboard",
    "NFL scores today", "NFL live scores", "NFL scores right now",
    "NFL games today", "NFL results today", "NFL scoreboard",
    "F1 live scores", "F1 live timing", "F1 race results today",
    "Formula 1 live", "F1 results today", "grand prix live",
    "tennis scores today", "tennis live scores", "ATP scores today",
    "MLB scores today", "baseball scores today", "MLB live scores",
    "NHL scores today", "hockey scores today", "NHL live scores",
    "UFC results today", "UFC scores tonight", "MMA results today",
    "live sports", "sports today", "sports scores", "sports results",
    "all sports scores", "sports scoreboard", "what games are on today",
  ],
  alternates: { canonical: "https://curlysports.com/live-scores" },
  openGraph: {
    title: "Live Sports Scores Today — Curly Sports",
    description: "Real-time live scores for football, cricket, NBA, NFL, F1, tennis, MLB, NHL, UFC and more — updated every 10 seconds.",
    url: "https://curlysports.com/live-scores",
  },
};

export default function LiveScoresPage() {
  return (
    <AppShell active="live" title="Live Scores" titleKey="liveScores.title" subtitleKey="liveScores.subtitle">
      <div className="stack">
        <LiveScoresClient />
      </div>
    </AppShell>
  );
}
