'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Icon from './ui/Icon';

/* ── Types ───────────────────────────────────────────────── */

interface LeaderboardEntry {
  rank: number;
  username: string;
  entries: number;
  isCurrentUser?: boolean;
}

interface LeaderboardScreenProps {
  challengeId: string;
  onBack: () => void;
}

/* ── Main Screen ────────────────────────────────────────── */

export default function LeaderboardScreen({ challengeId, onBack }: LeaderboardScreenProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const fetchLeaderboard = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const token = localStorage.getItem('cs_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/challenges/${challengeId}/leaderboard?page=${pageNum}&limit=20`, { headers });
      if (res.ok) {
        const data = await res.json();
        const list: LeaderboardEntry[] = data.entries ?? [];
        setEntries(prev => append ? [...prev, ...list] : list);
        setHasMore(data.hasMore ?? false);
        if (data.currentUser) setCurrentUser(data.currentUser);
      }
    } catch { /* ignore */ }
    finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [challengeId]);

  useEffect(() => { fetchLeaderboard(1); }, [fetchLeaderboard]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLeaderboard(nextPage, true);
  };

  const getMedalColor = (rank: number): string | undefined => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return undefined;
  };

  const getRowBg = (rank: number): string => {
    if (rank === 1) return 'rgba(255,215,0,0.06)';
    if (rank === 2) return 'rgba(192,192,192,0.05)';
    if (rank === 3) return 'rgba(205,127,50,0.05)';
    return 'transparent';
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '2.5px solid var(--ink)', background: 'var(--bg-2)', flexShrink: 0 }}>
        <button onClick={onBack} className="cs-tap" style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 8, cursor: 'pointer' }}>
          <Icon name="chevron-left" size={16} style={{ color: 'var(--ink)' }} />
        </button>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)', flex: 1 }}>Leaderboard</span>
        <Icon name="crown" size={18} style={{ color: 'var(--accent)' }} />
      </div>

      {/* Current User Pinned Row */}
      {currentUser && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
          background: 'rgba(200,255,61,0.08)', borderBottom: '2px solid var(--accent)',
          flexShrink: 0,
        }}>
          <div style={{ width: 24, textAlign: 'center', flexShrink: 0 }}>
            {getMedalColor(currentUser.rank)
              ? <Icon name="medal" size={16} style={{ color: getMedalColor(currentUser.rank) }} />
              : <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>#{currentUser.rank}</span>
            }
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'var(--accent)', border: '2px solid var(--ink)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 11, color: 'var(--ink)' }}>
              {currentUser.username.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <span style={{ flex: 1, fontFamily: 'var(--body)', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
            {currentUser.username} (you)
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
            {currentUser.entries} entries
          </span>
        </div>
      )}

      {/* List */}
      <div className="cs-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
                <div style={{ width: 24, height: 16, borderRadius: 4, background: 'var(--surface-2)', animation: 'cs-pulse 1.5s ease-in-out infinite' }} />
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--surface-2)', animation: 'cs-pulse 1.5s ease-in-out infinite' }} />
                <div style={{ flex: 1, height: 14, borderRadius: 4, background: 'var(--surface-2)', animation: 'cs-pulse 1.5s ease-in-out infinite' }} />
                <div style={{ width: 40, height: 14, borderRadius: 4, background: 'var(--surface-2)', animation: 'cs-pulse 1.5s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Icon name="users" size={32} style={{ color: 'var(--text-mute)', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 6 }}>No entries yet</div>
            <div style={{ fontFamily: 'var(--body)', fontSize: 12, color: 'var(--text-mute)' }}>Be the first to vote and appear on the leaderboard!</div>
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {entries.map((entry, idx) => {
              const medalColor = getMedalColor(entry.rank);
              const isUser = entry.isCurrentUser;

              return (
                <div key={`${entry.rank}-${idx}`} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px',
                  background: isUser ? 'rgba(200,255,61,0.06)' : getRowBg(entry.rank),
                  borderLeft: isUser ? '3px solid var(--accent)' : '3px solid transparent',
                }}>
                  {/* Rank */}
                  <div style={{ width: 24, textAlign: 'center', flexShrink: 0 }}>
                    {medalColor
                      ? <Icon name="medal" size={18} style={{ color: medalColor }} />
                      : <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-mute)' }}>{entry.rank}</span>
                    }
                  </div>

                  {/* Avatar fallback */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: isUser ? 'var(--accent)' : entry.rank <= 3 ? 'var(--surface)' : 'var(--surface-2)',
                    border: `1.5px solid ${isUser ? 'var(--ink)' : entry.rank <= 3 ? 'var(--ink)' : 'var(--border-2)'}`,
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    <span style={{
                      fontFamily: 'var(--display)', fontWeight: 800, fontSize: 11,
                      color: isUser ? 'var(--ink)' : entry.rank <= 3 ? 'var(--ink)' : 'var(--text-dim)',
                    }}>
                      {entry.username.slice(0, 2).toUpperCase()}
                    </span>
                  </div>

                  {/* Username */}
                  <span style={{
                    flex: 1, fontFamily: 'var(--body)', fontSize: 13,
                    fontWeight: isUser || entry.rank <= 3 ? 700 : 500,
                    color: isUser ? 'var(--accent)' : 'var(--ink)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {entry.username} {isUser && '(you)'}
                  </span>

                  {/* Entries */}
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
                    color: isUser ? 'var(--accent)' : entry.rank <= 3 ? 'var(--ink)' : 'var(--text-dim)',
                    flexShrink: 0,
                  }}>
                    {entry.entries}
                  </span>
                </div>
              );
            })}

            {/* Load More */}
            {hasMore && (
              <div style={{ padding: '16px 16px 24px' }}>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="cs-tap"
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'var(--surface)', border: '2px solid var(--ink)',
                    borderRadius: 10, fontFamily: 'var(--display)', fontSize: 13,
                    fontWeight: 700, color: 'var(--ink)', cursor: loadingMore ? 'default' : 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}

            {/* Bottom spacer */}
            <div style={{ height: 16 }} />
          </div>
        )}
      </div>
    </div>
  );
}
