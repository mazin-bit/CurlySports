'use client';
import React, { useState, useEffect } from 'react';
import { useSingleStandings } from '@/hooks/useStandings';
import { useBracket } from '@/hooks/useBracket';
import type { BracketRound } from '@/hooks/useBracket';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Chip from './ui/Chip';
import TeamCrest from './ui/TeamCrest';
import Icon from './ui/Icon';
import SportSelector from './ui/SportSelector';
import { SkeletonTableRow, SkeletonList } from './ui/Skeletons';

const LEAGUES: { id: string; label: string; sport: string; group?: string }[] = [
  // Football — International (first!)
  { id: 'fifa.world',     label: 'FIFA World Cup',     sport: 'football', group: 'International' },
  { id: 'uefa.euro',      label: 'UEFA Euro',          sport: 'football', group: 'International' },
  { id: 'conmebol.america', label: 'Copa America',     sport: 'football', group: 'International' },
  { id: 'caf.nations',    label: 'AFCON',              sport: 'football', group: 'International' },
  { id: 'concacaf.gold',  label: 'Gold Cup',           sport: 'football', group: 'International' },
  // Football — Club Cups
  { id: 'uefa.champions', label: 'Champions League',   sport: 'football', group: 'Club Cups' },
  { id: 'uefa.europa',    label: 'Europa League',      sport: 'football', group: 'Club Cups' },
  { id: 'uefa.europa_conf', label: 'Conference League', sport: 'football', group: 'Club Cups' },
  // Football — Top Leagues
  { id: 'eng.1',          label: 'Premier League',     sport: 'football', group: 'Top Leagues' },
  { id: 'esp.1',          label: 'La Liga',            sport: 'football', group: 'Top Leagues' },
  { id: 'ger.1',          label: 'Bundesliga',         sport: 'football', group: 'Top Leagues' },
  { id: 'ita.1',          label: 'Serie A',            sport: 'football', group: 'Top Leagues' },
  { id: 'fra.1',          label: 'Ligue 1',            sport: 'football', group: 'Top Leagues' },
  { id: 'por.1',          label: 'Primeira Liga',      sport: 'football', group: 'Top Leagues' },
  { id: 'ned.1',          label: 'Eredivisie',         sport: 'football', group: 'Top Leagues' },
  { id: 'tur.1',          label: 'Süper Lig',          sport: 'football', group: 'Top Leagues' },
  { id: 'sco.1',          label: 'Scottish Prem',      sport: 'football', group: 'Top Leagues' },
  { id: 'eng.2',          label: 'Championship',       sport: 'football', group: 'Top Leagues' },
  // Football — Americas
  { id: 'usa.1',          label: 'MLS',                sport: 'football', group: 'Americas' },
  { id: 'mex.1',          label: 'Liga MX',            sport: 'football', group: 'Americas' },
  { id: 'bra.1',          label: 'Brasileirão',        sport: 'football', group: 'Americas' },
  { id: 'arg.1',          label: 'Liga Profesional',   sport: 'football', group: 'Americas' },
  // Cricket — ICC Events first
  { id: 'icc.t20wc',      label: 'T20 World Cup',     sport: 'cricket', group: 'ICC Events' },
  { id: 'icc.champions',  label: 'Champions Trophy',  sport: 'cricket', group: 'ICC Events' },
  // Cricket — T20 Leagues
  { id: 'ipl',            label: 'IPL',                sport: 'cricket', group: 'T20 Leagues' },
  { id: 'psl',            label: 'PSL',                sport: 'cricket', group: 'T20 Leagues' },
  { id: 'big.bash',       label: 'Big Bash',           sport: 'cricket', group: 'T20 Leagues' },
  { id: 'sa.domestic',    label: 'SA20',               sport: 'cricket', group: 'T20 Leagues' },
  { id: 'cplt20',         label: 'CPL',                sport: 'cricket', group: 'T20 Leagues' },
  // Basketball
  { id: 'nba',            label: 'NBA',                sport: 'basketball', group: 'NBA & WNBA' },
  { id: 'wnba',           label: 'WNBA',              sport: 'basketball', group: 'NBA & WNBA' },
  // F1
  { id: 'f1',             label: 'Formula 1',          sport: 'f1', group: 'Motorsport' },
];

// Sport categories for the pill selector
const SPORT_CATEGORIES = [
  { slug: 'football', label: 'Football', color: '#c8ff3d' },
  { slug: 'cricket', label: 'Cricket', color: '#ff8c42' },
  { slug: 'basketball', label: 'Basketball', color: '#ff5b3d' },
  { slug: 'f1', label: 'F1', color: '#ff5d9e' },
];

const SEASONS = ['2026', '2025', '2024', '2023'];
const DEFAULT_SEASON = String(new Date().getFullYear());

interface LeaguesProps {
  sport: string;
  setSport: (s: string) => void;
  onSearch: () => void;
  onBell: () => void;
  onOpenPlayer: (playerId?: string, leagueId?: string) => void;
  unread: number;
}

export default function LeaguesScreen({ sport, setSport, onSearch, onBell, onOpenPlayer, unread }: LeaguesProps) {
  const [leagueIdx, setLeagueIdx] = useState(0);
  const [season, setSeason] = useState<string>(DEFAULT_SEASON);
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'bracket'>('table');

  // Filter leagues by sport
  const filteredLeagues = LEAGUES.filter(l => l.sport === sport);

  // Auto-jump to the first league matching the selected sport
  useEffect(() => {
    setLeagueIdx(0);
  }, [sport]);

  // Reset to table tab when league changes
  useEffect(() => { setActiveTab('table'); }, [leagueIdx]);

  const selected = filteredLeagues[leagueIdx] ?? filteredLeagues[0];

  const { standings, isLoading } = useSingleStandings(selected?.id ?? null, season);
  const table = standings?.entries ?? [];
  const { rounds, isLoading: bracketLoading } = useBracket(selected?.id ?? null, season);
  const hasBracket = rounds.length > 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar
        title="Leagues"
        subtitle={selected.label}
        logoSrc="/curly-guy.png"
        onSearch={onSearch}
        onBell={onBell}
        hasNotification={unread > 0}
      />
      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Sport category selector */}
        <SportSelector active={sport} onSelect={setSport} />

        {/* League chips — filtered by sport */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {filteredLeagues.map((l, i) => (
            <Chip key={l.id} active={leagueIdx === i} onClick={() => setLeagueIdx(i)} style={{ flexShrink: 0 }}>{l.label}</Chip>
          ))}
        </div>

        {/* Season selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Season</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {SEASONS.map(s => (
              <button
                key={s}
                onClick={() => setSeason(s)}
                style={{ padding: '4px 10px', borderRadius: 6, border: `1.5px solid ${season === s ? 'var(--ink)' : 'var(--border-2)'}`, background: season === s ? 'var(--ink)' : 'transparent', color: season === s ? 'var(--accent)' : 'var(--text-mute)', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
              >{s}</button>
            ))}
          </div>
        </div>

        {/* Table / Bracket tab switcher */}
        {hasBracket && (
          <div style={{ display: 'flex', gap: 6, background: 'var(--surface-2)', border: '2px solid var(--ink)', borderRadius: 12, padding: 4, boxShadow: 'var(--shadow-sm)' }}>
            <button onClick={() => setActiveTab('table')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: activeTab === 'table' ? 'var(--ink)' : 'transparent', color: activeTab === 'table' ? 'var(--accent)' : 'var(--text-mute)' }}>Table</button>
            <button onClick={() => setActiveTab('bracket')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: activeTab === 'bracket' ? 'var(--ink)' : 'transparent', color: activeTab === 'bracket' ? 'var(--accent)' : 'var(--text-mute)' }}>Bracket</button>
          </div>
        )}

        {/* Bracket view */}
        {activeTab === 'bracket' && hasBracket && (
          bracketLoading ? (
            <Card subtitle="Knockout" title={selected.label}>
              <SkeletonList count={4}>{i => <SkeletonTableRow style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
            </Card>
          ) : (
            rounds.map((round: BracketRound) => (
              <Card key={round.name} subtitle="Knockout" title={round.shortName || round.name}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {round.matches.map(m => (
                    <div key={m.id} style={{ background: 'var(--surface-2)', borderRadius: 10, border: '1.5px solid var(--border-2)', overflow: 'hidden' }}>
                      {/* Home team row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: '1px solid var(--border-3)' }}>
                        <TeamCrest code={m.home.shortName?.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4) ?? 'home'} abbr={m.home.shortName?.slice(0, 3).toUpperCase() ?? 'HOM'} logoUrl={m.home.logo} />
                        <span style={{ flex: 1, fontWeight: m.home.winner ? 700 : 500, fontSize: 13, color: m.home.winner ? 'var(--ink)' : 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.home.name}</span>
                        {m.home.score !== null && <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: m.home.winner ? 'var(--orange)' : 'var(--ink)', minWidth: 20, textAlign: 'center' }}>{m.home.score}</span>}
                      </div>
                      {/* Away team row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px' }}>
                        <TeamCrest code={m.away.shortName?.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4) ?? 'away'} abbr={m.away.shortName?.slice(0, 3).toUpperCase() ?? 'AWY'} logoUrl={m.away.logo} />
                        <span style={{ flex: 1, fontWeight: m.away.winner ? 700 : 500, fontSize: 13, color: m.away.winner ? 'var(--ink)' : 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.away.name}</span>
                        {m.away.score !== null && <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: m.away.winner ? 'var(--orange)' : 'var(--ink)', minWidth: 20, textAlign: 'center' }}>{m.away.score}</span>}
                      </div>
                      {/* Match meta */}
                      {(m.statusDisplay || m.leg) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 7px', borderTop: '1px solid var(--border-3)' }}>
                          {m.leg && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)', background: 'var(--surface-3)', border: '1px solid var(--border-2)', borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Leg {m.leg}</span>}
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)' }}>{m.statusDisplay}</span>
                          {m.home.aggScore !== null && m.home.aggScore !== undefined && (
                            <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--orange)', fontWeight: 700 }}>Agg: {m.home.aggScore}–{m.away.aggScore}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )
        )}

        {/* Table view */}
        {activeTab === 'table' && (() => {
          const groups = standings?.groups;
          const hasGroups = standings?.hasGroups && groups && groups.length > 0;

          const TableHeader = () => (
            <div style={{ display: 'flex', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0 8px', borderBottom: '1px solid var(--border-3)' }}>
              <span style={{ width: 20 }}>#</span>
              <span style={{ flex: 1 }}>Club</span>
              <span style={{ width: 78, textAlign: 'center' }}>Form</span>
              <span style={{ width: 30, textAlign: 'center' }}>GD</span>
              <span style={{ width: 28, textAlign: 'right' }}>Pts</span>
            </div>
          );

          const TeamRow = ({ entry }: { entry: typeof table[0] }) => {
            const total = Math.min(entry.wins + entry.draws + entry.losses, 5);
            const formArr: string[] = [];
            let w = Math.min(entry.wins, total), d = Math.min(entry.draws, total - w), l = total - w - d;
            for (let i = 0; i < 5; i++) {
              if (w > 0) { formArr.push('W'); w--; }
              else if (d > 0) { formArr.push('D'); d--; }
              else if (l > 0) { formArr.push('L'); l--; }
              else formArr.push('D');
            }
            return (
              <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-3)' }}>
                <span style={{ width: 20, fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12, color: entry.rank <= 4 ? 'var(--orange)' : 'var(--text-mute)' }}>{entry.rank}</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <TeamCrest code={entry.teamAbbr.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4)} abbr={entry.teamAbbr.slice(0, 3).toUpperCase()} logoUrl={entry.teamLogo} />
                  <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.teamName}</span>
                </div>
                <div style={{ width: 78, display: 'flex', gap: 3, justifyContent: 'center' }}>
                  {formArr.map((r, i) => (
                    <span key={i} style={{ width: 12, height: 12, borderRadius: 3, fontSize: 0, background: r === 'W' ? 'var(--accent)' : r === 'D' ? 'var(--surface-3)' : 'var(--coral)', border: '1px solid var(--ink)' }}>{r}</span>
                  ))}
                </div>
                <span style={{ width: 30, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>{entry.goalDiff > 0 ? '+' : ''}{entry.goalDiff}</span>
                <span style={{ width: 28, textAlign: 'right', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{entry.points}</span>
              </div>
            );
          };

          const FormLegend = () => (
            <div style={{ display: 'flex', gap: 14, marginTop: 12, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--accent)', border: '1px solid var(--ink)', display: 'inline-block' }} /> Win</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--surface-3)', border: '1px solid var(--ink)', display: 'inline-block' }} /> Draw</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--coral)', border: '1px solid var(--ink)', display: 'inline-block' }} /> Loss</span>
            </div>
          );

          if (hasGroups) {
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {groups.map(g => (
                  <Card key={g.groupName} subtitle="Standings" title={g.groupName}>
                    <TableHeader />
                    {g.entries.map(entry => <TeamRow key={entry.teamId} entry={entry} />)}
                    <FormLegend />
                  </Card>
                ))}
              </div>
            );
          }

          return (
            <Card subtitle="Standings" title={selected.label}>
              <TableHeader />
              {isLoading && (
                <SkeletonList count={8}>{i => <SkeletonTableRow style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
              )}
              {!isLoading && table.length > 0 && table.map(entry => <TeamRow key={entry.teamId} entry={entry} />)}
              {!isLoading && table.length === 0 && (
                <div style={{ padding: '24px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>
                  No standings data available
                </div>
              )}
              <FormLegend />
            </Card>
          );
        })()}
      </div>
    </div>
  );
}
