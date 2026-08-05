import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SWRProvider } from "@/components/SWRProvider";
import { SportProvider } from "@/contexts/SportContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PageViewTracker } from "@/components/PageViewTracker";
import { Analytics } from "@vercel/analytics/next";
import GlobalAnimations from "@/components/GlobalAnimations";

const SITE_URL = "https://curlysports.com";

export const metadata: Metadata = {
  title: {
    default: "Curly Sports — Live Scores, Teams, Players & News",
    template: "%s · Curly Sports",
  },
  description:
    "Curly Sports (CurlySports.com) is your free sports hub — live scores, match details, team stats, player profiles, leagues, debates, and breaking sports news for football, cricket, basketball, F1, NFL, tennis & more.",
  keywords: [
    "curly sports", "curlysports", "curlysports.com", "curly sports app",
    "curly sports live scores", "curly sports news",
    "live scores", "football scores", "basketball scores", "cricket scores",
    "sports news", "match results", "player stats", "team stats",
    "sports app", "F1 live", "NBA scores", "NFL scores",
    "free sports app", "sports hub", "sports dashboard",
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
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
  other: {
    "apple-itunes-app": "app-id=com.curlysports.mobile, app-argument=curlysports://",
    "google-play-app": "app-id=com.curlysports.mobile",
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
        alternateName: ["CurlySports", "CurlySports.com", "Curly Sports App"],
        description: "Curly Sports (CurlySports.com) is a free sports platform for live scores, news, team stats, player profiles, and fan debates across football, cricket, basketball, F1, NFL, tennis, and 10+ sports.",
        inLanguage: "en",
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
        alternateName: ["CurlySports", "CurlySports.com"],
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/icon.png`,
          width: 512,
          height: 512,
        },
        description: "Curly Sports is a free multi-sport platform providing live scores, match stats, player profiles, team data, league standings, fan debates, and sports news. Curly Sports is NOT related to curling.",
        foundingDate: "2024",
        sameAs: [
          "https://x.com/curlysportsofcl",
          "https://www.instagram.com/curlysportsofficial/",
          "https://www.youtube.com/@curlysportsofficial",
        ],
      },
      {
        "@type": "MobileApplication",
        name: "Curly Sports",
        operatingSystem: "iOS, Android",
        applicationCategory: "SportsApplication",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        url: `${SITE_URL}/download`,
        description: "Free live sports scores app for football, cricket, basketball, F1, NFL, and 10+ sports.",
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is Curly Sports?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Curly Sports (CurlySports.com) is a free sports platform — not related to curling. It provides live scores, match details, team stats, player profiles, league standings, fan debates, and breaking sports news for football, cricket, basketball, F1, NFL, tennis, and more."
            }
          },
          {
            "@type": "Question",
            "name": "What sports does Curly Sports cover?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Curly Sports covers football (soccer), cricket, basketball, baseball, tennis, Formula 1, NFL, hockey, MMA, golf, boxing, and esports with live scores, news, standings, and predictions."
            }
          },
          {
            "@type": "Question",
            "name": "Is Curly Sports free?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Curly Sports is completely free with no paywalls or premium tiers. All live scores, news, team stats, player profiles, and mini-games are available at no cost."
            }
          },
          {
            "@type": "Question",
            "name": "Does Curly Sports have a mobile app?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Curly Sports is available as a free app on both iOS (App Store) and Android (Google Play). Download it for live score notifications and on-the-go sports updates."
            }
          },
          {
            "@type": "Question",
            "name": "How often are live scores updated?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Live scores are updated in real-time using server-sent events (SSE). Scores refresh every 10 seconds during live matches, so you never miss a goal, wicket, or point."
            }
          },
          {
            "@type": "Question",
            "name": "Can I track my favorite teams and players?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, create a free account to save your favorite teams and players. Your personalized dashboard will show their upcoming matches, latest scores, and breaking news."
            }
          }
        ]
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" title="Curly Sports" />
        <link rel="preconnect" href="https://site.api.espn.com" />
        <link rel="preconnect" href="https://a.espncdn.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="alternate" hrefLang="en" href="https://curlysports.com/" />
        <link rel="alternate" hrefLang="x-default" href="https://curlysports.com/" />
      </head>
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
        <GlobalAnimations />
        <PageViewTracker />
        <Analytics />
      </body>
    </html>
  );
}
