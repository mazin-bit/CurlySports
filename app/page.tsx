import LandingPage from "./LandingClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curly Sports — Free Live Scores, Teams, Players & Sports News | CurlySports.com",
  description:
    "Curly Sports (CurlySports.com) is a free sports platform with real-time live scores, team stats, player profiles, league standings, debates, and breaking news for football, cricket, basketball, F1, NFL, tennis, baseball, hockey, MMA, and more.",
  alternates: { canonical: "/" },
};

export default function Page() {
  return (
    <>
      <LandingPage />
      {/* Server-rendered content for SEO — visible to users who scroll past the landing page */}
      <section
        style={{
          background: "#07090b",
          color: "#a0a8b4",
          padding: "80px 24px",
          maxWidth: 900,
          margin: "0 auto",
          fontSize: 15,
          lineHeight: 1.7,
        }}
      >
        <h2 style={{ color: "#fff", fontSize: 28, marginBottom: 16 }}>
          About Curly Sports
        </h2>
        <p style={{ marginBottom: 16 }}>
          Curly Sports is a free multi-sport platform built for fans who want
          live scores, deep stats, and real debates — all in one place. Whether
          you follow football, cricket, basketball, Formula 1, NFL, tennis,
          baseball, hockey, MMA, golf, or boxing, CurlySports.com has you
          covered with real-time match updates, player profiles, team
          statistics, and league standings across 150+ leagues worldwide.
        </p>
        <h3 style={{ color: "#fff", fontSize: 20, marginBottom: 12 }}>
          Live Scores &amp; Match Updates
        </h3>
        <p style={{ marginBottom: 16 }}>
          Get real-time scores that update every 10 seconds during live matches.
          From Premier League and La Liga to IPL cricket, NBA, NFL, and F1 race
          timing — Curly Sports delivers instant updates with goal scorers,
          lineups, cards, and detailed match statistics.
        </p>
        <h3 style={{ color: "#fff", fontSize: 20, marginBottom: 12 }}>
          Sports Covered
        </h3>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li>Football (Soccer) — EPL, La Liga, Serie A, Bundesliga, Ligue 1, MLS, and 140+ leagues</li>
          <li>Cricket — IPL, T20 World Cup, Test matches, ODI series</li>
          <li>Basketball — NBA scores, standings, and player stats</li>
          <li>Formula 1 — Live race timing, driver standings, constructor championship</li>
          <li>NFL — American football scores, standings, and team stats</li>
          <li>Tennis — ATP, WTA, Grand Slam draws and results</li>
          <li>Baseball — MLB scores and standings</li>
          <li>Hockey — NHL scores and playoff brackets</li>
          <li>MMA — UFC event results and fighter profiles</li>
          <li>Golf — PGA Tour leaderboards and major championships</li>
          <li>Boxing — Fight results and upcoming cards</li>
        </ul>
        <h3 style={{ color: "#fff", fontSize: 20, marginBottom: 12 }}>
          Fan Debates &amp; Mini-Games
        </h3>
        <p style={{ marginBottom: 16 }}>
          Join thousands of fans in hot-take debates, score predictions, and
          sports trivia challenges. Compete on leaderboards, earn points, and
          prove you know your sport better than anyone.
        </p>
        <h3 style={{ color: "#fff", fontSize: 20, marginBottom: 12 }}>
          Free Mobile App
        </h3>
        <p>
          Download Curly Sports for free on{" "}
          <a href="https://apps.apple.com/ae/app/curlysports/id6782400396" style={{ color: "#c8ff3d" }}>
            iOS
          </a>{" "}
          and{" "}
          <a href="https://play.google.com/store/apps/details?id=com.curlysports.mobile" style={{ color: "#c8ff3d" }}>
            Android
          </a>
          . Get instant push notifications for goals, wickets, and buzzer-beaters
          the second they happen.
        </p>
      </section>
    </>
  );
}
