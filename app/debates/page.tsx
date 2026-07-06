import type { Metadata } from "next";
import FunZoneClient from "./FunZoneClient";

export const metadata: Metadata = {
  title: "Sports Debates & Polls — Argue with Actual Data",
  description:
    "Join live sports debates, vote in polls, and make match predictions on Curly Sports. Settle arguments with real stats — not just opinions.",
  alternates: { canonical: "https://curlysports.com/debates" },
  openGraph: {
    title: "Sports Debates — Curly Sports",
    description: "Hot sports debates, live polls and predictions. Argue smarter with actual data.",
    url: "https://curlysports.com/debates",
  },
};

export default function FunZonePage() {
  return <FunZoneClient />;
}
