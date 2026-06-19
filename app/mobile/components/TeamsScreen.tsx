'use client';
import React, { useState } from 'react';
import { useTeamsList, type RealTeam } from './api';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Chip from './ui/Chip';
import TeamCrest from './ui/TeamCrest';
import Icon from './ui/Icon';
import SportSelector from './ui/SportSelector';
import { SkeletonRow, SkeletonList } from './ui/Skeletons';

const LEAGUES_BY_SPORT: Record<string, { id: string; label: string }[]> = {
  football: [
    { id: 'eng.1', label: 'EPL' },
    { id: 'esp.1', label: 'La Liga' },
    { id: 'ger.1', label: 'Bundesliga' },
    { id: 'ita.1', label: 'Serie A' },
    { id: 'fra.1', label: 'Ligue 1' },
    { id: 'usa.1', label: 'MLS' },
    { id: 'mex.1', label: 'Liga MX' },
  ],
  basketball: [{ id: 'nba', label: 'NBA' }],
  nfl: [{ id: 'nfl', label: 'NFL' }],
  baseball: [{ id: 'mlb', label: 'MLB' }],
  cricket: [
    { id: 'ipl', label: 'IPL' },
    { id: 'big.bash', label: 'Big Bash' },
    { id: 'psl', label: 'PSL' },
    { id: 'cplt20', label: 'CPL' },
  ],
  tennis: [],
  f1: [],
};

interface TeamsProps {
  sport: string;
  setSport: (s: string) => void;
  onSearch: () => void;
  onBell: () => void;
  onOpenPlayer: (playerId?: string, leagueId?: string) => void;
  unread: number;
}

// ─── Squad Sheet ──────────────────────────────────────────────────────────────
function SquadSheet({ team, sport, onClose }: { team: RealTeam; sport: string; onClose: () => void }) {
  const { teams: squadTeams, isLoading } = useTeamsList(sport, team.leagueId);
  // We use /api/espn/teams which returns teams, not squad. For squad, link to player search
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'relative', background: 'var(--bg)', borderRadius: '20px 20px 0 0', border: '2.5px solid var(--ink)', borderBottom: 'none', maxHeight: '80vh', display: 'flex', flexDirection: 'column', animation: 'cs-slideUp 0.22s var(--ease-pop)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 12px', borderBottom: '1px solid var(--border-3)', flexShrink: 0 }}>
          <TeamCrest code={team.abbr.toLowerCase().slice(0, 4)} abbr={team.abbr.slice(0, 3).toUpperCase()} logoUrl={team.logo} size="lg" />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>{team.name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>{team.leagueName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)' }}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 24px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            {team.color && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: team.color, border: '1px solid var(--border-2)' }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>Team colour</span>
              </div>
            )}
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>{team.leagueName} · {team.sport}</div>
          </div>

          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Icon name="user" size={28} style={{ color: 'var(--text-mute)', margin: '0 auto 8px' }} />
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-mute)' }}>Search players to see squad members</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function TeamsScreen({ sport, setSport, onSearch, onBell, onOpenPlayer, unread }: TeamsProps) {
  const leagues = LEAGUES_BY_SPORT[sport] ?? [];
  const [leagueIdx, setLeagueIdx] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<RealTeam | null>(null);
  const [query, setQuery] = useState('');

  const selectedLeague = leagues[leagueIdx];
  const { teams, isLoading } = useTeamsList(sport, selectedLeague?.id);

  const filtered = query.trim()
    ? teams.filter(t => t.name.toLowerCase().includes(query.toLowerCase()) || t.abbr.toLowerCase().includes(query.toLowerCase()))
    : teams;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar
        title="Teams"
        subtitle="Browse squads"
        logoSrc="/curly-mark.png"
        onSearch={onSearch}
        onBell={onBell}
        hasNotification={unread > 0}
      />

      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SportSelector active={sport} onSelect={s => { setSport(s); setLeagueIdx(0); setQuery(''); }} />

        {/* League chips */}
        {leagues.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {leagues.map((l, i) => (
              <Chip key={l.id} active={leagueIdx === i} onClick={() => { setLeagueIdx(i); setQuery(''); }}>{l.label}</Chip>
            ))}
          </div>
        )}

        {/* Search box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 12, padding: '10px 14px' }}>
          <Icon name="search" size={15} style={{ color: 'var(--text-mute)', flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search teams…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--body)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)' }}>
              <Icon name="close" size={14} />
            </button>
          )}
        </div>

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SkeletonList count={6}>{i => <SkeletonRow style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Icon name="user" size={32} style={{ color: 'var(--text-mute)', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-mute)' }}>
              {leagues.length === 0 ? `No team data for ${sport}` : 'No teams found'}
            </div>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <Card subtitle={selectedLeague?.label ?? sport.toUpperCase()} title={`${filtered.length} Teams`}>
            {filtered.map((team, i) => (
              <div
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < filtered.length - 1 ? '1px solid var(--border-3)' : 'none', cursor: 'pointer' }}
              >
                <TeamCrest code={team.abbr.toLowerCase().slice(0, 4)} abbr={team.abbr.slice(0, 3).toUpperCase()} logoUrl={team.logo} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 1 }}>{team.leagueName}</div>
                </div>
                {team.color && <div style={{ width: 10, height: 10, borderRadius: '50%', background: team.color, border: '1px solid var(--border-2)', flexShrink: 0 }} />}
                <Icon name="arrow-right" size={14} style={{ color: 'var(--text-mute)', flexShrink: 0 }} />
              </div>
            ))}
          </Card>
        )}
      </div>

      {selectedTeam && <SquadSheet team={selectedTeam} sport={sport} onClose={() => setSelectedTeam(null)} />}
    </div>
  );
}
