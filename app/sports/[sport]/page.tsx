import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import styles from "./sport.module.css";

const SITE_URL = "https://curlysports.com";

interface SportConfig {
  name: string;
  title: string;
  description: string;
  keywords: string[];
  espnSport: string;
  espnLeague: string;
  leagues: string[];
  faq: { q: string; a: string }[];
  content: string;
}

const SPORT_CONFIGS: Record<string, SportConfig> = {
  football: {
    name: "Football",
    title: "Live Football Scores, Standings & News",
    description: "Follow live football scores, Premier League, La Liga, Serie A, Bundesliga, and Ligue 1 standings, match results, and breaking football news on Curly Sports.",
    keywords: [
      "live football scores", "football scores today", "soccer scores today", "football live",
      "Premier League scores", "Premier League live", "Premier League results today", "EPL scores", "EPL live scores", "EPL results",
      "La Liga scores", "La Liga standings", "La Liga results", "Serie A scores", "Serie A results",
      "Bundesliga scores", "Bundesliga results", "Ligue 1 scores", "MLS scores",
      "Champions League scores", "Champions League results", "Europa League scores",
      "football match today", "soccer scores", "soccer live scores", "soccer results today",
      "football results", "football standings", "football table", "football news today",
      "who is playing today football", "tonight football scores", "football scores now",
      "premier league table", "premier league standings 2026", "football transfers",
      "football highlights", "football player stats", "football team stats",
    ],
    espnSport: "soccer",
    espnLeague: "eng.1",
    leagues: ["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1", "Champions League", "MLS"],
    faq: [
      { q: "Where can I watch live football scores for free?", a: "Curly Sports provides free real-time football scores for all major leagues including the Premier League, La Liga, Serie A, Bundesliga, and Champions League. Scores update every 10 seconds during live matches." },
      { q: "What football leagues does Curly Sports cover?", a: "We cover 15+ football leagues worldwide including the Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League, MLS, Liga MX, Eredivisie, and more." },
      { q: "Can I get football match notifications?", a: "Yes! Download the Curly Sports app and enable notifications to get instant alerts for goals, red cards, and full-time results for your favorite teams." },
    ],
    content: "Stay on top of every goal, assist, and red card across the world's biggest football leagues. Curly Sports delivers real-time scores from the Premier League, La Liga, Serie A, Bundesliga, Ligue 1, and Champions League — all in one place. Track league standings, explore team rosters, view player statistics, and read the latest transfer news and match previews. Whether you follow Manchester City, Real Madrid, or your local club, Curly Sports keeps you connected to the beautiful game.",
  },
  cricket: {
    name: "Cricket",
    title: "Live Cricket Scores, IPL 2026 & Match Updates",
    description: "Get live cricket scores, IPL 2026 standings, T20 World Cup updates, and ball-by-ball commentary. Follow your favorite cricket teams on Curly Sports.",
    keywords: [
      "live cricket score", "cricket live score today", "cricket scores today", "cricket match live",
      "IPL score today", "IPL live score", "IPL live score today", "IPL 2026", "IPL 2026 standings", "IPL points table",
      "T20 World Cup scores", "T20 scores today", "test match scores", "ODI scores",
      "cricket scores", "ball by ball", "cricket live updates", "cricket scorecard",
      "cricket results today", "cricket match today", "today cricket score",
      "cricket news today", "cricket highlights", "cricket player stats",
      "IPL highlights", "IPL news", "cricket team stats", "cricket standings",
    ],
    espnSport: "cricket",
    espnLeague: "icc",
    leagues: ["IPL", "ICC World Cup", "T20 World Cup", "Big Bash", "LPL", "The Hundred", "PSL"],
    faq: [
      { q: "Where can I check IPL live scores?", a: "Curly Sports provides real-time IPL scores with ball-by-ball updates, live commentary, and scorecard details for every match of IPL 2026." },
      { q: "Does Curly Sports cover international cricket?", a: "Yes, we cover all ICC events including the Cricket World Cup, T20 World Cup, and bilateral series between all Test-playing nations, plus domestic T20 leagues like IPL, Big Bash, PSL, and more." },
    ],
    content: "Follow every ball of every match with Curly Sports' live cricket coverage. From the IPL to the ICC World Cup, we deliver real-time scores, detailed scorecards, batting and bowling statistics, and live commentary. Track IPL 2026 standings, explore team squads, and compare player stats across formats. Whether it's a thrilling T20 chase or a five-day Test epic, Curly Sports is your ultimate cricket companion.",
  },
  basketball: {
    name: "Basketball",
    title: "NBA Scores Today, Standings & Basketball News",
    description: "Live NBA scores, standings, player stats, and basketball news. Follow every game of the NBA season on Curly Sports.",
    keywords: [
      "NBA scores today", "NBA live scores", "NBA scores right now", "basketball scores today",
      "basketball live scores", "NBA standings", "NBA standings 2026", "NBA stats",
      "basketball scores", "NBA playoffs", "NBA live", "NBA games today",
      "NBA results today", "NBA scoreboard", "NBA player stats", "NBA news today",
      "NBA highlights", "basketball news", "NBA trade rumors", "NBA finals",
      "who is winning the NBA game", "NBA schedule today",
    ],
    espnSport: "basketball",
    espnLeague: "nba",
    leagues: ["NBA", "EuroLeague", "NCAA Basketball", "WNBA"],
    faq: [
      { q: "Where can I find NBA scores today?", a: "Curly Sports shows live NBA scores updated in real-time. See the full scoreboard with quarter-by-quarter scores, player stats, and box scores for every game." },
      { q: "Does Curly Sports cover NBA playoffs?", a: "Yes, we provide complete NBA playoff coverage including bracket visualization, live scores, series standings, and player performance stats throughout the postseason." },
    ],
    content: "Never miss a buzzer-beater with Curly Sports' live NBA coverage. Get real-time scores for every NBA game, complete with quarter scores, player stats, and box scores. Track NBA standings, explore team rosters, and follow your favorite players' performance throughout the season. From the regular season to the NBA Finals, Curly Sports delivers comprehensive basketball coverage.",
  },
  tennis: {
    name: "Tennis",
    title: "Live Tennis Scores, ATP Rankings & Results",
    description: "Live tennis scores, ATP and WTA rankings, Grand Slam results, and tennis news. Follow all major tournaments on Curly Sports.",
    keywords: [
      "tennis scores live", "tennis scores today", "tennis live scores",
      "ATP rankings", "ATP scores today", "WTA rankings", "WTA scores today",
      "tennis results today", "Grand Slam scores", "Grand Slam results",
      "Wimbledon scores", "Wimbledon results", "US Open tennis scores",
      "French Open scores", "Australian Open scores", "tennis live",
      "tennis news today", "tennis highlights", "tennis match today",
      "tennis draws", "tennis schedule",
    ],
    espnSport: "tennis",
    espnLeague: "atp",
    leagues: ["ATP Tour", "WTA Tour", "Australian Open", "French Open", "Wimbledon", "US Open"],
    faq: [
      { q: "Where can I follow Grand Slam tennis scores?", a: "Curly Sports provides live scores for all four Grand Slam tournaments — Australian Open, French Open, Wimbledon, and US Open — with set-by-set scoring and match statistics." },
    ],
    content: "Follow every serve, rally, and match point with Curly Sports' live tennis coverage. Get real-time scores from ATP and WTA tournaments, Grand Slams, and Davis Cup. View current rankings, tournament draws, and head-to-head records. From Roland-Garros clay to Wimbledon grass, stay connected to the world of tennis.",
  },
  f1: {
    name: "Formula 1",
    title: "F1 Standings 2026, Race Results & Live Timing",
    description: "Formula 1 driver and constructor standings, live race timing, qualifying results, and F1 news. Follow every Grand Prix on Curly Sports.",
    keywords: [
      "F1 standings 2026", "F1 standings", "F1 race results", "F1 results today",
      "Formula 1 live", "Formula 1 standings", "Formula 1 results",
      "F1 driver standings", "F1 constructor standings", "F1 driver standings 2026",
      "Grand Prix results", "Grand Prix live", "F1 qualifying results",
      "F1 live timing", "F1 live", "F1 news today", "F1 highlights",
      "F1 schedule", "F1 calendar 2026", "F1 race today",
      "Formula 1 news", "F1 drivers", "F1 teams",
    ],
    espnSport: "racing",
    espnLeague: "f1",
    leagues: ["Formula 1", "F2", "F3"],
    faq: [
      { q: "Where can I see current F1 standings?", a: "Curly Sports shows the latest F1 driver and constructor championship standings for the 2026 season, updated after every race weekend." },
      { q: "Does Curly Sports have live F1 timing?", a: "Yes! During race weekends, we provide live position tracking with sector times, gap data, tire strategies, and pit stop information using real-time data from the OpenF1 API." },
    ],
    content: "Get the full Formula 1 experience on Curly Sports. Track live race positions, driver and constructor championship standings, qualifying results, and sprint race outcomes. Our real-time F1 coverage includes lap-by-lap position changes, tire strategy data, pit stop times, and sector analysis. Follow every Grand Prix from lights out to checkered flag.",
  },
  baseball: {
    name: "Baseball",
    title: "MLB Scores Today, Standings & Baseball News",
    description: "Live MLB scores, American and National League standings, player stats, and baseball news. Follow every game on Curly Sports.",
    keywords: [
      "MLB scores today", "MLB live scores", "baseball scores today", "baseball live scores",
      "baseball standings", "MLB standings", "MLB standings 2026", "MLB live",
      "MLB stats", "MLB results today", "MLB scoreboard", "MLB news today",
      "baseball results", "baseball news", "MLB highlights",
      "MLB schedule today", "MLB player stats", "World Series",
    ],
    espnSport: "baseball",
    espnLeague: "mlb",
    leagues: ["MLB", "MiLB"],
    faq: [
      { q: "Where can I check MLB scores today?", a: "Curly Sports provides live MLB scores for all games with inning-by-inning scoring, pitch counts, and key play updates throughout the season." },
    ],
    content: "Follow America's pastime with live MLB scores on Curly Sports. Get real-time updates for every game with inning-by-inning scoring, batting stats, pitching lines, and play-by-play highlights. Track AL and NL standings, explore team rosters, and follow the pennant race from Opening Day through the World Series.",
  },
  nfl: {
    name: "NFL",
    title: "NFL Scores Today, Standings & Football News",
    description: "Live NFL scores, AFC and NFC standings, player stats, and American football news. Follow every game of the NFL season on Curly Sports.",
    keywords: [
      "NFL scores today", "NFL live scores", "NFL scores right now", "NFL standings 2026",
      "NFL standings", "football scores", "NFL live", "NFL stats",
      "NFL playoffs", "NFL playoff standings", "Super Bowl", "Super Bowl scores",
      "NFL results today", "NFL scoreboard", "NFL news today", "NFL highlights",
      "NFL schedule today", "NFL games today", "NFL player stats",
      "American football scores", "NFL trade rumors", "NFL draft",
    ],
    espnSport: "football",
    espnLeague: "nfl",
    leagues: ["NFL", "NCAA Football"],
    faq: [
      { q: "Where can I find NFL scores today?", a: "Curly Sports shows live NFL scores for all games with quarter-by-quarter updates, scoring drives, and key stats throughout the season." },
    ],
    content: "Get every touchdown, field goal, and turnover with Curly Sports' live NFL coverage. Follow real-time scores for all NFL games with detailed drive summaries, player stats, and scoring plays. Track AFC and NFC standings, explore team depth charts, and follow the road to the Super Bowl.",
  },
  hockey: {
    name: "Hockey",
    title: "NHL Scores Today, Standings & Hockey News",
    description: "Live NHL scores, conference standings, player stats, and hockey news. Follow every game of the NHL season on Curly Sports.",
    keywords: [
      "NHL scores today", "NHL live scores", "hockey scores today", "hockey standings",
      "NHL standings", "NHL standings 2026", "NHL live", "hockey scores",
      "NHL stats", "NHL playoffs", "Stanley Cup", "Stanley Cup scores",
      "NHL results today", "NHL scoreboard", "NHL news today", "NHL highlights",
      "NHL schedule today", "NHL games today", "hockey results",
      "NHL player stats", "hockey news",
    ],
    espnSport: "hockey",
    espnLeague: "nhl",
    leagues: ["NHL", "KHL"],
    faq: [
      { q: "Where can I check NHL scores today?", a: "Curly Sports provides live NHL scores for all games with period-by-period scoring, shots on goal, and key play updates." },
    ],
    content: "Follow the ice action with live NHL scores on Curly Sports. Get real-time updates for every game with period scoring, power play tracking, and save percentages. Track Eastern and Western Conference standings, explore team rosters, and follow the Stanley Cup Playoffs.",
  },
  mma: {
    name: "MMA",
    title: "UFC Results, Fight Cards & MMA Rankings",
    description: "UFC fight results, upcoming fight cards, MMA rankings, and combat sports news. Follow every UFC event on Curly Sports.",
    keywords: [
      "UFC results", "UFC results today", "UFC results tonight", "MMA fights today",
      "UFC rankings", "MMA rankings", "UFC fight card", "UFC fight card tonight",
      "MMA scores", "UFC live", "UFC live results", "UFC tonight",
      "UFC news today", "MMA news", "UFC highlights", "UFC schedule",
      "UFC next fight", "boxing results", "combat sports",
      "UFC fighter stats", "MMA fighter rankings",
    ],
    espnSport: "mma",
    espnLeague: "ufc",
    leagues: ["UFC", "Bellator", "PFL", "ONE Championship"],
    faq: [
      { q: "Where can I see UFC results?", a: "Curly Sports provides results for all UFC events including fight outcomes, finish types, round information, and post-fight stats." },
    ],
    content: "Get comprehensive UFC and MMA coverage on Curly Sports. Follow live fight results, upcoming fight cards, pound-for-pound rankings, and divisional standings. See fighter profiles with win-loss records, finishing rates, and significant strike stats. From early prelims to main events, never miss a moment of the action.",
  },
};

type Props = { params: Promise<{ sport: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sport } = await params;
  const config = SPORT_CONFIGS[sport];
  if (!config) return { title: "Sport Not Found" };

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    alternates: { canonical: `/sports/${sport}` },
    openGraph: {
      title: `${config.title} — Curly Sports`,
      description: config.description,
      url: `${SITE_URL}/sports/${sport}`,
      siteName: "Curly Sports",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
    },
  };
}

export function generateStaticParams() {
  return Object.keys(SPORT_CONFIGS).map(sport => ({ sport }));
}

export default async function SportLandingPage({ params }: Props) {
  const { sport } = await params;
  const config = SPORT_CONFIGS[sport];
  if (!config) notFound();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faq.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: config.name, item: `${SITE_URL}/sports/${sport}` },
    ],
  };

  return (
    <AppShell active="home" title={config.name} subtitle={config.description}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <div className={styles.sportLanding}>
        <section className={styles.hero}>
          <h1>{config.title}</h1>
          <p className={styles.subtitle}>{config.description}</p>
        </section>

        <section className={styles.content}>
          <p>{config.content}</p>
        </section>

        <section className={styles.section}>
          <h2>{config.name} Leagues & Competitions</h2>
          <div className={styles.leagueChips}>
            {config.leagues.map(league => (
              <Link key={league} href="/leagues" className={styles.leagueChip}>{league}</Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Explore {config.name} on Curly Sports</h2>
          <div className={styles.linkGrid}>
            <Link href="/live-scores" className={styles.linkCard}>
              <h3>Live Scores</h3>
              <p>Real-time {config.name.toLowerCase()} scores updated every 10 seconds</p>
            </Link>
            <Link href="/teams" className={styles.linkCard}>
              <h3>Teams</h3>
              <p>Browse {config.name.toLowerCase()} team rosters, stats, and schedules</p>
            </Link>
            <Link href="/players" className={styles.linkCard}>
              <h3>Players</h3>
              <p>Detailed player profiles, statistics, and career records</p>
            </Link>
            <Link href="/news" className={styles.linkCard}>
              <h3>News</h3>
              <p>Latest {config.name.toLowerCase()} headlines and analysis</p>
            </Link>
            <Link href="/leagues" className={styles.linkCard}>
              <h3>Standings</h3>
              <p>Complete league tables and championship standings</p>
            </Link>
            <Link href="/challenges" className={styles.linkCard}>
              <h3>Predictions</h3>
              <p>Test your {config.name.toLowerCase()} knowledge with prediction challenges</p>
            </Link>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Frequently Asked Questions</h2>
          {config.faq.map((f, i) => (
            <details key={i} className={styles.faqItem}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        <section className={styles.cta}>
          <h2>Get {config.name} Scores on Your Phone</h2>
          <p>Download the Curly Sports app for free and never miss a {config.name.toLowerCase()} moment.</p>
          <Link href="/download" className={styles.ctaButton}>Download Free App</Link>
        </section>
      </div>
    </AppShell>
  );
}
