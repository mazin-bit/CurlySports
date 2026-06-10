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

/* ─── Event classification ──────────────────────────────── */
type EvtKind = "goal" | "own_goal" | "penalty" | "yellow" | "red" | "sub" | "period" | "other";

function classifyEvt(evt: MatchDetail["keyEvents"][number]): EvtKind {
  const t = (evt.type ?? "").toLowerCase();
  if (evt.isRedCard   || t.includes("red card"))   return "red";
  if (evt.isYellowCard|| t.includes("yellow card")) return "yellow";
  if (evt.isSubstitution || t.includes("substitut")) return "sub";
  if (evt.isShootout  || t.includes("shootout") || t.includes("penalty kick")) return "penalty";
  if (t.includes("own goal")) return "own_goal";
  if (t.includes("goal") || t.includes("score"))   return "goal";
  if (
    t.includes("kick off") || t.includes("kickoff") ||
    t.includes("half") || t.includes("start 2nd") ||
    t.includes("full time") || t.includes("end regular") ||
    t.includes("period") || t.includes("end of")
  ) return "period";
  return "other";
}

/* ─── Period divider ─────────────────────────────────────── */
function PeriodRow({ evt }: { evt: MatchDetail["keyEvents"][number] }) {
  const t = (evt.type ?? "").toLowerCase();
  const isFull = t.includes("full time") || t.includes("end regular") || t.includes("end of");
  const isKick = t.includes("kick") || t.includes("start");
  const label = isFull ? "Full Time" : isKick && !t.includes("2nd") && !t.includes("half") ? "Kick Off" : evt.type ?? "";

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
  kind: EvtKind
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
    return { primary: "Substitution" };
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
}: {
  evt: MatchDetail["keyEvents"][number];
  isHome: boolean;
  kind: EvtKind;
}) {
  const { primary, secondary } = extractEvtText(evt, kind);
  const subLabel = kind === "own_goal" ? "Own Goal" : kind === "penalty" ? "Penalty" : undefined;

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

const SPORT_START_LABEL: Record<string, string> = {
  football:   "Kick Off",
  basketball: "Tip Off",
  cricket:    "First Ball",
  hockey:     "Puck Drop",
  baseball:   "First Pitch",
  tennis:     "Match Start",
  racing:     "Race Start",
};

const SPORT_SCHEDULED_SUB: Record<string, string> = {
  football:   "Match events and statistics will appear here at kick off",
  basketball: "Game stats and play-by-play will appear at tip off",
  cricket:    "Innings, wickets and overs will appear when play begins",
  hockey:     "Game stats will appear at puck drop",
  baseball:   "Game stats will appear at first pitch",
  tennis:     "Match stats will appear when play begins",
  racing:     "Race data will appear when the race starts",
};

/* ─── Stat bar ───────────────────────────────────────────── */
function StatBar({ label, home, away }: { label: string; home: string; away: string }) {
  const h = parseFloat(home) || 0;
  const a = parseFloat(away) || 0;
  const total = h + a;
  const hPct = total === 0 ? 50 : Math.round((h / total) * 100);
  const aPct = 100 - hPct;

  const fmt = (v: string) => {
    if (v.endsWith("%")) return v;
    const n = parseFloat(v);
    if (!isNaN(n) && n > 0 && n < 1) return `${(n * 100).toFixed(0)}%`;
    if (label.toLowerCase().includes("pct") || label.toLowerCase().includes("possession")) return `${v}%`;
    return v;
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
export default function MatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const league = searchParams.get("league") ?? "eng.1";
  const sport = searchParams.get("sport") ?? "football";

  const { data: match, isConnected, isLoading, error } = useMatchStream(eventId, sport, league);

  if (isLoading) {
    return (
      <AppShell active="live-scores" title="Match" subtitle="Loading…">
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
      <AppShell active="live-scores" title="Match" subtitle="Error">
        <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-mute)" }}>
          <AlertCircle size={40} strokeWidth={1.5} style={{ marginBottom: 12, color: "var(--text-mute)" }} />
          <p>Match data not available.</p>
          <Link href="/live-scores" className={styles.backBtn} style={{ display: "inline-flex", marginTop: 16 }}>
            <ArrowLeft size={14} /> Back to Scores
          </Link>
        </div>
      </AppShell>
    );
  }

  const statusStr = match.status ?? "";
  const isLive = statusStr.includes("IN_PROGRESS") || statusStr.includes("HALFTIME");
  const isFinished = statusStr.includes("FINAL") || statusStr.includes("FULL_TIME") || statusStr.includes("STATUS_FINAL");
  const isScheduled = !isLive && !isFinished;

  const homeStats = match.stats.find((t) => t.teamId === match.homeTeam.id) ?? match.stats[0];
  const awayStats = match.stats.find((t) => t.teamId === match.awayTeam.id) ?? match.stats[1];
  const hasStats = (isLive || isFinished) && (homeStats?.stats.length ?? 0) > 0;

  const homeRoster = match.rosters.find((r) => r.teamId === match.homeTeam.id) ?? match.rosters[0];
  const awayRoster = match.rosters.find((r) => r.teamId === match.awayTeam.id) ?? match.rosters[1];
  const hasLineups = (homeRoster?.players.length ?? 0) > 0 || (awayRoster?.players.length ?? 0) > 0;

  const titleSuffix = isLive
    ? (match.clock ? `${match.clock}'` : "LIVE")
    : isFinished ? "Full Time"
    : match.statusDisplay ?? "Upcoming";

  const previewStats = SPORT_PREVIEW_STATS[sport] ?? SPORT_PREVIEW_STATS.football;
  const startLabel = SPORT_START_LABEL[sport] ?? "Kick Off";
  const scheduledSub = SPORT_SCHEDULED_SUB[sport] ?? SPORT_SCHEDULED_SUB.football;

  return (
    <AppShell
      active="live-scores"
      title={`${match.homeTeam.name ?? "Home"} vs ${match.awayTeam.name ?? "Away"}`}
      subtitle={`${match.venue ? match.venue + " · " : ""}${titleSuffix}`}
    >
      <div className="stack-sm">

        {/* Back + connection */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/live-scores" className={styles.backBtn}>
            <ArrowLeft size={14} /> All Matches
          </Link>
          <span style={{
            fontSize: 11, fontFamily: "var(--mono)",
            color: isConnected ? "var(--accent-line)" : "var(--text-mute)",
            display: "flex", alignItems: "center", gap: 4,
            background: isConnected ? "var(--ink)" : "transparent",
            padding: "3px 8px", borderRadius: 10,
          }}>
            <Wifi size={11} /> {isConnected ? "live stream" : "reconnecting…"}
          </span>
        </div>

        {/* ── Match Header ─────────────────────────────────── */}
        <div className={styles.matchCard}>
          <div className={styles.matchLeague}>
            <span className={styles.leaguePill}>
              {isLive && (
                <span className={styles.liveDot} />
              )}
              {match.venue ?? "Match"}
            </span>
          </div>

          <div className={styles.scoreRow}>
            <div className={styles.teamBlock}>
              {match.homeTeam.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.homeTeam.logo} alt={match.homeTeam.name} width={72} height={72} className={styles.teamCrest} />
              )}
              <span className={styles.teamName}>{match.homeTeam.name}</span>
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
                    {match.statusDisplay ?? "Scheduled"}
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
                    {isLive ? (match.clock ? `${match.clock}'` : "LIVE") : "Full Time"}
                  </div>
                </>
              )}
            </div>

            <div className={`${styles.teamBlock} ${styles.teamBlockAway}`}>
              {match.awayTeam.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.awayTeam.logo} alt={match.awayTeam.name} width={72} height={72} className={styles.teamCrest} />
              )}
              <span className={styles.teamName}>{match.awayTeam.name}</span>
              {match.awayTeam.record && <span className={styles.teamRecord}>{match.awayTeam.record}</span>}
            </div>
          </div>

          {match.attendance && (
            <div className={styles.venueRow}>
              <MapPin size={11} />
              Attendance: {match.attendance.toLocaleString()}
            </div>
          )}
        </div>

        {/* ── Scheduled match placeholder ───────────────────── */}
        {isScheduled && (
          <>
            <div className={styles.kickoffBlock}>
              <span className={styles.kickoffLabel}>
                <Calendar size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                {startLabel}
              </span>
              <div className={styles.kickoffTime}>{match.statusDisplay ?? "Time TBC"}</div>
              <div className={styles.kickoffSub}>{scheduledSub}</div>
            </div>

            <div className={styles.naSection}>
              <h3 className={styles.naSectionTitle}>{sport === "basketball" ? "Game Stats" : sport === "cricket" ? "Innings Stats" : "Match Statistics"}</h3>
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
                <h3 className={styles.naSectionTitle}>{sport === "basketball" ? "Rosters" : sport === "cricket" ? "Playing XI" : "Line-ups"}</h3>
                <div className={styles.naContent}>
                  <span>{sport === "basketball" ? "Starting lineups will be available at tip off" : sport === "cricket" ? "Playing XI will be confirmed before the match" : "Line-ups will be confirmed closer to kick off"}</span>
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
              <span>{match.homeTeam.name}</span>
              <span className={styles.sectionTitle} style={{ border: "none", padding: 0 }}>
                {sport === "basketball" ? "Play-by-Play" : sport === "cricket" ? "Fall of Wickets" : "Match Events"}
              </span>
              <span style={{ textAlign: "right" }}>{match.awayTeam.name}</span>
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
                  return <PeriodRow key={evt.id ?? idx} evt={evt} />;
                }

                return (
                  <EventRow
                    key={evt.id ?? idx}
                    evt={evt}
                    kind={kind}
                    isHome={effectiveHome && !effectiveAway}
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
              {sport === "basketball" ? "Game Statistics" : sport === "cricket" ? "Innings Statistics" : "Match Statistics"}
            </h3>
            <div className={styles.statTeamRow}>
              <span>{match.homeTeam.name}</span>
              <span>{match.awayTeam.name}</span>
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
              {sport === "basketball" ? "Rosters" : sport === "cricket" ? "Playing XI" : isScheduled ? "Expected Line-ups" : "Line-ups"}
            </h3>
            <div className={styles.lineupsGrid}>
              {homeRoster && (
                <div className={styles.lineupCol}>
                  <div className={styles.lineupTeamHead}>
                    {homeRoster.teamLogo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={homeRoster.teamLogo} alt="" width={20} height={20} style={{ objectFit: "contain" }} />
                    )}
                    <span>{homeRoster.teamName}</span>
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
                        <div className={styles.subsDivider}>{sport === "basketball" ? "Bench" : sport === "cricket" ? "Reserves" : "Substitutes"}</div>
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
                    <span>{awayRoster.teamName}</span>
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
                        <div className={styles.subsDivider}>{sport === "basketball" ? "Bench" : sport === "cricket" ? "Reserves" : "Substitutes"}</div>
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
