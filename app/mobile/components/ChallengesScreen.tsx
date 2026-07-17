'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import Topbar from './ui/Topbar';
import Icon from './ui/Icon';

/* ── Types ───────────────────────────────────────────────── */

interface ChallengeTeam {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
}

interface Challenge {
  id: string;
  title: string;
  status: 'active' | 'voting_closed' | 'settled';
  teamA: ChallengeTeam;
  teamB: ChallengeTeam;
  matchDate: string;
  winnerCount: number;
  totalVotes: number;
  userVote?: 'teamA' | 'teamB' | null;
  result?: string | null;
  sport: string;
}

interface ReferralStats {
  code: string;
  link: string;
  verified: number;
  total: number;
  totalEntries: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  totalReferrals: number;
  totalEntries: number;
  isCurrentUser?: boolean;
}

interface ChallengesScreenProps {
  sport: string;
  onOpenChallenge: (id: string) => void;
  onSearch?: () => void;
  onBell?: () => void;
  unread?: number;
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

/* ── CountdownDisplay ───────────────────────────────────── */

function CountdownDisplay({ targetDate }: { targetDate: string }) {
  const { d, h, m, s, expired } = useCountdown(targetDate);
  if (expired) return <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--coral)', fontWeight: 700 }}>Voting closed</span>;
  return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>
      {d}d {h}h {m}m {s}s
    </span>
  );
}

/* ── TeamBadge ──────────────────────────────────────────── */

function TeamBadge({ team }: { team: ChallengeTeam }) {
  const [imgError, setImgError] = useState(false);
  const hasValidLogo = team.logo && /\.(png|jpg|jpeg|gif|svg|webp)(\?|$)/i.test(team.logo);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--ink)', border: '2px solid var(--ink)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
        {hasValidLogo && !imgError
          ? <img src={team.logo!} alt="" style={{ width: 30, height: 30, objectFit: 'contain' }} onError={() => setImgError(true)} />
          : <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 15, color: 'var(--accent)' }}>{team.shortName.slice(0, 3)}</span>
        }
      </div>
      <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13, color: 'var(--ink)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
        {team.name}
      </span>
    </div>
  );
}

/* ── ActiveChallengeCard ────────────────────────────────── */

function ActiveChallengeCard({ challenge, onVote, onTap }: { challenge: Challenge; onVote: (side: 'teamA' | 'teamB') => void; onTap: () => void }) {
  const hasVoted = !!challenge.userVote;
  const votingExpired = new Date(challenge.matchDate).getTime() <= Date.now();

  return (
    <div
      onClick={onTap}
      style={{ background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 14, padding: 16, cursor: 'pointer', boxShadow: '4px 4px 0 var(--ink)' }}
    >
      {/* Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--accent)', borderRadius: 999, border: '1.5px solid var(--ink)' }}>
          <Icon name="trophy" size={12} style={{ color: 'var(--ink)' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 800, color: 'var(--ink)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mystery Prize Challenge</span>
        </div>
      </div>

      {/* Teams VS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <TeamBadge team={challenge.teamA} />
        <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 16, color: 'var(--text-mute)', flexShrink: 0 }}>VS</div>
        <TeamBadge team={challenge.teamB} />
      </div>

      {/* Vote Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }} onClick={e => e.stopPropagation()}>
        {(['teamA', 'teamB'] as const).map(side => {
          const team = side === 'teamA' ? challenge.teamA : challenge.teamB;
          const isSelected = challenge.userVote === side;
          const isOther = hasVoted && !isSelected;
          const disabled = hasVoted || votingExpired;

          return (
            <button
              key={side}
              onClick={() => !disabled && onVote(side)}
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
              {isSelected && <Icon name="check-circle" size={16} style={{ color: 'var(--ink)' }} />}
              {team.name} to Win
            </button>
          );
        })}
      </div>

      {/* Countdown */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="clock" size={13} style={{ color: 'var(--text-mute)' }} />
          <CountdownDisplay targetDate={challenge.matchDate} />
        </div>
      </div>

      {/* Winner count + subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Icon name="gift" size={14} style={{ color: 'var(--accent)' }} />
        <span style={{ fontFamily: 'var(--body)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
          {challenge.winnerCount} Winners Will Be Chosen
        </span>
      </div>
      <div style={{ fontFamily: 'var(--body)', fontSize: 11, color: 'var(--text-mute)' }}>
        Voting closes at kickoff
      </div>
    </div>
  );
}

/* ── PastChallengeCard ──────────────────────────────────── */

function PastChallengeCard({ challenge, onTap }: { challenge: Challenge; onTap: () => void }) {
  const userCorrect = challenge.result && challenge.userVote && challenge.result === challenge.userVote;
  const resultLabel = challenge.result === 'draw' ? 'Draw' :
    challenge.result === 'teamA' ? `${challenge.teamA.shortName} Won` :
    challenge.result === 'teamB' ? `${challenge.teamB.shortName} Won` : 'Pending';

  return (
    <div onClick={onTap} className="cs-tap" style={{ background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--ink)', border: '1.5px solid var(--ink)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)' }}>{challenge.teamA.shortName.slice(0, 3)}</span>
          </div>
          <span style={{ fontFamily: 'var(--body)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
            {challenge.teamA.shortName} vs {challenge.teamB.shortName}
          </span>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--ink)', border: '1.5px solid var(--ink)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)' }}>{challenge.teamB.shortName.slice(0, 3)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)', fontWeight: 600 }}>{resultLabel}</span>
        {challenge.userVote && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 999,
            background: userCorrect ? 'rgba(200,255,61,0.15)' : 'rgba(255,91,61,0.1)',
            border: `1.5px solid ${userCorrect ? 'var(--accent)' : 'var(--coral)'}`,
          }}>
            <Icon name={userCorrect ? 'check-circle' : 'close'} size={12} style={{ color: userCorrect ? 'var(--accent)' : 'var(--coral)' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: userCorrect ? 'var(--accent)' : 'var(--coral)' }}>
              {userCorrect ? 'Correct' : 'Incorrect'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Toast ──────────────────────────────────────────────── */

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', top: 60, left: 16, right: 16, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10, padding: 14,
      background: 'var(--ink)', border: '2px solid var(--accent)', borderRadius: 14,
      animation: 'cs-slide-down 0.3s ease-out',
    }}>
      <Icon name="spark" size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
      <span style={{ flex: 1, fontFamily: 'var(--body)', fontSize: 13, fontWeight: 600, color: '#fff' }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
        <Icon name="close" size={14} style={{ color: 'var(--text-mute)' }} />
      </button>
    </div>
  );
}

/* ── Main Screen ────────────────────────────────────────── */

export default function ChallengesScreen({ sport, onOpenChallenge, onSearch, onBell, unread }: ChallengesScreenProps) {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasRedeemed, setHasRedeemed] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const prevEntriesRef = useRef<number | null>(null);
  const fetchedRef = useRef(false);

  /* ── Clipboard ── */

  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  /* ── Redeem ── */

  async function handleRedeem() {
    const trimmed = redeemCode.trim();
    if (!trimmed || redeemLoading) return;
    setRedeemLoading(true);
    setRedeemMsg(null);
    try {
      const res = await fetch('/api/referral/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setRedeemMsg({ type: 'success', text: data.message });
        setRedeemCode('');
        setHasRedeemed(true);
        fetchData();
      } else {
        setRedeemMsg({ type: 'error', text: data.error || 'Failed to redeem code.' });
      }
    } catch {
      setRedeemMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setRedeemLoading(false);
    }
  }

  /* ── Data fetching ── */

  const fetchData = useCallback(async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const opts = { headers, credentials: 'include' as const };

      // Fetch challenges + leaderboard in parallel
      const [cRes, lbRes] = await Promise.allSettled([
        fetch(`/api/challenges?sport=${sport}`, opts),
        fetch('/api/referral/leaderboard', opts),
      ]);

      if (cRes.status === 'fulfilled' && cRes.value.ok) {
        const data = await cRes.value.json();
        const mapped = (data.challenges ?? []).map((c: Record<string, unknown>) => ({
          ...c,
          teamA: typeof c.teamA === 'string'
            ? { id: 'teamA', name: c.teamA, shortName: (c.teamA as string).slice(0, 3).toUpperCase(), logo: c.teamALogo ?? undefined }
            : c.teamA,
          teamB: typeof c.teamB === 'string'
            ? { id: 'teamB', name: c.teamB, shortName: (c.teamB as string).slice(0, 3).toUpperCase(), logo: c.teamBLogo ?? undefined }
            : c.teamB,
        }));
        setChallenges(mapped);
      }

      if (lbRes.status === 'fulfilled' && lbRes.value.ok) {
        const data = await lbRes.value.json();
        setLeaderboard(data.entries ?? []);
      }

      // Fetch referral data (cookies handle auth automatically)
      try {
        const [codeRes, statsRes] = await Promise.allSettled([
          fetch('/api/referral/code', { headers, credentials: 'include' }),
          fetch('/api/referral/stats', { headers, credentials: 'include' }),
        ]);

        if (codeRes.status === 'fulfilled' && codeRes.value.ok &&
            statsRes.status === 'fulfilled' && statsRes.value.ok) {
          const codeData = await codeRes.value.json();
          const statsData = await statsRes.value.json();
          setReferral({
            code: codeData.code,
            link: codeData.link || `https://curlysports.com/invite/${codeData.code}`,
            verified: statsData.verified ?? 0,
            total: statsData.total ?? 0,
            totalEntries: statsData.totalEntries ?? 0,
          });
          if (statsData.hasRedeemed) setHasRedeemed(true);
        }
      } catch { /* referral fetch failed silently */ }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [sport]);

  useEffect(() => {
    if (fetchedRef.current) setLoading(true);
    fetchedRef.current = true;
    fetchData();
  }, [fetchData]);

  // Initialize prevEntriesRef when referral data first loads
  useEffect(() => {
    if (referral && prevEntriesRef.current === null) {
      prevEntriesRef.current = referral.totalEntries;
    }
  }, [referral]);

  // Poll for entry updates every 30 seconds
  useEffect(() => {
    if (!user) return;

    const pollInterval = setInterval(async () => {
      try {
        const opts = { credentials: 'include' as const };

        const [statsRes, lbRes] = await Promise.allSettled([
          fetch('/api/referral/stats', opts),
          fetch('/api/referral/leaderboard', opts),
        ]);

        if (lbRes.status === 'fulfilled' && lbRes.value.ok) {
          const lbData = await lbRes.value.json();
          setLeaderboard(lbData.entries ?? []);
        }

        if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
          const statsData = await statsRes.value.json();
          const newEntries = statsData.totalEntries ?? 0;

          if (prevEntriesRef.current !== null && newEntries > prevEntriesRef.current) {
            const gained = newEntries - prevEntriesRef.current;
            setToastMsg(`You earned +${gained} new entr${gained === 1 ? 'y' : 'ies'} from a referral! Total: ${newEntries}`);
          }
          prevEntriesRef.current = newEntries;

          setReferral(prev => prev ? {
            ...prev,
            verified: statsData.verified ?? prev.verified,
            total: statsData.total ?? prev.total,
            totalEntries: newEntries,
          } : prev);
        }
      } catch { /* silent */ }
    }, 30_000);

    return () => clearInterval(pollInterval);
  }, [user]);

  /* ── Vote ── */

  const handleVote = (challengeId: string, side: 'teamA' | 'teamB') => {
    // Optimistic update — show vote instantly
    setVotingId(challengeId);
    setChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, userVote: side } : c));
    // Fire-and-forget API call
    fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ challengeId, selectedTeam: side }),
    }).then(res => {
      if (res.ok) {
        fetchData(); // Refresh stats
      } else {
        // Revert on failure
        setChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, userVote: undefined } : c));
      }
    }).catch(() => {
      setChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, userVote: undefined } : c));
    }).finally(() => setVotingId(null));
  };

  /* ── Derived ── */

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const pastChallenges = challenges.filter(c => c.status !== 'active');
  const isLoggedIn = !!user;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Toast */}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}

      <Topbar
        title="Challenges"
        subtitle="PREDICT & WIN"
        logoSrc="/curly-guy.png"
        onSearch={onSearch}
        onBell={onBell}
        hasNotification={(unread ?? 0) > 0}
      />

      <div className="cs-scroll" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: i === 1 ? 280 : 70, borderRadius: 14, background: 'var(--surface)', border: '2px solid var(--border-2)', animation: 'cs-pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : (
          <>
            {/* Active Challenges */}
            {activeChallenges.map(challenge => (
              <ActiveChallengeCard
                key={challenge.id}
                challenge={challenge}
                onVote={(side: 'teamA' | 'teamB') => handleVote(challenge.id, side)}
                onTap={() => onOpenChallenge(challenge.id)}
              />
            ))}

            {activeChallenges.length === 0 && !loading && (
              <div style={{ background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 14, padding: 32, textAlign: 'center' }}>
                <Icon name="trophy" size={32} style={{ color: 'var(--text-mute)', margin: '0 auto 12px' }} />
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 6 }}>No active challenges</div>
                <div style={{ fontFamily: 'var(--body)', fontSize: 12, color: 'var(--text-mute)' }}>Check back soon for new prediction challenges!</div>
              </div>
            )}

            {/* ───────────────────────────────────────────── */}
            {/* Your Stats (authenticated)                    */}
            {/* ───────────────────────────────────────────── */}
            {isLoggedIn && referral && (
              <div style={{ background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 14, padding: 16 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Icon name="users" size={18} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 17, color: 'var(--ink)' }}>Your Stats</span>
                </div>

                {/* Total entries */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 32, color: 'var(--accent)' }}>{referral.totalEntries}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total entries across all challenges
                  </span>
                </div>

                {/* Referral Code */}
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
                  Your Referral Code
                </span>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 12,
                  background: 'var(--surface-2)', border: '2px dashed var(--ink)', borderRadius: 10, marginBottom: 10,
                }}>
                  <span style={{ flex: 1, fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', letterSpacing: '0.08em' }}>
                    {referral.code}
                  </span>
                  <button
                    onClick={() => copyToClipboard(referral.code, 'code')}
                    className="cs-tap"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px',
                      background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 8,
                      fontFamily: 'var(--body)', fontWeight: 700, fontSize: 11, color: 'var(--ink)', cursor: 'pointer',
                    }}
                  >
                    <Icon name={copiedField === 'code' ? 'check' : 'copy'} size={14} style={{ color: 'var(--ink)' }} />
                    {copiedField === 'code' ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {/* Referral Link */}
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
                    Share Link
                  </span>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: 10,
                    background: 'var(--surface-2)', border: '1.5px solid var(--border-2)', borderRadius: 8,
                  }}>
                    <Icon name="link" size={13} style={{ color: 'var(--text-mute)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontFamily: 'var(--body)', fontSize: 11, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {referral.link.replace(/^https?:\/\/localhost:\d+/, 'https://curlysports.com')}
                    </span>
                    <button
                      onClick={() => copyToClipboard(referral.link, 'link')}
                      className="cs-tap"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                        background: 'var(--surface)', border: '1.5px solid var(--border-2)', borderRadius: 6,
                        fontFamily: 'var(--body)', fontWeight: 700, fontSize: 11, color: 'var(--ink)', cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      <Icon name={copiedField === 'link' ? 'check' : 'copy'} size={12} style={{ color: 'var(--ink)' }} />
                      {copiedField === 'link' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Referral stats */}
                <span style={{ fontFamily: 'var(--body)', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)' }}>
                  {referral.verified} verified / {referral.total} total referrals
                </span>
              </div>
            )}

            {/* ───────────────────────────────────────────── */}
            {/* Redeem Referral Code                          */}
            {/* ───────────────────────────────────────────── */}
            {isLoggedIn && !hasRedeemed && (
              <div style={{ background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 14, padding: 16 }}>
                <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', display: 'block', marginBottom: 10 }}>
                  Have a referral code?
                </span>
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  <input
                    type="text"
                    placeholder="Enter referral code"
                    value={redeemCode}
                    onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                    maxLength={20}
                    style={{
                      flex: 1, minWidth: 0, padding: '12px 14px',
                      background: 'var(--surface-2)', border: '2px solid var(--border-2)', borderRadius: 10,
                      fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', letterSpacing: '0.08em',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={!redeemCode.trim() || redeemLoading}
                    className="cs-tap"
                    style={{
                      padding: '12px 16px', flexShrink: 0,
                      background: 'var(--ink)', borderRadius: 10, border: 'none',
                      fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--accent)',
                      cursor: !redeemCode.trim() || redeemLoading ? 'default' : 'pointer',
                      opacity: !redeemCode.trim() || redeemLoading ? 0.5 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {redeemLoading ? '...' : 'Redeem'}
                  </button>
                </div>
                {redeemMsg && (
                  <div style={{
                    marginTop: 10, padding: 10, borderRadius: 8, border: '1.5px solid',
                    background: redeemMsg.type === 'success' ? 'rgba(200,255,61,0.12)' : 'rgba(255,68,68,0.08)',
                    borderColor: redeemMsg.type === 'success' ? '#3d7a00' : '#ff4444',
                  }}>
                    <span style={{
                      fontFamily: 'var(--body)', fontSize: 12, fontWeight: 600,
                      color: redeemMsg.type === 'success' ? '#3d7a00' : '#ff4444',
                    }}>
                      {redeemMsg.text}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ───────────────────────────────────────────── */}
            {/* Referral Leaderboard                          */}
            {/* ───────────────────────────────────────────── */}
            <div style={{ background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 14, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: 16,
                borderBottom: '1.5px solid var(--border-2)',
              }}>
                <Icon name="crown" size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>
                  Referral Leaderboard
                </span>
              </div>

              {leaderboard.length > 0 ? (
                <>
                  {/* Column headers */}
                  <div style={{
                    display: 'flex', alignItems: 'center', padding: '8px 14px',
                    borderBottom: '1px solid var(--border-2)',
                  }}>
                    <span style={{ width: 30, fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</span>
                    <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</span>
                    <span style={{ width: 48, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Refs</span>
                    <span style={{ width: 44, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entries</span>
                  </div>

                  {/* Rows */}
                  {leaderboard.map(entry => (
                    <div
                      key={entry.userId}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px',
                        borderBottom: '1px solid var(--border)',
                        ...(entry.isCurrentUser ? { background: 'rgba(200,255,61,0.06)', borderLeft: '3px solid var(--accent)' } : {}),
                      }}
                    >
                      {/* Rank */}
                      <div style={{ width: 22, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                        {entry.rank <= 3 ? (
                          <Icon name="trophy" size={14} style={{ color: entry.rank === 1 ? '#daa520' : entry.rank === 2 ? '#aaa' : '#cd7f32' }} />
                        ) : (
                          <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>{entry.rank}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div style={{
                        width: 28, height: 28, borderRadius: 14,
                        background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                      }}>
                        {entry.avatar ? (
                          <img src={entry.avatar} alt="" style={{ width: 28, height: 28, borderRadius: 14, objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontFamily: 'var(--body)', fontWeight: 700, fontSize: 10, color: '#fff' }}>
                            {entry.username?.slice(0, 2).toUpperCase() ?? '??'}
                          </span>
                        )}
                      </div>

                      {/* Username */}
                      <span style={{ flex: 1, fontFamily: 'var(--body)', fontWeight: 600, fontSize: 13, color: 'var(--ink)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.username}
                      </span>

                      {/* Referrals */}
                      <span style={{ width: 48, textAlign: 'center', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13, color: 'var(--text-dim)', flexShrink: 0 }}>
                        {entry.totalReferrals}
                      </span>

                      {/* Entries */}
                      <span style={{ width: 44, textAlign: 'right', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 15, color: 'var(--accent)', flexShrink: 0 }}>
                        {entry.totalEntries}
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <Icon name="users" size={32} style={{ color: 'var(--text-mute)', opacity: 0.3, margin: '0 auto 8px' }} />
                  <span style={{ fontFamily: 'var(--body)', fontSize: 12, color: 'var(--text-mute)', display: 'block' }}>
                    No referrals yet. Share your code to climb the leaderboard!
                  </span>
                </div>
              )}
            </div>

            {/* Past Challenges */}
            {pastChallenges.length > 0 && (
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 10 }}>Past Challenges</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pastChallenges.map(challenge => (
                    <PastChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onTap={() => onOpenChallenge(challenge.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Bottom spacer */}
            <div style={{ height: 16 }} />
          </>
        )}
      </div>
    </div>
  );
}
