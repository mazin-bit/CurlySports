import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Favorite Teams & Players — Personalized Sports Dashboard",
  description:
    "Save your favorite teams and players on Curly Sports. Get personalized live scores, news, and match updates for the teams you follow. Track Premier League, NBA, IPL, NFL, F1 and more.",
  keywords: [
    "favorite teams", "favorite sports teams", "follow teams",
    "personalized sports", "my teams", "sports dashboard",
    "follow players", "favorite players", "sports watchlist",
    "team tracker", "player tracker", "sports favorites",
    "custom sports feed", "personalized scores",
    "follow premier league", "follow NBA", "follow NFL",
    "follow IPL", "follow F1", "sports alerts",
    "team notifications", "match alerts",
  ],
  alternates: { canonical: "https://curlysports.com/favorites" },
  openGraph: {
    title: "My Favorites — Curly Sports",
    description: "Save and track your favorite teams and players with personalized live scores and news.",
    url: "https://curlysports.com/favorites",
  },
};

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
