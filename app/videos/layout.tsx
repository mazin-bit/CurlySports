import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sports Videos & Highlights — Watch Football, NBA, Cricket & F1 Replays",
  description:
    "Watch the latest sports video highlights, match replays, goal compilations, and expert analysis on Curly Sports. Football, soccer, NBA, cricket, NFL, F1, tennis — all the best sports moments in one place.",
  keywords: [
    "sports videos", "sports highlights", "match highlights", "sports replays",
    "football highlights", "soccer highlights", "premier league highlights",
    "la liga highlights", "champions league highlights", "EPL highlights",
    "goal highlights", "best goals", "football goals today",
    "NBA highlights", "basketball highlights", "NBA top plays",
    "cricket highlights", "IPL highlights", "cricket match highlights",
    "NFL highlights", "F1 highlights", "tennis highlights",
    "match replay", "sports clips", "sports compilation",
    "best sports moments", "sports analysis", "sports commentary",
    "football videos", "soccer videos", "NBA videos", "sports video app",
    "watch sports highlights", "free sports videos",
    "today match highlights", "yesterday highlights",
  ],
  alternates: { canonical: "https://curlysports.com/videos" },
  openGraph: {
    title: "Sports Videos & Highlights — Curly Sports",
    description: "Watch football, NBA, cricket, NFL and F1 highlights, replays and best moments.",
    url: "https://curlysports.com/videos",
  },
};

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://curlysports.com" },
      { "@type": "ListItem", position: 2, name: "Videos", item: "https://curlysports.com/videos" },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  );
}
