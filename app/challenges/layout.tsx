import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sports Prediction Challenges — Make Picks, Compete & Win | Curly Sports",
  description:
    "Join free sports prediction challenges on Curly Sports. Predict match scores, make your picks, compete with fans worldwide, and test your sports knowledge across football, cricket, NBA, NFL, F1, and more.",
  keywords: [
    "sports predictions", "sports prediction game", "prediction challenges",
    "match predictions", "score predictions", "predict match scores",
    "sports picks", "sports betting predictions", "free predictions",
    "football predictions", "soccer predictions", "premier league predictions",
    "cricket predictions", "IPL predictions", "NBA predictions",
    "NFL predictions", "F1 predictions", "tennis predictions",
    "who will win today", "match winner prediction",
    "sports forecasting", "prediction app", "sports prediction app",
    "predict and win", "fan predictions", "sports challenge",
    "prediction league", "prediction contest", "daily predictions",
    "sports tipping", "tip the winner", "pick the winner",
    "score prediction game", "predict sports results",
  ],
  alternates: { canonical: "https://curlysports.com/challenges" },
  openGraph: {
    title: "Sports Prediction Challenges — Curly Sports",
    description: "Free sports prediction challenges — predict scores, compete with fans, and test your knowledge.",
    url: "https://curlysports.com/challenges",
  },
};

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://curlysports.com" },
      { "@type": "ListItem", position: 2, name: "Challenges", item: "https://curlysports.com/challenges" },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  );
}
