'use client';
import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Chip from './ui/Chip';
import TeamCrest from './ui/TeamCrest';
import Icon from './ui/Icon';
import Badge from './ui/Badge';
import { SkeletonRow, SkeletonList } from './ui/Skeletons';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FavRow {
  id: string;
  type: 'team' | 'player';
  espn_id: string;
  data: Record<string, unknown>;
  created_at: string;
}

interface FavTeam {
  id: string; name: string; abbr: string; logo: string | null; color: string | null;
  leagueId: string; leagueName: string; sport: string;
}

interface FavPlayer {
  id: string; name: string; position: string; teamName: string;
  headshot: string | null; leagueId: string; leagueName: string; sport: string;
}

interface FavoritesProps {
  onSearch: () => void;
  onBell: () => void;
  onOpenPlayer: (playerId?: string, leagueId?: string) => void;
  unread: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fetcher = (url: string) => fetch(url).then(r => r.json());

function rowToTeam(r: FavRow): FavTeam {
  const d = r.data;
  return { id: r.espn_id, name: (d.name as string) ?? '', abbr: (d.abbr as string) ?? '', logo: (d.logo as string) ?? null, color: (d.color as string) ?? null, leagueId: (d.leagueId as string) ?? '', leagueName: (d.leagueName as string) ?? '', sport: (d.sport as string) ?? '' };
}

function rowToPlayer(r: FavRow): FavPlayer {
  const d = r.data;
  return { id: r.espn_id, name: (d.name as string) ?? '', position: (d.position as string) ?? '', teamName: (d.teamName as string) ?? '', headshot: (d.headshot as string) ?? null, leagueId: (d.leagueId as string) ?? '', leagueName: (d.leagueName as string) ?? '', sport: (d.sport as string) ?? '' };
}

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── Add Modal ────────────────────────────────────────────────────────────────
function AddModal({ type, existingIds, onClose, onAdded }: { type: 'team' | 'player'; existingIds: Set<string>; onClose: () => void; onAdded: () => void }) {
  const [query, setQuery] = useState('');
  const [sport, setSport] = useState('football');
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const SPORTS = ['football', 'basketball', 'nfl', 'baseball', 'tennis', 'cricket'];

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim() || query.trim().length < 2) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (type === 'team') {
          const res = await fetch(`/api/espn/teams?sport=${sport}`);
          const data = await res.json() as { teams?: Record<string, unknown>[] };
          const q = query.toLowerCase();
          setResults((data.teams ?? []).filter(t => (t.name as string)?.toLowerCase().includes(q) || (t.abbr as string)?.toLowerCase().includes(q)).slice(0, 12));
        } else {
          const res = await fetch(`/api/espn/player-search?q=${encodeURIComponent(query)}&sport=${sport}`);
          const data = await res.json() as { players?: Record<string, unknown>[] };
          setResults((data.players ?? []).slice(0, 12));
        }
      } catch { setResults([]); }
      setLoading(false);
    }, 350);
  }, [query, sport, type]);

  const add = async (item: Record<string, unknown>) => {
    const espn_id = item.id as string;
    if (existingIds.has(espn_id) || adding) return;
    setAdding(espn_id);
    const data = type === 'team'
      ? { name: item.name, abbr: item.abbr, logo: item.logo ?? null, color: item.color ?? null, leagueId: item.leagueId, leagueName: item.leagueName, sport }
      : { name: item.name, position: item.position ?? '', teamName: item.teamName ?? '', headshot: item.headshot ?? null, leagueId: item.leagueId ?? '', leagueName: item.leagueName ?? '', sport };
    await fetch('/api/user-favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, espn_id, data }) });
    setAdding(null);
    onAdded();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'relative', background: 'var(--bg)', borderRadius: '20px 20px 0 0', border: '2.5px solid var(--ink)', borderBottom: 'none', maxHeight: '80vh', display: 'flex', flexDirection: 'column', animation: 'cs-slideUp 0.22s var(--ease-pop)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid var(--border-3)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Add {type === 'team' ? 'Team' : 'Player'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)' }}><Icon name="close" size={18} /></button>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-3)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Sport selector */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {SPORTS.map(s => (
              <button key={s} onClick={() => setSport(s)} style={{ padding: '4px 10px', borderRadius: 6, border: `1.5px solid ${sport === s ? 'var(--ink)' : 'var(--border-2)'}`, background: sport === s ? 'var(--ink)' : 'transparent', color: sport === s ? 'var(--accent)' : 'var(--text-mute)', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0, textTransform: 'capitalize' }}>{s}</button>
            ))}
          </div>
          {/* Search input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 10, padding: '9px 12px' }}>
            <Icon name="search" size={14} style={{ color: 'var(--text-mute)' }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={type === 'team' ? 'Search teams…' : 'Search players (min 2 chars)…'}
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--body)' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 24px' }}>
          {loading && <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>Searching…</div>}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>No results</div>
          )}
          {!loading && query.trim().length < 2 && (
            <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>Type to search…</div>
          )}
          {results.map(item => {
            const id = item.id as string;
            const isAdded = existingIds.has(id);
            const logoSrc = (type === 'team' ? item.logo : item.headshot) as string | null;
            return (
              <div
                key={id}
                onClick={() => !isAdded && add(item)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-3)', cursor: isAdded ? 'default' : 'pointer', opacity: isAdded ? 0.5 : 1 }}
              >
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoSrc} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', border: '1.5px solid var(--border-2)' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface-3)', border: '1.5px solid var(--border-2)', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 12, color: 'var(--text-mute)' }}>
                    {((item.name as string) ?? 'NA').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name as string}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>{(item.leagueName as string) ?? (item.teamName as string) ?? ''}</div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {adding === id ? (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>Adding…</span>
                  ) : isAdded ? (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--teal)' }}>✓</span>
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--ink)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
                      <Icon name="plus" size={14} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function FavoritesScreen({ onSearch, onBell, onOpenPlayer, unread }: FavoritesProps) {
  const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
  const [showAdd, setShowAdd] = useState<'team' | 'player' | null>(null);

  const { data, isLoading, mutate } = useSWR<{ favorites: FavRow[] }>('/api/user-favorites', fetcher);
  const rows = data?.favorites ?? [];

  const favTeams = rows.filter(r => r.type === 'team').map(rowToTeam);
  const favPlayers = rows.filter(r => r.type === 'player').map(rowToPlayer);

  const teamIds = new Set(favTeams.map(t => t.id));
  const playerIds = new Set(favPlayers.map(p => p.id));

  const removeTeam = async (id: string) => {
    await fetch('/api/user-favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'team', espn_id: id }) });
    mutate();
  };

  const removePlayer = async (id: string) => {
    await fetch('/api/user-favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'player', espn_id: id }) });
    mutate();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar
        title="Favourites"
        subtitle="Your saved teams & players"
        logoSrc="/curly-guy.png"
        onSearch={onSearch}
        onBell={onBell}
        hasNotification={unread > 0}
      />

      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Chip active={activeTab === 'teams'} onClick={() => setActiveTab('teams')}>
            Teams {favTeams.length > 0 ? `(${favTeams.length})` : ''}
          </Chip>
          <Chip active={activeTab === 'players'} onClick={() => setActiveTab('players')}>
            Players {favPlayers.length > 0 ? `(${favPlayers.length})` : ''}
          </Chip>
        </div>

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SkeletonList count={4}>{i => <SkeletonRow style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
          </div>
        )}

        {/* ── Teams ── */}
        {!isLoading && activeTab === 'teams' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>
                Favourite <span style={{ color: 'var(--orange)' }}>Teams</span>
              </div>
              <button
                onClick={() => setShowAdd('team')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--ink)', color: 'var(--accent)', border: '2px solid var(--ink)', borderRadius: 9, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                <Icon name="plus" size={13} /> Add team
              </button>
            </div>

            {favTeams.length === 0 ? (
              <Card>
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Icon name="heart" size={32} style={{ color: 'var(--text-mute)', margin: '0 auto 10px' }} />
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>No favourite teams</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Tap &ldquo;Add team&rdquo; to start following your clubs</div>
                </div>
              </Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {favTeams.map(team => (
                  <Card key={team.id} style={{ position: 'relative', padding: 12 }}>
                    <button
                      onClick={() => removeTeam(team.id)}
                      style={{ position: 'absolute', top: 10, right: 10, background: 'var(--surface-3)', border: '1px solid var(--border-2)', borderRadius: 6, width: 24, height: 24, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-mute)' }}
                    >
                      <Icon name="close" size={11} />
                    </button>
                    <TeamCrest code={team.abbr.toLowerCase().slice(0, 4)} abbr={team.abbr.slice(0, 3).toUpperCase()} logoUrl={team.logo} size="lg" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--ink)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)', textAlign: 'center', marginTop: 2 }}>{team.leagueName}</div>
                    {team.color && <div style={{ width: 8, height: 8, borderRadius: '50%', background: team.color, border: '1px solid var(--border-2)', margin: '6px auto 0' }} />}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Players ── */}
        {!isLoading && activeTab === 'players' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>
                Favourite <span style={{ color: 'var(--orange)' }}>Players</span>
              </div>
              <button
                onClick={() => setShowAdd('player')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--ink)', color: 'var(--accent)', border: '2px solid var(--ink)', borderRadius: 9, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                <Icon name="plus" size={13} /> Add player
              </button>
            </div>

            {favPlayers.length === 0 ? (
              <Card>
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Icon name="user" size={32} style={{ color: 'var(--text-mute)', margin: '0 auto 10px' }} />
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>No favourite players</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Tap &ldquo;Add player&rdquo; to follow athletes</div>
                </div>
              </Card>
            ) : (
              <Card>
                {favPlayers.map((player, i) => (
                  <div
                    key={player.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < favPlayers.length - 1 ? '1px solid var(--border-3)' : 'none' }}
                  >
                    {player.headshot ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={player.headshot} alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover', border: '2px solid var(--border-2)', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--surface-3)', border: '2px solid var(--border-2)', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: 'var(--text-mute)', flexShrink: 0 }}>
                        {(player.name ?? 'NA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        onClick={() => onOpenPlayer(player.id, player.leagueId)}
                        style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >{player.name}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 1 }}>
                        {player.teamName}{player.position ? ` · ${player.position}` : ''}{player.leagueName ? ` · ${player.leagueName}` : ''}
                      </div>
                    </div>
                    <Badge tone="mute">{player.sport}</Badge>
                    <button onClick={() => removePlayer(player.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', flexShrink: 0 }}>
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                ))}
              </Card>
            )}
          </>
        )}
      </div>

      {showAdd && (
        <AddModal
          type={showAdd}
          existingIds={showAdd === 'team' ? teamIds : playerIds}
          onClose={() => setShowAdd(null)}
          onAdded={() => { mutate(); setShowAdd(null); }}
        />
      )}
    </div>
  );
}
