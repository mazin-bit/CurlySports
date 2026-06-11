'use client';
import React, { useState } from 'react';
import { DATA } from '../data';
import { useStandings } from '@/hooks/useStandings';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Chip from './ui/Chip';
import TeamCrest from './ui/TeamCrest';

const LEAGUES: { id: string; label: string; sport: string }[] = [
  { id: 'eng.1',          label: 'Premier League',    sport: 'football' },
  { id: 'esp.1',          label: 'LaLiga',             sport: 'football' },
  { id: 'uefa.champions', label: 'Champions League',  sport: 'football' },
  { id: 'ger.1',          label: 'Bundesliga',         sport: 'football' },
  { id: 'ita.1',          label: 'Serie A',            sport: 'football' },
  { id: 'nba',            label: 'NBA',                sport: 'basketball' },
  { id: 'nfl',            label: 'NFL',                sport: 'nfl' },
];

interface LeaguesProps {
  onSearch: () => void;
  onBell: () => void;
  onOpenPlayer: (playerId?: string, leagueId?: string) => void;
  unread: number;
}

export default function LeaguesScreen({ onSearch, onBell, onOpenPlayer, unread }: LeaguesProps) {
  const [leagueIdx, setLeagueIdx] = useState(0);
  const D = DATA;
  const selected = LEAGUES[leagueIdx];

  const { standings, isLoading } = useStandings(selected.sport, selected.id);
  const table = standings[0]?.entries ?? [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar
        title="Leagues"
        subtitle={selected.label}
        logoSrc={D.mascot}
        onSearch={onSearch}
        onBell={onBell}
        hasNotification={unread > 0}
      />
      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {LEAGUES.map((l, i) => (
            <Chip key={l.id} active={leagueIdx === i} onClick={() => setLeagueIdx(i)}>{l.label}</Chip>
          ))}
        </div>

        <Card subtitle="Standings" title={selected.label} action="Full table ▾">
          <div style={{ display: 'flex', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0 8px', borderBottom: '1px solid var(--border-3)' }}>
            <span style={{ width: 20 }}>#</span>
            <span style={{ flex: 1 }}>Club</span>
            <span style={{ width: 78, textAlign: 'center' }}>Form</span>
            <span style={{ width: 30, textAlign: 'center' }}>GD</span>
            <span style={{ width: 28, textAlign: 'right' }}>Pts</span>
          </div>

          {isLoading && (
            <div style={{ padding: '24px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>Loading standings…</div>
          )}

          {!isLoading && table.length > 0 && table.slice(0, 12).map(entry => {
            // Approximate form W/D/L from record
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
              <div key={entry.teamId} onClick={() => onOpenPlayer()} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-3)', cursor: 'pointer' }}>
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
          })}

          {!isLoading && table.length === 0 && D.standings.map(([code, name, pos, pts, gd, form]) => (
            <div key={code} onClick={() => onOpenPlayer()} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-3)', cursor: 'pointer' }}>
              <span style={{ width: 20, fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12, color: Number(pos) <= 4 ? 'var(--orange)' : 'var(--text-mute)' }}>{pos}</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                <TeamCrest code={code} abbr={name.slice(0, 3).toUpperCase()} />
                <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              </div>
              <div style={{ width: 78, display: 'flex', gap: 3, justifyContent: 'center' }}>
                {String(form).split('').map((r, i) => (
                  <span key={i} style={{ width: 12, height: 12, borderRadius: 3, fontSize: 0, background: r === 'W' ? 'var(--accent)' : r === 'D' ? 'var(--surface-3)' : 'var(--coral)', border: '1px solid var(--ink)' }}>{r}</span>
                ))}
              </div>
              <span style={{ width: 30, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>{gd}</span>
              <span style={{ width: 28, textAlign: 'right', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{pts}</span>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 14, marginTop: 12, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--accent)', border: '1px solid var(--ink)', display: 'inline-block' }} /> Win</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--surface-3)', border: '1px solid var(--ink)', display: 'inline-block' }} /> Draw</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--coral)', border: '1px solid var(--ink)', display: 'inline-block' }} /> Loss</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
