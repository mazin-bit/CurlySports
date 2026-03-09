// @ts-nocheck
import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, Navigate, useLocation } from 'react-router-dom';
import './styles/App.css';
import './styles/public-pages.css';
import './styles/theme-experiences.css';
import {
  setUserData,
  addLoginLog,
  subscribeUserData,
  subscribeAppConfig,
  getAppConfigFromServer,
  setAppConfig as updateAppConfig,
  buildSuperAdminEmailsMap
} from './services/database';
import {
  onAuthStateChange,
  signOut as supabaseSignOut,
} from './services/auth';
import { addNotification } from './components/NotificationsBell';
import SurveyInterests from './components/SurveyInterests';
import Dashboard from './pages/Dashboard';
import NotificationsBell from './components/NotificationsBell';
import { AdminDashboard } from './pages/AdminDashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { getCricketStandingsFallback, isCricketTableEmpty, getCricketSeasonYears } from './data/cricketStandingsFallback';
import { getCricketKnockoutFallback } from './data/cricketKnockoutFallback';

import {
  SPORTS_API_SITE_ROOT,
  SPORTS_API_V2_ROOT,
  CRICKET_LEAGUE_ICON,
  SPORTS_CONFIG,
  SPORTS_TABS,
  getSportConfig,
  CRICKET_KNOCKOUT_LEAGUES,
  PLAYER_STATS_BY_SPORT,
  MATCH_DETAIL_CONFIG,
  SPORT_DECOR_ICONS,
  FALLBACK_TEAM_LOGO,
  FALLBACK_LEAGUE_LOGO,
  FALLBACK_PLAYER_IMAGE,
  FALLBACK_NEWS_IMAGE
} from './config/sports';
import {
  SOCCER_ESPN_IDS,
  getHeadshot,
  getNBAHeadshot,
  getNFLHeadshot,
  getMLBHeadshot,
  getNHLHeadshot,
  getCricketHeadshot,
  getF1Headshot,
  SPORT_HEADSHOT_FN
} from './config/headshots';
import { PLAYERS_DATA, TACTICS_DATA, F1_CONSTRUCTORS, EXTRA_SPORT_PLAYERS } from './data/players';
import {
  SUPER_ADMIN_EMAIL,
  ADMIN_EMAIL,
  isSuperAdminEmail,
  isAdminEmail,
  featureFlagsFromConfig,
  getSaRoleForEmail,
  fixTextEncoding
} from './utils/helpers';
import { PublicHeader } from './components/public/PublicHeader';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SportDropdown } from './components/SportDropdown';
import { ProfileMenu } from './components/ProfileMenu';
import { LiveClock, SecondsAgo, TopBar } from './components/TopBar';
import { MatchCard } from './components/MatchCard';
import { Pagination } from './components/Pagination';
import { SuperOverGame, SUPER_OVER_SHOTS, getSuperOverOutcome } from './components/games/SuperOverGame';
import { PenaltyGame } from './components/games/PenaltyGame';
import { StubHubBooking } from './components/StubHubBooking';

/** Fetch clubs/teams for a sport by key (for survey per-sport accordion). Returns empty array on error. */
async function fetchClubsForSport(sportKey) {
  const config = SPORTS_CONFIG[sportKey];
  if (!config?.leagues) return [];
  const apiBase = `${SPORTS_API_SITE_ROOT}/${config.path}`;
  const leagues = config.leagues;
  const leagueNames = config.leagueNames || {};
  try {
    if (sportKey === 'f1') return F1_CONSTRUCTORS;
    if (sportKey === 'cricket') {
      const teamPromises = Object.entries(leagues).map(async ([key, code]) => {
        try {
          const res = await fetch(`${apiBase}/${code}/scoreboard`);
          const data = await res.json();
          const teams = data.teams || [];
          return teams.map(t => ({
            id: t.id,
            name: t.displayName || t.name,
            logo: t.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/cricket/500/${t.id}.png`,
            league: leagueNames[key] || 'Cricket',
            leagueCode: code,
            tagline: t.abbreviation || t.shortDisplayName || '',
            formation: t.location || 'Cricket',
            style: 'Cricket',
            description: `${t.displayName || t.name} competes in ${leagueNames[key]}.`,
            trophies: [],
            lineup: [],
            history: `${t.displayName || t.name} is tracked live from ESPNcricinfo data feeds.`,
            legends: []
          }));
        } catch (_err) {
          return [];
        }
      });
      const results = await Promise.all(teamPromises);
      return results.flat();
    }
    const uniqueClubLeagues = {};
    Object.entries(leagues).forEach(([key, code]) => {
      if (!uniqueClubLeagues[code]) uniqueClubLeagues[code] = key;
    });
    const teamPromises = Object.entries(uniqueClubLeagues).map(async ([code, key]) => {
      const res = await fetch(`${apiBase}/${code}/teams`);
      const data = await res.json();
      const leagueData = data.sports?.[0]?.leagues?.[0];
      const teams = leagueData?.teams || [];
      const groups = leagueData?.groups || [];
      const label = config.label || 'League';
      return teams.map(t => {
        let conference = '';
        if (sportKey === 'basketball' && groups.length > 0) {
          for (const g of groups) {
            if (g.teams?.some(gt => gt.id === t.team.id || gt.$ref?.includes(t.team.id))) {
              conference = g.name || g.abbreviation || '';
              break;
            }
          }
        }
        return {
          id: t.team.id,
          name: t.team.displayName,
          logo: t.team.logos?.[0]?.href,
          league: leagueNames[key] || label,
          leagueCode: code,
          tagline: t.team.shortDisplayName,
          conference: conference || (t.team.groups?.name || ''),
          formation: sportKey === 'soccer' ? '4-3-3' : (t.team.location || label),
          style: sportKey === 'soccer' ? 'Modern' : 'Elite',
          description: t.team.description || `${t.team.displayName} is a top ${label.toLowerCase()} team.`,
          trophies: sportKey === 'soccer' ? ['League Winner', 'Cup Winner', 'Continental Trophy'] : ['League Winner', 'Playoff Contender', 'Historic Team'],
          lineup: [],
          history: `${t.team.displayName} competes in ${leagueNames[key] || 'its league'} and is tracked live from ESPN data feeds.`,
          legends: ['Icon 1', 'Icon 2']
        };
      });
    });
    const results = await Promise.all(teamPromises);
    return results.flat();
  } catch (e) {
    console.error('fetchClubsForSport error:', sportKey, e);
    return [];
  }
}


const Sidebar = ({
  currentTab,
  setTab,
  user,
  onLogout,
  onOpenProfileMenu,
  selectedSport,
  setSelectedSport,
  enabledSportKeys,
  leagueNames,
  leagueLogos,
  leagueShortNames = {},
  leagues = {},
  featureFlags = {},
  collapsed = false,
  onToggleCollapsed,
}) => {
  const leagueLogoUrl = (key) => {
    if (selectedSport === 'cricket' && leagues[key])
      return leagueLogos[key] || `https://a.espncdn.com/i/leaguelogos/cricket/500/${leagues[key]}.png`;
    return leagueLogos[key] || FALLBACK_LEAGUE_LOGO;
  };
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`} aria-label="Main navigation">
      <div className="sidebar-sports-row">
        <div className="sidebar-top-row">
          <div className="logo-container-pro" onClick={() => setTab('dashboard')} title="Go to Dashboard" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTab('dashboard'); } }} aria-label="Go to Dashboard">
            <img
              src={`/curlysports-logo.png`}
              alt="Curly Sports"
              className="sidebar-logo-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = FALLBACK_LEAGUE_LOGO;
              }}
            />
          </div>
        </div>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={(e) => { e.stopPropagation(); onToggleCollapsed?.(); }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="material-icons-round">{collapsed ? 'chevron_right' : 'chevron_left'}</span>
        </button>
        <button type="button" className={`sidebar-dashboard-btn ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')} aria-label="Dashboard" title="Dashboard">
          <span className="material-icons-round">dashboard</span>
          <span className="sidebar-btn-label">Dashboard</span>
        </button>
        <div className="sport-tabs-group">
          <SportDropdown selectedSport={selectedSport} setSelectedSport={setSelectedSport} enabledSportKeys={enabledSportKeys} setTab={setTab} className="sport-dropdown-sidebar" collapsed={collapsed} />
        </div>
      </div>

      <div className="sidebar-leagues-row">
        <nav className="nav-menu">
          {featureFlags.live_scores !== false && (
            <button className={`nav-item ${currentTab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')} title="Live Scores">
              <span className="material-icons-round">timer</span>
              <span className="nav-item-text">Live Scores</span>
            </button>
          )}
          {featureFlags.live_scores !== false && Object.keys(leagueNames).map(key => (
            <button key={key} className={`nav-item nav-item-league ${currentTab === key ? 'active' : ''}`} onClick={() => setTab(key)} title={leagueNames[key]}>
              <span className="nav-icon-wrap" aria-hidden="true">
                <img loading="lazy" decoding="async" src={leagueLogoUrl(key)} className="nav-icon league-logo-img" alt="" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_LEAGUE_LOGO; }} />
              </span>
              <span className="nav-item-text">{leagueShortNames[key] || leagueNames[key]}</span>
            </button>
          ))}
          {featureFlags.favorites !== false && (
            <button className={`nav-item ${currentTab === 'favorites' ? 'active' : ''}`} onClick={() => setTab('favorites')} title="My Favorites">
              <span className="material-icons-round">favorite</span>
              <span className="nav-item-text">My Favorites</span>
            </button>
          )}
          <button className={`nav-item ${currentTab === 'players' ? 'active' : ''}`} onClick={() => setTab('players')} title={selectedSport === 'f1' ? 'Top Drivers' : 'Top Players'}>
            <span className="material-icons-round">{selectedSport === 'f1' ? 'emoji_events' : 'person'}</span>
            <span className="nav-item-text">{selectedSport === 'f1' ? 'Top Drivers' : 'Top Players'}</span>
          </button>
          <button className={`nav-item ${currentTab === 'tactics' ? 'active' : ''}`} onClick={() => setTab('tactics')} title="Teams">
            <span className="material-icons-round">groups</span>
            <span className="nav-item-text">Teams</span>
          </button>
          {featureFlags.news !== false && (
            <button className={`nav-item ${currentTab === 'news' ? 'active' : ''}`} onClick={() => setTab('news')} title="News & Updates">
              <span className="material-icons-round">article</span>
              <span className="nav-item-text">News & Updates</span>
            </button>
          )}
          {selectedSport === 'soccer' && (
            <button className={`nav-item ${currentTab === 'game' ? 'active' : ''}`} onClick={() => setTab('game')} title="Penalty King">
              <span className="material-icons-round">sports_esports</span>
              <span className="nav-item-text">Penalty King</span>
            </button>
          )}
          {selectedSport === 'soccer' && (
            <button className={`nav-item ${currentTab === 'soccer_no_reason' ? 'active' : ''}`} onClick={() => setTab('soccer_no_reason')} title="For no reason">
              <span className="material-icons-round">mood</span>
              <span className="nav-item-text">For No Reason</span>
            </button>
          )}
          {selectedSport === 'cricket' && (
            <button className={`nav-item ${currentTab === 'game' ? 'active' : ''}`} onClick={() => setTab('game')} title="Super Over">
              <span className="material-icons-round">sports_cricket</span>
              <span className="nav-item-text">Super Over</span>
            </button>
          )}
          <button className={`nav-item ${currentTab === 'tickets' ? 'active' : ''}`} onClick={() => setTab('tickets')} title="Tickets">
            <span className="material-icons-round">event</span>
            <span className="nav-item-text">Tickets</span>
          </button>
        </nav>
        <div className="user-profile" onClick={onOpenProfileMenu} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenProfileMenu(); } }} aria-label="Open profile menu" title={user?.name || 'Profile'}>
          <div className="avatar">
            {user?.avatar && user.avatar.length > 2 ? (
              <img
                loading="lazy"
                decoding="async"
                src={user.avatar}
                alt=""
                className="avatar-img"
                onError={(e) => {
                  e.target.onerror = null;
                  const letter = (user?.name || user?.email || 'M').charAt(0).toUpperCase();
                  e.target.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="%230ea5e9"/><text x="22" y="28" text-anchor="middle" fill="white" font-size="18" font-family="sans-serif" font-weight="bold">' + letter + '</text></svg>')}`;
                }}
              />
            ) : (
              (user?.avatar || (user?.name || user?.email || 'M').charAt(0).toUpperCase())
            )}
          </div>
          <div className="user-info">
            <span className="name">{user?.name || 'Member'}</span>
            <span className="status">Online</span>
            {user?.role && (
              <span className="user-role-badge" title="Your role">
                {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Member'}
              </span>
            )}
            {featureFlags.streaks !== false && typeof user?.currentStreak === 'number' && user.currentStreak > 0 && (
              <span className="user-streak" title="Login streak">
                <span className="material-icons-round streak-icon">local_fire_department</span>
                {user.currentStreak} day{user.currentStreak !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button type="button" className="logout-btn-pro" onClick={e => { e.stopPropagation(); onLogout(); }} title="Logout" aria-label="Logout">
            <span className="material-icons-round">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

// --- Main App ---

function App() {
  const location = useLocation();
  const normalizedPath = (location.pathname || '/').replace(/\/+$/, '') || '/';
  const isHomeRoute = normalizedPath === '/';
  const isLoginRoute = normalizedPath === '/login';
  const isSignupRoute = normalizedPath === '/signup';
  const isDashboardRoute = normalizedPath === '/dashboard';
  const getLocalISODate = (date = new Date()) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split('T')[0];
  };
  const getYesterdayISODate = () => getLocalISODate(new Date(Date.now() - 864e5));

  const [selectedSport, setSelectedSport] = useState('soccer');
  const [currentTab, setTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [search, setSearch] = useState('');
  const [appConfig, setAppConfig] = useState({
    featureFlags: [],
    saAdmins: [],
    permissions: [],
    maintenance: false,
    health: {},
    auditLog: [],
    enabledSports: {},
  });
  const featureFlags = useMemo(() => featureFlagsFromConfig(appConfig.featureFlags), [appConfig.featureFlags]);

  /** Sport keys that are enabled (not turned off in config). Includes any key set to true in config so Super Admin–added sports show up. */
  const enabledSportKeys = useMemo(() => {
    const m = appConfig.enabledSports && typeof appConfig.enabledSports === 'object' ? appConfig.enabledSports : {};
    const fromTabs = SPORTS_TABS.filter((s) => m[s] !== false);
    const fromConfigTrue = Object.keys(m).filter((k) => m[k] === true && !SPORTS_TABS.includes(k));
    return [...new Set([...fromTabs, ...fromConfigTrue])];
  }, [appConfig.enabledSports]);

  const THEME_STORAGE_KEY = 'mazin_theme';
  const [colorScheme, setColorScheme] = useState(() => {
    try {
      const s = localStorage.getItem(THEME_STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (p.colorScheme === 'light' || p.colorScheme === 'dark') return p.colorScheme;
      }
    } catch (_) { }
    return 'dark';
  });
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const s = localStorage.getItem(THEME_STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        const valid = ['default', 'sunshine', 'sea', 'fire', 'forest', 'ice', 'flower', 'star'];
        if (valid.includes(p.themeMode)) return p.themeMode;
      }
    } catch (_) { }
    return 'default';
  });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const SIDEBAR_COLLAPSED_KEY = 'curly_sidebar_collapsed';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? 'true' : 'false');
    } catch (_) {}
  }, [sidebarCollapsed]);

  const HOME_THEME_KEY = 'curly_home_theme';
  const [homeTheme, setHomeTheme] = useState(() => {
    try {
      const t = localStorage.getItem(HOME_THEME_KEY);
      if (t === 'light' || t === 'dark') return t;
      // First visit / no preference: always default to light for the home page
    } catch (_) { }
    return 'light';
  });
  useEffect(() => {
    try { localStorage.setItem(HOME_THEME_KEY, homeTheme); } catch (_) { }
  }, [homeTheme]);

  useEffect(() => {
    if (isHomeRoute) document.title = 'Curly Sports | Sports Intelligence Platform';
    else if (isLoginRoute) document.title = 'Login | Curly Sports';
    else if (isSignupRoute) document.title = 'Signup | Curly Sports';
    else document.title = 'Dashboard | Curly Sports';
  }, [isDashboardRoute, isHomeRoute, isLoginRoute, isSignupRoute]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-color-scheme', colorScheme);
    root.setAttribute('data-theme', themeMode);
  }, [colorScheme, themeMode]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ colorScheme, themeMode }));
    } catch (_) { }
  }, [colorScheme, themeMode]);

  // Real-time app config (feature flags, admins, maintenance, enabled sports) from Firestore.
  // Fetch once from server on load so enabled sports / flags are correct (avoids stale cache).
  useEffect(() => {
    let cancelled = false;
    getAppConfigFromServer()
      .then((config) => {
        if (!cancelled) setAppConfig(config);
      })
      .catch((err) => console.warn('Initial app config fetch:', err?.message));
    const unsub = subscribeAppConfig(setAppConfig);
    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Ensure Super Admin's Firestore user doc has role: 'super_admin' so security rules allow config writes
  useEffect(() => {
    if (!user?.uid || !user?.email) return;
    const saRole = getSaRoleForEmail(user.email, appConfig.saAdmins);
    const isSuperAdmin = user.role === 'super_admin' || isSuperAdminEmail(user.email) || saRole === 'super_admin';
    if (!isSuperAdmin) return;
    setUserData(user.uid, {
      role: 'super_admin',
      displayName: user.name || user.email?.split('@')[0] || '',
      email: user.email || ''
    }).catch((e) => console.warn('Sync super_admin role:', e?.message));
  }, [user?.uid, user?.email, user?.name, user?.role, appConfig.saAdmins]);

  // One-time seed of super_admin_emails in config so rules allow access (for any effective super admin, not only when user doc has role)
  const seededSuperAdminEmailsRef = useRef(false);
  useEffect(() => {
    if (seededSuperAdminEmailsRef.current || !user?.email) return;
    const saRole = getSaRoleForEmail(user.email, appConfig.saAdmins);
    const isEffectiveSa = isSuperAdminEmail(user.email) || saRole === 'super_admin';
    if (!isEffectiveSa) return;
    const saAdmins = appConfig.saAdmins || [];
    const map = buildSuperAdminEmailsMap(saAdmins, user.email);
    if (Object.keys(map).length === 0) return;
    seededSuperAdminEmailsRef.current = true;
    updateAppConfig({ super_admin_emails: map }).catch((e) => {
      seededSuperAdminEmailsRef.current = false;
      console.warn('Seed super_admin_emails:', e?.message);
    });
  }, [user?.email, appConfig.saAdmins]);

  // Firebase Auth + real-time user data from Firestore
  useEffect(() => {
    const STREAK_CACHE_KEY = (uid) => `streak_${uid}`;
    const getCachedStreak = (uid) => {
      try {
        const raw = sessionStorage.getItem(STREAK_CACHE_KEY(uid));
        if (!raw) return null;
        const p = JSON.parse(raw);
        if (typeof p.currentStreak === 'number' && typeof p.longestStreak === 'number') {
          return { currentStreak: p.currentStreak, longestStreak: p.longestStreak };
        }
      } catch (_) { }
      return null;
    };
    const setCachedStreak = (uid, currentStreak, longestStreak) => {
      try {
        sessionStorage.setItem(STREAK_CACHE_KEY(uid), JSON.stringify({ currentStreak, longestStreak }));
      } catch (_) { }
    };

    let unsubUser = () => { };
    const unsubscribeAuth = onAuthStateChange((_event, _session, supabaseUser) => {
      setAuthReady(true);
      if (supabaseUser) {
        const userEmail = supabaseUser.email || '';
        const userDisplayName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || userEmail.split('@')[0];
        const userPhotoURL = supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null;
        const userId = supabaseUser.id;
        const isBootstrapEmail = isSuperAdminEmail(userEmail);
        const cached = getCachedStreak(userId);
        const initialStreak = cached ? { currentStreak: cached.currentStreak, longestStreak: cached.longestStreak } : { currentStreak: 1, longestStreak: 1 };
        const isBootstrapAdmin = isAdminEmail(userEmail);
        setUser({
          name: userDisplayName,
          email: userEmail,
          avatar: userPhotoURL || userEmail.charAt(0).toUpperCase(),
          uid: userId,
          role: isBootstrapEmail ? 'super_admin' : isBootstrapAdmin ? 'admin' : undefined,
          ...initialStreak
        });
        setIsAuthenticated(true);

        // Immediately write core profile data so all users appear in admin User Management.
        const isGoogleUser = supabaseUser.app_metadata?.provider === 'google';
        const profilePayload = {
          email: userEmail,
          displayName: userDisplayName,
          ...(userPhotoURL ? { photoURL: userPhotoURL } : {}),
          ...(isGoogleUser ? { provider: 'google' } : {}),
        };
        setUserData(userId, profilePayload).catch(() => { });

        if (isBootstrapEmail) {
          setUserData(userId, { role: 'super_admin', ...profilePayload }).catch(() => { });
          addLoginLog(userId, userEmail, userDisplayName, 'super_admin').catch(() => { });
        }

        let hasRunLoginLogic = false;
        unsubUser = subscribeUserData(userId, (data) => {
          setUserDataLoaded(true);
          if (data) {
            setUserDataState((prev) => {
              const next = { ...data };
              const serverSports = next.surveyInterests?.sports;
              const serverHasSurveyData = serverSports !== undefined && typeof serverSports === 'object';
              const serverSportKeys = Object.keys(serverSports || {}).sort().join(',');
              const prevSportKeys = Object.keys(prev?.surveyInterests?.sports || {}).sort().join(',');
              const prevHasSurvey = prevSportKeys.length > 0;
              const serverSportCount = Object.keys(serverSports || {}).length;
              const prevSportCount = Object.keys(prev?.surveyInterests?.sports || {}).length;
              const recentlyWroteSurvey = lastSurveyWriteAtRef.current && (Date.now() - lastSurveyWriteAtRef.current < 10000);
              if (serverHasSurveyData) {
                if (recentlyWroteSurvey && prev != null) {
                  // Trust local state for a short window after any write to prevent stale Firestore snapshots from reverting changes.
                  next.surveyInterests = prev.surveyInterests;
                  next.surveyCompleted = prev.surveyCompleted ?? next.surveyCompleted;
                  next.surveySkipped = prev.surveySkipped ?? next.surveySkipped;
                  if (Array.isArray(prev.favoriteClubs)) next.favoriteClubs = prev.favoriteClubs;
                  if (Array.isArray(prev.favoritePlayers)) next.favoritePlayers = prev.favoritePlayers;
                } else {
                  next.surveyInterests = data.surveyInterests;
                  next.surveyCompleted = data.surveyCompleted ?? next.surveyCompleted;
                  next.surveySkipped = data.surveySkipped ?? next.surveySkipped;
                  if (Array.isArray(data.favoriteClubs)) next.favoriteClubs = data.favoriteClubs;
                  if (Array.isArray(data.favoritePlayers)) next.favoritePlayers = data.favoritePlayers;
                }
              }
              else if (prev && prevHasSurvey) {
                next.surveyInterests = prev.surveyInterests;
                next.surveyCompleted = prev.surveyCompleted ?? next.surveyCompleted;
                next.surveySkipped = prev.surveySkipped ?? next.surveySkipped;
                if (Array.isArray(prev.favoriteClubs)) next.favoriteClubs = prev.favoriteClubs;
                if (Array.isArray(prev.favoritePlayers)) next.favoritePlayers = prev.favoritePlayers;
              } else if (prev && !serverHasSurveyData) {
                if (prev.surveyInterests?.sports && Object.keys(prev.surveyInterests.sports).length > 0)
                  next.surveyInterests = prev.surveyInterests;
                if (prev.surveyCompleted === true) next.surveyCompleted = true;
                if (prev.surveySkipped === true) next.surveySkipped = true;
                if (Array.isArray(prev.favoriteClubs) && prev.favoriteClubs.length > 0 && (!next.favoriteClubs || next.favoriteClubs.length === 0))
                  next.favoriteClubs = prev.favoriteClubs;
                if (Array.isArray(prev.favoritePlayers) && prev.favoritePlayers.length > 0 && (!next.favoritePlayers || next.favoritePlayers.length === 0))
                  next.favoritePlayers = prev.favoritePlayers;
              }
              return next;
            });
            if (Array.isArray(data.favoriteClubs) && data.favoriteClubs.length > 0) setFavorites(data.favoriteClubs);
            if (Array.isArray(data.favoritePlayers) && data.favoritePlayers.length > 0) setFavoritePlayers(data.favoritePlayers);
            if (data.bookedTickets && typeof data.bookedTickets === 'object') setBookedTickets(data.bookedTickets);
            if (typeof data.penaltyBest === 'number') setPenaltyBest(data.penaltyBest);
            if (typeof data.superOverBest === 'number') setSuperOverBest(data.superOverBest);
            let role = data.role === 'super_admin' || data.role === 'admin' || data.role === 'member' ? data.role : 'member';
            const isBootstrapE = isSuperAdminEmail(userEmail);
            const isBootstrapA = isAdminEmail(userEmail);
            if (isBootstrapE) role = 'super_admin';
            else if (isBootstrapA) role = 'admin';
            const today = getLocalISODate();
            const yesterday = getYesterdayISODate();
            const lastLogin = data.lastLoginDate;
            let currentStreak = typeof data.currentStreak === 'number' ? data.currentStreak : 0;
            let longestStreak = typeof data.longestStreak === 'number' ? data.longestStreak : 0;
            if (!hasRunLoginLogic) {
              hasRunLoginLogic = true;
              if (lastLogin !== today) {
                if (lastLogin === yesterday) currentStreak += 1;
                else currentStreak = 1;
                longestStreak = Math.max(longestStreak, currentStreak);
                setUserData(userId, { lastLoginDate: today, currentStreak, longestStreak, displayName: userDisplayName || '', email: userEmail || '' }).catch(() => { });
              }
              setCachedStreak(userId, currentStreak, longestStreak);
              const finalRole = isBootstrapE ? 'super_admin' : isBootstrapA ? 'admin' : role;
              addLoginLog(userId, userEmail, userDisplayName || userEmail?.split('@')[0], finalRole).catch(() => { });
              setUserData(userId, { displayName: userDisplayName || userEmail?.split('@')[0] || '', email: userEmail || '' }).catch(() => { });
            }
            setUser(prev => prev ? { ...prev, role, currentStreak, longestStreak } : null);
          } else {
            if (!hasRunLoginLogic) {
              hasRunLoginLogic = true;
              const localClubs = JSON.parse(localStorage.getItem('favoriteClubs') || '[]');
              const localPlayers = JSON.parse(localStorage.getItem('favoritePlayers') || '[]');
              const localBooked = JSON.parse(localStorage.getItem('bookedTickets') || '{}');
              const localBest = parseInt(localStorage.getItem('penaltyBest') || '0', 10);
              const localSuperBest = parseInt(localStorage.getItem('superOverBest') || '0', 10);
              const bootstrapSuperAdmin = isSuperAdminEmail(userEmail);
              const bootstrapAdmin = isAdminEmail(userEmail);
              const initialRole = bootstrapSuperAdmin ? 'super_admin' : bootstrapAdmin ? 'admin' : 'member';
              const today = getLocalISODate();
              const streakPayload = { lastLoginDate: today, currentStreak: 1, longestStreak: 1, role: initialRole, displayName: userDisplayName || userEmail?.split('@')[0] || '', email: userEmail || '' };
              if (localClubs.length || localPlayers.length || Object.keys(localBooked).length || localBest > 0 || localSuperBest > 0) {
                setFavorites(localClubs);
                setFavoritePlayers(localPlayers);
                setBookedTickets(localBooked);
                setPenaltyBest(localBest);
                setSuperOverBest(localSuperBest);
                setUserData(userId, { favoriteClubs: localClubs, favoritePlayers: localPlayers, bookedTickets: localBooked, penaltyBest: localBest, superOverBest: localSuperBest, ...streakPayload }).catch(() => { });
              } else {
                setUserData(userId, streakPayload).catch(() => { });
              }
              setCachedStreak(userId, 1, 1);
              addLoginLog(userId, userEmail, userDisplayName || userEmail?.split('@')[0], initialRole).catch(() => { });
              setUser(prev => prev ? { ...prev, role: initialRole, currentStreak: 1, longestStreak: 1 } : null);
            }
          }
        });
      } else {
        unsubUser();
        setUser(null);
        setUserDataState(null);
        setUserDataLoaded(false);
        setIsAuthenticated(false);
        setFavorites(JSON.parse(localStorage.getItem('favoriteClubs') || '[]'));
        setFavoritePlayers(JSON.parse(localStorage.getItem('favoritePlayers') || '[]'));
        setBookedTickets(JSON.parse(localStorage.getItem('bookedTickets') || '{}'));
        setPenaltyBest(parseInt(localStorage.getItem('penaltyBest') || '0', 10));
        setSuperOverBest(parseInt(localStorage.getItem('superOverBest') || '0', 10));
      }
    });
    return () => {
      unsubscribeAuth();
      unsubUser();
    };
  }, []);

  // Update lastSeen in Firestore so admins can see Active/Offline. Run on mount, on focus, and every 2 min.
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    const update = () => setUserData(uid, { lastSeen: new Date().toISOString() }).catch(() => { });
    update();
    const onFocus = () => update();
    window.addEventListener('focus', onFocus);
    const interval = setInterval(update, 2 * 60 * 1000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [user?.uid]);

  // Logout Handler
  const handleLogout = async () => {
    try {
      await supabaseSignOut();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const [page, setPage] = useState(1);
  const [pagePlayers, setPagePlayers] = useState(1);
  const [pageNews, setPageNews] = useState(1);
  const [pageClubs, setPageClubs] = useState(1);
  const [pageFavPlayers, setPageFavPlayers] = useState(1);
  const [pageFavClubs, setPageFavClubs] = useState(1);
  const [pageManageClubs, setPageManageClubs] = useState(1);
  const [userData, setUserDataState] = useState(null);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const lastSurveyWriteAtRef = useRef(0);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [matches, setMatches] = useState([]);
  const [news, setNews] = useState([]);
  const [dashboardNews, setDashboardNews] = useState([]);
  const [transferNews, setTransferNews] = useState([]);
  const [matchReports, setMatchReports] = useState([]);
  const [tickerText, setTickerText] = useState('Loading breaking news...');
  const [favorites, setFavorites] = useState(JSON.parse(localStorage.getItem('favoriteClubs') || '[]'));
  const [favoritePlayers, setFavoritePlayers] = useState(JSON.parse(localStorage.getItem('favoritePlayers') || '[]'));
  const [allClubs, setAllClubs] = useState([]);
  const [tables, setTables] = useState({});
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [playerFilter, setPlayerFilter] = useState('all');
  const [celebration, setCelebration] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [ticketMatches, setTicketMatches] = useState([]);
  const [sportPlayers, setSportPlayers] = useState([]);
  const [selectedMatchForTicket, setSelectedMatchForTicket] = useState(null);
  const [bookedTickets, setBookedTickets] = useState(JSON.parse(localStorage.getItem('bookedTickets') || '{}'));
  const [penaltyBest, setPenaltyBest] = useState(() => parseInt(localStorage.getItem('penaltyBest') || '0', 10));
  const [superOverBest, setSuperOverBest] = useState(() => parseInt(localStorage.getItem('superOverBest') || '0', 10));
  const [ticketDate, setTicketDate] = useState(new Date().toISOString().split('T')[0].split('-').join(''));
  const [isFetchingTickets, setIsFetchingTickets] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [manageSearch, setManageSearch] = useState('');
  const [selectedMatchStatus, setSelectedMatchStatus] = useState(null);
  const [isFetchingMatchDetails, setIsFetchingMatchDetails] = useState(false);
  const [matchDetailTab, setMatchDetailTab] = useState('summary');
  const [selectedDate, setSelectedDate] = useState(getLocalISODate());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [uclKnockoutMatches, setUclKnockoutMatches] = useState([]);
  const [uclTab, setUclTab] = useState('league'); // 'league' or 'knockout'
  const [cricketKnockoutMatches, setCricketKnockoutMatches] = useState({}); // { ipl: [], t20wc: [], ... }
  const [cricketTab, setCricketTab] = useState('league'); // 'league' or 'knockout'
  const [nbaConferenceTab, setNbaConferenceTab] = useState('east'); // 'east' | 'west' — sub-tabs when on NBA
  /** Selected season year for cricket standings (null = current/latest from API). 2008–current+1. */
  const [cricketSeasonYear, setCricketSeasonYear] = useState(null);
  const sportConfig = SPORTS_CONFIG[selectedSport] || {
    ...getSportConfig(selectedSport),
    path: selectedSport,
    leagues: {},
    leagueNames: {},
    leagueLogos: {}
  };
  const leagueNames = sportConfig.leagueNames;
  const leagueLogos = sportConfig.leagueLogos;
  const leagues = sportConfig.leagues;
  const apiBase = `${SPORTS_API_SITE_ROOT}/${sportConfig.path}`;
  const standingsBase = `${SPORTS_API_V2_ROOT}/${sportConfig.path}`;

  // When a feature is disabled, redirect away from that tab (must run after leagueNames is defined)
  useEffect(() => {
    const isLiveTab = currentTab === 'live' || (leagueNames[currentTab] != null);
    const fallback = 'players';
    if (featureFlags.live_scores === false && isLiveTab) setTab(fallback);
    else if (featureFlags.news === false && currentTab === 'news') setTab(fallback);
    else if (featureFlags.favorites === false && currentTab === 'favorites') setTab(fallback);
  }, [featureFlags.live_scores, featureFlags.news, featureFlags.favorites, currentTab, leagueNames]);

  useEffect(() => {
    const isSportTab = currentTab === 'live' || leagueNames[currentTab] != null || currentTab === 'soccer_no_reason';
    if (isSportTab) setTab('live');
    setTables({});
    setMatches([]);
    setNews([]);
    setSportPlayers([]);
    setTickerText(`Loading ${sportConfig.label} updates...`);
    setUclTab('league');
    setCricketTab('league');
    setCricketKnockoutMatches({});
    setPlayerFilter('all');
    setSelectedPlayer(null);
  }, [selectedSport, sportConfig.label]);

  // Clear modals and selections when switching tabs
  useEffect(() => {
    setSelectedPlayer(null);
    setSelectedClub(null);
    setSelectedMatchForTicket(null);
    setSearch('');
    // Reset date to today only when switching tabs, unless it's live tab
    if (currentTab !== 'live') {
      setSelectedDate(getLocalISODate());
    }
    setManageSearch('');
    setSelectedMatchStatus(null);
    setPage(1);
    setPagePlayers(1);
    setPageNews(1);
    setPageClubs(1);
    if (currentTab === 'players') setSearch('');
    // Smooth scroll to top on tab change for better mobile UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentTab]);

  useEffect(() => {
    setPage(1);
    setPagePlayers(1);
    setPageClubs(1);
  }, [search, playerFilter, manageSearch, uclTab]);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  const getPageSize = (type) => {
    if (isMobile) {
      if (type === 'players') return 4;
      if (type === 'news') return 3;
      return 2; // matches, clubs
    } else {
      if (type === 'players') return 8;
      if (type === 'news') return 3;
      return 6; // matches, clubs
    }
  };

  const addToast = useCallback((title, text, type = 'info', icon = 'notifications') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, text, type, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  }, []);

  // Fetch Ticket Data for specific date
  const fetchTicketMatchesByDate = useCallback(async (dateStr) => {
    setIsFetchingTickets(true);
    try {
      // Deduplicate league codes for ticket fetching
      const uniqueTicketLeagues = {};
      Object.entries(leagues).forEach(([key, code]) => {
        if (!uniqueTicketLeagues[code]) uniqueTicketLeagues[code] = key;
      });
      const leaguePromises = Object.entries(uniqueTicketLeagues)
        .map(async ([code, key]) => {
          const res = await fetch(`${apiBase}/${code}/scoreboard?dates=${dateStr}`);
          const data = await res.json();
          return (data.events || []).filter(event => event.id).map(event => {
            // F1: Grand Prix events
            if (selectedSport === 'f1') {
              const circuit = event.circuit;
              const f1Logo = leagueLogos[key] || 'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png';
              return {
                id: event.id,
                league: leagueNames[key],
                home: event.shortName || event.name || 'Grand Prix',
                away: circuit?.fullName || 'Circuit',
                homeLogo: f1Logo,
                awayLogo: f1Logo,
                time: event.status?.type?.shortDetail || 'Scheduled',
                date: event.date,
                priceBase: 200 + (Math.random() * 800),
                venue: circuit?.fullName || 'Circuit',
                pick: `https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800&h=400`,
                sections: [
                  { name: 'GRANDSTAND', price: Math.floor(200 + Math.random() * 500), type: 'E-Ticket' },
                  { name: 'GENERAL', price: Math.floor(100 + Math.random() * 300), type: 'E-Ticket' },
                  { name: 'PADDOCK CLUB', price: Math.floor(500 + Math.random() * 2000), type: 'Premium' }
                ]
              };
            }

            const comp = event.competitions?.[0];
            const competitors = comp?.competitors || [];
            const home = competitors.find(c => c.homeAway === 'home') || competitors[0];
            const away = competitors.find(c => c.homeAway === 'away') || competitors[1] || competitors[0];
            return {
              id: event.id,
              league: leagueNames[key],
              home: home?.team?.displayName || home?.athlete?.displayName || 'Competitor A',
              away: away?.team?.displayName || away?.athlete?.displayName || 'Competitor B',
              homeLogo: home?.team?.logo || home?.athlete?.headshot?.href || 'https://via.placeholder.com/48',
              awayLogo: away?.team?.logo || away?.athlete?.headshot?.href || 'https://via.placeholder.com/48',
              time: event.status?.type?.shortDetail || '',
              date: event.date,
              priceBase: 75 + (Math.random() * 300),
              venue: comp?.venue?.fullName || 'Stadium',
              pick: `https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800&h=400`,
              sections: [
                { name: 'LATERAL', price: Math.floor(80 + Math.random() * 200), type: 'Mobile transfer' },
                { name: 'TRIBUNA', price: Math.floor(120 + Math.random() * 300), type: 'Mobile transfer' },
                { name: 'GOL NORD', price: Math.floor(50 + Math.random() * 100), type: 'Print-at-Home' },
                { name: 'GOL SUD', price: Math.floor(50 + Math.random() * 100), type: 'Mobile transfer' }
              ]
            };
          });
        });

      const results = await Promise.all(leaguePromises);
      setTicketMatches(results.flat());
    } catch (e) {
      console.error('Ticket fetch error:', e);
    }
    setIsFetchingTickets(false);
  }, [apiBase, leagueNames, leagues, selectedSport, leagueLogos]);

  useEffect(() => {
    fetchTicketMatchesByDate(ticketDate);
  }, [ticketDate, fetchTicketMatchesByDate]);

  // Persistence: Firestore when logged in (real-time); localStorage for guests only
  useEffect(() => {
    if (user?.uid) {
      setUserData(user.uid, { bookedTickets }).catch((e) => console.error('Firestore save error:', e));
    } else {
      localStorage.setItem('bookedTickets', JSON.stringify(bookedTickets));
    }
  }, [bookedTickets, user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      setUserData(user.uid, { favoriteClubs: favorites, favoritePlayers }).catch((e) => console.error('Firestore save error:', e));
    } else {
      localStorage.setItem('favoriteClubs', JSON.stringify(favorites));
      localStorage.setItem('favoritePlayers', JSON.stringify(favoritePlayers));
    }
  }, [favorites, favoritePlayers, user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      setUserData(user.uid, { penaltyBest }).catch((e) => console.error('Firestore save error:', e));
    } else {
      localStorage.setItem('penaltyBest', String(penaltyBest));
    }
  }, [penaltyBest, user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      setUserData(user.uid, { superOverBest }).catch((e) => console.error('Firestore save error:', e));
    } else {
      localStorage.setItem('superOverBest', String(superOverBest));
    }
  }, [superOverBest, user?.uid]);

  const toggleFavorite = (name) => {
    setFavorites(prev => prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]);
  };

  const toggleFavoritePlayer = (playerId) => {
    setFavoritePlayers(prev => prev.includes(playerId) ? prev.filter(p => p !== playerId) : [...prev, playerId]);
  };

  const triggerCelebration = useCallback((title, detail) => {
    setCelebration({ title, detail });
    setTimeout(() => setCelebration(null), 5000);
  }, []);

  const fetchMatchDetails = async (match) => {
    if (!match) return;
    const isFallbackCricket = typeof match.id === 'string' && match.id.startsWith('fallback-');
    if (!isFallbackCricket && !match.leagueCode) return;
    setIsFetchingMatchDetails(true);
    try {
      if (isFallbackCricket) {
        // Fallback knockout match: no API; build detail from match object
        const homeAbbr = (match.home || '').replace(/\s+/g, ' ').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase() || 'HOME';
        const awayAbbr = (match.away || '').replace(/\s+/g, ' ').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase() || 'AWAY';
        setSelectedMatchStatus({
          ...match,
          details: {
            periodScores: [
              { team: homeAbbr, logo: match.homeLogo || FALLBACK_TEAM_LOGO, isHome: true, linescores: [match.homeScore || '0', '—'], totalScore: match.homeScore || '0' },
              { team: awayAbbr, logo: match.awayLogo || FALLBACK_TEAM_LOGO, isHome: false, linescores: ['—', match.awayScore || '0'], totalScore: match.awayScore || '0' }
            ],
            gameLeaders: [],
            lineups: [],
            scoringPlays: [],
            keyEvents: [],
            venue: '',
            keyEventsNote: 'Top performer stats are not available for this historical match.'
          }
        });
        setIsFetchingMatchDetails(false);
        return;
      }

      const res = await fetch(`${apiBase}/${match.leagueCode}/summary?event=${match.id}`);
      const data = await res.json();

      // Extract sport-specific enriched details
      const enriched = { ...data };

      // --- Period/Quarter/Inning scores ---
      try {
        const linescores = data.boxscore?.teams?.map(t => ({
          team: t.team?.displayName || t.team?.shortDisplayName || '',
          logo: t.team?.logo || t.team?.logos?.[0]?.href || '',
          scores: (t.statistics || [])
        }));
        // ESPN often puts linescores in header.competitions[0].competitors
        const headerComp = data.header?.competitions?.[0]?.competitors || [];
        if (headerComp.length >= 2) {
          enriched.periodScores = headerComp.map(c => {
            const rawScore = c.score;
            const scoreStr = rawScore != null && rawScore !== '' ? (typeof rawScore === 'object' ? String(rawScore.displayValue ?? rawScore.value ?? rawScore) : String(rawScore)) : '0';
            const lineArr = (c.linescores || []).map(ls => {
              const v = ls?.displayValue ?? ls?.value ?? ls;
              return typeof v === 'object' ? String(v.displayValue ?? v.value ?? '0') : String(v || '0');
            });
            return {
              team: c.team?.abbreviation || c.team?.displayName || '',
              logo: c.team?.logo || c.team?.logos?.[0]?.href || '',
              id: c.id,
              isHome: c.homeAway === 'home',
              linescores: lineArr.length ? lineArr : [scoreStr],
              totalScore: scoreStr
            };
          });
          // Cricket: if linescores empty but we have score, use score as single inning so strip shows something
          if (selectedSport === 'cricket' && enriched.periodScores.every(ps => !ps.linescores || ps.linescores.length === 0)) {
            enriched.periodScores = enriched.periodScores.map(ps => ({
              ...ps,
              linescores: [ps.totalScore],
              totalScore: ps.totalScore
            }));
          }
        } else {
          enriched.periodScores = linescores || [];
        }
        // Cricket fallback: if still no periodScores but we have match scores, build from match
        if (selectedSport === 'cricket' && (!enriched.periodScores || enriched.periodScores.length === 0) && (match.homeScore || match.awayScore)) {
          enriched.periodScores = [
            { team: (match.home || '').slice(0, 3).toUpperCase() || 'A', logo: match.homeLogo || '', isHome: true, linescores: [match.homeScore || '0'], totalScore: match.homeScore || '0' },
            { team: (match.away || '').slice(0, 3).toUpperCase() || 'B', logo: match.awayLogo || '', isHome: false, linescores: [match.awayScore || '0'], totalScore: match.awayScore || '0' }
          ];
        }
      } catch (e) { enriched.periodScores = []; }

      // --- Leaders (top performers) ---
      try {
        const leaders = data.leaders || [];
        enriched.gameLeaders = leaders.map(cat => ({
          name: cat.name || cat.displayName || '',
          displayName: cat.displayName || cat.name || (cat.name || '').replace(/_/g, ' '),
          leaders: (cat.leaders || []).slice(0, 3).map(l => ({
            displayName: l.athlete?.displayName || l.displayName || l.athlete?.fullName || '',
            team: l.team?.abbreviation || l.athlete?.team?.abbreviation || '',
            headshot: l.athlete?.headshot?.href || l.athlete?.headshot || '',
            value: l.displayValue || l.value || (l.statistics?.[0]?.displayValue) || '',
            stats: l.statistics || []
          })).filter(l => l.displayName || l.value)
        })).filter(cat => cat.leaders && cat.leaders.length > 0);
        // Cricket: also try leaders from boxscore or statistics if gameLeaders empty
        if (selectedSport === 'cricket' && enriched.gameLeaders.length === 0 && data.boxscore?.teams) {
          const batting = [];
          const bowling = [];
          data.boxscore.teams.forEach(t => {
            (t.statistics || []).forEach(s => {
              const statName = (s.name || '').toLowerCase();
              if (statName.includes('batting') || statName.includes('runs') || statName === 'r') {
                const leader = s.athletes?.[0] || s.leader;
                if (leader) batting.push({ displayName: leader.displayName || leader.athlete?.displayName, team: t.team?.abbreviation, value: leader.displayValue || leader.value || s.displayValue });
              }
              if (statName.includes('bowling') || statName.includes('wicket') || statName === 'w') {
                const leader = s.athletes?.[0] || s.leader;
                if (leader) bowling.push({ displayName: leader.displayName || leader.athlete?.displayName, team: t.team?.abbreviation, value: leader.displayValue || leader.value || s.displayValue });
              }
            });
          });
          if (batting.length || bowling.length) {
            enriched.gameLeaders = [];
            if (batting.length) enriched.gameLeaders.push({ displayName: 'Top Run Scorers', leaders: batting.slice(0, 3) });
            if (bowling.length) enriched.gameLeaders.push({ displayName: 'Top Wicket Takers', leaders: bowling.slice(0, 3) });
          }
        }
      } catch (e) { enriched.gameLeaders = []; }

      // --- Rosters / Lineups ---
      try {
        const rosters = data.rosters || [];
        enriched.lineups = rosters.map(r => ({
          team: r.team?.displayName || '',
          logo: r.team?.logo || r.team?.logos?.[0]?.href || '',
          players: (r.roster || []).slice(0, 11).map(p => ({
            name: p.athlete?.displayName || p.displayName || '',
            position: p.position?.abbreviation || p.position?.name || '',
            jersey: p.jersey || ''
          }))
        }));
      } catch (e) { enriched.lineups = []; }

      // --- Scoring plays / Key events ---
      try {
        // Different sports put scoring plays in different locations
        const scoringPlays = data.scoringPlays || data.drives?.previous?.flatMap(d => d.plays?.filter(p => p.scoringPlay)) || [];
        enriched.scoringPlays = scoringPlays.map(p => ({
          period: p.period?.number || p.quarter || '',
          periodText: p.period?.displayValue || '',
          clock: p.clock?.displayValue || p.wallclock || '',
          text: p.text || p.shortText || p.description || '',
          team: p.team?.displayName || p.team?.abbreviation || '',
          teamLogo: p.team?.logo || p.team?.logos?.[0]?.href || '',
          homeScore: p.homeScore || '',
          awayScore: p.awayScore || '',
          type: p.type?.text || p.scoringType?.displayName || ''
        }));
      } catch (e) { enriched.scoringPlays = []; }

      // --- Winprobability / Game info ---
      try {
        const gameInfo = data.gameInfo || {};
        enriched.venue = gameInfo.venue?.fullName || gameInfo.venue?.shortName || '';
        enriched.attendance = gameInfo.attendance || '';
        enriched.weather = data.weather?.displayValue || data.weather?.temperature ? `${data.weather.temperature}°F ${data.weather.conditionId || ''}` : '';
      } catch (e) { /* ignore */ }

      setSelectedMatchStatus({
        ...match,
        details: enriched
      });
    } catch (e) {
      console.error('Error fetching match details:', e);
    }
    setIsFetchingMatchDetails(false);
  };

  // Fetch news from all leagues (sources) with periodic refresh — get enough for 10+ pages (30+ items) in every sport
  useEffect(() => {
    const leagueCodes = Object.values(leagues || {});
    const leagueKeys = Object.keys(leagues || {});

    const fetchNews = async () => {
      try {
        if (leagueCodes.length === 0) {
          setNews([]);
          setTickerText(`No ${sportConfig.label.toLowerCase()} sources configured.`);
          return;
        }
        // Request more articles per league so single-league sports (NBA, NFL, MLB, NHL, F1) get 10+ pages
        const limit = 50;
        const results = await Promise.allSettled(
          leagueCodes.map((code) =>
            fetch(`${apiBase}/${code}/news?limit=${limit}`).then((r) => r.json())
          )
        );
        const combined = [];
        results.forEach((outcome, idx) => {
          if (outcome.status !== 'fulfilled' || !outcome.value) return;
          const newsData = outcome.value;
          const articles = newsData.articles || [];
          const sourceName = leagueNames[leagueKeys[idx]] || sportConfig.label;
          articles.forEach((a) => {
            combined.push({
              tag: fixTextEncoding(a.categories?.[0]?.description) || sportConfig.label,
              title: fixTextEncoding(a.headline) || '',
              excerpt: fixTextEncoding(a.description) || '',
              image: a.images?.[0]?.url || 'https://via.placeholder.com/400x200',
              link: a.links?.web?.href,
              source: sourceName,
              published: a.published || a.lastModified || new Date().toISOString()
            });
          });
        });
        const seen = new Set();
        const deduped = combined.filter((a) => {
          const id = a.link || a.title;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        // Keep enough for 10+ pages at 3 per page (30+), cap at 200 so every sport has plenty
        setNews(deduped.slice(0, 200));
        const tickerItems = deduped.slice(0, 5).map((a) => `• ${a.title}`);
        setTickerText(tickerItems.length ? tickerItems.join('      ') : `No breaking ${sportConfig.label.toLowerCase()} headlines right now.`);
      } catch (e) {
        console.error('News fetch error:', e);
      }
    };
    fetchNews();
    const newsInterval = setInterval(fetchNews, 30000);
    return () => clearInterval(newsInterval);
  }, [apiBase, leagues, leagueNames, sportConfig.label]);

  // Unified feed: fetch many news + every match report + every transfer article for each sport from all leagues (lively, 5+ pages per category)
  const NEWS_LIMIT_PER_LEAGUE = 200;
  const MAX_NEWS_TOTAL = 1000;
  const MAX_MATCH_REPORTS_TOTAL = 800;
  const MAX_TRANSFER_NEWS_TOTAL = 800;
  const FEED_REFRESH_INTERVAL_MS = 45000; // 45 seconds for lively updates

  useEffect(() => {
    const sportsToFetch = enabledSportKeys && enabledSportKeys.length > 0
      ? enabledSportKeys
      : Object.keys(SPORTS_CONFIG);
    if (sportsToFetch.length === 0) {
      setDashboardNews([]);
      setTransferNews([]);
      setMatchReports([]);
      return;
    }

    const base = SPORTS_API_SITE_ROOT;
    const transferCategoryPattern = /transfer\s*talk|transfer\s*rumor|transfer\s*rumour|transfer\s*news|transfers|transfer\s*market|signing\s*news|rumors?\s*&\s*rumours?|done\s*deal|transfer\s*centre|free\s*agency|trade\s*rumor|trade\s*news|signing|trades?|contract|waived|acquired|traded\s+to|roster\s*move|extension\s*talk|auction|retention|released\s*players|draft\b|trade\s*window|re-signed/i;
    const transferHeadlinePattern = /^transfer\s*(rumors?|news|talk)\s*[,:]|^transfer\s*rumors?,?\s*news|transfer\s*round|signing|signed\s+for|joins\s+\w+|agrees\s+deal|^trade\s*(rumors?|news|deadline)|free\s*agency|signed\s+with|contract\s+extension|waived\s+by|traded\s+to|acquired\s+by|ipl\s*auction|bbl\s*draft|retained\s+by|released\s+by|re-signs?\b/i;
    const matchReportCategoryPattern = /recap|match\s*report|match\s*reports|game\s*report|full-time|ft\s*report|result|round\s*up|wrap\s*up|highlights?\s*report|match\s*centre|game\s*recap|box\s*score|final\s*score|game\s*summary|top\s*performers/i;
    const matchReportHeadlinePattern = /\b(beat|beats|defeat|defeats|win|wins|loss|relegation|victory|draw|condemn|consigned|full-time|\bft\b|result|scoreline|highlights?|match report|report:\s*|recap|final\s*score|box\s*score|rout|blowout|overtime|halftime|quarter\s*\d|game\s*recap|top\s*performers)\b/i;
    const matchResultInDescription = /\b(defeat|defeats?|win(?:s|ning)?|loss|beat|beats?|relegation|victory|draw|full-time|\bft\b|match report|scoreline|scored\s+a\s+goal|final\s*score|quarter|halftime|overtime|box\s*score|game\s*recap)\b/i;

    const fetchAllSportFeeds = async () => {
      try {
        const allRequests = [];
        sportsToFetch.forEach((sportKey) => {
          const config = SPORTS_CONFIG[sportKey];
          if (!config || !config.leagues) return;
          const path = config.path;
          const sportLabel = config.label || sportKey;
          Object.entries(config.leagues).forEach(([leagueKey, code]) => {
            const leagueName = (config.leagueNames && config.leagueNames[leagueKey]) || leagueKey;
            const source = `${sportLabel} · ${leagueName}`;
            allRequests.push(
              fetch(`${base}/${path}/${code}/news?limit=${NEWS_LIMIT_PER_LEAGUE}`)
                .then((r) => r.json())
                .then((data) => ({ data: data.articles || [], source, sportKey }))
                .catch(() => ({ data: [], source, sportKey }))
            );
          });
        });

        const results = await Promise.all(allRequests);
        const allArticles = [];
        const matchReportsList = [];
        const transferNewsList = [];

        // Iterate results and destruct properties
        results.forEach(({ data: articles, source, sportKey }) => {
          (articles || []).forEach((a) => {
            const categoryDesc = (a.categories?.[0]?.description || '').trim();
            const headline = (a.headline || '').trim();
            const headlineLower = headline.toLowerCase();
            const desc = (a.description || '').toLowerCase();
            const item = {
              tag: fixTextEncoding(a.categories?.[0]?.description) || source,
              title: fixTextEncoding(a.headline) || '',
              excerpt: fixTextEncoding(a.description) || '',
              image: a.images?.[0]?.url || 'https://via.placeholder.com/400x200',
              link: a.links?.web?.href,
              source,
              sportKey,
              published: a.published || a.lastModified || new Date().toISOString()
            };

            const isTransfer = transferCategoryPattern.test(categoryDesc) || transferHeadlinePattern.test(headline);
            const isMatchReport = matchReportCategoryPattern.test(categoryDesc) || matchReportHeadlinePattern.test(headlineLower) || matchResultInDescription.test(desc);
            if (isTransfer && !isMatchReport) {
              transferNewsList.push(item);
            } else if (isMatchReport && !isTransfer) {
              matchReportsList.push(item);
            }
            allArticles.push(item);
          });
        });

        const dedupe = (list, keyFn) => {
          const seen = new Set();
          return list.filter((a) => {
            const id = keyFn(a);
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          });
        };
        const byLinkOrTitle = (a) => a.link || a.title;
        const sortByNewest = (list) => [...list].sort((a, b) => new Date(b.published) - new Date(a.published));

        setDashboardNews(sortByNewest(dedupe(allArticles, byLinkOrTitle)).slice(0, MAX_NEWS_TOTAL));
        setMatchReports(sortByNewest(dedupe(matchReportsList, byLinkOrTitle)).slice(0, MAX_MATCH_REPORTS_TOTAL));
        setTransferNews(sortByNewest(dedupe(transferNewsList, byLinkOrTitle)).slice(0, MAX_TRANSFER_NEWS_TOTAL));
      } catch (e) {
        console.error('Sport feeds fetch error:', e);
        setDashboardNews([]);
        setMatchReports([]);
        setTransferNews([]);
      }
    };

    fetchAllSportFeeds();
    const interval = setInterval(fetchAllSportFeeds, FEED_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabledSportKeys]);

  /* Legacy separate effects removed – unified feed above handles news, match reports, transfer for all sports. */

  // Filter feeds to only the user's survey sports so dashboard shows mixed content from their chosen sports
  const surveySportLabelsForFilter = useMemo(() => {
    const sports = userData?.surveyInterests?.sports && typeof userData.surveyInterests.sports === 'object' ? userData.surveyInterests.sports : {};
    return Object.keys(sports).map((k) => (SPORTS_CONFIG[k]?.label || k));
  }, [userData?.surveyInterests?.sports]);

  const dashboardNewsForUser = useMemo(() => {
    const chosenKeys = userData?.surveyInterests?.sports ? Object.keys(userData.surveyInterests.sports) : [];
    if (chosenKeys.length === 0) return dashboardNews;
    return dashboardNews.filter((item) =>
      (item.sportKey && chosenKeys.includes(item.sportKey)) ||
      surveySportLabelsForFilter.some((label) => (item.source || '').startsWith(label))
    );
  }, [dashboardNews, surveySportLabelsForFilter, userData?.surveyInterests?.sports]);

  const transferNewsForUser = useMemo(() => {
    const chosenKeys = userData?.surveyInterests?.sports ? Object.keys(userData.surveyInterests.sports) : [];
    if (chosenKeys.length === 0) return transferNews;
    return transferNews.filter((item) =>
      (item.sportKey && chosenKeys.includes(item.sportKey)) ||
      surveySportLabelsForFilter.some((label) => (item.source || '').startsWith(label))
    );
  }, [transferNews, surveySportLabelsForFilter, userData?.surveyInterests?.sports]);

  const matchReportsForUser = useMemo(() => {
    const chosenKeys = userData?.surveyInterests?.sports ? Object.keys(userData.surveyInterests.sports) : [];
    if (chosenKeys.length === 0) return matchReports;
    return matchReports.filter((item) =>
      (item.sportKey && chosenKeys.includes(item.sportKey)) ||
      surveySportLabelsForFilter.some((label) => (item.source || '').startsWith(label))
    );
  }, [matchReports, surveySportLabelsForFilter, userData?.surveyInterests?.sports]);

  const fetchAllData = useCallback(async () => {
    try {
      // Calculate date range: YYYYMMDD
      const formatDate = (isoString) => isoString.replace(/-/g, '');


      let datesParam = '';

      // Check for "Team A vs Team B" pattern
      const vsMatch = search.toLowerCase().match(/(.+)\s+vs\s+(.+)/);
      let teamA = '', teamB = '';
      if (vsMatch) {
        teamA = vsMatch[1].trim();
        teamB = vsMatch[2].trim();
      }

      if (search.length > 2) {
        // If searching, expand range significantly (-30 days to +90 days) to find the match
        // We can just rely on basic UTC dates for wide range searches as exact day matters less
        const s = new Date();
        s.setDate(s.getDate() - 30);
        const e = new Date();
        e.setDate(e.getDate() + 90);

        datesParam = `${s.toISOString().slice(0, 10).replace(/-/g, '')}-${e.toISOString().slice(0, 10).replace(/-/g, '')}`;
      } else {
        // Default: selected date ONLY
        // selectedDate is already YYYY-MM-DD local string from state
        datesParam = formatDate(selectedDate);
      }

      // Fetch Matches - deduplicate league codes (e.g. nba-east & nba-west share 'nba')
      const uniqueLeagues = {};
      Object.entries(leagues).forEach(([key, code]) => {
        if (!uniqueLeagues[code]) uniqueLeagues[code] = key;
      });
      const leaguePromises = Object.entries(uniqueLeagues)
        .map(async ([code, key]) => {
          try {
            const res = await fetch(`${apiBase}/${code}/scoreboard?dates=${datesParam}&limit=200`);
            if (!res.ok) return [];
            const data = await res.json().catch(() => ({}));
            if (!data || !Array.isArray(data.events)) return [];

            // F1: Grand Prix events with sub-competitions (FP1, FP2, Qual, Race)
            if (selectedSport === 'f1') {
              return (data.events || []).filter(event => event.id).map(event => {
                const raceComp = event.competitions?.find(c => c.type?.abbreviation === 'Race') || event.competitions?.[event.competitions.length - 1];
                const matchDate = new Date(event.date);
                const dateStr = matchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const timeStr = matchDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                const raceStatus = raceComp?.status?.type || event.status?.type || {};
                const circuit = event.circuit;
                const f1Logo = leagueLogos[key] || 'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png';
                return {
                  id: event.id,
                  leagueCode: code,
                  league: leagueNames[key],
                  home: event.shortName || event.name || 'Grand Prix',
                  away: circuit?.fullName || circuit?.address?.city || 'Circuit',
                  homeShort: event.shortName || '',
                  awayShort: circuit?.address?.city || '',
                  homeScore: raceStatus.state === 'post' ? 'Finished' : '',
                  awayScore: circuit?.address?.country || '',
                  time: `${dateStr} ${timeStr}`,
                  rawDate: event.date,
                  isLive: raceStatus.state === 'in',
                  isCompleted: raceStatus.state === 'post',
                  status: raceStatus.shortDetail || raceStatus.detail || 'Scheduled',
                  statusDetail: raceStatus.detail || '',
                  homeLogo: f1Logo,
                  awayLogo: f1Logo,
                  winner: null,
                  scoringPlays: []
                };
              });
            }

            return (data.events || []).filter(event => event.competitions?.[0]).map(event => {
              const comp = event.competitions[0];
              const competitors = comp?.competitors || [];
              const home = competitors.find(c => c.homeAway === 'home') || competitors[0];
              const away = competitors.find(c => c.homeAway === 'away') || competitors[1] || competitors[0];

              // Format time nicely
              const matchDate = new Date(event.date);
              const dateStr = matchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              const timeStr = matchDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

              return {
                id: event.id,
                leagueCode: code,
                league: leagueNames[key],
                home: home?.team?.displayName || home?.athlete?.displayName || 'Competitor A',
                away: away?.team?.displayName || away?.athlete?.displayName || 'Competitor B',
                homeShort: home?.team?.shortDisplayName || home?.athlete?.shortName || '', // Added for search matching
                awayShort: away?.team?.shortDisplayName || away?.athlete?.shortName || '', // Added for search matching
                homeScore: home?.score || '0',
                awayScore: away?.score || '0',
                time: `${dateStr} ${timeStr}`,
                rawDate: event.date,
                isLive: event.status?.type?.state === 'in',
                isCompleted: event.status?.type?.state === 'post',
                status: event.status?.type?.shortDetail || '',
                statusDetail: event.status?.type?.detail || '', // Contains "won on penalties" info
                homeLogo: home?.team?.logo || (selectedSport === 'cricket' && home?.team?.id ? `https://a.espncdn.com/i/teamlogos/cricket/500/${home.team.id}.png` : null) || home?.athlete?.headshot?.href || 'https://via.placeholder.com/48',
                awayLogo: away?.team?.logo || (selectedSport === 'cricket' && away?.team?.id ? `https://a.espncdn.com/i/teamlogos/cricket/500/${away.team.id}.png` : null) || away?.athlete?.headshot?.href || 'https://via.placeholder.com/48',
                winner: home?.winner === 'true' || home?.winner === true ? 'home' : (away?.winner === 'true' || away?.winner === true ? 'away' : null),
                recapLink: (event.links || []).find(l => l.rel?.includes('recap') && l.rel?.includes('desktop'))?.href || (event.links || []).find(l => l.rel?.includes('recap'))?.href,
                sportKey: selectedSport,
                scoringPlays: (comp.scoringPlays || []).map(p => {
                  try {
                    return {
                      id: p.id,
                      teamId: p.team?.id,
                      clock: p.clock?.displayValue || '',
                      result: p.result,
                      participants: (p.participants || []).map(pr => ({
                        id: pr.athlete?.id,
                        name: pr.athlete?.displayName || '',
                        type: pr.type?.name || ''
                      }))
                    };
                  } catch (_e) { return null; }
                }).filter(Boolean)
              };
            });
          } catch (_e) {
            return [];
          }
        });

      const matchResults = await Promise.all(leaguePromises);
      let allMatches = matchResults.flat().sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

      // Filter by "Team A vs Team B" specifically if pattern matched
      if (teamA && teamB) {
        allMatches = allMatches.filter(m =>
          (
            (m.home.toLowerCase().includes(teamA) || m.homeShort?.toLowerCase().includes(teamA)) &&
            (m.away.toLowerCase().includes(teamB) || m.awayShort?.toLowerCase().includes(teamB))
          ) || (
            (m.home.toLowerCase().includes(teamB) || m.homeShort?.toLowerCase().includes(teamB)) &&
            (m.away.toLowerCase().includes(teamA) || m.awayShort?.toLowerCase().includes(teamA))
          )
        );
      }

      setMatches(prevMatches => {
        // Check for goal celebrations & notifications
        if (prevMatches.length > 0) {
          allMatches.forEach(newM => {
            const oldM = prevMatches.find(m => m.id === newM.id);
            if (oldM) {
              const homeScored = parseInt(newM.homeScore) > parseInt(oldM.homeScore);
              const awayScored = parseInt(newM.awayScore) > parseInt(oldM.awayScore);

              // 1. Favorite Club Scored
              if (homeScored && favorites.includes(newM.home)) {
                triggerCelebration('GOAL!', `${newM.home.toUpperCase()} SCORED!`);
                addToast('GOAL!', `${newM.home} just scored!`, 'success', sportConfig.icon);
                if (user?.uid) addNotification(user.uid, 'goal', 'GOAL!', `${newM.home} just scored!`, { matchId: newM.id, teamName: newM.home }).catch(() => { });
              }
              if (awayScored && favorites.includes(newM.away)) {
                triggerCelebration('GOAL!', `${newM.away.toUpperCase()} SCORED!`);
                addToast('GOAL!', `${newM.away} just scored!`, 'success', sportConfig.icon);
                if (user?.uid) addNotification(user.uid, 'goal', 'GOAL!', `${newM.away} just scored!`, { matchId: newM.id, teamName: newM.away }).catch(() => { });
              }

              // 2. Favorite Club Conceded
              if (homeScored && favorites.includes(newM.away)) {
                addToast('GOAL CONCEDED', `${newM.away} just conceded against ${newM.home}.`, 'danger', 'warning');
                if (user?.uid) addNotification(user.uid, 'goal', 'Goal conceded', `${newM.away} conceded vs ${newM.home}`, { matchId: newM.id }).catch(() => { });
              }
              if (awayScored && favorites.includes(newM.home)) {
                addToast('GOAL CONCEDED', `${newM.home} just conceded against ${newM.away}.`, 'danger', 'warning');
                if (user?.uid) addNotification(user.uid, 'goal', 'Goal conceded', `${newM.home} conceded vs ${newM.away}`, { matchId: newM.id }).catch(() => { });
              }

              // 3. Favorite Player Scored/Assisted
              if (homeScored || awayScored) {
                const newPlays = newM.scoringPlays.filter(np => !oldM.scoringPlays.some(op => op.id === np.id));
                newPlays.forEach(play => {
                  play.participants.forEach(p => {
                    if (favoritePlayers.includes(parseInt(p.id))) {
                      if (p.type === 'scorer') {
                        triggerCelebration('PLAYER GOAL!', `${p.name.toUpperCase()} SCORED!`);
                        addToast('FAVORITE PLAYER SCORE!', `${p.name} just scored for ${play.teamId === newM.homeId ? newM.home : newM.away}!`, 'success', 'stars');
                        if (user?.uid) addNotification(user.uid, 'player_news', `${p.name} scored!`, `Scored for ${play.teamId === newM.homeId ? newM.home : newM.away}`, { playerId: p.id }).catch(() => { });
                      } else if (p.type === 'assist') {
                        addToast('ASSIST!', `${p.name} provided an assist!`, 'info', 'shortcut');
                        if (user?.uid) addNotification(user.uid, 'player_news', 'Assist!', `${p.name} provided an assist`, { playerId: p.id }).catch(() => { });
                      }
                    }
                  });
                });
              }
            }
          });
        }
        return allMatches;
      });

      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    }
  }, [favorites, search, selectedDate, favoritePlayers, addToast, triggerCelebration, leagues, apiBase, leagueNames, sportConfig.icon, selectedSport, leagueLogos, user?.uid, surveySportLabelsForFilter]);

  // Dashbord matches effect: Fetch matches for all survey sports to ensure variety
  useEffect(() => {
    if (currentTab !== 'dashboard') return;
    const chosen = userData?.surveyInterests?.sports ? Object.keys(userData.surveyInterests.sports) : [];
    if (chosen.length === 0) return;

    const base = `${SPORTS_API_SITE_ROOT}`;
    const dateStr = getLocalISODate().replace(/-/g, '');

    const fetchAllChosen = async () => {
      try {
        const promises = chosen.map(async (sportKey) => {
          const config = SPORTS_CONFIG[sportKey];
          if (!config || !config.leagues) return [];
          const leagueCodes = Object.values(config.leagues);
          const uniqueCodes = Array.from(new Set(leagueCodes));

          const innerPromises = uniqueCodes.map(async (code) => {
            try {
              const res = await fetch(`${base}/${config.path}/${code}/scoreboard?dates=${dateStr}&limit=50`);
              const d = await res.json();
              return (d.events || []).map(ev => {
                const cmp = ev.competitions?.[0];
                const h = cmp?.competitors?.find(c => c.homeAway === 'home');
                const a = cmp?.competitors?.find(c => c.homeAway === 'away');
                return {
                  id: ev.id,
                  league: config.leagueNames?.[Object.keys(config.leagues).find(k => config.leagues[k] === code)] || config.label,
                  home: h?.team?.displayName || 'TBD',
                  away: a?.team?.displayName || 'TBD',
                  homeScore: h?.score || '0',
                  awayScore: a?.score || '0',
                  time: new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  rawDate: ev.date,
                  isLive: ev.status?.type?.state === 'in',
                  isCompleted: ev.status?.type?.state === 'post',
                  status: ev.status?.type?.shortDetail || '',
                  homeLogo: h?.team?.logo,
                  awayLogo: a?.team?.logo,
                  sportKey: sportKey,
                  recapLink: (ev.links || []).find(l => l.rel?.includes('recap'))?.href
                };
              });
            } catch { return []; }
          });
          const results = await Promise.all(innerPromises);
          return results.flat();
        });

        const all = await Promise.all(promises);
        const flat = all.flat();
        setMatches(prev => {
          const matchMap = new Map(prev.map(m => [m.id, m]));
          let changed = false;
          flat.forEach(m => {
            const existing = matchMap.get(m.id);
            if (!existing || JSON.stringify(existing) !== JSON.stringify(m)) {
              matchMap.set(m.id, m);
              changed = true;
            }
          });
          if (!changed) return prev;
          return Array.from(matchMap.values()).sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
        });
      } catch (e) { console.error('Dashboard extra fetch error:', e); }
    };
    fetchAllChosen();
  }, [currentTab, userData?.surveyInterests?.sports]);

  const fetchTable = useCallback(async (key, forceRefresh = false, seasonYearParam = null) => {
    const isCricket = selectedSport === 'cricket';
    const requestedSeason = isCricket ? seasonYearParam : null;
    const cacheKey = key;
    // For cricket: when requesting a specific season, always fetch if cached season doesn't match (or force refresh)
    const cached = tables[cacheKey];
    const seasonMismatch = isCricket && requestedSeason != null && cached?.seasonYear != null && cached.seasonYear !== requestedSeason;
    if (cached && !forceRefresh && !seasonMismatch && (requestedSeason == null || cached.seasonYear === requestedSeason)) return;
    try {
      // Cricket: when a specific season is selected, prefer fallback data so every league shows that year (ESPN often returns current/empty for past seasons)
      if (isCricket && requestedSeason != null) {
        const fallback = getCricketStandingsFallback(key, requestedSeason);
        if (fallback?.rows?.length > 0) {
          setTables((prev) => ({
            ...prev,
            [key]: {
              columns: fallback.columns,
              rows: fallback.rows,
              conferences: fallback.conferences || [],
              seasonYear: requestedSeason
            }
          }));
          return;
        }
        if (fallback?.conferences?.length > 0) {
          setTables((prev) => ({
            ...prev,
            [key]: {
              columns: fallback.columns,
              rows: fallback.rows?.length ? fallback.rows : fallback.conferences[0].rows,
              conferences: fallback.conferences,
              seasonYear: requestedSeason
            }
          }));
          return;
        }
      }

      const code = (isCricket && sportConfig.standingsLeagueIds?.[key]) ? sportConfig.standingsLeagueIds[key] : leagues[key];
      const seasonQuery = isCricket && requestedSeason != null ? `?season=${requestedSeason}` : '';
      const url = `${standingsBase}/${code}/standings${seasonQuery}`;
      const res = await fetch(url);
      const data = await res.json();
      const seasonYear = data.season?.year ?? requestedSeason ?? null;

      const isDriverStandings = selectedSport === 'f1';
      const preferredStatsBySport = {
        soccer: ['GP', 'W', 'D', 'L', 'GD', 'P'],
        basketball: ['W', 'L', 'PCT', 'GB', 'STRK', 'L10'],
        football: ['W', 'L', 'T', 'PCT', 'PF', 'PA'],
        baseball: ['W', 'L', 'PCT', 'GB', 'STRK', 'L10'],
        hockey: ['W', 'L', 'OTL', 'PTS', 'GF', 'GA'],
        cricket: ['M', 'W', 'L', 'N/R', 'NRR', 'PT'],
        f1: ['PTS']
      };
      const fallbackStats = ['W', 'L', 'PCT', 'GB', 'PTS', 'PF', 'PA', 'F', 'A', 'GD', 'P'];
      const preferred = preferredStatsBySport[selectedSport] || fallbackStats;

      const parseConference = (child) => {
        const entries = child?.standings?.entries || [];
        if (entries.length === 0) return null;
        const conferenceName = child?.name || child?.abbreviation || '';
        const sampleStats = entries[0]?.stats || [];
        const filteredSampleStats = isDriverStandings
          ? sampleStats.filter(s => ['rank', 'points', 'championshipPts'].includes(s.type) || ['RK', 'PTS'].includes(s.abbreviation))
          : sampleStats;
        const selectedStatKeys = preferred
          .filter((ab) => filteredSampleStats.some((s) => s.abbreviation === ab))
          .slice(0, 6);
        const dynamicStatKeys = selectedStatKeys.length > 0
          ? selectedStatKeys
          : filteredSampleStats
            .map((s) => s.abbreviation)
            .filter((ab) => ab && !['R', 'RK', 'RANK', 'POS'].includes(ab.toUpperCase()))
            .slice(0, 6);
        const rows = entries.map((entry) => {
          const stats = entry.stats || [];
          const getStat = (ab) => stats.find((s) => s.abbreviation === ab)?.displayValue || '-';
          const rank = getStat('R') || getStat('RK') || getStat('RANK') || '-';
          const values = {};
          dynamicStatKeys.forEach((keyName) => { values[keyName] = getStat(keyName); });
          if (isDriverStandings) {
            return { pos: rank, team: entry.athlete?.displayName || 'Driver', logo: entry.athlete?.flag?.href || FALLBACK_TEAM_LOGO, values };
          }
          const teamLogo = entry.team?.logos?.[0]?.href || (selectedSport === 'cricket' && entry.team?.id ? `https://a.espncdn.com/i/teamlogos/cricket/500/${entry.team.id}.png` : undefined) || FALLBACK_TEAM_LOGO;
          return { pos: rank, team: entry.team?.displayName || 'Team', logo: teamLogo, values };
        });
        return { name: conferenceName, columns: dynamicStatKeys, rows };
      };

      const children = data.children || [];

      // T20 World Cup (and other multi-group cricket): try fallback first when season is set (ESPN often has no/empty group data for past years)
      if (selectedSport === 'cricket' && key === 't20wc' && requestedSeason != null) {
        const t20Fallback = getCricketStandingsFallback('t20wc', requestedSeason);
        if (t20Fallback?.conferences?.length > 0) {
          setTables((prev) => ({
            ...prev,
            [key]: {
              columns: t20Fallback.columns,
              rows: t20Fallback.rows?.length ? t20Fallback.rows : t20Fallback.conferences[0].rows,
              conferences: t20Fallback.conferences,
              seasonYear: requestedSeason
            }
          }));
          return;
        }
      }

      // Cricket with multiple groups (e.g. T20 World Cup, Ranji groups): show each as a group table
      if (selectedSport === 'cricket' && children.length > 1) {
        const conferences = children.map(parseConference).filter(Boolean);
        const useFallback = requestedSeason != null && (conferences.length === 0 || conferences.every(c => isCricketTableEmpty(c.rows)));
        const fallback = useFallback ? getCricketStandingsFallback(key, requestedSeason) : null;
        if (fallback?.conferences?.length > 0) {
          setTables((prev) => ({
            ...prev,
            [key]: {
              columns: fallback.columns,
              rows: fallback.rows?.length ? fallback.rows : fallback.conferences[0].rows,
              conferences: fallback.conferences,
              seasonYear
            }
          }));
        } else if (conferences.length > 0) {
          setTables((prev) => ({
            ...prev,
            [key]: {
              columns: conferences[0].columns,
              rows: conferences[0].rows,
              conferences,
              seasonYear
            }
          }));
        } else {
          setTables(prev => ({ ...prev, [key]: { columns: [], rows: [], conferences: [], seasonYear } }));
        }
        return;
      }

      // For sports with conferences (NBA, NFL, etc.) — parse each conference
      if (children.length > 1 && (selectedSport === 'basketball' || selectedSport === 'football' || selectedSport === 'hockey' || selectedSport === 'baseball')) {
        const conferences = children.map(parseConference).filter(Boolean);
        if (conferences.length > 0) {
          setTables((prev) => ({
            ...prev,
            [key]: {
              columns: conferences[0].columns,
              rows: conferences[0].rows,
              conferences,
              seasonYear
            }
          }));
        } else {
          setTables(prev => ({ ...prev, [key]: { columns: [], rows: [], conferences: [], seasonYear } }));
        }
      } else {
        // Single conference / league (soccer, cricket, f1)
        const parsed = parseConference(children[0] || { standings: data.standings || { entries: [] } });
        if (parsed) {
          // Cricket: if ESPN returned empty stats (common for historical seasons), use fallback data from 2008+
          let finalColumns = parsed.columns;
          let finalRows = parsed.rows;
          if (isCricket && requestedSeason != null && isCricketTableEmpty(parsed.rows)) {
            const fallback = getCricketStandingsFallback(key, requestedSeason);
            if (fallback?.rows?.length) {
              finalColumns = fallback.columns;
              finalRows = fallback.rows;
            }
          }
          setTables((prev) => ({ ...prev, [key]: { columns: finalColumns, rows: finalRows, seasonYear } }));
        } else {
          setTables(prev => ({ ...prev, [key]: { columns: [], rows: [], seasonYear } }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [tables, leagues, standingsBase, selectedSport, sportConfig]);

  const fetchAllClubs = useCallback(async () => {
    try {
      // F1: Use static constructor data since /racing/f1/teams returns empty
      if (selectedSport === 'f1') {
        setAllClubs(F1_CONSTRUCTORS);
        return;
      }

      // Cricket: Extract teams from scoreboard since /cricket/{id}/teams returns empty
      if (selectedSport === 'cricket') {
        const teamPromises = Object.entries(leagues).map(async ([key, code]) => {
          try {
            const res = await fetch(`${apiBase}/${code}/scoreboard`);
            const data = await res.json();
            const teams = data.teams || [];
            return teams.map(t => ({
              id: t.id,
              name: t.displayName || t.name,
              logo: t.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/cricket/500/${t.id}.png`,
              league: leagueNames[key] || 'Cricket',
              leagueCode: code,
              tagline: t.abbreviation || t.shortDisplayName || '',
              formation: t.location || 'Cricket',
              style: 'Cricket',
              description: `${t.displayName || t.name} competes in ${leagueNames[key]}.`,
              trophies: [],
              lineup: [],
              history: `${t.displayName || t.name} is tracked live from ESPNcricinfo data feeds.`,
              legends: []
            }));
          } catch (_err) {
            return [];
          }
        });
        const results = await Promise.all(teamPromises);
        setAllClubs(results.flat());
        return;
      }

      // Default: Use standard /teams endpoint (deduplicate league codes)
      const uniqueClubLeagues = {};
      Object.entries(leagues).forEach(([key, code]) => {
        if (!uniqueClubLeagues[code]) uniqueClubLeagues[code] = key;
      });
      const teamPromises = Object.entries(uniqueClubLeagues).map(async ([code, key]) => {
        const res = await fetch(`${apiBase}/${code}/teams`);
        const data = await res.json();
        const leagueData = data.sports?.[0]?.leagues?.[0];
        const teams = leagueData?.teams || [];
        // For NBA: try to get conference groups from the response
        const groups = leagueData?.groups || [];
        return teams.map(t => {
          // Try to find conference for the team
          let conference = '';
          if (selectedSport === 'basketball' && groups.length > 0) {
            for (const g of groups) {
              if (g.teams?.some(gt => gt.id === t.team.id || gt.$ref?.includes(t.team.id))) {
                conference = g.name || g.abbreviation || '';
                break;
              }
            }
          }
          return {
            id: t.team.id,
            name: t.team.displayName,
            logo: t.team.logos?.[0]?.href,
            league: leagueNames[key] || 'League',
            leagueCode: code,
            tagline: t.team.shortDisplayName,
            conference: conference || (t.team.groups?.name || ''),
            formation: selectedSport === 'soccer' ? '4-3-3' : (t.team.location || sportConfig.label),
            style: selectedSport === 'soccer' ? 'Modern' : 'Elite',
            description: t.team.description || `${t.team.displayName} is a top ${sportConfig.label.toLowerCase()} team.`,
            trophies: selectedSport === 'soccer' ? ['League Winner', 'Cup Winner', 'Continental Trophy'] : ['League Winner', 'Playoff Contender', 'Historic Team'],
            lineup: [],
            history: `${t.team.displayName} competes in ${leagueNames[key] || 'its league'} and is tracked live from ESPN data feeds.`,
            legends: ['Icon 1', 'Icon 2']
          };
        });
      });
      const results = await Promise.all(teamPromises);
      setAllClubs(results.flat());
    } catch (e) {
      console.error('Club fetch error:', e);
    }
  }, [apiBase, leagues, leagueNames, selectedSport, sportConfig.label]);

  const getSportData = useCallback(async (sportKey) => {
    const clubs = await fetchClubsForSport(sportKey);
    const players = sportKey === 'soccer' ? PLAYERS_DATA : (EXTRA_SPORT_PLAYERS[sportKey] || []);
    return { clubs, players };
  }, []);

  const fetchUCLKnockoutMatches = useCallback(async () => {
    if (selectedSport !== 'soccer') return;
    try {
      // Fetch UCL matches for the entire season (Aug to June)
      const seasonStart = new Date();
      seasonStart.setMonth(7); // August
      seasonStart.setDate(1);
      if (new Date().getMonth() < 7) {
        seasonStart.setFullYear(seasonStart.getFullYear() - 1);
      }
      const seasonEnd = new Date();
      seasonEnd.setMonth(5); // June
      seasonEnd.setDate(30);
      if (new Date().getMonth() < 7) {
        seasonEnd.setFullYear(seasonEnd.getFullYear());
      } else {
        seasonEnd.setFullYear(seasonEnd.getFullYear() + 1);
      }

      const datesParam = `${seasonStart.toISOString().slice(0, 10).replace(/-/g, '')}-${seasonEnd.toISOString().slice(0, 10).replace(/-/g, '')}`;
      const res = await fetch(`${apiBase}/uefa.champions/scoreboard?dates=${datesParam}&limit=500`);
      const data = await res.json();

      const uclMatches = (data.events || []).map(event => {
        const comp = event.competitions[0];
        const home = comp.competitors.find(c => c.homeAway === 'home');
        const away = comp.competitors.find(c => c.homeAway === 'away');

        const matchDate = new Date(event.date);
        const dateStr = matchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const timeStr = matchDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

        return {
          id: event.id,
          leagueCode: 'uefa.champions',
          league: 'UEFA Champions League',
          home: home.team.displayName,
          away: away.team.displayName,
          homeScore: home.score || '0',
          awayScore: away.score || '0',
          time: `${dateStr} ${timeStr}`,
          rawDate: event.date,
          isLive: event.status.type.state === 'in',
          isCompleted: event.status.type.state === 'post',
          status: event.status.type.shortDetail,
          statusDetail: event.status.type.detail,
          homeLogo: home.team.logo,
          awayLogo: away.team.logo,
          winner: home.winner ? 'home' : (away.winner ? 'away' : null),
          round: event.season?.slug || event.season?.type?.name || comp.notes?.[0]?.text || '',
          leg: comp.leg?.displayValue || ''
        };
      });

      setUclKnockoutMatches(uclMatches);
    } catch (e) {
      console.error('UCL knockout fetch error:', e);
    }
  }, [apiBase, selectedSport]);

  const fetchCricketKnockoutMatches = useCallback(async (leagueKey, code, seasonYearParam = null) => {
    if (selectedSport !== 'cricket' || !code) return;
    const currentYear = new Date().getFullYear();
    const t20Years = leagueKey === 't20wc' ? getCricketSeasonYears('t20wc') : [];
    const year = seasonYearParam != null ? seasonYearParam : (leagueKey === 't20wc' ? (t20Years[0] ?? currentYear) : currentYear);

    try {
      // T20 WC past editions: use curated fallback (ESPN often has no/incomplete data). Current/future: try API first.
      if (leagueKey === 't20wc' && year < currentYear) {
        const fallbackKnockout = getCricketKnockoutFallback(leagueKey, year);
        const finalMatches = fallbackKnockout.length > 0
          ? fallbackKnockout.map(m => ({ ...m, league: leagueNames[leagueKey] || 'Cricket', leagueCode: code }))
          : [];
        setCricketKnockoutMatches(prev => ({ ...prev, [leagueKey]: finalMatches }));
        return;
      }

      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      const datesParam = `${start.toISOString().slice(0, 10).replace(/-/g, '')}-${end.toISOString().slice(0, 10).replace(/-/g, '')}`;
      const res = await fetch(`${apiBase}/${code}/scoreboard?dates=${datesParam}&limit=200`);
      if (!res.ok) {
        if (leagueKey === 't20wc' && year <= currentYear) {
          const fallbackKnockout = getCricketKnockoutFallback(leagueKey, year);
          if (fallbackKnockout.length > 0) {
            const finalMatches = fallbackKnockout.map(m => ({ ...m, league: leagueNames[leagueKey] || 'Cricket', leagueCode: code }));
            setCricketKnockoutMatches(prev => ({ ...prev, [leagueKey]: finalMatches }));
          } else setCricketKnockoutMatches(prev => ({ ...prev, [leagueKey]: [] }));
        } else setCricketKnockoutMatches(prev => ({ ...prev, [leagueKey]: [] }));
        return;
      }
      const data = await res.json().catch(() => ({}));
      const events = data.events || [];
      const knockoutKeywords = /Final|Semi|Qualifier|Eliminator|Playoff|playoff|knockout|Semi-Final|Quarter-Final/i;
      let knockoutEvents = events.filter(ev => {
        const comp = ev.competitions?.[0];
        const desc = (comp?.description || '') + (comp?.shortDescription || '');
        return comp && knockoutKeywords.test(desc);
      });
      // Only keep events in the selected year (API can return other years)
      knockoutEvents = knockoutEvents.filter(ev => new Date(ev.date).getFullYear() === year);

      const mapped = knockoutEvents.map(event => {
        const comp = event.competitions[0];
        const home = comp.competitors?.find(c => c.homeAway === 'home') || comp.competitors?.[0];
        const away = comp.competitors?.find(c => c.homeAway === 'away') || comp.competitors?.[1];
        const matchDate = new Date(event.date);
        const dateStr = matchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = matchDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        const roundLabel = comp?.description || comp?.shortDescription || '';
        const isPost = event.status?.type?.state === 'post';
        return {
          id: event.id,
          leagueCode: code,
          league: leagueNames[leagueKey] || 'Cricket',
          home: home?.team?.displayName || 'TBD',
          away: away?.team?.displayName || 'TBD',
          homeScore: (isPost || home?.score) ? (home?.score || '0') : '–',
          awayScore: (isPost || away?.score) ? (away?.score || '0') : '–',
          time: `${dateStr} ${timeStr}`,
          rawDate: event.date,
          isLive: event.status?.type?.state === 'in',
          isCompleted: isPost,
          status: event.status?.type?.shortDetail || '',
          statusDetail: event.status?.type?.detail || '',
          homeLogo: home?.team?.logo || home?.team?.logos?.[0]?.href || FALLBACK_TEAM_LOGO,
          awayLogo: away?.team?.logo || away?.team?.logos?.[0]?.href || FALLBACK_TEAM_LOGO,
          winner: home?.winner === 'true' || home?.winner === true ? 'home' : (away?.winner === 'true' || away?.winner === true ? 'away' : null),
          round: roundLabel
        };
      });
      let finalMatches = mapped;
      if (mapped.length === 0 && year <= currentYear) {
        const fallbackKnockout = getCricketKnockoutFallback(leagueKey, year);
        if (fallbackKnockout.length > 0) {
          finalMatches = fallbackKnockout.map(m => ({ ...m, league: leagueNames[leagueKey] || 'Cricket', leagueCode: code }));
        }
      }
      setCricketKnockoutMatches(prev => ({ ...prev, [leagueKey]: finalMatches }));
    } catch (e) {
      console.error('Cricket knockout fetch error:', e);
      const fallbackYear = seasonYearParam ?? (leagueKey === 't20wc' ? (getCricketSeasonYears('t20wc')[0]) : currentYear);
      if (leagueKey === 't20wc' && fallbackYear <= currentYear) {
        const fallbackKnockout = getCricketKnockoutFallback(leagueKey, fallbackYear);
        if (fallbackKnockout.length > 0) {
          const finalMatches = fallbackKnockout.map(m => ({ ...m, league: leagueNames[leagueKey] || 'Cricket', leagueCode: code }));
          setCricketKnockoutMatches(prev => ({ ...prev, [leagueKey]: finalMatches }));
        }
      }
    }
  }, [apiBase, selectedSport, leagueNames]);

  const fetchClubRoster = async (club) => {
    try {
      const res = await fetch(`${apiBase}/${club.leagueCode}/teams/${club.id}/roster`);
      const data = await res.json();
      const squad = (data.athletes || []).map(a => `${a.position.abbreviation}: ${a.displayName}`);
      setSelectedClub({ ...club, lineup: squad.slice(0, 18) });
    } catch (e) {
      console.error('Roster fetch error:', e);
      setSelectedClub(club);
    }
  };

  const fetchSportPlayers = useCallback(async () => {
    const { primary, secondary } = PLAYER_STATS_BY_SPORT[selectedSport] || PLAYER_STATS_BY_SPORT.soccer;
    const headshotFn = SPORT_HEADSHOT_FN[selectedSport] || getHeadshot;
    const normalizeAthlete = (athlete, teamName, teamLogo, leagueLogo) => {
      const source = athlete?.athlete || athlete;
      const displayName = source?.displayName || source?.fullName || 'Unknown Athlete';
      // Use the same source's id for both identity and headshot so name and picture always match
      const rawId = source?.id ?? athlete?.id ?? athlete?.uid ?? `${teamName}-${displayName}-${Math.random()}`;
      const numericId = Number(rawId);
      const safeId = Number.isNaN(numericId) ? rawId : numericId;
      // Prefer API headshot from this athlete, then build ESPN headshot from this athlete's id only
      const apiHeadshot = source?.headshot?.href || source?.images?.[0]?.href;
      const espnHeadshot = (typeof safeId === 'number' && safeId > 0) ? headshotFn(safeId) : null;
      return {
        id: safeId,
        name: displayName,
        club: teamName || source?.team?.displayName || sportConfig.label,
        position: source?.position?.abbreviation || source?.position?.displayName || 'Athlete',
        rating: source?.rating || '-',
        goals: source?.statistics?.[0]?.displayValue || source?.statistics?.[0]?.value || '-',
        assists: source?.statistics?.[1]?.displayValue || source?.statistics?.[1]?.value || '-',
        image: apiHeadshot || espnHeadshot || FALLBACK_PLAYER_IMAGE,
        leagueLogo: leagueLogo || null,
        age: source?.age || '-',
        height: source?.displayHeight || '-',
        weight: source?.displayWeight || '-',
        career: [teamName || source?.team?.displayName || sportConfig.label],
        trophies: [],
        achievements: [],
        primaryStatLabel: primary,
        secondaryStatLabel: secondary
      };
    };

    try {
      // F1: Extract drivers from standings since /racing/f1/teams returns empty
      if (selectedSport === 'f1') {
        try {
          const res = await fetch(`${standingsBase}/f1/standings`);
          const data = await res.json();
          const driverEntries = data.children?.[0]?.standings?.entries || [];
          const drivers = driverEntries.map(entry => {
            const driverId = Number(entry.athlete?.id);
            const pts = entry.stats?.find(s => s.abbreviation === 'PTS')?.displayValue || '0';
            const rank = entry.stats?.find(s => s.abbreviation === 'RK')?.displayValue || '-';
            return {
              id: driverId || entry.athlete?.id,
              name: entry.athlete?.displayName || 'Driver',
              club: 'Formula 1',
              position: 'Driver',
              rating: rank,
              goals: pts,
              assists: '-',
              image: getF1Headshot(driverId),
              age: '-',
              height: '-',
              weight: '-',
              career: ['F1'],
              trophies: [],
              achievements: [],
              primaryStatLabel: 'Points',
              secondaryStatLabel: 'Rank'
            };
          });
          if (drivers.length > 0) {
            setSportPlayers(drivers);
            return;
          }
        } catch (_e) { /* fall through to static data */ }
        setSportPlayers([]);
        return;
      }

      // Cricket: Extract players from scoreboard featured athletes or use static data
      // The /cricket/{id}/teams endpoint returns empty, so skip team/roster fetching
      if (selectedSport === 'cricket') {
        // We'll rely on static EXTRA_SPORT_PLAYERS data which is already good
        setSportPlayers([]);
        return;
      }

      // Deduplicate league codes for player fetching
      const uniquePlayerLeagues = {};
      Object.entries(leagues).forEach(([key, code]) => {
        if (!uniquePlayerLeagues[code]) uniquePlayerLeagues[code] = key;
      });
      const teamResponses = await Promise.all(
        Object.entries(uniquePlayerLeagues).map(async ([code, key]) => {
          const res = await fetch(`${apiBase}/${code}/teams`);
          const data = await res.json();
          const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];
          return teams.map((t) => ({
            leagueCode: code,
            teamId: t.team.id,
            name: t.team.displayName,
            logo: t.team.logos?.[0]?.href || leagueLogos[key] || FALLBACK_TEAM_LOGO,
            leagueLogo: leagueLogos[key] || null
          }));
        })
      );

      const allTeams = teamResponses.flat().slice(0, selectedSport === 'soccer' ? 20 : (selectedSport === 'basketball' ? 30 : 14));
      let fetchedPlayers = [];

      if (allTeams.length > 0) {
        const rosterResponses = await Promise.all(
          allTeams.map(async (team) => {
            try {
              const res = await fetch(`${apiBase}/${team.leagueCode}/teams/${team.teamId}/roster`);
              const data = await res.json();
              // ESPN roster response can be flat or grouped by position
              let athletes = data.athletes || data.team?.athletes || [];
              // If athletes are grouped by position (e.g. NFL), flatten them
              if (athletes.length > 0 && athletes[0]?.items) {
                athletes = athletes.flatMap((group) => group.items || []);
              }
              return athletes.map((a) => normalizeAthlete(a, team.name, team.logo, team.leagueLogo));
            } catch (_err) {
              return [];
            }
          })
        );
        fetchedPlayers = rosterResponses.flat();
      }

      if (fetchedPlayers.length === 0) {
        const athleteResponses = await Promise.all(
          Object.entries(uniquePlayerLeagues).map(async ([code, key]) => {
            try {
              const res = await fetch(`${apiBase}/${code}/athletes?limit=200`);
              const data = await res.json();
              const athletes = data.athletes || data.sports?.[0]?.leagues?.[0]?.athletes || [];
              return athletes.map((a) => normalizeAthlete(a, leagueNames[key], leagueLogos[key], leagueLogos[key]));
            } catch (_err) {
              return [];
            }
          })
        );
        fetchedPlayers = athleteResponses.flat();
      }

      const deduped = fetchedPlayers.reduce((acc, p) => {
        if (!acc.some((x) => String(x.id) === String(p.id))) acc.push(p);
        return acc;
      }, []);
      setSportPlayers(deduped.slice(0, 160));
    } catch (e) {
      console.error('Player fetch error:', e);
    }
  }, [selectedSport, sportConfig.label, leagues, apiBase, leagueNames, leagueLogos, standingsBase]);

  useEffect(() => {
    fetchAllClubs();
  }, [fetchAllClubs]);

  useEffect(() => {
    fetchSportPlayers();
    const interval = setInterval(fetchSportPlayers, 30000);
    return () => clearInterval(interval);
  }, [fetchSportPlayers]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 1000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  useEffect(() => {
    if (leagueNames[currentTab]) {
      const seasonParam = selectedSport === 'cricket' ? cricketSeasonYear : undefined;
      fetchTable(currentTab, false, seasonParam);
      const interval = setInterval(() => fetchTable(currentTab, true, selectedSport === 'cricket' ? cricketSeasonYear : undefined), 1000);
      return () => clearInterval(interval);
    }
  }, [currentTab, fetchTable, leagueNames, selectedSport, cricketSeasonYear]);

  // Reset cricket season when switching to a league that doesn't have that year
  useEffect(() => {
    if (selectedSport !== 'cricket' || cricketSeasonYear == null) return;
    const validYears = getCricketSeasonYears(currentTab);
    if (validYears.indexOf(cricketSeasonYear) === -1) setCricketSeasonYear(null);
  }, [selectedSport, currentTab, cricketSeasonYear]);

  // Fetch data based on tab
  useEffect(() => {
    if (currentTab === 'ucl' && uclTab === 'knockout') {
      fetchUCLKnockoutMatches();
    }
  }, [currentTab, uclTab, fetchUCLKnockoutMatches]);

  useEffect(() => {
    if (selectedSport === 'cricket' && CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) && cricketTab === 'knockout') {
      const code = leagues[currentTab];
      fetchCricketKnockoutMatches(currentTab, code, cricketSeasonYear);
    }
  }, [selectedSport, currentTab, cricketTab, leagues, cricketSeasonYear, fetchCricketKnockoutMatches]);

  // Filtering
  const filteredMatches = useMemo(() => {
    let list = matches;
    if (currentTab !== 'live' && leagueNames[currentTab]) {
      list = matches.filter(m => m.league === leagueNames[currentTab]);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => m.home.toLowerCase().includes(q) || m.away.toLowerCase().includes(q) || m.league.toLowerCase().includes(q));
    }
    return list;
  }, [matches, currentTab, search, leagueNames]);

  const fallbackPlayersForSport = useMemo(
    () => (selectedSport === 'soccer' ? PLAYERS_DATA : (EXTRA_SPORT_PLAYERS[selectedSport] || [])),
    [selectedSport]
  );

  const playersForCurrentSport = useMemo(
    () => (selectedSport === 'soccer'
      ? PLAYERS_DATA
      : (sportPlayers.length > 0 ? sportPlayers : fallbackPlayersForSport)),
    [selectedSport, sportPlayers, fallbackPlayersForSport]
  );

  const allPlayersIndex = useMemo(() => {
    const merged = [...PLAYERS_DATA, ...Object.values(EXTRA_SPORT_PLAYERS).flat(), ...sportPlayers];
    return merged.reduce((acc, p) => {
      if (!acc.some((x) => String(x.id) === String(p.id))) acc.push(p);
      return acc;
    }, []);
  }, [sportPlayers]);

  const playerFilterOptions = useMemo(() => {
    const sportPositions = [...new Set(playersForCurrentSport.map((p) => p.position).filter(Boolean))];
    return ['all', ...sportPositions.slice(0, 8)];
  }, [playersForCurrentSport]);

  const getPositionClass = (league, pos) => {
    const p = parseInt(pos, 10);
    if (selectedSport === 'cricket') {
      if (p === 1) return 'league-winner';
      return '';
    }
    if (selectedSport !== 'soccer') return '';
    if (league === 'ucl') {
      if (p <= 8) return 'ucl-direct';
      if (p <= 24) return 'ucl-playoff';
      return 'ucl-out';
    }
    if (league === 'pl') {
      if (p === 1) return 'league-winner';
      if (p <= 4) return 'ucl-qualify';
      if (p >= 18) return 'relegation';
    }
    if (league === 'laliga' || league === 'seriea' || league === 'bundesliga') {
      if (p === 1) return 'league-winner';
      if (p <= 4) return 'ucl-qualify';
      if (p >= 18) return 'relegation';
    }
    if (league === 'ligue1') {
      if (p === 1) return 'league-winner';
      if (p <= 3) return 'ucl-qualify';
      if (p >= 16) return 'relegation';
    }
    if (league === 'eredivisie') {
      if (p === 1) return 'league-winner';
      if (p === 2) return 'ucl-direct';
      if (p === 3) return 'ucl-qualify';
      if (p === 4) return 'uel-qualify';
      if (p <= 8) return 'uecl';
      if (p === 16) return 'ucl-playoff'; // Using purple for relegation PO
      if (p >= 17) return 'relegation';
    }
    return '';
  };

  const filteredPlayers = useMemo(() => {
    let list = playersForCurrentSport;
    if (playerFilter !== 'all') {
      list = list.filter(p => p.position === playerFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q));
    }
    return list;
  }, [playerFilter, search, playersForCurrentSport]);

  const filteredClubs = useMemo(() => {
    let list = allClubs.length > 0 ? allClubs : TACTICS_DATA;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [search, allClubs]);

  const managedClubs = useMemo(() => {
    if (!manageSearch) return allClubs;
    const q = manageSearch.toLowerCase();
    return allClubs.filter(c => c.name.toLowerCase().includes(q));
  }, [manageSearch, allClubs]);

  // --- Render Sections ---

  const renderSection = () => {
    switch (currentTab) {
      case 'live':
      case 'ucl':
      case 'pl':
      case 'laliga':
      case 'bundesliga':
      case 'seriea':
      case 'ligue1':
      case 'eredivisie':
      case 'nba':
      case 'nfl':
      case 'mlb':
      case 'nhl':
      case 'ipl':
      case 'bbl':
      case 'psl':
      case 'ilt20':
      case 'sa20':
      case 't20wc':
      case 'ranji':
      case 'sheffield':
      case 'county':
      case 'icc_test':
      case 'f1':
        if (featureFlags.live_scores === false) {
          return (
            <section key="live-disabled" className="content-section active">
              <p style={{ color: 'var(--text-muted, #94a3b8)', padding: 24 }}>Live scores are currently disabled.</p>
            </section>
          );
        }
        return (
          <section key={currentTab} className="content-section active">
            <div className="live-ticker">
              <div className="ticker-item">{tickerText}</div>
            </div>

            {/* Date Navigator & Calendar */}
            <div className="date-navigator-container">
              <button className="nav-arrow-btn" onClick={() => {
                const [y, m, d] = selectedDate.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d);
                dateObj.setDate(dateObj.getDate() - 1);
                const newDate = getLocalISODate(dateObj); // Ensure we get the local represention string
                setSelectedDate(newDate);
              }}>
                <span className="material-icons-round">chevron_left</span>
              </button>

              <div className="date-trigger-btn" onClick={() => setShowCalendar(!showCalendar)}>
                <span className="material-icons-round" style={{ fontSize: '18px', color: 'var(--highlight)' }}>event</span>
                <span className="current-date-label">
                  {(() => {
                    const todayStr = getLocalISODate();
                    const [ty, tm, td] = todayStr.split('-').map(Number);
                    const todayDate = new Date(ty, tm - 1, td);

                    const [sy, sm, sd] = selectedDate.split('-').map(Number);
                    const selDate = new Date(sy, sm - 1, sd);

                    // Check exact day difference
                    const diffTime = selDate - todayDate;
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 0) return `Today, ${selDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
                    if (diffDays === -1) return `Yesterday, ${selDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
                    if (diffDays === 1) return `Tomorrow, ${selDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

                    return selDate.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' });
                  })()}
                </span>
                <span className="material-icons-round expand-icon">expand_more</span>
              </div>

              <button className="nav-arrow-btn" onClick={() => {
                const [y, m, d] = selectedDate.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d);
                dateObj.setDate(dateObj.getDate() + 1);
                const newDate = getLocalISODate(dateObj);
                setSelectedDate(newDate);
              }}>
                <span className="material-icons-round">chevron_right</span>
              </button>

              {/* Calendar Popover */}
              {showCalendar && (
                <div className="calendar-popover animate-in">
                  <div className="calendar-header">
                    <button onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(calendarViewDate.setMonth(calendarViewDate.getMonth() - 1))); }}>&lt;</button>
                    <span>{calendarViewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                    <button onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(calendarViewDate.setMonth(calendarViewDate.getMonth() + 1))); }}>&gt;</button>
                  </div>
                  <div className="calendar-grid">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="cal-day-header">{d}</div>)}
                    {(() => {
                      const year = calendarViewDate.getFullYear();
                      const month = calendarViewDate.getMonth();
                      const firstDay = new Date(year, month, 1).getDay();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const days = [];
                      const todayStr = getLocalISODate();

                      for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="cal-day empty"></div>);
                      for (let i = 1; i <= daysInMonth; i++) {
                        // Construct local date string YYYY-MM-DD safely
                        const mStr = String(month + 1).padStart(2, '0');
                        const dStr = String(i).padStart(2, '0');
                        const isoDate = `${year}-${mStr}-${dStr}`;

                        const isSelected = selectedDate === isoDate;
                        const isToday = todayStr === isoDate;

                        days.push(
                          <div
                            key={i}
                            className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                            onClick={() => { setSelectedDate(isoDate); setShowCalendar(false); }}
                          >
                            {i}
                          </div>
                        );
                      }
                      return days;
                    })()}
                  </div>
                  {/* Close button inside popover for mobile friendliness */}
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <button onClick={() => setShowCalendar(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '12px' }}>Close</button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Overlay for Calendar (Click outside to close) */}
            {showCalendar && <div className="fixed-overlay" onClick={() => setShowCalendar(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} />}

            {leagueNames[currentTab] && (
              <div className="section-header-pro">
                <h3>
                  <span className="material-icons-round section-header-sport-icon" aria-hidden="true">{sportConfig.icon}</span>
                  {selectedSport === 'cricket' && leagueLogos[currentTab] && (
                    <img loading="lazy" decoding="async" src={leagueLogos[currentTab]} alt="" className="section-header-league-logo" onError={(e) => { e.target.style.display = 'none'; }} />
                  )}
                  {selectedSport === 'f1' ? 'Race Center' : selectedSport === 'cricket' ? 'Cricket Center' : 'Match Center'}
                </h3>
                {Math.ceil(filteredMatches.length / getPageSize('matches')) > 1 && (
                  <Pagination
                    current={page}
                    total={Math.ceil(filteredMatches.length / getPageSize('matches'))}
                    onPageChange={setPage}
                  />
                )}
                {selectedSport === 'soccer' && currentTab === 'ucl' && (
                  <div className="toggle-tabs">
                    <button className={`toggle-btn ${uclTab === 'league' ? 'active' : ''}`} onClick={() => setUclTab('league')}>League Phase</button>
                    <button className={`toggle-btn ${uclTab === 'knockout' ? 'active' : ''}`} onClick={() => setUclTab('knockout')}>Knockout</button>
                  </div>
                )}
                {selectedSport === 'cricket' && CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) && (
                  <div className="toggle-tabs">
                    <button className={`toggle-btn ${cricketTab === 'league' ? 'active' : ''}`} onClick={() => setCricketTab('league')}>League Table</button>
                    <button className={`toggle-btn ${cricketTab === 'knockout' ? 'active' : ''}`} onClick={() => setCricketTab('knockout')}>Knockout</button>
                  </div>
                )}
                {selectedSport === 'basketball' && currentTab === 'nba' && (
                  <div className="conference-sub-tabs">
                    <button className={`conference-tab ${nbaConferenceTab === 'east' ? 'active' : ''}`} onClick={() => setNbaConferenceTab('east')}>Eastern Conference</button>
                    <button className={`conference-tab ${nbaConferenceTab === 'west' ? 'active' : ''}`} onClick={() => setNbaConferenceTab('west')}>Western Conference</button>
                  </div>
                )}
              </div>
            )}

            <div className="matches-grid">
              {filteredMatches.length > 0 ? (
                filteredMatches
                  .slice((page - 1) * getPageSize('matches'), page * getPageSize('matches'))
                  .map(m => <MatchCard key={m.id} match={m} favorites={favorites} toggleFavorite={toggleFavorite} onOpen={fetchMatchDetails} showFavorite={featureFlags.favorites !== false} />)
              ) : (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px', width: '100%' }}>
                  {search ? 'No matches found for this search.' : 'No matches found for this date.'}
                </div>
              )}
            </div>

            <Pagination
              current={page}
              total={Math.ceil(filteredMatches.length / getPageSize('matches'))}
              onPageChange={setPage}
            />

            {/* Cricket: season selector from league start year (or T20 WC edition years only) */}
            {selectedSport === 'cricket' && leagueNames[currentTab] && (currentTab !== 'ucl' || uclTab === 'league') && (!CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) || cricketTab === 'league') && (
              <div className="cricket-season-selector">
                <div className="cricket-season-selector-inner">
                  <span className="cricket-season-selector-icon material-icons-round" aria-hidden="true">calendar_today</span>
                  <label htmlFor="cricket-season-select" className="cricket-season-selector-label">Season</label>
                  <select
                    id="cricket-season-select"
                    className="cricket-season-selector-select"
                    value={cricketSeasonYear ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const year = val === '' ? null : parseInt(val, 10);
                      setCricketSeasonYear(year);
                      fetchTable(currentTab, true, year);
                    }}
                    aria-label="Select cricket season"
                  >
                    <option value="">Current</option>
                    {(() => {
                      const years = getCricketSeasonYears(currentTab);
                      return years.map(y => <option key={y} value={y}>{y}</option>);
                    })()}
                  </select>
                  <span className="cricket-season-selector-hint">
                    <span className="material-icons-round" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: 4 }}>refresh</span>
                    Live · refreshes every second
                  </span>
                </div>
              </div>
            )}

            {/* Conference-based standings: NBA shows one table per sub-tab; NFL/NHL/MLB show all */}
            {leagueNames[currentTab] && (currentTab !== 'ucl' || uclTab === 'league') && (selectedSport !== 'cricket' || !CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) || cricketTab === 'league') && tables[currentTab]?.conferences?.length > 0 && (
              (() => {
                const conferences = tables[currentTab].conferences;
                // NBA: show only the selected conference (Eastern = index 0, Western = index 1)
                const toShow = selectedSport === 'basketball' && currentTab === 'nba'
                  ? [conferences[nbaConferenceTab === 'east' ? 0 : 1]].filter(Boolean)
                  : conferences;
                return toShow.map((conf, ci) => (
                  <div key={`${ci}-${tables[currentTab]?.seasonYear ?? ''}`} className="table-container fade-in" style={{ marginTop: ci === 0 ? '50px' : '30px' }}>
                    <div className="league-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <img loading="lazy" decoding="async" src={leagueLogos[currentTab]} alt="logo" className="league-brand-logo" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                        <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                          {conf.name || `Conference ${ci + 1}`}
                          {tables[currentTab].seasonYear && (
                            <span style={{ fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginLeft: 6 }}>— {tables[currentTab].seasonYear}</span>
                          )}
                        </h3>
                      </div>
                    </div>
                    <table className="standings-table">
                      <thead>
                        <tr>
                          <th>Pos</th><th>Team</th>
                          {conf.columns.map((col) => <th key={col}>{col}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {conf.rows.map((row, i) => (
                          <tr key={i} className={`animate-in ${getPositionClass(currentTab, row.pos)}`} style={{ animationDelay: `${i * 0.03}s` }}>
                            <td className="pos-cell">{row.pos}</td>
                            <td style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                              <img loading="lazy" decoding="async" src={row.logo} style={{ width: '24px', height: '24px' }} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                              <span className="team-name">{row.team}</span>
                              {featureFlags.favorites !== false && (
                                <span className={`material-icons-round fav-star ${favorites.includes(row.team) ? 'active' : ''}`} onClick={() => toggleFavorite(row.team)}>
                                  {favorites.includes(row.team) ? 'star' : 'star_border'}
                                </span>
                              )}
                            </td>
                            {conf.columns.map((col) => (
                              <td key={`${row.team}-${col}`}>{row.values?.[col] ?? '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ));
              })()
            )}

            {/* Single-conference standings (Soccer, Cricket, F1) */}
            {leagueNames[currentTab] && (currentTab !== 'ucl' || uclTab === 'league') && (selectedSport !== 'cricket' || !CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) || cricketTab === 'league') && !tables[currentTab]?.conferences?.length && tables[currentTab]?.rows?.length > 0 && (
              <div key={`standings-${currentTab}-${tables[currentTab]?.seasonYear ?? 'current'}`} className="table-container fade-in" style={{ marginTop: '50px' }}>
                <div className="league-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <img loading="lazy" decoding="async" src={leagueLogos[currentTab]} alt="logo" className="league-brand-logo" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                      {leagueNames[currentTab]} Standings
                      {tables[currentTab].seasonYear && (
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginLeft: 6 }}>— {tables[currentTab].seasonYear}</span>
                      )}
                    </h3>
                  </div>
                  {selectedSport === 'soccer' && currentTab === 'ucl' && uclTab === 'league' && (
                    <div className="toggle-tabs">
                      <button className={`toggle-btn ${uclTab === 'league' ? 'active' : ''}`} onClick={() => setUclTab('league')}>League Phase</button>
                      <button className={`toggle-btn ${uclTab === 'knockout' ? 'active' : ''}`} onClick={() => setUclTab('knockout')}>Knockout</button>
                    </div>
                  )}
                  {selectedSport === 'cricket' && CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) && (
                    <div className="toggle-tabs">
                      <button className={`toggle-btn ${cricketTab === 'league' ? 'active' : ''}`} onClick={() => setCricketTab('league')}>League Table</button>
                      <button className={`toggle-btn ${cricketTab === 'knockout' ? 'active' : ''}`} onClick={() => setCricketTab('knockout')}>Knockout</button>
                    </div>
                  )}
                </div>
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th>Pos</th><th>{selectedSport === 'f1' ? 'Driver' : 'Team'}</th>
                      {tables[currentTab].columns.map((col) => <th key={col}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {tables[currentTab].rows.map((row, i) => (
                      <tr key={i} className={`animate-in ${getPositionClass(currentTab, row.pos)}`} style={{ animationDelay: `${i * 0.03}s` }}>
                        <td className="pos-cell">{row.pos}</td>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                          <img loading="lazy" decoding="async" src={row.logo} style={{ width: '24px', height: '24px' }} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                          <span className="team-name">{row.team}</span>
                          {featureFlags.favorites !== false && (
                            <span className={`material-icons-round fav-star ${favorites.includes(row.team) ? 'active' : ''}`} onClick={() => toggleFavorite(row.team)}>
                              {favorites.includes(row.team) ? 'star' : 'star_border'}
                            </span>
                          )}
                        </td>
                        {tables[currentTab].columns.map((col) => (
                          <td key={`${row.team}-${col}`}>{row.values?.[col] ?? '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="table-legend">
                  {selectedSport === 'soccer' && currentTab === 'ucl' ? (
                    <>
                      <div className="legend-item"><span className="dot ucl-direct"></span> Direct Round of 16</div>
                      <div className="legend-item"><span className="dot ucl-playoff"></span> Knockout Playoffs</div>
                      <div className="legend-item"><span className="dot ucl-out"></span> Eliminated</div>
                    </>
                  ) : selectedSport === 'soccer' && currentTab === 'eredivisie' ? (
                    <>
                      <div className="legend-item"><span className="dot winner"></span> Champion / UCL</div>
                      <div className="legend-item"><span className="dot ucl"></span> UCL Qualifiers</div>
                      <div className="legend-item"><span className="dot uel"></span> Europa League</div>
                      <div className="legend-item"><span className="dot uecl"></span> Conference PO</div>
                      <div className="legend-item"><span className="dot playoff"></span> Relegation Play-off</div>
                      <div className="legend-item"><span className="dot relegation"></span> Direct Relegation</div>
                    </>
                  ) : selectedSport === 'cricket' ? (
                    <>
                      <div className="legend-item"><span className="dot ucl"></span> M = Matches · W = Won · L = Lost · N/R = No Result · NRR = Net Run Rate · PT = Points</div>
                      <div className="legend-item" style={{ marginTop: 6, fontSize: 11, opacity: 0.85 }}>Standings: ESPN live; historical seasons (from 2008) use fallback data when ESPN has no stats.</div>
                    </>
                  ) : (
                    <div className="legend-item"><span className="dot ucl"></span> Live data from ESPN standings feed</div>
                  )}
                </div>
              </div>
            )}

            {/* League table section with season but no rows yet (e.g. PSL before season starts) */}
            {leagueNames[currentTab] && (currentTab !== 'ucl' || uclTab === 'league') && (selectedSport !== 'cricket' || !CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) || cricketTab === 'league') && tables[currentTab] && !tables[currentTab]?.conferences?.length && !(tables[currentTab]?.rows?.length > 0) && tables[currentTab].seasonYear && (
              <div className="table-container fade-in" style={{ marginTop: '50px' }}>
                <div className="league-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <img loading="lazy" decoding="async" src={leagueLogos[currentTab]} alt="logo" className="league-brand-logo" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                      {leagueNames[currentTab]} Standings
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginLeft: 6 }}>— {tables[currentTab].seasonYear}</span>
                    </h3>
                  </div>
                  {selectedSport === 'cricket' && CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) && (
                    <div className="toggle-tabs">
                      <button className={`toggle-btn ${cricketTab === 'league' ? 'active' : ''}`} onClick={() => setCricketTab('league')}>League Table</button>
                      <button className={`toggle-btn ${cricketTab === 'knockout' ? 'active' : ''}`} onClick={() => setCricketTab('knockout')}>Knockout</button>
                    </div>
                  )}
                </div>
                <p style={{ color: 'var(--text-muted, #94a3b8)', padding: '24px 0', margin: 0 }}>Table not yet available for this season. Standings will appear when the competition starts.</p>
              </div>
            )}

            {
              selectedSport === 'soccer' && currentTab === 'ucl' && uclTab === 'knockout' && (
                <div className="knockout-bracket fade-in" style={{ marginTop: '40px' }}>
                  <div className="league-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Champions League Knockout Stage</h3>
                    <div className="toggle-tabs">
                      <button className={`toggle-btn ${uclTab === 'league' ? 'active' : ''}`} onClick={() => setUclTab('league')}>League Phase</button>
                      <button className={`toggle-btn ${uclTab === 'knockout' ? 'active' : ''}`} onClick={() => setUclTab('knockout')}>Knockout</button>
                    </div>
                  </div>
                  {isMobile && (
                    <div className="swipe-hint">
                      <span className="material-icons-round">swipe</span> Swipe to explore bracket
                    </div>
                  )}
                  <div className="bracket-container">
                    <div className="bracket-grid">
                      {/* Play-Offs */}
                      <div className="bracket-round">
                        <h4 className="round-title">PLAY-OFFS</h4>
                        <div className="round-matches playoff-offset">
                          {(() => {
                            const playoffMatches = uclKnockoutMatches.filter(m =>
                              m.round?.includes('Playoff') || m.round?.includes('Play-off') || m.status?.includes('Play-off') || m.round?.includes('knockout-round-playoffs')
                            );
                            if (playoffMatches.length === 0) {
                              return Array(8).fill(null).map((_, i) => (
                                <div key={i} className="bracket-match-card placeholder-card">
                                  <div className="placeholder-team">TBD</div>
                                  <div className="placeholder-team">TBD</div>
                                </div>
                              ));
                            }
                            return playoffMatches.slice(0, 8).map((match, i) => (
                              <div key={i} className={`bracket-match-card ${match.isLive ? 'is-live' : ''}`} onClick={() => fetchMatchDetails(match)}>
                                <div className="match-meta">
                                  {match.isLive ? <span className="live-tag">● LIVE</span> : <span className="time-tag">{match.time}</span>}
                                  {match.leg && <span className="leg-tag">{match.leg}</span>}
                                </div>
                                <div className="team-row">
                                  <div className="team-info-mini">
                                    <img loading="lazy" decoding="async" src={match.homeLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={match.winner === 'home' ? 'winner' : ''}>{match.home}</span>
                                  </div>
                                  <span className="score-mini">{match.homeScore}</span>
                                </div>
                                <div className="team-row">
                                  <div className="team-info-mini">
                                    <img loading="lazy" decoding="async" src={match.awayLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={match.winner === 'away' ? 'winner' : ''}>{match.away}</span>
                                  </div>
                                  <span className="score-mini">{match.awayScore}</span>
                                </div>
                                {match.isCompleted && <div className="match-status-mini">{match.statusDetail?.replace(/Final/i, 'FT') || 'FT'}</div>}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Round of 16 */}
                      <div className="bracket-round">
                        <h4 className="round-title">ROUND OF 16</h4>
                        <div className="round-matches r16-offset">
                          {(() => {
                            const r16Matches = uclKnockoutMatches.filter(m => m.round?.includes('Round of 16') || m.round?.includes('round-of-16'));
                            if (r16Matches.length === 0) {
                              return Array(8).fill(null).map((_, i) => (
                                <div key={i} className="bracket-match-card placeholder-card">
                                  <div className="placeholder-team">TBD</div>
                                  <div className="placeholder-team">TBD</div>
                                </div>
                              ));
                            }
                            return r16Matches.slice(0, 8).map((match, i) => (
                              <div key={i} className={`bracket-match-card ${match.isLive ? 'is-live' : ''}`} onClick={() => fetchMatchDetails(match)}>
                                <div className="match-meta">
                                  {match.isLive ? <span className="live-tag">● LIVE</span> : <span className="time-tag">{match.time}</span>}
                                  {match.leg && <span className="leg-tag">{match.leg}</span>}
                                </div>
                                <div className="team-row">
                                  <div className="team-info-mini">
                                    <img loading="lazy" decoding="async" src={match.homeLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={match.winner === 'home' ? 'winner' : ''}>{match.home}</span>
                                  </div>
                                  <span className="score-mini">{match.homeScore}</span>
                                </div>
                                <div className="team-row">
                                  <div className="team-info-mini">
                                    <img loading="lazy" decoding="async" src={match.awayLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={match.winner === 'away' ? 'winner' : ''}>{match.away}</span>
                                  </div>
                                  <span className="score-mini">{match.awayScore}</span>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Quarter Finals */}
                      <div className="bracket-round">
                        <h4 className="round-title">QUARTER FINALS</h4>
                        <div className="round-matches qf-offset">
                          {(() => {
                            const qfMatches = uclKnockoutMatches.filter(m => m.round?.includes('Quarterfinal') || m.round?.includes('Quarter Final') || m.round?.includes('quarter-finals'));
                            if (qfMatches.length === 0) {
                              return Array(4).fill(null).map((_, i) => (
                                <div key={i} className="bracket-match-card placeholder-card qf-height-fix">
                                  <div className="placeholder-team">TBD</div>
                                </div>
                              ));
                            }
                            return qfMatches.slice(0, 4).map((match, i) => (
                              <div key={i} className="qf-wrapper">
                                <div className={`bracket-match-card ${match.isLive ? 'is-live' : ''}`} onClick={() => fetchMatchDetails(match)}>
                                  <div className="match-meta">
                                    {match.isLive ? <span className="live-tag">● LIVE</span> : <span className="time-tag">{match.time}</span>}
                                    {match.leg && <span className="leg-tag">{match.leg}</span>}
                                  </div>
                                  <div className="team-row">
                                    <div className="team-info-mini">
                                      <img loading="lazy" decoding="async" src={match.homeLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                      <span className={match.winner === 'home' ? 'winner' : ''}>{match.home}</span>
                                    </div>
                                    <span className="score-mini">{match.homeScore}</span>
                                  </div>
                                  <div className="team-row">
                                    <div className="team-info-mini">
                                      <img loading="lazy" decoding="async" src={match.awayLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                      <span className={match.winner === 'away' ? 'winner' : ''}>{match.away}</span>
                                    </div>
                                    <span className="score-mini">{match.awayScore}</span>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Semi Finals */}
                      <div className="bracket-round">
                        <h4 className="round-title">SEMI FINALS</h4>
                        <div className="round-matches sf-offset">
                          {(() => {
                            const sfMatches = uclKnockoutMatches.filter(m => m.round?.includes('Semifinal') || m.round?.includes('Semi Final') || m.round?.includes('semi-finals'));
                            if (sfMatches.length === 0) {
                              return Array(2).fill(null).map((_, i) => (
                                <div key={i} className="sf-wrapper">
                                  <div className="bracket-match-card placeholder-card">
                                    <div className="placeholder-team">TBD</div>
                                  </div>
                                </div>
                              ));
                            }
                            return sfMatches.slice(0, 2).map((match, i) => (
                              <div key={i} className="sf-wrapper">
                                <div className={`bracket-match-card ${match.isLive ? 'is-live' : ''}`} onClick={() => fetchMatchDetails(match)}>
                                  <div className="match-meta">
                                    {match.isLive ? <span className="live-tag">● LIVE</span> : <span className="time-tag">{match.time}</span>}
                                    {match.leg && <span className="leg-tag">{match.leg}</span>}
                                  </div>
                                  <div className="team-row">
                                    <div className="team-info-mini">
                                      <img loading="lazy" decoding="async" src={match.homeLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                      <span className={match.winner === 'home' ? 'winner' : ''}>{match.home}</span>
                                    </div>
                                    <span className="score-mini">{match.homeScore}</span>
                                  </div>
                                  <div className="team-row">
                                    <div className="team-info-mini">
                                      <img loading="lazy" decoding="async" src={match.awayLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                      <span className={match.winner === 'away' ? 'winner' : ''}>{match.away}</span>
                                    </div>
                                    <span className="score-mini">{match.awayScore}</span>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Final */}
                      <div className="bracket-round">
                        <h4 className="round-title final-title"><span className="material-icons-round" style={{ fontSize: 20, verticalAlign: 'middle', marginRight: 6 }}>emoji_events</span> FINAL</h4>
                        <div className="round-matches final-offset">
                          {(() => {
                            const finalMatch = uclKnockoutMatches.find(m => (m.round?.includes('Final') || m.round === 'final') && !m.round?.includes('Quarter') && !m.round?.includes('Semi') && !m.round?.includes('Playoff'));
                            if (!finalMatch) {
                              return (
                                <div className="bracket-match-card final-placeholder">
                                  <div className="final-icon"><span className="material-icons-round">emoji_events</span></div>
                                  <div className="final-label">CHAMPION</div>
                                  <div className="final-tbd">TBD</div>
                                </div>
                              );
                            }
                            return (
                              <div className={`bracket-match-card final-match-card ${finalMatch.isLive ? 'is-live' : ''}`} onClick={() => fetchMatchDetails(finalMatch)}>
                                <div className="final-meta">
                                  {finalMatch.isLive ? <span className="live-tag-gold">● LIVE FINAL</span> : <span className="time-tag-gold">{finalMatch.time}</span>}
                                </div>
                                <div className="team-row-final">
                                  <div className="team-info-final">
                                    <img loading="lazy" decoding="async" src={finalMatch.homeLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={finalMatch.winner === 'home' ? 'winner-gold' : ''}>{finalMatch.home}</span>
                                  </div>
                                  <span className="score-final">{finalMatch.homeScore}</span>
                                </div>
                                <div className="team-row-final">
                                  <div className="team-info-final">
                                    <img loading="lazy" decoding="async" src={finalMatch.awayLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={finalMatch.winner === 'away' ? 'winner-gold' : ''}>{finalMatch.away}</span>
                                  </div>
                                  <span className="score-final">{finalMatch.awayScore}</span>
                                </div>
                                {finalMatch.isCompleted && <div className="match-status-final">{finalMatch.statusDetail?.replace(/Final/i, 'CHAMPIONS') || 'CHAMPIONS'}</div>}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            {/* Cricket knockout grid (IPL, BBL, T20WC, ILT20, SA20, PSL) */}
            {selectedSport === 'cricket' && CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) && cricketTab === 'knockout' && (
              <div className="knockout-bracket fade-in cricket-knockout" style={{ marginTop: '40px' }}>
                <div className="league-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <h3>
                    {leagueNames[currentTab]} — Knockout / Playoffs
                    {cricketSeasonYear != null && (
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginLeft: 8 }}>— {cricketSeasonYear}</span>
                    )}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div className="cricket-season-selector" style={{ margin: 0 }}>
                      <div className="cricket-season-selector-inner">
                        <span className="cricket-season-selector-icon material-icons-round" aria-hidden="true">calendar_today</span>
                        <label htmlFor="cricket-season-select-knockout" className="cricket-season-selector-label">Season</label>
                        <select
                          id="cricket-season-select-knockout"
                          className="cricket-season-selector-select"
                          value={cricketSeasonYear ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const year = val === '' ? null : parseInt(val, 10);
                            setCricketSeasonYear(year);
                            fetchCricketKnockoutMatches(currentTab, leagues[currentTab], year);
                          }}
                          aria-label="Select season for knockout"
                        >
                          <option value="">Current</option>
                          {getCricketSeasonYears(currentTab).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="toggle-tabs">
                      <button className={`toggle-btn ${cricketTab === 'league' ? 'active' : ''}`} onClick={() => setCricketTab('league')}>League Table</button>
                      <button className={`toggle-btn ${cricketTab === 'knockout' ? 'active' : ''}`} onClick={() => setCricketTab('knockout')}>Knockout</button>
                    </div>
                  </div>
                </div>
                {isMobile && (
                  <div className="swipe-hint">
                    <span className="material-icons-round">swipe</span> Swipe to explore bracket
                  </div>
                )}
                <div className="bracket-container">
                  <div className="bracket-grid" key={`knockout-${currentTab}-${cricketSeasonYear ?? 'current'}`}>
                    {(() => {
                      const list = cricketKnockoutMatches[currentTab] || [];
                      const byRound = {};
                      list.forEach(m => {
                        const r = m.round || 'Other';
                        if (!byRound[r]) byRound[r] = [];
                        byRound[r].push(m);
                      });
                      const order = ['Qualifier 1', 'Eliminator', 'Qualifier 2', 'Semi-Final 1', 'Semi-Final 2', 'Semi-Final', 'Semi Final', 'Semi 1', 'Semi 2', 'Quarter-Final', 'Final'];
                      const sortedRounds = Object.keys(byRound).sort((a, b) => {
                        const ai = order.findIndex(o => (a || '').toLowerCase().includes(o.toLowerCase()));
                        const bi = order.findIndex(o => (b || '').toLowerCase().includes(o.toLowerCase()));
                        if (ai !== -1 && bi !== -1) return ai - bi;
                        if (ai !== -1) return -1;
                        if (bi !== -1) return 1;
                        return (a || '').localeCompare(b || '');
                      });
                      if (sortedRounds.length === 0) {
                        const isT20wc = currentTab === 't20wc';
                        const year = cricketSeasonYear ?? new Date().getFullYear();
                        const isFutureYear = year > new Date().getFullYear();
                        const message = isT20wc && isFutureYear
                          ? 'Knockout matches will appear when the tournament reaches that stage. Data comes from ESPN.'
                          : 'No knockout matches found for this season. Check back during playoffs. Data is from ESPN when available.';
                        return (
                          <div className="bracket-round" style={{ width: '100%' }}>
                            <h4 className="round-title">Playoffs</h4>
                            <p style={{ color: 'var(--text-secondary)', padding: 24, textAlign: 'center' }}>{message}</p>
                          </div>
                        );
                      }
                      return sortedRounds.map((roundName) => (
                        <div key={roundName} className="bracket-round">
                          <h4 className="round-title">{roundName.toUpperCase()}</h4>
                          <div className="round-matches">
                            {(byRound[roundName] || []).map((match, i) => (
                              <div key={i} className={`bracket-match-card ${match.isLive ? 'is-live' : ''}`} onClick={() => fetchMatchDetails(match)}>
                                <div className="match-meta">
                                  {match.isLive ? <span className="live-tag">● LIVE</span> : <span className="time-tag">{match.time}</span>}
                                </div>
                                <div className="team-row">
                                  <div className="team-info-mini">
                                    <img loading="lazy" decoding="async" src={match.homeLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={match.winner === 'home' ? 'winner' : ''}>{match.home}</span>
                                  </div>
                                  <span className="score-mini">{match.homeScore}</span>
                                </div>
                                <div className="team-row">
                                  <div className="team-info-mini">
                                    <img loading="lazy" decoding="async" src={match.awayLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={match.winner === 'away' ? 'winner' : ''}>{match.away}</span>
                                  </div>
                                  <span className="score-mini">{match.awayScore}</span>
                                </div>
                                {match.isCompleted && match.statusDetail && <div className="match-status-mini">{match.statusDetail}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </section >
        );

      case 'news':
        if (featureFlags.news === false) {
          return (
            <section key="news-disabled" className="content-section active">
              <div className="section-header-pro">
                <p style={{ color: 'var(--text-muted, #94a3b8)', padding: 24 }}>News &amp; Updates is currently disabled.</p>
              </div>
            </section>
          );
        }
        return (
          <section key="news" className="content-section active">
            <div className="section-header-pro">
              <h3>
                <span className="material-icons-round section-header-sport-icon" aria-hidden="true">{sportConfig.icon}</span>
                Latest Headlines
              </h3>
              <p className="section-header-sub" style={{ marginTop: 4, fontSize: '0.875rem', color: 'var(--text-secondary, #94a3b8)' }}>From league feeds — {Object.values(leagueNames || {}).slice(0, 3).join(', ')}{Object.keys(leagueNames || {}).length > 3 ? ' & more' : ''}</p>
              {Math.ceil(news.length / getPageSize('news')) > 1 && (
                <Pagination
                  current={pageNews}
                  total={Math.ceil(news.length / getPageSize('news'))}
                  onPageChange={setPageNews}
                />
              )}
            </div>
            <div className="news-grid">
              {news
                .slice((pageNews - 1) * getPageSize('news'), pageNews * getPageSize('news'))
                .map((n, i) => (
                  <div key={i} className="news-card animate-in" onClick={() => window.open(n.link, '_blank')}>
                    <img loading="lazy" decoding="async" src={n.image} className="news-image" alt="" onError={(e) => { e.target.src = FALLBACK_NEWS_IMAGE; }} />
                    <div className="news-content">
                      <span className="news-tag">{n.source || n.tag}</span>
                      <h3 className="news-title">{n.title}</h3>
                      <p className="news-excerpt">{n.excerpt}</p>
                    </div>
                  </div>
                ))}
            </div>
            <Pagination
              current={pageNews}
              total={Math.ceil(news.length / getPageSize('news'))}
              onPageChange={setPageNews}
            />
          </section>
        );

      case 'players':
        return (
          <section key="players" className="content-section active players-tab-section">
            <div className="section-header-pro players-section-header">
              <h3>
                <span className="material-icons-round section-header-sport-icon" aria-hidden="true">{sportConfig.icon}</span>
                {selectedSport === 'f1' ? 'Top Drivers' : 'Top Players'}
              </h3>
              {Math.ceil(filteredPlayers.length / getPageSize('players')) > 1 && (
                <Pagination
                  current={pagePlayers}
                  total={Math.ceil(filteredPlayers.length / getPageSize('players'))}
                  onPageChange={setPagePlayers}
                />
              )}
            </div>
            <div className="players-header">
              <div className="filter-tabs">
                {playerFilterOptions.map(f => (
                  <button key={f} className={`filter-btn ${playerFilter === f ? 'active' : ''}`} onClick={() => setPlayerFilter(f)}>
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
              </div>
            </div>
            <div className="players-grid-wrap">
              {filteredPlayers.length === 0 ? (
                <div className="empty-state-pro players-empty">No players match your search or filter. Try "All" or clear the search.</div>
              ) : (
                <div className="players-grid">
                  {filteredPlayers
                    .slice((pagePlayers - 1) * getPageSize('players'), pagePlayers * getPageSize('players'))
                    .map(p => (
                      <div key={String(p.id)} className="player-card" onClick={() => setSelectedPlayer(p)}>
                        <div className="player-image-container">
                          <img
                            loading="lazy"
                            decoding="async"
                            src={p.image}
                            className="player-image"
                            alt={p.name}
                            onError={(e) => {
                              e.target.src = FALLBACK_PLAYER_IMAGE;
                            }}
                          />
                        </div>
                        <div className="player-stats-mini">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="player-name">{p.name}</div>
                            {featureFlags.favorites !== false && (
                              <span className={`material-icons-round fav-star ${favoritePlayers.includes(p.id) ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleFavoritePlayer(p.id); }}>
                                {favoritePlayers.includes(p.id) ? 'star' : 'star_border'}
                              </span>
                            )}
                          </div>
                          <div className="player-club-position">
                            {p.leagueLogo && (
                              <img loading="lazy" decoding="async" src={p.leagueLogo} alt="" className="player-league-logo" onError={(e) => { e.target.style.display = 'none'; }} />
                            )}
                            {p.club} | {p.position}
                          </div>
                          <div className="stats-grid">
                            <div className="stat-item"><span className="stat-val">{p.rating}</span><span className="stat-lbl">OVR</span></div>
                            <div className="stat-item"><span className="stat-val">{p.goals ?? '-'}</span><span className="stat-lbl">{p.primaryStatLabel || 'G'}</span></div>
                            <div className="stat-item"><span className="stat-val">{p.assists ?? '-'}</span><span className="stat-lbl">{p.secondaryStatLabel || 'A'}</span></div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            {filteredPlayers.length > 0 && (
              <Pagination
                current={pagePlayers}
                total={Math.ceil(filteredPlayers.length / getPageSize('players'))}
                onPageChange={setPagePlayers}
              />
            )}
          </section>
        );

      case 'favorites':
        if (featureFlags.favorites === false) {
          return (
            <section key="favorites-disabled" className="content-section active">
              <p style={{ color: 'var(--text-muted, #94a3b8)', padding: 24 }}>Favorites are currently disabled.</p>
            </section>
          );
        }
        return (
          <section key="favorites" className="content-section active">
            <div className="favorites-header" style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 800 }}><span className="material-icons-round" style={{ fontSize: 26, verticalAlign: 'middle', marginRight: 8 }}>star</span> My Favorites</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Manage your favorite athletes and teams across {sportConfig.label} competitions.</p>
            </div>

            <div style={{ marginBottom: '50px' }}>
              <h4 className="section-title-pro">Favorite Players</h4>
              <div className="players-grid">
                {allPlayersIndex.filter(p => favoritePlayers.includes(p.id)).length > 0 ? (
                  allPlayersIndex.filter(p => favoritePlayers.includes(p.id))
                    .slice((pageFavPlayers - 1) * getPageSize('players'), pageFavPlayers * getPageSize('players'))
                    .map(p => (
                      <div key={p.id} className="player-card animate-in">
                        <div className="player-image-container">
                          <img loading="lazy" decoding="async" src={p.image} className="player-image" alt={p.name} onError={(e) => { e.target.src = FALLBACK_PLAYER_IMAGE; }} />
                        </div>
                        <div className="player-stats-mini">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="player-name">{p.name}</div>
                            <span className="material-icons-round fav-star active" onClick={() => toggleFavoritePlayer(p.id)}>star</span>
                          </div>
                          <div className="player-club-position">{p.club}</div>
                        </div>
                      </div>
                    ))
                ) : <div className="empty-state-pro">No favorite players yet. Go to "Top Players" to add some!</div>}
              </div>
              <Pagination
                current={pageFavPlayers}
                total={Math.ceil(allPlayersIndex.filter(p => favoritePlayers.includes(p.id)).length / getPageSize('players'))}
                onPageChange={setPageFavPlayers}
              />
            </div>

            <div style={{ marginBottom: '50px' }}>
              <h4 className="section-title-pro">Favorite Teams</h4>
              <div className="matches-grid">
                {allClubs.filter(c => favorites.includes(c.name)).length > 0 ? (
                  allClubs.filter(c => favorites.includes(c.name))
                    .slice((pageFavClubs - 1) * getPageSize('clubs'), pageFavClubs * getPageSize('clubs'))
                    .map(c => (
                      <div key={c.id} className="match-card animate-in stubhub-card-sleek" style={{ padding: '20px', textAlign: 'center' }}>
                        <img loading="lazy" decoding="async" src={c.logo} style={{ width: '80px', height: '80px', marginBottom: '15px' }} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                        <div style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>{c.name}</div>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>{c.league}</div>
                        <button className="book-btn-minimal" style={{ width: '100%' }} onClick={() => toggleFavorite(c.name)}>Remove Favorite</button>
                      </div>
                    ))
                ) : <div className="empty-state-pro">No favorite clubs yet.</div>}
              </div>
              <Pagination
                current={pageFavClubs}
                total={Math.ceil(allClubs.filter(c => favorites.includes(c.name)).length / getPageSize('clubs'))}
                onPageChange={setPageFavClubs}
              />
            </div>

            <div>
              <h4 className="section-title-pro"><span className="material-icons-round" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 6 }}>public</span> Manage All Teams</h4>
              <div className="search-bar" style={{ marginBottom: '20px', maxWidth: '400px' }}>
                <span className="material-icons-round">search</span>
                <input
                  type="text"
                  placeholder="Find team to favorite..."
                  value={manageSearch}
                  onChange={(e) => setManageSearch(e.target.value)}
                />
              </div>
              <div className="matches-grid">
                {managedClubs.length > 0 ? (
                  managedClubs
                    .slice((pageManageClubs - 1) * getPageSize('clubs'), pageManageClubs * getPageSize('clubs'))
                    .map(c => (
                      <div key={c.id} className="match-card animate-in stubhub-card-sleek" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <img loading="lazy" decoding="async" src={c.logo} style={{ width: '40px', height: '40px' }} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{c.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{c.league}</div>
                        </div>
                        {featureFlags.favorites !== false && (
                          <span className={`material-icons-round fav-star ${favorites.includes(c.name) ? 'active' : ''}`}
                            onClick={() => toggleFavorite(c.name)}>
                            {favorites.includes(c.name) ? 'star' : 'star_border'}
                          </span>
                        )}
                      </div>
                    ))
                ) : <div className="loader-container"><div className="loader"></div> Loading teams...</div>}
              </div>
              <Pagination
                current={pageManageClubs}
                total={Math.ceil(managedClubs.length / getPageSize('clubs'))}
                onPageChange={setPageManageClubs}
              />
            </div>
          </section>
        );

      case 'tactics':
        return (
          <section key="tactics" className="content-section active">
            <div className="tickets-header-pro">
              <div className="header-text">
                <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'white' }}>Teams</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Explore profiles of {allClubs.length} teams across {sportConfig.label} leagues.</p>
              </div>
            </div>
            <div className="tactics-grid">
              {filteredClubs
                .slice((pageClubs - 1) * getPageSize('clubs'), pageClubs * getPageSize('clubs'))
                .map(t => (
                  <div key={t.id} className="tactic-card animate-in tactic-card-item" data-name={t.name} onClick={() => fetchClubRoster(t)}>
                    <div className="tactic-header">
                      <img loading="lazy" decoding="async" src={t.logo} className="tactic-logo" alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 800 }}>{t.name}</div>
                          {featureFlags.favorites !== false && (
                            <span className={`material-icons-round fav-star ${favorites.includes(t.name) ? 'active' : ''}`}
                              onClick={() => toggleFavorite(t.name)}>
                              {favorites.includes(t.name) ? 'star' : 'star_border'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.tagline}</div>
                      </div>
                    </div>
                    <div className="formation-badge">{t.formation}</div>
                    <p className="tactic-description">{t.description}</p>
                  </div>
                ))}
              {allClubs.length === 0 && <div className="loader-container"><div className="loader"></div> Loading Tactics...</div>}
            </div>
            <Pagination
              current={pageClubs}
              total={Math.ceil(filteredClubs.length / getPageSize('clubs'))}
              onPageChange={setPageClubs}
            />
          </section>
        );

      case 'game':
        if (selectedSport === 'cricket') {
          return <SuperOverGame key="game" triggerCelebration={triggerCelebration} bestScore={superOverBest} onBestScore={setSuperOverBest} />;
        }
        return <PenaltyGame key="game" triggerCelebration={triggerCelebration} bestScore={penaltyBest} onBestScore={setPenaltyBest} />;

      case 'tickets':
        return (
          <section key="tickets" className="content-section active">
            {!selectedMatchForTicket ? (
              <>
                <div className="tickets-header-pro">
                  <div className="header-text">
                    <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'white' }}>Find Live Schedules</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Live availability for top {sportConfig.label} leagues</p>
                  </div>
                  <div className="date-selector">
                    <input
                      type="date"
                      className="search-bar"
                      value={`${ticketDate.slice(0, 4)}-${ticketDate.slice(4, 6)}-${ticketDate.slice(6, 8)}`}
                      onChange={(e) => setTicketDate(e.target.value.split('-').join(''))}
                      style={{ width: '200px' }}
                    />
                    <div className="quick-dates">
                      <button onClick={() => setTicketDate(new Date().toISOString().split('T')[0].split('-').join(''))}>Today</button>
                      <button onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setTicketDate(tomorrow.toISOString().split('T')[0].split('-').join(''));
                      }}>Tomorrow</button>
                    </div>
                  </div>
                </div>

                {isFetchingTickets ? (
                  <div className="loader-container"><div className="loader"></div> Searching tickets...</div>
                ) : (
                  <div className="matches-grid tickets-pro-grid">
                    {ticketMatches.length > 0 ? (
                      ticketMatches.map(m => (
                        <div key={m.id} className="match-card animate-in stubhub-card-sleek" onClick={() => setSelectedMatchForTicket(m)}>
                          <div className="match-hero">
                            <img loading="lazy" decoding="async" src={m.pick} alt="Stadium" className="hero-img" />
                            <div className="hero-overlay">
                              <span className="league-tag-pro">{m.league}</span>
                              <div className="match-icons-row">
                                <img loading="lazy" decoding="async" src={m.homeLogo} alt={m.home} className="team-logo-pro" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                <span className="vs-minimal">VS</span>
                                <img loading="lazy" decoding="async" src={m.awayLogo} alt={m.away} className="team-logo-pro" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                              </div>
                            </div>
                          </div>
                          <div className="match-info-box">
                            <div className="match-title-pro">
                              <span className="t-name">{m.home}</span>
                              <span className="vs-sep">v</span>
                              <span className="t-name">{m.away}</span>
                            </div>
                            <div className="venue-detail">
                              <span className="material-icons-round">pin_drop</span> {m.venue}
                            </div>
                            <div className="match-date-time-tag">
                              <span className="material-icons-round">calendar_today</span> {m.time}
                            </div>
                            <div className="card-pro-footer">
                              <div className="price-label">Tickets from</div>
                              <div className="price-value-bold">${Math.floor(m.priceBase)}</div>
                              <button className="book-btn-minimal">Book Now</button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-matches-placeholder">
                        <span className="material-icons-round" style={{ fontSize: '48px', marginBottom: '16px' }}>event_busy</span>
                        <p>No matches scheduled for this date.</p>
                        <button className="game-btn" onClick={() => setTicketDate(new Date().toISOString().split('T')[0].split('-').join(''))}>Return to Today</button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <StubHubBooking
                match={selectedMatchForTicket}
                onBack={() => setSelectedMatchForTicket(null)}
                onBook={(booking) => {
                  setBookedTickets(prev => ({
                    ...prev,
                    [selectedMatchForTicket.id]: [...(prev[selectedMatchForTicket.id] || []), booking]
                  }));
                }}
              />
            )}
          </section>
        );

      case 'soccer_no_reason':
        if (selectedSport !== 'soccer') return null;
        return (
          <section key="soccer_no_reason" className="content-section active">
            <div style={{ padding: 48, textAlign: 'center', maxWidth: 420, margin: '60px auto' }}>
              <span className="material-icons-round" style={{ fontSize: 72, color: 'var(--accent, #f59e0b)', marginBottom: 16 }}>mood</span>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 12 }}>For No Reason</h2>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: 0 }}>You found the tab that exists for no reason. Congrats.</p>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  if (!authReady) {
    return (
      <div className="app-loading" aria-live="polite" aria-busy="true">
        <div className="app-loading-inner">
          <img src="/curlysports-logo.png" alt="Curly Sports" className="app-loading-logo" />
          <h1 className="app-loading-title">CURLY SPORTS</h1>
          <div className="loader"></div>
          <p className="app-loading-text">Loading…</p>
        </div>
      </div>
    );
  }

  const isProtectedRoute = isDashboardRoute || normalizedPath.startsWith('/dashboard/');
  const isPublicRoute = isHomeRoute || isLoginRoute || isSignupRoute;

  if (isHomeRoute) {
    return <HomePage isAuthenticated={isAuthenticated} homeTheme={homeTheme} setHomeTheme={setHomeTheme} />;
  }
  if (isLoginRoute) {
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return <LoginPage mode="login" isAuthenticated={false} homeTheme={homeTheme} setHomeTheme={setHomeTheme} />;
  }
  if (isSignupRoute) {
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return <LoginPage mode="signup" isAuthenticated={false} homeTheme={homeTheme} setHomeTheme={setHomeTheme} />;
  }
  if (isProtectedRoute && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isPublicRoute && !isProtectedRoute) {
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  // From here: authenticated user on /dashboard (main app)
  // Single codebase: switch UI by role (no redirect). Use email as fallback so bootstrap admin/super_admin always see correct UI.
  // Super Admin–managed list (sa_admins) also grants admin/super_admin; bootstrap emails always have access.
  const saRole = getSaRoleForEmail(user?.email, appConfig.saAdmins);
  const effectiveSuperAdmin = user?.role === 'super_admin' || isSuperAdminEmail(user?.email) || saRole === 'super_admin';
  const effectiveAdmin = user?.role === 'admin' || isAdminEmail(user?.email) || saRole === 'admin';
  if (effectiveSuperAdmin) {
    return (
      <SuperAdminDashboard
        user={{ ...user, role: 'super_admin' }}
        onLogout={handleLogout}
        colorScheme={colorScheme}
        setColorScheme={setColorScheme}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
      />
    );
  }
  if (effectiveAdmin) {
    return (
      <AdminDashboard
        user={{ ...user, role: 'admin' }}
        onLogout={handleLogout}
        colorScheme={colorScheme}
        setColorScheme={setColorScheme}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
      />
    );
  }
  const isMaintenanceMode = appConfig.maintenance === true || (typeof localStorage !== 'undefined' && localStorage.getItem('sa_maintenance') === 'true');
  if (isMaintenanceMode) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#121212', color: '#f1f5f9', flexDirection: 'column', gap: 16, padding: 24 }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Under maintenance</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>We’ll be back shortly. Please try again later.</p>
        <button type="button" onClick={handleLogout} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#0a0e1a', cursor: 'pointer', fontWeight: 600 }}>Log out</button>
      </div>
    );
  }
  /* Signup survey: block main app until user either completes or skips (after first userData load). */
  const mustShowSurvey = user && userDataLoaded && userData?.surveyCompleted !== true && userData?.surveySkipped !== true;
  if (mustShowSurvey) {
    return (
      <SurveyInterests
        user={user}
        sportsList={enabledSportKeys.map((key) => ({ key, label: SPORTS_CONFIG[key]?.label || key }))}
        getSportData={getSportData}
        initialSurveyInterests={userData?.surveyInterests}
        initialFavoriteTeams={favorites}
        initialFavoritePlayers={favoritePlayers}
        onComplete={(payload) => {
          if (payload) {
            if (Array.isArray(payload.favoriteClubs)) setFavorites(payload.favoriteClubs);
            if (Array.isArray(payload.favoritePlayers)) setFavoritePlayers(payload.favoritePlayers);
          }
          setUserDataState((prev) => (prev ? { ...prev, ...payload } : { ...payload }));
          setTab('dashboard');
        }}
        onSkip={() => {
          setUserDataState((prev) => (prev ? { ...prev, surveySkipped: true } : { surveySkipped: true }));
          setTab('dashboard');
        }}
      />
    );
  }
  /* Main app: sidebar + content. Dashboard is a tab inside the app (no /dashboard route). */
  return (
    <>
      <div className="app-container">
        <div className={`theme-experience theme-experience--${themeMode}`} aria-hidden="true" />
        <Sidebar
          currentTab={currentTab}
          setTab={setTab}
          user={user}
          onLogout={handleLogout}
          onOpenProfileMenu={() => setProfileMenuOpen(true)}
          selectedSport={selectedSport}
          setSelectedSport={setSelectedSport}
          enabledSportKeys={enabledSportKeys}
          leagueNames={leagueNames}
          leagueLogos={leagueLogos}
          leagueShortNames={sportConfig.leagueShortNames || {}}
          leagues={leagues}
          featureFlags={featureFlags}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
        />

        {profileMenuOpen && user && (
          <ProfileMenu
            user={user}
            onClose={() => setProfileMenuOpen(false)}
            onLogout={handleLogout}
            colorScheme={colorScheme}
            setColorScheme={setColorScheme}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
          />
        )}
        <main className="main-content" data-tab={currentTab}>
          {currentTab === 'dashboard' ? (
            <>
              <div className="dashboard-bg-overlay" aria-hidden="true" />
              <Dashboard
                user={user}
                userData={userData}
                favorites={favorites}
                favoritePlayers={favoritePlayers}
                news={dashboardNewsForUser}
                transferNews={transferNewsForUser}
                matchReports={matchReportsForUser}
                matches={matches}
                allClubs={allClubs}
                allPlayersIndex={allPlayersIndex}
                onOpenMatch={fetchMatchDetails}
                selectedSport={selectedSport}
                surveySkipped={userData?.surveySkipped === true}
                surveyCompleted={userData?.surveyCompleted === true}
                onOpenSurvey={() => setShowSurveyModal(true)}
              />
            </>
          ) : (
            <>
              {/* Mobile/tablet: logo + sport dropdown + profile + logout (all formats) */}
              <div className="mobile-sport-selector">
                <div className="mobile-header-logo" onClick={() => setTab('live')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTab('live'); }} aria-label="Go to Live Scores">
                  <img src="/curlysports-logo.png" alt="Curly Sports" className="mobile-header-logo-img" />
                </div>
                <button type="button" className={`mobile-dashboard-btn ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')} aria-label="Dashboard">
                  <span className="material-icons-round">dashboard</span>
                  <span>Dashboard</span>
                </button>
                <div className="mobile-header-sport">
                  <SportDropdown selectedSport={selectedSport} setSelectedSport={setSelectedSport} enabledSportKeys={enabledSportKeys} setTab={setTab} className="sport-dropdown-mobile" />
                </div>
                <div className="mobile-header-user">
                  <div className="user-profile mobile-user-profile" onClick={() => setProfileMenuOpen(true)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProfileMenuOpen(true); } }} aria-label="Open profile menu">
                    <div className="avatar">
                      {user?.avatar && user.avatar.length > 2 ? (
                        <img loading="lazy" decoding="async" src={user.avatar} alt="" className="avatar-img" />
                      ) : (
                        user?.avatar || 'M'
                      )}
                    </div>
                    <div className="user-info">
                      <span className="name">{user?.name || 'Member'}</span>
                      <span className="status">Online</span>
                      {featureFlags.streaks !== false && typeof user?.currentStreak === 'number' && user.currentStreak > 0 && (
                        <span className="user-streak mobile-streak"><span className="material-icons-round streak-icon">local_fire_department</span>{user.currentStreak}d</span>
                      )}
                    </div>
                  </div>
                  <button type="button" className="logout-btn-pro mobile-logout-btn" onClick={handleLogout} title="Logout" aria-label="Logout">
                    <span className="material-icons-round">logout</span>
                  </button>
                </div>
              </div>
              {enabledSportKeys.length > 0 && !enabledSportKeys.includes(selectedSport) ? (
                <div className="sport-unavailable-block" style={{ padding: 48, textAlign: 'center', maxWidth: 480, margin: '40px auto' }}>
                  <span className="material-icons-round" style={{ fontSize: 64, color: 'var(--accent, #f59e0b)', marginBottom: 16 }}>sports</span>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: 12 }}>Sorry, this sport is not currently available.</h2>
                  <p style={{ color: 'var(--text-secondary, #94a3b8)', marginBottom: 24 }}>Coming soon. Please choose another sport from the menu.</p>
                  <button
                    type="button"
                    onClick={() => setSelectedSport(enabledSportKeys[0])}
                    style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: 'var(--accent, #f59e0b)', color: '#0a0e1a', cursor: 'pointer', fontWeight: 600 }}
                  >
                    View {SPORTS_CONFIG[enabledSportKeys[0]]?.label || enabledSportKeys[0]} instead
                  </button>
                </div>
              ) : (
                <>
                  <TopBar
                    title={currentTab === 'live' ? `${sportConfig.label} Live Match Center` : (leagueNames[currentTab] || currentTab.charAt(0).toUpperCase() + currentTab.slice(1))}
                    titleLogo={leagueNames[currentTab] && leagueLogos[currentTab] ? leagueLogos[currentTab] : undefined}
                    search={search}
                    setSearch={setSearch}
                    lastUpdate={lastUpdate}
                    sourceLabel={sportConfig.dataSource}
                    sources={sportConfig.sources}
                    rightSlot={user?.uid ? <NotificationsBell userId={user.uid} /> : null}
                  />
                  {renderSection()}
                </>
              )}
            </>
          )}
        </main>

        {celebration && (
          <div className="celebration-overlay active" onClick={() => setCelebration(null)}>
            <div className="team-alert">
              <span className="material-icons-round celebration-icon">workspace_premium</span>
              <h1>{celebration.title}</h1>
              <p>{celebration.detail}</p>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast-card animate-in ${toast.type}`}>
              <span className="material-icons-round toast-icon">{toast.icon || 'notifications'}</span>
              <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-text">{toast.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Player Detail Modal */}
        {selectedPlayer && (
          <div className="modal-overlay" onClick={() => setSelectedPlayer(null)}>
            <div className="modal-content animate-in player-detail-modal" onClick={e => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setSelectedPlayer(null)}>&times;</button>
              <div className="modal-hero">
                <img loading="lazy" decoding="async" src={selectedPlayer.image} className="modal-player-img" alt="" onError={(e) => { e.target.src = FALLBACK_PLAYER_IMAGE; }} />
                <div className="modal-hero-text">
                  <h2>{selectedPlayer.name}</h2>
                  <p className="modal-hero-meta">
                    {selectedPlayer.leagueLogo && (
                      <img loading="lazy" decoding="async" src={selectedPlayer.leagueLogo} alt="" className="modal-league-logo" onError={(e) => { e.target.style.display = 'none'; }} />
                    )}
                    {selectedPlayer.club} | {selectedPlayer.position}
                  </p>
                </div>
              </div>
              <div className="modal-body mini-scroll">
                <div className="quick-stats">
                  <div className="modal-stat"><label>Age</label><strong>{selectedPlayer.age || '-'}</strong></div>
                  <div className="modal-stat"><label>Height</label><strong>{selectedPlayer.height || '-'}</strong></div>
                  <div className="modal-stat"><label>Weight</label><strong>{selectedPlayer.weight || '-'}</strong></div>
                  <div className="modal-stat"><label>{selectedPlayer.primaryStatLabel || 'Goals'}</label><strong>{typeof selectedPlayer.goals === 'number' ? selectedPlayer.goals.toLocaleString() : (selectedPlayer.goals ?? '-')}</strong></div>
                  {selectedPlayer.assists && selectedPlayer.assists !== '-' && (
                    <div className="modal-stat"><label>{selectedPlayer.secondaryStatLabel || 'AST'}</label><strong>{typeof selectedPlayer.assists === 'number' ? selectedPlayer.assists.toLocaleString() : selectedPlayer.assists}</strong></div>
                  )}
                  {selectedPlayer.conference && (
                    <div className="modal-stat"><label>Conference</label><strong>{selectedPlayer.conference}</strong></div>
                  )}
                </div>
                <div className="modal-section-box">
                  <h4>Career Path</h4>
                  <div className="career-line">
                    {selectedPlayer.career?.map((c, i) => <span key={i} className="career-tag">{c}</span>)}
                  </div>
                </div>
                {selectedPlayer.trophies?.length > 0 && (
                  <div className="modal-section-box">
                    <h4>Trophies & Awards</h4>
                    <ul>{selectedPlayer.trophies.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  </div>
                )}
                {selectedPlayer.achievements?.length > 0 && (
                  <div className="modal-section-box">
                    <h4>Key Achievements</h4>
                    <ul>{selectedPlayer.achievements.map((a, i) => <li key={i}>{a}</li>)}</ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Club Detail Modal */}
        {selectedClub && (
          <div className="modal-overlay" onClick={() => setSelectedClub(null)}>
            <div className="modal-content animate-in club-detail-modal" onClick={e => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setSelectedClub(null)}>&times;</button>
              <div className="modal-hero club-hero">
                <img loading="lazy" decoding="async" src={selectedClub.logo} className="modal-club-logo" alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                <div className="modal-hero-text">
                  <h2>{selectedClub.name}</h2>
                  <p>{selectedClub.league} | {selectedClub.tagline}</p>
                </div>
              </div>
              <div className="modal-body mini-scroll">
                <div className="modal-section-box">
                  <h4>Club History</h4>
                  <p>{selectedClub.history}</p>
                </div>
                <div className="modal-section-box">
                  <h4>Actual Lineup / Roster</h4>
                  <div className="lineup-grid">
                    {selectedClub.lineup?.length > 0 ? (
                      selectedClub.lineup.map((p, i) => <div key={i} className="lineup-player">{p}</div>)
                    ) : (
                      <div className="lineup-player">Loading real lineup...</div>
                    )}
                  </div>
                </div>
                <div className="modal-section-box">
                  <h4>Club Legends</h4>
                  <div className="career-line">
                    {selectedClub.legends?.map((l, i) => <span key={i} className="career-tag legend">{l}</span>)}
                  </div>
                </div>
                <div className="modal-section-box">
                  <h4>Trophies</h4>
                  <ul>{selectedClub.trophies?.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Match Detail Modal — Sport-Aware */}
        {selectedMatchStatus && (() => {
          const mCfg = MATCH_DETAIL_CONFIG[selectedSport] || MATCH_DETAIL_CONFIG.soccer;
          const d = selectedMatchStatus.details || {};
          const hasStarted = selectedMatchStatus.isLive || selectedMatchStatus.isCompleted;
          const gameLeaders = d.gameLeaders || [];
          const lineups = d.lineups || [];
          const scoringPlays = d.scoringPlays || [];
          const keyEvents = d.keyEvents || [];
          const boxTeams = d.boxscore?.teams || [];

          // Normalize any value to string for display (prevents [object Object])
          const toScoreStr = (v) => {
            if (v == null || v === '') return '—';
            if (typeof v === 'object') return String(v.displayValue ?? v.value ?? v.text ?? '—').trim() || '—';
            const s = String(v).trim();
            return s.replace(/^Target\s*\)?/i, '').replace(/\)+$/, '').trim() || '—';
          };
          const cleanMainScore = (v) => {
            if (v == null || v === '') return '0';
            if (typeof v === 'object') return String(v.displayValue ?? v.value ?? v).trim();
            return String(v).replace(/^Target\s*\)?/i, '').replace(/\)+$/, '').trim() || '0';
          };

          // Normalize periodScores so every cell is a string
          const periodScores = (d.periodScores || []).map(ps => ({
            ...ps,
            team: toScoreStr(ps.team),
            linescores: (ps.linescores || []).map(ls => toScoreStr(ls)),
            totalScore: toScoreStr(ps.totalScore)
          }));

          // Build available tabs dynamically based on sport & data
          const tabs = [{ id: 'summary', label: 'Summary' }];
          if (keyEvents.length > 0 || scoringPlays.length > 0) tabs.push({ id: 'plays', label: selectedSport === 'f1' ? 'Race Log' : 'Key Plays' });
          if (boxTeams.length >= 2) tabs.push({ id: 'stats', label: 'Stats' });
          if (gameLeaders.length > 0 && mCfg.showLeaders) tabs.push({ id: 'leaders', label: 'Leaders' });
          if (selectedSport === 'cricket' && mCfg.showLeaders && gameLeaders.length === 0) tabs.push({ id: 'leaders', label: 'Leaders' });
          if (lineups.length > 0 && mCfg.showLineups) tabs.push({ id: 'lineups', label: 'Lineups' });

          const activeTab = tabs.find(t => t.id === matchDetailTab) ? matchDetailTab : 'summary';

          return (
            <div className="modal-overlay" onClick={() => { setSelectedMatchStatus(null); setMatchDetailTab('summary'); }}>
              <div className="modal-content animate-in match-detail-modal" onClick={e => e.stopPropagation()}>
                <button className="close-modal" onClick={() => { setSelectedMatchStatus(null); setMatchDetailTab('summary'); }}>&times;</button>
                <div className="modal-hero match-hero-detail">
                  <div className="match-league-tag">
                    <span className="material-icons-round" style={{ fontSize: 14 }}>{sportConfig.icon}</span>
                    {selectedMatchStatus.league}
                  </div>
                  <div className="match-teams-large">
                    <div className="m-team">
                      <img loading="lazy" decoding="async" src={selectedMatchStatus.homeLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                      <h3>{selectedMatchStatus.home}</h3>
                    </div>
                    <div className="m-score-box">
                      <span className="m-score">{hasStarted ? `${cleanMainScore(selectedMatchStatus.homeScore)} – ${cleanMainScore(selectedMatchStatus.awayScore)}` : 'vs'}</span>
                      <span className="m-time-detail">
                        {selectedMatchStatus.isLive && <span className="pulse-dot" style={{ display: 'inline-block', width: 6, height: 6, marginRight: 6, verticalAlign: 'middle' }}></span>}
                        {selectedMatchStatus.time}
                      </span>
                    </div>
                    <div className="m-team">
                      <img loading="lazy" decoding="async" src={selectedMatchStatus.awayLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                      <h3>{selectedMatchStatus.away}</h3>
                    </div>
                  </div>

                  {/* Period/Quarter/Inning score strip */}
                  {hasStarted && periodScores.length >= 2 && periodScores[0].linescores?.length > 0 && (
                    <div className="period-score-strip">
                      <table className="period-score-table">
                        <thead>
                          <tr>
                            <th></th>
                            {periodScores[0].linescores.map((_, i) => (
                              <th key={i}>{mCfg.periodNames[i] || `${mCfg.periodLabel} ${i + 1}`}</th>
                            ))}
                            <th className="total-col">T</th>
                          </tr>
                        </thead>
                        <tbody>
                          {periodScores.sort((a, b) => (a.isHome ? -1 : 1)).map((ps, i) => (
                            <tr key={i}>
                              <td className="period-team-cell">
                                <img loading="lazy" decoding="async" src={ps.logo} alt="" style={{ width: 16, height: 16, marginRight: 6 }} onError={(e) => { e.target.style.display = 'none'; }} />
                                {ps.team}
                              </td>
                              {ps.linescores.map((s, j) => <td key={j}>{typeof s === 'string' ? s : toScoreStr(s)}</td>)}
                              <td className="total-col"><strong>{ps.totalScore}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Game info bar */}
                {(d.venue || d.attendance || d.weather) && (
                  <div className="match-info-bar">
                    {d.venue && <span><span className="material-icons-round" style={{ fontSize: 14 }}>stadium</span> {d.venue}</span>}
                    {d.attendance && <span><span className="material-icons-round" style={{ fontSize: 14 }}>groups</span> {Number(d.attendance).toLocaleString()}</span>}
                    {d.weather && <span><span className="material-icons-round" style={{ fontSize: 14 }}>thermostat</span> {d.weather}</span>}
                  </div>
                )}

                <div className="modal-body mini-scroll">
                  {/* Dynamic tabs */}
                  <div className="match-tabs">
                    {tabs.map(t => (
                      <div key={t.id} className={`match-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setMatchDetailTab(t.id)}>
                        {t.label}
                      </div>
                    ))}
                  </div>

                  {/* ========== SUMMARY TAB ========== */}
                  {activeTab === 'summary' && (
                    <div className="match-detail-section">
                      {/* Scoring plays timeline */}
                      {scoringPlays.length > 0 && (
                        <div className="scoring-plays-section">
                          <h4><span className="material-icons-round" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 6 }}>{mCfg.eventIcons.goal}</span> Scoring Summary</h4>
                          <div className="scoring-timeline">
                            {scoringPlays.map((p, i) => (
                              <div key={i} className="scoring-play-item animate-in" style={{ animationDelay: `${i * 0.03}s` }}>
                                <div className="sp-score-badge">{p.homeScore} - {p.awayScore}</div>
                                <div className="sp-content">
                                  <div className="sp-meta">
                                    {p.periodText && <span className="sp-period">{p.periodText}</span>}
                                    {p.clock && <span className="sp-clock">{p.clock}</span>}
                                    {p.type && <span className="sp-type">{p.type}</span>}
                                  </div>
                                  <div className="sp-text">{p.text}</div>
                                  {p.team && <div className="sp-team">{p.team}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick leaders preview */}
                      {(gameLeaders.length > 0 && mCfg.showLeaders) ? (
                        <div className="leaders-preview-section">
                          <h4><span className="material-icons-round" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 6 }}>emoji_events</span> Top Performers</h4>
                          <div className="leaders-preview-grid">
                            {gameLeaders.slice(0, 3).map((cat, i) => (
                              <div key={i} className="leader-preview-card">
                                <div className="lp-category">{cat.displayName}</div>
                                {cat.leaders.slice(0, 1).map((l, j) => (
                                  <div key={j} className="lp-player">
                                    {l.headshot && <img loading="lazy" decoding="async" src={l.headshot} alt="" className="lp-headshot" onError={(e) => { e.target.style.display = 'none'; }} />}
                                    <div className="lp-info">
                                      <div className="lp-name">{l.displayName}</div>
                                      <div className="lp-value">{l.value}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (selectedSport === 'cricket' && hasStarted && (
                        <div className="leaders-preview-section leaders-empty-state">
                          <h4><span className="material-icons-round" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 6 }}>emoji_events</span> Top Performers</h4>
                          <p className="leaders-empty-text">{selectedMatchStatus.details?.keyEventsNote || 'Top performer stats (runs, wickets) will appear here when available from the source.'}</p>
                        </div>
                      ))}

                      {/* Boxscore stats summary - top 5 */}
                      {hasStarted && boxTeams.length >= 2 && boxTeams[0].statistics?.length > 0 && (
                        <div className="stats-summary-section">
                          <h4><span className="material-icons-round" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 6 }}>bar_chart</span> Key Stats</h4>
                          <div className="stats-grid-pro">
                            {boxTeams[0].statistics.slice(0, 6).map((stat, idx) => {
                              const awayStat = boxTeams[1].statistics.find(s => s.name === stat.name);
                              if (!awayStat) return null;
                              const hVal = parseFloat(stat.displayValue) || 0;
                              const aVal = parseFloat(awayStat.displayValue) || 0;
                              const total = hVal + aVal;
                              const hPerc = total === 0 ? 50 : (hVal / total) * 100;
                              return (
                                <div key={idx} className="stat-row-pro animate-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                                  <div className="stat-labels">
                                    <span>{stat.displayValue}</span>
                                    <span className="stat-name">{stat.label}</span>
                                    <span>{awayStat.displayValue}</span>
                                  </div>
                                  <div className="stat-bar-container">
                                    <div className="stat-bar-fill" style={{ width: `${hPerc}%` }}></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Fallback if no data yet */}
                      {!hasStarted && (
                        <div className="match-not-started">
                          <span className="material-icons-round" style={{ fontSize: 48, color: 'var(--text-secondary)', marginBottom: 12 }}>schedule</span>
                          <p>Match hasn't started yet</p>
                          <p className="mns-sub">Stats, scoring plays, and leaders will appear once the {selectedSport === 'f1' ? 'race' : 'game'} begins.</p>
                          <div className="stats-grid-pro" style={{ marginTop: 20, opacity: 0.4 }}>
                            {mCfg.fallbackStats.slice(0, 5).map((label, i) => (
                              <div key={i} className="stat-row-pro">
                                <div className="stat-labels">
                                  <span>—</span>
                                  <span className="stat-name">{label}</span>
                                  <span>—</span>
                                </div>
                                <div className="stat-bar-container">
                                  <div className="stat-bar-fill" style={{ width: '50%', opacity: 0.3 }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========== KEY PLAYS TAB ========== */}
                  {activeTab === 'plays' && (
                    <div className="match-detail-section">
                      <div className="updates-list">
                        {keyEvents.length > 0 ? keyEvents.map((ev, i) => (
                          <div key={i} className="update-item animate-in" style={{ animationDelay: `${i * 0.04}s` }}>
                            <div className="update-time-tag">{ev.clock?.displayValue || ev.shortText}</div>
                            <div className="update-icon">
                              <span className="material-icons-round">
                                {(() => {
                                  const t = ev.type?.text?.toLowerCase() || '';
                                  if (t.includes('goal') || t.includes('run') || t.includes('touchdown') || t.includes('homer')) return mCfg.eventIcons.goal;
                                  if (t.includes('card') || t.includes('foul') || t.includes('penalty')) return 'warning';
                                  if (t.includes('substitution') || t.includes('pit')) return 'cached';
                                  if (t.includes('wicket')) return 'sports_cricket';
                                  return 'info';
                                })()}
                              </span>
                            </div>
                            <div className="update-content">
                              <div className="update-type">{ev.type?.text}</div>
                              <div className="update-text">{ev.text}</div>
                              {ev.participants?.map(p => (
                                <div key={p.athlete?.id || Math.random()} className="update-player">{p.athlete?.displayName}</div>
                              ))}
                            </div>
                          </div>
                        )) : scoringPlays.length > 0 ? scoringPlays.map((p, i) => (
                          <div key={i} className="update-item animate-in" style={{ animationDelay: `${i * 0.04}s` }}>
                            <div className="update-time-tag">{p.clock || p.periodText}</div>
                            <div className="update-icon">
                              <span className="material-icons-round">{mCfg.eventIcons.goal}</span>
                            </div>
                            <div className="update-content">
                              <div className="update-type">{p.type || mCfg.scoreTerm}</div>
                              <div className="update-text">{p.text}</div>
                              {p.team && <div className="update-player">{p.team} — {p.homeScore} - {p.awayScore}</div>}
                            </div>
                          </div>
                        )) : (
                          <div className="no-updates">No play data available.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ========== STATS TAB ========== */}
                  {activeTab === 'stats' && (
                    <div className="match-detail-section">
                      <div className="stats-grid-pro">
                        {boxTeams.length >= 2 && boxTeams[0].statistics?.map((stat, idx) => {
                          const awayStat = boxTeams[1].statistics.find(s => s.name === stat.name);
                          if (!awayStat) return null;
                          const hVal = parseFloat(stat.displayValue) || 0;
                          const aVal = parseFloat(awayStat.displayValue) || 0;
                          const total = hVal + aVal;
                          const hPerc = total === 0 ? 50 : (hVal / total) * 100;
                          return (
                            <div key={idx} className="stat-row-pro animate-in" style={{ animationDelay: `${idx * 0.03}s` }}>
                              <div className="stat-labels">
                                <span>{stat.displayValue}</span>
                                <span className="stat-name">{stat.label}</span>
                                <span>{awayStat.displayValue}</span>
                              </div>
                              <div className="stat-bar-container">
                                <div className="stat-bar-fill" style={{ width: `${hPerc}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ========== LEADERS TAB ========== */}
                  {activeTab === 'leaders' && (
                    <div className="match-detail-section">
                      {gameLeaders.length > 0 ? (
                        <div className="leaders-full-grid">
                          {gameLeaders.map((cat, ci) => (
                            <div key={ci} className="leader-category-card animate-in" style={{ animationDelay: `${ci * 0.08}s` }}>
                              <div className="lc-header">{cat.displayName}</div>
                              {cat.leaders.map((l, li) => (
                                <div key={li} className="leader-row">
                                  <div className="lr-rank">{li + 1}</div>
                                  {l.headshot && <img loading="lazy" decoding="async" src={l.headshot} alt="" className="lr-headshot" onError={(e) => { e.target.src = FALLBACK_PLAYER_IMAGE; }} />}
                                  <div className="lr-info">
                                    <div className="lr-name">{l.displayName}</div>
                                    {l.team && <div className="lr-team">{l.team}</div>}
                                  </div>
                                  <div className="lr-value">{l.value}</div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="leaders-empty-state" style={{ padding: 24, textAlign: 'center' }}>
                          <span className="material-icons-round" style={{ fontSize: 48, color: 'var(--text-secondary)', marginBottom: 12 }}>emoji_events</span>
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>{selectedSport === 'cricket' ? (selectedMatchStatus.details?.keyEventsNote || 'Top performer stats (runs, wickets) are not available for this match.') : 'No leader data available.'}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========== LINEUPS TAB ========== */}
                  {activeTab === 'lineups' && (
                    <div className="match-detail-section">
                      {lineups.map((roster, ri) => (
                        <div key={ri} className="lineup-section-card animate-in" style={{ animationDelay: `${ri * 0.1}s` }}>
                          <div className="ls-header">
                            <img loading="lazy" decoding="async" src={roster.logo} alt="" style={{ width: 24, height: 24 }} onError={(e) => { e.target.style.display = 'none'; }} />
                            <span>{roster.team}</span>
                          </div>
                          <div className="lineup-grid">
                            {roster.players.map((p, pi) => (
                              <div key={pi} className="lineup-player">
                                {p.jersey && <span className="lp-jersey">#{p.jersey}</span>}
                                <span className="lp-pos">{p.position}</span>
                                <span>{p.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {isFetchingMatchDetails && (
          <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="loader"></div>
          </div>
        )}
      </div>

      {showSurveyModal && user && (
        <SurveyInterests
          key={Object.keys(userData?.surveyInterests?.sports || {}).sort().join(',') || 'survey'}
          user={user}
          sportsList={enabledSportKeys.map((key) => ({ key, label: SPORTS_CONFIG[key]?.label || key }))}
          getSportData={getSportData}
          initialSurveyInterests={userData?.surveyInterests}
          initialFavoriteTeams={favorites}
          initialFavoritePlayers={favoritePlayers}
          isModal
          onClose={() => setShowSurveyModal(false)}
          onComplete={(payload) => {
            if (payload) {
              lastSurveyWriteAtRef.current = Date.now();
              if (Array.isArray(payload.favoriteClubs)) setFavorites(payload.favoriteClubs);
              if (Array.isArray(payload.favoritePlayers)) setFavoritePlayers(payload.favoritePlayers);
            }
            setUserDataState((prev) => (prev ? { ...prev, ...(payload || {}), surveyCompleted: true, surveySkipped: false } : { ...(payload || {}), surveyCompleted: true, surveySkipped: false }));
            setShowSurveyModal(false);
          }}
        />
      )}
    </>
  );
}


export default App;
