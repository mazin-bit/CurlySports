'use client';
import React, { useState } from 'react';
import type { Match } from '../data';
import { useMatchDetail, mapStatsToRows, mapEventType } from './api';
import Card from './ui/Card';
import Icon from './ui/Icon';
import StatBar from './ui/StatBar';
import StatusPill from './ui/StatusPill';
import TeamCrest from './ui/TeamCrest';
import Button from './ui/Button';

const TABS: [string, string][] = [['summary', 'Summary'], ['timeline', 'Timeline'], ['lineups', 'Lineups']];

interface MatchScreenProps {
  match?: Match;
  liveClock?: string | null;
  onBack: () => void;
  onOpenPlayer: (playerId?: string, leagueId?: string) => void;
}

export default function MatchScreen({ match, liveClock, onBack, onOpenPlayer }: MatchScreenProps) {
  const [tab, setTab] = useState<string>('summary');

  // Fetch real match detail whenever we have a valid ESPN ID
  const matchId = match?.id ? String(match.id) : null;
  const leagueId = match?.leagueId ?? 'eng.1';
  const { detail, isLoading } = useMatchDetail(matchId, leagueId);

  // Teams — prefer real detail, fall back to match prop
  const homeTeam = detail
    ? { name: detail.homeTeam.name, abbr: detail.homeTeam.shortName, code: detail.homeTeam.shortName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4), score: detail.homeScore ?? 0, logoUrl: detail.homeTeam.logoUrl }
    : match ? { ...match.home, logoUrl: match.home.logoUrl ?? undefined } : { name: '—', abbr: '—', code: '—', score: 0, logoUrl: undefined };
  const awayTeam = detail
    ? { name: detail.awayTeam.name, abbr: detail.awayTeam.shortName, code: detail.awayTeam.shortName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4), score: detail.awayScore ?? 0, logoUrl: detail.awayTeam.logoUrl }
    : match ? { ...match.away, logoUrl: match.away.logoUrl ?? undefined } : { name: '—', abbr: '—', code: '—', score: 0, logoUrl: undefined };

  const isLive = match?.status === 'live' || detail?.status === 'LIVE' || detail?.status === 'HALF_TIME';
  const clock = liveClock ?? detail?.minute ?? match?.clock ?? '';
  const leagueName = detail?.leagueName ?? match?.league ?? '';
  const venue = detail?.venue ?? null;

  // Stats
  const statsRows: [string, string, number][] = detail ? mapStatsToRows(detail.homeStats, detail.awayStats) : [];

  // Timeline
  const timelineEvents = (detail?.events?.filter(e => e.isPrimary).map((e, i) => ({
    min: e.clock, type: mapEventType(e.type),
    side: e.teamSide as 'home' | 'away' | null,
    title: e.text, sub: e.teamName ?? '', score: undefined as string | undefined, id: String(e.id ?? i),
  })) ?? []);

  // Lineups
  const lineups = detail ? {
    home: { formation: detail.homeLineup.formation, players: detail.homeLineup.starters.map(p => [p.jersey, p.name] as [string, string]) },
    away: { formation: detail.awayLineup.formation, players: detail.awayLineup.starters.map(p => [p.jersey, p.name] as [string, string]) },
  } : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-2)', borderBottom: '2.5px solid var(--ink)', flexShrink: 0 }}>
        <button onClick={onBack} aria-label="Back" style={{ width: 38, height: 38, background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 11, display: 'grid', placeItems: 'center', color: 'var(--ink)', transform: 'scaleX(-1)', cursor: 'pointer' }}>
          <Icon name="arrow-right" size={18} />
        </button>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leagueName}</div>
        <StatusPill status={isLive ? 'live' : (match?.status ?? 'up')} style={{ marginLeft: 'auto', flexShrink: 0 }}>
          {isLive ? clock : undefined}
        </StatusPill>
      </header>

      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Score card */}
        <Card style={{ background: 'var(--ink)', borderColor: 'var(--ink)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <TeamCrest code={homeTeam.code} abbr={homeTeam.abbr} size="lg" logoUrl={homeTeam.logoUrl} style={{ margin: '0 auto' }} />
              <div style={{ fontSize: 12, color: 'rgba(255,253,247,0.75)', marginTop: 8 }}>{homeTeam.name}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 12px' }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 46, color: 'var(--paper)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                <span style={{ color: 'var(--accent)' }}>{homeTeam.score}</span>
                <span style={{ opacity: 0.4, fontWeight: 400, margin: '0 6px' }}>·</span>
                {awayTeam.score}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: isLive ? 'var(--accent)' : 'rgba(255,253,247,0.6)', marginTop: 6 }}>
                {isLive ? `${clock} · ${detail?.status === 'HALF_TIME' ? '1st half' : '2nd half'}` : (match?.status === 'ft' ? 'Full time' : (clock || 'Upcoming'))}
              </div>
              {isLoading && <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(255,253,247,0.35)', marginTop: 4 }}>Updating…</div>}
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <TeamCrest code={awayTeam.code} abbr={awayTeam.abbr} size="lg" logoUrl={awayTeam.logoUrl} style={{ margin: '0 auto' }} />
              <div style={{ fontSize: 12, color: 'rgba(255,253,247,0.75)', marginTop: 8 }}>{awayTeam.name}</div>
            </div>
          </div>
          {venue && <div style={{ textAlign: 'center', marginTop: 14, fontFamily: 'var(--mono)', fontSize: 9.5, color: 'rgba(255,253,247,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{venue}</div>}
        </Card>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--surface-2)', border: '2px solid var(--ink)', borderRadius: 12, padding: 4, boxShadow: 'var(--shadow-sm)' }}>
          {TABS.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: tab === k ? 'var(--ink)' : 'transparent', color: tab === k ? 'var(--accent)' : 'var(--text-mute)' }}>{label}</button>
          ))}
        </div>

        {/* Summary */}
        {tab === 'summary' && (
          statsRows.length > 0 ? (
            <>
              <Card subtitle="Match stats" title={`${homeTeam.abbr} vs ${awayTeam.abbr}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {statsRows.map(([label, val, pct], i) => (
                    <StatBar key={label} label={label} value={String(val)} pct={pct} color={i % 2 ? 'var(--orange)' : 'var(--accent)'} />
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card subtitle="Match stats" title="No data yet">
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>Stats for {homeTeam.name} vs {awayTeam.name} appear when the match goes live.</div>
            </Card>
          )
        )}

        {/* Timeline */}
        {tab === 'timeline' && (
          timelineEvents.length > 0 ? (
            <Card subtitle="Key events" title="Timeline">
              <div style={{ position: 'relative', paddingLeft: 4 }}>
                {timelineEvents.map((e, i) => {
                  const center = e.type === 'half';
                  const dotBg: Record<string, string> = { goal: 'var(--accent)', yellow: 'var(--amber)', sub: 'var(--sky)', chance: 'var(--surface-3)', half: 'var(--ink)' };
                  const dotIc: Record<string, string | null> = { goal: 'spark', yellow: null, sub: 'share', chance: 'bolt', half: null };
                  const bg = dotBg[e.type] ?? 'var(--surface-3)';
                  const ic = dotIc[e.type] ?? null;
                  return (
                    <div key={e.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: i < timelineEvents.length - 1 ? '1px solid var(--border-3)' : 'none' }}>
                      <div style={{ width: 38, flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-mute)', paddingTop: 4 }}>{e.min}</div>
                      <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: bg, border: '2px solid var(--ink)', display: 'grid', placeItems: 'center', color: e.type === 'half' ? 'var(--accent)' : 'var(--ink)' }}>
                        {e.type === 'yellow' ? <div style={{ width: 9, height: 13, background: 'var(--ink)', borderRadius: 1 }} /> : ic ? <Icon name={ic as 'spark'} size={14} /> : <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 11 }}>HT</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: center ? 'left' : (e.side === 'away' ? 'right' : 'left') }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{e.title}{e.score && <span style={{ fontFamily: 'var(--mono)', color: 'var(--orange)', marginLeft: 6 }}>{e.score}</span>}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 2 }}>{e.sub}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card subtitle="Key events" title="Timeline">
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>Timeline for {homeTeam.name} vs {awayTeam.name} will appear here.</div>
            </Card>
          )
        )}

        {/* Lineups */}
        {tab === 'lineups' && (
          lineups ? (
            <Card subtitle="Starting XI" title="Lineups">
              <div style={{ display: 'flex', gap: 14 }}>
                {(['home', 'away'] as const).map((side, si) => (
                  <React.Fragment key={side}>
                    {si === 1 && <div style={{ width: 1, background: 'var(--border-3)' }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexDirection: side === 'away' ? 'row-reverse' : 'row' }}>
                        <TeamCrest code={side === 'home' ? homeTeam.code : awayTeam.code} abbr={side === 'home' ? homeTeam.abbr : awayTeam.abbr} logoUrl={side === 'home' ? homeTeam.logoUrl : awayTeam.logoUrl} />
                        <div style={{ textAlign: side === 'away' ? 'right' : 'left' }}>
                          <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--ink)' }}>{side === 'home' ? homeTeam.abbr : awayTeam.abbr}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)' }}>{lineups[side].formation}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {lineups[side].players.map(([num, name]) => (
                          <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: side === 'away' ? 'row-reverse' : 'row' }}>
                            <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 6, background: 'var(--surface-3)', border: '1.5px solid var(--border-2)', display: 'grid', placeItems: 'center', fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, color: 'var(--text-dim)' }}>{num}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </Card>
          ) : (
            <Card subtitle="Starting XI" title="Lineups">
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>Lineups will appear here when available.</div>
            </Card>
          )
        )}

        <Button variant="primary" block size="lg" onClick={() => onOpenPlayer()}>Match centre · player stats →</Button>
      </div>
    </div>
  );
}
