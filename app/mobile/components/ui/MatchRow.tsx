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
  onClick?: () => void;
}

export default function MatchRow({ home, away, league, status = 'live', clock, onClick }: MatchRowProps) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <div className="cs-team">
          <TeamCrest code={home.code} abbr={home.abbr} logoUrl={home.logoUrl} />
          <span className="name">{home.name}</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>{home.score}</span>
        </div>
        <div className="cs-team">
          <TeamCrest code={away.code} abbr={away.abbr} logoUrl={away.logoUrl} />
          <span className="name">{away.name}</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>{away.score}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <StatusPill status={status}>{status === 'live' ? clock : undefined}</StatusPill>
        {league && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--text-mute)', letterSpacing: '0.06em' }}>{league}</span>}
      </div>
    </div>
  );
}
