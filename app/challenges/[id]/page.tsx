import type { Metadata } from "next";
import ChallengeClient from "./ChallengeClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://curlysports.com";
    const res = await fetch(`${baseUrl}/api/challenges/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      const challenge = data.challenge ?? data;
      const teamA = typeof challenge.teamA === "string" ? challenge.teamA : challenge.teamA?.name || "Team A";
      const teamB = typeof challenge.teamB === "string" ? challenge.teamB : challenge.teamB?.name || "Team B";
      const title = challenge.title || `${teamA} vs ${teamB} Challenge`;
      return {
        title: `${title} — Mystery Prize Challenge`,
        description: `Predict the winner of ${teamA} vs ${teamB} and win a mystery prize on Curly Sports. Vote, invite friends, and earn extra entries.`,
        keywords: [`${teamA} vs ${teamB}`, "sports challenge", "mystery prize", "prediction", "curly sports"],
        alternates: { canonical: `/challenges/${id}` },
        openGraph: {
          title: `${title} — Mystery Prize Challenge`,
          description: `Predict ${teamA} vs ${teamB} and win a mystery prize on Curly Sports.`,
        },
      };
    }
  } catch {}
  return {
    title: "Challenge — Curly Sports",
    description: "Predict match outcomes, invite friends, and win mystery prizes on Curly Sports.",
  };
}

export default async function ChallengePage({ params }: Props) {
  const { id } = await params;
  return <ChallengeClient />;
}
