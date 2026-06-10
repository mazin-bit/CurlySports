import type { Metadata } from "next";
import MiniGamesClient from "./MiniGamesClient";

export const metadata: Metadata = {
  title: "Sports Mini Games — Score Predictor, Trivia & More",
  description:
    "Play sports mini games on Curly Sports — score predictor, sports trivia, leaderboards and more. Test your knowledge and compete with other fans.",
  alternates: { canonical: "https://curlysports.com/mini-games" },
  openGraph: {
    title: "Sports Mini Games — Curly Sports",
    description: "Score predictor, trivia, leaderboards — fun sports games for every fan.",
    url: "https://curlysports.com/mini-games",
  },
};

export default function MiniGamesPage() {
  return <MiniGamesClient />;
}
