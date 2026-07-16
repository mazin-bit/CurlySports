'use client';
import React, { useState, useEffect, useCallback } from 'react';
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
import { hapticImpact } from '@/lib/native';
import { Wrench, Gift, ArrowRight, X } from 'lucide-react';

type Tab = 'home' | 'live' | 'funzone' | 'leagues' | 'profile' | 'news' | 'teams' | 'favorites' | 'videos' | 'minigames' | 'players' | 'challenges';
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
    const tabs: Tab[] = ['home', 'live', 'funzone', 'leagues', 'profile', 'news', 'teams', 'favorites', 'videos', 'minigames', 'players', 'challenges'];
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
  else if (tab === 'leagues')   screen = <LeaguesScreen sport={sport} setSport={setSport} onOpenPlayer={openPlayer} {...nav} />;
  else if (tab === 'profile')   screen = <ProfileScreen fav={fav} {...nav} />;
  else if (tab === 'news')      screen = <NewsScreen sport={sport} setSport={setSport} {...nav} />;
  else if (tab === 'teams')     screen = <TeamsScreen sport={sport} setSport={setSport} onOpenPlayer={openPlayer} {...nav} />;
  else if (tab === 'favorites') screen = <FavoritesScreen onOpenPlayer={openPlayer} {...nav} />;
  else if (tab === 'videos')    screen = <VideosScreen sport={sport} setSport={setSport} {...nav} />;
  else if (tab === 'minigames') screen = <MiniGamesScreen sport={sport} setSport={setSport} {...nav} />;
  else if (tab === 'players')   screen = <PlayersScreen sport={sport} setSport={setSport} onOpenPlayer={openPlayer} {...nav} />;
  else if (tab === 'challenges') screen = <ChallengesScreen sport={sport} onOpenChallenge={openChallengeDetail} {...nav} />;

  const bottomActive = menuOpen ? 'more' : (['home', 'live', 'funzone', 'leagues'].includes(tab) ? tab : '');

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

export default function MobileApp() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ErrorBoundary>
  );
}
