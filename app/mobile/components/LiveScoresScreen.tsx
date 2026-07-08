'use client';
import React, { useState } from 'react';
import type { Match } from '../data';
import { useScoresStream } from '@/hooks/useScoresStream';
import { normalizedToMobile } from './api';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Chip from './ui/Chip';
import MatchRow from './ui/MatchRow';
import SportSelector from './ui/SportSelector';
import Icon from './ui/Icon';
import { SkeletonScoreCard, SkeletonList } from './ui/Skeletons';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate, dayAbbr, monthYearLabel, localizeDigits } from '@/lib/locale-utils';
import { translateLeagueName } from '@/lib/league-names';

function toDateKey(d: Date) {
  return String(d.getFullYear()) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
}

function addDays(d: Date, n: number): Date {
  const nd = new Date(d);
  nd.setDate(d.getDate() + n);
  nd.setHours(0, 0, 0, 0);
  return nd;
}

interface LiveScoresProps {
  sport: string;
  setSport: (s: string) => void;
  onOpenMatch: (m: Match) => void;
  onSearch: () => void;
  onBell: () => void;
  unread: number;
}

export default function LiveScoresScreen({ sport, setSport, onOpenMatch, onSearch, onBell, unread }: LiveScoresProps) {
  const { t, locale } = useLanguage();
  const [filter, setFilter] = useState<string>('all');

  // Date selection — starts at today, same data source as web CalendarStrip
  const [baseDate] = useState<Date>(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [selectedDate, setSelectedDate] = useState<Date>(baseDate);
  // Track week offset to allow prev/next week navigation
  const [weekOffset, setWeekOffset] = useState(0);

  const todayKey = toDateKey(baseDate);
  const selectedKey = toDateKey(selectedDate);
  const isToday = selectedKey === todayKey;

  // 7-day strip centred on today + weekOffset*7
  const stripBase = addDays(baseDate, weekOffset * 7 - 3);
  const days = Array.from({ length: 7 }, (_, i) => addDays(stripBase, i));

  // SSE real-time stream — identical endpoint as web LiveScoresClient
  const { groups, liveCount, isConnected } = useScoresStream(sport, selectedKey);
  const isLoading = !isConnected && groups.length === 0;

  const allMobile = groups.flatMap(g =>
    g.matches.map(m => ({ ...normalizedToMobile(m), _leagueName: g.leagueName, _leagueShortName: g.leagueShortName }))
  );

  const filtered = filter === 'all' ? allMobile
    : filter === 'live' ? allMobile.filter(m => m.status === 'live')
    : filter === 'up'   ? allMobile.filter(m => m.status === 'up')
    : allMobile.filter(m => m.status === 'ft');

  // Group by league — identical to web
  const byLeague: Record<string, { label: string; shortLabel: string; matches: typeof filtered }> = {};
  for (const m of filtered) {
    const k = m.leagueId ?? m.league;
    if (!byLeague[k]) byLeague[k] = { label: m._leagueName ?? m.league, shortLabel: m._leagueShortName ?? m.league, matches: [] };
    byLeague[k].matches.push(m);
  }

  const dateLabel = isToday
    ? t('time.today')
    : formatDate(selectedDate, locale, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar
        title={t('liveScores.title')}
        subtitle={isLoading ? t('liveScores.connecting') : liveCount > 0 && isToday ? `● ${liveCount} ${t('liveScores.liveNow')}` : dateLabel}
        logoSrc="/curly-guy.png"
        onSearch={onSearch}
        onBell={onBell}
        hasNotification={unread > 0}
      />
      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Sport selector */}
        <SportSelector active={sport} onSelect={setSport} />

        {/* Date strip — same 7-day week as web CalendarStrip */}
        <div style={{ background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 14, padding: '8px 8px 10px', boxShadow: 'var(--shadow-sm)' }}>
          {/* Month + week nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <button
              onClick={() => { setWeekOffset(w => w - 1); setSelectedDate(d => addDays(d, -7)); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px', fontSize: 20, color: 'var(--text-dim)', lineHeight: 1 }}
              aria-label={t('liveScores.previousWeek')}
            >‹</button>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {monthYearLabel(selectedDate, locale)}
            </span>
            <button
              onClick={() => { setWeekOffset(w => w + 1); setSelectedDate(d => addDays(d, 7)); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px', fontSize: 20, color: 'var(--text-dim)', lineHeight: 1 }}
              aria-label={t('liveScores.nextWeek')}
            >›</button>
          </div>
          {/* Day buttons */}
          <div style={{ display: 'flex', gap: 3 }}>
            {days.map(d => {
              const key = toDateKey(d);
              const isSel = key === selectedKey;
              const isTod = key === todayKey;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(d)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    padding: '6px 2px', borderRadius: 10,
                    border: `1.5px solid ${isSel ? 'var(--ink)' : isTod ? 'var(--orange)' : 'transparent'}`,
                    background: isSel ? 'var(--ink)' : 'transparent',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                >
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.05em', color: isSel ? 'var(--accent)' : 'var(--text-mute)' }}>
                    {dayAbbr(d, locale)}
                  </span>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 15, color: isSel ? 'var(--accent)' : isTod ? 'var(--ink)' : 'var(--text-dim)' }}>
                    {localizeDigits(String(d.getDate()), locale)}
                  </span>
                  {isTod && <span style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? 'var(--accent)' : 'var(--orange)', display: 'block' }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {([['all', t('standings.all')], ['live', `● ${t('matchStatus.live')}`], ['up', t('matchStatus.upcoming')], ['ft', t('liveScores.completed')]] as [string, string][]).map(([k, label]) => (
            <Chip key={k} active={filter === k} live={k === 'live'} onClick={() => setFilter(k)}>{label}</Chip>
          ))}
        </div>

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SkeletonList count={5}>{i => <SkeletonScoreCard style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
          </div>
        )}

        {!isLoading && Object.keys(byLeague).length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Icon name="target" size={28} style={{ margin: '0 auto 12px', color: 'var(--text-mute)' }} />
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>
              {t('liveScores.noMatchesOnDate').replace('{sport}', filter !== 'all' ? filter + ' ' : '')} · {dateLabel}
            </div>
          </div>
        )}

        {!isLoading && Object.entries(byLeague).map(([leagueKey, { label, shortLabel, matches }], idx) => (
          <div key={leagueKey} className="cs-stagger" style={{ '--i': Math.min(idx, 6) } as React.CSSProperties}>
          <Card subtitle={translateLeagueName(shortLabel, locale)} title={translateLeagueName(label, locale)}>
            <div style={{ borderTop: '1px solid var(--border-3)' }}>
              {matches.map(m => (
                <div key={m.id} style={{ borderBottom: '1px solid var(--border-3)' }}>
                  <MatchRow {...m} onClick={() => onOpenMatch(m)} />
                </div>
              ))}
            </div>
          </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
