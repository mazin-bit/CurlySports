import AppShell from "@/components/AppShell";
import styles from "./dashboard.module.css";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Curly Sports — Live Scores, Teams, Players & Sports News",
  description:
    "Your personal sports dashboard. Get live match scores, latest sports news, standings, and top player stats — all in one place on Curly Sports.",
  alternates: { canonical: "https://curlysports.com/dashboard" },
  openGraph: {
    title: "Curly Sports — Your Sports Dashboard",
    description: "Live scores, news, standings and more — all personalised for you.",
    url: "https://curlysports.com/dashboard",
  },
};

export default function DashboardPage() {
  return (
    <AppShell active="home" title="Curly Sports" subtitle="Your sports hub">
      <div className={styles.stack}>
        <DashboardClient />
      </div>
    </AppShell>
  );
}
