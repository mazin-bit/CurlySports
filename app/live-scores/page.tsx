import AppShell from "@/components/AppShell";
import LiveScoresClient from "./LiveScoresClient";

export const metadata = { title: "Live Scores · Curly Sports" };

export default function LiveScoresPage() {
  return (
    <AppShell active="live" title="Live Scores" subtitle="Updated every 30s">
      <div className="stack">
        <LiveScoresClient />
      </div>
    </AppShell>
  );
}
