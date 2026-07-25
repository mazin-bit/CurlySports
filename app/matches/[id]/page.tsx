import type { Metadata } from "next";
import MatchClient from "./MatchClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://curlysports.com";
    const res = await fetch(`${baseUrl}/api/espn/match?id=${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      const home = data.header?.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "home")?.team?.displayName || "Home";
      const away = data.header?.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "away")?.team?.displayName || "Away";
      return {
        title: `${home} vs ${away} — Live Score & Match Details`,
        description: `Live score and match details for ${home} vs ${away}. Goals, cards, lineups, and minute-by-minute updates on Curly Sports.`,
        keywords: [`${home} vs ${away}`, `${home} score`, `${away} score`, "live score", "match details"],
        alternates: { canonical: `/matches/${id}` },
        openGraph: {
          title: `${home} vs ${away} — Live Score`,
          description: `Follow ${home} vs ${away} live on Curly Sports.`,
        },
      };
    }
  } catch {}
  return {
    title: "Match Details — Curly Sports",
    description: "Live match details, scores, lineups, and events on Curly Sports.",
  };
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params;

  let jsonLd = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://curlysports.com";
    const res = await fetch(`${baseUrl}/api/espn/match?id=${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      const comp = data.header?.competitions?.[0];
      const home = comp?.competitors?.find((c: any) => c.homeAway === "home");
      const away = comp?.competitors?.find((c: any) => c.homeAway === "away");
      if (home && away) {
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          name: `${home.team?.displayName} vs ${away.team?.displayName}`,
          startDate: comp?.date || new Date().toISOString(),
          location: {
            "@type": "Place",
            name: data.gameInfo?.venue?.fullName || "Stadium",
          },
          homeTeam: { "@type": "SportsTeam", name: home.team?.displayName },
          awayTeam: { "@type": "SportsTeam", name: away.team?.displayName },
          description: `Live score and match details for ${home.team?.displayName} vs ${away.team?.displayName} on Curly Sports.`,
        };
      }
    }
  } catch {}

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <MatchClient />
    </>
  );
}
