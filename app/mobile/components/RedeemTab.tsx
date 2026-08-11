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

/* ── Lucky Draw Types + Spinner ─────────────────────────── */

interface DrawParticipant {
  userId: string;
  username: string;
  avatar: string | null;
  referrals: number;
}

function MobileSlotMachineSpinner({
  participants, winner, title, prizeName, onComplete,
}: {
  participants: DrawParticipant[];
  winner: DrawParticipant;
  title: string;
  prizeName: string;
  onComplete: () => void;
}) {
  const [phase, setPhase] = React.useState<'spinning' | 'slowing' | 'done'>('spinning');
  const [offset, setOffset] = React.useState(0);
  const CARD_H = 70;
  const VISIBLE = 3;

  const reel = React.useMemo(() => {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const list: DrawParticipant[] = [];
    for (let i = 0; i < 8; i++) list.push(...shuffled.sort(() => Math.random() - 0.5));
    list.push(participants[0] || winner);
    list.push(winner);
    list.push(participants[1] || participants[0] || winner);
    return list;
  }, [participants, winner]);

  const winnerIdx = reel.length - 2;
  const finalOffset = winnerIdx * CARD_H - CARD_H;

  React.useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const TOTAL = 5500;

    function animate(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / TOTAL, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setOffset(eased * finalOffset);
      if (progress < 0.6) setPhase('spinning');
      else if (progress < 1) setPhase('slowing');
      if (progress < 1) { raf = requestAnimationFrame(animate); }
      else { setOffset(finalOffset); setPhase('done'); setTimeout(onComplete, 3000); }
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [finalOffset, onComplete]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, flexDirection: 'column', gap: 16,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', textAlign: 'center' }}>
        <Icon name="sparkles" size={18} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6, color: '#c8ff3d' }} />
        {title}
      </div>
      <div style={{
        fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Courier New', monospace",
        textTransform: 'uppercase', letterSpacing: 1,
      }}>
        Prize: {prizeName}
      </div>

      <div style={{
        width: '85vw', maxWidth: 280, height: CARD_H * VISIBLE, overflow: 'hidden',
        borderRadius: 14, border: '2px solid #c8ff3d',
        background: '#0d1117', position: 'relative',
        boxShadow: '0 0 40px rgba(200,255,61,0.1)',
      }}>
        <div style={{
          position: 'absolute', top: CARD_H, left: 0, right: 0, height: CARD_H,
          border: '2px solid #c8ff3d', borderRadius: 8,
          background: phase === 'done' ? 'rgba(200,255,61,0.12)' : 'rgba(200,255,61,0.04)',
          zIndex: 2, pointerEvents: 'none',
          transition: 'background 0.3s',
          boxShadow: phase === 'done' ? '0 0 30px rgba(200,255,61,0.3)' : 'none',
        }} />

        <div style={{ transform: `translateY(-${offset}px)`, willChange: 'transform' }}>
          {reel.map((p, i) => {
            const isWin = phase === 'done' && i === winnerIdx;
            return (
              <div key={`${p.userId}-${i}`} style={{
                height: CARD_H, display: 'flex', alignItems: 'center',
                gap: 10, padding: '0 16px',
                background: isWin ? 'rgba(200,255,61,0.1)' : 'transparent',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#1a1f2e', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 12, color: '#c8ff3d',
                  flexShrink: 0, overflow: 'hidden',
                  border: isWin ? '2px solid #c8ff3d' : '1px solid rgba(255,255,255,0.1)',
                }}>
                  {p.avatar ? (
                    <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (p.username || '?').slice(0, 2).toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 13, color: isWin ? '#c8ff3d' : '#fff',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {p.username}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                    {p.referrals} referral{p.referrals !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{
                  fontSize: 10, fontFamily: "'Courier New', monospace",
                  color: 'rgba(255,255,255,0.3)', flexShrink: 0,
                }}>
                  {p.referrals} ticket{p.referrals !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
        {phase === 'spinning' && 'Spinning...'}
        {phase === 'slowing' && 'Slowing down...'}
        {phase === 'done' && (
          <span style={{ color: '#c8ff3d', fontWeight: 700, fontSize: 16 }}>
            <Icon name="crown" size={16} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
            {winner.username} wins!
          </span>
        )}
      </div>

      {phase === 'done' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10001, overflow: 'hidden' }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              width: Math.random() * 6 + 3,
              height: Math.random() * 10 + 3,
              background: ['#c8ff3d', '#ff5b3d', '#5dd9ff', '#ff8c42', '#9c27b0', '#22c55e'][i % 6],
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animation: `cs-confettiFall ${1.5 + Math.random() * 2}s ease-in forwards`,
              animationDelay: `${Math.random() * 0.5}s`,
              opacity: 0.9,
            }} />
          ))}
          <style>{`
            @keyframes cs-confettiFall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

/* ── Lucky Draw Section ──────────────────────────────────── */

function LuckyDrawSection() {
  const [upcoming, setUpcoming] = useState<{ title: string; prizeName: string; prizeValue?: string; scheduledAt: string } | null>(null);
  const [pastWinners, setPastWinners] = useState<{ id: string; title: string; prizeName: string; winnerName: string; winnerReferrals: number; drawnAt: string }[]>([]);
  const [countdown, setCountdown] = useState('');
  const [spinData, setSpinData] = useState<{
    title: string; prizeName: string;
    winner: DrawParticipant; participants: DrawParticipant[];
  } | null>(null);
  const [spinDone, setSpinDone] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/lucky-draw');
      if (res.ok) {
        const data = await res.json();
        if (data.upcoming) setUpcoming(data.upcoming);
        if (data.pastWinners) setPastWinners(data.pastWinners);
        if (data.spinning && data.spinning.winner && data.spinning.participants?.length > 0 && !spinDone) {
          setSpinData({
            title: data.spinning.title,
            prizeName: data.spinning.prizeName,
            winner: data.spinning.winner,
            participants: data.spinning.participants,
          });
        } else if (!data.spinning) {
          setSpinData(null);
        }
      }
    } catch { /* ignore */ }
  }, [spinDone]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, [fetchData]);

  useEffect(() => {
    if (!upcoming) return;
    const target = new Date(upcoming.scheduledAt).getTime();
    function tick() {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) { setCountdown('Starting soon!'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const parts: string[] = [];
      if (d > 0) parts.push(`${d}d`);
      parts.push(`${h}h`, `${m}m`, `${s}s`);
      setCountdown(parts.join(' '));
    }
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [upcoming]);

  if (!upcoming && pastWinners.length === 0 && !spinData) return null;

  return (
    <>
      {spinData && !spinDone && (
        <MobileSlotMachineSpinner
          participants={spinData.participants}
          winner={spinData.winner}
          title={spinData.title}
          prizeName={spinData.prizeName}
          onComplete={() => { setSpinDone(true); setSpinData(null); fetchData(); }}
        />
      )}

      {upcoming && (
        <div style={{
          ...cardStyle, textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg, var(--accent), var(--orange, #ff5b3d), var(--accent))',
            backgroundSize: '200% 100%',
            animation: 'cs-shimmer 2s linear infinite',
          }} />
          <SectionTitle>Lucky Draw</SectionTitle>
          <div style={{
            fontFamily: "'Courier New', monospace", fontSize: 10,
            color: 'var(--text-mute)', marginBottom: 6, textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            {upcoming.title} — {upcoming.prizeName}
            {upcoming.prizeValue ? ` (${upcoming.prizeValue})` : ''}
          </div>
          <div style={{
            fontFamily: "'Courier New', monospace", fontSize: 24, fontWeight: 900,
            color: 'var(--ink)', letterSpacing: 2, padding: '6px 0',
          }}>
            {countdown}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>
            More referrals = more chances to win
          </div>
        </div>
      )}

      {pastWinners.length > 0 && (
        <div style={cardStyle}>
          <SectionTitle>Past Winners</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pastWinners.map(w => (
              <div key={w.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', background: 'var(--bg, #f5f5f0)',
                borderRadius: 8, border: '1px solid var(--ink)',
              }}>
                <Icon name="crown" size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 12, color: 'var(--ink)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {w.winnerName}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-mute)' }}>
                    {w.prizeName} — {w.winnerReferrals} referral{w.winnerReferrals !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{
                  fontSize: 9, color: 'var(--text-mute)',
                  fontFamily: "'Courier New', monospace", flexShrink: 0,
                }}>
                  {new Date(w.drawnAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

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
  const [copied, setCopied] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);

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
    const doCopy = () => {
      setCopied(true);
      setToast(label || 'Copied!');
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(doCopy).catch(() => {});
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      doCopy();
    }
  };

  const shareMessage = `Join me on Curly Sports! Use my code: ${stats?.code ?? ''} to sign up. Download: https://curlysports.com/download`;
  const shareUrl = `https://curlysports.com/redeem?code=${stats?.code ?? ''}`;

  const handleShare = () => { setShowSharePopup(true); };
  const shareToWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank'); setShowSharePopup(false); };
  const shareToGmail = () => { window.open(`https://mail.google.com/mail/?view=cm&body=${encodeURIComponent(shareMessage)}&su=${encodeURIComponent('Join me on Curly Sports!')}`, '_blank'); setShowSharePopup(false); };
  const shareToTwitter = () => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, '_blank'); setShowSharePopup(false); };
  const shareCopyLink = () => { copyText(shareUrl, 'Link copied!'); setShowSharePopup(false); };

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
                style={{
                  ...btnStyle, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  ...(copied ? { background: '#22c55e', borderColor: '#22c55e' } : {}),
                }}
              >
                <Icon name={copied ? 'check' : 'copy'} size={14} style={{ color: 'var(--surface)' }} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleShare}
                style={{ ...btnStyle, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--orange)' }}
              >
                <Icon name="share" size={14} style={{ color: 'var(--surface)' }} />
                Share
              </button>
            </div>

            {/* Share Popup */}
            {showSharePopup && (
              <div
                onClick={() => setShowSharePopup(false)}
                style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: 'var(--surface)', borderRadius: 16,
                    width: '90%', maxWidth: 380, padding: 24,
                    animation: 'scaleIn 0.2s ease',
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 16, fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontSize: 16, fontWeight: 700, color: 'var(--ink)',
                  }}>
                    <span>Share via</span>
                    <button onClick={() => setShowSharePopup(false)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-mute)', padding: 4, borderRadius: '50%',
                      display: 'flex', alignItems: 'center',
                    }}>
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {[
                      { label: 'WhatsApp', bg: '#25d366', onClick: shareToWhatsApp, svg: (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      )},
                      { label: 'Gmail', bg: '#ea4335', onClick: shareToGmail, svg: (
                        <svg width="20" height="16" viewBox="0 0 24 18" fill="none">
                          <path d="M1.636 18h4.364V8.727L0 4.909V16.364C0 17.268.733 18 1.636 18z" fill="#4285F4"/>
                          <path d="M18 18h4.364c.904 0 1.636-.732 1.636-1.636V4.909L18 8.727z" fill="#34A853"/>
                          <path d="M18 1.636V8.727l6-3.818V2.455c0-2.024-2.311-3.178-3.927-1.963z" fill="#FBBC04"/>
                          <path d="M6 8.727V1.636L12 6l6-4.364V8.727L12 12.545z" fill="#EA4335"/>
                          <path d="M0 2.455v2.454l6 3.818V1.636L3.927.491C2.31-.723 0 .431 0 2.455z" fill="#C5221F"/>
                        </svg>
                      )},
                      { label: 'X', bg: '#000', onClick: shareToTwitter, svg: (
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>𝕏</span>
                      )},
                      { label: 'Copy Link', bg: 'var(--ink)', onClick: shareCopyLink, svg: (
                        <Icon name="link" size={20} style={{ color: '#fff' }} />
                      )},
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={item.onClick}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                          padding: '14px 8px', background: 'none',
                          border: '1.5px solid var(--border)', borderRadius: 12,
                          cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--ink)',
                        }}
                      >
                        <span style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 40, height: 40, borderRadius: '50%',
                          background: item.bg, color: '#fff',
                        }}>
                          {item.svg}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
        {/* Lucky draw countdown + past winners */}
        <LuckyDrawSection />

        {/* Auth-gated: your code, friend code, stats */}
        <UserStatsSection />

        {/* Public: leaderboard always visible */}
        <LeaderboardSection />

        <div style={{ height: 8 }} />
      </div>

      <style>{`
        @keyframes cs-fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes cs-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes cs-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes scaleIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
