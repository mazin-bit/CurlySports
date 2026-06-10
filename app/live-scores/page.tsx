import AppShell from "@/components/AppShell";
import LiveScoresClient from "./LiveScoresClient";

export const metadata = {
  title: "Live Sports Scores Today — Football, Basketball, F1, Cricket",
  description:
    "Watch live sports scores update in real time on Curly Sports. Football, NBA, NFL, F1, IPL and more — never miss a goal, point, or lap.",
  alternates: { canonical: "https://curlysports.com/live-scores" },
  openGraph: {
    title: "Live Sports Scores — Curly Sports",
    description: "Real-time live scores for football, basketball, F1, cricket and more.",
    url: "https://curlysports.com/live-scores",
  },
};

export default function LiveScoresPage() {
  return (
    <AppShell active="live" title="Live Scores" subtitle="Updated every 30s">
      <div className="stack">
        <LiveScoresClient />
      </div>
    </AppShell>
  );
}
