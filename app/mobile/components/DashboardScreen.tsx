'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Match } from '../data';
import { useScoresStream } from '@/hooks/useScoresStream';
import { useNews } from '@/hooks/useNews';
import { useStandings, useSingleStandings } from '@/hooks/useStandings';
import { useBracket } from '@/hooks/useBracket';
import type { BracketRound, BracketMatch } from '@/hooks/useBracket';
import type { StandingEntry, GroupStandings } from '@/hooks/useStandings';
import { normalizedToMobile } from './api';
import { openExternal } from '@/lib/native';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate, formatTime } from '@/lib/locale-utils';
import { translateLeagueName } from '@/lib/league-names';
import { translateTeamName } from '@/lib/team-names';
import type { NormalizedMatch } from '@/lib/types';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Badge from './ui/Badge';
import MatchRow from './ui/MatchRow';
import SportSelector from './ui/SportSelector';
import AdSlot from './ui/AdSlot';
import Icon from './ui/Icon';
import { SkeletonScoreCard, SkeletonNewsCard, SkeletonTableRow, SkeletonList } from './ui/Skeletons';

interface DashboardProps {
  sport: string;
  setSport: (s: string) => void;
  onOpenMatch: (m: Match) => void;
  onOpenPlayer: (playerId?: string, leagueId?: string) => void;
  onOpenChallenge?: (challengeId: string) => void;
  onSearch: () => void;
  onBell: () => void;
  fav?: { code: string; name: string; first: string } | null;
  unread: number;
}

interface ActiveChallenge {
  id: string;
  title: string;
  teamA: string;
  teamB: string;
  matchDate: string;
  winnerCount: number;
  status: string;
  totalVotes: number;
}

function MobileDashboardLuckyDraw() {
  const [upcoming, setUpcoming] = useState<{ title: string; prizeName: string; prizeValue?: string; scheduledAt: string } | null>(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const res = await fetch('/api/lucky-draw');
        if (res.ok && mounted) {
          const data = await res.json();
          setUpcoming(data.upcoming || null);
        }
      } catch { /* ignore */ }
    }
    fetchData();
    const iv = setInterval(fetchData, 30000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('luckyDrawMuted') === '1';
    return false;
  });
  const toggleMute = useCallback(() => {
    setMuted((prev: boolean) => {
      const next = !prev;
      localStorage.setItem('luckyDrawMuted', next ? '1' : '0');
      return next;
    });
  }, []);
  const playTick = useCallback(() => {
    if (muted) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 1800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } catch { /* ignore */ }
  }, [muted]);

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
      playTick();
    }
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [upcoming, playTick]);

  if (!upcoming) return null;

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'var(--surface, #fffdf7)',
      border: '2px solid var(--ink, #0c0a1d)',
      borderRadius: 14,
      padding: '14px 16px',
      textAlign: 'center',
      boxShadow: '3px 3px 0 var(--ink, #0c0a1d)',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, var(--accent, #c8ff3d), var(--orange, #ff5b3d), var(--accent, #c8ff3d))',
        backgroundSize: '200% 100%',
        animation: 'cs-shimmer 2s linear infinite',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 4 }}>
        <Icon name="sparkles" size={13} style={{ color: 'var(--orange, #ff5b3d)' }} />
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 12, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Lucky Draw
        </span>
        <Icon name="sparkles" size={13} style={{ color: 'var(--orange, #ff5b3d)' }} />
      </div>
      <div style={{
        fontFamily: "'Courier New', monospace", fontSize: 9,
        color: 'var(--text-mute)', marginBottom: 4, textTransform: 'uppercase',
        letterSpacing: 1,
      }}>
        {upcoming.title} — {upcoming.prizeName}
        {upcoming.prizeValue ? ` (${upcoming.prizeValue})` : ''}
      </div>
      <div style={{
        fontFamily: "'Courier New', monospace", fontSize: 22, fontWeight: 900,
        color: 'var(--ink)', letterSpacing: 2, padding: '2px 0',
      }}>
        {countdown}
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-mute)', marginTop: 2 }}>
        More referrals = more chances to win
      </div>
      <button
        onClick={toggleMute}
        style={{
          position: 'absolute', top: 8, right: 8,
          background: 'none', border: 'none', padding: 4,
          color: 'var(--text-mute)', opacity: 0.6,
        }}
      >
        <Icon name={muted ? 'volume-x' : 'volume-2'} size={13} />
      </button>
    </div>
  );
}

function RedeemCodeBox() {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'redeemed'>('idle');
  const [message, setMessage] = useState('');

  // Check on mount if user already redeemed
  useEffect(() => {
    fetch('/api/referral/redeem')
      .then(r => r.json())
      .then(d => { if (d.redeemed) setStatus('redeemed'); })
      .catch(() => {});
  }, []);

  const handleRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed || status === 'redeemed') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/referral/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('redeemed');
        setMessage(data.message || 'Code redeemed successfully!');
        setCode('');
      } else if (res.status === 409) {
        setStatus('redeemed');
        setMessage(data.error || 'You have already used a referral code.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Invalid code.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  if (status === 'redeemed') {
    return (
      <div style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--border-2)',
        borderRadius: 12,
        padding: '12px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <Icon name="ticket" size={12} style={{ color: 'var(--accent)' }} />
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)',
          }}>
            {t('redeem.title', 'Redeem Code')}
          </span>
        </div>
        <div style={{ marginTop: 2, fontSize: 10, fontFamily: 'var(--body)', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="check-circle" size={10} /> {message || t('redeem.alreadyUsed', 'You have already redeemed a code.')}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1.5px solid var(--border-2)',
      borderRadius: 12,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
        <Icon name="ticket" size={12} style={{ color: 'var(--accent)' }} />
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)',
        }}>
          {t('redeem.title', 'Redeem Code')}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); if (status !== 'idle') setStatus('idle'); }}
          placeholder={t('redeem.placeholder', 'Enter code')}
          maxLength={20}
          style={{
            flex: 1, padding: '8px 10px',
            fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--ink)', background: 'var(--surface-2)',
            border: '1.5px solid var(--border-2)', borderRadius: 8,
            outline: 'none',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-2)'; }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleRedeem(); }}
        />
        <button
          onClick={handleRedeem}
          disabled={!code.trim() || status === 'loading'}
          style={{
            padding: '8px 14px',
            fontFamily: 'var(--display)', fontSize: 11, fontWeight: 700,
            color: !code.trim() || status === 'loading' ? 'var(--text-mute)' : '#07090b',
            background: !code.trim() || status === 'loading' ? 'var(--surface-2)' : 'var(--accent)',
            border: '1.5px solid transparent', borderRadius: 8,
            cursor: !code.trim() || status === 'loading' ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {status === 'loading' ? '...' : t('redeem.apply', 'Apply')}
        </button>
      </div>
      {status === 'error' && (
        <div style={{ marginTop: 6, fontSize: 10, fontFamily: 'var(--body)', color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="alert-circle" size={10} /> {message}
        </div>
      )}
    </div>
  );
}

function useMobileActiveChallenge() {
  const [challenge, setChallenge] = useState<ActiveChallenge | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    // 12s timeout — Vercel cold starts can take 5-8s
    const timer = setTimeout(() => ctrl.abort(), 12000);
    (async () => {
      try {
        const res = await fetch('/api/challenges?status=active&limit=1', { signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) return;
        const data = await res.json();
        const items = data.challenges ?? data;
        if (Array.isArray(items) && items.length > 0 && !cancelled) {
          const c = items[0];
          // Hide challenge if match date has already passed
          if (c.matchDate && new Date(c.matchDate).getTime() <= Date.now()) {
            // Expired — don't show
          } else {
            setChallenge(c);
            if (c.userVote) {
              const teamName = c.userVote === 'teamA' ? c.teamA : c.teamB;
              setUserVote(teamName);
            }
          }
        }
      } catch { /* timeout or network error — challenge section stays hidden */ }
    })();
    return () => { cancelled = true; ctrl.abort(); clearTimeout(timer); };
  }, []);

  return { challenge, userVote, setUserVote };
}

function MobileChallengeCountdown({ matchDate }: { matchDate: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    function update() {
      const diff = new Date(matchDate).getTime() - Date.now();
      if (diff <= 0) { setRemaining('00:00:00'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [matchDate]);

  return <span>{remaining}</span>;
}

function MiniStandingsTable({ entries, leagueName, t, locale }: { entries: StandingEntry[]; leagueName: string; t: (key: string, fallback?: string) => string; locale: import('@/lib/i18n').Locale }) {
  const rows = entries.slice(0, 8);
  const isFootball = rows.some(e => e.draws > 0);
  return (
    <Card subtitle={t('dashboard.standingsLabel')} title={translateLeagueName(leagueName, locale)} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0 8px', borderBottom: '1px solid var(--border-3)' }}>
        <span style={{ width: 20 }}>#</span>
        <span style={{ flex: 1 }}>{t('standings.team')}</span>
        <span style={{ width: 22, textAlign: 'center' }}>{t('standings.p')}</span>
        <span style={{ width: 22, textAlign: 'center' }}>{t('standings.w')}</span>
        {isFootball && <span style={{ width: 22, textAlign: 'center' }}>{t('standings.d')}</span>}
        <span style={{ width: 22, textAlign: 'center' }}>{t('standings.l')}</span>
        {isFootball && <span style={{ width: 28, textAlign: 'center' }}>{t('standings.gd')}</span>}
        <span style={{ width: 28, textAlign: 'right', color: 'var(--orange)', fontWeight: 700 }}>{t('standings.pts')}</span>
      </div>
      {rows.map((row, idx) => (
        <div key={row.teamId || idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: idx < rows.length - 1 ? '1px solid var(--border-3)' : 'none' }}>
          <span style={{ width: 20, fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, color: idx < 4 ? 'var(--orange)' : 'var(--text-mute)' }}>{row.rank || idx + 1}</span>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {row.teamLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={row.teamLogo} alt="" width={18} height={18} style={{ objectFit: 'contain', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--surface-3)', border: '1px solid var(--border-2)', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 7, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-mute)' }}>{row.teamAbbr.slice(0, 3)}</div>
            )}
            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{translateTeamName(row.teamName, locale)}</span>
          </div>
          <span style={{ width: 22, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>{row.gamesPlayed}</span>
          <span style={{ width: 22, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>{row.wins}</span>
          {isFootball && <span style={{ width: 22, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>{row.draws}</span>}
          <span style={{ width: 22, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>{row.losses}</span>
          {isFootball && <span style={{ width: 28, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: row.goalDiff > 0 ? 'var(--teal)' : row.goalDiff < 0 ? 'var(--coral)' : 'var(--text-mute)' }}>{row.goalDiff > 0 ? '+' : ''}{row.goalDiff}</span>}
          <span style={{ width: 28, textAlign: 'right', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>{row.points}</span>
        </div>
      ))}
    </Card>
  );
}

/* ── World Cup Groups Grid (mobile) ─────────────────────────── */
function MobileWCGroupsGrid({ groups, leagueName, t, locale }: { groups: GroupStandings[]; leagueName: string; t: (key: string, fallback?: string) => string; locale: import('@/lib/i18n').Locale }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)', marginBottom: 12, letterSpacing: '-0.02em' }}>
        {translateLeagueName(leagueName, locale)} — {t('dashboard.groupStage')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {groups.map(g => (
          <Card key={g.groupName} style={{ padding: 10 }}>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 10, letterSpacing: '0.08em', color: 'var(--orange)', textTransform: 'uppercase', marginBottom: 6 }}>{g.groupName}</div>
            <div style={{ display: 'flex', fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0 4px', borderBottom: '1px solid var(--border-3)' }}>
              <span style={{ flex: 1 }}>{t('standings.team')}</span>
              <span style={{ width: 18, textAlign: 'center' }}>{t('standings.p')}</span>
              <span style={{ width: 18, textAlign: 'center' }}>{t('standings.w')}</span>
              <span style={{ width: 18, textAlign: 'center' }}>{t('standings.l')}</span>
              <span style={{ width: 22, textAlign: 'right', color: 'var(--orange)', fontWeight: 700 }}>{t('standings.pts')}</span>
            </div>
            {g.entries.slice(0, 4).map((row, idx) => (
              <div key={row.teamId || idx} style={{ display: 'flex', alignItems: 'center', padding: '4px 0', borderBottom: idx < 3 ? '1px solid var(--border-3)' : 'none' }}>
                <span style={{ width: 14, fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 9, color: idx < 2 ? 'var(--orange)' : 'var(--text-mute)' }}>{row.rank || idx + 1}</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                  {row.teamLogo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={row.teamLogo} alt="" width={14} height={14} style={{ objectFit: 'contain', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: 6, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-mute)' }}>{row.teamAbbr.slice(0, 3)}</div>
                  )}
                  <span style={{ fontWeight: 600, fontSize: 10, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.teamAbbr}</span>
                </div>
                <span style={{ width: 18, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)' }}>{row.gamesPlayed}</span>
                <span style={{ width: 18, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)' }}>{row.wins}</span>
                <span style={{ width: 18, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)' }}>{row.losses}</span>
                <span style={{ width: 22, textAlign: 'right', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 11, color: 'var(--ink)' }}>{row.points}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Knockout Bracket (mobile) ─────────────────────────────── */
function MobileKnockoutBracket({ rounds, leagueName, t, locale }: { rounds: BracketRound[]; leagueName: string; t: (key: string, fallback?: string) => string; locale: import('@/lib/i18n').Locale }) {
  if (rounds.length === 0) return null;
  return (
    <div>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 10, letterSpacing: '-0.02em' }}>{t('dashboard.knockoutStage')}</div>
      {rounds.map((round) => (
        <div key={round.name} style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 6 }}>{round.name}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {round.matches.map((m: BracketMatch) => (
              <div key={m.id} style={{ background: 'var(--surface-2)', borderRadius: 8, border: '1.5px solid var(--border-2)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: '1px solid var(--border-3)' }}>
                  {m.home.logo && !m.home.isPlaceholder ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={m.home.logo} alt="" width={16} height={16} style={{ objectFit: 'contain', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 16, height: 16, borderRadius: 3, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: 6, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-mute)' }}>{m.home.shortName?.slice(0, 3) ?? '?'}</div>
                  )}
                  <span style={{ flex: 1, fontWeight: m.home.winner ? 700 : 500, fontSize: 12, color: m.home.winner ? 'var(--ink)' : 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.home.shortName ? translateTeamName(m.home.shortName, locale) : ''}</span>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: m.home.winner ? 'var(--orange)' : 'var(--ink)', minWidth: 16, textAlign: 'center' }}>{m.home.score !== null ? m.home.score : '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px' }}>
                  {m.away.logo && !m.away.isPlaceholder ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={m.away.logo} alt="" width={16} height={16} style={{ objectFit: 'contain', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 16, height: 16, borderRadius: 3, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: 6, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-mute)' }}>{m.away.shortName?.slice(0, 3) ?? '?'}</div>
                  )}
                  <span style={{ flex: 1, fontWeight: m.away.winner ? 700 : 500, fontSize: 12, color: m.away.winner ? 'var(--ink)' : 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.away.shortName ? translateTeamName(m.away.shortName, locale) : ''}</span>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: m.away.winner ? 'var(--orange)' : 'var(--ink)', minWidth: 16, textAlign: 'center' }}>{m.away.score !== null ? m.away.score : '-'}</span>
                </div>
                {m.statusDisplay && (
                  <div style={{ padding: '4px 10px 5px', borderTop: '1px solid var(--border-3)', fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--text-mute)' }}>{m.statusDisplay}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function toDateKey(d: Date) {
  return String(d.getFullYear()) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
}

export default function DashboardScreen({ sport, setSport, onOpenMatch, onOpenPlayer, onOpenChallenge, onSearch, onBell, fav, unread }: DashboardProps) {
  const { t, locale } = useLanguage();
  const todayKey = toDateKey(new Date());
  const { challenge: activeChallenge, userVote: challengeVote, setUserVote: setChallengeVote } = useMobileActiveChallenge();
  const { groups, isConnected, liveCount } = useScoresStream(sport, todayKey);
  const { articles, isLoading: newsLoading } = useNews(20, sport);

  // Football: show World Cup groups + knockout bracket
  const isFootball = sport === 'football';
  const { standings: wcStandings, isLoading: wcLoading } = useSingleStandings(isFootball ? 'fifa.world' : null);
  const { rounds: wcRounds, isLoading: bracketLoading } = useBracket(isFootball ? 'fifa.world' : null);

  // Other sports: show regular standings
  const { standings, isLoading: standingsLoading } = useStandings(isFootball ? undefined : sport);
  const [upcoming, setUpcoming] = useState<{ label: string; matches: Match[] } | null>(null);

  // Top Referrers leaderboard for dashboard widget
  const [topReferrers, setTopReferrers] = useState<{ rank: number; username: string; totalReferrals: number; isCurrentUser: boolean }[]>([]);
  useEffect(() => {
    fetch('/api/referral/leaderboard?limit=5')
      .then(r => r.json())
      .then(d => { if (d.leaderboard) setTopReferrers(d.leaderboard); })
      .catch(() => {});
  }, []);

  const showWcGroups = isFootball && wcStandings && wcStandings.hasGroups && wcStandings.groups && wcStandings.groups.length > 0;
  const showWcBracket = isFootball && wcRounds.length > 0;
  const wcSectionLoading = isFootball && (wcLoading || bracketLoading);

  // Same sort order as web DashboardClient: LIVE → HALF_TIME → SCHEDULED → FINISHED
  const allMatches = groups.flatMap(g => g.matches).sort((a, b) => {
    const p = (s: string) => s === 'LIVE' ? 0 : s === 'HALF_TIME' ? 1 : s === 'SCHEDULED' ? 2 : 3;
    return p(a.status) - p(b.status);
  });
  const display = allMatches.slice(0, 8).map(normalizedToMobile);
  const scoresLoading = !isConnected && groups.length === 0;
  const leagueLabel = [...new Set(groups.slice(0, 3).map(g => g.leagueShortName))].join(' · ');

  // Fetch upcoming matches when no matches today — all days in parallel
  useEffect(() => {
    if (!isConnected || allMatches.length > 0) { setUpcoming(null); return; }
    let cancelled = false;
    (async () => {
      const days = Array.from({ length: 5 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return { dayOffset: i + 1, date: d, yyyymmdd: d.toISOString().slice(0, 10).replace(/-/g, '') };
      });
      const results = await Promise.allSettled(
        days.map(({ yyyymmdd }) => fetch(`/api/espn/scoreboard?sport=${sport}&date=${yyyymmdd}`).then(r => r.json()))
      );
      if (cancelled) return;
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status !== 'fulfilled') continue;
        const nMatches: NormalizedMatch[] = (r.value.groups ?? []).flatMap((g: { matches: NormalizedMatch[] }) => g.matches);
        if (nMatches.length > 0) {
          const label = days[i].dayOffset === 1 ? t('time.tomorrow') : formatDate(days[i].date, locale, { weekday: 'short', month: 'short', day: 'numeric' });
          setUpcoming({ label, matches: nMatches.slice(0, 6).map(normalizedToMobile) });
          return;
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isConnected, allMatches.length, sport, t, locale]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar
        title={`${t('dashboard.hey')}${fav?.first ?? 'You'}`}
        subtitle={t('dashboard.matchday')}
        logoSrc="/curly-guy.png"
        onSearch={onSearch}
        onBell={onBell}
        hasNotification={unread > 0}
      />
      <div className="cs-scroll cs-screen-scroll" style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="cs-content-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SportSelector active={sport} onSelect={setSport} />

        {/* Lucky Draw Countdown */}
        <MobileDashboardLuckyDraw />

        {/* Redeem code (first - instant access) */}
        <RedeemCodeBox />

        {/* Top Referrers widget */}
        {topReferrers.length > 0 && (
          <Card subtitle="REFERRALS" title="Top Referrers">
            <div style={{ borderTop: '1px solid var(--border-3)' }}>
              {topReferrers.map((entry, idx) => {
                const medalColor = idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'var(--text-mute)';
                const isTop3 = idx < 3;
                return (
                  <div key={entry.rank} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 4px',
                    borderBottom: idx < topReferrers.length - 1 ? '1px solid var(--border-3)' : 'none',
                    background: entry.isCurrentUser ? 'rgba(232,96,28,0.06)' : 'transparent',
                    borderRadius: entry.isCurrentUser ? 6 : 0,
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: isTop3 ? `${medalColor}18` : 'var(--surface-2)',
                      border: isTop3 ? `2px solid ${medalColor}` : '1.5px solid var(--border-2)',
                      display: 'grid', placeItems: 'center',
                      fontFamily: "'Courier New', monospace", fontSize: 10, fontWeight: 900,
                      color: medalColor, flexShrink: 0,
                    }}>
                      {isTop3 ? <Icon name="crown" size={12} style={{ color: medalColor }} /> : entry.rank}
                    </div>
                    <div style={{
                      width: 26, height: 26, borderRadius: 7,
                      background: entry.isCurrentUser ? 'var(--orange)' : 'var(--ink)',
                      color: entry.isCurrentUser ? 'var(--surface)' : 'var(--accent)',
                      display: 'grid', placeItems: 'center',
                      fontFamily: 'var(--display)', fontWeight: 800, fontSize: 10,
                      border: '1.5px solid var(--ink)', flexShrink: 0,
                    }}>
                      {entry.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontFamily: 'var(--display)', fontWeight: 700, fontSize: 12,
                        color: entry.isCurrentUser ? 'var(--orange)' : 'var(--ink)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {entry.username}
                        {entry.isCurrentUser && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, color: 'var(--orange)', marginLeft: 4 }}>YOU</span>}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: "'Courier New', monospace", fontSize: 13, fontWeight: 900,
                      color: isTop3 ? medalColor : 'var(--ink)',
                    }}>
                      {entry.totalReferrals}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Challenge card */}
        {activeChallenge && (
          <div
            onClick={() => onOpenChallenge?.(activeChallenge.id)}
            style={{
              background: 'var(--surface)',
              border: '2px solid var(--orange)',
              borderRadius: 14,
              padding: '14px 16px',
              boxShadow: '3px 3px 0 var(--orange)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <Icon name="trophy" size={13} style={{ color: 'var(--orange)' }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--orange)' }}>
                {t('challenges.mysteryPrize', 'MYSTERY PRIZE CHALLENGE')}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 10 }}>
              <span>{activeChallenge.teamA}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 800, color: 'var(--text-mute)', letterSpacing: '0.06em' }}>VS</span>
              <span>{activeChallenge.teamB}</span>
            </div>
            {challengeVote ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 12px', background: 'rgba(200,255,61,0.15)', border: '2px solid var(--accent)', borderRadius: 8, fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                  <Icon name="check" size={13} />
                  {t('challenges.yourPrediction', 'Your Prediction')}: {challengeVote}
                </div>
                <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-mute)', fontFamily: 'var(--body)' }}>
                  {t('challenges.goToChallenges', 'Tap for entries, referrals & leaderboard')} →
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                {[activeChallenge.teamA, activeChallenge.teamB].map((team) => (
                  <button
                    key={team}
                    onClick={async () => {
                      // Optimistic: show vote instantly
                      setChallengeVote(team);
                      try {
                        const selectedTeam = team === activeChallenge.teamA ? 'teamA' : 'teamB';
                        const res = await fetch('/api/challenges', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ challengeId: activeChallenge.id, selectedTeam }),
                        });
                        if (!res.ok) setChallengeVote(''); // Revert on failure
                      } catch { setChallengeVote(''); }
                    }}
                    style={{
                      flex: 1, padding: '7px 12px',
                      fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700,
                      color: 'var(--ink)', background: 'var(--surface-2)',
                      border: '2px solid var(--border-2)', borderRadius: 8,
                      cursor: 'pointer',
                    }}
                  >
                    {team}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1.5px solid var(--border-2)', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-mute)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon name="clock" size={10} />
                <MobileChallengeCountdown matchDate={activeChallenge.matchDate} />
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon name="gift" size={10} />
                {activeChallenge.winnerCount} {t('challenges.winners', 'Winners')}
              </span>
            </div>
          </div>
        )}

        {/* Live scores */}
        <Card
          subtitle={liveCount > 0 ? `● ${liveCount} ${t('dashboard.liveNow')}` : `● ${t('matchStatus.live')} & ${t('matchStatus.upcoming')}`}
          title={t(`sport.${sport}`, sport)}
          action={leagueLabel || undefined}
        >
          {scoresLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
              <SkeletonList count={3}>{i => <SkeletonScoreCard style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
            </div>
          ) : display.length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>{t('dashboard.noMatchesToday')}</div>
          ) : (
            <div style={{ borderTop: '1px solid var(--border-3)' }}>
              {display.map(m => (
                <div key={m.id} style={{ borderBottom: '1px solid var(--border-3)' }}>
                  <MatchRow {...m} onClick={() => onOpenMatch(m)} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming matches (shown when no matches today) */}
        {upcoming && display.length === 0 && (
          <Card subtitle={`${t('dashboard.upcomingNext')}${upcoming.label}`} title={t('dashboard.nextMatches')}>
            <div style={{ borderTop: '1px solid var(--border-3)' }}>
              {upcoming.matches.map(m => (
                <div key={m.id} style={{ borderBottom: '1px solid var(--border-3)' }}>
                  <MatchRow {...m} onClick={() => onOpenMatch(m)} />
                </div>
              ))}
            </div>
          </Card>
        )}

        <AdSlot size="banner" />

        {/* News feed */}
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{t('dashboard.todayInSports')}</div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--orange)', fontWeight: 700, cursor: 'pointer' }} onClick={onSearch}>{t('common.allArrow')}</span>
          </div>
          <div className="cs-tablet-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {newsLoading ? (
              <SkeletonList count={3}>{i => <SkeletonNewsCard style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
            ) : articles.length > 0 ? articles.map(n => (
              <Card key={n.id} tappable style={{ padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'stretch', gap: 0, cursor: 'pointer' }}
                onClick={() => { if (n.url) openExternal(n.url); }}
              >
                {n.imageUrl ? (
                  <div style={{ width: 88, flexShrink: 0, background: 'var(--surface-3)', borderInlineEnd: '2px solid var(--ink)', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).parentElement!.style.background = 'var(--surface-3)'; (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                ) : (
                  <div style={{ width: 88, flexShrink: 0, background: 'var(--surface-3)', borderInlineEnd: '2px solid var(--ink)', display: 'grid', placeItems: 'center' }}>
                    <Icon name="news" size={22} style={{ color: 'var(--text-mute)' }} />
                  </div>
                )}
                <div style={{ padding: 14, minWidth: 0 }}>
                  <Badge tone="mute">{n.source}</Badge>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', lineHeight: 1.25, margin: '8px 0', letterSpacing: '-0.01em' }}>{n.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)' }}>
                      {n.publishedAt ? formatTime(new Date(n.publishedAt), locale) : ''}
                    </span>
                    {n.url && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--orange)', fontWeight: 700 }}>{t('news.readMore')}</span>}
                  </div>
                </div>
              </Card>
            )) : (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <Icon name="news" size={28} style={{ color: 'var(--text-mute)', margin: '0 auto 8px' }} />
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>{t('dashboard.noNewsRightNow')}</div>
              </div>
            )}
          </div>
        </div>

        {/* World Cup Standings (football only) */}
        {isFootball && (wcSectionLoading || showWcGroups || showWcBracket) && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                {t('dashboard.worldCupStandings')}
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--orange)', fontWeight: 700 }}>{wcStandings?.season ?? ''}</span>
            </div>
            {wcSectionLoading ? (
              <SkeletonList count={5}>{i => <SkeletonTableRow style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
            ) : (
              <>
                {showWcGroups && (
                  <MobileWCGroupsGrid groups={wcStandings!.groups!} leagueName={wcStandings!.leagueName} t={t} locale={locale} />
                )}
                {showWcBracket && (
                  <MobileKnockoutBracket rounds={wcRounds} leagueName={wcStandings?.leagueName ?? t('dashboard.worldCupStandings')} t={t} locale={locale} />
                )}
              </>
            )}
          </div>
        )}

        {/* League Standings (non-football sports) */}
        {!isFootball && (standingsLoading || standings.length > 0) && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{t('dashboard.standingsLabel')}</div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--orange)', fontWeight: 700 }}>{standings[0]?.season ?? ''}</span>
            </div>
            {standingsLoading ? (
              <SkeletonList count={5}>{i => <SkeletonTableRow style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
            ) : standings.slice(0, 2).map(league => (
              <MiniStandingsTable key={league.leagueId} entries={league.entries} leagueName={league.leagueName} t={t} locale={locale} />
            ))}
          </div>
        )}

        {/* All leagues scores */}
        {groups.length > 1 && groups.slice(1).map(g => {
          const gMatches = g.matches.slice(0, 4).map(normalizedToMobile);
          if (gMatches.length === 0) return null;
          return (
            <Card key={g.leagueId} subtitle={translateLeagueName(g.leagueShortName, locale)} title={translateLeagueName(g.leagueName, locale)}>
              <div style={{ borderTop: '1px solid var(--border-3)' }}>
                {gMatches.map(m => (
                  <div key={m.id} style={{ borderBottom: '1px solid var(--border-3)' }}>
                    <MatchRow {...m} onClick={() => onOpenMatch(m)} />
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
        </div>
      </div>
    </div>
  );
}
