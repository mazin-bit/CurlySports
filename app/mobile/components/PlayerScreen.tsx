'use client';
import React, { useState } from 'react';
import useSWR from 'swr';
import { usePlayerDetail } from './api';
import Card from './ui/Card';
import Icon from './ui/Icon';
import TeamCrest from './ui/TeamCrest';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { SkeletonPlayerProfile } from './ui/Skeletons';

const favFetcher = (url: string) => fetch(url).then(r => r.json());

interface PlayerProps {
  playerId?: string | null;
  playerLeagueId?: string | null;
  onBack: () => void;
  onOpenMatch: () => void;
}

// Stat keys to show as headline
const HEADLINE_KEYS = ['goals', 'assists', 'gamesPlayed', 'minutesPlayed', 'goalContributions', 'saves', 'wins'];
const STAT_LABELS: Record<string, string> = {
  goals: 'Goals', assists: 'Assists', gamesPlayed: 'Apps', minutesPlayed: 'Mins',
  goalContributions: 'G+A', saves: 'Saves', wins: 'Wins',
  points: 'Pts', rebounds: 'Reb', steals: 'Stl', blocks: 'Blk',
};

export default function PlayerScreen({ playerId, playerLeagueId, onBack, onOpenMatch }: PlayerProps) {
  const { player: realPlayer, isLoading } = usePlayerDetail(playerId, playerLeagueId);
  const { data: favData, mutate: mutFav } = useSWR<{ favorites: { type: string; espn_id: string }[] }>('/api/user-favorites', favFetcher);
  const [saving, setSaving] = useState(false);
  const isSaved = favData?.favorites?.some(f => f.type === 'player' && f.espn_id === playerId) ?? false;

  const toggleFav = async () => {
    if (!playerId || saving) return;
    setSaving(true);
    if (isSaved) {
      await fetch('/api/user-favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'player', espn_id: playerId }) });
    } else if (realPlayer) {
      await fetch('/api/user-favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'player', espn_id: playerId, data: { name: realPlayer.name, position: realPlayer.position ?? '', teamName: realPlayer.teamName, headshot: realPlayer.headshot ?? null, leagueId: playerLeagueId ?? realPlayer.leagueId ?? '', leagueName: realPlayer.leagueName ?? '', sport: realPlayer.sport ?? '' } }) });
    }
    await mutFav();
    setSaving(false);
  };

  // Radar geometry (only shown when real data available)
  const radarData: [string, number][] = realPlayer ? buildRadar(realPlayer.stats) : [];
  const R = 62, cx = 90, cy = 86;
  const pts = radarData.map(([, v], i) => {
    const a = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
    const r = (v / 100) * R;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });
  const ring = (frac: number) => radarData.map((_, i) => {
    const a = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
    return [cx + R * frac * Math.cos(a), cy + R * frac * Math.sin(a)].join(',');
  }).join(' ');

  // Headline stats
  const headlineStats: [string, string][] = realPlayer ? buildHeadline(realPlayer.stats) : [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-2)', borderBottom: '2.5px solid var(--ink)', flexShrink: 0 }}>
        <button onClick={onBack} aria-label="Back" style={{ width: 38, height: 38, background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 11, display: 'grid', placeItems: 'center', color: 'var(--ink)', transform: 'scaleX(-1)', cursor: 'pointer' }}>
          <Icon name="arrow-right" size={18} />
        </button>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>Player</div>
        <button onClick={toggleFav} disabled={saving} style={{ marginLeft: 'auto', width: 38, height: 38, background: isSaved ? 'var(--coral)' : 'var(--surface)', border: `2px solid ${isSaved ? 'var(--coral)' : 'var(--ink)'}`, borderRadius: 11, display: 'grid', placeItems: 'center', color: isSaved ? '#fff' : 'var(--ink)', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}><Icon name="heart" size={17} style={{ fill: isSaved ? 'currentColor' : 'none' }} /></button>
      </header>

      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isLoading && <SkeletonPlayerProfile />}

        {/* Hero card */}
        <Card style={{ background: 'var(--ink)', borderColor: 'var(--ink)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              {realPlayer?.headshot ? (
                <div style={{ width: 72, height: 72, borderRadius: 18, border: '2px solid var(--paper)', overflow: 'hidden', background: 'var(--surface-2)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={realPlayer.headshot} alt={realPlayer.name} width={72} height={72} style={{ objectFit: 'cover', display: 'block' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                </div>
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: 18, background: 'var(--accent)', border: '2px solid var(--paper)', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 30, color: 'var(--ink)' }}>
                  {realPlayer?.jersey ?? '?'}
                </div>
              )}
              {realPlayer && (
                <div style={{ position: 'absolute', bottom: -6, right: -6 }}>
                  <TeamCrest
                    code={realPlayer.teamName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4)}
                    abbr={realPlayer.teamName.slice(0, 4).toUpperCase()}
                    logoUrl={realPlayer.teamLogo}
                  />
                </div>
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 24, color: 'var(--paper)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                {realPlayer ? <>{realPlayer.firstName}<br />{realPlayer.lastName}</> : <span style={{ opacity: 0.4 }}>—</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {realPlayer?.positionAbbr && <Badge tone="accent">{realPlayer.positionAbbr}</Badge>}
                {realPlayer?.nationality && <Badge style={{ background: 'rgba(255,253,247,0.1)', color: 'var(--paper)', border: '1px solid rgba(255,253,247,0.2)' }}>{realPlayer.nationality}</Badge>}
                {realPlayer?.age && (
                  <Badge style={{ background: 'rgba(255,253,247,0.1)', color: 'var(--paper)', border: '1px solid rgba(255,253,247,0.2)' }}>{realPlayer.age} yrs</Badge>
                )}
              </div>
            </div>
          </div>
          {headlineStats.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(headlineStats.length, 4)}, 1fr)`, gap: 8, marginTop: 16, borderTop: '1px solid rgba(255,253,247,0.15)', paddingTop: 14 }}>
              {headlineStats.slice(0, 4).map(([label, v]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--accent)', letterSpacing: '-0.02em' }}>{v}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: 'rgba(255,253,247,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Radar chart */}
        {radarData.length >= 3 && (
          <Card subtitle="Attributes" title="Player profile">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="180" height="172" viewBox="0 0 180 172" style={{ flexShrink: 0 }}>
                {[0.25, 0.5, 0.75, 1].map(f => (
                  <polygon key={f} points={ring(f)} fill="none" stroke="var(--border-3)" strokeWidth="1" />
                ))}
                {pts.map((_q, i) => {
                  const a = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
                  return <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(a)} y2={cy + R * Math.sin(a)} stroke="var(--border-3)" strokeWidth="1" />;
                })}
                <polygon points={pts.map(q => q.join(',')).join(' ')} fill="rgba(200,255,61,0.45)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
                {pts.map((q, i) => <circle key={i} cx={q[0]} cy={q[1]} r="2.5" fill="var(--ink)" />)}
              </svg>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {radarData.map(([label, v]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-dim)', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: v >= 85 ? 'var(--orange)' : 'var(--ink)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Why trending */}
        {realPlayer && (
          <Card style={{ background: 'var(--accent)', borderColor: 'var(--ink)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon name="spark" size={18} style={{ color: 'var(--ink)' }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink)' }}>Player info</div>
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>
              {realPlayer.name} plays for {realPlayer.teamName} in the {realPlayer.leagueName}.
              {realPlayer.statsSeason && ` Stats from ${realPlayer.statsSeason}.`}
            </div>
          </Card>
        )}

        <Button variant="primary" block size="lg" onClick={() => onOpenMatch()}>See live scores →</Button>
      </div>
    </div>
  );
}

// Build radar data from real player stats (6 attributes)
function buildRadar(stats: { name: string; value: number; displayValue: string }[]): [string, number][] {
  const MAP: Record<string, [string, number]> = {
    goals:          ['Goals',     100],
    assists:        ['Assists',   100],
    shotsOnTarget:  ['Shooting',  100],
    passingPct:     ['Passing',   100],
    dribbles:       ['Dribbles',  100],
    tackles:        ['Tackles',   100],
    saves:          ['Saves',     100],
    points:         ['Points',    100],
    rebounds:       ['Rebounds',  100],
    steals:         ['Steals',    100],
  };
  const result: [string, number][] = [];
  for (const s of stats) {
    const entry = MAP[s.name];
    if (entry && s.value > 0) {
      const [label, max] = entry;
      result.push([label, Math.min(Math.round((s.value / max) * 100), 99)]);
    }
  }
  // Need at least 3 points for radar
  if (result.length < 3) return [];
  return result.slice(0, 6);
}

// Build headline stats from real player stats
function buildHeadline(stats: { name: string; value: number; displayName: string; displayValue: string }[]): [string, string][] {
  const priority = ['goals', 'assists', 'gamesPlayed', 'minutesPlayed', 'saves', 'points', 'rebounds', 'tackles', 'goalContributions'];
  const result: [string, string][] = [];
  for (const key of priority) {
    const s = stats.find(x => x.name === key);
    if (s && s.value > 0) {
      result.push([STAT_LABELS[key] ?? s.displayName, s.displayValue]);
      if (result.length >= 4) break;
    }
  }
  return result;
}
