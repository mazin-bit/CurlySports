import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download Curly Sports App — Free Live Scores App for iOS & Android",
  description:
    "Download Curly Sports for free on iOS and Android. Get real-time live scores, breaking sports news, predictions, trivia, and mini-games for football, cricket, NBA, NFL, F1, tennis, baseball, hockey, and 10+ sports.",
  keywords: [
    "download sports app", "free sports app", "curly sports download",
    "live scores app", "sports app download", "best sports app",
    "sports app iOS", "sports app Android", "sports app iPhone",
    "free live scores app", "live score app download",
    "download live scores", "sports app free download",
    "best live score app", "best sports score app",
    "sports news app", "sports news app download",
    "football app", "soccer app", "cricket app", "NBA app",
    "NFL app", "F1 app", "tennis app",
    "football scores app", "cricket scores app", "basketball app",
    "sports tracker app", "sports updates app",
    "free sports app no ads", "all sports app",
    "multi sport app", "sports hub app",
    "curly sports iOS", "curly sports Android",
    "curly sports app store", "curly sports google play",
    "sports app 2026", "best sports app 2026",
  ],
  alternates: { canonical: "https://curlysports.com/download" },
  openGraph: {
    title: "Download Curly Sports — Free Sports App",
    description: "Free live scores, news, trivia and mini-games app for iOS & Android — download Curly Sports now.",
    url: "https://curlysports.com/download",
  },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://curlysports.com" },
      { "@type": "ListItem", position: 2, name: "Download", item: "https://curlysports.com/download" },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  );
}
