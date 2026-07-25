import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download Curly Sports App — Free Live Scores App for iOS & Android",
  description:
    "Download Curly Sports for free on iOS and Android. Get live scores, news, predictions, and mini-games for football, cricket, basketball, F1, and 10+ sports.",
  keywords: [
    "download sports app",
    "free sports app",
    "curly sports download",
    "live scores app",
  ],
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
