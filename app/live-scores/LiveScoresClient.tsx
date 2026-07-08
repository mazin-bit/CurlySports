"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import styles from "./live-scores.module.css";
import { useScoresStream } from "@/hooks/useScoresStream";
import { useActiveSport } from "@/contexts/SportContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatTime, formatNumber, localizeDigits, dayAbbr, monthYearLabel } from "@/lib/locale-utils";
import { translateTeamName } from "@/lib/team-names";
import { translateLeagueName } from "@/lib/league-names";
import type { NormalizedMatch } from "@/lib/types";

function toDateKey(d: Date) {
  return (
    String(d.getFullYear()) +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0")
  );
}

function getMonday(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

function addDays(d: Date, n: number) {
  const nd = new Date(d);
  nd.setDate(d.getDate() + n);
  return nd;
}

/* ── Calendar Strip ──────────────────────────────────────────── */
function CalendarStrip({ selected, onSelect }: { selected: string; onSelect: (key: string) => void }) {
  const { locale } = useLanguage();
  const [now] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const todayKey = toDateKey(now);
  const [weekStart, setWeekStart] = useState(() => getMonday(now));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const first = days[0];
  const last = days[6];
  const monthLabel =
    first.getMonth() === last.getMonth()
      ? monthYearLabel(first, locale)
      : `${monthYearLabel(first, locale)} / ${monthYearLabel(last, locale)}`;

  return (
    <div className={styles.calendar}>
      <div className={styles.calHeader}>
        <button className={styles.calArrow} onClick={() => setWeekStart((d) => addDays(d, -7))} aria-label="Previous week">‹</button>
        <span className={styles.calMonth}>{monthLabel}</span>
        <button className={styles.calArrow} onClick={() => setWeekStart((d) => addDays(d, 7))} aria-label="Next week">›</button>
      </div>
      <div className={styles.calDays}>
        {days.map((d) => {
          const key = toDateKey(d);
          const isToday = key === todayKey;
          const isSel = key === selected;
          return (
            <button
              key={key}
              className={[styles.calDay, isSel ? styles.calDaySel : "", isToday && !isSel ? styles.calDayToday : ""].filter(Boolean).join(" ")}
              onClick={() => onSelect(key)}
            >
              <span className={styles.calDayName}>{dayAbbr(d, locale)}</span>
              <span className={styles.calDayNum}>{localizeDigits(String(d.getDate()), locale)}</span>
              {isToday && <span className={styles.calDot} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Status pill ─────────────────────────────────────────────── */
function statusPill(match: NormalizedMatch, t: (k: string) => string, locale: import("@/lib/i18n").Locale) {
  if (match.status === "LIVE") {
    const display = match.minute ? `${match.minute}'` : match.statusDisplay;
    return <span className="status-pill live">{display}</span>;
  }
  if (match.status === "HALF_TIME") return <span className="status-pill live">{t("matchStatus.ht")}</span>;
  if (match.status === "FINISHED") return <span className="status-pill ft">{t("matchStatus.ft")}</span>;
  const d = new Date(match.scheduledAt);
  return <span className="status-pill up">{formatTime(d, locale)}</span>;
}

/* ── Match row ───────────────────────────────────────────────── */
function MatchRow({ m }: { m: NormalizedMatch }) {
  const { t, locale } = useLanguage();
  const homeWins = m.homeScore !== null && m.awayScore !== null && m.homeScore > m.awayScore;
  const awayWins = m.homeScore !== null && m.awayScore !== null && m.awayScore > m.homeScore;
  const href = `/matches/${m.id}?sport=${m.sport}&league=${m.league.id}`;
  return (
    <Link href={href} className={styles.matchRow} style={{ textDecoration: "none", color: "inherit", display: "flex" }}>
      <div className={styles.matchStatus}>{statusPill(m, t, locale)}</div>
      <div className={`${styles.teamSide} ${styles.homeTeam}`}>
        <span className={`${styles.teamLabel}${homeWins ? " " + styles.bold : ""}`}>{translateTeamName(m.homeTeam.shortName, locale)}</span>
        {m.homeTeam.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.homeTeam.logoUrl} alt={m.homeTeam.shortName} width={26} height={26} style={{ borderRadius: 3, objectFit: "contain" }} />
        ) : (
          <div className="crest" style={{ width: 26, height: 26, fontSize: 9 }}>{m.homeTeam.shortName.slice(0, 3)}</div>
        )}
      </div>
      <div className={styles.scoreBox}>
        <span className={`${styles.scoreNum}${homeWins ? " " + styles.accent : ""}`}>{m.homeScore ?? "-"}</span>
        <span className={styles.scoreSep}>:</span>
        <span className={`${styles.scoreNum}${awayWins ? " " + styles.accent : ""}`}>{m.awayScore ?? "-"}</span>
      </div>
      <div className={styles.teamSide}>
        {m.awayTeam.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.awayTeam.logoUrl} alt={m.awayTeam.shortName} width={26} height={26} style={{ borderRadius: 3, objectFit: "contain" }} />
        ) : (
          <div className="crest" style={{ width: 26, height: 26, fontSize: 9 }}>{m.awayTeam.shortName.slice(0, 3)}</div>
        )}
        <span className={`${styles.teamLabel}${awayWins ? " " + styles.bold : ""}`}>{translateTeamName(m.awayTeam.shortName, locale)}</span>
      </div>
      <span className={styles.venue}>{m.venue ?? ""}</span>
    </Link>
  );
}

/* ── Main client ─────────────────────────────────────────────── */
export default function LiveScoresClient() {
  const { activeSport, activeSportConfig } = useActiveSport();
  const { t, locale } = useLanguage();

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return toDateKey(now);
  });

  const [todayKey] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return toDateKey(now);
  });

  // When sport changes, reset to today
  useEffect(() => {
    setSelectedDate(todayKey);
  }, [activeSport, todayKey]);

  const isToday = selectedDate === todayKey;
  const { groups, liveCount, isConnected, updatedAt } = useScoresStream(activeSport, selectedDate);
  const isLoading = groups.length === 0 && !updatedAt;

  const totalMatches = groups.reduce((acc, g) => acc + g.matches.length, 0);

  return (
    <>

      {/* Calendar */}
      <CalendarStrip selected={selectedDate} onSelect={setSelectedDate} />

      {/* Live counter */}
      <div className={styles.liveCounter}>
        <span className="sec-head live-pill">
          {activeSportConfig.icon}{" "}
          {isLoading ? t("liveScores.loading") : isToday ? `${formatNumber(liveCount, locale)} ${t("liveScores.liveNow")}` : `${formatNumber(totalMatches, locale)} ${t("liveScores.matchCount")}`}
        </span>
        <span style={{ fontSize: 11, color: isConnected ? "var(--teal)" : "var(--text-mute)", fontFamily: "var(--mono)" }}>
          {isConnected ? t("liveScores.connected") : t("liveScores.connecting")}
        </span>
        {!isLoading && <span className={styles.totalCount}>{formatNumber(totalMatches, locale)} {t("liveScores.total")}</span>}
      </div>

      {/* Skeletons */}
      {isLoading && (
        <div className="stack-sm">
          {[1, 2].map((i) => (
            <div key={i} className={styles.leagueGroup}>
              <div className={styles.leagueHead}>
                <div className="skeleton-row" style={{ width: 40 }} />
                <div className="skeleton-row" style={{ width: 160, marginInlineStart: 8 }} />
              </div>
              {[1, 2, 3].map((j) => (
                <div key={j} className="skeleton-row" style={{ margin: "8px 16px", borderRadius: 6 }} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* League groups */}
      {!isLoading && (
        <div className="stack-sm">
          {groups.length === 0 && (
            <p style={{ color: "var(--text-mute)", textAlign: "center", padding: "40px 0", fontFamily: "var(--mono)", fontSize: 13 }}>
              {activeSportConfig.icon} {t("liveScores.noMatchesOnDate").replace("{sport}", t("sport." + activeSport, activeSportConfig.label))}
            </p>
          )}
          {groups.map((league, idx) => (
            <div key={league.leagueId}>
              {idx === 1 && <AdSlot size="banner" label={t("common.sponsored")} />}
              <div className={styles.leagueGroup}>
                <div className={styles.leagueHead}>
                  <span className="country-code">{translateLeagueName(league.leagueShortName, locale)}</span>
                  <span className={styles.leagueName}>{translateLeagueName(league.leagueName, locale)}</span>
                  <span className={styles.leagueCount}>{formatNumber(league.matches.length, locale)} {t("liveScores.matchCount")}</span>
                </div>
                <div className={styles.matchList}>
                  {league.matches.map((m) => <MatchRow key={m.id} m={m} />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
