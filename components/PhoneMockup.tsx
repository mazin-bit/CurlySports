"use client";
import { useState, useCallback } from "react";
import "./phone-mockup.css";

/* ═══════════════════════════════════════════════
   MOCK DATA — All hardcoded, no API calls
   ═══════════════════════════════════════════════ */

const SPORTS = ["Football", "Cricket", "NBA", "F1", "Tennis"] as const;
type Sport = (typeof SPORTS)[number];

interface MockMatch {
  home: string;
  away: string;
  homeScore: string;
  awayScore: string;
  status: "live" | "ft" | "upcoming";
  minute?: string;
  time?: string;
  league: string;
  homeCrest: string;
  awayCrest: string;
}

const MATCHES: Record<Sport, MockMatch[]> = {
  Football: [
    { home: "Arsenal", away: "Chelsea", homeScore: "2", awayScore: "1", status: "live", minute: "67'", league: "EPL", homeCrest: "ars", awayCrest: "che" },
    { home: "Real Madrid", away: "Barcelona", homeScore: "1", awayScore: "4", status: "ft", league: "LA LIGA", homeCrest: "rma", awayCrest: "bar" },
    { home: "Man City", away: "Liverpool", homeScore: "-", awayScore: "-", status: "upcoming", time: "20:00", league: "EPL", homeCrest: "mci", awayCrest: "liv" },
    { home: "PSG", away: "Bayern", homeScore: "3", awayScore: "2", status: "live", minute: "82'", league: "UCL", homeCrest: "psg", awayCrest: "bay" },
    { home: "Juventus", away: "Inter", homeScore: "0", awayScore: "0", status: "upcoming", time: "21:00", league: "SERIE A", homeCrest: "juv", awayCrest: "int" },
    { home: "Dortmund", away: "Leipzig", homeScore: "2", awayScore: "2", status: "ft", league: "BUNDESLIGA", homeCrest: "dor", awayCrest: "lei" },
  ],
  Cricket: [
    { home: "Mumbai Indians", away: "Chennai SK", homeScore: "186/4", awayScore: "143/8", status: "ft", league: "IPL", homeCrest: "mi", awayCrest: "csk" },
    { home: "India", away: "Australia", homeScore: "312/5", awayScore: "156/3", status: "live", minute: "Day 2", league: "TEST", homeCrest: "ind", awayCrest: "aus" },
    { home: "RCB", away: "KKR", homeScore: "-", awayScore: "-", status: "upcoming", time: "19:30", league: "IPL", homeCrest: "rcb", awayCrest: "kkr" },
  ],
  NBA: [
    { home: "Lakers", away: "Warriors", homeScore: "112", awayScore: "108", status: "live", minute: "Q4 2:30", league: "NBA", homeCrest: "lal", awayCrest: "gsw" },
    { home: "Celtics", away: "Bucks", homeScore: "98", awayScore: "103", status: "ft", league: "NBA", homeCrest: "bos", awayCrest: "mil" },
    { home: "76ers", away: "Knicks", homeScore: "-", awayScore: "-", status: "upcoming", time: "19:00", league: "NBA", homeCrest: "phi", awayCrest: "nyk" },
  ],
  F1: [
    { home: "Verstappen", away: "Hamilton", homeScore: "P1", awayScore: "P2", status: "live", minute: "Lap 45/57", league: "F1 GP", homeCrest: "ver", awayCrest: "ham" },
    { home: "Leclerc", away: "Norris", homeScore: "P3", awayScore: "P4", status: "live", minute: "Lap 45/57", league: "F1 GP", homeCrest: "lec", awayCrest: "nor" },
  ],
  Tennis: [
    { home: "Djokovic", away: "Alcaraz", homeScore: "6-4", awayScore: "4-6", status: "live", minute: "Set 3", league: "WIMBLEDON", homeCrest: "djo", awayCrest: "alc" },
    { home: "Sinner", away: "Medvedev", homeScore: "7-5", awayScore: "6-3", status: "ft", league: "ATP 1000", homeCrest: "sin", awayCrest: "med" },
  ],
};

const NEWS = [
  { title: "Transfer Deadline Day: Top 10 Deals That Shaped the Window", src: "BBC Sport", sport: "Football", time: "5m ago", color: "#ff5b3d" },
  { title: "NBA Playoffs: Lakers Force Game 7 With Clutch Performance", src: "ESPN", sport: "Basketball", time: "12m ago", color: "#7c5cff" },
  { title: "IPL 2026: Mumbai Indians Clinch Record 7th Title", src: "Cricbuzz", sport: "Cricket", time: "1h ago", color: "#38c9ff" },
  { title: "Alcaraz Wins Third Consecutive Roland Garros Crown", src: "Sky Sports", sport: "Tennis", time: "3h ago", color: "#2dd4bf" },
];

const STANDINGS = {
  "Premier League": [
    { pos: 1, team: "Arsenal", p: 38, w: 28, d: 6, l: 4, pts: 90, crest: "ars" },
    { pos: 2, team: "Man City", p: 38, w: 27, d: 7, l: 4, pts: 88, crest: "mci" },
    { pos: 3, team: "Liverpool", p: 38, w: 24, d: 8, l: 6, pts: 80, crest: "liv" },
    { pos: 4, team: "Chelsea", p: 38, w: 22, d: 5, l: 11, pts: 71, crest: "che" },
    { pos: 5, team: "Newcastle", p: 38, w: 20, d: 6, l: 12, pts: 66, crest: "new" },
    { pos: 6, team: "Tottenham", p: 38, w: 19, d: 7, l: 12, pts: 64, crest: "tot" },
  ],
  "NBA East": [
    { pos: 1, team: "Celtics", p: 82, w: 64, d: 0, l: 18, pts: 64, crest: "bos" },
    { pos: 2, team: "Bucks", p: 82, w: 58, d: 0, l: 24, pts: 58, crest: "mil" },
    { pos: 3, team: "76ers", p: 82, w: 54, d: 0, l: 28, pts: 54, crest: "phi" },
    { pos: 4, team: "Knicks", p: 82, w: 50, d: 0, l: 32, pts: 50, crest: "nyk" },
    { pos: 5, team: "Cavaliers", p: 82, w: 48, d: 0, l: 34, pts: 48, crest: "cle" },
  ],
};

const TEAMS = [
  { name: "Arsenal", crest: "ars", league: "EPL" },
  { name: "Real Madrid", crest: "rma", league: "La Liga" },
  { name: "Barcelona", crest: "bar", league: "La Liga" },
  { name: "Man City", crest: "mci", league: "EPL" },
  { name: "Liverpool", crest: "liv", league: "EPL" },
  { name: "Bayern", crest: "bay", league: "Bundesliga" },
  { name: "PSG", crest: "psg", league: "Ligue 1" },
  { name: "Juventus", crest: "juv", league: "Serie A" },
];

const PLAYERS = [
  { name: "Erling Haaland", team: "Man City", pos: "ST", stat: "36 Goals", crest: "mci" },
  { name: "Kylian Mbappe", team: "Real Madrid", pos: "LW", stat: "28 Goals", crest: "rma" },
  { name: "LeBron James", team: "Lakers", pos: "SF", stat: "27.1 PPG", crest: "lal" },
  { name: "Virat Kohli", team: "RCB", pos: "BAT", stat: "973 Runs", crest: "rcb" },
  { name: "Novak Djokovic", team: "Serbia", pos: "ATP #1", stat: "24 Slams", crest: "djo" },
  { name: "Max Verstappen", team: "Red Bull", pos: "Driver", stat: "3x WDC", crest: "ver" },
];

const DEBATES = [
  { q: "Who is the GOAT?", optA: "Messi", optB: "Ronaldo", pctA: 52, pctB: 48, votes: "124.5K" },
  { q: "Best league in the world?", optA: "EPL", optB: "La Liga", pctA: 61, pctB: 39, votes: "89.2K" },
];

const MINI_GAMES = [
  { name: "Sports Quiz", desc: "Test your sports knowledge", icon: "quiz", color: "#ff5b3d" },
  { name: "Predict & Win", desc: "Predict match outcomes", icon: "predict", color: "#7c5cff" },
  { name: "Guess the Player", desc: "Identify from silhouettes", icon: "guess", color: "#2dd4bf" },
];

type Screen = "dashboard" | "live" | "news" | "leagues" | "teams" | "players" | "debates" | "minigames" | "profile" | "matchDetail";

const TAB_MAP: Record<string, Screen> = {
  home: "dashboard",
  live: "live",
  redeem: "debates",
  leagues: "leagues",
  more: "profile",
};

const MENU_ITEMS: { label: string; screen: Screen; icon: string }[] = [
  { label: "Dashboard", screen: "dashboard", icon: "home" },
  { label: "Live Scores", screen: "live", icon: "play" },
  { label: "News", screen: "news", icon: "news" },
  { label: "Leagues", screen: "leagues", icon: "trophy" },
  { label: "Teams", screen: "teams", icon: "shield" },
  { label: "Players", screen: "players", icon: "users" },
  { label: "Fun Zone", screen: "debates", icon: "message" },
  { label: "Mini Games", screen: "minigames", icon: "gamepad" },
  { label: "Profile", screen: "profile", icon: "user" },
];

/* ═══════════════════════════════════════════════
   PHONE MOCKUP COMPONENT
   ═══════════════════════════════════════════════ */

export default function PhoneMockup() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [prevScreen, setPrevScreen] = useState<Screen>("dashboard");
  const [sport, setSport] = useState<Sport>("Football");
  const [menuOpen, setMenuOpen] = useState(false);
  const [matchDetail, setMatchDetail] = useState<MockMatch | null>(null);
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");

  const screenOrder: Screen[] = ["dashboard", "live", "news", "leagues", "teams", "players", "debates", "minigames", "profile"];

  const navigateTo = useCallback((target: Screen) => {
    if (target === screen) return;
    const curIdx = screenOrder.indexOf(screen);
    const tgtIdx = screenOrder.indexOf(target);
    setSlideDir(tgtIdx > curIdx ? "left" : "right");
    setPrevScreen(screen);
    setScreen(target);
    setMenuOpen(false);
    setMatchDetail(null);
  }, [screen]);

  const openMatch = useCallback((match: MockMatch) => {
    setMatchDetail(match);
  }, []);

  const activeTab = screen === "dashboard" ? "home" : screen === "live" ? "live" : screen === "debates" ? "redeem" : screen === "leagues" ? "leagues" : "more";

  return (
    <div className="pm-app">
      {/* Status bar */}
      <div className="pm-statusbar">
        <span className="pm-time">9:41</span>
        <span className="pm-status-icons">
          <svg width="14" height="10" viewBox="0 0 14 10"><rect x="0" y="4" width="2.5" height="6" rx="0.5" fill="currentColor" opacity="0.4"/><rect x="3.5" y="2.5" width="2.5" height="7.5" rx="0.5" fill="currentColor" opacity="0.6"/><rect x="7" y="1" width="2.5" height="9" rx="0.5" fill="currentColor" opacity="0.8"/><rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="currentColor"/></svg>
          <svg width="13" height="10" viewBox="0 0 13 10"><path d="M0.5 3.5C3.5 0.5 9.5 0.5 12.5 3.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M2.5 5.5C4.5 3.5 8.5 3.5 10.5 5.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M4.5 7.5C5.5 6.5 7.5 6.5 8.5 7.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><circle cx="6.5" cy="9.5" r="1" fill="currentColor"/></svg>
          <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0" y="1" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="1" fill="none"/><rect x="1.5" y="2.5" width="13" height="5" rx="1" fill="#4cd964"/><rect x="19" y="3" width="2" height="4" rx="0.5" fill="currentColor" opacity="0.4"/></svg>
        </span>
      </div>

      {/* Topbar */}
      <div className="pm-topbar">
        <div className="pm-logo-badge" onClick={() => navigateTo("dashboard")}>
          <img src="/curly-mark.png" alt="" className="pm-logo-img" />
        </div>
        <div className="pm-topbar-center">
          <span className="pm-topbar-sub">LIVE SPORTS HUB</span>
          <span className="pm-topbar-title">Curly Sports</span>
        </div>
        <div className="pm-topbar-actions">
          <button className="pm-icon-btn" onClick={() => navigateTo("news")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </button>
          <button className="pm-icon-btn pm-bell" onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
            <span className="pm-notif-dot"></span>
          </button>
        </div>
      </div>

      {/* Sport selector */}
      {(screen === "dashboard" || screen === "live") && (
        <div className="pm-sport-strip">
          {SPORTS.map((s) => (
            <button key={s} className={`pm-sport-chip ${sport === s ? "active" : ""}`} onClick={() => setSport(s)}>{s}</button>
          ))}
        </div>
      )}

      {/* Menu drawer */}
      <div className={`pm-drawer ${menuOpen ? "open" : ""}`}>
        <div className="pm-drawer-overlay" onClick={() => setMenuOpen(false)} />
        <div className="pm-drawer-panel">
          <div className="pm-drawer-header">
            <img src="/curly-mark.png" alt="" className="pm-drawer-logo" />
            <span>Curly Sports</span>
          </div>
          {MENU_ITEMS.map((item) => (
            <button
              key={item.screen}
              className={`pm-drawer-item ${screen === item.screen ? "active" : ""}`}
              onClick={() => navigateTo(item.screen)}
            >
              <MenuIcon icon={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Screen content */}
      <div className="pm-content">
        <div className={`pm-screen-wrap pm-slide-${slideDir}`} key={screen}>
          {screen === "dashboard" && <DashboardScreen sport={sport} onMatch={openMatch} onNav={navigateTo} />}
          {screen === "live" && <LiveScoresScreen sport={sport} onMatch={openMatch} />}
          {screen === "news" && <NewsScreen />}
          {screen === "leagues" && <LeaguesScreen />}
          {screen === "teams" && <TeamsScreen />}
          {screen === "players" && <PlayersScreen />}
          {screen === "debates" && <DebatesScreen />}
          {screen === "minigames" && <MiniGamesScreen />}
          {screen === "profile" && <ProfileScreen onNav={navigateTo} />}
        </div>
      </div>

      {/* Match detail overlay */}
      {matchDetail && (
        <div className="pm-overlay">
          <MatchDetailScreen match={matchDetail} onBack={() => setMatchDetail(null)} />
        </div>
      )}

      {/* Bottom nav */}
      <div className="pm-bottomnav">
        {(["home", "live", "redeem", "leagues", "more"] as const).map((tab) => (
          <button key={tab} className={`pm-nav-item ${activeTab === tab ? "active" : ""}`} onClick={() => navigateTo(TAB_MAP[tab])}>
            <NavIcon tab={tab} />
            <span>{tab.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCREEN COMPONENTS
   ═══════════════════════════════════════════════ */

function DashboardScreen({ sport, onMatch, onNav }: { sport: Sport; onMatch: (m: MockMatch) => void; onNav: (s: Screen) => void }) {
  const matches = MATCHES[sport] || [];
  return (
    <div className="pm-scroll">
      <SectionHeader title="LIVE SCORES" live onSeeAll={() => onNav("live")} />
      {matches.slice(0, 3).map((m, i) => (
        <MatchCard key={i} match={m} onClick={() => onMatch(m)} />
      ))}
      <SectionHeader title="TRENDING" onSeeAll={() => onNav("news")} />
      {NEWS.slice(0, 2).map((n, i) => (
        <div key={i} className="pm-news-card" onClick={() => {}}>
          <div className="pm-news-thumb" style={{ background: n.color }} />
          <div className="pm-news-body">
            <div className="pm-news-meta">
              <span className="pm-news-src">{n.src}</span>
              <span className="pm-news-tag">{n.sport}</span>
            </div>
            <div className="pm-news-title">{n.title}</div>
            <span className="pm-news-time">{n.time}</span>
          </div>
        </div>
      ))}
      <SectionHeader title="QUICK STATS" />
      <div className="pm-stats-row">
        <div className="pm-stat-card">
          <span className="pm-stat-val">312</span>
          <span className="pm-stat-label">Live matches today</span>
        </div>
        <div className="pm-stat-card">
          <span className="pm-stat-val">17</span>
          <span className="pm-stat-label">Sports covered</span>
        </div>
      </div>
    </div>
  );
}

function LiveScoresScreen({ sport, onMatch }: { sport: Sport; onMatch: (m: MockMatch) => void }) {
  const matches = MATCHES[sport] || [];
  return (
    <div className="pm-scroll">
      <SectionHeader title="ALL MATCHES" live />
      {matches.map((m, i) => (
        <MatchCard key={i} match={m} onClick={() => onMatch(m)} />
      ))}
      {matches.length === 0 && <div className="pm-empty">No {sport} matches right now</div>}
    </div>
  );
}

function NewsScreen() {
  return (
    <div className="pm-scroll">
      <div className="pm-screen-title">News</div>
      {NEWS.map((n, i) => (
        <div key={i} className="pm-news-card-lg">
          <div className="pm-news-thumb-lg" style={{ background: `linear-gradient(135deg, ${n.color}, ${n.color}88)` }}>
            <span className="pm-news-tag-overlay">{n.sport}</span>
          </div>
          <div className="pm-news-body">
            <div className="pm-news-meta">
              <span className="pm-news-src">{n.src}</span>
              <span className="pm-news-time">{n.time}</span>
            </div>
            <div className="pm-news-title">{n.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LeaguesScreen() {
  return (
    <div className="pm-scroll">
      <div className="pm-screen-title">Leagues</div>
      {Object.entries(STANDINGS).map(([league, rows]) => (
        <div key={league} className="pm-table-card">
          <div className="pm-table-header">{league}</div>
          <div className="pm-table-head-row">
            <span className="pm-th pm-th-pos">#</span>
            <span className="pm-th pm-th-team">Team</span>
            <span className="pm-th">W</span>
            <span className="pm-th">L</span>
            <span className="pm-th pm-th-pts">PTS</span>
          </div>
          {rows.map((r) => (
            <div key={r.pos} className="pm-table-row">
              <span className="pm-td pm-td-pos">{r.pos}</span>
              <span className="pm-td pm-td-team">
                <span className={`pm-crest-sm crest-${r.crest}`}></span>
                {r.team}
              </span>
              <span className="pm-td">{r.w}</span>
              <span className="pm-td">{r.l}</span>
              <span className="pm-td pm-td-pts">{r.pts}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TeamsScreen() {
  return (
    <div className="pm-scroll">
      <div className="pm-screen-title">Teams</div>
      <div className="pm-team-grid">
        {TEAMS.map((t) => (
          <div key={t.name} className="pm-team-card">
            <div className={`pm-team-crest crest-${t.crest}`}></div>
            <span className="pm-team-name">{t.name}</span>
            <span className="pm-team-league">{t.league}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayersScreen() {
  return (
    <div className="pm-scroll">
      <div className="pm-screen-title">Players</div>
      {PLAYERS.map((p) => (
        <div key={p.name} className="pm-player-card">
          <div className="pm-player-avatar">
            <span>{p.name.split(" ").map(n => n[0]).join("")}</span>
          </div>
          <div className="pm-player-info">
            <span className="pm-player-name">{p.name}</span>
            <span className="pm-player-team">{p.team} · {p.pos}</span>
          </div>
          <span className="pm-player-stat">{p.stat}</span>
        </div>
      ))}
    </div>
  );
}

function DebatesScreen() {
  return (
    <div className="pm-scroll">
      <div className="pm-screen-title">Fun Zone</div>
      {DEBATES.map((d, i) => (
        <div key={i} className="pm-debate-card">
          <div className="pm-debate-q">{d.q}</div>
          <div className="pm-debate-options">
            <div className="pm-debate-opt">
              <div className="pm-debate-bar" style={{ width: `${d.pctA}%` }}></div>
              <span className="pm-debate-label">{d.optA}</span>
              <span className="pm-debate-pct">{d.pctA}%</span>
            </div>
            <div className="pm-debate-opt">
              <div className="pm-debate-bar bar-b" style={{ width: `${d.pctB}%` }}></div>
              <span className="pm-debate-label">{d.optB}</span>
              <span className="pm-debate-pct">{d.pctB}%</span>
            </div>
          </div>
          <span className="pm-debate-votes">{d.votes} votes</span>
        </div>
      ))}
      <div className="pm-screen-title" style={{ marginTop: 8 }}>Predictions</div>
      <div className="pm-predict-card">
        <div className="pm-predict-q">Who wins the Champions League?</div>
        <div className="pm-predict-opts">
          {["Real Madrid", "Man City", "Arsenal", "Bayern"].map((t) => (
            <button key={t} className="pm-predict-btn">{t}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniGamesScreen() {
  return (
    <div className="pm-scroll">
      <div className="pm-screen-title">Mini Games</div>
      {MINI_GAMES.map((g) => (
        <div key={g.name} className="pm-game-card">
          <div className="pm-game-icon" style={{ background: g.color }}>
            <GameIcon icon={g.icon} />
          </div>
          <div className="pm-game-info">
            <span className="pm-game-name">{g.name}</span>
            <span className="pm-game-desc">{g.desc}</span>
          </div>
          <button className="pm-game-play">Play</button>
        </div>
      ))}
      <div className="pm-leaderboard">
        <div className="pm-lb-header">Leaderboard</div>
        {["CurlyFan99", "SportsKing", "GoalMaster", "TopSpin"].map((u, i) => (
          <div key={u} className="pm-lb-row">
            <span className={`pm-lb-rank rank-${i + 1}`}>{i + 1}</span>
            <span className="pm-lb-avatar">{u[0]}</span>
            <span className="pm-lb-name">{u}</span>
            <span className="pm-lb-score">{[2840, 2650, 2420, 2180][i]} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileScreen({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <div className="pm-scroll">
      <div className="pm-profile-header">
        <div className="pm-profile-avatar">CS</div>
        <div className="pm-profile-info">
          <span className="pm-profile-name">CurlySports Fan</span>
          <span className="pm-profile-handle">@curlyfan</span>
        </div>
      </div>
      <div className="pm-profile-stats">
        <div className="pm-pstat"><span className="pm-pstat-val">847</span><span className="pm-pstat-label">Points</span></div>
        <div className="pm-pstat"><span className="pm-pstat-val">23</span><span className="pm-pstat-label">Debates</span></div>
        <div className="pm-pstat"><span className="pm-pstat-val">5</span><span className="pm-pstat-label">Favorites</span></div>
      </div>
      <div className="pm-profile-section">
        <div className="pm-profile-item" onClick={() => onNav("teams")}>
          <span>Favorite Team</span>
          <span className="pm-profile-val">Arsenal</span>
        </div>
        <div className="pm-profile-item" onClick={() => onNav("news")}>
          <span>News Preferences</span>
          <span className="pm-profile-arrow">&rsaquo;</span>
        </div>
        <div className="pm-profile-item">
          <span>Notifications</span>
          <span className="pm-profile-val">On</span>
        </div>
        <div className="pm-profile-item">
          <span>Dark Mode</span>
          <span className="pm-profile-val">Off</span>
        </div>
        <div className="pm-profile-item">
          <span>Language</span>
          <span className="pm-profile-val">English</span>
        </div>
      </div>
    </div>
  );
}

function MatchDetailScreen({ match, onBack }: { match: MockMatch; onBack: () => void }) {
  return (
    <div className="pm-match-detail">
      <button className="pm-back-btn" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
        Back
      </button>
      <div className="pm-md-header">
        <span className="pm-md-league">{match.league}</span>
        <div className="pm-md-score-row">
          <div className="pm-md-team">
            <div className={`pm-md-crest crest-${match.homeCrest}`}></div>
            <span>{match.home}</span>
          </div>
          <div className="pm-md-score">
            <span>{match.homeScore}</span>
            <span className="pm-md-divider">-</span>
            <span>{match.awayScore}</span>
          </div>
          <div className="pm-md-team">
            <div className={`pm-md-crest crest-${match.awayCrest}`}></div>
            <span>{match.away}</span>
          </div>
        </div>
        {match.status === "live" && <span className="pm-md-status live"><span className="pm-live-dot"></span>{match.minute}</span>}
        {match.status === "ft" && <span className="pm-md-status ft">Full Time</span>}
        {match.status === "upcoming" && <span className="pm-md-status upcoming">{match.time}</span>}
      </div>
      <div className="pm-md-section">
        <div className="pm-md-section-title">Match Timeline</div>
        <div className="pm-timeline">
          <div className="pm-tl-event"><span className="pm-tl-min">23&apos;</span><span className="pm-tl-icon goal">&#9917;</span><span className="pm-tl-text">Goal - {match.home}</span></div>
          <div className="pm-tl-event"><span className="pm-tl-min">45&apos;</span><span className="pm-tl-icon card">&#128997;</span><span className="pm-tl-text">Yellow Card</span></div>
          <div className="pm-tl-event"><span className="pm-tl-min">58&apos;</span><span className="pm-tl-icon goal">&#9917;</span><span className="pm-tl-text">Goal - {match.away}</span></div>
          <div className="pm-tl-event"><span className="pm-tl-min">67&apos;</span><span className="pm-tl-icon goal">&#9917;</span><span className="pm-tl-text">Goal - {match.home}</span></div>
        </div>
      </div>
      <div className="pm-md-section">
        <div className="pm-md-section-title">Lineups</div>
        <div className="pm-lineup-row">
          <div className="pm-lineup-col">
            <div className="pm-lineup-team-name">{match.home}</div>
            {["GK · Martinez", "CB · Saliba", "CB · Gabriel", "LB · Zinchenko", "RB · White"].map((p) => (
              <div key={p} className="pm-lineup-player">{p}</div>
            ))}
          </div>
          <div className="pm-lineup-col">
            <div className="pm-lineup-team-name">{match.away}</div>
            {["GK · Sanchez", "CB · Colwill", "CB · Fofana", "LB · Cucurella", "RB · James"].map((p) => (
              <div key={p} className="pm-lineup-player">{p}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SHARED SUBCOMPONENTS
   ═══════════════════════════════════════════════ */

function SectionHeader({ title, live, onSeeAll }: { title: string; live?: boolean; onSeeAll?: () => void }) {
  return (
    <div className="pm-section-header">
      <div className="pm-section-left">
        {live && <span className="pm-live-dot"></span>}
        <span>{title}</span>
      </div>
      {onSeeAll && <button className="pm-see-all" onClick={onSeeAll}>See all</button>}
    </div>
  );
}

function MatchCard({ match, onClick }: { match: MockMatch; onClick: () => void }) {
  return (
    <div className={`pm-match-card ${match.status === "live" ? "live" : ""}`} onClick={onClick}>
      <div className="pm-match-row">
        <div className="pm-team-side">
          <div className={`pm-crest crest-${match.homeCrest}`}></div>
          <span className="pm-team-name">{match.home}</span>
        </div>
        <span className={`pm-score ${match.status === "upcoming" ? "dim" : ""}`}>{match.homeScore}</span>
      </div>
      <div className="pm-match-row">
        <div className="pm-team-side">
          <div className={`pm-crest crest-${match.awayCrest}`}></div>
          <span className="pm-team-name">{match.away}</span>
        </div>
        <span className={`pm-score ${match.status === "upcoming" ? "dim" : ""}`}>{match.awayScore}</span>
      </div>
      <div className="pm-match-meta">
        <span className={`pm-pill pill-${match.status}`}>
          {match.status === "live" && <><span className="pm-live-dot-sm"></span>{match.minute}</>}
          {match.status === "ft" && "FT"}
          {match.status === "upcoming" && match.time}
        </span>
        <span className="pm-league-label">{match.league}</span>
      </div>
    </div>
  );
}

function NavIcon({ tab }: { tab: string }) {
  const s = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round" as const };
  switch (tab) {
    case "home": return <svg {...s}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
    case "live": return <svg {...s}><polygon points="5 3 19 12 5 21 5 3"/></svg>;
    case "redeem": return <svg {...s}><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
    case "leagues": return <svg {...s}><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M6 3h12v8a6 6 0 0 1-12 0V3z"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>;
    case "more": return <svg {...s}><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>;
    default: return null;
  }
}

function MenuIcon({ icon }: { icon: string }) {
  const s = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const };
  switch (icon) {
    case "home": return <svg {...s}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
    case "play": return <svg {...s}><polygon points="5 3 19 12 5 21 5 3"/></svg>;
    case "news": return <svg {...s}><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z"/><path d="M2 10h4"/><path d="M10 6h8"/><path d="M10 10h4"/></svg>;
    case "trophy": return <svg {...s}><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M6 3h12v8a6 6 0 0 1-12 0V3z"/></svg>;
    case "shield": return <svg {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case "users": return <svg {...s}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "message": return <svg {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "gamepad": return <svg {...s}><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 10v4"/><path d="M5 12h4"/></svg>;
    case "user": return <svg {...s}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    default: return null;
  }
}

function GameIcon({ icon }: { icon: string }) {
  const s = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "#fff", strokeWidth: 2, strokeLinecap: "round" as const };
  switch (icon) {
    case "quiz": return <svg {...s}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>;
    case "predict": return <svg {...s}><path d="M12 2v20"/><path d="m17 5-5 5-5-5"/><path d="m17 19-5-5-5 5"/></svg>;
    case "guess": return <svg {...s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    default: return null;
  }
}
