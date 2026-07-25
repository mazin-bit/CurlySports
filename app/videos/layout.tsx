import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sports Videos & Highlights — Curly Sports",
  description:
    "Watch the latest sports video highlights, match replays, and analysis on Curly Sports.",
  keywords: ["sports videos", "match highlights", "sports highlights"],
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
