'use client';
import React, { useState } from 'react';
import type { Match } from '../data';
import { mapStatsToRows, mapEventType } from './api';
import { useMatchStream } from '@/hooks/useMatchStream';
import { useLanguage } from '@/contexts/LanguageContext';
import Card from './ui/Card';
import Icon from './ui/Icon';
import StatBar from './ui/StatBar';
import StatusPill from './ui/StatusPill';
import TeamCrest from './ui/TeamCrest';
import Button from './ui/Button';
import AdSlot from './ui/AdSlot';

interface MatchScreenProps {
  match?: Match;
  liveClock?: string | null;
  onBack: () => void;
  onOpenPlayer: (playerId?: string, leagueId?: string) => void;
}

export default function MatchScreen({ match, liveClock, onBack, onOpenPlayer }: MatchScreenProps) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<string>('summary');

  // SSE real-time match stream — same source as web MatchClient
  const matchId = match?.id ? String(match.id) : '';
  const sport = match?.sport ?? 'football';
  const leagueId = match?.leagueId ?? 'eng.1';
  const { data, isLoading } = useMatchStream(matchId, sport, leagueId);

  // Teams — prefer SSE data for scores/logo, match prop for abbr/code
  const homeTeam = {
    name: data?.homeTeam.name ?? match?.home.name ?? '—',
    abbr: match?.home.abbr ?? (data?.homeTeam.name?.slice(0, 3).toUpperCase() ?? '—'),
    code: match?.home.code ?? (data?.homeTeam.name?.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4) ?? '—'),
    score: data?.homeTeam.score != null ? (parseInt(data.homeTeam.score) || 0) : (match?.home.score ?? 0),
    logoUrl: (data?.homeTeam.logo ?? match?.home.logoUrl) ?? undefined,
  };
  const awayTeam = {
    name: data?.awayTeam.name ?? match?.away.name ?? '—',
    abbr: match?.away.abbr ?? (data?.awayTeam.name?.slice(0, 3).toUpperCase() ?? '—'),
    code: match?.away.code ?? (data?.awayTeam.name?.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4) ?? '—'),
    score: data?.awayTeam.score != null ? (parseInt(data.awayTeam.score) || 0) : (match?.away.score ?? 0),
    logoUrl: (data?.awayTeam.logo ?? match?.away.logoUrl) ?? undefined,
  };

  const statusVal = data?.status?.toUpperCase() ?? '';
  const isLive = match?.status === 'live' || statusVal === 'IN_PROGRESS' || statusVal === 'LIVE' || statusVal === 'HALF_TIME' || statusVal === 'STATUS_IN_PROGRESS';
  const clock = liveClock ?? data?.clock ?? match?.clock ?? '';
  const leagueName = match?.league ?? '';
  const venue = data?.venue ?? null;

  // Stats — convert SSE TeamStats[] to Record<string,string> for mapStatsToRows
  const homeStats: Record<string, string> = {};
  const awayStats: Record<string, string> = {};
  if (data?.stats?.[0]) for (const s of data.stats[0].stats) { if (s.name && s.value != null) homeStats[s.name] = s.value; }
  if (data?.stats?.[1]) for (const s of data.stats[1].stats) { if (s.name && s.value != null) awayStats[s.name] = s.value; }
  const statsRows: [string, string, number][] = mapStatsToRows(homeStats, awayStats);

  // Timeline — convert SSE KeyEvent[] to timeline format
  const timelineEvents = (data?.keyEvents ?? []).map((e, i) => {
    let type: 'goal' | 'yellow' | 'sub' | 'chance' | 'half' = 'chance';
    if (e.isYellowCard) type = 'yellow';
    else if (e.isSubstitution) type = 'sub';
    else if (e.type) type = mapEventType(e.type);
    const side: 'home' | 'away' | null =
      e.teamId === data?.homeTeam.id ? 'home' :
      e.teamId === data?.awayTeam.id ? 'away' : null;
    return { min: e.clock ?? '', type, side, title: e.text ?? e.playerName ?? '', sub: e.playerName ?? '', score: undefined as string | undefined, id: e.id ?? String(i) };
  });


  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-2)', borderBottom: '2.5px solid var(--ink)', flexShrink: 0 }}>
        <button onClick={onBack} aria-label="Back" style={{ width: 38, height: 38, background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 11, display: 'grid', placeItems: 'center', color: 'var(--ink)', cursor: 'pointer' }}>
          <Icon name="chevron-left" size={18} />
        </button>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leagueName}</div>
        <StatusPill status={isLive ? 'live' : (match?.status ?? 'up')} style={{ marginInlineStart: 'auto', flexShrink: 0 }}>
          {isLive ? clock : undefined}
        </StatusPill>
      </header>

      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                {isLive ? `${clock} · ${statusVal === 'HALF_TIME' ? t('matchStatus.firstHalf') : t('matchStatus.secondHalf')}` : (match?.status === 'ft' ? t('matchStatus.fullTime') : (clock || t('matchStatus.upcoming')))}
              </div>
              {isLoading && <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(255,253,247,0.35)', marginTop: 4 }}>{t('matchStatus.updating')}</div>}
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <TeamCrest code={awayTeam.code} abbr={awayTeam.abbr} size="lg" logoUrl={awayTeam.logoUrl} style={{ margin: '0 auto' }} />
              <div style={{ fontSize: 12, color: 'rgba(255,253,247,0.75)', marginTop: 8 }}>{awayTeam.name}</div>
            </div>
          </div>
          {venue && <div style={{ textAlign: 'center', marginTop: 14, fontFamily: 'var(--mono)', fontSize: 9.5, color: 'rgba(255,253,247,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{venue}</div>}
        </Card>

        <AdSlot size="compact" />

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--surface-2)', border: '2px solid var(--ink)', borderRadius: 12, padding: 4, boxShadow: 'var(--shadow-sm)' }}>
          {([['summary', t('match.summary')], ['timeline', t('match.timeline')]] as [string, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: tab === k ? 'var(--ink)' : 'transparent', color: tab === k ? 'var(--accent)' : 'var(--text-mute)' }}>{label}</button>
          ))}
        </div>

        {/* Summary */}
        {tab === 'summary' && (
          statsRows.length > 0 ? (
            <>
              <Card subtitle={t('match.summary')} title={`${homeTeam.abbr} ${t('matchStatus.vs')} ${awayTeam.abbr}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {statsRows.map(([label, val, pct], i) => (
                    <StatBar key={label} label={label} value={String(val)} pct={pct} color={i % 2 ? 'var(--orange)' : 'var(--accent)'} />
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card subtitle={t('match.summary')} title={t('match.noDataYet')}>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>{t('match.statsAppearLive').replace('{match}', `${homeTeam.name} ${t('matchStatus.vs')} ${awayTeam.name}`)}</div>
            </Card>
          )
        )}

        {/* Timeline */}
        {tab === 'timeline' && (
          timelineEvents.length > 0 ? (
            <Card subtitle={t('match.keyEvents')} title={t('match.timeline')}>
              <div style={{ position: 'relative', paddingInlineStart: 4 }}>
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
                        {e.type === 'yellow' ? <div style={{ width: 9, height: 13, background: 'var(--ink)', borderRadius: 1 }} /> : ic ? <Icon name={ic as 'spark'} size={14} /> : <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 11 }}>{t('matchStatus.ht')}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: center ? 'start' : (e.side === 'away' ? 'end' : 'start') }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{e.title}{e.score && <span style={{ fontFamily: 'var(--mono)', color: 'var(--orange)', marginLeft: 6 }}>{e.score}</span>}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 2 }}>{e.sub}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card subtitle={t('match.keyEvents')} title={t('match.timeline')}>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>{t('match.timelineFor').replace('{match}', `${homeTeam.name} ${t('matchStatus.vs')} ${awayTeam.name}`)}</div>
            </Card>
          )
        )}

        <Button variant="primary" block size="lg" onClick={() => onOpenPlayer()}>{t('match.matchCentre')}</Button>
      </div>
    </div>
  );
}
