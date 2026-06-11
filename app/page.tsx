"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import "./landing.css";
import { Activity, TrendingUp, Target, MapPin, MessageSquareMore } from "lucide-react";

/* ── Sport card data ─────────────────────────────── */
const SPORT_CARDS = [
  { tag: "01 · Football", title: "Football\n/ Soccer", leagues: "EPL · LaLiga +12", img: "/curly-guy.png", ball: "ball-soccer", ballBox: "0 0 40 40" },
  { tag: "02 · Basketball", title: "Basketball", leagues: "NBA · EuroLeague", img: "/curly-guy.png", ball: "ball-basket", ballBox: "0 0 40 40" },
  { tag: "03 · NFL", title: "American\nFootball", leagues: "NFL · NCAA", img: "/curly-guy.png", ball: "ball-nfl", ballBox: "0 0 50 30", ballStyle: { bottom: "6%" } },
  { tag: "04 · Tennis", title: "Tennis", leagues: "ATP · WTA · Grand Slams", img: "/curly-guy.png", ball: "ball-tennis", ballBox: "0 0 40 40" },
  { tag: "05 · MLB", title: "Baseball", leagues: "MLB · MiLB", img: "/curly-guy.png", ball: "ball-base", ballBox: "0 0 40 40" },
  { tag: "06 · F1", title: "Formula 1", leagues: "F1 · F2 · F3", img: "/curly-guy.png", ball: "ball-f1", ballBox: "0 0 40 40" },
  { tag: "07 · Cricket", title: "Cricket", leagues: "IPL · T20 · Test", img: "/curly-guy.png", ball: "ball-cricket", ballBox: "0 0 40 40" },
  { tag: "08 · Hockey", title: "Ice\nHockey", leagues: "NHL · KHL", img: "/curly-guy.png", ball: "ball-hockey", ballBox: "0 0 40 40" },
  { tag: "09 · Golf", title: "Golf", leagues: "PGA · DP World", img: "/curly-guy.png", ball: "ball-golf", ballBox: "0 0 40 40" },
  { tag: "10 · Boxing", title: "Boxing", leagues: "WBC · IBF · WBO", img: "/curly-guy.png", ball: "ball-boxing", ballBox: "0 0 40 40" },
];

const BACK_STATS: Record<string, { h4: string; stats: [string, string][] }> = {
  "01 · Football": { h4: "xG · pressure maps · pass networks · heatmaps", stats: [["150+", "Leagues"], ["10+", "Top tiers"], ["Live", "Scores"], ["∞", "Debates"]] },
  "02 · Basketball": { h4: "PER · true shooting · clutch rating · shot charts", stats: [["30", "NBA teams"], ["450+", "Players"], ["82", "Regular season"], ["∞", "Hot takes"]] },
  "03 · NFL": { h4: "EPA · DVOA · QB rating · play-by-play", stats: [["32", "NFL teams"], ["1.7k", "Players"], ["256", "Games"], ["∞", '"Goat?" debates']] },
  "04 · Tennis": { h4: "Serve %, break points, rally length, surface stats", stats: [["4", "Grand Slams"], ["200+", "ATP players"], ["63", "Tournaments"], ["∞", "GOAT votes"]] },
  "05 · MLB": { h4: "WAR · OPS+ · Statcast · pitch-by-pitch", stats: [["30", "MLB teams"], ["750", "Players"], ["162", "Regular season"], ["∞", "Sabermetrics"]] },
  "06 · F1": { h4: "Lap times · tire deltas · pit strategy · telemetry", stats: [["24", "Race weekends"], ["20", "Drivers"], ["10", "Constructors"], ["∞", "Max v Lewis"]] },
  "07 · Cricket": { h4: "Strike rate · economy · DRS · Duckworth-Lewis", stats: [["10", "Test nations"], ["12", "IPL teams"], ["3", "Formats"], ["∞", "Sixes debates"]] },
  "08 · Hockey": { h4: "Corsi · Fenwick · Expected goals · zone entries", stats: [["32", "NHL teams"], ["700+", "Players"], ["82", "Games"], ["∞", "Gretzky debates"]] },
  "09 · Golf": { h4: "Strokes gained · fairways · GIR · Putts per hole", stats: [["4", "Majors"], ["125", "PGA players"], ["47", "Tournaments"], ["∞", "Tiger vs Jack"]] },
  "10 · Boxing": { h4: "Power · speed · accuracy · judges' scorecards", stats: [["4", "Major belts"], ["200+", "Fighters"], ["∞", "Pay-per-views"], ["∞", "GOAT wars"]] },
};

/* ── Momentum data ──────────────────────────────── */
const MUN = [18, 22, 31, 38, 42, 35, 28, 45, 52, 38, 31, 24, 35, 48, 55, 42, 36];
const BAY = [35, 28, 22, 18, 25, 38, 45, 32, 22, 38, 45, 52, 42, 32, 24, 38, 44];

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  /* Scroll reveal */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    el.querySelectorAll(".reveal").forEach((node) => obs.observe(node));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="landing-root" ref={rootRef}>
      {/* ── SVG Defs ───────────────────────────────── */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <symbol id="curly-mascot" viewBox="0 0 200 260">
            <path d="M 55 165 Q 55 150 70 150 L 95 150 L 100 156 L 105 150 L 130 150 Q 145 150 145 165 L 145 245 Q 145 255 135 255 L 65 255 Q 55 255 55 245 Z" fill="var(--jersey, #ff5b3d)" stroke="#0c0a1d" strokeWidth="3"/>
            <path d="M 90 150 L 100 165 L 110 150" fill="none" stroke="#0c0a1d" strokeWidth="2.5" strokeLinejoin="round"/>
            <text x="100" y="218" fontFamily="Bricolage Grotesque, sans-serif" fontSize="40" fontWeight="800" fill="#0c0a1d" textAnchor="middle">9</text>
            <rect x="35" y="155" width="22" height="60" rx="11" fill="var(--jersey, #ff5b3d)" stroke="#0c0a1d" strokeWidth="3"/>
            <rect x="143" y="155" width="22" height="60" rx="11" fill="var(--jersey, #ff5b3d)" stroke="#0c0a1d" strokeWidth="3"/>
            <circle cx="46" cy="220" r="10" fill="#f4c896" stroke="#0c0a1d" strokeWidth="3"/>
            <circle cx="154" cy="220" r="10" fill="#f4c896" stroke="#0c0a1d" strokeWidth="3"/>
            <rect x="90" y="135" width="20" height="18" fill="#f4c896" stroke="#0c0a1d" strokeWidth="3"/>
            <circle cx="100" cy="100" r="44" fill="#f4c896" stroke="#0c0a1d" strokeWidth="3"/>
            <g fill="#3d2818" stroke="#0c0a1d" strokeWidth="2.5">
              <circle cx="100" cy="58" r="22"/><circle cx="78" cy="62" r="18"/><circle cx="122" cy="62" r="18"/>
              <circle cx="64" cy="75" r="16"/><circle cx="136" cy="75" r="16"/>
              <circle cx="60" cy="92" r="14"/><circle cx="140" cy="92" r="14"/>
              <circle cx="88" cy="48" r="15"/><circle cx="112" cy="48" r="15"/>
              <circle cx="72" cy="50" r="12"/><circle cx="128" cy="50" r="12"/>
            </g>
            <g fill="#3d2818">
              <circle cx="74" cy="80" r="10"/><circle cx="126" cy="80" r="10"/>
              <circle cx="82" cy="72" r="9"/><circle cx="118" cy="72" r="9"/><circle cx="100" cy="68" r="9"/>
            </g>
            <path d="M 80 92 Q 86 88 92 92" stroke="#0c0a1d" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M 108 92 Q 114 88 120 92" stroke="#0c0a1d" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <circle cx="86" cy="102" r="4.5" fill="#0c0a1d"/><circle cx="114" cy="102" r="4.5" fill="#0c0a1d"/>
            <circle cx="88" cy="100" r="1.3" fill="#fffdf7"/><circle cx="116" cy="100" r="1.3" fill="#fffdf7"/>
            <ellipse cx="76" cy="116" rx="6" ry="4" fill="#ff5b3d" opacity="0.5"/>
            <ellipse cx="124" cy="116" rx="6" ry="4" fill="#ff5b3d" opacity="0.5"/>
            <path d="M 86 122 Q 100 134 114 122" stroke="#0c0a1d" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <rect x="97" y="124" width="6" height="5" fill="#fffdf7" stroke="#0c0a1d" strokeWidth="1.5"/>
          </symbol>
          <symbol id="ball-soccer" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#fffdf7" stroke="#0c0a1d" strokeWidth="2.5"/><polygon points="20,10 27,16 24,24 16,24 13,16" fill="#0c0a1d"/><path d="M 20 4 L 20 10 M 32 14 L 27 16 M 28 30 L 24 24 M 12 30 L 16 24 M 8 14 L 13 16" stroke="#0c0a1d" strokeWidth="1.5" fill="none"/></symbol>
          <symbol id="ball-basket" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#ff5b3d" stroke="#0c0a1d" strokeWidth="2.5"/><path d="M 20 2 V 38 M 2 20 H 38 M 6 8 Q 20 20 6 32 M 34 8 Q 20 20 34 32" stroke="#0c0a1d" strokeWidth="2" fill="none"/></symbol>
          <symbol id="ball-tennis" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#c8ff3d" stroke="#0c0a1d" strokeWidth="2.5"/><path d="M 4 14 Q 20 22 4 30 M 36 10 Q 20 18 36 26" stroke="#fffdf7" strokeWidth="2" fill="none"/></symbol>
          <symbol id="ball-nfl" viewBox="0 0 50 30"><ellipse cx="25" cy="15" rx="22" ry="13" fill="#7c5cff" stroke="#0c0a1d" strokeWidth="2.5"/><line x1="14" y1="15" x2="36" y2="15" stroke="#fffdf7" strokeWidth="2"/><line x1="18" y1="12" x2="18" y2="18" stroke="#fffdf7" strokeWidth="1.5"/><line x1="22" y1="12" x2="22" y2="18" stroke="#fffdf7" strokeWidth="1.5"/><line x1="26" y1="12" x2="26" y2="18" stroke="#fffdf7" strokeWidth="1.5"/><line x1="30" y1="12" x2="30" y2="18" stroke="#fffdf7" strokeWidth="1.5"/></symbol>
          <symbol id="ball-base" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#fffdf7" stroke="#0c0a1d" strokeWidth="2.5"/><path d="M 4 14 Q 20 22 4 30" stroke="#ff5b3d" strokeWidth="2.5" strokeDasharray="2,3" fill="none"/><path d="M 36 10 Q 20 18 36 26" stroke="#ff5b3d" strokeWidth="2.5" strokeDasharray="2,3" fill="none"/></symbol>
          <symbol id="ball-f1" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#0c0a1d" stroke="#0c0a1d" strokeWidth="2"/><circle cx="20" cy="20" r="9" fill="#5dd9ff" stroke="#fffdf7" strokeWidth="2"/><circle cx="20" cy="20" r="3" fill="#fffdf7"/></symbol>
          <symbol id="ball-cricket" viewBox="0 0 40 40"><circle cx="28" cy="28" r="8" fill="#ff5b3d" stroke="#0c0a1d" strokeWidth="2"/><rect x="8" y="4" width="8" height="24" rx="4" fill="#d4a070" stroke="#0c0a1d" strokeWidth="2"/><rect x="10" y="26" width="4" height="8" fill="#3d2818" stroke="#0c0a1d" strokeWidth="2"/></symbol>
          <symbol id="ball-hockey" viewBox="0 0 40 40"><ellipse cx="30" cy="30" rx="6" ry="3" fill="#0c0a1d" stroke="#0c0a1d" strokeWidth="2"/><path d="M 8 6 L 12 6 L 20 22 L 28 28 L 28 32 L 24 32 L 16 26 L 8 10 Z" fill="#d4a070" stroke="#0c0a1d" strokeWidth="2"/></symbol>
          <symbol id="ball-golf" viewBox="0 0 40 40"><circle cx="14" cy="26" r="8" fill="#fffdf7" stroke="#0c0a1d" strokeWidth="2"/><circle cx="14" cy="26" r="1.5" fill="#0c0a1d"/><circle cx="11" cy="24" r="1" fill="#0c0a1d"/><circle cx="17" cy="24" r="1" fill="#0c0a1d"/><line x1="30" y1="32" x2="30" y2="8" stroke="#0c0a1d" strokeWidth="2"/><path d="M 30 8 L 36 11 L 30 14 Z" fill="#ff5b3d" stroke="#0c0a1d" strokeWidth="2"/></symbol>
          <symbol id="ball-boxing" viewBox="0 0 40 40"><ellipse cx="20" cy="24" rx="14" ry="12" fill="#ff5b3d" stroke="#0c0a1d" strokeWidth="2.5"/><path d="M 12 14 Q 12 8 18 8 Q 22 8 22 12 L 22 18" fill="#ff5b3d" stroke="#0c0a1d" strokeWidth="2.5"/><ellipse cx="20" cy="18" rx="8" ry="6" fill="#ff5b3d" stroke="#0c0a1d" strokeWidth="2"/><line x1="14" y1="28" x2="26" y2="28" stroke="#0c0a1d" strokeWidth="2"/></symbol>
          <symbol id="star" viewBox="0 0 40 40"><path d="M 20 4 L 23 16 L 36 18 L 26 26 L 30 38 L 20 31 L 10 38 L 14 26 L 4 18 L 17 16 Z" fill="#ff5b3d" stroke="#0c0a1d" strokeWidth="2"/></symbol>
          <symbol id="i-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></symbol>
          <symbol id="i-bolt" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></symbol>
          <symbol id="i-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2v6zm12 0h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2v6zM6 3h12v8a6 6 0 0 1-12 0V3zM8 21h8M12 17v4"/></symbol>
          <symbol id="i-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.4-.8L3 21l1.9-5.6a8.4 8.4 0 1 1 16.1-3.9z"/></symbol>
          <symbol id="i-bookmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></symbol>
          <symbol id="i-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5"/></symbol>
          <symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></symbol>
          <symbol id="i-arrow-up" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M7 14l5-5 5 5"/></symbol>
        </defs>
      </svg>

      {/* ── Nav ───────────────────────────────────── */}
      <nav className="l-nav">
        <div className="l-nav-inner">
          <a href="/" className="l-logo">
            <div className="l-logo-mark">
              <Image src="/curly-guy.png" alt="Curly" width={40} height={40} quality={100} />
            </div>
            <span>curly<em style={{ color: "var(--orange)", fontStyle: "normal" }}>.</em>sports</span>
          </a>
          <div className="l-nav-links">
            <a href="#hero" className="active">Home</a>
            <a href="#about">About</a>
            <a href="#founder">Founder</a>
            <a href="#preview">Platform</a>
            <a href="#news">News</a>
          </div>
          <div className="l-nav-cta">
            <a href="/login" className="l-btn l-btn-ghost">Log in</a>
            <a href="/login" className="l-btn l-btn-dark">Sign up →</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────── */}
      <div className="l-section l-hero" id="hero">
        <div className="l-hero-grid">
          {/* LEFT */}
          <div className="l-hero-left">
            {/* Live now bar */}
            <div className="l-hero-live-bar">
              <span className="l-live-badge"><span className="l-live-dot-sm"></span>LIVE NOW</span>
              <span className="l-live-items">
                <strong>150+ leagues</strong> · scores updating now
              </span>
              <a href="/login" className="l-live-more">Sign in →</a>
            </div>

            {/* Headline */}
            <h1 className="l-hero-title">
              Live scores.<br />
              Deep stats.<br />
              <span className="l-underline-word">Real debates.</span>
            </h1>

            {/* Feature cards */}
            <div className="l-hero-feats">
              <div className="l-feat-card fc-live">
                <div className="l-feat-icon-box"><Activity size={24} strokeWidth={2} /></div>
                <div className="l-feat-body">
                  <div className="l-feat-name">Live Scores</div>
                  <div className="l-feat-val">Real-time · 150+ leagues covered</div>
                </div>
                <div className="l-feat-stat"><span>Real-time</span></div>
              </div>
              <div className="l-feat-card fc-stats">
                <div className="l-feat-icon-box"><TrendingUp size={24} strokeWidth={2} /></div>
                <div className="l-feat-body">
                  <div className="l-feat-name">Deep Stats</div>
                  <div className="l-feat-val">Every player · every match</div>
                </div>
                <div className="l-feat-stat"><span>All sports</span></div>
              </div>
              <div className="l-feat-card fc-debates">
                <div className="l-feat-icon-box"><MessageSquareMore size={24} strokeWidth={2} /></div>
                <div className="l-feat-body">
                  <div className="l-feat-name">Hot Debates</div>
                  <div className="l-feat-val">Argue with real data, win every time</div>
                </div>
                <div className="l-feat-stat"><span>Join free</span></div>
              </div>
            </div>

            {/* CTAs */}
            <div className="l-hero-actions">
              <a href="/login" className="l-btn l-btn-orange l-btn-lg">Join free →</a>
              <a href="/live-scores" className="l-btn l-btn-ghost l-btn-lg"><span className="cta-live-dot"></span>Watch live</a>
            </div>

            {/* Leagues strip */}
            <div className="l-hero-leagues">
              <span className="l-leagues-label">Covering</span>
              <div className="l-leagues-pills">
                <span>EPL</span><span>NBA</span><span>NFL</span><span>LaLiga</span>
                <span>ATP</span><span>F1</span><span>IPL</span>
                <span className="l-more-pill">+143 more</span>
              </div>
            </div>
          </div>
          {/* RIGHT: App preview */}
          <div className="l-hero-preview">
            <div className="l-preview-card">
              <div className="l-preview-header">
                <span className="l-live-dot"></span>
                <span className="l-live-label">LIVE SCORES</span>
              </div>
              <div className="l-match">
                <div className="l-match-teams">
                  <span className="l-abbr">MUN</span>
                  <span className="l-score">2</span>
                  <span className="l-vs">–</span>
                  <span className="l-score">1</span>
                  <span className="l-abbr r">CHE</span>
                </div>
                <div className="l-match-foot">
                  <div className="l-progress-bar"><div className="l-progress-fill" style={{width:"74%"}}></div></div>
                  <span>74&apos;</span>
                  <span className="l-sport-tag">EPL</span>
                </div>
              </div>
              <div className="l-match">
                <div className="l-match-teams">
                  <span className="l-abbr">LAL</span>
                  <span className="l-score">112</span>
                  <span className="l-vs">–</span>
                  <span className="l-score">98</span>
                  <span className="l-abbr r">BOS</span>
                </div>
                <div className="l-match-foot">
                  <div className="l-progress-bar"><div className="l-progress-fill" style={{width:"88%"}}></div></div>
                  <span>Q4 · 3:42</span>
                  <span className="l-sport-tag">NBA</span>
                </div>
              </div>
              <div className="l-match">
                <div className="l-match-teams">
                  <span className="l-abbr">ARS</span>
                  <span className="l-score">3</span>
                  <span className="l-vs">–</span>
                  <span className="l-score">2</span>
                  <span className="l-abbr r">LIV</span>
                </div>
                <div className="l-match-foot">
                  <div className="l-progress-bar"><div className="l-progress-fill" style={{width:"51%"}}></div></div>
                  <span>51&apos;</span>
                  <span className="l-sport-tag">EPL</span>
                </div>
              </div>
              <a href="/live-scores" className="l-preview-cta">View all live scores →</a>
            </div>
            <div className="l-preview-chip chip-debates"><Activity size={13} strokeWidth={2} /><span>Live Scores</span></div>
            <div className="l-preview-chip chip-stats"><TrendingUp size={13} strokeWidth={2} /><span>Deep Stats</span></div>
            <div className="l-preview-chip chip-predict"><Target size={13} strokeWidth={2} /><span>Predictions</span></div>
          </div>
        </div>
      </div>

      {/* ── Coverage Ticker ───────────────────────── */}
      <div className="l-ticker">
        <div className="l-ticker-track">
          {[0, 1].map((dup) => (
            <span key={dup} style={{ display: "contents" }}>
              <span className="l-ticker-item"><span className="league">EPL</span> Premier League</span>
              <span className="l-ticker-item" style={{ opacity: 0.4 }}>·</span>
              <span className="l-ticker-item"><span className="league">LA LIGA</span> La Liga</span>
              <span className="l-ticker-item" style={{ opacity: 0.4 }}>·</span>
              <span className="l-ticker-item"><span className="league">UCL</span> Champions League</span>
              <span className="l-ticker-item" style={{ opacity: 0.4 }}>·</span>
              <span className="l-ticker-item"><span className="league">NBA</span> Basketball</span>
              <span className="l-ticker-item" style={{ opacity: 0.4 }}>·</span>
              <span className="l-ticker-item"><span className="league">NFL</span> American Football</span>
              <span className="l-ticker-item" style={{ opacity: 0.4 }}>·</span>
              <span className="l-ticker-item"><span className="league">F1</span> Formula 1</span>
              <span className="l-ticker-item" style={{ opacity: 0.4 }}>·</span>
              <span className="l-ticker-item"><span className="league">ATP</span> Tennis</span>
              <span className="l-ticker-item" style={{ opacity: 0.4 }}>·</span>
              <span className="l-ticker-item"><span className="league">IPL</span> Cricket</span>
              <span className="l-ticker-item" style={{ opacity: 0.4 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Problem ───────────────────────────────── */}
      <div className="l-problem reveal" id="about">
        <span className="l-section-tag"><span className="num">01</span> · The problem</span>
        <div className="l-quote-block">
          <p className="l-quote-text">
            Right now, sports fans either get <span className="strike">basic scores</span> or they get <span className="circle">overloaded with stats nobody understands</span>. There&apos;s almost nothing in the middle that makes analytics both <span className="lime-bg">powerful</span> <em>and</em> enjoyable.
          </p>
          <div className="l-quote-source">
            <div className="photo">
              <Image className="l-quote-src-img" src="/curly-guy.png" alt="Mazin" width={36} height={36} />
            </div>
            <span><strong>Mazin</strong>, founder · written on a napkin, May 2026</span>
          </div>
        </div>
      </div>

      {/* ── Sport Cards ───────────────────────────── */}
      <div className="l-sports-section" id="sports">
        <div className="l-sports-head reveal">
          <div className="l-sports-head-l">
            <span className="l-section-tag"><span className="num">02</span> · Every sport, every league</span>
            <h2 className="l-kicker">Curly knows<br />them all.</h2>
            <p className="l-lede">Football, basketball, NFL, tennis, baseball, F1 — same depth of stats, same playful interface. Hover a card to see what data we track.</p>
          </div>
          <a href="#preview" className="l-btn l-btn-dark">See sample stats ↓</a>
        </div>
        <div className="l-sports-grid">
          {[0, 1].map((dup) => (
            <div key={dup} className="l-sports-track">
              {SPORT_CARDS.map((card) => {
                const back = BACK_STATS[card.tag];
                return (
                  <div key={card.tag + dup} className="l-sport-card">
                    <div className="l-sport-card-inner">
                      <div className="l-sport-face front">
                        <span className="l-sport-card-tag">{card.tag}</span>
                        <div className="l-sport-card-mascot">
                          <div className="l-sport-mascot-wrap">
                            <Image className="l-sport-mascot-img" src={card.img} alt="Curly" width={180} height={200} />
                            <svg className="l-sport-ball-overlay" viewBox={card.ballBox} style={card.ballStyle}>
                              <use href={`#${card.ball}`} />
                            </svg>
                          </div>
                        </div>
                        <div className="l-sport-card-title">{card.title.split("\n").map((line, i) => <span key={i}>{i > 0 && <><br /><span style={{ opacity: 0.7 }}>/</span> </>}{line}</span>)}</div>
                        <div className="l-sport-card-meta"><span>{card.leagues}</span><span>↳ Hover</span></div>
                      </div>
                      <div className="l-sport-face back">
                        <span className="back-tag">What we track</span>
                        {back && <>
                          <h4>{back.h4}</h4>
                          <div className="l-stat-mini-grid">
                            {back.stats.map(([v, l]) => (
                              <div key={l} className="l-stat-mini">
                                <div className="v">{v}</div>
                                <div className="l">{l}</div>
                              </div>
                            ))}
                          </div>
                        </>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Platform Preview ──────────────────────── */}
      <div className="l-preview-wrap" id="preview">
        <div className="l-preview-section reveal">
          <span className="l-section-tag"><span className="num">03</span> · The platform</span>
          <h2 className="l-kicker" style={{ maxWidth: 720 }}>Powerful stats, presented like you actually want to read them.</h2>
          <p className="l-lede">A real-time dashboard with live scores, momentum charts, attack maps, player comparisons, debate threads — and 17 wild themes including a &quot;founder&apos;s bedroom&quot; mode.</p>

          <div className="l-preview-mockup">
            <div className="l-preview-toolbar">
              <span className="dot r" /><span className="dot y" /><span className="dot g" />
              <span className="url">curly.sports/dashboard</span>
            </div>
            <div className="l-preview-body">
              {/* Sidebar */}
              <div className="l-mockup-card">
                <div className="l-mockup-card-sub">Personal dashboard</div>
                <div className="l-mockup-card-title">Welcome back</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                  {[
                    { icon: "ball-soccer", label: "Football", active: true },
                    { icon: "ball-basket", label: "Basketball" },
                    { icon: "ball-nfl", label: "NFL", nfl: true },
                    { icon: "ball-tennis", label: "Tennis" },
                    { icon: "ball-base", label: "Baseball" },
                    { icon: "ball-f1", label: "Formula 1" },
                  ].map(({ icon, label, active, nfl }) => (
                    <div key={label} style={{ background: active ? "rgba(200,255,61,0.1)" : undefined, borderLeft: active ? "3px solid #c8ff3d" : undefined, padding: "8px 12px", borderRadius: 6, fontSize: 12, color: active ? "#c8ff3d" : "rgba(255,255,255,0.5)", fontWeight: active ? 600 : undefined, display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width={nfl ? 18 : 14} height={nfl ? 12 : 14} viewBox={nfl ? "0 0 50 30" : "0 0 40 40"}><use href={`#${icon}`} /></svg>
                      {label}
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "16px -18px 16px", paddingTop: 16 }} />
                <div className="l-mockup-card-sub" style={{ margin: "0 0 8px" }}>Following</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                  <div>· Manchester United</div><div>· Erling Haaland</div><div>· LA Lakers</div>
                </div>
              </div>
              {/* Center */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="l-mockup-card" style={{ background: "linear-gradient(135deg,#1a2322,#141b1a)", position: "relative", overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#c8ff3d", fontWeight: 700, letterSpacing: "0.06em" }}>● UCL QUARTER FINAL</span>
                    <span style={{ background: "#ff5b3d", color: "#fffdf7", padding: "3px 8px", borderRadius: 999, fontSize: 9, fontWeight: 700, letterSpacing: "0.05em" }}>LIVE</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ width: 48, height: 48, margin: "0 auto", background: "linear-gradient(135deg,#DA291C,#FBE122)", borderRadius: 12, display: "grid", placeItems: "center", fontFamily: "var(--display)", fontWeight: 800, fontSize: 16, color: "#fff" }}>MUN</div>
                      <div style={{ fontSize: 11, marginTop: 6, opacity: 0.7 }}>Man United</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 44, color: "#fffdf7", letterSpacing: "-0.04em" }}><span style={{ color: "#c8ff3d" }}>2</span> <span style={{ opacity: 0.4, fontWeight: 400 }}>·</span> 1</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#c8ff3d", marginTop: -4 }}>67&apos; · 2nd half</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ width: 48, height: 48, margin: "0 auto", background: "linear-gradient(135deg,#DC052D,#0066B2)", borderRadius: 12, display: "grid", placeItems: "center", fontFamily: "var(--display)", fontWeight: 800, fontSize: 16, color: "#fff" }}>BAY</div>
                      <div style={{ fontSize: 11, marginTop: 6, opacity: 0.7 }}>Bayern</div>
                    </div>
                  </div>
                  <div className="l-mockup-bar-row">
                    {[["Possession", "52%", 52], ["xG", "2.31", 69], ["Shots", "14", 60]].map(([label, val, pct]) => (
                      <div key={label as string} className="l-mockup-bar">
                        <span className="label">{label}</span>
                        <div className="bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
                        <span className="val">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="l-mockup-card">
                  <div className="l-mockup-card-sub">Attack momentum</div>
                  <div className="l-momentum">
                    {MUN.map((top, i) => (
                      <div key={i} className="bg">
                        <div className="top" style={{ height: `${top}%` }} />
                        <div className="bot" style={{ height: `${BAY[i]}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Right */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="l-mockup-card" style={{ background: "linear-gradient(135deg,rgba(200,255,61,0.15),#1a2322)", borderColor: "rgba(200,255,61,0.2)" }}>
                  <div className="l-mockup-card-sub">Top scorer · Premier League</div>
                  <div className="l-mockup-stat-large">
                    <span className="val">27</span>
                    <span className="lbl">Erling Haaland · Goals this season</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14, fontFamily: "var(--mono)", fontSize: 10 }}>
                    <span style={{ background: "rgba(255,255,255,0.06)", padding: "4px 8px", borderRadius: 6 }}>+2 this wk</span>
                    <span style={{ background: "rgba(255,255,255,0.06)", padding: "4px 8px", borderRadius: 6, color: "#c8ff3d" }}>↑ 3 vs xG</span>
                  </div>
                </div>
                <div className="l-mockup-card">
                  <div className="l-mockup-card-sub">Live poll</div>
                  <div className="l-mockup-card-title">Is Bellingham Madrid&apos;s MVP?</div>
                  <div style={{ marginTop: 12 }}>
                    {[{ label: "YES", color: "#c8ff3d", pct: 65 }, { label: "NO", color: "#7c5cff", pct: 35 }].map(({ label, color, pct }) => (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color, fontWeight: 700 }}>{label}</span>
                          <span style={{ fontFamily: "var(--mono)", color: "rgba(255,255,255,0.7)" }}>{pct}%</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.06)", height: 6, borderRadius: 3, marginBottom: 12 }}>
                          <div style={{ background: color, height: "100%", width: `${pct}%`, borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="l-preview-annotation a1">play-by-play feels alive</div>
            <div className="l-preview-annotation a2">argue with friends here</div>
          </div>
          <div className="l-preview-section-btns">
            <a href="/dashboard" className="l-btn l-btn-lime l-btn-lg">Open the full dashboard →</a>
            <a href="/admin" className="l-btn l-btn-ghost l-btn-lg" style={{ borderColor: "var(--paper)", color: "var(--paper)" }}>Peek the admin panel</a>
          </div>
        </div>
      </div>

      {/* ── Features ──────────────────────────────── */}
      <div className="l-features reveal">
        <div className="l-section" style={{ padding: "96px 32px 120px" }}>
          <span className="l-section-tag"><span className="num">04</span> · What makes Curly different</span>
          <h2 className="l-kicker" style={{ maxWidth: 720 }}>Four things every other<br />sports site gets wrong.</h2>
          <div className="l-feat-grid">
            {[
              { cls: "f1", num: "01", title: "Analytics, but readable", desc: "xG, EPA, WAR — explained inline with friendly tooltips. No PhD required.", link: "Learn more", icon: <path d="M3 3v18h18M7 14V18M12 9v9M17 5v13" /> },
              { cls: "f2", num: "02", title: "Debate like Reddit, with receipts", desc: "Post a hot take, back it up with one-tap stat embeds, watch the votes roll in.", link: "See debates", icon: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.4-.8L3 21l1.9-5.6a8.4 8.4 0 1 1 16.1-3.9z" /> },
              { cls: "f3", num: "03", title: "Mini-games & trivia", desc: "Daily lineup quizzes, prediction games, and \"guess the player\" — all scored against your friends.", link: "Play now", icon: <path d="M6 4l16 8L6 20V4z" /> },
              { cls: "f4", num: "04", title: "17 wild themes", desc: 'Not just dark mode. "Stadium night", "Curly\'s bedroom", "Retro Teletext", and more.', link: "Try themes", icon: <><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18" /></> },
            ].map(({ cls, num, title, desc, link, icon }) => (
              <div key={num} className={`l-feat-card ${cls}`}>
                <span className="l-feat-num">{num}</span>
                <div className="l-feat-icon-shape">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">{icon}</svg>
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="l-feat-link">{link} →</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sponsors Strip ────────────────────────── */}
      <div className="l-sponsors-wrap">
        <div className="l-sponsors-inner">
          <span className="l-sponsors-tag">Advertise with us</span>
          <div className="l-sponsors-slots">
            <div className="l-sponsor-slot"><span className="l-sponsor-icon">◈</span><span className="l-sponsor-name">Your Brand</span></div>
            <div className="l-sponsor-div" />
            <div className="l-sponsor-slot"><span className="l-sponsor-icon">◈</span><span className="l-sponsor-name">Partner</span></div>
            <div className="l-sponsor-div" />
            <div className="l-sponsor-slot"><span className="l-sponsor-icon">◈</span><span className="l-sponsor-name">Sponsor</span></div>
            <div className="l-sponsor-div" />
            <div className="l-sponsor-slot l-sponsor-cta"><a href="mailto:ads@curly.sports">Get featured →</a></div>
          </div>
          <span className="l-sponsors-reach">Reach a passionate sports audience · Contact us to get featured</span>
        </div>
      </div>

      {/* ── Founder ───────────────────────────────── */}
      <div className="l-founder-wrap" id="founder">
        <div className="l-founder reveal">
          <div className="l-founder-grid">
            <div className="l-founder-portrait">
              <span className="l-label-strip">Founder · Grade 9</span>
              <span className="l-badge-strip"><MapPin size={11} strokeWidth={2} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} /> Bedroom HQ</span>
              <Image className="l-founder-img" src="/curly-guy.png" alt="Mazin, founder" width={400} height={440} />
            </div>
            <div>
              <span className="l-section-tag"><span className="num">05</span> · About the founder</span>
              <h2 className="l-kicker">Meet Mazin —<br />the curly-haired<br />kid behind it all.</h2>
              <p className="l-founder-bio">
                At 14, after his fifth screaming match with a tab full of broken stat pages, <strong>Mazin</strong> sketched the first version of Curly Sports on a literal napkin. The mascot? A cartoon version of himself — curls and all — because the website should feel like a friend, not a spreadsheet.
              </p>
              <div className="l-founder-meta">
                <div><div className="k">Started</div><div className="v">May 2026</div></div>
                <div><div className="k">First user</div><div className="v">His mom</div></div>
                <div><div className="k">Currently</div><div className="v">Growing</div></div>
              </div>
              <div className="l-founder-btns">
                <a href="#" className="l-btn l-btn-lime">Read the full story →</a>
                <a href="#" className="l-btn l-btn-ghost" style={{ borderColor: "var(--paper)", color: "var(--paper)" }}>Follow @mazincurly</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Debate ────────────────────────────────── */}
      <div className="l-debate-wrap">
        <div className="l-debate reveal">
          <div className="l-debate-grid">
            <div>
              <span className="l-section-tag"><span className="num">06</span> · The debate floor</span>
              <h2 className="l-kicker">
                Bring your<br />hot take.<br />
                <span style={{ background: "var(--orange)", color: "var(--paper)", padding: "0 14px", borderRadius: 14, transform: "rotate(-2deg)", display: "inline-block" }}>Bring receipts.</span>
              </h2>
              <p className="l-lede">A feed for the actually-good sports arguments. Every post lets you embed live stats, tag teams, and watch people vote in real time.</p>
              <div className="l-debate-btns">
                <a href="/dashboard" className="l-btn l-btn-dark">Join a debate →</a>
                <a href="#" className="l-btn l-btn-ghost">See top debaters</a>
              </div>
            </div>
            <div className="l-debate-feed">
              {/* Post 1 */}
              <div className="l-debate-post">
                <div className="l-post-head">
                  <div className="l-post-ava">T</div>
                  <div className="l-post-meta">
                    <div className="name">TacticalView <span className="verified"><svg width="8" height="8"><use href="#i-check" /></svg></span></div>
                    <div className="handle">@tactical · 2h ago</div>
                  </div>
                  <div className="l-post-stance">YES · 61%</div>
                </div>
                <div className="l-post-text">Haaland&apos;s <span className="hl">xG drops 38%</span> in UCL knockouts vs top 6 teams. He averages 0.35 goals/game in those — the data is right there.</div>
                <div className="l-post-evidence">
                  <div className="l-ev-chip"><div className="k">Goals in big games</div><div className="v">0.35 /g</div></div>
                  <div className="l-ev-chip"><div className="k">xG drop</div><div className="v">−38%</div></div>
                  <div className="l-ev-chip"><div className="k">Sample</div><div className="v">42 matches</div></div>
                </div>
                <div className="l-post-actions">
                  <span><svg width="12" height="12"><use href="#i-arrow-up" /></svg> Upvote</span>
                  <span><svg width="12" height="12"><use href="#i-chat" /></svg> Reply</span>
                  <span><svg width="12" height="12"><use href="#i-share" /></svg> Share</span>
                  <span><svg width="12" height="12"><use href="#i-bookmark" /></svg> Save</span>
                </div>
              </div>
              {/* Post 2 */}
              <div className="l-debate-post">
                <div className="l-post-head">
                  <div className="l-post-ava a2">C</div>
                  <div className="l-post-meta">
                    <div className="name">Cityzen99 <span className="verified"><svg width="8" height="8"><use href="#i-check" /></svg></span></div>
                    <div className="handle">@cityzen · 45m ago</div>
                  </div>
                  <div className="l-post-stance against">NO · 39%</div>
                </div>
                <div className="l-post-text">Cherry-picking. <span className="hl">He still scores more than any striker in Europe</span>. The team creates less in those games, that&apos;s not on him.</div>
                <div className="l-post-evidence">
                  <div className="l-ev-chip"><div className="k">Goals/90 (season)</div><div className="v">0.91</div></div>
                  <div className="l-ev-chip"><div className="k">Big chances created</div><div className="v">−42% (team)</div></div>
                </div>
                <div className="l-post-actions">
                  <span><svg width="12" height="12"><use href="#i-arrow-up" /></svg> Upvote</span>
                  <span><svg width="12" height="12"><use href="#i-chat" /></svg> Reply</span>
                  <span><svg width="12" height="12"><use href="#i-share" /></svg> Share</span>
                  <span><svg width="12" height="12"><use href="#i-bookmark" /></svg> Save</span>
                </div>
              </div>
              {/* Compose */}
              <div className="l-compose">
                <div className="l-post-ava a3">
                  <Image src="/curly-guy.png" alt="Mazin" width={36} height={36} />
                </div>
                <input className="l-compose-input" placeholder="Drop your take… (stats auto-attach)" />
                <button className="l-compose-btn">Post</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── News ──────────────────────────────────── */}
      <div className="l-news reveal" id="news">
        <div className="l-section">
          <div className="l-news-head">
            <div>
              <span className="l-section-tag"><span className="num">07</span> · Today in sports</span>
              <h2 className="l-kicker">Latest news,<br />Curly-curated.</h2>
              <p className="l-lede">Stories that actually matter — pulled from the people who watched the game.</p>
            </div>
            <a href="/news" className="l-btn l-btn-dark">All stories →</a>
          </div>
          <div className="l-news-grid">
            <div className="l-news-card feat">
              <div className="l-news-img ch">
                <div className="l-news-emoji-bg" />
                <div className="l-news-img-emoji"><svg width="96" height="96"><use href="#ball-soccer" /></svg></div>
              </div>
              <div className="l-news-body">
                <span className="l-news-tag hot"><svg width="10" height="10"><use href="#i-flame" /></svg> Breaking</span>
                <h3 className="l-news-title">Xabi Alonso lists three key objectives after official Chelsea appointment</h3>
                <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 14 }}>The Spaniard wants midfield identity, a defensive overhaul, and Cole Palmer in his &quot;free 8&quot; role from day one.</p>
                <div className="l-news-foot"><span>by James Horncastle · 1h ago</span><span>4 min read</span></div>
              </div>
            </div>
            {[
              { imgCls: "bay", icon: "i-bolt", iconColor: "var(--lime)", tag: "Analysis", title: "Haaland's xG drop in big games — what the numbers actually show", meta: "3h ago", src: "The Athletic" },
              { imgCls: "nba", icon: "ball-basket", tag: "live", tagLabel: "● Live", title: "Lakers tip-off vs Celtics with Doncic-LeBron 1st-quarter run already at +14", meta: "now", src: "ESPN" },
              { imgCls: "ucl", icon: "i-trophy", iconColor: "var(--lime)", tag: "Champions League", title: "Bayern's high-line dilemma vs United's counter — a tactical preview", meta: "5h ago", src: "The Coaches' Voice" },
              { imgBg: "linear-gradient(135deg,#ff5b3d,#ffa030)", icon: "ball-tennis", tag: "Tennis", title: "Sinner's serve numbers under the lights — the most quietly elite stat of 2026", meta: "7h ago", src: "ATP Insider" },
            ].map((n) => (
              <div key={n.title} className="l-news-card">
                <div className={`l-news-img${n.imgCls ? " " + n.imgCls : ""}`} style={n.imgBg ? { background: n.imgBg } : undefined}>
                  <div className="l-news-emoji-bg" />
                  <div className="l-news-img-emoji" style={n.iconColor ? { color: n.iconColor } : undefined}><svg width="80" height="80"><use href={`#${n.icon}`} /></svg></div>
                </div>
                <div className="l-news-body">
                  <span className={`l-news-tag${n.tag === "live" ? " live" : ""}`}>{n.tagLabel || n.tag}</span>
                  <h3 className="l-news-title">{n.title}</h3>
                  <div className="l-news-foot"><span>{n.meta}</span><span>{n.src}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Final CTA ─────────────────────────────── */}
      <div className="l-cta-final reveal">
        <div className="l-cta-wrap">
          <svg className="l-cta-star s1" viewBox="0 0 40 40"><use href="#star" /></svg>
          <svg className="l-cta-star s2" viewBox="0 0 40 40"><use href="#star" /></svg>
          <svg className="l-cta-star s3" viewBox="0 0 40 40"><use href="#star" /></svg>
          <h2>
            Stop arguing<br />
            with <span className="l-stack-em">tab clutter.</span><br />
            Start arguing.
          </h2>
          <p>Free forever for fans. No ads, no signup wall, no &quot;premium tier for advanced stats&quot; nonsense.</p>
          <div className="l-cta-buttons">
            <a href="/login" className="l-btn l-btn-orange l-btn-lg">Create my account →</a>
            <a href="/dashboard" className="l-btn l-btn-ghost l-btn-lg">Tour the dashboard</a>
          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────── */}
      <footer>
        <div className="l-foot-wrap">
          <div className="l-foot-grid">
            <div className="l-foot-brand">
              <div className="l-logo">
                <div className="l-logo-mark">
                  <Image src="/curly-guy.png" alt="Curly" width={40} height={40} quality={100} />
                </div>
                <span style={{ color: "var(--paper)" }}>curly<span style={{ color: "var(--orange)" }}>.</span>sports</span>
              </div>
              <p className="l-foot-tag">Sports analytics built by a curly-haired teenager who got tired of bad UI. Made in a bedroom.</p>
            </div>
            <div className="l-foot-col">
              <div className="l-foot-col-head">Platform</div>
              <ul>
                <li><a href="/dashboard">Dashboard</a></li>
                <li><a href="/live-scores">Live scores</a></li>
                <li><a href="/fun-zone">Debates</a></li>
                <li><a href="/mini-games">Mini-games</a></li>
              </ul>
            </div>
            <div className="l-foot-col">
              <div className="l-foot-col-head">Sports</div>
              <ul>
                <li><a href="#"><svg width="14" height="14" viewBox="0 0 40 40"><use href="#ball-soccer" /></svg> Football</a></li>
                <li><a href="#"><svg width="14" height="14" viewBox="0 0 40 40"><use href="#ball-basket" /></svg> Basketball</a></li>
                <li><a href="#"><svg width="18" height="12" viewBox="0 0 50 30"><use href="#ball-nfl" /></svg> NFL</a></li>
                <li><a href="#"><svg width="14" height="14" viewBox="0 0 40 40"><use href="#ball-tennis" /></svg> Tennis</a></li>
                <li><a href="#"><svg width="14" height="14" viewBox="0 0 40 40"><use href="#ball-base" /></svg> Baseball</a></li>
                <li><a href="#"><svg width="14" height="14" viewBox="0 0 40 40"><use href="#ball-f1" /></svg> Formula 1</a></li>
              </ul>
            </div>
            <div className="l-foot-col">
              <div className="l-foot-col-head">Company</div>
              <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#founder">Founder</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
              </ul>
            </div>
            <div className="l-foot-col">
              <div className="l-foot-col-head">Connect</div>
              <ul>
                <li><a href="#">Twitter / X</a></li>
                <li><a href="#">Instagram</a></li>
                <li><a href="#">TikTok</a></li>
                <li><a href="#">Discord</a></li>
              </ul>
            </div>
          </div>
          <div className="l-big-word">curly.</div>
          <div className="l-foot-bottom">
            <span>© 2026 Curly Sports. Made on a napkin in May.</span>
            <span>v1.0 · Status: All systems live ●</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
