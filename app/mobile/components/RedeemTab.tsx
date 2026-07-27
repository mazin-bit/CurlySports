'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Topbar from './ui/Topbar';
import Icon from './ui/Icon';
import { useAuth } from './AuthContext';

/* ── Types ───────────────────────────────────────────────── */

interface ReferralStats {
  code: string | null;
  link: string | null;
  totalReferrals: number;
  verifiedReferrals: number;
  totalEntries: number;
  hasRedeemed: boolean;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  totalReferrals: number;
  totalEntries: number;
  isCurrentUser: boolean;
}

/* ── Toast ──────────────────────────────────────────────── */

function Toast({ message, onHide }: { message: string; onHide: () => void }) {
  useEffect(() => { const t = setTimeout(onHide, 2000); return () => clearTimeout(t); }, [onHide]);
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      padding: '10px 20px', background: 'var(--ink)', color: 'var(--accent)',
      borderRadius: 999, fontFamily: "'Courier New', monospace", fontSize: 12, fontWeight: 700,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 1000,
      animation: 'cs-fadeIn 0.2s ease',
    }}>
      {message}
    </div>
  );
}

/* ── Section Title ──────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Courier New', monospace",
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      fontSize: 12,
      color: 'var(--text-mute)',
      marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────── */

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '2px solid var(--ink)',
  borderRadius: 14,
  boxShadow: '3px 3px 0 var(--ink)',
  padding: 18,
};

const btnStyle: React.CSSProperties = {
  background: 'var(--ink)',
  borderRadius: 10,
  padding: '12px 20px',
  color: 'var(--surface)',
  fontFamily: "'Courier New', monospace",
  fontWeight: 700,
  textTransform: 'uppercase',
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  letterSpacing: '0.06em',
};

const rankMedal = (rank: number): { color: string; bg: string } => {
  if (rank === 1) return { color: '#FFD700', bg: 'rgba(255,215,0,0.12)' };
  if (rank === 2) return { color: '#C0C0C0', bg: 'rgba(192,192,192,0.12)' };
  if (rank === 3) return { color: '#CD7F32', bg: 'rgba(205,127,50,0.12)' };
  return { color: 'var(--text-mute)', bg: 'transparent' };
};

/* ── Leaderboard Section (public, always visible) ──────── */

function LeaderboardSection() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchLb = useCallback(async (limit: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/referral/leaderboard?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard ?? []);
        setTotal(data.total ?? 0);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLb(10); }, [fetchLb]);

  const handleShowMore = () => {
    setExpanded(true);
    fetchLb(0);
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <SectionTitle>Leaderboard</SectionTitle>
        {total > 0 && (
          <span style={{
            fontFamily: "'Courier New', monospace", fontSize: 10, fontWeight: 700,
            color: 'var(--text-mute)', textTransform: 'uppercase',
          }}>
            {total} referrer{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading && leaderboard.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ height: 44, borderRadius: 10, background: 'var(--surface-2)', animation: 'cs-pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <Icon name="trophy" size={24} style={{ color: 'var(--text-mute)', margin: '0 auto 8px', display: 'block' }} />
          <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>No referrals yet. Be the first!</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {leaderboard.map((entry, idx) => {
              const medal = rankMedal(entry.rank);
              const isTop3 = entry.rank <= 3;
              return (
                <div key={entry.userId} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 8px',
                  borderBottom: idx < leaderboard.length - 1 ? '1px solid var(--border-3)' : 'none',
                  background: entry.isCurrentUser ? 'rgba(232,96,28,0.06)' : 'transparent',
                  borderRadius: entry.isCurrentUser ? 8 : 0,
                }}>
                  {/* Rank */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: isTop3 ? medal.bg : 'var(--surface-2)',
                    border: isTop3 ? `2px solid ${medal.color}` : '1.5px solid var(--border-2)',
                    display: 'grid', placeItems: 'center',
                    fontFamily: "'Courier New', monospace",
                    fontSize: 12, fontWeight: 900,
                    color: isTop3 ? medal.color : 'var(--text-mute)',
                    flexShrink: 0,
                  }}>
                    {isTop3 ? (
                      <Icon name="crown" size={14} style={{ color: medal.color }} />
                    ) : (
                      entry.rank
                    )}
                  </div>

                  {/* Avatar */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 9,
                    background: entry.isCurrentUser ? 'var(--orange)' : 'var(--ink)',
                    color: entry.isCurrentUser ? 'var(--surface)' : 'var(--accent)',
                    display: 'grid', placeItems: 'center',
                    fontFamily: 'var(--display)', fontWeight: 800, fontSize: 11,
                    border: '2px solid var(--ink)', flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {entry.avatar ? (
                      <img src={entry.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      entry.username.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  {/* Username */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13,
                      color: entry.isCurrentUser ? 'var(--orange)' : 'var(--ink)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {entry.username}
                      {entry.isCurrentUser && (
                        <span style={{ fontFamily: "'Courier New', monospace", fontSize: 9, fontWeight: 700, color: 'var(--orange)', marginLeft: 6, background: 'rgba(232,96,28,0.1)', padding: '2px 5px', borderRadius: 4 }}>YOU</span>
                      )}
                    </div>
                  </div>

                  {/* Referral count */}
                  <div style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 14, fontWeight: 900,
                    color: isTop3 ? medal.color : 'var(--ink)',
                  }}>
                    {entry.totalReferrals}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show More */}
          {!expanded && total > 10 && (
            <button
              onClick={handleShowMore}
              disabled={loading}
              style={{
                ...btnStyle,
                width: '100%',
                marginTop: 12,
                background: 'var(--surface-2)',
                color: 'var(--ink)',
                border: '2px solid var(--border-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {loading ? '...' : `Show All (${total})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ── User Stats Section (auth-gated) ──────────────────── */

function UserStatsSection() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendCode, setFriendCode] = useState('');
  const [redeemStatus, setRedeemStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [redeemMsg, setRedeemMsg] = useState('');
  const [toast, setToast] = useState('');

  const fetchStats = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      await fetch('/api/referral/code');
      const res = await fetch('/api/referral/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const copyText = (text: string, label?: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => setToast(label || 'Copied!')).catch(() => {});
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setToast(label || 'Copied!');
    }
  };

  const handleShare = () => {
    const code = stats?.code ?? '';
    const shareMessage = `Join me on Curly Sports! Use my code: ${code} to sign up. Download: https://curlysports.com/download`;
    if (navigator.share) {
      navigator.share({ title: 'Curly Sports Referral', text: shareMessage }).catch(() => {});
    } else {
      copyText(shareMessage, 'Share message copied!');
    }
  };

  const handleRedeem = async () => {
    const trimmed = friendCode.trim().toUpperCase();
    if (!trimmed) return;
    setRedeemStatus('loading');
    try {
      const res = await fetch('/api/referral/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setRedeemStatus('success');
        setRedeemMsg(data.message || 'Code redeemed successfully!');
        setFriendCode('');
        fetchStats();
      } else {
        setRedeemStatus('error');
        setRedeemMsg(data.error || 'Invalid code.');
      }
    } catch {
      setRedeemStatus('error');
      setRedeemMsg('Network error. Try again.');
    }
  };

  const hasRedeemed = stats?.hasRedeemed || redeemStatus === 'success';

  if (!user) {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
          <div style={{
            width: 44, height: 44, background: 'var(--surface-3)', borderRadius: 12,
            border: '2px solid var(--border-2)', display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <Icon name="user" size={20} style={{ color: 'var(--text-mute)' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 3 }}>
              Login to earn rewards
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>
              Sign in to get your referral code, invite friends, and climb the leaderboard.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[120, 90, 70].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: 14, background: 'var(--surface)', border: '2px solid var(--border-2)', animation: 'cs-pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Your Referral Code */}
      <div style={cardStyle}>
        <SectionTitle>Your Referral Code</SectionTitle>
        {stats?.code ? (
          <>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 28, fontWeight: 900, letterSpacing: '4px',
              color: 'var(--ink)', textAlign: 'center', padding: '14px 0 16px',
            }}>
              {stats.code}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => copyText(stats.code!, 'Code copied!')}
                style={{ ...btnStyle, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Icon name="copy" size={14} style={{ color: 'var(--surface)' }} />
                Copy
              </button>
              <button
                onClick={handleShare}
                style={{ ...btnStyle, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--orange)' }}
              >
                <Icon name="share" size={14} style={{ color: 'var(--surface)' }} />
                Share
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-mute)', fontSize: 13 }}>
            No code available yet.
          </div>
        )}
      </div>

      {/* Enter a Friend's Code */}
      <div style={cardStyle}>
        <SectionTitle>Enter a Friend&apos;s Code</SectionTitle>
        {hasRedeemed ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px',
            background: 'rgba(200,255,61,0.12)',
            border: '2px solid var(--accent)',
            borderRadius: 10,
          }}>
            <Icon name="check-circle" size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 12, fontWeight: 700,
              color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Already Redeemed
            </span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={friendCode}
                onChange={e => { setFriendCode(e.target.value.toUpperCase()); setRedeemStatus('idle'); setRedeemMsg(''); }}
                placeholder="e.g. CURLY1234"
                maxLength={20}
                autoCapitalize="characters"
                style={{
                  flex: 1, minWidth: 0, padding: '12px 14px',
                  background: 'var(--surface-2)', border: '2px solid var(--border-2)',
                  borderRadius: 10, fontFamily: "'Courier New', monospace",
                  fontSize: 14, fontWeight: 700, letterSpacing: '0.08em',
                  color: 'var(--ink)', outline: 'none',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--orange)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; }}
                onKeyDown={e => { if (e.key === 'Enter') handleRedeem(); }}
              />
              <button
                onClick={handleRedeem}
                disabled={!friendCode.trim() || redeemStatus === 'loading'}
                style={{
                  ...btnStyle,
                  opacity: (!friendCode.trim() || redeemStatus === 'loading') ? 0.4 : 1,
                  cursor: (!friendCode.trim() || redeemStatus === 'loading') ? 'not-allowed' : 'pointer',
                }}
              >
                {redeemStatus === 'loading' ? '...' : 'Redeem'}
              </button>
            </div>
            {redeemStatus === 'error' && redeemMsg && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--coral)', fontFamily: "'Courier New', monospace", fontWeight: 700 }}>
                {redeemMsg}
              </div>
            )}
            {redeemMsg && redeemStatus !== 'error' && redeemStatus !== 'idle' && redeemStatus !== 'loading' && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent)', fontFamily: "'Courier New', monospace", fontWeight: 700 }}>
                {redeemMsg}
              </div>
            )}
          </>
        )}
      </div>

      {/* Your Stats */}
      <div style={cardStyle}>
        <SectionTitle>Your Stats</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Referrals', value: stats?.totalReferrals ?? 0 },
            { label: 'Verified', value: stats?.verifiedReferrals ?? 0 },
            { label: 'Entries', value: stats?.totalEntries ?? 0 },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface-2)', border: '2px solid var(--border-2)',
              borderRadius: 10, padding: '14px 10px', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'var(--display)', fontWeight: 800, fontSize: 24,
                color: 'var(--ink)', lineHeight: 1,
              }}>
                {s.value}
              </div>
              <div style={{
                fontFamily: "'Courier New', monospace", fontSize: 9, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '1px',
                color: 'var(--text-mute)', marginTop: 6,
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && <Toast message={toast} onHide={() => setToast('')} />}
    </>
  );
}

/* ── Redeem Tab ─────────────────────────────────────────── */

interface RedeemTabProps {
  onSearch: () => void;
  onBell: () => void;
  unread: number;
}

export default function RedeemTab({ onSearch, onBell, unread }: RedeemTabProps) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar title="Redeem" logoSrc="/curly-guy.png" onSearch={onSearch} onBell={onBell} hasNotification={unread > 0} />

      <div className="cs-scroll" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Auth-gated: your code, friend code, stats */}
        <UserStatsSection />

        {/* Public: leaderboard always visible */}
        <LeaderboardSection />

        <div style={{ height: 8 }} />
      </div>

      <style>{`
        @keyframes cs-fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes cs-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
