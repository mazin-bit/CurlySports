// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { listUsersForAdmin, listUsersForAdminFromCache, setUserData, subscribeAppConfig, setAppConfig } from '../services/database';
import { auth } from '../services/auth';
import '../styles/AdminDashboard.css';

const ACTIVE_THRESHOLD_MS = 10 * 60 * 1000; // 10 min

function formatLastActive(lastLoginDate, lastSeen) {
  const iso = lastSeen || lastLoginDate;
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now - 864e5).toISOString().slice(0, 10);
  const dateStr = d.toISOString().slice(0, 10);
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const days = Math.floor((now - d) / 864e5);
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
}

function getStatus(lastSeen, lastLoginDate) {
  if (lastSeen) {
    const ago = Date.now() - new Date(lastSeen).getTime();
    if (ago < ACTIVE_THRESHOLD_MS) return { label: 'Active', color: '#4ade80' };
  }
  if (lastLoginDate) {
    const today = new Date().toISOString().slice(0, 10);
    if (lastLoginDate === today) return { label: 'Active today', color: '#94a3b8' };
  }
  return { label: 'Offline', color: '#64748b' };
}

/** Current streak is only valid if user was active today or yesterday; otherwise they broke the streak. */
function getDisplayCurrentStreak(user) {
  const iso = user.lastSeen || user.lastLoginDate;
  if (!iso) return 0;
  const dateStr = new Date(iso).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (dateStr === today || dateStr === yesterday) return typeof user.currentStreak === 'number' ? user.currentStreak : 0;
  return 0;
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', permission: null },
  { id: 'features', label: 'Feature Flags', icon: 'tune', permission: 'admin_manage_features' },
  { id: 'users', label: 'User Management', icon: 'group', permission: 'admin_manage_users' },
  { id: 'leaderboard', label: 'Streak Leaderboard', icon: 'local_fire_department', permission: 'admin_view_leaderboard' },
  { id: 'engagement', label: 'Engagement Analytics', icon: 'trending_up', permission: 'admin_engagement' },
  { id: 'settings', label: 'Settings', icon: 'settings', permission: null },
];

const DEFAULT_FLAGS = [
  { key: 'live_scores', label: 'Live scores', description: 'Show live scores to members' },
  { key: 'streaks', label: 'Streaks', description: 'Enable streak tracking' },
  { key: 'favorites', label: 'Favorites', description: 'Allow favorites (teams/players)' },
  { key: 'leaderboard', label: 'Leaderboard', description: 'Show streak leaderboard' },
  { key: 'news', label: 'News', description: 'Show news & updates' },
];

const SPORTS_FOR_FLAGS = [
  { key: 'soccer', label: 'Soccer' },
  { key: 'basketball', label: 'Basketball' },
  { key: 'football', label: 'American Football' },
  { key: 'baseball', label: 'Baseball' },
  { key: 'hockey', label: 'Hockey' },
  { key: 'cricket', label: 'Cricket' },
  { key: 'f1', label: 'Formula 1' },
];

export function AdminDashboard({ user, onLogout, colorScheme = 'dark', setColorScheme = () => { }, themeMode = 'default', setThemeMode = () => { } }) {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [featureFlags, setFeatureFlags] = useState([]);
  const [maintenance, setMaintenance] = useState(false);
  const [flagsSaveError, setFlagsSaveError] = useState(null);
  const [flagsSaveSuccess, setFlagsSaveSuccess] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState(null);
  const [maintenanceSuccess, setMaintenanceSuccess] = useState(false);
  const [permissionsList, setPermissionsList] = useState([]);
  const [enabledSports, setEnabledSports] = useState({});
  const [sportsSaveError, setSportsSaveError] = useState(null);
  const [sportsSaveSuccess, setSportsSaveSuccess] = useState(false);

  const pendingFlags = useRef(false);
  const pendingMaintenance = useRef(false);
  const pendingSports = useRef(false);

  useEffect(() => {
    const unsub = subscribeAppConfig((config) => {
      setPermissionsList(Array.isArray(config.permissions) ? config.permissions : []);
      if (!pendingFlags.current) {
        setFeatureFlags(
          Array.isArray(config.featureFlags) && config.featureFlags.length
            ? config.featureFlags
            : DEFAULT_FLAGS.map((f) => ({ ...f, enabled: true }))
        );
      }
      if (!pendingMaintenance.current) {
        setMaintenance(config.maintenance === true);
      }
      if (!pendingSports.current) {
        setEnabledSports(config.enabledSports && typeof config.enabledSports === 'object' ? config.enabledSports : {});
      }
    });
    return () => unsub();
  }, []);
  const permissions = useMemo(() => {
    const map = {};
    (permissionsList || []).forEach((p) => { map[p.key] = p.enabled !== false; });
    return map;
  }, [permissionsList]);

  const visibleTabs = useMemo(() => {
    return TABS.filter((t) => {
      if (!t.permission) return true;
      return permissions[t.permission] !== false;
    });
  }, [permissions]);

  useEffect(() => {
    const allowed = visibleTabs.some((t) => t.id === tab);
    if (!allowed && visibleTabs.length) setTab(visibleTabs[0].id);
  }, [visibleTabs, tab]);

  const loadUsers = useCallback(() => {
    setUsersError(null);
    setUsersLoading(true);
    // Show cached list immediately so UI feels instant
    listUsersForAdminFromCache().then((cached) => {
      if (cached.length > 0) setUsersList(cached);
    });
    // Timeout so we never load forever (e.g. Firestore rules or network hang)
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out. Using cached data if available. Check your connection and Firestore read rules for the users collection.')), 10000)
    );
    Promise.race([listUsersForAdmin(), timeout])
      .then((list) => {
        setUsersList(Array.isArray(list) ? list : []);
        setUsersError(null);
      })
      .catch((e) => {
        const msg = e?.message || 'Failed to load users';
        const isPermission = /permission|insufficient/i.test(msg);
        setUsersError(isPermission
          ? 'You don\'t have permission to view users. Your Firestore role may be "member" — ask a Super Admin to set your role to admin or add you to the allowlist.'
          : msg);
      })
      .finally(() => setUsersLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'dashboard' || tab === 'users' || tab === 'leaderboard' || tab === 'engagement') {
      if (permissions.admin_manage_users !== false) loadUsers();
      else setUsersList([]);
    }
  }, [tab, loadUsers, permissions.admin_manage_users]);

  const filteredUsers = useMemo(() => {
    const q = (userSearch || '').toLowerCase().trim();
    if (!q) return usersList;
    return usersList.filter(
      (u) =>
        (u.email || '').toLowerCase().includes(q) ||
        (u.displayName || '').toLowerCase().includes(q)
    );
  }, [usersList, userSearch]);

  const topByCurrentStreak = useMemo(() => {
    return [...filteredUsers]
      .map((u) => ({ ...u, _displayCurrent: getDisplayCurrentStreak(u) }))
      .filter((u) => u._displayCurrent > 0)
      .sort((a, b) => (b._displayCurrent || 0) - (a._displayCurrent || 0))
      .slice(0, 20);
  }, [filteredUsers]);

  const topByLongestStreak = useMemo(() => {
    return [...filteredUsers]
      .filter((u) => typeof u.longestStreak === 'number' && u.longestStreak > 0)
      .sort((a, b) => (b.longestStreak || 0) - (a.longestStreak || 0))
      .slice(0, 20);
  }, [filteredUsers]);

  const engagementMetrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const dau = usersList.filter((u) => u.lastLoginDate === today).length;
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString(undefined, { weekday: 'short' });
      last7.push({ date: dateStr, label, count: usersList.filter((u) => u.lastLoginDate === dateStr).length });
    }
    const streaks = usersList.map((u) => typeof u.currentStreak === 'number' ? u.currentStreak : 0);
    const dist0 = streaks.filter((s) => s === 0).length;
    const dist1to7 = streaks.filter((s) => s >= 1 && s <= 7).length;
    const dist8plus = streaks.filter((s) => s > 7).length;
    return { dau, last7, streakDistribution: { zero: dist0, oneToSeven: dist1to7, eightPlus: dist8plus } };
  }, [usersList]);

  const handleExportCsv = useCallback(() => {
    const headers = ['Email', 'Display Name', 'Role', 'Current Streak', 'Longest Streak', 'Last Login Date', 'Last Seen'];
    const rows = usersList.map((u) => [
      u.email || '',
      u.displayName || '',
      u.role || 'member',
      String(u.currentStreak ?? ''),
      String(u.longestStreak ?? ''),
      u.lastLoginDate || '',
      u.lastSeen || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [usersList]);

  const handleResetStreak = (uid, email) => {
    if (!window.confirm(`Reset streak for ${email || uid}?`)) return;
    setUserData(uid, { currentStreak: 0, longestStreak: 0 })
      .then(() => loadUsers())
      .catch((e) => setUsersError(e?.message || 'Failed to reset streak'));
  };

  const toggleFlag = (key) => {
    setFlagsSaveError(null);
    setFlagsSaveSuccess(false);
    const next = featureFlags.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f));
    setFeatureFlags(next);
    pendingFlags.current = true;
    setAppConfig({ featureFlags: next }, { currentUserEmail: auth.currentUser?.email || undefined })
      .then(() => {
        setFlagsSaveSuccess(true);
        setTimeout(() => setFlagsSaveSuccess(false), 2500);
      })
      .catch((e) => {
        setFlagsSaveError(e?.message || 'Failed to save feature flags.');
        setTimeout(() => setFlagsSaveError(null), 5000);
      })
      .finally(() => { pendingFlags.current = false; });
  };

  const toggleMaintenance = () => {
    if (permissions.admin_manage_maintenance === false) {
      setMaintenanceError('You do not have permission to manage maintenance mode.');
      setTimeout(() => setMaintenanceError(null), 3000);
      return;
    }
    setMaintenanceError(null);
    setMaintenanceSuccess(false);
    const next = !maintenance;
    setMaintenance(next);
    pendingMaintenance.current = true;
    setAppConfig({ maintenance: next }, { currentUserEmail: auth.currentUser?.email || undefined })
      .then(() => {
        setMaintenanceSuccess(true);
        setTimeout(() => setMaintenanceSuccess(false), 2500);
      })
      .catch((e) => {
        setMaintenanceError(e?.message || 'Failed to save maintenance mode.');
        setTimeout(() => setMaintenanceError(null), 5000);
      })
      .finally(() => { pendingMaintenance.current = false; });
  };

  const toggleSport = (key) => {
    if (permissions.admin_manage_sports === false) {
      setSportsSaveError('You do not have permission to manage sports.');
      setTimeout(() => setSportsSaveError(null), 3000);
      return;
    }
    setSportsSaveError(null);
    setSportsSaveSuccess(false);
    const prev = enabledSports || {};
    const newValue = prev[key] === false;
    // Build full map for ALL sports so we never drop keys when saving
    const map = SPORTS_FOR_FLAGS.reduce(
      (acc, s) => ({ ...acc, [s.key]: s.key === key ? newValue : (prev[s.key] !== false) }),
      {}
    );
    map[key] = newValue;
    setEnabledSports(map);
    pendingSports.current = true;
    setAppConfig({ enabledSports: map }, { currentUserEmail: auth.currentUser?.email || undefined })
      .then(() => {
        setSportsSaveSuccess(true);
        setTimeout(() => setSportsSaveSuccess(false), 2500);
      })
      .catch((e) => {
        setSportsSaveError(e?.message || 'Failed to save sports.');
        setTimeout(() => setSportsSaveError(null), 5000);
      })
      .finally(() => { pendingSports.current = false; });
  };

  const handleTab = (id) => {
    setTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className={`admin-dashboard ${sidebarOpen ? 'ad-sidebar-open' : ''}`}>
      <header className="ad-mobile-header">
        <button type="button" className="ad-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <span className="material-icons-round">menu</span>
        </button>
        <span className="ad-title">Admin</span>
        <span style={{ width: 40 }} />
      </header>
      <div className="ad-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      <aside className={`ad-sidebar-wrap ${sidebarOpen ? 'open' : ''}`}>
        <div className="ad-sidebar-header">
          <span style={{ fontWeight: 600 }}>Admin</span>
          <span className="ad-badge">User engagement</span>
        </div>
        <nav className="ad-nav">
          {visibleTabs.map((t) => (
            <button key={t.id} type="button" className={`ad-nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => handleTab(t.id)}>
              <span className="material-icons-round">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        {typeof setColorScheme === 'function' && typeof setThemeMode === 'function' && (
          <div className="ad-theme-wrap">
            <div className="ad-theme-label">Theme</div>
            <div className="ad-theme-row">
              <button type="button" className={`ad-theme-btn ${colorScheme === 'light' ? 'active' : ''}`} onClick={() => setColorScheme('light')} title="Light">
                <span className="material-icons-round">light_mode</span>
              </button>
              <button type="button" className={`ad-theme-btn ${colorScheme === 'dark' ? 'active' : ''}`} onClick={() => setColorScheme('dark')} title="Dark">
                <span className="material-icons-round">dark_mode</span>
              </button>
            </div>
            <div className="ad-theme-modes">
              <button type="button" className={`ad-theme-mode ${themeMode === 'default' ? 'active' : ''}`} onClick={() => setThemeMode('default')}>Default</button>
              <button type="button" className={`ad-theme-mode ${themeMode === 'sunshine' ? 'active' : ''}`} onClick={() => setThemeMode('sunshine')}>Sunshine</button>
              <button type="button" className={`ad-theme-mode ${themeMode === 'sea' ? 'active' : ''}`} onClick={() => setThemeMode('sea')}>Sea</button>
              <button type="button" className={`ad-theme-mode ${themeMode === 'fire' ? 'active' : ''}`} onClick={() => setThemeMode('fire')}>Fire</button>
              <button type="button" className={`ad-theme-mode ${themeMode === 'forest' ? 'active' : ''}`} onClick={() => setThemeMode('forest')}>Forest</button>
              <button type="button" className={`ad-theme-mode ${themeMode === 'ice' ? 'active' : ''}`} onClick={() => setThemeMode('ice')}>Ice</button>
              <button type="button" className={`ad-theme-mode ${themeMode === 'flower' ? 'active' : ''}`} onClick={() => setThemeMode('flower')}>Flower</button>
              <button type="button" className={`ad-theme-mode ${themeMode === 'star' ? 'active' : ''}`} onClick={() => setThemeMode('star')}>Star</button>
            </div>
          </div>
        )}
        <div className="ad-sidebar-footer">
          <button type="button" className="ad-logout-btn" onClick={onLogout}>
            <span className="material-icons-round">logout</span>
            Log out
          </button>
        </div>
      </aside>
      <main className="ad-main">
        {tab === 'dashboard' && (
          <div>
            <h1 className="ad-main-heading">Dashboard / Overview</h1>
            <p className="ad-main-sub">Quick stats, engagement trends, recent user activity.</p>
            <div style={{ marginBottom: 16 }}>
              <button type="button" onClick={loadUsers} disabled={usersLoading} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: usersLoading ? 'not-allowed' : 'pointer' }}>{usersLoading ? 'Loading…' : 'Refresh stats'}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              <div className="ad-card">
                <p className="ad-card-label">Total users</p>
                <p className="ad-card-value">{usersLoading && usersList.length === 0 ? '—' : usersList.length}</p>
              </div>
              <div className="ad-card">
                <p className="ad-card-label">Active streaks</p>
                <p className="ad-card-value">{usersLoading && usersList.length === 0 ? '—' : usersList.filter((u) => (u.currentStreak || 0) > 0).length}</p>
              </div>
              <div className="ad-card">
                <p className="ad-card-label">Active today</p>
                <p className="ad-card-value">{usersLoading && usersList.length === 0 ? '—' : usersList.filter((u) => u.lastLoginDate === new Date().toISOString().slice(0, 10)).length}</p>
              </div>
              <div className="ad-card">
                <p className="ad-card-label">Online now</p>
                <p className="ad-card-value">{usersLoading && usersList.length === 0 ? '—' : usersList.filter((u) => u.lastSeen && (Date.now() - new Date(u.lastSeen).getTime() < ACTIVE_THRESHOLD_MS)).length}</p>
              </div>
            </div>
          </div>
        )}
        {tab === 'features' && (
          <div>
            <h1 className="ad-main-heading">Feature Flags</h1>
            <p className="ad-main-sub">Enable or disable app features and maintenance mode. Changes apply app-wide.</p>
            {flagsSaveError && (
              <p style={{ color: '#f87171', fontSize: 14, marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)' }}>{flagsSaveError}</p>
            )}
            {flagsSaveSuccess && (
              <p style={{ color: '#4ade80', fontSize: 14, marginBottom: 16, padding: '10px 14px', background: 'rgba(34,197,94,0.15)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)' }}>Feature flags saved.</p>
            )}
            <div className="ad-card" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, marginBottom: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-icons-round" style={{ fontSize: 18 }}>build</span>
                Maintenance mode
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 12 }}>When ON, the app can show a global maintenance message.</p>
              {maintenanceError && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{maintenanceError}</p>}
              {maintenanceSuccess && <p style={{ color: '#4ade80', fontSize: 13, marginBottom: 12 }}>Maintenance mode saved.</p>}
              <button
                type="button"
                onClick={toggleMaintenance}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  ...(maintenance ? { background: '#f59e0b', color: '#0a0e1a' } : { background: 'rgba(148,163,184,0.2)', color: '#e2e8f0' }),
                }}
              >
                {maintenance ? 'Maintenance ON' : 'Maintenance OFF'}
              </button>
            </div>
            <div className="ad-card">
              <h2 style={{ fontSize: 16, marginBottom: 16, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-icons-round" style={{ fontSize: 18 }}>tune</span>
                Feature flags
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>Toggle each feature. Changes save to Firestore and apply app-wide in real time.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {featureFlags.map((f) => (
                  <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                    <div>
                      <strong style={{ display: 'block' }}>{f.label}</strong>
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{f.description}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFlag(f.key)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        ...(f.enabled ? { background: 'rgba(34,197,94,0.2)', color: '#4ade80' } : { background: 'rgba(148,163,184,0.2)', color: '#94a3b8' }),
                      }}
                    >
                      {f.enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="ad-card" style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: 16, marginBottom: 16, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-icons-round" style={{ fontSize: 18 }}>sports</span>
                Sports
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>Turn a sport OFF to hide it from the app. Users who had that sport selected will see &quot;Sorry, this sport is not currently available. Coming soon.&quot;</p>
              {sportsSaveError && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{sportsSaveError}</p>}
              {sportsSaveSuccess && <p style={{ color: '#4ade80', fontSize: 13, marginBottom: 12 }}>Sports saved.</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {SPORTS_FOR_FLAGS.map((s) => {
                  const isOn = enabledSports[s.key] !== false;
                  return (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                      <strong>{s.label}</strong>
                      <button
                        type="button"
                        onClick={() => toggleSport(s.key)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          ...(isOn ? { background: 'rgba(34,197,94,0.2)', color: '#4ade80' } : { background: 'rgba(148,163,184,0.2)', color: '#94a3b8' }),
                        }}
                      >
                        {isOn ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {tab === 'users' && (
          <div>
            <h1 className="ad-main-heading">User Management</h1>
            <p className="ad-main-sub" style={{ marginBottom: 16 }}>All users who have ever logged in (member, admin, or super admin). View roles, streaks, active/offline status, last activity. Search by name or email, reset streak when needed.</p>
            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(148,163,184,0.3)',
                  background: 'rgba(15,23,42,0.8)',
                  color: '#f1f5f9',
                  minWidth: 220,
                }}
              />
              <button type="button" onClick={loadUsers} disabled={usersLoading} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: usersLoading ? 'not-allowed' : 'pointer' }}>
                {usersLoading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
            {usersError && (
              <p style={{ color: '#f87171', marginBottom: 12, fontSize: 14 }}>
                {usersError}
                {usersError.includes('permissions') && (
                  <span style={{ display: 'block', marginTop: 6, color: '#94a3b8', fontSize: 12 }}>Deploy Firestore rules so admin/super_admin can read all users: firebase deploy --only firestore:rules</span>
                )}
              </p>
            )}
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(148,163,184,0.2)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead>
                  <tr style={{ background: 'rgba(30,41,59,0.8)', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Current streak</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Longest streak</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Last active</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                    {permissions.admin_reset_streak !== false && <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {usersLoading && usersList.length === 0 ? (
                    <tr><td colSpan={permissions.admin_reset_streak !== false ? 8 : 7} style={{ padding: 32, color: '#94a3b8', textAlign: 'center' }}>Loading users…</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={permissions.admin_reset_streak !== false ? 8 : 7} style={{ padding: 32, color: '#64748b', textAlign: 'center' }}>{userSearch ? 'No users match your search.' : 'No users have logged in yet.'}</td></tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const status = getStatus(u.lastSeen, u.lastLoginDate);
                      return (
                        <tr key={u.uid} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                          <td style={{ padding: 12 }}>{u.displayName || '—'}</td>
                          <td style={{ padding: 12, fontSize: 13 }}>{u.email || '—'}</td>
                          <td style={{ padding: 12 }}><span style={{ background: 'rgba(148,163,184,0.2)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{u.role || 'member'}</span></td>
                          <td style={{ padding: 12 }}>{typeof u.currentStreak === 'number' ? getDisplayCurrentStreak(u) : '—'}</td>
                          <td style={{ padding: 12 }}>{typeof u.longestStreak === 'number' ? u.longestStreak : '—'}</td>
                          <td style={{ padding: 12, fontSize: 13, color: '#94a3b8' }}>{formatLastActive(u.lastLoginDate, u.lastSeen)}</td>
                          <td style={{ padding: 12 }}><span style={{ color: status.color, fontSize: 13 }}>{status.label}</span></td>
                          {permissions.admin_reset_streak !== false && (
                            <td style={{ padding: 12 }}>
                              <button type="button" onClick={() => handleResetStreak(u.uid, u.email)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>Reset streak</button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === 'leaderboard' && (
          <div>
            <h1 className="ad-main-heading">Streak Leaderboard</h1>
            <p className="ad-main-sub" style={{ marginBottom: 24 }}>Only users with streaks are shown. Top 20 by current streak and by longest streak.</p>
            <div style={{ marginBottom: 16 }}>
              <button type="button" onClick={loadUsers} disabled={usersLoading} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: usersLoading ? 'not-allowed' : 'pointer' }}>{usersLoading ? 'Loading…' : 'Refresh'}</button>
            </div>
            {usersError && <p style={{ color: '#f87171', marginBottom: 12, fontSize: 14 }}>{usersError}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
              <div style={{ padding: 20, background: 'rgba(30,41,59,0.5)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.15)' }}>
                <h2 style={{ fontSize: 16, marginBottom: 16, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-icons-round" style={{ fontSize: 18 }}>local_fire_department</span>
                  Top by current streak
                </h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
                        <th style={{ textAlign: 'left', padding: 8, fontSize: 11, color: '#94a3b8' }}>#</th>
                        <th style={{ textAlign: 'left', padding: 8, fontSize: 11, color: '#94a3b8' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: 8, fontSize: 11, color: '#94a3b8' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: 8, fontSize: 11, color: '#94a3b8' }}>Streak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topByCurrentStreak.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: 16, color: '#64748b', textAlign: 'center' }}>No users with streaks yet.</td></tr>
                      ) : (
                        topByCurrentStreak.map((u, i) => (
                          <tr key={u.uid} style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                            <td style={{ padding: 10 }}>{i + 1}</td>
                            <td style={{ padding: 10 }}>{u.displayName || '—'}</td>
                            <td style={{ padding: 10, fontSize: 12, color: '#94a3b8' }}>{u.email || '—'}</td>
                            <td style={{ padding: 10, fontWeight: 600, color: '#f59e0b' }}>{u._displayCurrent} day{u._displayCurrent !== 1 ? 's' : ''}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{ padding: 20, background: 'rgba(30,41,59,0.5)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.15)' }}>
                <h2 style={{ fontSize: 16, marginBottom: 16, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-icons-round" style={{ fontSize: 18 }}>emoji_events</span>
                  Top by longest streak
                </h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
                        <th style={{ textAlign: 'left', padding: 8, fontSize: 11, color: '#94a3b8' }}>#</th>
                        <th style={{ textAlign: 'left', padding: 8, fontSize: 11, color: '#94a3b8' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: 8, fontSize: 11, color: '#94a3b8' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: 8, fontSize: 11, color: '#94a3b8' }}>Longest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topByLongestStreak.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: 16, color: '#64748b', textAlign: 'center' }}>No users with streaks yet.</td></tr>
                      ) : (
                        topByLongestStreak.map((u, i) => (
                          <tr key={u.uid} style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                            <td style={{ padding: 10 }}>{i + 1}</td>
                            <td style={{ padding: 10 }}>{u.displayName || '—'}</td>
                            <td style={{ padding: 10, fontSize: 12, color: '#94a3b8' }}>{u.email || '—'}</td>
                            <td style={{ padding: 10, fontWeight: 600, color: '#f59e0b' }}>{u.longestStreak} day{u.longestStreak !== 1 ? 's' : ''}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        {tab === 'engagement' && (
          <div>
            <h1 className="ad-main-heading">Engagement Analytics</h1>
            <p className="ad-main-sub">DAU, login trends, and streak distribution from your user base.</p>
            <div style={{ marginBottom: 16 }}>
              <button type="button" onClick={loadUsers} disabled={usersLoading} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: usersLoading ? 'not-allowed' : 'pointer' }}>{usersLoading ? 'Loading…' : 'Refresh'}</button>
            </div>
            {usersError && <p style={{ color: '#f87171', marginBottom: 12, fontSize: 14 }}>{usersError}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div className="ad-card">
                <p className="ad-card-label">DAU (today)</p>
                <p className="ad-card-value">{usersLoading && usersList.length === 0 ? '—' : engagementMetrics.dau}</p>
              </div>
              <div className="ad-card">
                <p className="ad-card-label">Total users</p>
                <p className="ad-card-value">{usersLoading && usersList.length === 0 ? '—' : usersList.length}</p>
              </div>
            </div>
            <div className="ad-card" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-icons-round" style={{ fontSize: 18 }}>calendar_today</span>
                Logins in last 7 days
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                {engagementMetrics.last7.map(({ label, count }) => (
                  <div key={label} style={{ textAlign: 'center', minWidth: 56 }}>
                    <div style={{ height: Math.max(4, count * 8), minHeight: 4, background: 'rgba(59, 130, 246, 0.4)', borderRadius: 4, marginBottom: 6 }} />
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{count}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ad-card">
              <h2 style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-icons-round" style={{ fontSize: 18 }}>local_fire_department</span>
                Streak distribution
              </h2>
              <div className="ad-engagement-streak-grid">
                <div style={{ padding: 12, background: 'rgba(15,23,42,0.5)', borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>0 days</p>
                  <p style={{ fontWeight: 600 }}>{engagementMetrics.streakDistribution.zero}</p>
                </div>
                <div style={{ padding: 12, background: 'rgba(15,23,42,0.5)', borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>1–7 days</p>
                  <p style={{ fontWeight: 600 }}>{engagementMetrics.streakDistribution.oneToSeven}</p>
                </div>
                <div style={{ padding: 12, background: 'rgba(15,23,42,0.5)', borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>8+ days</p>
                  <p style={{ fontWeight: 600 }}>{engagementMetrics.streakDistribution.eightPlus}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {tab === 'settings' && (
          <div>
            <h1 className="ad-main-heading">Settings</h1>
            <p className="ad-main-sub">Your permissions and export. Super Admin can change system-wide flags and create other admins.</p>
            <div className="ad-card" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-icons-round" style={{ fontSize: 18 }}>lock</span>
                Your permissions
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(permissionsList || []).length === 0 ? (
                  <li style={{ color: '#64748b', fontSize: 14 }}>No permission list from server. You have default access.</li>
                ) : (
                  permissionsList.map((p) => (
                    <li key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.1)', fontSize: 14 }}>
                      <span className="material-icons-round" style={{ fontSize: 18, color: p.enabled !== false ? '#4ade80' : '#64748b' }}>{p.enabled !== false ? 'check_circle' : 'cancel'}</span>
                      <code style={{ background: 'rgba(148,163,184,0.15)', padding: '2px 6px', borderRadius: 4 }}>{p.key}</code>
                      <span style={{ color: '#94a3b8' }}>{p.enabled !== false ? 'Enabled' : 'Disabled'}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="ad-card" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-icons-round" style={{ fontSize: 18 }}>download</span>
                Export user list
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 12 }}>Download all users (email, name, role, streaks, last login) as CSV.</p>
              {permissions.admin_export_users !== false ? (
                <button type="button" onClick={handleExportCsv} disabled={usersList.length === 0} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: usersList.length === 0 ? '#475569' : '#3b82f6', color: '#fff', cursor: usersList.length === 0 ? 'not-allowed' : 'pointer' }}>
                  Export CSV
                </button>
              ) : (
                <p style={{ color: '#f87171', fontSize: 13 }}>You do not have permission to export user data.</p>
              )}
            </div>
            <p style={{ color: '#64748b', fontSize: 13 }}>You cannot create Super Admin or manage other admins from here. Use the Feature Flags tab to toggle app features and maintenance.</p>
          </div>
        )}
      </main>
    </div>
  );
}
