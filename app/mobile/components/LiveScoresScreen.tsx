'use client';
import React, { useState } from 'react';
import { DATA } from '../data';
import type { Match } from '../data';
import { useLiveScores } from '@/hooks/useLiveScores';
import { normalizedToMobile } from './api';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Chip from './ui/Chip';
import MatchRow from './ui/MatchRow';

const FILTERS: [string, string][] = [['all', 'All'], ['live', 'Live'], ['up', 'Upcoming'], ['ft', 'Finished']];

const SPORT_LABEL: Record<string, string> = {
  football: 'Football', basketball: 'Basketball', nfl: 'NFL', cricket: 'Cricket',
  tennis: 'Tennis', f1: 'Formula 1', baseball: 'Baseball', hockey: 'Hockey',
  mma: 'MMA', golf: 'Golf',
};

interface LiveScoresProps {
  onOpenMatch: (m: Match) => void;
  onSearch: () => void;
  onBell: () => void;
  unread: number;
}

export default function LiveScoresScreen({ onOpenMatch, onSearch, onBell, unread }: LiveScoresProps) {
  const [filter, setFilter] = useState<string>('all');
  const D = DATA;

  // Fetch all sports (no sport filter)
  const { groups, liveCount, isLoading } = useLiveScores(undefined, undefined, 8_000);

  // Convert all matches to mobile format
  const allMobile = groups.flatMap(g =>
    g.matches.map(m => ({ ...normalizedToMobile(m), _sport: g.sport, _leagueName: g.leagueName, _leagueShortName: g.leagueShortName }))
  );

  // Apply status filter
  const filtered = filter === 'all' ? allMobile
    : filter === 'live' ? allMobile.filter(m => m.status === 'live')
    : filter === 'up' ? allMobile.filter(m => m.status === 'up')
    : allMobile.filter(m => m.status === 'ft');

  // Group by sport
  const bySport: Record<string, typeof filtered> = {};
  for (const m of filtered) {
    const k = m._sport ?? 'football';
    (bySport[k] = bySport[k] ?? []).push(m);
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar
        title="Live Scores"
        subtitle={isLoading ? 'Loading…' : `${liveCount} matches live now`}
        logoSrc={D.mascot}
        onSearch={onSearch}
        onBell={onBell}
        hasNotification={unread > 0}
      />
      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {FILTERS.map(([k, label]) => (
            <Chip key={k} active={filter === k} live={k === 'live'} onClick={() => setFilter(k)}>{label}</Chip>
          ))}
        </div>

        {isLoading && (
          <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>Loading scores…</div>
        )}

        {!isLoading && Object.keys(bySport).length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>
            No {filter !== 'all' ? filter + ' ' : ''}matches right now
          </div>
        )}

        {!isLoading && Object.entries(bySport).map(([sportKey, matches]) => {
          // Get unique league names for subtitle
          const leagues = [...new Set(matches.map(m => m._leagueShortName ?? m.league))].slice(0, 3).join(' · ');
          return (
            <Card
              key={sportKey}
              subtitle={leagues}
              title={SPORT_LABEL[sportKey] ?? sportKey}
            >
              <div style={{ borderTop: '1px solid var(--border-3)' }}>
                {matches.map(m => (
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
  );
}
