'use client';
import React, { useState, useEffect } from 'react';
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

type Tab = 'home' | 'live' | 'funzone' | 'leagues' | 'profile';
type OverlayType = 'match' | 'player' | 'search' | 'notifications';
interface Overlay { type: OverlayType; data?: Match; playerId?: string; playerLeagueId?: string }

interface Fav { code: string; name: string; first: string }

export default function MobileApp() {
  const [onboarded, setOnboarded] = useState(false);
  const [fav, setFav] = useState<Fav | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [sport, setSport] = useState('football');
  const [stack, setStack] = useState<Overlay[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(3);
  const [liveMin, setLiveMin] = useState(74);

  // Live clock ticker
  useEffect(() => {
    if (!onboarded) return;
    const id = setInterval(() => setLiveMin(m => m >= 90 ? 74 : m + 1), 3500);
    return () => clearInterval(id);
  }, [onboarded]);
  const liveClock = `${liveMin}'`;

  const push = (o: Overlay) => setStack(s => [...s, o]);
  const pop = () => setStack(s => s.slice(0, -1));
  const clearStack = () => setStack([]);

  const openMatch = (m: Match) => push({ type: 'match', data: m });
  const openPlayer = (playerId?: string, leagueId?: string) => push({ type: 'player', playerId, playerLeagueId: leagueId });
  const openSearch = () => push({ type: 'search' });
  const openNotifications = () => push({ type: 'notifications' });

  const goTab = (key: Tab) => { clearStack(); setTab(key); };
  const nav = { onSearch: openSearch, onBell: openNotifications, unread };

  const onBottom = (key: string) => {
    if (key === 'more') { setMenuOpen(true); return; }
    goTab(key as Tab);
  };

  const onMenuNav = (key: string) => {
    setMenuOpen(false);
    if (['home', 'live', 'funzone', 'leagues', 'profile'].includes(key)) { goTab(key as Tab); return; }
    if (key === 'search') { clearStack(); openSearch(); return; }
    if (key === 'notifications') { clearStack(); openNotifications(); return; }
    if (key === 'players' || key === 'favorites') { clearStack(); openPlayer(); return; }
    goTab('home');
  };

  const markAll = () => { setUnread(0); };

  if (!onboarded) {
    return <OnboardingScreen onDone={team => { setFav(team); setOnboarded(true); }} />;
  }

  // Overlay takes the whole screen
  const top = stack[stack.length - 1];
  if (top) {
    let ov: React.ReactNode;
    if (top.type === 'match') ov = <MatchScreen match={top.data} liveClock={top.data?.focus ? liveClock : null} onBack={pop} onOpenPlayer={openPlayer} />;
    else if (top.type === 'player') ov = <PlayerScreen playerId={top.playerId} playerLeagueId={top.playerLeagueId} onBack={pop} onOpenMatch={openMatch} />;
    else if (top.type === 'search') ov = <SearchScreen onBack={pop} onOpenPlayer={openPlayer} onOpenMatch={openMatch} />;
    else if (top.type === 'notifications') ov = <NotificationsScreen onBack={pop} onMarkAll={markAll} onOpenMatch={openMatch} onOpenPlayer={openPlayer} />;
    return (
      <div style={{ position: 'relative', height: '100%', background: 'var(--bg-2)' }}>
        <div style={{ height: '100%', animation: 'cs-pushIn 0.26s var(--ease-pop)' }}>{ov}</div>
      </div>
    );
  }

  let screen: React.ReactNode;
  if (tab === 'home') screen = <DashboardScreen sport={sport} setSport={setSport} onOpenMatch={openMatch} onOpenPlayer={openPlayer} fav={fav} {...nav} />;
  else if (tab === 'live') screen = <LiveScoresScreen onOpenMatch={openMatch} {...nav} />;
  else if (tab === 'funzone') screen = <DebatesScreen onOpenPlayer={openPlayer} {...nav} />;
  else if (tab === 'leagues') screen = <LeaguesScreen onOpenPlayer={openPlayer} {...nav} />;
  else if (tab === 'profile') screen = <ProfileScreen fav={fav} {...nav} />;

  const bottomActive = menuOpen ? 'more' : (['home', 'live', 'funzone', 'leagues'].includes(tab) ? tab : '');

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-2)' }}>
      <div style={{ flex: 1, minHeight: 0 }}>{screen}</div>
      <BottomNav active={bottomActive} onSelect={onBottom} />
      {menuOpen && <MenuDrawer active={tab} onClose={() => setMenuOpen(false)} onNavigate={onMenuNav} />}
    </div>
  );
}
