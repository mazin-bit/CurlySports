import AppShell from "@/components/AppShell";
import NewsClient from "./NewsClient";

export const metadata = {
  title: "Sports News Today — Latest Football, Cricket, NBA, NFL, F1 Headlines & Updates",
  description:
    "Breaking sports news and latest headlines updated in real time. Football, soccer, cricket, NBA, NFL, F1, tennis, MLB, NHL — curated from BBC Sport, ESPN, Sky Sports and 50+ sources on Curly Sports.",
  keywords: [
    "sports news", "sports news today", "latest sports news", "breaking sports news",
    "sports headlines", "sports updates", "sports news live", "today sports news",
    "sports news app", "best sports news app", "sports news website",
    "football news", "football news today", "soccer news", "soccer news today",
    "premier league news", "EPL news", "la liga news", "transfer news",
    "transfer news today", "football transfer news", "soccer transfer rumors",
    "cricket news", "cricket news today", "IPL news", "IPL news today",
    "NBA news", "NBA news today", "basketball news", "NBA trade rumors",
    "NFL news", "NFL news today", "NFL trade rumors", "NFL draft news",
    "F1 news", "F1 news today", "Formula 1 news", "F1 latest news",
    "tennis news", "tennis news today", "ATP news", "WTA news",
    "MLB news", "baseball news", "NHL news", "hockey news",
    "UFC news", "MMA news", "boxing news", "golf news",
    "sports articles", "sports breaking news", "live sports news",
    "what happened in sports today", "sports highlights today",
  ],
  alternates: { canonical: "https://curlysports.com/news" },
  openGraph: {
    title: "Sports News Today — Curly Sports",
    description: "Breaking sports news and latest headlines for football, cricket, NBA, NFL, F1 and more — updated every minute.",
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
