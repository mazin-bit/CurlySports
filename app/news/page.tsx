import AppShell from "@/components/AppShell";
import NewsClient from "./NewsClient";

export const metadata = {
  title: "Sports News — Latest Football, Basketball, F1 & Cricket Headlines",
  description:
    "Breaking sports news from BBC Sport, ESPN, Sky Sports and more — curated and updated in real time. Stay ahead with Curly Sports news.",
  alternates: { canonical: "https://curlysports.com/news" },
  openGraph: {
    title: "Sports News — Curly Sports",
    description: "Breaking sports headlines updated in real time from top sources worldwide.",
    url: "https://curlysports.com/news",
  },
};

export default function NewsPage() {
  return (
    <AppShell active="news" title="News" titleKey="news.title" subtitleKey="news.subtitle">
      <div className="stack">
        <NewsClient />
      </div>
    </AppShell>
  );
}
