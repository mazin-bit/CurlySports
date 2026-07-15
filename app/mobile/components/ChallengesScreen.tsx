'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  votingClosesAt: string;
  winnerCount: number;
  totalVotes: number;
  userVote?: 'A' | 'B' | null;
  result?: 'A' | 'B' | 'draw' | null;
  sport: string;
}

interface UserStats {
  totalEntries: number;
  referrals: number;
  challengesJoined: number;
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', border: '2px solid var(--border-2)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
        {team.logo
          ? <img src={team.logo} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          : <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: 'var(--text-dim)' }}>{team.shortName.slice(0, 2)}</span>
        }
      </div>
      <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 12, color: 'var(--ink)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
        {team.name}
      </span>
    </div>
  );
}

/* ── ActiveChallengeCard ────────────────────────────────── */

function ActiveChallengeCard({ challenge, onVote, onTap }: { challenge: Challenge; onVote: (side: 'A' | 'B') => void; onTap: () => void }) {
  const hasVoted = !!challenge.userVote;
  const votingExpired = new Date(challenge.votingClosesAt).getTime() <= Date.now();

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
        {(['A', 'B'] as const).map(side => {
          const team = side === 'A' ? challenge.teamA : challenge.teamB;
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
              {team.name} {side === 'A' ? 'to Win' : 'to Win'}
            </button>
          );
        })}
      </div>

      {/* Countdown */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="clock" size={13} style={{ color: 'var(--text-mute)' }} />
          <CountdownDisplay targetDate={challenge.votingClosesAt} />
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
  const userCorrect = challenge.result && challenge.userVote && (
    (challenge.result === 'A' && challenge.userVote === 'A') ||
    (challenge.result === 'B' && challenge.userVote === 'B')
  );
  const resultLabel = challenge.result === 'draw' ? 'Draw' :
    challenge.result === 'A' ? `${challenge.teamA.shortName} Won` :
    challenge.result === 'B' ? `${challenge.teamB.shortName} Won` : 'Pending';

  return (
    <div onClick={onTap} className="cs-tap" style={{ background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-2)', border: '1.5px solid var(--border-2)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            {challenge.teamA.logo
              ? <img src={challenge.teamA.logo} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
              : <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-dim)' }}>{challenge.teamA.shortName.slice(0, 2)}</span>
            }
          </div>
          <span style={{ fontFamily: 'var(--body)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
            {challenge.teamA.shortName} vs {challenge.teamB.shortName}
          </span>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-2)', border: '1.5px solid var(--border-2)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            {challenge.teamB.logo
              ? <img src={challenge.teamB.logo} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
              : <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-dim)' }}>{challenge.teamB.shortName.slice(0, 2)}</span>
            }
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

/* ── Main Screen ────────────────────────────────────────── */

export default function ChallengesScreen({ sport, onOpenChallenge, onSearch, onBell, unread }: ChallengesScreenProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [stats, setStats] = useState<UserStats>({ totalEntries: 0, referrals: 0, challengesJoined: 0 });
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchChallenges = useCallback(async () => {
    try {
      const token = localStorage.getItem('cs_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [cRes, sRes] = await Promise.allSettled([
        fetch(`/api/challenges?sport=${sport}`, { headers }),
        fetch('/api/challenges/stats', { headers }),
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
      if (sRes.status === 'fulfilled' && sRes.value.ok) {
        const data = await sRes.value.json();
        setStats(data);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [sport]);

  useEffect(() => {
    if (fetchedRef.current) setLoading(true);
    fetchedRef.current = true;
    fetchChallenges();
  }, [fetchChallenges]);

  const handleVote = async (challengeId: string, side: 'A' | 'B') => {
    setVotingId(challengeId);
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
        setChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, userVote: side } : c));
        setStats(prev => ({ ...prev, totalEntries: prev.totalEntries + 1, challengesJoined: prev.challengesJoined + 1 }));
      }
    } catch { /* ignore */ }
    finally { setVotingId(null); }
  };

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const pastChallenges = challenges.filter(c => c.status !== 'active');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
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
                onVote={side => handleVote(challenge.id, side)}
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

            {/* Your Stats Row */}
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 10 }}>Your Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'Total Entries', value: stats.totalEntries, icon: 'clipboard' },
                  { label: 'Referrals', value: stats.referrals, icon: 'users' },
                  { label: 'Challenges', value: stats.challengesJoined, icon: 'trophy' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
                    <Icon name={stat.icon} size={16} style={{ color: 'var(--accent)', margin: '0 auto 6px' }} />
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--ink)', lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, color: 'var(--text-mute)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
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
