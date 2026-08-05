import type { Metadata } from "next";
import MiniGamesClient from "./MiniGamesClient";

export const metadata: Metadata = {
  title: "Sports Mini Games — Free Trivia, Score Predictor, Quizzes & Leaderboards",
  description:
    "Play free sports mini games on Curly Sports — score predictor, sports trivia, football quizzes, NBA challenges, cricket games, and leaderboards. Test your sports knowledge and compete with fans worldwide.",
  keywords: [
    // Core games
    "sports mini games", "sports games", "sports games online", "free sports games",
    "sports game app", "sports mini game app", "fun sports games",
    "online sports games", "sports games free", "casual sports games",
    // Trivia
    "sports trivia", "sports trivia game", "sports trivia online",
    "sports trivia questions", "sports quiz", "sports quiz online",
    "sports quiz game", "sports knowledge quiz", "sports trivia app",
    "football trivia", "soccer trivia", "NBA trivia", "cricket trivia",
    "NFL trivia", "F1 trivia", "tennis trivia",
    "sports questions", "sports trivia questions and answers",
    "hard sports trivia", "easy sports trivia",
    // Score predictor
    "score predictor", "score prediction game", "predict the score",
    "football score predictor", "match prediction game",
    "sports prediction game", "predict sports scores",
    "score guessing game", "sports guessing game",
    // Leaderboards & competition
    "sports leaderboard", "sports competition", "compete with friends",
    "sports challenge", "fan challenge", "sports ranking game",
    // General games
    "football games online", "soccer games online", "basketball games online",
    "cricket games online", "sports games for fans",
    "free online games", "browser games sports",
    "mobile sports games", "sports games iOS", "sports games Android",
    // Community
    "sports fan games", "fan engagement", "sports entertainment",
    "sports fun", "sports gamification",
  ],
  alternates: { canonical: "https://curlysports.com/mini-games" },
  openGraph: {
    title: "Sports Mini Games — Free Trivia & Score Predictor",
    description: "Free sports trivia, score predictors, quizzes and leaderboards — play and compete on Curly Sports.",
    url: "https://curlysports.com/mini-games",
  },
};

export default function MiniGamesPage() {
  return <MiniGamesClient />;
}
