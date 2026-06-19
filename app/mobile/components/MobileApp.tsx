'use client';
import React, { useState, useEffect } from 'react';
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

type Tab = 'home' | 'live' | 'funzone' | 'leagues' | 'profile' | 'news' | 'teams' | 'favorites' | 'videos' | 'minigames' | 'players';
type OverlayType = 'match' | 'player' | 'search' | 'notifications';
interface Overlay { type: OverlayType; data?: Match; playerId?: string; playerLeagueId?: string }

function LoadingSplash() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 16 }}>
      <div style={{ width: 64, height: 64, background: 'var(--lime)', borderRadius: 18, border: '2.5px solid var(--ink)', boxShadow: '5px 5px 0 var(--ink)', transform: 'rotate(-6deg)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/curly-mark.png" alt="" style={{ width: '80%', height: '80%', objectFit: 'contain', transform: 'rotate(6deg)' }} />
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>Loading…</div>
    </div>
  );
}

function AppInner() {
  const { user, profile, isLoading, isNewUser, setFavTeam } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [sport, setSport] = useState('football');
  const [stack, setStack] = useState<Overlay[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [liveMin, setLiveMin] = useState(74);

  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => setLiveMin(m => m >= 90 ? 74 : m + 1), 3500);
    return () => clearInterval(id);
  }, [user]);
  const liveClock = `${liveMin}'`;

  const push = (o: Overlay) => setStack(s => [...s, o]);
  const pop  = () => setStack(s => s.slice(0, -1));
  const clearStack = () => setStack([]);

  const openMatch         = (m: Match) => push({ type: 'match', data: m });
  const openPlayer        = (playerId?: string, leagueId?: string) => push({ type: 'player', playerId, playerLeagueId: leagueId });
  const openSearch        = () => push({ type: 'search' });
  const openNotifications = () => { setUnread(0); push({ type: 'notifications' }); };

  const goTab = (key: Tab) => { clearStack(); setTab(key); };
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

  // 1 — Loading session
  if (isLoading) return <LoadingSplash />;

  // 2 — Not authenticated → Login
  if (!user) return <LoginScreen />;

  // 3 — Authenticated but no fav team → Onboarding
  if (isNewUser) {
    return (
      <OnboardingScreen
        onDone={async team => { await setFavTeam({ code: team.code, name: team.name }); }}
      />
    );
  }

  // 4 — Main app
  const fav = profile?.favTeam
    ? { code: profile.favTeam.code, name: profile.favTeam.name, first: profile.username ?? 'You' }
    : undefined;

  const top = stack[stack.length - 1];
  if (top) {
    let ov: React.ReactNode;
    if      (top.type === 'match')         ov = <MatchScreen match={top.data} liveClock={top.data?.focus ? liveClock : null} onBack={pop} onOpenPlayer={openPlayer} />;
    else if (top.type === 'player')        ov = <PlayerScreen playerId={top.playerId} playerLeagueId={top.playerLeagueId} onBack={pop} onOpenMatch={() => { pop(); goTab('live'); }} />;
    else if (top.type === 'search')        ov = <SearchScreen onBack={pop} onOpenPlayer={openPlayer} onOpenMatch={openMatch} />;
    else if (top.type === 'notifications') ov = <NotificationsScreen onBack={pop} onMarkAll={() => setUnread(0)} onOpenMatch={openMatch} onOpenPlayer={openPlayer} />;
    return (
      <div style={{ position: 'relative', height: '100%', background: 'var(--bg-2)' }}>
        <div style={{ height: '100%', animation: 'cs-pushIn 0.26s var(--ease-pop)' }}>{ov}</div>
      </div>
    );
  }

  let screen: React.ReactNode;
  if      (tab === 'home')      screen = <DashboardScreen sport={sport} setSport={setSport} onOpenMatch={openMatch} onOpenPlayer={openPlayer} fav={fav} {...nav} />;
  else if (tab === 'live')      screen = <LiveScoresScreen sport={sport} setSport={setSport} onOpenMatch={openMatch} {...nav} />;
  else if (tab === 'funzone')   screen = <DebatesScreen sport={sport} onOpenPlayer={openPlayer} {...nav} />;
  else if (tab === 'leagues')   screen = <LeaguesScreen sport={sport} onOpenPlayer={openPlayer} {...nav} />;
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
      <div style={{ flex: 1, minHeight: 0 }}>{screen}</div>
      <BottomNav active={bottomActive} onSelect={onBottom} />
      {menuOpen && <MenuDrawer active={tab} onClose={() => setMenuOpen(false)} onNavigate={onMenuNav} />}
    </div>
  );
}

export default function MobileApp() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
