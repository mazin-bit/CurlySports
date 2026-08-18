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
    // Brand
    "curly sports", "curlysports", "curlysports.com", "curly sports app", "curly sports website",
    "curly sports live scores", "curly sports news", "curly sports download",
    // Live scores
    "live scores", "live sports scores", "live scores today", "live score updates",
    "sports scores today", "scores today", "live sport", "live sports",
    "real time sports scores", "live match scores", "today match score",
    "live score app", "free live scores", "sports score tracker",
    // Football / Soccer
    "football scores", "football scores today", "soccer scores", "soccer scores today",
    "premier league scores", "premier league live", "EPL scores",
    "la liga scores", "serie a scores", "bundesliga scores",
    "champions league scores", "football results today", "soccer results",
    "premier league results", "premier league standings",
    // Cricket
    "cricket scores", "cricket live scores", "IPL scores", "IPL live score",
    "IPL 2026", "T20 scores", "cricket results", "live cricket",
    // Basketball / NBA
    "basketball scores", "NBA scores", "NBA scores today", "NBA live scores",
    "NBA standings", "NBA results", "basketball live", "NBA games today",
    // NFL
    "NFL scores", "NFL scores today", "NFL live scores", "NFL results",
    "NFL standings", "NFL games today", "American football scores",
    // F1
    "F1 live", "F1 scores", "F1 standings", "F1 results", "Formula 1 live",
    "F1 driver standings", "F1 constructor standings",
    // Tennis
    "tennis scores", "tennis live scores", "ATP scores", "WTA scores",
    "grand slam results", "Wimbledon scores",
    // Baseball / MLB
    "baseball scores", "MLB scores", "MLB scores today", "MLB standings",
    // Hockey / NHL
    "hockey scores", "NHL scores", "NHL scores today", "NHL standings",
    // MMA / UFC
    "MMA results", "UFC results", "UFC scores", "UFC fight results",
    // News
    "sports news", "sports news today", "latest sports news", "breaking sports news",
    "football news", "soccer news", "cricket news", "NBA news", "NFL news",
    "F1 news", "tennis news", "sports headlines", "sports updates",
    // Teams & Players
    "player stats", "team stats", "sports stats", "player profiles",
    "team rosters", "team squads", "sports players", "sports teams",
    // Leagues & Standings
    "league standings", "league tables", "sports standings",
    "premier league table", "la liga table", "NBA standings 2026",
    "NFL standings 2026", "IPL standings", "IPL points table",
    // Games & Entertainment
    "sports trivia", "sports quiz", "sports mini games", "sports games online",
    "sports trivia game", "free sports games", "sports prediction game",
    "score predictor", "sports guessing game",
    // Debates & Community
    "sports debate", "sports debates online", "sports polls",
    "GOAT debate", "best player debate", "sports community",
    "sports discussion", "sports forum",
    // General / App
    "sports app", "free sports app", "best sports app", "sports hub",
    "sports dashboard", "sports platform", "sports website",
    "all sports app", "multi sport app", "sports tracker",
    "best live score app", "best sports score app",
    // Predictions & Challenges
    "sports predictions", "match predictions", "sports challenges",
    "prediction game", "score predictions",
    // Videos & Highlights
    "sports highlights", "match highlights", "sports videos",
    "football highlights", "NBA highlights", "cricket highlights",
    // Download / Mobile
    "download sports app", "sports app iOS", "sports app Android",
    "free sports app download", "live scores app download",
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
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
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
