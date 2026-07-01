'use client';
import React, { useState, useEffect } from 'react';
import type { Match } from '../data';
import { useScoresStream } from '@/hooks/useScoresStream';
import { useNews } from '@/hooks/useNews';
import { useStandings, useSingleStandings } from '@/hooks/useStandings';
import { useBracket } from '@/hooks/useBracket';
import type { BracketRound, BracketMatch } from '@/hooks/useBracket';
import type { StandingEntry, GroupStandings } from '@/hooks/useStandings';
import { normalizedToMobile } from './api';
import type { NormalizedMatch } from '@/lib/types';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Badge from './ui/Badge';
import MatchRow from './ui/MatchRow';
import SportSelector from './ui/SportSelector';
import AdSlot from './ui/AdSlot';
import Icon from './ui/Icon';
import { SkeletonScoreCard, SkeletonNewsCard, SkeletonTableRow, SkeletonList } from './ui/Skeletons';

interface DashboardProps {
  sport: string;
  setSport: (s: string) => void;
  onOpenMatch: (m: Match) => void;
  onOpenPlayer: (playerId?: string, leagueId?: string) => void;
  onSearch: () => void;
  onBell: () => void;
  fav?: { code: string; name: string; first: string } | null;
  unread: number;
}

const SPORT_LABELS: Record<string, string> = {
  football: 'Football', basketball: 'Basketball', nfl: 'NFL',
  tennis: 'Tennis', baseball: 'Baseball', f1: 'Formula 1', cricket: 'Cricket',
};

function MiniStandingsTable({ entries, leagueName }: { entries: StandingEntry[]; leagueName: string }) {
  const rows = entries.slice(0, 8);
  const isFootball = rows.some(e => e.draws > 0);
  return (
    <Card subtitle="Standings" title={leagueName} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0 8px', borderBottom: '1px solid var(--border-3)' }}>
        <span style={{ width: 20 }}>#</span>
        <span style={{ flex: 1 }}>Team</span>
        <span style={{ width: 22, textAlign: 'center' }}>P</span>
        <span style={{ width: 22, textAlign: 'center' }}>W</span>
        {isFootball && <span style={{ width: 22, textAlign: 'center' }}>D</span>}
        <span style={{ width: 22, textAlign: 'center' }}>L</span>
        {isFootball && <span style={{ width: 28, textAlign: 'center' }}>GD</span>}
        <span style={{ width: 28, textAlign: 'right', color: 'var(--orange)', fontWeight: 700 }}>Pts</span>
      </div>
      {rows.map((row, idx) => (
        <div key={row.teamId || idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: idx < rows.length - 1 ? '1px solid var(--border-3)' : 'none' }}>
          <span style={{ width: 20, fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, color: idx < 4 ? 'var(--orange)' : 'var(--text-mute)' }}>{row.rank || idx + 1}</span>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {row.teamLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={row.teamLogo} alt="" width={18} height={18} style={{ objectFit: 'contain', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--surface-3)', border: '1px solid var(--border-2)', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 7, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-mute)' }}>{row.teamAbbr.slice(0, 3)}</div>
            )}
            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.teamName}</span>
          </div>
          <span style={{ width: 22, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>{row.gamesPlayed}</span>
          <span style={{ width: 22, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>{row.wins}</span>
          {isFootball && <span style={{ width: 22, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>{row.draws}</span>}
          <span style={{ width: 22, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>{row.losses}</span>
          {isFootball && <span style={{ width: 28, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: row.goalDiff > 0 ? 'var(--teal)' : row.goalDiff < 0 ? 'var(--coral)' : 'var(--text-mute)' }}>{row.goalDiff > 0 ? '+' : ''}{row.goalDiff}</span>}
          <span style={{ width: 28, textAlign: 'right', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>{row.points}</span>
        </div>
      ))}
    </Card>
  );
}

/* ── World Cup Groups Grid (mobile) ─────────────────────────── */
function MobileWCGroupsGrid({ groups, leagueName }: { groups: GroupStandings[]; leagueName: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)', marginBottom: 12, letterSpacing: '-0.02em' }}>
        {leagueName} — Group Stage
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {groups.map(g => (
          <Card key={g.groupName} style={{ padding: 10 }}>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 10, letterSpacing: '0.08em', color: 'var(--orange)', textTransform: 'uppercase', marginBottom: 6 }}>{g.groupName}</div>
            <div style={{ display: 'flex', fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0 4px', borderBottom: '1px solid var(--border-3)' }}>
              <span style={{ flex: 1 }}>Team</span>
              <span style={{ width: 18, textAlign: 'center' }}>P</span>
              <span style={{ width: 18, textAlign: 'center' }}>W</span>
              <span style={{ width: 18, textAlign: 'center' }}>L</span>
              <span style={{ width: 22, textAlign: 'right', color: 'var(--orange)', fontWeight: 700 }}>Pts</span>
            </div>
            {g.entries.slice(0, 4).map((row, idx) => (
              <div key={row.teamId || idx} style={{ display: 'flex', alignItems: 'center', padding: '4px 0', borderBottom: idx < 3 ? '1px solid var(--border-3)' : 'none' }}>
                <span style={{ width: 14, fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 9, color: idx < 2 ? 'var(--orange)' : 'var(--text-mute)' }}>{row.rank || idx + 1}</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                  {row.teamLogo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={row.teamLogo} alt="" width={14} height={14} style={{ objectFit: 'contain', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: 6, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-mute)' }}>{row.teamAbbr.slice(0, 3)}</div>
                  )}
                  <span style={{ fontWeight: 600, fontSize: 10, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.teamAbbr}</span>
                </div>
                <span style={{ width: 18, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)' }}>{row.gamesPlayed}</span>
                <span style={{ width: 18, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)' }}>{row.wins}</span>
                <span style={{ width: 18, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)' }}>{row.losses}</span>
                <span style={{ width: 22, textAlign: 'right', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 11, color: 'var(--ink)' }}>{row.points}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Knockout Bracket (mobile) ─────────────────────────────── */
function MobileKnockoutBracket({ rounds, leagueName }: { rounds: BracketRound[]; leagueName: string }) {
  if (rounds.length === 0) return null;
  return (
    <div>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 10, letterSpacing: '-0.02em' }}>Knockout Stage</div>
      {rounds.map((round) => (
        <div key={round.name} style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 6 }}>{round.name}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {round.matches.map((m: BracketMatch) => (
              <div key={m.id} style={{ background: 'var(--surface-2)', borderRadius: 8, border: '1.5px solid var(--border-2)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: '1px solid var(--border-3)' }}>
                  {m.home.logo && !m.home.isPlaceholder ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={m.home.logo} alt="" width={16} height={16} style={{ objectFit: 'contain', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 16, height: 16, borderRadius: 3, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: 6, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-mute)' }}>{m.home.shortName?.slice(0, 3) ?? '?'}</div>
                  )}
                  <span style={{ flex: 1, fontWeight: m.home.winner ? 700 : 500, fontSize: 12, color: m.home.winner ? 'var(--ink)' : 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.home.shortName}</span>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: m.home.winner ? 'var(--orange)' : 'var(--ink)', minWidth: 16, textAlign: 'center' }}>{m.home.score !== null ? m.home.score : '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px' }}>
                  {m.away.logo && !m.away.isPlaceholder ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={m.away.logo} alt="" width={16} height={16} style={{ objectFit: 'contain', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 16, height: 16, borderRadius: 3, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: 6, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-mute)' }}>{m.away.shortName?.slice(0, 3) ?? '?'}</div>
                  )}
                  <span style={{ flex: 1, fontWeight: m.away.winner ? 700 : 500, fontSize: 12, color: m.away.winner ? 'var(--ink)' : 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.away.shortName}</span>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: m.away.winner ? 'var(--orange)' : 'var(--ink)', minWidth: 16, textAlign: 'center' }}>{m.away.score !== null ? m.away.score : '-'}</span>
                </div>
                {m.statusDisplay && (
                  <div style={{ padding: '4px 10px 5px', borderTop: '1px solid var(--border-3)', fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--text-mute)' }}>{m.statusDisplay}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function toDateKey(d: Date) {
  return String(d.getFullYear()) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
}

export default function DashboardScreen({ sport, setSport, onOpenMatch, onOpenPlayer, onSearch, onBell, fav, unread }: DashboardProps) {
  const todayKey = toDateKey(new Date());
  const { groups, isConnected, liveCount } = useScoresStream(sport, todayKey);
  const { articles, isLoading: newsLoading } = useNews(20, sport);

  // Football: show World Cup groups + knockout bracket
  const isFootball = sport === 'football';
  const { standings: wcStandings, isLoading: wcLoading } = useSingleStandings(isFootball ? 'fifa.world' : null);
  const { rounds: wcRounds, isLoading: bracketLoading } = useBracket(isFootball ? 'fifa.world' : null);

  // Other sports: show regular standings
  const { standings, isLoading: standingsLoading } = useStandings(isFootball ? undefined : sport);
  const [upcoming, setUpcoming] = useState<{ label: string; matches: Match[] } | null>(null);

  const showWcGroups = isFootball && wcStandings && wcStandings.hasGroups && wcStandings.groups && wcStandings.groups.length > 0;
  const showWcBracket = isFootball && wcRounds.length > 0;
  const wcSectionLoading = isFootball && (wcLoading || bracketLoading);

  // Same sort order as web DashboardClient: LIVE → HALF_TIME → SCHEDULED → FINISHED
  const allMatches = groups.flatMap(g => g.matches).sort((a, b) => {
    const p = (s: string) => s === 'LIVE' ? 0 : s === 'HALF_TIME' ? 1 : s === 'SCHEDULED' ? 2 : 3;
    return p(a.status) - p(b.status);
  });
  const display = allMatches.slice(0, 8).map(normalizedToMobile);
  const scoresLoading = !isConnected && groups.length === 0;
  const leagueLabel = [...new Set(groups.slice(0, 3).map(g => g.leagueShortName))].join(' · ');

  // Fetch upcoming matches when no matches today
  useEffect(() => {
    if (!isConnected || allMatches.length > 0) { setUpcoming(null); return; }
    let cancelled = false;
    (async () => {
      for (let i = 1; i <= 5; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, '');
        try {
          const res = await fetch(`/api/espn/scoreboard?sport=${sport}&date=${yyyymmdd}`);
          const json = await res.json();
          const nMatches: NormalizedMatch[] = (json.groups ?? []).flatMap((g: { matches: NormalizedMatch[] }) => g.matches);
          if (nMatches.length > 0 && !cancelled) {
            const label = i === 1 ? 'Tomorrow' : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
            setUpcoming({ label, matches: nMatches.slice(0, 6).map(normalizedToMobile) });
            return;
          }
        } catch { /* skip day */ }
      }
    })();
    return () => { cancelled = true; };
  }, [isConnected, allMatches.length, sport]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar
        title={`Hey, ${fav?.first ?? 'You'}`}
        subtitle="Matchday · Today"
        logoSrc="/curly-guy.png"
        onSearch={onSearch}
        onBell={onBell}
        hasNotification={unread > 0}
      />
      <div className="cs-scroll cs-screen-scroll" style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="cs-content-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SportSelector active={sport} onSelect={setSport} />

        {/* Live scores */}
        <Card
          subtitle={liveCount > 0 ? `● ${liveCount} live now` : '● Live & upcoming'}
          title={SPORT_LABELS[sport] ?? sport}
          action={leagueLabel || undefined}
        >
          {scoresLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
              <SkeletonList count={3}>{i => <SkeletonScoreCard style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
            </div>
          ) : display.length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>No matches today</div>
          ) : (
            <div style={{ borderTop: '1px solid var(--border-3)' }}>
              {display.map(m => (
                <div key={m.id} style={{ borderBottom: '1px solid var(--border-3)' }}>
                  <MatchRow {...m} onClick={() => onOpenMatch(m)} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming matches (shown when no matches today) */}
        {upcoming && display.length === 0 && (
          <Card subtitle={`Upcoming · ${upcoming.label}`} title="Next matches">
            <div style={{ borderTop: '1px solid var(--border-3)' }}>
              {upcoming.matches.map(m => (
                <div key={m.id} style={{ borderBottom: '1px solid var(--border-3)' }}>
                  <MatchRow {...m} onClick={() => onOpenMatch(m)} />
                </div>
              ))}
            </div>
          </Card>
        )}

        <AdSlot size="banner" />

        {/* News feed */}
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Today in sports</div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--orange)', fontWeight: 700, cursor: 'pointer' }} onClick={onSearch}>All →</span>
          </div>
          <div className="cs-tablet-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {newsLoading ? (
              <SkeletonList count={3}>{i => <SkeletonNewsCard style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
            ) : articles.length > 0 ? articles.map(n => (
              <Card key={n.id} tappable style={{ padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'stretch', gap: 0, cursor: 'pointer' }}
                onClick={() => { if (n.url) window.open(n.url, '_blank', 'noopener'); }}
              >
                {n.imageUrl ? (
                  <div style={{ width: 88, flexShrink: 0, background: 'var(--surface-3)', borderRight: '2px solid var(--ink)', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).parentElement!.style.background = 'var(--surface-3)'; (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                ) : (
                  <div style={{ width: 88, flexShrink: 0, background: 'var(--surface-3)', borderRight: '2px solid var(--ink)', display: 'grid', placeItems: 'center' }}>
                    <Icon name="news" size={22} style={{ color: 'var(--text-mute)' }} />
                  </div>
                )}
                <div style={{ padding: 14, minWidth: 0 }}>
                  <Badge tone="mute">{n.source}</Badge>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', lineHeight: 1.25, margin: '8px 0', letterSpacing: '-0.01em' }}>{n.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)' }}>
                      {n.publishedAt ? new Date(n.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    {n.url && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--orange)', fontWeight: 700 }}>Read more</span>}
                  </div>
                </div>
              </Card>
            )) : (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <Icon name="news" size={28} style={{ color: 'var(--text-mute)', margin: '0 auto 8px' }} />
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>No news right now</div>
              </div>
            )}
          </div>
        </div>

        {/* World Cup Standings (football only) */}
        {isFootball && (wcSectionLoading || showWcGroups || showWcBracket) && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                FIFA World Cup
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--orange)', fontWeight: 700 }}>{wcStandings?.season ?? ''}</span>
            </div>
            {wcSectionLoading ? (
              <SkeletonList count={5}>{i => <SkeletonTableRow style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
            ) : (
              <>
                {showWcGroups && (
                  <MobileWCGroupsGrid groups={wcStandings!.groups!} leagueName={wcStandings!.leagueName} />
                )}
                {showWcBracket && (
                  <MobileKnockoutBracket rounds={wcRounds} leagueName={wcStandings?.leagueName ?? 'FIFA World Cup'} />
                )}
              </>
            )}
          </div>
        )}

        {/* League Standings (non-football sports) */}
        {!isFootball && (standingsLoading || standings.length > 0) && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Standings</div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--orange)', fontWeight: 700 }}>{standings[0]?.season ?? ''}</span>
            </div>
            {standingsLoading ? (
              <SkeletonList count={5}>{i => <SkeletonTableRow style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
            ) : standings.slice(0, 2).map(league => (
              <MiniStandingsTable key={league.leagueId} entries={league.entries} leagueName={league.leagueName} />
            ))}
          </div>
        )}

        {/* All leagues scores */}
        {groups.length > 1 && groups.slice(1).map(g => {
          const gMatches = g.matches.slice(0, 4).map(normalizedToMobile);
          if (gMatches.length === 0) return null;
          return (
            <Card key={g.leagueId} subtitle={g.leagueShortName} title={g.leagueName}>
              <div style={{ borderTop: '1px solid var(--border-3)' }}>
                {gMatches.map(m => (
                  <div key={m.id} style={{ borderBottom: '1px solid var(--border-3)' }}>
                    <MatchRow {...m} onClick={() => onOpenMatch(m)} />
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
        </div>
      </div>
    </div>
  );
}
