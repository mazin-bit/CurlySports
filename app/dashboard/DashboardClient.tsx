"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AdSlot from "@/components/AdSlot";
import styles from "./dashboard.module.css";
import { Zap, Newspaper, Trophy, ArrowRightLeft, CircleDot, ChevronRight, Radio, Gift, Check, Clock, Ticket, CheckCircle, AlertCircle } from "lucide-react";
import { useScoresStream } from "@/hooks/useScoresStream";
import { useNews } from "@/hooks/useNews";
import { useStandings, useSingleStandings } from "@/hooks/useStandings";
import { useBracket } from "@/hooks/useBracket";
import type { BracketRound, BracketMatch } from "@/hooks/useBracket";
import { useActiveSport } from "@/contexts/SportContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate, formatTime, formatNumber, localizeDigits } from "@/lib/locale-utils";
import { translateTeamName } from "@/lib/team-names";
import { translateLeagueName } from "@/lib/league-names";
import type { NormalizedMatch, NormalizedNews } from "@/lib/types";
import type { StandingEntry, GroupStandings } from "@/hooks/useStandings";

/* ── Helpers ─────────────────────────────────────────────────── */
function toDateKey(d: Date) {
  return (
    String(d.getFullYear()) +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0")
  );
}

function timeSince(iso: string, t: (k: string) => string, locale: import("@/lib/i18n").Locale = "en"): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return t("time.justNow");
  if (mins < 60) return t("time.minsAgo").replace("{n}", localizeDigits(String(mins), locale));
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("time.hoursAgo").replace("{n}", localizeDigits(String(hrs), locale));
  return t("time.daysAgo").replace("{n}", localizeDigits(String(Math.floor(hrs / 24)), locale));
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
  const { t, locale } = useLanguage();
  const isLive = m.status === "LIVE" || m.status === "HALF_TIME";
  const homeWins = m.homeScore !== null && m.awayScore !== null && m.homeScore > m.awayScore;
  const awayWins = m.homeScore !== null && m.awayScore !== null && m.awayScore > m.homeScore;
  const href = `/matches/${m.id}?sport=${m.sport}&league=${m.league.id}`;
  let statusLabel = m.statusDisplay;
  if (m.status === "HALF_TIME") statusLabel = t("matchStatus.halfTime");
  if (m.status === "FINISHED") statusLabel = t("matchStatus.fullTime");
  if (m.status === "SCHEDULED") statusLabel = t("matchStatus.scheduled");

  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <div className={`${styles.heroCard}${isLive ? " " + styles.heroLive : ""}`}>
        <div className={styles.heroHeader}>
          <span className={styles.leagueBadge}>{translateLeagueName(m.league.name, locale)}</span>
          {isLive ? (
            <span className={styles.liveBadge}><span className={styles.liveDot} />{t("matchStatus.live")} · {statusLabel}</span>
          ) : (
            <span className={styles.leagueBadge} style={{ color: "var(--text-mute)" }}>
              {m.status === "FINISHED" ? t("matchStatus.fullTime") : formatTime(new Date(m.scheduledAt), locale)}
            </span>
          )}
        </div>
        <div className={styles.heroTeams}>
          <div className={styles.heroTeam}>
            <TeamCrest logoUrl={m.homeTeam.logoUrl} name={m.homeTeam.shortName} size={48} />
            <span className={`${styles.heroName}${homeWins ? " " + styles.winner : ""}`}>{translateTeamName(m.homeTeam.name, locale)}</span>
          </div>
          <div className={styles.heroScore}>
            <span className={`${styles.heroNum}${homeWins ? " " + styles.winning : ""}`}>{m.homeScore ?? (isLive ? "0" : "-")}</span>
            <span className={styles.heroVs}>{isLive ? "·" : t("matchStatus.vs")}</span>
            <span className={`${styles.heroNum}${awayWins ? " " + styles.winning : ""}`}>{m.awayScore ?? (isLive ? "0" : "-")}</span>
          </div>
          <div className={`${styles.heroTeam} ${styles.heroTeamAway}`}>
            <span className={`${styles.heroName}${awayWins ? " " + styles.winner : ""}`}>{translateTeamName(m.awayTeam.name, locale)}</span>
            <TeamCrest logoUrl={m.awayTeam.logoUrl} name={m.awayTeam.shortName} size={48} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Match Card ──────────────────────────────────────────────── */
function MatchCard({ m }: { m: NormalizedMatch }) {
  const { t, locale } = useLanguage();
  const isLive = m.status === "LIVE" || m.status === "HALF_TIME";
  const homeWins = m.homeScore !== null && m.awayScore !== null && m.homeScore > m.awayScore;
  const awayWins = m.homeScore !== null && m.awayScore !== null && m.awayScore > m.homeScore;
  let statusLabel = m.statusDisplay;
  if (m.status === "HALF_TIME") statusLabel = t("matchStatus.ht");
  if (m.status === "FINISHED") statusLabel = t("matchStatus.ft");
  if (m.status === "SCHEDULED") statusLabel = t("matchStatus.scheduled");
  const href = `/matches/${m.id}?sport=${m.sport}&league=${m.league.id}`;

  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <div className={`${styles.matchCard}${isLive ? " " + styles.liveCard : ""}`}>
        <div className={styles.matchHeader}>
          <span className={styles.leagueBadge}>{translateLeagueName(m.league.shortName, locale)}</span>
          {isLive ? (
            <span className={styles.liveBadge}><span className={styles.liveDot} />{statusLabel}</span>
          ) : (
            <span className={styles.leagueBadge} style={{ color: "var(--text-mute)" }}>
              {m.status === "FINISHED" ? t("matchStatus.ft") : formatTime(new Date(m.scheduledAt), locale)}
            </span>
          )}
        </div>
        <div className={styles.matchTeams}>
          <div className={styles.teamRow}>
            <TeamCrest logoUrl={m.homeTeam.logoUrl} name={m.homeTeam.shortName} size={32} />
            <span className={`${styles.teamName}${homeWins ? " " + styles.winner : ""}`}>{translateTeamName(m.homeTeam.name, locale)}</span>
            <span className={`${styles.score}${homeWins ? " " + styles.winning : ""}`}>{m.homeScore ?? "-"}</span>
          </div>
          <div className={styles.teamRow}>
            <TeamCrest logoUrl={m.awayTeam.logoUrl} name={m.awayTeam.shortName} size={32} />
            <span className={`${styles.teamName}${awayWins ? " " + styles.winner : ""}`}>{translateTeamName(m.awayTeam.name, locale)}</span>
            <span className={`${styles.score}${awayWins ? " " + styles.winning : ""}`}>{m.awayScore ?? "-"}</span>
          </div>
        </div>
        <div className={styles.matchFooter}>
          <span className={styles.matchTime}>{statusLabel}</span>
          <span>·</span>
          <span>{translateLeagueName(m.league.name, locale)}</span>
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
  const { t, locale } = useLanguage();
  return (
    <a href={n.url ?? "#"} target="_blank" rel="noopener noreferrer" className={styles.newsCard}>
      <div className={styles.newsImage}><NewsCardImg article={n} /></div>
      <div className={styles.newsContent}>
        <h3 className={styles.newsTitle}>{n.title}</h3>
        <p className={styles.newsMeta}>{timeSince(n.publishedAt, t, locale)} · {n.source}</p>
      </div>
    </a>
  );
}

/* ── Standings Table ─────────────────────────────────────────── */
function StandingsTable({ entries, leagueName, max = 8 }: { entries: StandingEntry[]; leagueName: string; max?: number }) {
  const { t, locale } = useLanguage();
  const rows = entries.slice(0, max);
  const isFootball = entries.some((e) => e.draws > 0);

  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableHead}>
        <span className={styles.tableTitle}>{translateLeagueName(leagueName, locale)}</span>
        <div className={styles.tableCols}>
          <span>{t("standings.p")}</span><span>{t("standings.w")}</span>
          {isFootball && <span className={styles.hideXs}>{t("standings.d")}</span>}
          <span className={styles.hideXs}>{t("standings.l")}</span>
          {isFootball && <span className={styles.hideSm}>{t("standings.gd")}</span>}
          <span style={{ color: "var(--orange)", fontWeight: 700 }}>{t("standings.pts")}</span>
        </div>
      </div>
      {rows.map((row, idx) => (
        <div key={row.teamId || idx} className={styles.tableRow}>
          <span className={styles.tablePos} style={{ color: idx < 4 ? "var(--orange)" : "var(--text-mute)" }}>
            {localizeDigits(String(row.rank || idx + 1), locale)}
          </span>
          <div className={styles.tableTeam}>
            {row.teamLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.teamLogo} alt={row.teamAbbr} width={22} height={22} style={{ objectFit: "contain", flexShrink: 0 }} />
            ) : (
              <div className="crest" style={{ width: 22, height: 22, fontSize: 8 }}>{row.teamAbbr.slice(0, 3)}</div>
            )}
            <span>{translateTeamName(row.teamName, locale)}</span>
          </div>
          <span className={styles.tableStat}>{localizeDigits(String(row.gamesPlayed), locale)}</span>
          <span className={styles.tableStat}>{localizeDigits(String(row.wins), locale)}</span>
          {isFootball && <span className={`${styles.tableStat} ${styles.hideXs}`}>{localizeDigits(String(row.draws), locale)}</span>}
          <span className={`${styles.tableStat} ${styles.hideXs}`}>{localizeDigits(String(row.losses), locale)}</span>
          {isFootball && (
            <span className={`${styles.tableStat} ${styles.hideSm}`} style={{ color: row.goalDiff > 0 ? "var(--teal)" : row.goalDiff < 0 ? "var(--coral)" : undefined }}>
              {localizeDigits(row.goalDiff > 0 ? `+${row.goalDiff}` : String(row.goalDiff), locale)}
            </span>
          )}
          <span className={styles.tableStat} style={{ color: "var(--ink)", fontWeight: 700 }}>{localizeDigits(String(row.points), locale)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── World Cup Groups Grid ──────────────────────────────────── */
function WorldCupGroupsGrid({ groups, leagueName }: { groups: GroupStandings[]; leagueName: string }) {
  const { t, locale } = useLanguage();
  return (
    <div>
      <div className={styles.wcHeader}>
        <span className={styles.wcTitle}>{translateLeagueName(leagueName, locale)} — {t("dashboard.groupStage")}</span>
      </div>
      <div className={styles.wcGroupsGrid}>
        {groups.map((g) => (
          <div key={g.groupName} className={styles.wcGroupCard}>
            <div className={styles.wcGroupTitle}>{g.groupName}</div>
            <div className={styles.wcGroupHead}>
              <span className={styles.wcColTeam}>{t("standings.team")}</span>
              <span className={styles.wcColStat}>{t("standings.p")}</span>
              <span className={styles.wcColStat}>{t("standings.w")}</span>
              <span className={styles.wcColStat}>{t("standings.l")}</span>
              <span className={styles.wcColStatPts}>{t("standings.pts")}</span>
            </div>
            {g.entries.slice(0, 4).map((row, idx) => (
              <div key={row.teamId || idx} className={styles.wcTeamRow}>
                <span className={styles.wcRank} style={{ color: idx < 2 ? "var(--accent)" : "var(--text-mute)" }}>
                  {localizeDigits(String(row.rank || idx + 1), locale)}
                </span>
                <div className={styles.wcTeamInfo}>
                  {row.teamLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.teamLogo} alt={row.teamAbbr} width={20} height={20} style={{ objectFit: "contain", flexShrink: 0 }} />
                  ) : (
                    <div className="crest" style={{ width: 20, height: 20, fontSize: 7 }}>{row.teamAbbr.slice(0, 3)}</div>
                  )}
                  <span className={styles.wcTeamName}>{translateTeamName(row.teamAbbr, locale)}</span>
                </div>
                <span className={styles.wcStat}>{localizeDigits(String(row.gamesPlayed), locale)}</span>
                <span className={styles.wcStat}>{localizeDigits(String(row.wins), locale)}</span>
                <span className={styles.wcStat}>{localizeDigits(String(row.losses), locale)}</span>
                <span className={styles.wcStatPts}>{localizeDigits(String(row.points), locale)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Dashboard Knockout Bracket ──────────────────────────────── */
function DashKnockoutMatch({ match }: { match: BracketMatch }) {
  const isFinished = match.status.includes("FINAL") || match.status.includes("FULL_TIME") || match.status.includes("FT");
  const hasScore = match.home.score !== null && match.away.score !== null;
  const homeWin = match.home.winner;
  const awayWin = match.away.winner;

  return (
    <div className={styles.koMatch}>
      <div className={`${styles.koTeam}${homeWin ? " " + styles.koWinner : ""}`}>
        <div className={styles.koTeamInfo}>
          {match.home.logo && !match.home.isPlaceholder ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={match.home.logo} alt={match.home.shortName} width={18} height={18} style={{ objectFit: "contain", flexShrink: 0 }} />
          ) : (
            <div className={styles.koLogoPh}>{match.home.shortName?.slice(0, 3) ?? "?"}</div>
          )}
          <span className={match.home.isPlaceholder ? styles.koTeamPh : undefined}>{match.home.shortName}</span>
        </div>
        <span className={`${styles.koScore}${homeWin ? " " + styles.koScoreWin : ""}`}>
          {hasScore ? match.home.score : "–"}
        </span>
      </div>
      <div className={`${styles.koTeam}${awayWin ? " " + styles.koWinner : ""}`}>
        <div className={styles.koTeamInfo}>
          {match.away.logo && !match.away.isPlaceholder ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={match.away.logo} alt={match.away.shortName} width={18} height={18} style={{ objectFit: "contain", flexShrink: 0 }} />
          ) : (
            <div className={styles.koLogoPh}>{match.away.shortName?.slice(0, 3) ?? "?"}</div>
          )}
          <span className={match.away.isPlaceholder ? styles.koTeamPh : undefined}>{match.away.shortName}</span>
        </div>
        <span className={`${styles.koScore}${awayWin ? " " + styles.koScoreWin : ""}`}>
          {hasScore ? match.away.score : "–"}
        </span>
      </div>
      {isFinished && match.statusDisplay && (
        <div className={styles.koResult}>{match.statusDisplay}</div>
      )}
    </div>
  );
}

function DashKnockoutBracket({ rounds, leagueName }: { rounds: BracketRound[]; leagueName: string }) {
  const { t } = useLanguage();
  if (rounds.length === 0) return null;

  return (
    <div className={styles.koSection}>
      <div className={styles.koSectionTitle}>{t("dashboard.knockoutStage")}</div>
      {rounds.map((round) => (
        <div key={round.name} className={styles.koRound}>
          <div className={styles.koRoundName}>{round.name}</div>
          <div className={styles.koMatchGrid}>
            {round.matches.map((m) => (
              <DashKnockoutMatch key={m.id} match={m} />
            ))}
          </div>
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
      // Fetch all 7 days in parallel instead of sequentially
      const days = Array.from({ length: 7 }, (_, i) => i + 1);
      const candidates = days.map(d => ({
        d,
        date: new Date(
          parseInt(todayKey.slice(0, 4)),
          parseInt(todayKey.slice(4, 6)) - 1,
          parseInt(todayKey.slice(6, 8)) + d
        ),
      }));

      const results = await Promise.allSettled(
        candidates.map(async ({ date }) => {
          const key = toDateKey(date);
          const res = await fetch(`/api/espn/scoreboard?sport=${sport}&date=${key}`);
          if (!res.ok) return [];
          const data = await res.json();
          const groups = data.groups ?? [];
          return groups.flatMap((g: { matches: NormalizedMatch[] }) => g.matches) as NormalizedMatch[];
        })
      );

      if (cancelled) return;

      // Find the earliest day with matches
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === "fulfilled" && r.value.length > 0) {
          const { d, date } = candidates[i];
          const label = d === 1 ? "__tomorrow__" : date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
          setUpcoming({ matches: r.value, dateLabel: label });
          return;
        }
      }
      setUpcoming(null);
    }

    findNext();
    return () => { cancelled = true; };
  }, [sport, todayKey, skip]);

  return upcoming;
}

/* ── Challenge Card ──────────────────────────────────────────── */
interface ChallengeData {
  id: string;
  title: string;
  teamA: string;
  teamB: string;
  matchDate: string;
  winnerCount: number;
  status: string;
  totalVotes: number;
}

function useActiveChallenge() {
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/challenges?status=active&limit=1", {
          credentials: "include",
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) return;
        const data = await res.json();
        const items = data.challenges ?? data;
        if (Array.isArray(items) && items.length > 0 && !cancelled) {
          const c = items[0];
          if (c.userVote) {
            const teamName = c.userVote === "teamA" ? c.teamA : c.teamB;
            setUserVote(teamName);
          }
          setChallenge(c);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { challenge, userVote, setUserVote, loading };
}

function ChallengeCountdown({ matchDate }: { matchDate: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function update() {
      const diff = new Date(matchDate).getTime() - Date.now();
      if (diff <= 0) { setRemaining("00:00:00"); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setRemaining(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [matchDate]);

  return <span>{remaining}</span>;
}

function ChallengeSkeleton() {
  return (
    <div className={styles.challengeCard} style={{ opacity: 0.5, pointerEvents: "none" }}>
      <div className={styles.challengeCardBadge}>
        <Trophy size={13} strokeWidth={2.5} />
        MYSTERY PRIZE CHALLENGE
      </div>
      <div className={styles.challengeCardTeams}>
        <span className="skeleton-row" style={{ width: 80, height: 18, borderRadius: 6 }} />
        <span className={styles.challengeCardVs}>VS</span>
        <span className="skeleton-row" style={{ width: 80, height: 18, borderRadius: 6 }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div className={`${styles.challengeVoteBtn} skeleton-row`} style={{ height: 36 }} />
        <div className={`${styles.challengeVoteBtn} skeleton-row`} style={{ height: 36 }} />
      </div>
      <div className={styles.challengeCardFooter}>
        <span className="skeleton-row" style={{ width: 60, height: 12, borderRadius: 4 }} />
        <span className="skeleton-row" style={{ width: 60, height: 12, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function RedeemCodeBox() {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'redeemed'>('idle');
  const [message, setMessage] = useState('');

  // Check on mount if user already redeemed
  useEffect(() => {
    fetch('/api/referral/redeem')
      .then(r => r.json())
      .then(d => { if (d.redeemed) setStatus('redeemed'); })
      .catch(() => {});
  }, []);

  const handleRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed || status === 'redeemed') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/referral/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('redeemed');
        setMessage(data.message || 'Code redeemed successfully!');
        setCode('');
      } else if (res.status === 409) {
        setStatus('redeemed');
        setMessage(data.error || 'You have already used a referral code.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Invalid code.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  if (status === 'redeemed') {
    return (
      <div className={styles.redeemBox}>
        <div className={styles.redeemBadge}>
          <Ticket size={13} strokeWidth={2.5} />
          {t('redeem.title', 'Redeem Code')}
        </div>
        <div className={styles.redeemSuccess}>
          <CheckCircle size={12} strokeWidth={2} /> {message || t('redeem.alreadyUsed', 'You have already redeemed a code.')}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.redeemBox}>
      <div className={styles.redeemBadge}>
        <Ticket size={13} strokeWidth={2.5} />
        {t('redeem.title', 'Redeem Code')}
      </div>
      <div className={styles.redeemRow}>
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); if (status !== 'idle') setStatus('idle'); }}
          placeholder={t('redeem.placeholder', 'Enter code')}
          maxLength={20}
          className={styles.redeemInput}
          onKeyDown={(e) => { if (e.key === 'Enter') handleRedeem(); }}
        />
        <button
          onClick={handleRedeem}
          disabled={!code.trim() || status === 'loading'}
          className={styles.redeemBtn}
        >
          {status === 'loading' ? '...' : t('redeem.apply', 'Apply')}
        </button>
      </div>
      {status === 'error' && (
        <div className={styles.redeemError}>
          <AlertCircle size={12} strokeWidth={2} /> {message}
        </div>
      )}
    </div>
  );
}

function ChallengeCard({ challenge, userVote, onVote }: { challenge: ChallengeData; userVote: string | null; onVote: (team: string) => void }) {
  const { t } = useLanguage();
  const [voting, setVoting] = useState<string | null>(null);

  const handleVote = (e: React.MouseEvent, team: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (voting || userVote) return;
    // Instant visual feedback
    setVoting(team);
    onVote(team);
    // Fire-and-forget API call
    const selectedTeam = team === challenge.teamA ? "teamA" : "teamB";
    fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: challenge.id, selectedTeam }),
    }).then(res => {
      if (!res.ok) { onVote(""); setVoting(null); }
    }).catch(() => { onVote(""); setVoting(null); });
  };

  return (
    <Link href="/challenges" style={{ textDecoration: "none", color: "inherit" }}>
      <div className={styles.challengeCard}>
        <div className={styles.challengeCardBadge}>
          <Trophy size={13} strokeWidth={2.5} />
          {t("challenges.mysteryPrize", "MYSTERY PRIZE CHALLENGE")}
        </div>
        <div className={styles.challengeCardTeams}>
          <span>{challenge.teamA}</span>
          <span className={styles.challengeCardVs}>VS</span>
          <span>{challenge.teamB}</span>
        </div>
        {userVote ? (
          <div style={{ textAlign: "center" }} className={styles.challengeVotedFade}>
            <div className={`${styles.challengeVoteBtn} ${styles.challengeVoteBtnSelected}`}>
              <Check size={13} strokeWidth={2.5} />
              {t("challenges.yourPrediction", "Your Prediction")}: {userVote}
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-mute)", fontFamily: "var(--body)" }}>
              {t("challenges.goToChallenges", "Go to Challenges tab for entries, referrals & leaderboard")} &rarr;
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`${styles.challengeVoteBtn} ${voting === challenge.teamA ? styles.challengeVoteBtnSelected : ""}`}
              disabled={!!voting}
              onClick={(e) => handleVote(e, challenge.teamA)}
            >
              {voting === challenge.teamA && <Check size={13} strokeWidth={2.5} />}
              {challenge.teamA}
            </button>
            <button
              className={`${styles.challengeVoteBtn} ${voting === challenge.teamB ? styles.challengeVoteBtnSelected : ""}`}
              disabled={!!voting}
              onClick={(e) => handleVote(e, challenge.teamB)}
            >
              {voting === challenge.teamB && <Check size={13} strokeWidth={2.5} />}
              {challenge.teamB}
            </button>
          </div>
        )}
        <div className={styles.challengeCardFooter}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} strokeWidth={2} />
            <ChallengeCountdown matchDate={challenge.matchDate} />
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Gift size={11} strokeWidth={2} />
            {challenge.winnerCount} {t("challenges.winners", "Winners")}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Main Dashboard Client ───────────────────────────────────── */
export default function DashboardClient() {
  const { activeSport, activeSportConfig } = useActiveSport();
  const { t, locale } = useLanguage();

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(now);
  const todayLabel = formatDate(now, locale);

  const { groups, liveCount, isConnected: scoresConnected } = useScoresStream(activeSport, todayKey);
  const scoresLoading = !scoresConnected && groups.length === 0;
  const scoresValidating = !scoresConnected && groups.length > 0;

  const { articles, isLoading: newsLoading } = useNews(12, activeSport);

  // Football: show World Cup groups + knockout bracket
  const isFootball = activeSport === "football";
  const { standings: wcStandings, isLoading: wcLoading } = useSingleStandings(isFootball ? "fifa.world" : null);
  const { rounds: wcRounds, isLoading: bracketLoading } = useBracket(isFootball ? "fifa.world" : null);

  // Other sports: show regular standings
  const { standings, isLoading: standingsLoading } = useStandings(isFootball ? undefined : activeSport);

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

  // Active challenge
  const { challenge, userVote, setUserVote, loading: challengeLoading } = useActiveChallenge();

  const featuredStandings = isFootball ? null : standings[0];

  // Football: World Cup data ready?
  const showWcGroups = isFootball && wcStandings && wcStandings.hasGroups && wcStandings.groups && wcStandings.groups.length > 0;
  const showWcBracket = isFootball && wcRounds.length > 0;
  const wcSectionLoading = isFootball && (wcLoading || bracketLoading);

  return (
    <>
      {/* Today's Matches */}
      <section className="section">
        <div className="sec-head">
          <div>
            <div className="title">
              <Zap size={17} className="title-icon" strokeWidth={2} />
              {activeSportConfig.icon} {t("dashboard.todaysMatches")} <span className="accent">{t("dashboard.matches")}</span>
            </div>
            <div className="sub">
              {scoresValidating && !scoresLoading
                ? t("dashboard.syncing")
                : liveCount > 0
                ? `${formatNumber(liveCount, locale)} ${t("dashboard.liveNow")} · ${todayLabel}`
                : todayLabel}
            </div>
          </div>
          <Link href="/live-scores" className={styles.viewAll}>{t("common.viewAll")}</Link>
        </div>

        {/* Live Now Banner */}
        {!scoresLoading && liveCount > 0 && (
          <div className={styles.liveBanner}>
            <Radio size={14} strokeWidth={2} className={styles.liveBannerIcon} />
            <strong>{(liveCount === 1 ? t("dashboard.matchHappening") : t("dashboard.matchesHappening")).replace("{count}", formatNumber(liveCount, locale)).replace("{sport}", t("sport." + activeSport, activeSportConfig.label))}</strong>
            <Link href="/live-scores" className={styles.liveBannerLink}>{t("dashboard.watchLive")}</Link>
          </div>
        )}

        {/* Challenge card — loads independently of scores */}
        {challengeLoading ? (
          <div style={{ marginBottom: 14 }}>
            <ChallengeSkeleton />
          </div>
        ) : challenge ? (
          <div style={{ marginBottom: 14 }}>
            <ChallengeCard challenge={challenge} userVote={userVote} onVote={setUserVote} />
          </div>
        ) : null}

        {/* Redeem code */}
        <div style={{ marginBottom: 14 }}>
          <RedeemCodeBox />
        </div>

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
              {t("dashboard.noMatchesNextUp")}<strong style={{ color: "var(--ink)" }}>{upcomingData.dateLabel === "__tomorrow__" ? t("time.tomorrow") : upcomingData.dateLabel}</strong>
            </p>
            <div className={styles.matchGrid}>
              {upcomingData.matches.slice(0, 9).map((m) => <MatchCard key={m.id} m={m} />)}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <span style={{ fontSize: 32 }}>{activeSportConfig.icon}</span>
            <p>{t("dashboard.noSportMatchesToday").replace("{sport}", activeSportConfig.label)}</p>
            <p style={{ fontSize: 12, color: "var(--text-mute)" }}>{t("dashboard.checkLiveScores")}</p>
          </div>
        )}
      </section>

      <AdSlot size="banner" label={t("common.sponsored")} />

      {/* Latest News */}
      <section className="section">
        <div className="sec-head">
          <div>
            <div className="title">
              <Newspaper size={17} className="title-icon" strokeWidth={2} />
              {activeSportConfig.icon} {t("dashboard.latestNews")} <span className="accent">{t("dashboard.newsAccent")}</span>
            </div>
          </div>
          <Link href="/news" className={styles.viewAll}>{t("common.viewAll")}</Link>
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

      {/* World Cup Standings (football only) */}
      {isFootball && (wcSectionLoading || showWcGroups || showWcBracket) && (
        <section className="section">
          <div className="sec-head">
            <div>
              <div className="title">
                <Trophy size={17} className="title-icon" strokeWidth={2} />
                {activeSportConfig.icon} {t("dashboard.worldCupStandings")} <span className="accent">{t("dashboard.standingsLabel")}</span>
              </div>
              <div className="sub">{wcStandings?.season}</div>
            </div>
            <Link href="/leagues" className={styles.viewAll}>
              {t("dashboard.fullTable")} <ChevronRight size={13} strokeWidth={2.5} />
            </Link>
          </div>

          {wcSectionLoading ? (
            <div className="skeleton-row" style={{ height: 320, borderRadius: 12 }} />
          ) : (
            <>
              {showWcGroups && (
                <WorldCupGroupsGrid
                  groups={wcStandings!.groups!}
                  leagueName={wcStandings!.leagueName}
                />
              )}
              {showWcBracket && (
                <DashKnockoutBracket
                  rounds={wcRounds}
                  leagueName={wcStandings?.leagueName ?? "FIFA World Cup"}
                />
              )}
            </>
          )}
        </section>
      )}

      {/* League Standings (non-football sports) */}
      {!isFootball && (standingsLoading || featuredStandings) && (
        <section className="section">
          <div className="sec-head">
            <div>
              <div className="title">
                <Trophy size={17} className="title-icon" strokeWidth={2} />
                {activeSportConfig.icon} <span className="accent">{t("dashboard.standingsLabel")}</span>
              </div>
              <div className="sub">{featuredStandings?.season}</div>
            </div>
            <Link href="/leagues" className={styles.viewAll}>
              {t("dashboard.fullTable")} <ChevronRight size={13} strokeWidth={2.5} />
            </Link>
          </div>

          {standingsLoading ? (
            <div className="skeleton-row" style={{ height: 320, borderRadius: 12 }} />
          ) : featuredStandings ? (
            <>
              {featuredStandings.hasGroups && featuredStandings.groups && featuredStandings.groups.length > 0 ? (
                <WorldCupGroupsGrid
                  groups={featuredStandings.groups}
                  leagueName={featuredStandings.leagueName}
                />
              ) : (
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
              )}
            </>
          ) : null}
        </section>
      )}
    </>
  );
}
