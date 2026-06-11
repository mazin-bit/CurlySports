'use client';
import React, { useState, useEffect, useRef } from 'react';
import { DATA } from '../data';
import type { Match } from '../data';
import useSWR from 'swr';
import Icon from './ui/Icon';
import TeamCrest from './ui/TeamCrest';
import Card from './ui/Card';
import Chip from './ui/Chip';
import type { RealTeam } from './api';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface PlayerResult {
  id: string; name: string; jersey: string; position: string;
  headshot: string | null; teamName: string; leagueId: string; leagueName: string;
}

interface SearchProps {
  onBack: () => void;
  onOpenPlayer: (playerId?: string, leagueId?: string) => void;
  onOpenMatch: (m: Match) => void;
}

export default function SearchScreen({ onBack, onOpenPlayer, onOpenMatch }: SearchProps) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [sport, setSport] = useState('football');
  const ref = useRef<HTMLInputElement>(null);
  const D = DATA;

  useEffect(() => { ref.current?.focus(); }, []);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const ql = debouncedQ.toLowerCase();

  // Fetch real teams for current sport (used when no query)
  const { data: teamsData } = useSWR<{ teams: RealTeam[] }>(
    `/api/espn/teams?sport=${sport}&league=eng.1`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Fetch real players when query is 2+ chars
  const { data: playersData, isLoading: playersLoading } = useSWR<{ players: PlayerResult[] }>(
    ql.length >= 2 ? `/api/espn/player-search?q=${encodeURIComponent(ql)}&sport=${sport}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const teams = teamsData?.teams ?? [];
  const players = playersData?.players ?? [];

  // Filter teams by query client-side when query present
  const filteredTeams = ql.length >= 2
    ? teams.filter(t => t.name.toLowerCase().includes(ql) || t.abbr.toLowerCase().includes(ql))
    : [];

  const hasResults = filteredTeams.length > 0 || players.length > 0;
  const isSearching = ql.length >= 2;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--bg-2)', borderBottom: '2.5px solid var(--ink)', flexShrink: 0 }}>
        <button onClick={onBack} aria-label="Back" style={{ width: 38, height: 38, flexShrink: 0, background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 11, display: 'grid', placeItems: 'center', color: 'var(--ink)', transform: 'scaleX(-1)', cursor: 'pointer' }}>
          <Icon name="arrow-right" size={18} />
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 12, padding: '0 12px', height: 40, boxShadow: 'var(--shadow-sm)' }}>
          <Icon name="search" size={17} style={{ color: 'var(--text-mute)' }} />
          <input
            ref={ref}
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Teams, players, leagues…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'var(--ink)', fontFamily: 'var(--body)' }}
          />
          {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', display: 'grid', placeItems: 'center' }}><Icon name="close" size={15} strokeWidth={2.5} /></button>}
        </div>
      </header>

      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '16px 14px 96px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Empty state: trending + latest match */}
        {!isSearching && (
          <>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 10 }}>Trending now</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {D.trending.map(t => <Chip key={t} onClick={() => setQ(t.split(' ')[0])}><Icon name="flame" size={13} style={{ color: 'var(--orange)' }} /> {t}</Chip>)}
              </div>
            </div>

            {/* Sport filter chips */}
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 10 }}>Browse by sport</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['football', 'basketball', 'nfl', 'cricket'].map(s => (
                  <Chip key={s} active={sport === s} onClick={() => setSport(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</Chip>
                ))}
              </div>
            </div>

            {/* Top teams in sport */}
            {teams.length > 0 && (
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 10 }}>Top teams</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {teams.slice(0, 6).map(t => (
                    <button key={t.id} style={resultRow()} onClick={() => onOpenPlayer()}>
                      <TeamCrest code={t.abbr.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4)} abbr={t.abbr.slice(0, 3)} logoUrl={t.logo} />
                      <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{t.name}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>{t.leagueName}</div>
                      </div>
                      <Icon name="arrow-right" size={16} style={{ color: 'var(--text-mute)' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 10 }}>Jump back in</div>
              <Card subtitle="Live · 74'" title="Man United vs Chelsea" action="Open →" tappable onClick={() => onOpenMatch(D.liveFootball[0])} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TeamCrest code="mun" abbr="MUN" />
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>2 · 1</span>
                  <TeamCrest code="che" abbr="CHE" />
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--coral)', fontWeight: 700 }}>LIVE</span>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Loading */}
        {isSearching && playersLoading && (
          <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>Searching…</div>
        )}

        {/* No results */}
        {isSearching && !playersLoading && !hasResults && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-mute)' }}>
            <Icon name="search" size={32} style={{ margin: '0 auto 12px', color: 'var(--text-mute)' }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>No results for &quot;{q}&quot;</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try a club or player name.</div>
          </div>
        )}

        {/* Team results */}
        {isSearching && filteredTeams.length > 0 && (
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 10 }}>Teams</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredTeams.slice(0, 8).map(t => (
                <button key={t.id} onClick={() => onOpenPlayer()} style={resultRow()}>
                  <TeamCrest code={t.abbr.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4)} abbr={t.abbr.slice(0, 3)} logoUrl={t.logo} />
                  <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{t.name}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>{t.leagueName}</div>
                  </div>
                  <Icon name="arrow-right" size={16} style={{ color: 'var(--text-mute)' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Player results */}
        {isSearching && players.length > 0 && (
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 10 }}>Players</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {players.slice(0, 12).map(p => (
                <button key={p.id} onClick={() => onOpenPlayer(p.id, p.leagueId)} style={resultRow()}>
                  {p.headshot ? (
                    <div style={{ width: 32, height: 32, borderRadius: 9, overflow: 'hidden', border: '2px solid var(--ink)', flexShrink: 0, background: 'var(--surface-3)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.headshot} alt="" width={32} height={32} style={{ objectFit: 'cover', display: 'block' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--ink)', color: 'var(--accent)', display: 'grid', placeItems: 'center', border: '2px solid var(--ink)', flexShrink: 0 }}>
                      <Icon name="user" size={16} />
                    </div>
                  )}
                  <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{p.name}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>{p.position} · {p.teamName} · {p.leagueName}</div>
                  </div>
                  <Icon name="arrow-right" size={16} style={{ color: 'var(--text-mute)' }} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function resultRow(): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 12, boxShadow: 'var(--shadow-sm)', cursor: 'pointer' };
}
