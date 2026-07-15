"use client";

import AppShell from "@/components/AppShell";
import Link from "next/link";
import { useState } from "react";
import styles from "./teams.module.css";
import { Heart, Users } from "lucide-react";
import { useTeams } from "@/hooks/useTeams";
import { useActiveSport } from "@/contexts/SportContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { EspnTeamEntry } from "@/app/api/espn/teams/route";
import AdSlot from "@/components/AdSlot";

function TeamCard({ team }: { team: EspnTeamEntry }) {
  const { t } = useLanguage();
  const bg = team.color ?? "#1a2030";
  const [faved, setFaved] = useState(false);

  return (
    <Link href={`/teams/${team.id}?league=${team.leagueId}&sport=${team.sport}`} className={styles.teamCard}>
      <div className={styles.teamBanner} style={{ background: `linear-gradient(135deg, ${bg}cc, ${bg}55)` }}>
        {team.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={team.logo} alt={team.name} width={52} height={52} style={{ objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }} />
        ) : (
          <div className="crest" style={{ width: 52, height: 52, fontSize: 18 }}>{team.abbr.slice(0, 3)}</div>
        )}
        <button
          className={`${styles.favBtn}${faved ? " " + styles.faved : ""}`}
          aria-label={t("teams.toggleFavorite")}
          onClick={(e) => { e.preventDefault(); setFaved(!faved); }}
        >
          <Heart size={14} strokeWidth={2} fill={faved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className={styles.teamBody}>
        <h3 className={styles.teamName}>{team.shortName}</h3>
        <p className={styles.teamLeague}>{team.leagueName}</p>
        {team.record && <p className={styles.teamRecord}>{team.record}</p>}
      </div>
    </Link>
  );
}

export default function TeamsPage() {
  const { t } = useLanguage();
  const { activeSport, activeSportConfig } = useActiveSport();
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const { teams, isLoading } = useTeams(activeSport, selectedLeague ?? undefined);

  const leagues = Array.from(new Map(teams.map((t) => [t.leagueId, t.leagueName])).entries());

  return (
    <AppShell active="teams" title={t("teams.teamsAccent")} subtitle={`${activeSportConfig.label} ${t("teams.clubs")}`}>
      <div className="stack">
        {leagues.length > 1 && (
          <div className={styles.filterRow}>
            <button className={`chip${!selectedLeague ? " active" : ""}`} onClick={() => setSelectedLeague(null)}>
              {t("teams.allLeagues")}
            </button>
            {leagues.map(([id, name]) => (
              <button key={id} className={`chip${selectedLeague === id ? " active" : ""}`} onClick={() => setSelectedLeague(id)}>
                {name}
              </button>
            ))}
          </div>
        )}

        <AdSlot size="banner" />

        <div>
          <div className="sec-head">
            <div className="title">
              <Users size={17} className="title-icon" strokeWidth={2} />
              {activeSportConfig.icon} {t("teams.allTeams")} <span className="accent">{t("teams.teamsAccent")}</span>
            </div>
            <span className={styles.count}>{isLoading ? t("teams.loading") : `${teams.length} ${t("teams.clubs")}`}</span>
          </div>

          {isLoading ? (
            <div className={styles.teamsGrid}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="skeleton-row" style={{ height: 140, borderRadius: 12 }} />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-mute)", fontSize: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{activeSportConfig.icon}</div>
              {t("teams.noTeamsData").replace("{sport}", activeSportConfig.label)}
            </div>
          ) : (
            <div className={styles.teamsGrid}>
              {teams.map((t) => <TeamCard key={`${t.leagueId}-${t.id}`} team={t} />)}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
