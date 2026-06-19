'use client';
import React from 'react';
import TeamCrest from './TeamCrest';
import StatusPill from './StatusPill';
import type { Match } from '../../data';

interface MatchRowProps {
  home: Match['home'];
  away: Match['away'];
  league?: string;
  status?: Match['status'];
  clock?: string;
  scheduledAt?: string | null;
  onClick?: () => void;
}

function formatKickoff(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export default function MatchRow({ home, away, league, status = 'live', clock, scheduledAt, onClick }: MatchRowProps) {
  const hasScore = home.score != null && away.score != null;
  const kickoff = !hasScore ? formatKickoff(scheduledAt) : null;

  return (
    <div onClick={onClick} className="cs-tap" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <div className="cs-team">
          <TeamCrest code={home.code} abbr={home.abbr} logoUrl={home.logoUrl} />
          <span className="name">{home.name}</span>
          {hasScore && <span style={{ marginLeft: 'auto', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>{home.score}</span>}
        </div>
        <div className="cs-team">
          <TeamCrest code={away.code} abbr={away.abbr} logoUrl={away.logoUrl} />
          <span className="name">{away.name}</span>
          {hasScore && <span style={{ marginLeft: 'auto', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>{away.score}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        {kickoff && (
          <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 13, color: 'var(--accent)', background: 'var(--ink)', paddingInline: 8, paddingBlock: 3, borderRadius: 6 }}>{kickoff}</span>
        )}
        <StatusPill status={status}>{status === 'live' ? clock : undefined}</StatusPill>
        {league && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--text-mute)', letterSpacing: '0.06em' }}>{league}</span>}
      </div>
    </div>
  );
}
