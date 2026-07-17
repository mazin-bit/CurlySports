import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SWRProvider } from "@/components/SWRProvider";
import { SportProvider } from "@/contexts/SportContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PageViewTracker } from "@/components/PageViewTracker";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

const SITE_URL = "https://curlysports.com";

export const metadata: Metadata = {
  title: {
    default: "Curly Sports — Live Scores, Teams, Players & News",
    template: "%s · Curly Sports",
  },
  description:
    "Curly Sports is your ultimate sports hub — live scores, match details, team stats, player profiles, leagues, debates, and breaking sports news for football, basketball, F1, cricket & more.",
  keywords: [
    "curly sports", "curlysports", "live scores", "football scores",
    "basketball scores", "sports news", "match results", "player stats",
    "team stats", "sports app", "F1 live", "cricket scores", "NBA scores",
    "NFL scores", "sports hub", "sports dashboard",
  ],
  authors: [{ name: "Curly Sports", url: SITE_URL }],
  creator: "Curly Sports",
  publisher: "Curly Sports",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Curly Sports",
    title: "Curly Sports — Live Scores, Teams, Players & News",
    description:
      "Your ultimate sports hub — live scores, match details, team stats, player profiles, leagues, debates, and breaking sports news.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Curly Sports — Your Sports Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@curlysportsofcl",
    creator: "@curlysportsofcl",
    title: "Curly Sports — Live Scores, Teams, Players & News",
    description:
      "Your ultimate sports hub — live scores, match details, team stats, player profiles, leagues, debates, and breaking sports news.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Curly Sports",
        description: "Your ultimate sports hub — live scores, teams, players, leagues, debates & news.",
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/players?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Curly Sports",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/icon.png`,
          width: 512,
          height: 512,
        },
        sameAs: [
          "https://x.com/curlysportsofcl",
          "https://www.instagram.com/curlysportsofficial/",
          "https://www.youtube.com/@curlysportsofficial",
        ],
      },
    ],
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SWRProvider>
          <LanguageProvider>
            <SportProvider>{children}</SportProvider>
          </LanguageProvider>
        </SWRProvider>
        <PageViewTracker />
        <Analytics />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2394936440613571"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
