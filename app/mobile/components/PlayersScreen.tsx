'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { useLanguage } from '@/contexts/LanguageContext';
import Topbar from './ui/Topbar';
import SportSelector from './ui/SportSelector';
import Chip from './ui/Chip';
import Icon from './ui/Icon';
import Badge from './ui/Badge';
import { SkeletonRow, SkeletonList } from './ui/Skeletons';
import AdSlot from './ui/AdSlot';
import type { RealTeam } from './api';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface PlayerResult {
  id: string; name: string; jersey: string; position: string;
  headshot: string | null; teamName: string; leagueId: string; leagueName: string;
}

interface PlayersProps {
  sport: string;
  setSport: (s: string) => void;
  onSearch: () => void;
  onBell: () => void;
  onOpenPlayer: (playerId?: string, leagueId?: string) => void;
  unread: number;
}

// Primary leagues per sport (mirrors web PlayersClient.tsx)
const SPORT_LEAGUES: Record<string, { id: string; label: string }[]> = {
  football: [
    { id: 'eng.1',  label: 'Premier League' },
    { id: 'esp.1',  label: 'La Liga' },
    { id: 'ger.1',  label: 'Bundesliga' },
    { id: 'ita.1',  label: 'Serie A' },
    { id: 'fra.1',  label: 'Ligue 1' },
    { id: 'por.1',  label: 'Primeira Liga' },
    { id: 'ned.1',  label: 'Eredivisie' },
    { id: 'eng.2',  label: 'Championship' },
    { id: 'tur.1',  label: 'Süper Lig' },
    { id: 'sco.1',  label: 'Scottish Prem' },
    { id: 'bel.1',  label: 'Pro League' },
    { id: 'gre.1',  label: 'Super League' },
    { id: 'usa.1',  label: 'MLS' },
    { id: 'mex.1',  label: 'Liga MX' },
    { id: 'bra.1',  label: 'Brasileirão' },
    { id: 'arg.1',  label: 'Liga Profesional' },
    { id: 'col.1',  label: 'Liga BetPlay' },
    { id: 'ksa.1',  label: 'Saudi Pro League' },
    { id: 'jpn.1',  label: 'J1 League' },
    { id: 'aus.1',  label: 'A-League' },
    { id: 'chi.1',  label: 'Primera División' },
    { id: 'ecu.1',  label: 'Liga Pro' },
    { id: 'rus.1',  label: 'Premier Liga' },
  ],
  basketball: [{ id: 'nba', label: 'NBA' }, { id: 'wnba', label: 'WNBA' }],
  nfl: [{ id: 'nfl', label: 'NFL' }],
  baseball: [{ id: 'mlb', label: 'MLB' }],
  hockey: [{ id: 'nhl', label: 'NHL' }],
  cricket: [
    { id: 'ipl',          label: 'IPL' },
    { id: 'big.bash',     label: 'Big Bash' },
    { id: 'psl',          label: 'PSL' },
    { id: 'cplt20',       label: 'CPL' },
    { id: 'sa.domestic',  label: 'SA20' },
    { id: 'eng.domestic', label: 'County' },
  ],
};

export default function PlayersScreen({ sport, setSport, onSearch, onBell, onOpenPlayer, unread }: PlayersProps) {
  const { t } = useLanguage();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [leagueId, setLeagueId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const leagues = SPORT_LEAGUES[sport] ?? [{ id: 'eng.1', label: 'Premier League' }];

  // Reset league & search when sport changes
  useEffect(() => {
    setLeagueId(undefined);
    setQ('');
    setDebouncedQ('');
    setPage(0);
  }, [sport]);

  // Reset pagination when league changes
  useEffect(() => { setPage(0); }, [leagueId]);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 150);
    return () => clearTimeout(t);
  }, [q]);

  const isSearching = debouncedQ.length >= 2;
  const activeLeague = leagueId ?? leagues[0]?.id;

  // Player search results
  const { data: searchData, isLoading: searchLoading } = useSWR<{ players: PlayerResult[] }>(
    isSearching ? `/api/espn/player-search?q=${encodeURIComponent(debouncedQ)}&sport=${sport}` : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  // Teams for browsing (when not searching)
  const { data: teamsData, isLoading: teamsLoading } = useSWR<{ teams: RealTeam[] }>(
    !isSearching ? `/api/espn/teams?sport=${sport}&league=${activeLeague}` : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true, dedupingInterval: 3_600_000 }
  );

  const players = searchData?.players ?? [];
  const teams = teamsData?.teams ?? [];

  const PAGE_SIZE = 20;
  const visiblePlayers = players.slice(0, PAGE_SIZE * (page + 1));
  const hasMore = players.length > visiblePlayers.length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar
        title={t('players.title')}
        subtitle={isSearching ? `${players.length} ${t('players.results')}` : `${t('players.browseByTeam').split(' · ')[0]} · ${leagues.find(l => l.id === activeLeague)?.label ?? 'Select league'}`}
        onSearch={onSearch}
        onBell={onBell}
        hasNotification={unread > 0}
      />

      <div style={{ flexShrink: 0, background: 'var(--bg-2)', borderBottom: '2px solid var(--border-2)' }}>
        <div style={{ padding: '10px 14px 0' }}>
          <SportSelector active={sport} onSelect={s => { setSport(s); }} />
        </div>

        {/* Search input */}
        <div style={{ padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 12, padding: '0 12px', height: 40, boxShadow: 'var(--shadow-sm)' }}>
            <Icon name="search" size={17} style={{ color: 'var(--text-mute)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={e => { setQ(e.target.value); setPage(0); }}
              placeholder={t('players.searchPlaceholder')}
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'var(--ink)', fontFamily: 'var(--body)' }}
            />
            {q && (
              <button onClick={() => { setQ(''); setDebouncedQ(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', display: 'grid', placeItems: 'center' }}>
                <Icon name="close" size={15} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* League chips (visible when not searching) */}
        {!isSearching && (
          <div style={{ display: 'flex', gap: 8, padding: '0 14px 12px', overflowX: 'auto' }}>
            {leagues.map(l => (
              <Chip key={l.id} active={activeLeague === l.id} onClick={() => setLeagueId(l.id)} style={{ flexShrink: 0 }}>
                {l.label}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        <AdSlot size="banner" />

        {/* Search results */}
        {isSearching && searchLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SkeletonList count={4}>{i => <SkeletonRow style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
          </div>
        )}
        {isSearching && !searchLoading && players.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <Icon name="user" size={32} style={{ margin: '0 auto 12px', color: 'var(--text-mute)' }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{t('players.noPlayersFound')}</div>
            <div style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 4 }}>{t('players.tryDifferentName')}</div>
          </div>
        )}
        {isSearching && visiblePlayers.map(p => (
          <PlayerRow key={p.id} player={p} onOpen={() => onOpenPlayer(p.id, p.leagueId)} sport={sport} />
        ))}
        {isSearching && hasMore && (
          <button onClick={() => setPage(prev => prev + 1)} style={{ width: '100%', padding: '12px 0', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 12, fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12, color: 'var(--ink)', cursor: 'pointer', letterSpacing: '0.05em' }}>
            {t('common.loadMoreUpper')} ({players.length - visiblePlayers.length} {t('players.remaining')})
          </button>
        )}

        {/* Browse by team */}
        {!isSearching && (
          <>
            {teamsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <SkeletonList count={6}>{i => <SkeletonRow style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
              </div>
            ) : teams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <Icon name="user" size={32} style={{ margin: '0 auto 12px', color: 'var(--text-mute)' }} />
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{t('teams.noTeamsFound')}</div>
                <div style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 4 }}>{t('players.tryDifferentName', 'Try a different league.')}</div>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 4 }}>
                  {t('players.browseByTeam')}
                </div>
                {teams.map(t => (
                  <TeamBrowseRow
                    key={t.id}
                    team={t}
                    onSearch={() => { setQ(t.name); }}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PlayerPhoto({ name, espnSrc, sport = 'football' }: { name: string; espnSrc: string | null; sport?: string }) {
  const wikiSrc = `/api/player-photo?name=${encodeURIComponent(name)}&sport=${sport}`;
  const [src, setSrc] = useState<string | null>(espnSrc ?? wikiSrc);
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => {
    if (src && !src.includes('/api/player-photo')) {
      setSrc(wikiSrc);
    } else {
      setFailed(true);
    }
  }, [src, wikiSrc]);

  if (failed || !src) {
    return (
      <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', border: '2px solid var(--ink)', flexShrink: 0, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="user" size={18} style={{ color: 'var(--text-mute)' }} />
      </div>
    );
  }

  return (
    <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', border: '2px solid var(--ink)', flexShrink: 0, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width={40} height={40} style={{ objectFit: 'cover', display: 'block' }} onError={handleError} />
    </div>
  );
}

function PlayerRow({ player, onOpen, sport }: { player: PlayerResult; onOpen: () => void; sport?: string }) {
  return (
    <button onClick={onOpen} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 12, boxShadow: 'var(--shadow-sm)', cursor: 'pointer', textAlign: 'start' }}>
      <PlayerPhoto name={player.name} espnSrc={player.headshot} sport={sport} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>
          {[player.position, player.teamName, player.leagueName].filter(Boolean).join(' · ')}
        </div>
      </div>
      {player.jersey && (
        <Badge tone="mute">#{player.jersey}</Badge>
      )}
      <Icon name="arrow-right" size={16} style={{ color: 'var(--text-mute)', flexShrink: 0 }} />
    </button>
  );
}

function TeamBrowseRow({ team, onSearch }: { team: RealTeam; onSearch: () => void }) {
  const { t } = useLanguage();
  return (
    <button onClick={onSearch} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 14px', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 12, boxShadow: 'var(--shadow-sm)', cursor: 'pointer', textAlign: 'start' }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, overflow: 'hidden', border: '2px solid var(--ink)', flexShrink: 0, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {team.logo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={team.logo} alt="" width={36} height={36} style={{ objectFit: 'contain', padding: 3 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 9, color: 'var(--text-dim)' }}>{team.abbr}</span>
        )}
      </div>
      {team.color && <div style={{ width: 3, height: 32, borderRadius: 2, background: team.color, flexShrink: 0 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{team.name}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>{team.leagueName}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--orange)', fontWeight: 700 }}>
        {t('teams.browseSquads', 'Search squad')} <Icon name="search" size={12} />
      </div>
    </button>
  );
}
