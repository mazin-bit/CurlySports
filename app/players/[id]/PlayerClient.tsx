"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import AppShell from "@/components/AppShell";
import styles from "./player.module.css";
import {
  ArrowLeft, Shirt, MapPin, Cake, Ruler, Weight,
  Trophy, Star, Target, Shield, Activity, Timer,
  CircleDot, AlertTriangle, Swords, AlertCircle,
} from "lucide-react";
import type { PlayerDetail } from "@/app/api/espn/player/route";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate, localizeDigits } from "@/lib/locale-utils";
import { translateTeamName } from "@/lib/team-names";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// formatDOB is now handled inline using formatDate from locale-utils

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

// Map stat names to icons + translation keys
const STAT_ICONS: Record<string, React.ReactNode> = {
  goals:           <Target size={14} />,
  assists:         <Star size={14} />,
  saves:           <Shield size={14} />,
  cleanSheets:     <Shield size={14} />,
  appearances:     <Activity size={14} />,
  gamesPlayed:     <Activity size={14} />,
  minutesPlayed:   <Timer size={14} />,
  yellowCards:     <AlertTriangle size={14} />,
  redCards:        <Swords size={14} />,
  shots:           <CircleDot size={14} />,
  shotsOnTarget:   <Target size={14} />,
  points:          <Trophy size={14} />,
  rebounds:        <Activity size={14} />,
  touchdowns:      <Star size={14} />,
};

const STAT_LABEL_KEYS: Record<string, string> = {
  goals:         "sportStat.goals",
  assists:       "sportStat.assists",
  saves:         "sportStat.saves",
  cleanSheets:   "sportStat.cleanSheets",
  appearances:   "sportStat.appearances",
  gamesPlayed:   "sportStat.gamesPlayed",
  minutesPlayed: "sportStat.minutesPlayed",
  yellowCards:   "sportStat.yellowCards",
  redCards:      "sportStat.redCards",
  shots:         "sportStat.shots",
  shotsOnTarget: "sportStat.shotsOnTarget",
  points:        "sportStat.points",
  rebounds:      "sportStat.rebounds",
  touchdowns:    "sportStat.touchdowns",
};

function getStatMeta(stat: { name: string; displayName: string }, t: (key: string) => string) {
  const icon = STAT_ICONS[stat.name] ?? <Star size={14} />;
  const labelKey = STAT_LABEL_KEYS[stat.name];
  const label = labelKey ? t(labelKey) : stat.displayName;
  return { icon, label };
}

// Position-based accent colours
function posColor(posAbbr: string): string {
  const p = posAbbr?.toUpperCase();
  if (["GK", "G"].includes(p)) return "#f59e0b";
  if (["CB", "LB", "RB", "D", "DEF"].includes(p)) return "#3b82f6";
  if (["CM", "CAM", "CDM", "M", "MF", "MID"].includes(p)) return "#c8ff3d";
  if (["LW", "RW", "CF", "ST", "F", "FW", "ATT"].includes(p)) return "#ef4444";
  return "var(--accent)";
}

export default function PlayerClient() {
  const { t, locale } = useLanguage();
  const params = useParams();
  const searchParams = useSearchParams();
  const athleteId = params.id as string;
  const league = searchParams.get("league") ?? "eng.1";

  const { data: player, error, isLoading } = useSWR<PlayerDetail>(
    `/api/espn/player?id=${athleteId}&league=${league}`,
    fetcher,
    { refreshInterval: 0 }
  );

  if (isLoading) {
    return (
      <AppShell active="players" title={t("playerProfile.title")} subtitle={t("playerProfile.loading")}>
        <div className="stack-sm">
          <div className="skeleton-row" style={{ height: 200, borderRadius: 16 }} />
          <div className="skeleton-row" style={{ height: 120, borderRadius: 12 }} />
          <div className="skeleton-row" style={{ height: 200, borderRadius: 12 }} />
        </div>
      </AppShell>
    );
  }

  if (error || !player || (player as { error?: string }).error) {
    return (
      <AppShell active="players" title={t("playerProfile.title")} subtitle={t("playerProfile.notFound")}>
        <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-mute)" }}>
          <AlertCircle size={40} strokeWidth={1.5} style={{ marginBottom: 12, color: "var(--text-mute)" }} />
          <p>{t("playerProfile.notAvailable")}</p>
          <Link href="/players" className={styles.backBtn} style={{ display: "inline-flex", marginTop: 16 }}>
            <ArrowLeft size={14} /> {t("playerProfile.backToPlayers")}
          </Link>
        </div>
      </AppShell>
    );
  }

  const displayAge = player.age ?? calcAge(player.displayDOB);
  const accentColor = posColor(player.positionAbbr);
  const hasStats = player.stats.length > 0;
  const topStats = player.stats.slice(0, 8);

  return (
    <AppShell active="players" title={player.name} subtitle={`${player.position} · ${player.teamName}`}>
      <div className="stack-sm">

        {/* Back */}
        <Link href="/players" className={styles.backBtn}>
          <ArrowLeft size={14} /> {t("playerProfile.allPlayers")}
        </Link>

        {/* ── Hero Card ─────────────────────────────────── */}
        <div
          className={styles.heroCard}
          style={{ "--pos-color": accentColor } as React.CSSProperties}
        >
          {/* Team color accent bar */}
          <div
            className={styles.heroBand}
            style={{ background: player.teamColor ?? accentColor }}
          />

          {/* Content row */}
          <div className={styles.heroBody}>
            {/* Avatar */}
            <div className={styles.avatarWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={player.headshot ?? ""}
                alt={player.name}
                className={styles.avatarImg}
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = "none";
                  const fb = el.nextSibling as HTMLElement | null;
                  if (fb) fb.style.display = "flex";
                }}
              />
              <div className={styles.avatarFallback} style={{ display: player.headshot ? "none" : "flex" }}>
                {initials(player.name)}
              </div>
              {player.jersey && (
                <span className={styles.jerseyBadge} style={{ background: accentColor }}>
                  #{player.jersey}
                </span>
              )}
            </div>

            {/* Info */}
            <div className={styles.heroInfo}>
              <div className={styles.heroName}>{player.name}</div>
              <div className={styles.heroSubRow}>
                <span className={styles.posBadge} style={{ background: accentColor, color: "#07090b" }}>
                  {player.positionAbbr || player.position}
                </span>
                {player.teamName && (
                  <Link href={`/teams?highlight=${player.teamId}`} className={styles.teamLink}>
                    {player.teamLogo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={player.teamLogo} alt="" width={16} height={16}
                        style={{ objectFit: "contain" }} />
                    )}
                    {player.teamName}
                  </Link>
                )}
                <span className={styles.leaguePill}>{player.leagueName}</span>
              </div>

              {/* Quick facts */}
              <div className={styles.heroFacts}>
                {player.nationality && (
                  <span className={styles.fact}>
                    {player.flagUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={player.flagUrl} alt="" width={14} height={10}
                        style={{ objectFit: "cover", borderRadius: 1 }} />
                    )}
                    {player.nationality}
                  </span>
                )}
                {displayAge && <span className={styles.fact}><Cake size={11} /> {displayAge}y</span>}
                {player.height && <span className={styles.fact}><Ruler size={11} /> {player.height}</span>}
                {player.weight && <span className={styles.fact}><Weight size={11} /> {player.weight}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── Season Stats ──────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>
              <Activity size={13} style={{ marginInlineEnd: 5 }} />
              {t("playerProfile.seasonStats")}
            </span>
            {player.statsSeason && (
              <span className={styles.sectionSub}>{player.statsSeason}</span>
            )}
          </div>

          {hasStats ? (
            <div className={styles.statsGrid}>
              {topStats.map((s) => {
                const meta = getStatMeta(s, t);
                return (
                  <div key={s.name} className={styles.statCard}>
                    <span className={styles.statValue}>{localizeDigits(String(s.displayValue || s.value), locale)}</span>
                    <span className={styles.statIcon}>{meta.icon}</span>
                    <span className={styles.statLabel}>{meta.label || s.displayName}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyStats}>
              {t("playerProfile.noStatsAvailable")}
            </div>
          )}
        </div>

        {/* ── Profile ───────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>
              <Shield size={13} style={{ marginInlineEnd: 5 }} />
              {t("playerProfile.profile")}
            </span>
          </div>
          <div className={styles.profileGrid}>
            {player.position && (
              <ProfileRow icon={<Shirt size={13} />} label={t("playerProfile.position")} value={player.position} />
            )}
            {player.nationality && (
              <ProfileRow
                icon={player.flagUrl
                  ? <img src={player.flagUrl} alt="" width={14} height={10} style={{ objectFit: "cover", borderRadius: 1 }} />
                  : <MapPin size={13} />}
                label={t("playerProfile.nationality")}
                value={player.nationality}
              />
            )}
            {player.displayDOB && (
              <ProfileRow icon={<Cake size={13} />} label={t("playerProfile.dateOfBirth")} value={(() => {
                const d = new Date(player.displayDOB!);
                if (isNaN(d.getTime())) return player.displayDOB!;
                return formatDate(d, locale, { day: "numeric", month: "long", year: "numeric" });
              })()} />
            )}
            {displayAge && (
              <ProfileRow icon={<Cake size={13} />} label={t("playerProfile.age")} value={t("playerProfile.yearsOld").replace("{n}", localizeDigits(String(displayAge), locale))} />
            )}
            {player.height && (
              <ProfileRow icon={<Ruler size={13} />} label={t("playerProfile.height")} value={player.height} />
            )}
            {player.weight && (
              <ProfileRow icon={<Weight size={13} />} label={t("playerProfile.weight")} value={player.weight} />
            )}
            {player.jersey && (
              <ProfileRow icon={<Shirt size={13} />} label={t("playerProfile.jersey")} value={`#${localizeDigits(String(player.jersey), locale)}`} />
            )}
            {player.teamName && (
              <ProfileRow icon={<Trophy size={13} />} label={t("playerProfile.club")} value={translateTeamName(player.teamName, locale)} />
            )}
            {player.leagueName && (
              <ProfileRow icon={<Star size={13} />} label={t("playerProfile.league")} value={player.leagueName} />
            )}
          </div>
        </div>

      </div>
    </AppShell>
  );
}

function ProfileRow({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.profileRow}>
      <span className={styles.profileLabel}>
        <span className={styles.profileIcon}>{icon}</span>
        {label}
      </span>
      <span className={styles.profileValue}>{value}</span>
    </div>
  );
}
