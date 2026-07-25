"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import styles from "./match.module.css";
import {
  ArrowLeft, MapPin, Wifi, Calendar,
  Play, Pause, Flag, CircleDot, ArrowUpDown, Target, AlertCircle,
} from "lucide-react";
import { useMatchStream } from "@/hooks/useMatchStream";
import type { MatchDetail } from "@/hooks/useMatchStream";
import { useLanguage } from "@/contexts/LanguageContext";
import AdSlot from "@/components/AdSlot";
import { ShareButtons } from "@/components/ShareButtons";
import { formatNumber, localizeDigits } from "@/lib/locale-utils";
import { translateTeamName } from "@/lib/team-names";
import { translateLeagueName } from "@/lib/league-names";
import type { Locale } from "@/lib/i18n";

/* ─── Event classification ──────────────────────────────── */
type EvtKind = "goal" | "own_goal" | "penalty" | "yellow" | "red" | "sub" | "period" | "other";

function classifyEvt(evt: MatchDetail["keyEvents"][number]): EvtKind {
  const typ = (evt.type ?? "").toLowerCase();
  if (evt.isRedCard   || typ.includes("red card"))   return "red";
  if (evt.isYellowCard|| typ.includes("yellow card")) return "yellow";
  if (evt.isSubstitution || typ.includes("substitut")) return "sub";
  if (evt.isShootout  || typ.includes("shootout") || typ.includes("penalty kick")) return "penalty";
  if (typ.includes("own goal")) return "own_goal";
  if (typ.includes("goal") || typ.includes("score"))   return "goal";
  if (
    typ.includes("kick off") || typ.includes("kickoff") ||
    typ.includes("half") || typ.includes("start 2nd") ||
    typ.includes("full time") || typ.includes("end regular") ||
    typ.includes("period") || typ.includes("end of")
  ) return "period";
  return "other";
}

/* ─── Period divider ─────────────────────────────────────── */
function PeriodRow({ evt, translate }: { evt: MatchDetail["keyEvents"][number]; translate: (key: string, fallback?: string) => string }) {
  const typ = (evt.type ?? "").toLowerCase();
  const isFull = typ.includes("full time") || typ.includes("end regular") || typ.includes("end of");
  const isKick = typ.includes("kick") || typ.includes("start");
  const label = isFull ? translate("matchStatus.fullTime") : isKick && !typ.includes("2nd") && !typ.includes("half") ? translate("match.kickOff") : evt.type ?? "";

  return (
    <div className={styles.periodRow}>
      <div className={styles.periodLine} />
      <span className={styles.periodPill}>
        {isFull ? <Flag size={11} /> : isKick ? <Play size={11} /> : <Pause size={11} />}
        {label}
        {evt.clock ? <span className={styles.periodClock}>{evt.clock}</span> : null}
      </span>
      <div className={styles.periodLine} />
    </div>
  );
}

/* ─── Event icon by kind ─────────────────────────────────── */
function EvtIcon({ kind }: { kind: EvtKind }) {
  if (kind === "goal")      return <span className={`${styles.evtIcon} ${styles.evtIconGoal}`}><CircleDot size={13} /></span>;
  if (kind === "own_goal")  return <span className={`${styles.evtIcon} ${styles.evtIconOg}`}><CircleDot size={13} /></span>;
  if (kind === "penalty")   return <span className={`${styles.evtIcon} ${styles.evtIconGoal}`}><Target size={13} /></span>;
  if (kind === "yellow")    return <span className={`${styles.evtIcon} ${styles.evtIconYellow}`} />;
  if (kind === "red")       return <span className={`${styles.evtIcon} ${styles.evtIconRed}`} />;
  if (kind === "sub")       return <span className={`${styles.evtIcon} ${styles.evtIconSub}`}><ArrowUpDown size={12} /></span>;
  return null;
}

/* ─── Extract clean text from ESPN verbose descriptions ──── */
function extractEvtText(
  evt: MatchDetail["keyEvents"][number],
  kind: EvtKind,
  translate: (key: string, fallback?: string) => string,
): { primary: string; secondary?: string } {
  const raw = evt.text ?? "";

  if (kind === "goal" || kind === "own_goal" || kind === "penalty") {
    if (evt.playerName) return { primary: evt.playerName };
    // "Goal! Team 0, Team 1. FirstName LastName (TEAM) right footed..."
    const m = raw.match(/\.\s+([A-ZÁÉÍÓÚÜÑ][^.(]+?)(?:\s*\(|$)/);
    return { primary: m ? m[1].trim() : raw.slice(0, 30) };
  }

  if (kind === "sub") {
    // "Substitution, Team. PlayerIn replaces PlayerOut [because of an injury]."
    const m = raw.match(/\.\s+(.+?)\s+replaces\s+(.+?)(?:\s+because|\s+due|\s+with|\.?\s*$)/i);
    if (m) return { primary: `↑ ${m[1].trim()}`, secondary: `↓ ${m[2].trim()}` };
    if (evt.playerName) return { primary: `↑ ${evt.playerName}` };
    return { primary: translate("match.substitution") };
  }

  if (kind === "yellow" || kind === "red") {
    if (evt.playerName) return { primary: evt.playerName };
    // "Kendrys Silva (UCV) is shown the yellow card for a bad foul."
    const m = raw.match(/^(.+?)\s*\([^)]+\)\s+is shown/i);
    return { primary: m ? m[1].trim() : raw.slice(0, 30) };
  }

  return { primary: evt.playerName ?? raw.slice(0, 35) ?? evt.type ?? "" };
}

/* ─── Single event row ───────────────────────────────────── */
function EventRow({
  evt,
  isHome,
  kind,
  translate,
}: {
  evt: MatchDetail["keyEvents"][number];
  isHome: boolean;
  kind: EvtKind;
  translate: (key: string, fallback?: string) => string;
}) {
  const { primary, secondary } = extractEvtText(evt, kind, translate);
  const subLabel = kind === "own_goal" ? translate("match.ownGoal") : kind === "penalty" ? translate("match.penalty") : undefined;

  const cell = (
    <div className={`${styles.evtCell} ${
      kind === "goal" || kind === "penalty" ? styles.evtCellGoal :
      kind === "own_goal" ? styles.evtCellOg :
      kind === "yellow" ? styles.evtCellYellow :
      kind === "red" ? styles.evtCellRed :
      kind === "sub" ? styles.evtCellSub :
      styles.evtCellDefault
    }`}>
      <EvtIcon kind={kind} />
      <div className={styles.evtCellText}>
        <span className={styles.evtPlayer}>{primary}</span>
        {secondary && <span className={styles.evtSublabel}>{secondary}</span>}
        {subLabel && <span className={styles.evtSublabel}>{subLabel}</span>}
      </div>
    </div>
  );

  return (
    <div className={styles.evtRow}>
      <div className={`${styles.evtSide} ${styles.evtSideHome}`}>
        {isHome && cell}
      </div>
      <div className={styles.evtMinute}>{evt.clock ?? ""}</div>
      <div className={`${styles.evtSide} ${styles.evtSideAway}`}>
        {!isHome && cell}
      </div>
    </div>
  );
}

/* ─── Sport-specific UI config ───────────────────────────── */
const SPORT_PREVIEW_STATS: Record<string, string[]> = {
  football:   ["Possession", "Shots", "On Target", "Corners", "Fouls", "Yellow Cards"],
  basketball: ["Points", "Rebounds", "Assists", "Field Goal %", "3-Pointers", "Turnovers"],
  cricket:    ["Runs", "Wickets", "Overs", "Run Rate", "4s", "6s"],
  hockey:     ["Shots", "Power Plays", "Face-offs Won", "Hits", "Blocked Shots", "Giveaways"],
  baseball:   ["Runs", "Hits", "Errors", "At Bats", "Strikeouts", "Walks"],
  tennis:     ["1st Serve %", "Aces", "Break Points", "Winners", "Unforced Errors", "Points Won"],
  racing:     ["Laps Led", "Pit Stops", "Fastest Lap", "Avg Speed", "Cautions", "Lead Changes"],
};

/* ─── i18n keys for sport start labels ───────────────────── */
const SPORT_START_LABEL_KEY: Record<string, string> = {
  football:   "match.kickOff",
  basketball: "match.tipOff",
  cricket:    "match.firstBall",
  hockey:     "match.puckDrop",
  baseball:   "match.firstPitch",
  tennis:     "match.matchStart",
  racing:     "match.raceStart",
};

/* ─── i18n keys for scheduled sub-text ───────────────────── */
const SPORT_SCHEDULED_SUB_KEY: Record<string, string> = {
  football:   "match.scheduledFootball",
  basketball: "match.scheduledBasketball",
  cricket:    "match.scheduledCricket",
  hockey:     "match.scheduledHockey",
  baseball:   "match.scheduledBaseball",
  tennis:     "match.scheduledTennis",
  racing:     "match.scheduledRacing",
};

/* ─── Stat bar ───────────────────────────────────────────── */
function StatBar({ label, home, away, localeCode }: { label: string; home: string; away: string; localeCode: Locale }) {
  const h = parseFloat(home) || 0;
  const a = parseFloat(away) || 0;
  const total = h + a;
  const hPct = total === 0 ? 50 : Math.round((h / total) * 100);
  const aPct = 100 - hPct;

  const fmt = (v: string) => {
    if (v.endsWith("%")) return localizeDigits(v, localeCode);
    const n = parseFloat(v);
    if (!isNaN(n) && n > 0 && n < 1) return localizeDigits(`${(n * 100).toFixed(0)}%`, localeCode);
    if (label.toLowerCase().includes("pct") || label.toLowerCase().includes("possession")) return localizeDigits(`${v}%`, localeCode);
    return localizeDigits(v, localeCode);
  };

  const fmtLabel = (key: string) => {
    const MAP: Record<string, string> = {
      // Football
      possessionPct: "Possession", totalShots: "Shots", shotsOnTarget: "On Target",
      saves: "Saves", foulsCommitted: "Fouls", yellowCards: "Yellow Cards", redCards: "Red Cards",
      offsides: "Offsides", wonCorners: "Corners", accuratePasses: "Passes",
      totalPasses: "Total Passes", tackles: "Tackles",
      // Basketball
      fieldGoalsMade: "FG Made", fieldGoalsAttempted: "FG Att", fieldGoalPct: "FG %",
      threePointsMade: "3PT Made", threePointsAttempted: "3PT Att", threePointPct: "3PT %",
      freeThrowsMade: "FT Made", freeThrowsAttempted: "FT Att", freeThrowPct: "FT %",
      rebounds: "Rebounds", offensiveRebounds: "Off Reb", defensiveRebounds: "Def Reb",
      assists: "Assists", steals: "Steals", blocks: "Blocks", turnovers: "Turnovers",
      fouls: "Fouls", technicalFouls: "Tech Fouls", fastBreakPoints: "Fast Break Pts",
      pointsInPaint: "Paint Points", pointsOffTurnovers: "Pts off Turnovers",
      // Hockey
      shots: "Shots", powerPlays: "Power Plays", faceoffWinPct: "Face-off %",
      hockeyHits: "Hits", blockedShots: "Blocked Shots", giveaways: "Giveaways", takeaways: "Takeaways",
      // Baseball
      runs: "Runs", hits: "Hits", errors: "Errors", leftOnBase: "Left on Base",
      strikeouts: "Strikeouts", walks: "Walks",
      // Cricket
      wickets: "Wickets", overs: "Overs", runRate: "Run Rate",
      fours: "4s", sixes: "6s", extras: "Extras",
    };
    return MAP[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
  };

  return (
    <div className={styles.statRow}>
      <span className={styles.statVal}>{fmt(home)}</span>
      <div className={styles.statBarWrap}>
        <span className={styles.statLabel}>{fmtLabel(label)}</span>
        <div className={styles.statBarTrack}>
          <div className={styles.statBarH} style={{ width: `${hPct}%` }} />
          <div className={styles.statBarA} style={{ width: `${aPct}%` }} />
        </div>
      </div>
      <span className={`${styles.statVal} ${styles.statValAway}`}>{fmt(away)}</span>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function MatchClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const league = searchParams.get("league") ?? "eng.1";
  const sport = searchParams.get("sport") ?? "football";
  const { t, locale } = useLanguage();

  const { data: match, isConnected, isLoading, error } = useMatchStream(eventId, sport, league);

  if (isLoading) {
    return (
      <AppShell active="live-scores" title={t("match.match")} subtitle={t("match.loading")}>
        <div className={styles.loadingWrap}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-row" style={{ height: 80, borderRadius: 12 }} />
          ))}
        </div>
      </AppShell>
    );
  }

  if (error || !match) {
    return (
      <AppShell active="live-scores" title={t("match.match")} subtitle={t("match.error")}>
        <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-mute)" }}>
          <AlertCircle size={40} strokeWidth={1.5} style={{ marginBottom: 12, color: "var(--text-mute)" }} />
          <p>{t("match.matchDataNotAvailable")}</p>
          <Link href="/live-scores" className={styles.backBtn} style={{ display: "inline-flex", marginTop: 16 }}>
            <ArrowLeft size={14} /> {t("match.backToScores")}
          </Link>
        </div>
      </AppShell>
    );
  }

  const statusStr = match.status ?? "";
  const isLive = statusStr.includes("IN_PROGRESS") || statusStr.includes("HALFTIME");
  const isFinished = statusStr.includes("FINAL") || statusStr.includes("FULL_TIME") || statusStr.includes("STATUS_FINAL");
  const isScheduled = !isLive && !isFinished;

  const homeStats = match.stats.find((s) => s.teamId === match.homeTeam.id) ?? match.stats[0];
  const awayStats = match.stats.find((s) => s.teamId === match.awayTeam.id) ?? match.stats[1];
  const hasStats = (isLive || isFinished) && (homeStats?.stats.length ?? 0) > 0;

  const homeRoster = match.rosters.find((r) => r.teamId === match.homeTeam.id) ?? match.rosters[0];
  const awayRoster = match.rosters.find((r) => r.teamId === match.awayTeam.id) ?? match.rosters[1];
  const hasLineups = (homeRoster?.players.length ?? 0) > 0 || (awayRoster?.players.length ?? 0) > 0;

  const homeName = translateTeamName(match.homeTeam.name ?? "", locale);
  const awayName = translateTeamName(match.awayTeam.name ?? "", locale);

  const titleSuffix = isLive
    ? (match.clock ? `${match.clock}'` : t("matchStatus.live"))
    : isFinished ? t("matchStatus.fullTime")
    : match.statusDisplay ?? t("matchStatus.upcoming");

  const previewStats = SPORT_PREVIEW_STATS[sport] ?? SPORT_PREVIEW_STATS.football;
  const startLabelKey = SPORT_START_LABEL_KEY[sport] ?? "match.kickOff";
  const startLabel = t(startLabelKey);
  const scheduledSubKey = SPORT_SCHEDULED_SUB_KEY[sport] ?? "match.scheduledFootball";
  const scheduledSub = t(scheduledSubKey);

  return (
    <AppShell
      active="live-scores"
      title={`${homeName || t("match.home")} ${t("matchStatus.vs")} ${awayName || t("match.away")}`}
      subtitle={`${match.venue ? match.venue + " · " : ""}${titleSuffix}`}
    >
      <div className="stack-sm">

        {/* Back + connection */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/live-scores" className={styles.backBtn}>
            <ArrowLeft size={14} /> {t("match.allMatches")}
          </Link>
          <span style={{
            fontSize: 11, fontFamily: "var(--mono)",
            color: isConnected ? "var(--accent-line)" : "var(--text-mute)",
            display: "flex", alignItems: "center", gap: 4,
            background: isConnected ? "var(--ink)" : "transparent",
            padding: "3px 8px", borderRadius: 10,
          }}>
            <Wifi size={11} /> {isConnected ? t("match.liveStream") : t("match.reconnecting")}
          </span>
        </div>

        {/* ── Match Header ─────────────────────────────────── */}
        <div className={styles.matchCard}>
          <div className={styles.matchLeague}>
            <span className={styles.leaguePill}>
              {isLive && (
                <span className={styles.liveDot} />
              )}
              {match.venue ?? t("match.match")}
            </span>
          </div>

          <div className={styles.scoreRow}>
            <div className={styles.teamBlock}>
              {match.homeTeam.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.homeTeam.logo} alt={homeName} width={72} height={72} className={styles.teamCrest} />
              )}
              <span className={styles.teamName}>{homeName}</span>
              {match.homeTeam.record && <span className={styles.teamRecord}>{match.homeTeam.record}</span>}
            </div>

            <div className={styles.scoreCenter}>
              {isScheduled ? (
                <>
                  <div className={styles.scoreNums}>
                    <span className={styles.scoreNumDash}>–</span>
                    <span className={styles.scoreDash}>:</span>
                    <span className={styles.scoreNumDash}>–</span>
                  </div>
                  <div className={`${styles.statusPill} ${styles.statusSch}`}>
                    {match.statusDisplay ?? t("matchStatus.scheduled")}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.scoreNums}>
                    <span className={styles.scoreNum}>{match.homeTeam.score ?? (isFinished ? "0" : "–")}</span>
                    <span className={styles.scoreDash}>:</span>
                    <span className={styles.scoreNum}>{match.awayTeam.score ?? (isFinished ? "0" : "–")}</span>
                  </div>
                  <div className={`${styles.statusPill} ${isLive ? styles.statusLive : styles.statusFt}`}>
                    {isLive ? (match.clock ? `${match.clock}'` : t("matchStatus.live")) : t("matchStatus.fullTime")}
                  </div>
                </>
              )}
            </div>

            <div className={`${styles.teamBlock} ${styles.teamBlockAway}`}>
              {match.awayTeam.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.awayTeam.logo} alt={awayName} width={72} height={72} className={styles.teamCrest} />
              )}
              <span className={styles.teamName}>{awayName}</span>
              {match.awayTeam.record && <span className={styles.teamRecord}>{match.awayTeam.record}</span>}
            </div>
          </div>

          {match.attendance && (
            <div className={styles.venueRow}>
              <MapPin size={11} />
              {t("match.attendance")}: {formatNumber(match.attendance, locale)}
            </div>
          )}
        </div>

        <ShareButtons
          url={`/matches/${eventId}`}
          title={`${homeName} vs ${awayName} — ${titleSuffix}`}
        />

        <AdSlot size="banner" />

        {/* ── Scheduled match placeholder ───────────────────── */}
        {isScheduled && (
          <>
            <div className={styles.kickoffBlock}>
              <span className={styles.kickoffLabel}>
                <Calendar size={12} style={{ verticalAlign: "middle", marginInlineEnd: 4 }} />
                {startLabel}
              </span>
              <div className={styles.kickoffTime}>{match.statusDisplay ?? t("match.timeTBC")}</div>
              <div className={styles.kickoffSub}>{scheduledSub}</div>
            </div>

            <div className={styles.naSection}>
              <h3 className={styles.naSectionTitle}>{sport === "basketball" ? t("match.gameStats") : sport === "cricket" ? t("match.inningsStats") : t("match.statistics")}</h3>
              <div className={styles.naGrid}>
                {previewStats.map((stat) => (
                  <div key={stat} className={styles.naCell}>
                    <span className={styles.naCellLabel}>{stat}</span>
                    <span className={styles.naCellValue}>N/A</span>
                  </div>
                ))}
              </div>
            </div>

            {!hasLineups && (
              <div className={styles.naSection}>
                <h3 className={styles.naSectionTitle}>{sport === "basketball" ? t("match.rosters") : sport === "cricket" ? t("match.playingXI") : t("match.lineUps")}</h3>
                <div className={styles.naContent}>
                  <span>{sport === "basketball" ? t("match.lineupsBasketball") : sport === "cricket" ? t("match.lineupsCricket") : t("match.lineupsFootball")}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Match Events ─────────────────────────────────── */}
        {match.keyEvents.length > 0 && (
          <div className={styles.section}>
            {/* Team name header row */}
            <div className={styles.evtTeamHeader}>
              <span>{homeName}</span>
              <span className={styles.sectionTitle} style={{ border: "none", padding: 0 }}>
                {sport === "basketball" ? t("match.playByPlay") : sport === "cricket" ? t("match.fallOfWickets") : t("match.matchEvents")}
              </span>
              <span style={{ textAlign: "right" }}>{awayName}</span>
            </div>

            <div className={styles.timeline}>
              {match.keyEvents.map((evt, idx) => {
                const kind = classifyEvt(evt);
                const isPeriod = kind === "period";
                const isHomeEvt = !isPeriod && evt.teamId === match.homeTeam.id;
                const isAwayEvt = !isPeriod && evt.teamId === match.awayTeam.id;
                // Events with no teamId that aren't period markers → try to place by context, default home
                const effectiveHome = isPeriod ? false : isHomeEvt || (!isHomeEvt && !isAwayEvt);
                const effectiveAway = !isPeriod && isAwayEvt;

                if (isPeriod) {
                  return <PeriodRow key={evt.id ?? idx} evt={evt} translate={t} />;
                }

                return (
                  <EventRow
                    key={evt.id ?? idx}
                    evt={evt}
                    kind={kind}
                    isHome={effectiveHome && !effectiveAway}
                    translate={t}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ── Match Statistics ─────────────────────────────── */}
        {hasStats && homeStats && awayStats && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {sport === "basketball" ? t("match.gameStatistics") : sport === "cricket" ? t("match.inningsStatistics") : t("match.statistics")}
            </h3>
            <div className={styles.statTeamRow}>
              <span>{homeName}</span>
              <span>{awayName}</span>
            </div>
            <div className={styles.statsGrid}>
              {homeStats.stats.map((s, idx) => {
                const awayStat = awayStats?.stats.find((a) => a.name === s.name) ?? awayStats?.stats[idx];
                return (
                  <StatBar
                    key={s.name ?? idx}
                    label={s.name ?? ""}
                    home={s.value ?? "0"}
                    away={awayStat?.value ?? "0"}
                    localeCode={locale}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ── Line-ups ─────────────────────────────────────── */}
        {hasLineups && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {sport === "basketball" ? t("match.rosters") : sport === "cricket" ? t("match.playingXI") : isScheduled ? t("match.expectedLineUps") : t("match.lineUps")}
            </h3>
            <div className={styles.lineupsGrid}>
              {homeRoster && (
                <div className={styles.lineupCol}>
                  <div className={styles.lineupTeamHead}>
                    {homeRoster.teamLogo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={homeRoster.teamLogo} alt="" width={20} height={20} style={{ objectFit: "contain" }} />
                    )}
                    <span>{translateTeamName(homeRoster.teamName ?? "", locale)}</span>
                    {homeRoster.formation && sport === "football" && <span className={styles.formation}>{homeRoster.formation}</span>}
                  </div>
                  <div className={styles.playerList}>
                    {homeRoster.players.filter((p) => p.starter).map((p) => (
                      <div key={p.id ?? p.name} className={`${styles.playerRow} ${p.subbedOut ? styles.subbedOut : ""}`}>
                        <span className={styles.plPos}>{p.position}</span>
                        {p.headshot && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.headshot} alt={p.name} width={28} height={28} className={styles.plHeadshot}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <span className={styles.plName}>{p.name}</span>
                        {p.subbedOut && <span className={styles.subTag} style={{ color: "var(--coral)" }}>↓</span>}
                      </div>
                    ))}
                    {homeRoster.players.filter((p) => !p.starter).length > 0 && (
                      <>
                        <div className={styles.subsDivider}>{sport === "basketball" ? t("match.bench") : sport === "cricket" ? t("match.reserves") : t("match.substitutes")}</div>
                        {homeRoster.players.filter((p) => !p.starter).map((p) => (
                          <div key={p.id ?? p.name} className={styles.playerRow}>
                            <span className={styles.plPos}>{p.position}</span>
                            <span className={styles.plName}>{p.name}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
              {awayRoster && (
                <div className={styles.lineupCol}>
                  <div className={styles.lineupTeamHead}>
                    {awayRoster.teamLogo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={awayRoster.teamLogo} alt="" width={20} height={20} style={{ objectFit: "contain" }} />
                    )}
                    <span>{translateTeamName(awayRoster.teamName ?? "", locale)}</span>
                    {awayRoster.formation && sport === "football" && <span className={styles.formation}>{awayRoster.formation}</span>}
                  </div>
                  <div className={styles.playerList}>
                    {awayRoster.players.filter((p) => p.starter).map((p) => (
                      <div key={p.id ?? p.name} className={`${styles.playerRow} ${p.subbedOut ? styles.subbedOut : ""}`}>
                        <span className={styles.plPos}>{p.position}</span>
                        {p.headshot && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.headshot} alt={p.name} width={28} height={28} className={styles.plHeadshot}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <span className={styles.plName}>{p.name}</span>
                        {p.subbedOut && <span className={styles.subTag} style={{ color: "var(--coral)" }}>↓</span>}
                      </div>
                    ))}
                    {awayRoster.players.filter((p) => !p.starter).length > 0 && (
                      <>
                        <div className={styles.subsDivider}>{sport === "basketball" ? t("match.bench") : sport === "cricket" ? t("match.reserves") : t("match.substitutes")}</div>
                        {awayRoster.players.filter((p) => !p.starter).map((p) => (
                          <div key={p.id ?? p.name} className={styles.playerRow}>
                            <span className={styles.plPos}>{p.position}</span>
                            <span className={styles.plName}>{p.name}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
