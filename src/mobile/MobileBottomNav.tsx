import React from 'react';

interface BottomTab {
  id: string;
  icon: string;
  label: string;
  defaultTab: string;
}

const BOTTOM_TABS: BottomTab[] = [
  { id: 'dashboard', icon: 'dashboard', label: 'Home', defaultTab: 'dashboard' },
  { id: 'scores', icon: 'scoreboard', label: 'Scores', defaultTab: 'live' },
  { id: 'sports', icon: 'sports', label: 'Sports', defaultTab: 'favorites' },
  { id: 'games', icon: 'sports_esports', label: 'Games', defaultTab: 'game' },
  { id: 'profile', icon: 'person', label: 'Profile', defaultTab: '__profile' },
];

// All league keys that map to "scores" bottom tab
const LEAGUE_KEYS = new Set([
  'ucl', 'pl', 'laliga', 'bundesliga', 'seriea', 'ligue1', 'eredivisie',
  'nba', 'nfl', 'mlb', 'nhl',
  'ipl', 'bbl', 'psl', 'ilt20', 'sa20', 't20wc', 'ranji', 'sheffield', 'county', 'icc_test',
  'f1', 'worldcup',
]);

export function mapTabToBottomNav(tab: string): string {
  if (tab === 'dashboard') return 'dashboard';
  if (tab === '__profile') return 'profile';
  if (tab === 'live' || tab === 'news' || LEAGUE_KEYS.has(tab)) return 'scores';
  if (tab === 'favorites' || tab === 'players' || tab === 'tactics') return 'sports';
  if (tab === 'game' || tab === 'tickets' || tab === 'minigames') return 'games';
  return 'dashboard';
}

interface MobileBottomNavProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

export function MobileBottomNav({ currentTab, setTab }: MobileBottomNavProps) {
  const activeBottomTab = mapTabToBottomNav(currentTab);

  return (
    <nav className="mobile-bottom-nav" role="tablist">
      {BOTTOM_TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeBottomTab === tab.id}
          className={`mobile-bottom-nav__tab${activeBottomTab === tab.id ? ' active' : ''}`}
          onClick={() => setTab(tab.defaultTab)}
        >
          <span className="material-icons-round" aria-hidden="true">{tab.icon}</span>
          <span className="mobile-bottom-nav__tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
