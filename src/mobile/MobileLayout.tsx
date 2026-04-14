import React, { useMemo } from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav, mapTabToBottomNav } from './MobileBottomNav';
import { MobileSportBar } from './MobileSportBar';
import { MobileSubNav } from './MobileSubNav';
import { MobileProfileScreen } from './MobileProfileScreen';
import { MobilePageTransition } from './MobilePageTransition';

interface MobileLayoutProps {
  // Navigation
  currentTab: string;
  setTab: (tab: string) => void;
  selectedSport: string;
  setSelectedSport: (sport: string) => void;
  enabledSportKeys: string[];

  // Sport config
  sportLabel: string;
  leagueNames: Record<string, string>;
  leagueLogos: Record<string, string>;
  featureFlags: Record<string, boolean>;

  // User
  user: any;
  onLogout: () => void;

  // Theme
  colorScheme: string;
  setColorScheme: (scheme: string) => void;
  themeMode: string;
  setThemeMode: (mode: string) => void;

  // Notifications
  notificationsBell?: React.ReactNode;

  // Content rendering (render props from App.tsx)
  renderDashboard: () => React.ReactNode;
  renderSection: () => React.ReactNode;
  renderTopBar: () => React.ReactNode;

  // Pass-through for modals, toasts, celebrations
  children?: React.ReactNode;
}

export function MobileLayout(props: MobileLayoutProps) {
  const {
    currentTab, setTab, selectedSport, setSelectedSport,
    enabledSportKeys, sportLabel, leagueNames, leagueLogos,
    featureFlags, user, onLogout,
    colorScheme, setColorScheme, themeMode, setThemeMode,
    notificationsBell,
    renderDashboard, renderSection, renderTopBar,
    children,
  } = props;

  const activeBottomTab = mapTabToBottomNav(currentTab);
  const isProfile = currentTab === '__profile';

  // Build sub-nav items based on which bottom tab is active
  const subNavItems = useMemo(() => {
    if (activeBottomTab === 'scores') {
      const items: { id: string; label: string; logo?: string }[] = [
        { id: 'live', label: 'Live' },
      ];
      // Add league tabs for selected sport
      Object.entries(leagueNames).forEach(([key, name]) => {
        items.push({ id: key, label: name, logo: leagueLogos[key] });
      });
      // Add news if feature flag enabled
      if (featureFlags.news !== false) {
        items.push({ id: 'news', label: 'News' });
      }
      return items;
    }
    if (activeBottomTab === 'sports') {
      const items: { id: string; label: string }[] = [];
      if (featureFlags.favorites !== false) {
        items.push({ id: 'favorites', label: 'Favorites' });
      }
      items.push({ id: 'players', label: sportLabel === 'F1' ? 'Drivers' : 'Players' });
      items.push({ id: 'tactics', label: 'Teams' });
      return items;
    }
    if (activeBottomTab === 'games') {
      const items: { id: string; label: string }[] = [
        { id: 'game', label: 'Mini Game' },
        { id: 'tickets', label: 'Tickets' },
      ];
      return items;
    }
    return [];
  }, [activeBottomTab, leagueNames, leagueLogos, featureFlags, sportLabel]);

  const showSportBar = !isProfile && currentTab !== 'dashboard';
  const showSubNav = subNavItems.length > 0 && !isProfile;

  return (
    <div className="mobile-app-shell">
      <div className="mobile-status-bar-spacer" />

      <MobileHeader
        currentTab={currentTab}
        setTab={setTab}
        selectedSport={selectedSport}
        sportLabel={sportLabel}
        leagueNames={leagueNames}
        leagueLogos={leagueLogos}
        user={user}
        notificationsBell={currentTab === 'dashboard' ? notificationsBell : undefined}
      />

      {showSportBar && (
        <MobileSportBar
          selectedSport={selectedSport}
          setSelectedSport={setSelectedSport}
          enabledSportKeys={enabledSportKeys}
        />
      )}

      {showSubNav && (
        <MobileSubNav
          currentTab={currentTab}
          setTab={setTab}
          items={subNavItems}
        />
      )}

      <MobilePageTransition tabKey={currentTab}>
        <main className="mobile-content-area" data-tab={currentTab}>
          {isProfile ? (
            <MobileProfileScreen
              user={user}
              onLogout={onLogout}
              colorScheme={colorScheme}
              setColorScheme={setColorScheme}
              themeMode={themeMode}
              setThemeMode={setThemeMode}
            />
          ) : currentTab === 'dashboard' ? (
            renderDashboard()
          ) : (
            <>
              {renderTopBar()}
              {renderSection()}
            </>
          )}
        </main>
      </MobilePageTransition>

      <MobileBottomNav currentTab={currentTab} setTab={setTab} />

      {/* Modals, toasts, celebrations passed through from App.tsx */}
      {children}
    </div>
  );
}
