'use client';
import React from 'react';
import type { Match } from '../data';
import { useLiveScores } from '@/hooks/useLiveScores';
import { useNews } from '@/hooks/useNews';
import { normalizedToMobile } from './api';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Badge from './ui/Badge';
import MatchRow from './ui/MatchRow';
import SportSelector from './ui/SportSelector';
import AdSlot from './ui/AdSlot';
import Icon from './ui/Icon';

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

export default function DashboardScreen({ sport, setSport, onOpenMatch, onOpenPlayer, onSearch, onBell, fav, unread }: DashboardProps) {
  const { groups, isLoading: scoresLoading } = useLiveScores(sport);
  const { articles, isLoading: newsLoading } = useNews(6);

  const allMatches = groups.flatMap(g => g.matches);
  const live = allMatches.filter(m => m.status === 'LIVE' || m.status === 'HALF_TIME');
  const display = (live.length > 0 ? live : allMatches).slice(0, 4).map(normalizedToMobile);
  const liveCount = live.length;
  const leagueLabel = [...new Set(groups.slice(0, 3).map(g => g.leagueShortName))].join(' · ');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar
        title={`Hey, ${fav?.first ?? 'You'}`}
        subtitle="Matchday · Today"
        logoSrc="/curly-mark.png"
        onSearch={onSearch}
        onBell={onBell}
        hasNotification={unread > 0}
      />
      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SportSelector active={sport} onSelect={setSport} />

        {/* Live scores */}
        <Card
          subtitle={liveCount > 0 ? `● ${liveCount} live now` : '● Live & upcoming'}
          title={SPORT_LABELS[sport] ?? sport}
          action={leagueLabel || undefined}
        >
          {scoresLoading ? (
            <div style={{ padding: '20px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>Loading scores…</div>
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

        <AdSlot size="banner" />

        {/* News feed */}
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Today in sports</div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--orange)', fontWeight: 700, cursor: 'pointer' }} onClick={onSearch}>All →</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {newsLoading ? (
              <div style={{ padding: '20px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>Loading news…</div>
            ) : articles.length > 0 ? articles.slice(0, 5).map(n => (
              <Card key={n.id} tappable style={{ padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'stretch', gap: 0, cursor: 'pointer' }}>
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
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)' }}>
                    {n.publishedAt ? new Date(n.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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
      </div>
    </div>
  );
}
