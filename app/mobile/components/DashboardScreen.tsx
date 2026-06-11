'use client';
import React from 'react';
import { DATA } from '../data';
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
  const D = DATA;
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
        logoSrc={D.mascot}
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

        {/* Top scorer */}
        <Card tappable onClick={() => onOpenPlayer()} style={{ background: 'var(--ink)', borderColor: 'var(--ink)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Top scorer · season</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 44, color: 'var(--accent)', letterSpacing: '-0.03em' }}>{D.topScorer.goals}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,253,247,0.7)' }}>{D.topScorer.name}<br />goals this season</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Badge tone="accent">↑ 4 vs xG</Badge>
                <Badge style={{ background: 'rgba(255,253,247,0.1)', color: 'var(--paper)', border: '1px solid rgba(255,253,247,0.2)' }}>View profile →</Badge>
              </div>
            </div>
            <Icon name="trophy" size={40} style={{ color: 'var(--accent)', opacity: 0.5 }} />
          </div>
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
            )) : D.news.slice(0, 3).map(n => (
              <Card key={n.id} tappable style={{ padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'stretch', gap: 0, cursor: 'pointer' }}>
                <div style={{ width: 88, flexShrink: 0, background: n.color, borderRight: '2px solid var(--ink)', display: 'grid', placeItems: 'center', color: 'var(--ink)' }}>
                  <Icon name={n.icon} size={32} />
                </div>
                <div style={{ padding: 14, minWidth: 0 }}>
                  <Badge tone={n.tone === 'hot' ? 'orange' : 'mute'}>{n.tag}</Badge>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', lineHeight: 1.25, margin: '8px 0', letterSpacing: '-0.01em' }}>{n.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)' }}>
                    <span>{n.src}</span><span>{n.meta}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
