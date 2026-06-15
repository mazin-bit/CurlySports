"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AdSlot from "@/components/AdSlot";
import styles from "./dashboard.module.css";
import { Zap, Newspaper, Trophy, ArrowRightLeft, CircleDot, ChevronRight, Radio } from "lucide-react";
import { useScoresStream } from "@/hooks/useScoresStream";
import { useNews } from "@/hooks/useNews";
import { useStandings } from "@/hooks/useStandings";
import { useActiveSport } from "@/contexts/SportContext";
import type { NormalizedMatch, NormalizedNews } from "@/lib/types";
import type { StandingEntry } from "@/hooks/useStandings";

/* ── Helpers ─────────────────────────────────────────────────── */
function toDateKey(d: Date) {
  return (
    String(d.getFullYear()) +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0")
  );
}

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── Team Crest ──────────────────────────────────────────────── */
function TeamCrest({ logoUrl, name, size = 32 }: { logoUrl?: string | null; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (logoUrl && !err) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} width={size} height={size} style={{ borderRadius: 4, objectFit: "contain", flexShrink: 0 }} onError={() => setErr(true)} />;
  }
  return <div className="crest" style={{ width: size, height: size, fontSize: Math.max(8, size * 0.32) }}>{name.slice(0, 3)}</div>;
}

/* ── Hero Match Card (featured live / big match) ─────────────── */
function HeroMatchCard({ m }: { m: NormalizedMatch }) {
  const isLive = m.status === "LIVE" || m.status === "HALF_TIME";
  const homeWins = m.homeScore !== null && m.awayScore !== null && m.homeScore > m.awayScore;
  const awayWins = m.homeScore !== null && m.awayScore !== null && m.awayScore > m.homeScore;
  const href = `/matches/${m.id}?sport=${m.sport}&league=${m.league.id}`;
  let statusLabel = m.statusDisplay;
  if (m.status === "HALF_TIME") statusLabel = "Half Time";
  if (m.status === "FINISHED") statusLabel = "Full Time";

  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <div className={`${styles.heroCard}${isLive ? " " + styles.heroLive : ""}`}>
        <div className={styles.heroHeader}>
          <span className={styles.leagueBadge}>{m.league.name}</span>
          {isLive ? (
            <span className={styles.liveBadge}><span className={styles.liveDot} />LIVE · {statusLabel}</span>
          ) : (
            <span className={styles.leagueBadge} style={{ color: "var(--text-mute)" }}>
              {m.status === "FINISHED" ? "Full Time" : new Date(m.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <div className={styles.heroTeams}>
          <div className={styles.heroTeam}>
            <TeamCrest logoUrl={m.homeTeam.logoUrl} name={m.homeTeam.shortName} size={48} />
            <span className={`${styles.heroName}${homeWins ? " " + styles.winner : ""}`}>{m.homeTeam.name}</span>
          </div>
          <div className={styles.heroScore}>
            <span className={`${styles.heroNum}${homeWins ? " " + styles.winning : ""}`}>{m.homeScore ?? (isLive ? "0" : "-")}</span>
            <span className={styles.heroVs}>{isLive ? "·" : "vs"}</span>
            <span className={`${styles.heroNum}${awayWins ? " " + styles.winning : ""}`}>{m.awayScore ?? (isLive ? "0" : "-")}</span>
          </div>
          <div className={`${styles.heroTeam} ${styles.heroTeamAway}`}>
            <span className={`${styles.heroName}${awayWins ? " " + styles.winner : ""}`}>{m.awayTeam.name}</span>
            <TeamCrest logoUrl={m.awayTeam.logoUrl} name={m.awayTeam.shortName} size={48} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Match Card ──────────────────────────────────────────────── */
function MatchCard({ m }: { m: NormalizedMatch }) {
  const isLive = m.status === "LIVE" || m.status === "HALF_TIME";
  const homeWins = m.homeScore !== null && m.awayScore !== null && m.homeScore > m.awayScore;
  const awayWins = m.homeScore !== null && m.awayScore !== null && m.awayScore > m.homeScore;
  let statusLabel = m.statusDisplay;
  if (m.status === "HALF_TIME") statusLabel = "HT";
  if (m.status === "FINISHED") statusLabel = "FT";
  const href = `/matches/${m.id}?sport=${m.sport}&league=${m.league.id}`;

  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <div className={`${styles.matchCard}${isLive ? " " + styles.liveCard : ""}`}>
        <div className={styles.matchHeader}>
          <span className={styles.leagueBadge}>{m.league.shortName}</span>
          {isLive ? (
            <span className={styles.liveBadge}><span className={styles.liveDot} />{statusLabel}</span>
          ) : (
            <span className={styles.leagueBadge} style={{ color: "var(--text-mute)" }}>
              {m.status === "FINISHED" ? "FT" : new Date(m.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <div className={styles.matchTeams}>
          <div className={styles.teamRow}>
            <TeamCrest logoUrl={m.homeTeam.logoUrl} name={m.homeTeam.shortName} size={32} />
            <span className={`${styles.teamName}${homeWins ? " " + styles.winner : ""}`}>{m.homeTeam.name}</span>
            <span className={`${styles.score}${homeWins ? " " + styles.winning : ""}`}>{m.homeScore ?? "-"}</span>
          </div>
          <div className={styles.teamRow}>
            <TeamCrest logoUrl={m.awayTeam.logoUrl} name={m.awayTeam.shortName} size={32} />
            <span className={`${styles.teamName}${awayWins ? " " + styles.winner : ""}`}>{m.awayTeam.name}</span>
            <span className={`${styles.score}${awayWins ? " " + styles.winning : ""}`}>{m.awayScore ?? "-"}</span>
          </div>
        </div>
        <div className={styles.matchFooter}>
          <span className={styles.matchTime}>{statusLabel}</span>
          <span>·</span>
          <span>{m.league.name}</span>
        </div>
      </div>
    </Link>
  );
}

/* ── News Card ───────────────────────────────────────────────── */
function NewsCardImg({ article }: { article: NormalizedNews }) {
  const [errored, setErrored] = useState(false);
  if (!article.imageUrl || errored) {
    const isTransfer = article.title.toLowerCase().includes("transfer") || article.title.toLowerCase().includes("sign");
    return (
      <div className={styles.newsImgBg}>
        {isTransfer
          ? <ArrowRightLeft size={20} strokeWidth={1.75} style={{ opacity: 0.6 }} />
          : <CircleDot size={20} strokeWidth={1.75} style={{ opacity: 0.6 }} />
        }
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={article.imageUrl} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setErrored(true)} />;
}

function NewsCard({ n }: { n: NormalizedNews }) {
  return (
    <a href={n.url ?? "#"} target="_blank" rel="noopener noreferrer" className={styles.newsCard}>
      <div className={styles.newsImage}><NewsCardImg article={n} /></div>
      <div className={styles.newsContent}>
        <h3 className={styles.newsTitle}>{n.title}</h3>
        <p className={styles.newsMeta}>{timeSince(n.publishedAt)} · {n.source}</p>
      </div>
    </a>
  );
}

/* ── Standings Table ─────────────────────────────────────────── */
function StandingsTable({ entries, leagueName, max = 8 }: { entries: StandingEntry[]; leagueName: string; max?: number }) {
  const rows = entries.slice(0, max);
  const isFootball = entries.some((e) => e.draws > 0);

  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableHead}>
        <span className={styles.tableTitle}>{leagueName}</span>
        <div className={styles.tableCols}>
          <span>P</span><span>W</span>
          {isFootball && <span className={styles.hideXs}>D</span>}
          <span className={styles.hideXs}>L</span>
          {isFootball && <span className={styles.hideSm}>GD</span>}
          <span style={{ color: "var(--orange)", fontWeight: 700 }}>Pts</span>
        </div>
      </div>
      {rows.map((row, idx) => (
        <div key={row.teamId || idx} className={styles.tableRow}>
          <span className={styles.tablePos} style={{ color: idx < 4 ? "var(--orange)" : "var(--text-mute)" }}>
            {row.rank || idx + 1}
          </span>
          <div className={styles.tableTeam}>
            {row.teamLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.teamLogo} alt={row.teamAbbr} width={22} height={22} style={{ objectFit: "contain", flexShrink: 0 }} />
            ) : (
              <div className="crest" style={{ width: 22, height: 22, fontSize: 8 }}>{row.teamAbbr.slice(0, 3)}</div>
            )}
            <span>{row.teamName}</span>
          </div>
          <span className={styles.tableStat}>{row.gamesPlayed}</span>
          <span className={styles.tableStat}>{row.wins}</span>
          {isFootball && <span className={`${styles.tableStat} ${styles.hideXs}`}>{row.draws}</span>}
          <span className={`${styles.tableStat} ${styles.hideXs}`}>{row.losses}</span>
          {isFootball && (
            <span className={`${styles.tableStat} ${styles.hideSm}`} style={{ color: row.goalDiff > 0 ? "var(--teal)" : row.goalDiff < 0 ? "var(--coral)" : undefined }}>
              {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
            </span>
          )}
          <span className={styles.tableStat} style={{ color: "var(--ink)", fontWeight: 700 }}>{row.points}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Upcoming matches hook ───────────────────────────────────── */
function useUpcomingMatches(sport: string, todayKey: string, skip: boolean) {
  const [upcoming, setUpcoming] = useState<{ matches: NormalizedMatch[]; dateLabel: string } | null>(null);

  useEffect(() => {
    if (skip) { setUpcoming(null); return; }
    let cancelled = false;

    async function findNext() {
      for (let d = 1; d <= 7; d++) {
        if (cancelled) return;
        const candidate = new Date(
          parseInt(todayKey.slice(0, 4)),
          parseInt(todayKey.slice(4, 6)) - 1,
          parseInt(todayKey.slice(6, 8)) + d
        );
        const key = toDateKey(candidate);
        try {
          const res = await fetch(`/api/espn/scoreboard?sport=${sport}&date=${key}`);
          if (!res.ok) continue;
          const data = await res.json();
          const groups = data.groups ?? [];
          const matches: NormalizedMatch[] = groups.flatMap((g: { matches: NormalizedMatch[] }) => g.matches);
          if (matches.length > 0 && !cancelled) {
            const label = d === 1 ? "Tomorrow" : candidate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
            setUpcoming({ matches, dateLabel: label });
            return;
          }
        } catch { /* ignore */ }
      }
      if (!cancelled) setUpcoming(null);
    }

    findNext();
    return () => { cancelled = true; };
  }, [sport, todayKey, skip]);

  return upcoming;
}

/* ── Main Dashboard Client ───────────────────────────────────── */
export default function DashboardClient() {
  const { activeSport, activeSportConfig } = useActiveSport();

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(now);
  const todayLabel = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const { groups, liveCount, isConnected: scoresConnected } = useScoresStream(activeSport, todayKey);
  const scoresLoading = !scoresConnected && groups.length === 0;
  const scoresValidating = !scoresConnected && groups.length > 0;

  const { articles, isLoading: newsLoading } = useNews(12, activeSport);
  const { standings, isLoading: standingsLoading } = useStandings(activeSport);

  const allMatches = groups.flatMap((g) => g.matches).sort((a, b) => {
    const p = (s: string) => (s === "LIVE" ? 0 : s === "HALF_TIME" ? 1 : s === "SCHEDULED" ? 2 : 3);
    return p(a.status) - p(b.status);
  });

  const liveMatches = allMatches.filter(m => m.status === "LIVE" || m.status === "HALF_TIME");
  const nonLiveMatches = allMatches.filter(m => m.status !== "LIVE" && m.status !== "HALF_TIME");
  const heroMatch = liveMatches[0] ?? null;
  const gridMatches = heroMatch ? [...liveMatches.slice(1), ...nonLiveMatches] : nonLiveMatches;

  const noMatchesToday = !scoresLoading && allMatches.length === 0;
  const upcomingData = useUpcomingMatches(activeSport, todayKey, !noMatchesToday);

  const featuredStandings = standings[0];

  return (
    <>
      {/* Today's Matches */}
      <section className="section">
        <div className="sec-head">
          <div>
            <div className="title">
              <Zap size={17} className="title-icon" strokeWidth={2} />
              {activeSportConfig.icon} Today&apos;s <span className="accent">Matches</span>
            </div>
            <div className="sub">
              {scoresValidating && !scoresLoading
                ? "● Syncing..."
                : liveCount > 0
                ? `${liveCount} live now · ${todayLabel}`
                : todayLabel}
            </div>
          </div>
          <Link href="/live-scores" className={styles.viewAll}>View all →</Link>
        </div>

        {/* Live Now Banner */}
        {!scoresLoading && liveCount > 0 && (
          <div className={styles.liveBanner}>
            <Radio size={14} strokeWidth={2} className={styles.liveBannerIcon} />
            <strong>{liveCount} {activeSportConfig.label} {liveCount === 1 ? "match" : "matches"} happening right now</strong>
            <Link href="/live-scores" className={styles.liveBannerLink}>Watch live →</Link>
          </div>
        )}

        {scoresLoading ? (
          <>
            <div className="skeleton-row" style={{ height: 130, borderRadius: 16, marginBottom: 14 }} />
            <div className={styles.matchGrid}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-row" style={{ height: 150, borderRadius: 12 }} />
              ))}
            </div>
          </>
        ) : allMatches.length > 0 ? (
          <>
            {/* Hero: first live match featured */}
            {heroMatch && <HeroMatchCard m={heroMatch} />}
            {gridMatches.length > 0 && (
              <div className={styles.matchGrid} style={{ marginTop: heroMatch ? 14 : 0 }}>
                {gridMatches.slice(0, 8).map((m) => <MatchCard key={m.id} m={m} />)}
              </div>
            )}
          </>
        ) : upcomingData ? (
          <>
            <p style={{ fontSize: 12, color: "var(--text-mute)", marginBottom: 10, fontFamily: "var(--mono)" }}>
              No matches today · Next up: <strong style={{ color: "var(--ink)" }}>{upcomingData.dateLabel}</strong>
            </p>
            <div className={styles.matchGrid}>
              {upcomingData.matches.slice(0, 9).map((m) => <MatchCard key={m.id} m={m} />)}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <span style={{ fontSize: 32 }}>{activeSportConfig.icon}</span>
            <p>No {activeSportConfig.label} matches today.</p>
            <p style={{ fontSize: 12, color: "var(--text-mute)" }}>Check live scores for other dates →</p>
          </div>
        )}
      </section>

      <AdSlot size="banner" label="Sponsored" />

      {/* Latest News */}
      <section className="section">
        <div className="sec-head">
          <div>
            <div className="title">
              <Newspaper size={17} className="title-icon" strokeWidth={2} />
              {activeSportConfig.icon} Latest <span className="accent">News</span>
            </div>
          </div>
          <Link href="/news" className={styles.viewAll}>View all →</Link>
        </div>

        {newsLoading ? (
          <div className={styles.newsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-row" style={{ height: 220, borderRadius: 12 }} />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className={styles.newsGrid}>
            {articles.slice(0, 8).map((n) => <NewsCard key={n.id} n={n} />)}
          </div>
        ) : null}
      </section>

      {/* League Standings */}
      {(standingsLoading || featuredStandings) && (
        <section className="section">
          <div className="sec-head">
            <div>
              <div className="title">
                <Trophy size={17} className="title-icon" strokeWidth={2} />
                {activeSportConfig.icon} <span className="accent">Standings</span>
              </div>
              <div className="sub">{featuredStandings?.season}</div>
            </div>
            <Link href="/leagues" className={styles.viewAll}>
              Full table <ChevronRight size={13} strokeWidth={2.5} />
            </Link>
          </div>

          {standingsLoading ? (
            <div className="skeleton-row" style={{ height: 320, borderRadius: 12 }} />
          ) : featuredStandings ? (
            <>
              <StandingsTable
                entries={featuredStandings.entries}
                leagueName={featuredStandings.leagueName}
              />
              {standings[1] && (
                <StandingsTable
                  entries={standings[1].entries}
                  leagueName={standings[1].leagueName}
                />
              )}
            </>
          ) : null}
        </section>
      )}
    </>
  );
}
