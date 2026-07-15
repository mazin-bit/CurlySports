'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Icon from './ui/Icon';

/* ── Types ───────────────────────────────────────────────── */

interface ChallengeTeam {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
}

interface ChallengeDetail {
  id: string;
  title: string;
  status: 'active' | 'voting_closed' | 'settled';
  teamA: ChallengeTeam;
  teamB: ChallengeTeam;
  matchDate: string;
  votingClosesAt: string;
  winnerCount: number;
  totalVotes: number;
  userVote?: 'A' | 'B' | null;
  result?: 'A' | 'B' | 'draw' | null;
  sport: string;
  userEntry?: {
    prediction: 'A' | 'B';
    baseEntries: number;
    referralEntries: number;
    totalEntries: number;
  };
  referralCode?: string;
  leaderboard?: LeaderboardEntry[];
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  entries: number;
  isCurrentUser?: boolean;
}

interface ChallengeDetailScreenProps {
  challengeId: string;
  onBack: () => void;
  onLeaderboard: (id: string) => void;
  onReferral: () => void;
}

/* ── Countdown hook ─────────────────────────────────────── */

function useCountdown(targetDate: string) {
  const compute = useCallback(() => {
    const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s, expired: diff === 0 };
  }, [targetDate]);

  const [time, setTime] = useState(compute);
  useEffect(() => {
    const id = setInterval(() => setTime(compute()), 1000);
    return () => clearInterval(id);
  }, [compute]);
  return time;
}

function CountdownDisplay({ targetDate }: { targetDate: string }) {
  const { d, h, m, s, expired } = useCountdown(targetDate);
  if (expired) return <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--coral)', fontWeight: 700 }}>Voting closed</span>;
  return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>
      {d}d {h}h {m}m {s}s
    </span>
  );
}

/* ── Toast ──────────────────────────────────────────────── */

function Toast({ message, onHide }: { message: string; onHide: () => void }) {
  useEffect(() => { const t = setTimeout(onHide, 2000); return () => clearTimeout(t); }, [onHide]);
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      padding: '10px 20px', background: 'var(--ink)', color: 'var(--accent)',
      borderRadius: 999, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 1000,
      animation: 'cs-fadeIn 0.2s ease',
    }}>
      {message}
    </div>
  );
}

/* ── Main Screen ────────────────────────────────────────── */

export default function ChallengeDetailScreen({ challengeId, onBack, onLeaderboard, onReferral }: ChallengeDetailScreenProps) {
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [votingFor, setVotingFor] = useState<'A' | 'B' | null>(null);
  const [toast, setToast] = useState('');

  const fetchDetail = useCallback(async () => {
    try {
      const token = localStorage.getItem('cs_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/challenges/${challengeId}`, { headers });
      if (res.ok) {
        const raw = await res.json();
        const c = raw.challenge ?? raw;
        // API returns teamA/teamB as strings — transform to ChallengeTeam objects
        if (typeof c.teamA === 'string') {
          c.teamA = { id: 'teamA', name: c.teamA, shortName: (c.teamA as string).slice(0, 3).toUpperCase(), logo: c.teamALogo ?? undefined };
        }
        if (typeof c.teamB === 'string') {
          c.teamB = { id: 'teamB', name: c.teamB, shortName: (c.teamB as string).slice(0, 3).toUpperCase(), logo: c.teamBLogo ?? undefined };
        }
        setChallenge(c);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [challengeId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleVote = async (side: 'A' | 'B') => {
    if (!challenge || challenge.userVote || votingFor) return;
    setVotingFor(side);
    try {
      const token = localStorage.getItem('cs_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers,
        body: JSON.stringify({ challengeId, selectedTeam: side === 'A' ? 'teamA' : 'teamB' }),
      });
      if (res.ok) {
        setChallenge(prev => prev ? {
          ...prev,
          userVote: side,
          userEntry: { prediction: side, baseEntries: 1, referralEntries: 0, totalEntries: 1 },
        } : prev);
      }
    } catch { /* ignore */ }
    finally { setVotingFor(null); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => setToast('Copied!')).catch(() => {});
  };

  const shareWhatsApp = (text: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareTwitter = (text: string) => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '2.5px solid var(--ink)', background: 'var(--bg-2)', flexShrink: 0 }}>
          <button onClick={onBack} className="cs-tap" style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 8, cursor: 'pointer' }}>
            <Icon name="chevron-left" size={16} style={{ color: 'var(--ink)' }} />
          </button>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Challenge</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border-2)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'cs-spin 0.8s linear infinite' }} />
        </div>
        <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '2.5px solid var(--ink)', background: 'var(--bg-2)', flexShrink: 0 }}>
          <button onClick={onBack} className="cs-tap" style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 8, cursor: 'pointer' }}>
            <Icon name="chevron-left" size={16} style={{ color: 'var(--ink)' }} />
          </button>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Challenge</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, textAlign: 'center' }}>
          <Icon name="close" size={32} style={{ color: 'var(--coral)' }} />
          <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Challenge not found</div>
          <button onClick={onBack} className="cs-tap" style={{ marginTop: 8, padding: '10px 20px', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 10, fontWeight: 700, fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}>Go Back</button>
        </div>
      </div>
    );
  }

  const hasVoted = !!challenge.userVote;
  const votingExpired = new Date(challenge.votingClosesAt).getTime() <= Date.now();
  const referralLink = challenge.referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite?ref=${challenge.referralCode}`
    : '';
  const shareText = `Join my prediction challenge on CurlySports! ${challenge.teamA.name} vs ${challenge.teamB.name}. Use my code: ${challenge.referralCode ?? ''} ${referralLink}`;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '2.5px solid var(--ink)', background: 'var(--bg-2)', flexShrink: 0 }}>
        <button onClick={onBack} className="cs-tap" style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 8, cursor: 'pointer' }}>
          <Icon name="chevron-left" size={16} style={{ color: 'var(--ink)' }} />
        </button>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)', flex: 1 }}>Challenge</span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 10px', borderRadius: 999,
          background: challenge.status === 'active' ? 'rgba(200,255,61,0.15)' : 'var(--surface-2)',
          border: `1.5px solid ${challenge.status === 'active' ? 'var(--accent)' : 'var(--border-2)'}`,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: challenge.status === 'active' ? 'var(--accent)' : 'var(--text-mute)' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, color: challenge.status === 'active' ? 'var(--accent)' : 'var(--text-mute)', textTransform: 'uppercase' }}>
            {challenge.status === 'active' ? 'Live' : challenge.status === 'settled' ? 'Settled' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="cs-scroll" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Challenge Info Card */}
        <div style={{ background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 14, padding: 16 }}>
          {/* Teams */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface-2)', border: '2px solid var(--border-2)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                {challenge.teamA.logo
                  ? <img src={challenge.teamA.logo} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                  : <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--text-dim)' }}>{challenge.teamA.shortName.slice(0, 2)}</span>
                }
              </div>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13, color: 'var(--ink)', textAlign: 'center' }}>{challenge.teamA.name}</span>
            </div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 18, color: 'var(--text-mute)', flexShrink: 0 }}>VS</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface-2)', border: '2px solid var(--border-2)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                {challenge.teamB.logo
                  ? <img src={challenge.teamB.logo} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                  : <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--text-dim)' }}>{challenge.teamB.shortName.slice(0, 2)}</span>
                }
              </div>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13, color: 'var(--ink)', textAlign: 'center' }}>{challenge.teamB.name}</span>
            </div>
          </div>

          {/* Match date + Countdown */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1.5px solid var(--border-2)', borderBottom: '1.5px solid var(--border-2)', marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)', fontWeight: 600 }}>
              {new Date(challenge.matchDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            <CountdownDisplay targetDate={challenge.votingClosesAt} />
          </div>

          {/* Vote Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['A', 'B'] as const).map(side => {
              const team = side === 'A' ? challenge.teamA : challenge.teamB;
              const isSelected = challenge.userVote === side;
              const isOther = hasVoted && !isSelected;
              const disabled = hasVoted || votingExpired;
              const isVoting = votingFor === side;

              return (
                <button
                  key={side}
                  onClick={() => !disabled && handleVote(side)}
                  disabled={disabled}
                  className="cs-tap"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', minHeight: 48, padding: '12px 16px',
                    background: isSelected ? 'var(--accent)' : isOther ? 'var(--surface-2)' : 'var(--surface)',
                    border: `2px solid ${isSelected ? 'var(--ink)' : isOther ? 'var(--border-2)' : 'var(--ink)'}`,
                    borderRadius: 10,
                    fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14,
                    color: isSelected ? 'var(--ink)' : isOther ? 'var(--text-mute)' : 'var(--ink)',
                    cursor: disabled ? 'default' : 'pointer',
                    opacity: isOther ? 0.5 : 1,
                    boxShadow: isSelected ? '2px 2px 0 var(--ink)' : 'none',
                  }}
                >
                  {isVoting && <div style={{ width: 14, height: 14, border: '2px solid var(--ink)', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'cs-spin 0.6s linear infinite' }} />}
                  {isSelected && !isVoting && <Icon name="check-circle" size={16} style={{ color: 'var(--ink)' }} />}
                  {team.name} to Win
                </button>
              );
            })}
          </div>
        </div>

        {/* Your Entry Card */}
        {challenge.userEntry && (
          <div style={{ background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 12 }}>Your Entry</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Icon name="check-circle" size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontFamily: 'var(--body)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                Picked: {challenge.userEntry.prediction === 'A' ? challenge.teamA.name : challenge.teamB.name}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'Base', value: challenge.userEntry.baseEntries },
                { label: 'Referral', value: challenge.userEntry.referralEntries },
                { label: 'Total', value: challenge.userEntry.totalEntries },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1.5px solid var(--border-2)' }}>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: item.label === 'Total' ? 'var(--accent)' : 'var(--ink)', lineHeight: 1 }}>{item.value}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, color: 'var(--text-mute)', marginTop: 4, textTransform: 'uppercase' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referral Card */}
        {hasVoted && challenge.referralCode && (
          <div style={{ background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 12 }}>Refer Friends, Earn Entries</div>

            {/* Code display */}
            <div
              onClick={() => copyToClipboard(challenge.referralCode!)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px 16px', marginBottom: 12,
                background: 'var(--surface-2)', border: '2px dashed var(--accent)',
                borderRadius: 10, cursor: 'pointer',
              }}
            >
              <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.15em' }}>
                {challenge.referralCode}
              </span>
              <Icon name="copy" size={16} style={{ color: 'var(--text-mute)' }} />
            </div>

            {/* Share buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => copyToClipboard(referralLink)}
                className="cs-tap"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 12px', background: 'var(--surface)', border: '2px solid var(--ink)',
                  borderRadius: 10, fontFamily: 'var(--body)', fontSize: 12, fontWeight: 700,
                  color: 'var(--ink)', cursor: 'pointer',
                }}
              >
                <Icon name="link" size={14} />
                Copy Link
              </button>
              <button
                onClick={() => shareWhatsApp(shareText)}
                className="cs-tap"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 12px', background: '#25D366', border: '2px solid var(--ink)',
                  borderRadius: 10, fontFamily: 'var(--body)', fontSize: 12, fontWeight: 700,
                  color: '#fff', cursor: 'pointer',
                }}
              >
                WhatsApp
              </button>
              <button
                onClick={() => shareTwitter(shareText)}
                className="cs-tap"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 12px', background: 'var(--ink)', border: '2px solid var(--ink)',
                  borderRadius: 10, fontFamily: 'var(--body)', fontSize: 12, fontWeight: 700,
                  color: '#fff', cursor: 'pointer',
                }}
              >
                Twitter
              </button>
            </div>

            {/* View full referral screen */}
            <button
              onClick={onReferral}
              className="cs-tap"
              style={{
                width: '100%', marginTop: 10, padding: '10px 16px',
                background: 'transparent', border: 'none',
                fontFamily: 'var(--body)', fontSize: 12, fontWeight: 600,
                color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              Manage Referrals
            </button>
          </div>
        )}

        {/* Leaderboard Preview */}
        {challenge.leaderboard && challenge.leaderboard.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-mute)', textTransform: 'uppercase' }}>Leaderboard</div>
              <button
                onClick={() => onLeaderboard(challengeId)}
                className="cs-tap"
                style={{ padding: '4px 10px', background: 'transparent', border: '1.5px solid var(--accent)', borderRadius: 999, fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--accent)', cursor: 'pointer' }}
              >
                View Full
              </button>
            </div>
            {challenge.leaderboard.slice(0, 10).map((entry, idx) => {
              const medalColor = idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : undefined;
              return (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                  borderBottom: idx < (challenge.leaderboard?.length ?? 0) - 1 && idx < 9 ? '1px solid var(--border-2)' : 'none',
                  background: entry.isCurrentUser ? 'rgba(200,255,61,0.06)' : 'transparent',
                }}>
                  <div style={{ width: 24, textAlign: 'center', flexShrink: 0 }}>
                    {medalColor
                      ? <Icon name="medal" size={16} style={{ color: medalColor }} />
                      : <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-mute)' }}>{entry.rank}</span>
                    }
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: entry.isCurrentUser ? 'var(--accent)' : 'var(--surface-2)',
                    border: `1.5px solid ${entry.isCurrentUser ? 'var(--ink)' : 'var(--border-2)'}`,
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 10, color: entry.isCurrentUser ? 'var(--ink)' : 'var(--text-dim)' }}>
                      {entry.username.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span style={{ flex: 1, fontFamily: 'var(--body)', fontSize: 13, fontWeight: entry.isCurrentUser ? 700 : 500, color: entry.isCurrentUser ? 'var(--accent)' : 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.username} {entry.isCurrentUser && '(you)'}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', flexShrink: 0 }}>{entry.entries}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Mystery Prize */}
        <div style={{
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)',
          border: '2px solid var(--ink)', borderRadius: 14, padding: 24,
          textAlign: 'center', boxShadow: '4px 4px 0 var(--ink)',
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--accent)', border: '2px solid var(--ink)', display: 'grid', placeItems: 'center', margin: '0 auto 12px', boxShadow: '3px 3px 0 var(--ink)' }}>
            <Icon name="gift" size={28} style={{ color: 'var(--ink)' }} />
          </div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 18, color: 'var(--ink)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Mystery Prize</div>
          <div style={{ fontFamily: 'var(--body)', fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
            {challenge.winnerCount} lucky winners will receive an exclusive mystery prize!
          </div>
        </div>

        {/* Bottom spacer */}
        <div style={{ height: 16 }} />
      </div>

      {toast && <Toast message={toast} onHide={() => setToast('')} />}
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } } @keyframes cs-fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}
