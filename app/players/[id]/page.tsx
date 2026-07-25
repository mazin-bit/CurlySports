import type { Metadata } from "next";
import PlayerClient from "./PlayerClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://curlysports.com";
    const res = await fetch(`${baseUrl}/api/espn/player?id=${id}`, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      const name = data.athlete?.displayName || data.athlete?.fullName || "Player";
      const team = data.athlete?.team?.displayName || "";
      const position = data.athlete?.position?.displayName || "";
      return {
        title: `${name} — Stats, Profile & News`,
        description: `${name}${position ? `, ${position}` : ""}${team ? ` for ${team}` : ""}. View full stats, career profile, and latest news on Curly Sports.`,
        keywords: [`${name} stats`, `${name} profile`, name, team].filter(Boolean),
        alternates: { canonical: `/players/${id}` },
        openGraph: {
          title: `${name} — Player Profile`,
          description: `${name}'s complete stats and profile on Curly Sports.`,
        },
      };
    }
  } catch {}
  return {
    title: "Player Profile — Curly Sports",
    description: "Player stats, profile, and career information on Curly Sports.",
  };
}

export default async function PlayerPage({ params }: Props) {
  const { id } = await params;

  let jsonLd = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://curlysports.com";
    const res = await fetch(`${baseUrl}/api/espn/player?id=${id}`, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      const athlete = data.athlete;
      if (athlete) {
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "Person",
          name: athlete.displayName || athlete.fullName,
          jobTitle: `Professional ${athlete.position?.displayName || "Athlete"}`,
          birthDate: athlete.dateOfBirth,
          nationality: athlete.citizenship,
          memberOf: athlete.team?.displayName ? {
            "@type": "SportsTeam",
            name: athlete.team.displayName,
          } : undefined,
          image: athlete.headshot?.href,
          url: `https://curlysports.com/players/${id}`,
        };
      }
    }
  } catch {}

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <PlayerClient />
    </>
  );
}
