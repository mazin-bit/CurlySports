import React from 'react';

interface MobileHeaderProps {
  currentTab: string;
  setTab: (tab: string) => void;
  selectedSport: string;
  sportLabel: string;
  leagueNames: Record<string, string>;
  leagueLogos: Record<string, string>;
  user: any;
  notificationsBell?: React.ReactNode;
}

const SECTION_TITLES: Record<string, string> = {
  live: 'Live Scores',
  players: 'Top Players',
  tactics: 'Teams',
  news: 'News & Updates',
  favorites: 'My Favorites',
  game: 'Mini Game',
  tickets: 'Tickets',
  minigames: 'Mini Games',
};

function getHeaderTitle(tab: string, sportLabel: string, leagueNames: Record<string, string>): string {
  if (tab === 'dashboard') return '';
  if (leagueNames[tab]) return leagueNames[tab];
  if (tab === 'live') return `${sportLabel} Live`;
  if (tab === 'players') return sportLabel === 'F1' ? 'Top Drivers' : 'Top Players';
  return SECTION_TITLES[tab] || tab.charAt(0).toUpperCase() + tab.slice(1);
}

function needsBackButton(tab: string, leagueNames: Record<string, string>): boolean {
  return (
    leagueNames[tab] != null ||
    tab === 'players' ||
    tab === 'tactics' ||
    tab === 'news' ||
    tab === 'game' ||
    tab === 'tickets' ||
    tab === 'minigames'
  );
}

export function MobileHeader({
  currentTab,
  setTab,
  sportLabel,
  leagueNames,
  leagueLogos,
  user,
  notificationsBell,
}: MobileHeaderProps) {
  const isDashboard = currentTab === 'dashboard';
  const showBack = needsBackButton(currentTab, leagueNames);
  const title = getHeaderTitle(currentTab, sportLabel, leagueNames);
  const titleLogo = leagueLogos[currentTab];

  const handleBack = () => {
    if (leagueNames[currentTab] != null) {
      setTab('live');
    } else {
      setTab('dashboard');
    }
  };

  return (
    <header className="mobile-header">
      {showBack && (
        <button className="mobile-header__back-btn" onClick={handleBack} aria-label="Go back">
          <span className="material-icons-round">arrow_back</span>
        </button>
      )}

      <div className="mobile-header__title-area">
        {isDashboard ? (
          <>
            <img src="/curlysports-logo.png" alt="Curly Sports" className="mobile-header__logo" />
            <span className="mobile-header__greeting">
              Hi, <strong>{user?.name?.split(' ')[0] || 'there'}</strong>
            </span>
          </>
        ) : (
          <>
            {titleLogo && (
              <img src={titleLogo} alt="" className="mobile-header__title-logo" onError={(e: any) => { e.target.style.display = 'none'; }} />
            )}
            <h1 className="mobile-header__title">{title}</h1>
          </>
        )}
      </div>

      <div className="mobile-header__actions">
        {notificationsBell}
      </div>
    </header>
  );
}
