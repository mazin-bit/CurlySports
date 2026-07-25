import type { Metadata } from "next";
import TeamClient from "./TeamClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://curlysports.com";
    const res = await fetch(`${baseUrl}/api/espn/teams?id=${id}`, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      const name = data.team?.displayName || data.team?.name || "Team";
      const sport = data.team?.sport?.name || "";
      return {
        title: `${name} — Roster, Stats & Schedule`,
        description: `Follow ${name}${sport ? ` (${sport})` : ""} — roster, standings, match schedule, and live scores on Curly Sports.`,
        keywords: [`${name} roster`, `${name} schedule`, `${name} stats`, name].filter(Boolean),
        alternates: { canonical: `/teams/${id}` },
        openGraph: {
          title: `${name} — Team Profile`,
          description: `${name}'s roster, stats, and schedule on Curly Sports.`,
        },
      };
    }
  } catch {}
  return {
    title: "Team Profile — Curly Sports",
    description: "Team roster, stats, standings, and schedule on Curly Sports.",
  };
}

export default async function TeamPage({ params }: Props) {
  const { id } = await params;

  let jsonLd = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://curlysports.com";
    const res = await fetch(`${baseUrl}/api/espn/teams?id=${id}`, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      const team = data.team;
      if (team) {
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "SportsTeam",
          name: team.displayName || team.name,
          sport: team.sport?.name,
          url: `https://curlysports.com/teams/${id}`,
          logo: team.logos?.[0]?.href,
          memberOf: team.league?.name ? {
            "@type": "SportsOrganization",
            name: team.league.name,
          } : undefined,
        };
      }
    }
  } catch {}

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <TeamClient />
    </>
  );
}
