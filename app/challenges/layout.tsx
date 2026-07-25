import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sports Prediction Challenges — Curly Sports",
  description:
    "Join sports prediction challenges on Curly Sports. Make your picks, compete with fans, and test your sports knowledge across football, cricket, NBA, and more.",
  keywords: ["sports predictions", "prediction challenges", "sports quiz"],
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
