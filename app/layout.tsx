import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SWRProvider } from "@/components/SWRProvider";
import { SportProvider } from "@/contexts/SportContext";

export const metadata: Metadata = {
  title: {
    default: "Curly Sports — Live Scores, Teams, Players & News",
    template: "%s · Curly Sports",
  },
  description:
    "Curly Sports is your ultimate sports hub — live scores, match details, team stats, player profiles, leagues, debates, and breaking news for football, basketball, F1, cricket & more.",
  keywords: [
    "curly sports", "live scores", "football scores", "basketball scores",
    "sports news", "match results", "player stats", "team stats",
    "sports app", "F1 live", "cricket scores", "NBA scores", "NFL scores",
  ],
  authors: [{ name: "Curly Sports" }],
  creator: "Curly Sports",
  publisher: "Curly Sports",
  metadataBase: new URL("https://curly.sports"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://curly.sports",
    siteName: "Curly Sports",
    title: "Curly Sports — Live Scores, Teams, Players & News",
    description:
      "Your ultimate sports hub — live scores, match details, team stats, player profiles, leagues, debates, and breaking sports news.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Curly Sports — Your Sports Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@curlysports",
    creator: "@curlysports",
    title: "Curly Sports — Live Scores, Teams, Players & News",
    description:
      "Your ultimate sports hub — live scores, match details, team stats, player profiles, leagues, debates, and breaking sports news.",
    images: ["/og-image.png"],
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
  return (
    <html lang="en">
      <body>
        <SWRProvider>
          <SportProvider>{children}</SportProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
