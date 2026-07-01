"use client";

import AppShell from "@/components/AppShell";
import { useState } from "react";
import styles from "./leagues.module.css";
import {
  Trophy, ChevronDown, ChevronUp, Layers, GitBranch, Info, Globe
} from "lucide-react";
import { useSingleStandings } from "@/hooks/useStandings";
import { useBracket } from "@/hooks/useBracket";
import { useActiveSport, SPORT_CONFIGS } from "@/contexts/SportContext";
import type { StandingEntry, LeagueStandings } from "@/hooks/useStandings";
import type { BracketRound, BracketMatch } from "@/hooks/useBracket";
import { LEAGUE_META } from "@curly/shared";

// ─── Flag / region icon renderer ──────────────────────────────────────────────

function LeagueFlag({ flag, size = 24 }: { flag: string; size?: number }) {
  if (flag === "cup") {
    return <Trophy size={size} style={{ color: "#f5c518", flexShrink: 0 }} />;
  }
  if (flag === "intl") {
    return <Globe size={size} style={{ color: "var(--text-mute)", flexShrink: 0 }} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${flag}.png`}
      alt={flag}
      width={size}
      height={Math.round(size * 0.67)}
      style={{ borderRadius: 3, objectFit: "cover", display: "block", flexShrink: 0 }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

// Cup competitions that have a knockout bracket
const CUP_LEAGUES = new Set([
  "uefa.champions", "uefa.europa", "uefa.europa_conf",
  "fifa.world", "uefa.euro", "conmebol.america",
  "caf.nations", "concacaf.gold", "concacaf.nations",
  "afc.cup", "conmebol.libertadores", "conmebol.sudamericana",
  "concacaf.champions",
  // Cricket ICC tournaments
  "icc.t20wc", "icc.wc", "icc.champions",
]);

// Competitions with multi-group format
const GROUP_STAGE_LEAGUES = new Set([
  "fifa.world", "uefa.euro", "conmebol.america", "caf.nations",
  "concacaf.gold", "concacaf.nations", "afc.cup",
  "conmebol.libertadores", "conmebol.sudamericana", "concacaf.champions",
  "uefa.nations",
  // Basketball — NBA has Eastern/Western Conference groups, NFL has divisions
  "nba", "wnba",
  // Cricket — ICC events have genuine group stages (A/B/C/D etc.)
  // T20 domestic leagues (IPL, PSL etc) use single-table league format — NOT listed here
  "icc.t20wc", "icc.wc", "icc.champions", "icc.wtc",
]);

// ─── League groups per sport ───────────────────────────────────────────────────

const LEAGUE_GROUPS: Record<string, { title: string; ids: string[] }[]> = {
  football: [
    {
      title: "International",
      ids: ["fifa.world","uefa.euro","conmebol.america","caf.nations","concacaf.gold","afc.cup","concacaf.nations","uefa.nations"],
    },
    {
      title: "Club Cups",
      ids: ["uefa.champions","uefa.europa","uefa.europa_conf","conmebol.libertadores","conmebol.sudamericana","concacaf.champions"],
    },
    {
      title: "Top Leagues",
      ids: ["eng.1","esp.1","ger.1","ita.1","fra.1","por.1","ned.1","tur.1","sco.1","bel.1","eng.2"],
    },
    {
      title: "Americas",
      ids: ["usa.1","mex.1","bra.1","arg.1","col.1","chi.1","ecu.1"],
    },
    {
      title: "Asia & Rest",
      ids: ["jpn.1","ksa.1","aus.1","chn.1","idn.1","rus.1","gre.1"],
    },
  ],
  cricket: [
    { title: "ICC Events",   ids: ["icc.t20wc", "icc.champions"] },
    { title: "T20 Leagues",  ids: ["ipl", "psl", "big.bash", "sa.domestic", "cplt20"] },
  ],
  basketball: [
    { title: "NBA & WNBA", ids: ["nba", "wnba"] },
    { title: "College", ids: ["ncaab", "ncaaw"] },
  ],
  f1:         [{ title: "Motorsport", ids: ["f1"] }],
  nfl:        [{ title: "American Football", ids: ["nfl"] }],
  tennis:     [{ title: "Tennis", ids: ["atp.1","wta.1"] }],
  baseball:   [{ title: "Baseball", ids: ["mlb"] }],
  hockey:     [{ title: "Hockey", ids: ["nhl"] }],
  mma:        [{ title: "MMA", ids: ["ufc"] }],
  golf:       [{ title: "Golf", ids: ["pga"] }],
};

// ─── Season selector ───────────────────────────────────────────────────────────

// Dynamic seasons: current year + 5 years back (so 2027 appears automatically when 2027 starts)
function buildSeasons(): string[] {
  const currentYear = new Date().getFullYear();
  const seasons: string[] = [];
  for (let y = currentYear; y >= currentYear - 5; y--) {
    seasons.push(String(y));
  }
  return seasons;
}
const SEASONS = buildSeasons();

function SeasonSelector({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <div className={styles.seasonWrap}>
      <label className={styles.seasonLabel}>Season</label>
      <div className={styles.seasonSelectWrap}>
        <select
          className={styles.seasonSelect}
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          {SEASONS.map(s => (
            <option key={s} value={s}>{s}/{String(parseInt(s) + 1).slice(2)}</option>
          ))}
        </select>
        <ChevronDown size={13} className={styles.seasonCaret} />
      </div>
    </div>
  );
}

// ─── League card ───────────────────────────────────────────────────────────────

function LeagueCard({
  leagueId, isSelected, onSelect
}: {
  leagueId: string; isSelected: boolean; onSelect: () => void;
}) {
  const meta = LEAGUE_META[leagueId];
  if (!meta) return null;

  const isCup = CUP_LEAGUES.has(leagueId);
  const isGroup = GROUP_STAGE_LEAGUES.has(leagueId);

  return (
    <button
      className={`${styles.leagueCard} ${isSelected ? styles.leagueCardActive : ""}`}
      onClick={onSelect}
      title={`${meta.name} · ${meta.country}`}
    >
      <div
        className={styles.cardIconWrap}
        style={{ background: meta.color + "22", border: `1.5px solid ${meta.color}40` }}
      >
        <LeagueFlag flag={meta.flag} size={22} />
      </div>
      <span className={styles.cardName}>{meta.name}</span>
      <span className={styles.cardSub}>{meta.country}</span>
      {(isCup || isGroup) && (
        <span className={styles.cardBadge} style={{ background: meta.color + "33", color: meta.color }}>
          {isGroup ? "GROUPS" : "CUP"}
        </span>
      )}
    </button>
  );
}

// ─── Table components ──────────────────────────────────────────────────────────

function TableHeader({ isFootball, hasCricketNRR }: { isFootball: boolean; hasCricketNRR: boolean }) {
  return (
    <div className={styles.tableHeaderRow}>
      <span className={styles.colRank}>#</span>
      <span className={styles.colTeam}>Team</span>
      <span className={styles.colStat}>P</span>
      <span className={styles.colStat}>W</span>
      {isFootball && <span className={`${styles.colStat} ${styles.hideMobile}`}>D</span>}
      <span className={`${styles.colStat} ${styles.hideMobile}`}>L</span>
      {isFootball && <span className={`${styles.colStat} ${styles.hideSm}`}>GD</span>}
      {hasCricketNRR && <span className={`${styles.colStat} ${styles.hideMobile}`}>NRR</span>}
      <span className={`${styles.colStat} ${styles.accentCol}`}>Pts</span>
    </div>
  );
}

function TableRow({ row, idx, isFootball, hasCricketNRR }: { row: StandingEntry; idx: number; isFootball: boolean; hasCricketNRR: boolean }) {
  const nrr = row.netRunRate;
  const nrrColor = nrr != null && nrr > 0 ? "var(--teal)" : nrr != null && nrr < 0 ? "var(--coral)" : undefined;
  return (
    <div className={`${styles.tableRow}${idx < 4 ? " " + styles.topZone : ""}`}>
      <span className={styles.colRank} style={{ color: idx < 4 ? "var(--orange)" : "var(--text-mute)" }}>
        {row.rank || idx + 1}
      </span>
      <div className={styles.colTeam}>
        {row.teamLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.teamLogo} alt={row.teamAbbr} width={20} height={20}
            style={{ objectFit: "contain", flexShrink: 0 }} />
        ) : (
          <div className="crest" style={{ width: 20, height: 20, fontSize: 7 }}>
            {row.teamAbbr.slice(0, 3)}
          </div>
        )}
        <span className={styles.teamNameCell}>{row.teamName}</span>
        {row.note === "Q" && <span className={styles.qualBadge}>Q</span>}
      </div>
      <span className={styles.colStat}>{row.gamesPlayed}</span>
      <span className={styles.colStat}>{row.wins}</span>
      {isFootball && <span className={`${styles.colStat} ${styles.hideMobile}`}>{row.draws}</span>}
      <span className={`${styles.colStat} ${styles.hideMobile}`}>{row.losses}</span>
      {isFootball && (
        <span
          className={`${styles.colStat} ${styles.hideSm}`}
          style={{ color: row.goalDiff > 0 ? "var(--teal)" : row.goalDiff < 0 ? "var(--coral)" : undefined }}
        >
          {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
        </span>
      )}
      {hasCricketNRR && (
        <span className={`${styles.colStat} ${styles.hideMobile}`} style={{ color: nrrColor, fontVariantNumeric: "tabular-nums" }}>
          {nrr != null ? (nrr >= 0 ? `+${nrr.toFixed(3)}` : nrr.toFixed(3)) : "–"}
        </span>
      )}
      <span className={`${styles.colStat} ${styles.accentCol}`} style={{ fontWeight: 700, color: "var(--ink)" }}>
        {row.points}
      </span>
    </div>
  );
}

function SingleTable({ standings, expanded, onToggle }: {
  standings: LeagueStandings; expanded: boolean; onToggle: () => void;
}) {
  const hasCricketNRR = standings.entries.some(e => typeof e.netRunRate === "number");
  const isFootball = !hasCricketNRR && standings.entries.some(e => e.draws > 0);
  const displayRows = expanded ? standings.entries : standings.entries.slice(0, 8);
  return (
    <div className={styles.standingsTable}>
      <TableHeader isFootball={isFootball} hasCricketNRR={hasCricketNRR} />
      {displayRows.map((row, idx) => (
        <TableRow key={row.teamId || idx} row={row} idx={idx} isFootball={isFootball} hasCricketNRR={hasCricketNRR} />
      ))}
      {standings.entries.length > 8 && (
        <button className={styles.showMoreBtn} onClick={onToggle}>
          {expanded
            ? <><ChevronUp size={14} /> Show less</>
            : <><ChevronDown size={14} /> Show all {standings.entries.length} teams</>}
        </button>
      )}
    </div>
  );
}

function GroupsGrid({ standings }: { standings: LeagueStandings }) {
  const hasCricketNRR = standings.entries.some(e => typeof e.netRunRate === "number");
  const isFootball = !hasCricketNRR && standings.entries.some(e => e.draws > 0);
  const groups = standings.groups ?? [];
  return (
    <div className={styles.groupsGrid}>
      {groups.map(g => (
        <div key={g.groupName} className={styles.groupCard}>
          <div className={styles.groupTitle}>{g.groupName}</div>
          <TableHeader isFootball={isFootball} hasCricketNRR={hasCricketNRR} />
          {g.entries.map((row, idx) => (
            <TableRow key={row.teamId || idx} row={row} idx={idx} isFootball={isFootball} hasCricketNRR={hasCricketNRR} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Knockout bracket components ───────────────────────────────────────────────

function KnockoutMatchCard({ match }: { match: BracketMatch }) {
  const isFinished = match.status.includes("FINAL") || match.status.includes("STATUS_FULL_TIME") || match.status.includes("FT");
  const isLive = match.status.includes("IN_PROGRESS") || match.status.includes("HALFTIME");
  const hasScore = match.home.score !== null && match.away.score !== null;
  const homeWin = match.home.winner;
  const awayWin = match.away.winner;
  const isPlaceholder = match.isPlaceholder;

  const dateStr = !isFinished && !isLive && !isPlaceholder
    ? new Date(match.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : null;

  return (
    <div className={`${styles.knockoutCard} ${isLive ? styles.knockoutCardLive : ""} ${isPlaceholder ? styles.knockoutCardPh : ""}`}>
      {isLive && <div className={styles.liveIndicator}>LIVE</div>}
      {dateStr && <div className={styles.matchDate}>{dateStr}</div>}
      {isPlaceholder && <div className={styles.phLabel}>TBD</div>}

      {/* Home team */}
      <div className={`${styles.knockoutTeam} ${homeWin ? styles.knockoutWinner : ""} ${awayWin && isFinished ? styles.knockoutLoser : ""}`}>
        <div className={styles.knockoutTeamInfo}>
          {match.home.logo && !match.home.isPlaceholder ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={match.home.logo} alt={match.home.shortName} className={styles.knockoutLogo} />
          ) : (
            <div className={styles.knockoutLogoPh}>?</div>
          )}
          <span className={`${styles.knockoutTeamName} ${match.home.isPlaceholder ? styles.knockoutTeamPh : ""}`}>
            {match.home.name}
          </span>
        </div>
        <span className={`${styles.knockoutScore} ${homeWin ? styles.knockoutScoreWin : ""}`}>
          {hasScore ? match.home.score : "–"}
        </span>
      </div>

      {/* Away team */}
      <div className={`${styles.knockoutTeam} ${awayWin ? styles.knockoutWinner : ""} ${homeWin && isFinished ? styles.knockoutLoser : ""}`}>
        <div className={styles.knockoutTeamInfo}>
          {match.away.logo && !match.away.isPlaceholder ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={match.away.logo} alt={match.away.shortName} className={styles.knockoutLogo} />
          ) : (
            <div className={styles.knockoutLogoPh}>?</div>
          )}
          <span className={`${styles.knockoutTeamName} ${match.away.isPlaceholder ? styles.knockoutTeamPh : ""}`}>
            {match.away.name}
          </span>
        </div>
        <span className={`${styles.knockoutScore} ${awayWin ? styles.knockoutScoreWin : ""}`}>
          {hasScore ? match.away.score : "–"}
        </span>
      </div>

      {(match.home.aggScore !== null && match.home.aggScore !== undefined) && (
        <div className={styles.aggRow}>
          Agg: {match.home.aggScore} – {match.away.aggScore}
        </div>
      )}
      {match.leg != null && (
        <div className={styles.legBadge}>{match.leg === 1 ? "1st Leg" : "2nd Leg"}</div>
      )}
    </div>
  );
}

function KnockoutBracket({ rounds, isLoading }: { rounds: BracketRound[]; isLoading: boolean }) {
  const [activeRound, setActiveRound] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className={styles.bracketSkeleton}>
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton-row" style={{ height: 180, borderRadius: 8 }} />
        ))}
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className={styles.bracketEmpty}>
        Knockout bracket not yet available for this competition.
      </div>
    );
  }

  const hasPlaceholder = rounds.some(r => r.isPlaceholder);
  const displayed = activeRound ? rounds.filter(r => r.name === activeRound) : rounds;

  return (
    <div className={styles.bracketWrap}>
      {hasPlaceholder && (
        <div className={styles.phBanner}>
          <Info size={13} />
          These are projected matchups based on group pairings. Teams update once the knockout stage is drawn.
        </div>
      )}
      <div className={styles.roundTabs}>
        <button
          className={`${styles.roundTab} ${!activeRound ? styles.roundTabActive : ""}`}
          onClick={() => setActiveRound(null)}
        >
          All
        </button>
        {rounds.map(r => (
          <button
            key={r.name}
            className={`${styles.roundTab} ${activeRound === r.name ? styles.roundTabActive : ""}`}
            onClick={() => setActiveRound(r.name)}
          >
            {r.shortName}
          </button>
        ))}
      </div>

      {displayed.map(round => (
        <div key={round.name} className={styles.roundSection}>
          <div className={styles.roundHeader}>
            <span className={styles.roundName}>{round.name}</span>
            <span className={styles.roundCount}>
              {round.matches.length} match{round.matches.length !== 1 ? "es" : ""}
              {round.isPlaceholder && " · projected"}
            </span>
          </div>
          <div className={styles.roundMatches}>
            {round.matches.map(m => (
              <KnockoutMatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Competition detail panel ──────────────────────────────────────────────────

function CompetitionDetail({ leagueId, season }: { leagueId: string; season: string }) {
  const meta = LEAGUE_META[leagueId];
  const isCup = CUP_LEAGUES.has(leagueId);
  const isGroupComp = GROUP_STAGE_LEAGUES.has(leagueId);

  const { standings, isLoading } = useSingleStandings(leagueId, season);
  const hasGroups = standings?.hasGroups && (standings.groups?.length ?? 0) > 0;
  const hasTable = !hasGroups && (standings?.entries?.length ?? 0) > 0;

  const defaultTab = isGroupComp ? "groups" : isCup ? "bracket" : "table";
  const [activeTab, setActiveTab] = useState<"table" | "groups" | "bracket">(defaultTab);
  const [tableExpanded, setTableExpanded] = useState(false);

  const { rounds, isLoading: bracketLoading } = useBracket(
    activeTab === "bracket" ? leagueId : null,
    season
  );

  const borderColor = meta?.color ?? "var(--accent)";
  const displayName = standings?.leagueName ?? meta?.name ?? leagueId;
  const displaySeason = standings?.season ?? season;
  const logo = standings?.leagueLogo;

  return (
    <div className={styles.detailPanel} style={{ "--detail-color": borderColor } as React.CSSProperties}>
      {/* Header */}
      <div className={styles.detailHeader} style={{ borderLeft: `4px solid ${borderColor}` }}>
        <div className={styles.detailHeaderLeft}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={displayName} className={styles.detailLogo} />
          ) : (
            <div className={styles.detailIconWrap} style={{ background: borderColor + "22" }}>
              <LeagueFlag flag={meta?.flag ?? "cup"} size={24} />
            </div>
          )}
          <div>
            <h3 className={styles.detailName}>{displayName}</h3>
            <span className={styles.detailSub}>{meta?.country ?? "International"} · {displaySeason}</span>
          </div>
        </div>
        <div className={styles.detailMeta}>
          {hasGroups && standings?.groups && (
            <span className={styles.groupBadge}>{standings.groups.length} groups</span>
          )}
          {hasTable && (
            <span className={styles.teamCount}>{standings!.entries.length} teams</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      {(isCup || isGroupComp) && (
        <div className={styles.compTabs}>
          {isGroupComp && (
            <button
              className={`${styles.compTab} ${activeTab === "groups" ? styles.compTabActive : ""}`}
              onClick={() => setActiveTab("groups")}
            >
              <Layers size={12} /> Groups
            </button>
          )}
          {hasTable && (
            <button
              className={`${styles.compTab} ${activeTab === "table" ? styles.compTabActive : ""}`}
              onClick={() => setActiveTab("table")}
            >
              <Layers size={12} /> League Table
            </button>
          )}
          {isCup && (
            <button
              className={`${styles.compTab} ${activeTab === "bracket" ? styles.compTabActive : ""}`}
              onClick={() => setActiveTab("bracket")}
            >
              <GitBranch size={12} /> Knockout
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading && activeTab !== "bracket" ? (
        <div className={styles.detailLoading}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton-row" style={{ height: 44, borderRadius: 6, margin: "0 16px 6px" }} />
          ))}
        </div>
      ) : activeTab === "groups" && hasGroups ? (
        <GroupsGrid standings={standings!} />
      ) : activeTab === "bracket" ? (
        <KnockoutBracket rounds={rounds} isLoading={bracketLoading} />
      ) : standings ? (
        <SingleTable
          standings={standings}
          expanded={tableExpanded}
          onToggle={() => setTableExpanded(x => !x)}
        />
      ) : (
        <div className={styles.noData}>No standings data available for this season.</div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LeaguesPage() {
  const { activeSport, activeSportConfig, setActiveSport } = useActiveSport();
  const [season, setSeason] = useState(SEASONS[0]); // defaults to current year
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  const groups = LEAGUE_GROUPS[activeSport] ?? LEAGUE_GROUPS.football;

  const handleSelect = (id: string) => {
    setSelectedLeague(prev => (prev === id ? null : id));
  };

  const sportPills = SPORT_CONFIGS.filter(s => LEAGUE_GROUPS[s.slug] && !s.comingSoon);

  return (
    <AppShell active="leagues" title="Leagues" subtitle={`${activeSportConfig.label} standings`}>
      <div className="stack">
        {/* Sport selector pills — especially useful on mobile */}
        <div className={styles.sportPills}>
          {sportPills.map(s => (
            <button
              key={s.slug}
              className={`${styles.sportPill}${activeSport === s.slug ? " " + styles.sportPillActive : ""}`}
              onClick={() => { setActiveSport(s.slug); setSelectedLeague(null); }}
            >
              <span className={styles.pillIcon}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="sec-head">
          <div className="title">
            <Trophy size={17} className="title-icon" strokeWidth={2} />
            League <span className="accent">Standings</span>
          </div>
          <SeasonSelector
            value={season}
            onChange={s => { setSeason(s); setSelectedLeague(null); }}
          />
        </div>

        {/* Card grid */}
        <div className={styles.leagueGrid}>
          {groups.map(group => (
            <div key={group.title} className={styles.leagueGroupSection}>
              <div className={styles.leagueGroupTitle}>{group.title}</div>
              <div className={styles.cardsRow}>
                {group.ids.map(id => (
                  <LeagueCard
                    key={id}
                    leagueId={id}
                    isSelected={selectedLeague === id}
                    onSelect={() => handleSelect(id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selectedLeague ? (
          <CompetitionDetail
            key={`${selectedLeague}-${season}`}
            leagueId={selectedLeague}
            season={season}
          />
        ) : (
          <div className={styles.emptyPrompt}>
            <Trophy size={32} strokeWidth={1.5} style={{ color: "var(--text-mute)", marginBottom: 10 }} />
            <p>Select a competition above to view standings, groups, or knockout bracket</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
