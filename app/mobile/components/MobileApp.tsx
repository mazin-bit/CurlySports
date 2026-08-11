'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import type { Match } from '../data';
import BottomNav from './ui/BottomNav';
import DashboardScreen from './DashboardScreen';
import LiveScoresScreen from './LiveScoresScreen';
import DebatesScreen from './DebatesScreen';
import LeaguesScreen from './LeaguesScreen';
import ProfileScreen from './ProfileScreen';
import MatchScreen from './MatchScreen';
import PlayerScreen from './PlayerScreen';
import SearchScreen from './SearchScreen';
import NotificationsScreen from './NotificationsScreen';
import OnboardingScreen from './OnboardingScreen';
import MenuDrawer from './MenuDrawer';
import LoginScreen from './LoginScreen';
import NewsScreen from './NewsScreen';
import TeamsScreen from './TeamsScreen';
import FavoritesScreen from './FavoritesScreen';
import VideosScreen from './VideosScreen';
import MiniGamesScreen from './MiniGamesScreen';
import PlayersScreen from './PlayersScreen';
import FeedbackScreen from './FeedbackScreen';
import ChallengesScreen from './ChallengesScreen';
import ChallengeDetailScreen from './ChallengeDetailScreen';
import LeaderboardScreen from './LeaderboardScreen';
import ReferralScreen from './ReferralScreen';
import RedeemTab from './RedeemTab';
import Icon from './ui/Icon';
import { hapticImpact } from '@/lib/native';
import { Wrench, Gift, ArrowRight, X } from 'lucide-react';

type Tab = 'home' | 'live' | 'funzone' | 'redeem' | 'leagues' | 'profile' | 'news' | 'teams' | 'favorites' | 'videos' | 'minigames' | 'players' | 'challenges';
type OverlayType = 'match' | 'player' | 'search' | 'notifications' | 'feedback' | 'challenge-detail' | 'leaderboard' | 'referral';
interface Overlay { type: OverlayType; data?: Match; playerId?: string; playerLeagueId?: string; challengeId?: string }

interface Flags {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceEstimated: string;
  siteNoticeEnabled: boolean;
  siteNotice: string;
  features: Record<string, boolean>;
  sports: Record<string, boolean>;
}

function useFlags(): Flags | null {
  const [flags, setFlags] = useState<Flags | null>(null);
  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/flags');
      if (res.ok) setFlags(await res.json());
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 30_000); return () => clearInterval(id); }, [load]);
  return flags;
}

// Feature key → tab mapping
const FEATURE_TAB: Record<string, Tab> = {
  liveScores: 'live',
  funZone: 'funzone',
  leagues: 'leagues',
  news: 'news',
  teams: 'teams',
  favorites: 'favorites',
  miniGames: 'minigames',
  players: 'players',
};

function MaintenanceScreen({ message, estimated }: { message: string; estimated: string }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 16, padding: 32, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, background: 'var(--surface)', borderRadius: 16, border: '2px solid var(--ink)', display: 'grid', placeItems: 'center' }}>
        <Wrench size={24} style={{ color: 'var(--accent)' }} />
      </div>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)' }}>We&apos;ll be right back</div>
      <div style={{ fontFamily: 'var(--body)', fontSize: 14, color: 'var(--text-dim)', maxWidth: 280, lineHeight: 1.5 }}>
        {message || "We're making some improvements."}
      </div>
      {estimated && <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{estimated}</div>}
      <div style={{ marginTop: 16, fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--text-mute)' }}>
        curly<span style={{ color: 'var(--coral)' }}>.</span>sports
      </div>
    </div>
  );
}

function LoadingSplash() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#07090b', gap: 0 }}>
      <div style={{ width: 80, height: 80, background: '#c8ff3d', borderRadius: 22, border: '2.5px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(200,255,61,0.15)', transform: 'rotate(-6deg)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/curly-guy.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      </div>
      <div style={{ marginTop: 18, fontFamily: 'var(--display, Georgia, serif)', fontWeight: 900, fontSize: 22, color: '#fffdf7', letterSpacing: '-0.5px' }}>
        curly<span style={{ color: '#ff5b3d' }}>.</span>sports
      </div>
      <div style={{ marginTop: 24, display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8ff3d', opacity: 0.4, animation: `cs-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes cs-pulse { 0%,100% { opacity:0.2; transform:scale(0.8); } 50% { opacity:1; transform:scale(1.2); } }`}</style>
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 16, padding: 32, textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, background: 'var(--coral)', borderRadius: 14, border: '2px solid var(--ink)', display: 'grid', placeItems: 'center', color: 'var(--paper)', fontWeight: 800, fontSize: 22 }}>!</div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>Something went wrong</div>
          <div style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--text-dim)', maxWidth: 280 }}>Try refreshing the page. If the problem persists, contact support.</div>
          <button onClick={() => this.setState({ hasError: false })} style={{ marginTop: 8, padding: '10px 24px', background: 'var(--ink)', color: 'var(--accent)', border: '2px solid var(--ink)', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '3px 3px 0 var(--accent)' }}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Referral Code Survey (shown after new signup) ──────────── */
function ReferralSurvey({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/referral/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, msg: data.message || 'Referral applied successfully!' });
        setTimeout(onDone, 1800);
      } else {
        setResult({ ok: false, msg: data.error || 'Invalid referral code.' });
      }
    } catch {
      setResult({ ok: false, msg: 'Something went wrong. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)',
      padding: '0 20px', overflowY: 'auto', boxSizing: 'border-box',
    }}>
      <div style={{ paddingTop: 60, paddingBottom: 24 }}>
        {/* Skip button */}
        <button
          onClick={onDone}
          style={{
            position: 'absolute', top: 16, right: 16, background: 'var(--surface)',
            border: '2px solid var(--ink)', borderRadius: 10, padding: '6px 14px',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.06em', color: 'var(--text-mute)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase',
          }}
        >
          SKIP <ArrowRight size={12} />
        </button>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, background: 'var(--lime)', borderRadius: 18,
          border: '2.5px solid var(--ink)', boxShadow: '5px 5px 0 var(--ink)',
          transform: 'rotate(-6deg)', display: 'grid', placeItems: 'center',
          marginBottom: 24,
        }}>
          <Gift size={32} style={{ color: 'var(--ink)' }} />
        </div>

        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange)',
        }}>
          WELCOME TO CURLYSPORTS
        </div>
        <h1 style={{
          fontFamily: 'var(--display)', fontWeight: 800, fontSize: 26,
          letterSpacing: '-0.03em', color: 'var(--ink)', margin: '6px 0 8px', lineHeight: 1.1,
        }}>
          Got a referral code?
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
          If someone invited you, enter their referral code below. You&apos;ll both get bonus entries in prediction challenges!
        </p>
      </div>

      {/* Input */}
      <div style={{ marginBottom: 14 }}>
        <label style={{
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-mute)',
          display: 'block', marginBottom: 6,
        }}>
          REFERRAL CODE
        </label>
        <div style={{ display: 'flex', gap: 8, width: '100%', boxSizing: 'border-box' }}>
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setResult(null); }}
            placeholder="e.g. CURLY1234"
            maxLength={20}
            autoCapitalize="characters"
            style={{
              flex: 1, minWidth: 0, padding: '13px 14px', background: 'var(--surface)',
              border: '2px solid var(--ink)', borderRadius: 10,
              fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700,
              letterSpacing: '0.08em', color: 'var(--ink)', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleRedeem}
            disabled={submitting || !code.trim()}
            style={{
              padding: '13px 16px', background: (submitting || !code.trim()) ? 'var(--surface-3)' : 'var(--ink)',
              border: '2px solid var(--ink)', borderRadius: 10,
              fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.04em', color: (submitting || !code.trim()) ? 'var(--text-mute)' : 'var(--accent)',
              cursor: (submitting || !code.trim()) ? 'not-allowed' : 'pointer',
              boxShadow: (submitting || !code.trim()) ? 'none' : '3px 3px 0 var(--accent)',
              flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            {submitting ? '...' : 'APPLY'}
          </button>
        </div>
      </div>

      {/* Result message */}
      {result && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          background: 'var(--surface)', border: `2px solid ${result.ok ? '#22c55e' : 'var(--coral)'}`,
          borderRadius: 10, padding: '10px 12px', marginBottom: 14,
        }}>
          {result.ok
            ? <Gift size={14} style={{ flexShrink: 0, color: '#22c55e', marginTop: 1 }} />
            : <X size={14} style={{ flexShrink: 0, color: 'var(--coral)', marginTop: 1 }} />
          }
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
            color: result.ok ? '#22c55e' : 'var(--coral)', lineHeight: 1.4,
          }}>
            {result.msg}
          </span>
        </div>
      )}

      {/* Info card */}
      <div style={{
        background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 14,
        padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <div style={{
          width: 36, height: 36, background: 'var(--lime)', borderRadius: 10,
          border: '2px solid var(--ink)', display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <Gift size={16} style={{ color: 'var(--ink)' }} />
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
            color: 'var(--ink)', letterSpacing: '0.04em', marginBottom: 4,
          }}>
            HOW REFERRALS WORK
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
            Your friend gets an extra entry in prediction challenges when you sign up with their code.
            You&apos;ll also get your own referral code to share!
          </p>
        </div>
      </div>

      {/* Skip at bottom */}
      <div style={{ flex: 1, minHeight: 32 }} />
      <button
        onClick={onDone}
        style={{
          width: '100%', padding: '14px 0', background: 'transparent',
          border: '2px solid var(--ink)', borderRadius: 12,
          fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
          letterSpacing: '0.04em', color: 'var(--text-mute)', cursor: 'pointer',
          marginBottom: 16,
        }}
      >
        I DON&apos;T HAVE A CODE — SKIP
      </button>
      <div style={{
        textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9.5,
        color: 'var(--text-mute)', letterSpacing: '0.06em', paddingBottom: 32,
      }}>
        CURLYSPORTS.COM · MADE IN A BEDROOM
      </div>
    </div>
  );
}


function AppInner() {
  const { user, profile, isLoading, isNewUser, setFavTeam, verifyingOtp, isNewSignup, clearNewSignup } = useAuth();
  const flags = useFlags();
  const [tab, setTab] = useState<Tab>('home');
  const [sport, setSport] = useState('football');
  const [stack, setStack] = useState<Overlay[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const feat = flags?.features ?? {};
  const isFeatureOff = (t: Tab) => {
    const entry = Object.entries(FEATURE_TAB).find(([, v]) => v === t);
    return entry ? feat[entry[0]] === false : false;
  };

  const push = (o: Overlay) => setStack(s => [...s, o]);
  const pop  = () => setStack(s => s.slice(0, -1));
  const clearStack = () => setStack([]);

  const openMatch         = (m: Match) => push({ type: 'match', data: m });
  const openPlayer        = (playerId?: string, leagueId?: string) => push({ type: 'player', playerId, playerLeagueId: leagueId });
  const openSearch        = () => push({ type: 'search' });
  const openNotifications = () => { setUnread(0); push({ type: 'notifications' }); };
  const openFeedback = () => push({ type: 'feedback' });
  const openChallengeDetail = (challengeId: string) => push({ type: 'challenge-detail', challengeId });
  const openLeaderboard = (challengeId: string) => push({ type: 'leaderboard', challengeId });
  const openReferral = () => push({ type: 'referral' });

  const goTab = (key: Tab) => {
    if (isFeatureOff(key)) return;
    clearStack(); setTab(key);
  };
  const nav   = { onSearch: openSearch, onBell: openNotifications, unread };

  const onBottom = (key: string) => {
    hapticImpact('light');
    if (key === 'more') { setMenuOpen(true); return; }
    goTab(key as Tab);
  };

  const onMenuNav = (key: string) => {
    setMenuOpen(false);
    const tabs: Tab[] = ['home', 'live', 'funzone', 'redeem', 'leagues', 'profile', 'news', 'teams', 'favorites', 'videos', 'minigames', 'players', 'challenges'];
    if (tabs.includes(key as Tab)) { clearStack(); goTab(key as Tab); return; }
    if (key === 'search') { clearStack(); openSearch(); return; }
    if (key === 'notifications') { clearStack(); openNotifications(); return; }
    if (key === 'feedback') { clearStack(); openFeedback(); return; }
    if (key === 'players') { clearStack(); openPlayer(); return; }
    goTab('home');
  };

  // 1 — Loading session or completing OTP verification
  if (isLoading || verifyingOtp) return <LoadingSplash />;

  // 2 — Not authenticated → Login
  if (!user) return <LoginScreen />;

  // 2.5 — Phone verification is only required for phone login method (handled in PhoneLoginScreen)

  // 3 — Maintenance mode (after auth so admins can still log in)
  if (flags?.maintenanceMode) {
    return <MaintenanceScreen message={flags.maintenanceMessage} estimated={flags.maintenanceEstimated} />;
  }

  // 3.5 — New signup referral code survey
  if (isNewSignup) {
    return <ReferralSurvey onDone={clearNewSignup} />;
  }

  // 4 — Authenticated but no fav team → Onboarding
  if (isNewUser) {
    return (
      <OnboardingScreen
        onDone={async team => { await setFavTeam({ code: team.code, name: team.name }); }}
        onSkip={async () => { await setFavTeam({ code: '_none', name: 'None' }); }}
      />
    );
  }

  // 5 — Main app
  const fav = profile?.favTeam
    ? { code: profile.favTeam.code, name: profile.favTeam.name, first: profile.username ?? 'You' }
    : undefined;

  // If current tab is disabled by admin, redirect to home
  if (isFeatureOff(tab) && tab !== 'home' && tab !== 'profile') {
    setTab('home');
  }

  const top = stack[stack.length - 1];
  if (top) {
    let ov: React.ReactNode;
    if      (top.type === 'match')         ov = <MatchScreen match={top.data} liveClock={null} onBack={pop} onOpenPlayer={openPlayer} />;
    else if (top.type === 'player')        ov = <PlayerScreen playerId={top.playerId} playerLeagueId={top.playerLeagueId} onBack={pop} onOpenMatch={() => { pop(); goTab('live'); }} />;
    else if (top.type === 'search')        ov = <SearchScreen onBack={pop} onOpenPlayer={openPlayer} onOpenMatch={openMatch} />;
    else if (top.type === 'notifications') ov = <NotificationsScreen onBack={pop} onMarkAll={() => setUnread(0)} onOpenMatch={openMatch} onOpenPlayer={openPlayer} />;
    else if (top.type === 'feedback') ov = <FeedbackScreen onBack={pop} />;
    else if (top.type === 'challenge-detail') ov = <ChallengeDetailScreen challengeId={top.challengeId ?? ''} onBack={pop} onLeaderboard={openLeaderboard} onReferral={openReferral} />;
    else if (top.type === 'leaderboard') ov = <LeaderboardScreen challengeId={top.challengeId ?? ''} onBack={pop} />;
    else if (top.type === 'referral') ov = <ReferralScreen onBack={pop} />;
    return (
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-2)' }}>
        <div style={{ flex: 1, minHeight: 0, animation: 'cs-pushIn 0.32s var(--ease-pop) both' }}>{ov}</div>
        <BottomNav active="" onSelect={onBottom} />
      </div>
    );
  }

  let screen: React.ReactNode;
  if      (tab === 'home')      screen = <DashboardScreen sport={sport} setSport={setSport} onOpenMatch={openMatch} onOpenPlayer={openPlayer} onOpenChallenge={openChallengeDetail} fav={fav} {...nav} />;
  else if (tab === 'live')      screen = <LiveScoresScreen sport={sport} setSport={setSport} onOpenMatch={openMatch} {...nav} />;
  else if (tab === 'funzone')   screen = <DebatesScreen sport={sport} onOpenPlayer={openPlayer} {...nav} />;
  else if (tab === 'redeem')    screen = <RedeemTab {...nav} />;
  else if (tab === 'leagues')   screen = <LeaguesScreen sport={sport} setSport={setSport} onOpenPlayer={openPlayer} {...nav} />;
  else if (tab === 'profile')   screen = <ProfileScreen fav={fav} {...nav} />;
  else if (tab === 'news')      screen = <NewsScreen sport={sport} setSport={setSport} {...nav} />;
  else if (tab === 'teams')     screen = <TeamsScreen sport={sport} setSport={setSport} onOpenPlayer={openPlayer} {...nav} />;
  else if (tab === 'favorites') screen = <FavoritesScreen onOpenPlayer={openPlayer} {...nav} />;
  else if (tab === 'videos')    screen = <VideosScreen sport={sport} setSport={setSport} {...nav} />;
  else if (tab === 'minigames') screen = <MiniGamesScreen sport={sport} setSport={setSport} {...nav} />;
  else if (tab === 'players')   screen = <PlayersScreen sport={sport} setSport={setSport} onOpenPlayer={openPlayer} {...nav} />;
  else if (tab === 'challenges') screen = <ChallengesScreen sport={sport} onOpenChallenge={openChallengeDetail} {...nav} />;

  const bottomActive = menuOpen ? 'more' : (['home', 'live', 'redeem', 'leagues'].includes(tab) ? tab : '');

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-2)' }}>
      {flags?.siteNoticeEnabled && flags.siteNotice && (
        <div style={{ padding: '8px 16px', background: 'var(--accent)', color: 'var(--ink)', fontSize: 12, fontWeight: 700, textAlign: 'center', fontFamily: 'var(--mono)', flexShrink: 0 }}>
          {flags.siteNotice}
        </div>
      )}
      <div key={tab} className="cs-tab-enter" style={{ flex: 1, minHeight: 0 }}>{screen}</div>
      <BottomNav active={bottomActive} onSelect={onBottom} />
      {menuOpen && <MenuDrawer active={tab} onClose={() => setMenuOpen(false)} onNavigate={onMenuNav} user={{ username: profile?.username, email: user?.email }} />}
    </div>
  );
}

function MobileLuckyDrawOverlay() {
  const [spinData, setSpinData] = React.useState<{
    title: string; prizeName: string;
    winner: { userId: string; username: string; avatar: string | null; referrals: number };
    participants: { userId: string; username: string; avatar: string | null; referrals: number }[];
  } | null>(null);
  const [spinDone, setSpinDone] = React.useState(false);
  const spinIdRef = React.useRef<string | null>(null);
  const [phase, setPhase] = React.useState<'spinning' | 'slowing' | 'done'>('spinning');
  const [offset, setOffset] = React.useState(0);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const lastTickRef = React.useRef(0);
  const fanfarePlayed = React.useRef(false);

  const CARD_H = 76;
  const VISIBLE = 3;

  // Init audio
  React.useEffect(() => {
    try { audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch {}
    return () => { audioCtxRef.current?.close(); };
  }, []);

  function playTick(pitch = 800) {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square'; osc.frequency.value = pitch;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  function playWinFanfare() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'square'; osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t); osc.stop(t + 0.35);
      });
      [523, 659, 784, 1047].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'triangle'; osc.frequency.value = freq;
        const t = ctx.currentTime + 0.65;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1);
        osc.start(t); osc.stop(t + 1);
      });
    } catch {}
  }

  React.useEffect(() => {
    let iv: ReturnType<typeof setInterval>;
    async function poll() {
      try {
        const res = await fetch('/api/lucky-draw');
        if (!res.ok) return;
        const data = await res.json();
        if (data.spinning?.winner && data.spinning.participants?.length > 0 && !spinDone) {
          const newId = data.spinning.id || 'spin';
          if (spinIdRef.current !== newId) {
            spinIdRef.current = newId;
            setSpinData(data.spinning);
            setPhase('spinning');
            setOffset(0);
            lastTickRef.current = 0;
            fanfarePlayed.current = false;
          }
        } else if (!data.spinning) {
          spinIdRef.current = null;
          setSpinData(null);
        }
      } catch {}
    }
    poll();
    iv = setInterval(poll, 5000);
    return () => clearInterval(iv);
  }, [spinDone]);

  const reel = React.useMemo(() => {
    if (!spinData) return [];
    const { participants, winner } = spinData;
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const list: typeof participants = [];
    for (let i = 0; i < 10; i++) list.push(...shuffled.sort(() => Math.random() - 0.5));
    list.push(participants[0] || winner);
    list.push(winner);
    list.push(participants[1] || participants[0] || winner);
    return list;
  }, [spinData]);

  const winnerIdx = reel.length - 2;
  const finalOffset = winnerIdx * CARD_H - CARD_H;

  React.useEffect(() => {
    if (!spinData || spinDone) return;
    let raf: number;
    let start: number | null = null;
    const TOTAL = 6000;

    function animate(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / TOTAL, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const newOffset = eased * finalOffset;
      setOffset(newOffset);

      const currentCard = Math.floor(newOffset / CARD_H);
      if (currentCard > lastTickRef.current) {
        lastTickRef.current = currentCard;
        playTick(progress > 0.8 ? 600 + Math.random() * 200 : 700 + Math.random() * 400);
      }

      if (progress < 0.5) setPhase('spinning');
      else if (progress < 1) setPhase('slowing');
      if (progress < 1) { raf = requestAnimationFrame(animate); }
      else {
        setOffset(finalOffset);
        setPhase('done');
        if (!fanfarePlayed.current) { fanfarePlayed.current = true; playWinFanfare(); }
        setTimeout(() => {
          setSpinDone(true);
          setSpinData(null);
          setTimeout(() => setSpinDone(false), 5000);
        }, 5000);
      }
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [spinData, spinDone, finalOffset]);

  if (!spinData || spinDone) return null;

  const winner = spinData.winner;
  const lightCount = 20;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(12,10,29,0.65)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, flexDirection: 'column',
    }}>
      {/* Jackpot Machine Frame */}
      <div style={{
        position: 'relative',
        width: '90vw', maxWidth: 340,
        background: 'linear-gradient(180deg, #fffdf7 0%, #f6ede0 100%)',
        borderRadius: 20,
        border: '3px solid #0c0a1d',
        boxShadow: '6px 6px 0 #0c0a1d, 0 0 40px rgba(200,255,61,0.12)',
        overflow: 'visible',
        paddingBottom: 20,
      }}>
        {/* Blinking lights */}
        <div style={{ position: 'absolute', inset: -12, borderRadius: 28, pointerEvents: 'none', zIndex: 1 }}>
          {Array.from({ length: lightCount }).map((_, i) => {
            const angle = (i / lightCount) * 360;
            const colors = ['#c8ff3d', '#ff5b3d', '#ffb74d', '#7c5cff', '#38c9ff'];
            return (
              <div key={i} style={{
                position: 'absolute', width: 8, height: 8, borderRadius: '50%',
                background: colors[i % colors.length], border: '1.5px solid #0c0a1d',
                left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 50}% - 4px)`,
                top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * 50}% - 4px)`,
                animation: `csJackpotBlinkM 0.6s ease-in-out ${i * 0.08}s infinite alternate`,
                boxShadow: `0 0 4px ${colors[i % colors.length]}`,
              }} />
            );
          })}
        </div>

        {/* Top banner */}
        <div style={{
          background: 'linear-gradient(135deg, #ff5b3d 0%, #ff8c3d 100%)',
          borderRadius: '17px 17px 0 0',
          padding: '14px 16px 10px',
          textAlign: 'center',
          borderBottom: '3px solid #0c0a1d',
          position: 'relative', zIndex: 2,
        }}>
          <div style={{ fontSize: 8, letterSpacing: 5, color: 'rgba(255,255,255,0.6)', marginBottom: 3, fontFamily: 'monospace' }}>
            ★ ★ ★ LUCKY DRAW ★ ★ ★
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', textShadow: '2px 2px 0 rgba(0,0,0,0.2)', letterSpacing: 1 }}>
            {spinData.title}
          </div>
        </div>

        {/* Prize display */}
        <div style={{
          margin: '12px auto 10px', width: 'fit-content',
          padding: '6px 18px', background: '#c8ff3d',
          border: '2px solid #0c0a1d', borderRadius: 8,
          boxShadow: '2px 2px 0 #0c0a1d', position: 'relative', zIndex: 2,
        }}>
          <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(12,10,29,0.5)', fontWeight: 700, textAlign: 'center', marginBottom: 1 }}>
            Grand Prize
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#0c0a1d', textAlign: 'center' }}>
            {spinData.prizeName}
          </div>
        </div>

        {/* Slot window */}
        <div style={{ margin: '0 14px', position: 'relative', zIndex: 2 }}>
          <div style={{
            border: '3px solid #0c0a1d', borderRadius: 12,
            overflow: 'hidden', background: '#fffdf7',
            boxShadow: 'inset 0 3px 10px rgba(12,10,29,0.1), 3px 3px 0 #0c0a1d',
          }}>
            {/* Fade edges */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 24, background: 'linear-gradient(180deg, rgba(255,253,247,0.9) 0%, transparent 100%)', zIndex: 3, pointerEvents: 'none', borderRadius: '9px 9px 0 0' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, background: 'linear-gradient(0deg, rgba(255,253,247,0.9) 0%, transparent 100%)', zIndex: 3, pointerEvents: 'none', borderRadius: '0 0 9px 9px' }} />

            {/* Selection arrows */}
            <div style={{ position: 'absolute', top: CARD_H - 3, left: -2, right: -2, height: CARD_H + 6, zIndex: 4, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '12px solid #ff5b3d', filter: 'drop-shadow(1px 0 0 #0c0a1d)' }} />
              <div style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderRight: '12px solid #ff5b3d', filter: 'drop-shadow(-1px 0 0 #0c0a1d)' }} />
            </div>

            {/* Center highlight */}
            <div style={{
              position: 'absolute', top: CARD_H, left: 0, right: 0, height: CARD_H,
              border: '3px solid #ff5b3d', borderRadius: 0,
              background: phase === 'done' ? 'rgba(255,91,61,0.1)' : 'rgba(255,91,61,0.03)',
              zIndex: 2, pointerEvents: 'none', transition: 'all 0.3s ease',
              boxShadow: phase === 'done' ? 'inset 0 0 20px rgba(255,91,61,0.1)' : 'none',
            }} />

            {/* Reel */}
            <div style={{ height: CARD_H * VISIBLE, overflow: 'hidden', position: 'relative' }}>
              <div style={{ transform: `translateY(-${offset}px)`, willChange: 'transform' }}>
                {reel.map((p, i) => {
                  const isWin = phase === 'done' && i === winnerIdx;
                  return (
                    <div key={`${p.userId}-${i}`} style={{
                      height: CARD_H, display: 'flex', alignItems: 'center',
                      gap: 10, padding: '0 16px',
                      background: isWin ? 'rgba(255,91,61,0.08)' : 'transparent',
                      borderBottom: '1px solid rgba(12,10,29,0.08)',
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: '#0c0a1d', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: 13, color: '#c8ff3d',
                        flexShrink: 0, overflow: 'hidden',
                        border: isWin ? '2px solid #ff5b3d' : '2px solid #0c0a1d',
                        boxShadow: isWin ? '0 0 10px rgba(255,91,61,0.3)' : '1px 1px 0 rgba(12,10,29,0.15)',
                      }}>
                        {p.avatar ? (
                          <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          (p.username || '?').slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 800, fontSize: 14,
                          color: isWin ? '#ff5b3d' : '#0c0a1d',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{p.username}</div>
                        <div style={{ fontSize: 10, color: 'rgba(12,10,29,0.4)', fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>
                          {p.referrals} referral{p.referrals !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                        color: '#0c0a1d', flexShrink: 0,
                        padding: '4px 10px', borderRadius: 6,
                        background: isWin ? '#c8ff3d' : '#f6ede0',
                        border: `2px solid ${isWin ? '#0c0a1d' : 'rgba(12,10,29,0.12)'}`,
                        boxShadow: isWin ? '1px 1px 0 #0c0a1d' : 'none',
                        textTransform: 'uppercase',
                      }}>
                        {p.referrals} ticket{p.referrals !== 1 ? 's' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{
          margin: '12px 14px 0', padding: '8px 14px', borderRadius: 8,
          background: phase === 'done' ? 'rgba(255,91,61,0.08)' : '#f6ede0',
          border: `2px solid ${phase === 'done' ? '#ff5b3d' : 'rgba(12,10,29,0.1)'}`,
          textAlign: 'center', position: 'relative', zIndex: 2,
        }}>
          {phase === 'spinning' && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(12,10,29,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, animation: 'csJackpotPulseM 0.5s ease-in-out infinite alternate' }}>
              Spinning...
            </div>
          )}
          {phase === 'slowing' && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#ff5b3d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>
              Almost there...
            </div>
          )}
          {phase === 'done' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Icon name="crown" size={18} style={{ color: '#ff5b3d' }} />
              <span style={{ color: '#ff5b3d', fontWeight: 900, fontSize: 18 }}>
                {winner.username} wins!
              </span>
              <Icon name="crown" size={18} style={{ color: '#ff5b3d' }} />
            </div>
          )}
        </div>
      </div>

      {/* Confetti */}
      {phase === 'done' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10001, overflow: 'hidden' }}>
          {Array.from({ length: 60 }).map((_, i) => {
            const colors = ['#c8ff3d', '#ff5b3d', '#7c5cff', '#ffb74d', '#38c9ff', '#ff5d9e', '#fff'];
            const size = Math.random() * 8 + 3;
            return (
              <div key={i} style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 15 + 5}%`,
                width: size, height: size * (Math.random() > 0.3 ? 1.5 : 1),
                background: colors[i % colors.length],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animation: `csJackpotConfettiM ${2 + Math.random() * 2.5}s ease-in forwards`,
                animationDelay: `${Math.random() * 0.8}s`,
                opacity: 0.95,
              }} />
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes csJackpotBlinkM { 0% { opacity: 0.4; transform: scale(0.85); } 100% { opacity: 1; transform: scale(1.1); } }
        @keyframes csJackpotPulseM { 0% { opacity: 0.6; } 100% { opacity: 1; } }
        @keyframes csJackpotConfettiM { 0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; } 50% { opacity: 0.9; } 100% { transform: translateY(100vh) rotate(720deg) scale(0.5); opacity: 0; } }
      `}</style>
    </div>
  );
}

export default function MobileApp() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppInner />
        <MobileLuckyDrawOverlay />
      </AuthProvider>
    </ErrorBoundary>
  );
}
