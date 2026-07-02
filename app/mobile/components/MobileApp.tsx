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
import { hapticImpact } from '@/lib/native';
import { Wrench } from 'lucide-react';

type Tab = 'home' | 'live' | 'funzone' | 'leagues' | 'profile' | 'news' | 'teams' | 'favorites' | 'videos' | 'minigames' | 'players';
type OverlayType = 'match' | 'player' | 'search' | 'notifications';
interface Overlay { type: OverlayType; data?: Match; playerId?: string; playerLeagueId?: string }

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

function AppInner() {
  const { user, profile, isLoading, isNewUser, setFavTeam, verifyingOtp } = useAuth();
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
    const tabs: Tab[] = ['home', 'live', 'funzone', 'leagues', 'profile', 'news', 'teams', 'favorites', 'videos', 'minigames', 'players'];
    if (tabs.includes(key as Tab)) { clearStack(); goTab(key as Tab); return; }
    if (key === 'search') { clearStack(); openSearch(); return; }
    if (key === 'notifications') { clearStack(); openNotifications(); return; }
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
    return (
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-2)' }}>
        <div style={{ flex: 1, minHeight: 0, animation: 'cs-pushIn 0.32s var(--ease-pop) both' }}>{ov}</div>
        <BottomNav active="" onSelect={onBottom} />
      </div>
    );
  }

  let screen: React.ReactNode;
  if      (tab === 'home')      screen = <DashboardScreen sport={sport} setSport={setSport} onOpenMatch={openMatch} onOpenPlayer={openPlayer} fav={fav} {...nav} />;
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
