import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { listUsersForAdmin, listUsersForAdminFromCache, setUserData, setUserRole, setStreakForAdmin, setUserStatusForAdmin, subscribeAppConfig, setAppConfig, pushAuditLog, auth, buildSuperAdminEmailsMap } from './firebase';
import './SuperAdminDashboard.css';

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

/** Current streak only counts if user was active today or yesterday; otherwise streak is broken (show 0). */
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
  { id: 'dashboard', label: 'Dashboard / System Overview', icon: 'dashboard' },
  { id: 'features', label: 'Feature Flags / Maintenance', icon: 'tune' },
  { id: 'admins', label: 'Admin Management', icon: 'admin_panel_settings' },
  { id: 'users', label: 'User Management', icon: 'group' },
  { id: 'leaderboard', label: 'Streak Leaderboard', icon: 'local_fire_department' },
  { id: 'roles', label: 'Role & Permissions', icon: 'lock' },
  { id: 'audit', label: 'Audit Logs / System Logs', icon: 'list_alt' },
  { id: 'health', label: 'Server & Database Health', icon: 'dns' },
];

const DEFAULT_FLAGS = [
  { key: 'live_scores', label: 'Live scores', description: 'Show live scores to members' },
  { key: 'streaks', label: 'Streaks', description: 'Enable streak tracking' },
  { key: 'favorites', label: 'Favorites', description: 'Allow favorites (teams/players)' },
  { key: 'leaderboard', label: 'Leaderboard', description: 'Show streak leaderboard' },
  { key: 'news', label: 'News', description: 'Show news & updates' },
];

const DEFAULT_PERMISSIONS = [
  { key: 'admin_manage_users', label: 'Manage users (view, ban, suspend)' },
  { key: 'admin_view_leaderboard', label: 'View streak leaderboard' },
  { key: 'admin_engagement', label: 'View engagement analytics' },
  { key: 'admin_reset_streak', label: 'Reset user streak' },
  { key: 'admin_manage_features', label: 'Manage feature flags' },
  { key: 'admin_manage_maintenance', label: 'Manage maintenance mode' },
  { key: 'admin_manage_sports', label: 'Manage sports availability' },
  { key: 'admin_export_users', label: 'Export user list to CSV' },
];

/** Sport keys and labels for feature-flag toggles. For a new sport to appear in the app sidebar, add it here and turn it ON. For leagues/live scores/news, also add it to App.js SPORTS_CONFIG. */
const SPORTS_FOR_FLAGS = [
  { key: 'soccer', label: 'Soccer' },
  { key: 'basketball', label: 'Basketball' },
  { key: 'football', label: 'American Football' },
  { key: 'baseball', label: 'Baseball' },
  { key: 'hockey', label: 'Hockey' },
  { key: 'cricket', label: 'Cricket' },
  { key: 'f1', label: 'Formula 1' },
];

/** Message shown when Firestore denies listing users (Super Admin allowlist / role). */
export const USERS_PERMISSION_ERROR_MESSAGE =
  'Missing or insufficient permissions. Ensure your email is in the Super Admin allowlist in firestore.rules, or run "Sync my access & retry" below.';

function isUsersPermissionError(msg) {
  return msg && /permission|insufficient/i.test(String(msg));
}

export function SuperAdminDashboard({ user, onLogout, colorScheme = 'dark', setColorScheme = () => { }, themeMode = 'default', setThemeMode = () => { } }) {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [admins, setAdmins] = useState([]);
  const [featureFlags, setFeatureFlags] = useState(() => DEFAULT_FLAGS.map((f) => ({ ...f, enabled: true })));
  const [permissions, setPermissions] = useState(() => DEFAULT_PERMISSIONS.map((p) => ({ ...p, enabled: true })));
  const [auditLog, setAuditLog] = useState([]);
  const [maintenance, setMaintenance] = useState(false);
  const [health, setHealth] = useState({ server: 'OK', db: 'Connected', api: 'OK', uptime: '99.9%' });

  const [adminForm, setAdminForm] = useState({ email: '', role: 'admin' });
  const [adminSaveError, setAdminSaveError] = useState(null);
  const [adminSaveSuccess, setAdminSaveSuccess] = useState(false);
  const [auditFilterUser, setAuditFilterUser] = useState('');
  const [auditFilterFrom, setAuditFilterFrom] = useState('');
  const [auditFilterTo, setAuditFilterTo] = useState('');

  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [usersActionSuccess, setUsersActionSuccess] = useState(null);

  const [flagsSaveError, setFlagsSaveError] = useState(null);
  const [flagsSaveSuccess, setFlagsSaveSuccess] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState(null);
  const [maintenanceSuccess, setMaintenanceSuccess] = useState(false);

  const [enabledSports, setEnabledSports] = useState({});
  const [sportsSaveError, setSportsSaveError] = useState(null);
  const [sportsSaveSuccess, setSportsSaveSuccess] = useState(false);

  const [permsSaveError, setPermsSaveError] = useState(null);
  const [permsSaveSuccess, setPermsSaveSuccess] = useState(false);
  const [healthSaveError, setHealthSaveError] = useState(null);
  const [healthSaveSuccess, setHealthSaveSuccess] = useState(false);

  // Prevent config listener from overwriting state while a write is in flight
  const pendingMaintenance = useRef(false);
  const pendingFlags = useRef(false);
  const pendingPerms = useRef(false);
  const pendingAdmins = useRef(false);
  const pendingHealth = useRef(false);
  const pendingSports = useRef(false);
  const permissionErrorAutoSyncDone = useRef(false);
  /** After a successful sports save, ignore listener updates for this long so stale snapshot doesn't overwrite UI */
  const sportsWrittenAtRef = useRef(0);
  const flagsWrittenAtRef = useRef(0);
  const maintenanceWrittenAtRef = useRef(0);

  // Keep a ref of current config so the 1s save interval always writes latest state
  const configSnapshotRef = useRef({
    featureFlags: [],
    permissions: [],
    maintenance: false,
    enabledSports: {},
    health: { server: 'OK', db: 'Connected', api: 'OK', uptime: '99.9%' },
  });
  const hasReceivedConfigRef = useRef(false);
  useEffect(() => {
    configSnapshotRef.current = {
      featureFlags,
      permissions,
      maintenance,
      enabledSports,
      health,
    };
  }, [featureFlags, permissions, maintenance, enabledSports, health]);

  // Persist config to Firestore every second so data is always saved (retries if a write failed)
  useEffect(() => {
    if (!auth.currentUser?.email) return;
    const interval = setInterval(() => {
      if (!hasReceivedConfigRef.current) return;
      const { featureFlags: f, permissions: p, maintenance: m, enabledSports: s, health: h } = configSnapshotRef.current;
      const payload = {};
      if (Array.isArray(f) && f.length > 0) payload.featureFlags = f;
      if (Array.isArray(p) && p.length > 0) payload.permissions = p;
      payload.maintenance = !!m;
      if (typeof s === 'object' && s !== null && Object.keys(s).length > 0) payload.enabledSports = s;
      if (h && typeof h === 'object' && Object.keys(h).length > 0) payload.health = h;
      if (Object.keys(payload).length === 0) return;
      setAppConfig(payload, { currentUserEmail: auth.currentUser?.email })
        .catch((e) => console.warn('[SuperAdmin] 1s save:', e?.message));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const engagementMetrics = useMemo(() => {
    if (!usersList.length) return { dau: 0, last7: [], streakDistribution: { zero: 0, oneToSeven: 0, eightPlus: 0 } };
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
  // Ensure Super Admin's Firestore doc and config grant access so User Management / Streak Leaderboard load without permission errors
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    const email = user?.email || auth.currentUser?.email;
    if (!uid && !email) return;
    if (uid) Promise.resolve(setUserData(uid, { role: 'super_admin' })).catch(() => { });
    if (email) Promise.resolve(setAppConfig({}, { currentUserEmail: email })).catch(() => { });
  }, [user?.email]);

  useEffect(() => {
    const unsub = subscribeAppConfig((config) => {
      hasReceivedConfigRef.current = true;
      if (!pendingAdmins.current) {
        setAdmins(Array.isArray(config.saAdmins) ? config.saAdmins : []);
      }
      if (!pendingFlags.current) {
        const skipFlags = flagsWrittenAtRef.current && Date.now() - flagsWrittenAtRef.current < 4000;
        if (!skipFlags) setFeatureFlags(Array.isArray(config.featureFlags) && config.featureFlags.length ? config.featureFlags : DEFAULT_FLAGS.map((f) => ({ ...f, enabled: true })));
      }
      if (!pendingPerms.current) {
        setPermissions(Array.isArray(config.permissions) && config.permissions.length ? config.permissions : DEFAULT_PERMISSIONS.map((p) => ({ ...p, enabled: true })));
      }
      setAuditLog(Array.isArray(config.auditLog) ? config.auditLog : []);
      if (!pendingMaintenance.current) {
        const skipMaint = maintenanceWrittenAtRef.current && Date.now() - maintenanceWrittenAtRef.current < 4000;
        if (!skipMaint) {
          const maint = config.maintenance === true;
          setMaintenance(maint);
          try {
            localStorage.setItem('sa_maintenance', maint ? 'true' : 'false');
          } catch (_) { }
        }
      }
      if (!pendingHealth.current) {
        setHealth(config.health && typeof config.health === 'object' ? config.health : { server: 'OK', db: 'Connected', api: 'OK', uptime: '99.9%' });
      }
      if (!pendingSports.current) {
        const skipSports = sportsWrittenAtRef.current && Date.now() - sportsWrittenAtRef.current < 4000;
        if (!skipSports) setEnabledSports(config.enabledSports && typeof config.enabledSports === 'object' ? config.enabledSports : {});
      }
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  const pushAudit = useCallback((action, resource, details = {}) => {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      actorEmail: user?.email || 'unknown',
      action,
      resource,
      details: JSON.stringify(details),
    };
    setAuditLog((prev) => [entry, ...prev].slice(0, 500));
    pushAuditLog(entry).catch((e) => console.error('pushAuditLog:', e));
  }, [user?.email]);

  const saveAdmins = useCallback((next) => {
    setAdmins(next);
    return setAppConfig({ saAdmins: next }, { currentUserEmail: auth.currentUser?.email || undefined });
  }, []);

  const saveFlags = useCallback((next) => {
    setFeatureFlags(next);
    pendingFlags.current = true;
    setAppConfig({ featureFlags: next }, { currentUserEmail: auth.currentUser?.email || undefined })
      .then(() => { flagsWrittenAtRef.current = Date.now(); })
      .catch((e) => console.error('setAppConfig:', e))
      .finally(() => { pendingFlags.current = false; });
  }, []);

  const savePerms = useCallback((next) => {
    setPermissions(next);
    setPermsSaveError(null);
    setPermsSaveSuccess(false);
    pendingPerms.current = true;
    setAppConfig({ permissions: next }, { currentUserEmail: auth.currentUser?.email || undefined })
      .then(() => {
        setPermsSaveSuccess(true);
        setTimeout(() => setPermsSaveSuccess(false), 2500);
      })
      .catch((e) => {
        setPermsSaveError(e?.message || 'Failed to save permissions. Check Firestore rules.');
        setTimeout(() => setPermsSaveError(null), 5000);
      })
      .finally(() => { pendingPerms.current = false; });
  }, []);

  const addAdmin = async () => {
    const email = (adminForm.email || '').trim().toLowerCase();
    const role = adminForm.role;
    setAdminSaveError(null);
    setAdminSaveSuccess(false);
    if (!email) {
      setAdminSaveError('Please enter an email address.');
      return;
    }
    if (admins.some((a) => (a.email || '').toLowerCase() === email)) {
      setAdminSaveError('That email is already in the list.');
      return;
    }
    const newAdmin = { id: Date.now().toString(), email, role, addedAt: new Date().toISOString() };
    const next = [...admins, newAdmin];
    setAdmins(next);
    setAdminForm({ email: '', role: 'admin' });
    pendingAdmins.current = true;
    try {
      await setAppConfig({ saAdmins: next }, { currentUserEmail: auth.currentUser?.email || undefined });
      setAdminSaveSuccess(true);
      pushAudit('ADMIN_ADD', 'admins', { email, role });
      setTimeout(() => setAdminSaveSuccess(false), 3000);
    } catch (e) {
      setAdminSaveError(e?.message || 'Failed to save. Check Firestore rules: config/app must be writable by super_admin.');
    } finally {
      pendingAdmins.current = false;
    }
  };

  const removeAdmin = (id, email) => {
    if (!window.confirm(`Remove admin ${email}?`)) return;
    const next = admins.filter((a) => a.id !== id);
    setAdmins(next);
    setAdminSaveError(null);
    setAdminSaveSuccess(false);
    pendingAdmins.current = true;
    setAppConfig({ saAdmins: next }, { currentUserEmail: auth.currentUser?.email || undefined })
      .then(() => {
        setAdminSaveSuccess(true);
        setTimeout(() => setAdminSaveSuccess(false), 3000);
      })
      .catch((e) => {
        setAdminSaveError(e?.message || 'Failed to remove. Check Firestore rules.');
        setTimeout(() => setAdminSaveError(null), 5000);
      })
      .finally(() => { pendingAdmins.current = false; });
    pushAudit('ADMIN_REMOVE', 'admins', { email });
  };

  const setAdminRole = (id, email, role) => {
    const next = admins.map((a) => (a.id === id ? { ...a, role } : a));
    setAdmins(next);
    setAdminSaveError(null);
    setAdminSaveSuccess(false);
    pendingAdmins.current = true;
    setAppConfig({ saAdmins: next }, { currentUserEmail: auth.currentUser?.email || undefined })
      .then(() => {
        setAdminSaveSuccess(true);
        setTimeout(() => setAdminSaveSuccess(false), 3000);
      })
      .catch((e) => {
        setAdminSaveError(e?.message || 'Failed to update role. Check Firestore rules.');
        setTimeout(() => setAdminSaveError(null), 5000);
      })
      .finally(() => { pendingAdmins.current = false; });
    pushAudit('ADMIN_ROLE_CHANGE', 'admins', { email, role });
  };

  const toggleFlag = (key) => {
    setFlagsSaveError(null);
    setFlagsSaveSuccess(false);
    const next = featureFlags.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f));
    setFeatureFlags(next);
    const flag = next.find((f) => f.key === key);
    pendingFlags.current = true;
    setAppConfig({ featureFlags: next }, { currentUserEmail: auth.currentUser?.email || undefined })
      .then(() => {
        setFlagsSaveSuccess(true);
        setTimeout(() => setFlagsSaveSuccess(false), 2500);
        pushAudit('FEATURE_FLAG_CHANGE', 'features', { key, enabled: flag?.enabled });
      })
      .catch((e) => {
        setFlagsSaveError(e?.message || 'Failed to save. Check Firestore rules: config/app writable by super_admin.');
        setTimeout(() => setFlagsSaveError(null), 5000);
      })
      .finally(() => { pendingFlags.current = false; });
  };

  const togglePermission = (key) => {
    const next = permissions.map((p) => (p.key === key ? { ...p, enabled: !p.enabled } : p));
    savePerms(next);
    const perm = next.find((p) => p.key === key);
    pushAudit('PERMISSION_CHANGE', 'roles', { key, enabled: perm?.enabled });
  };

  const toggleMaintenance = () => {
    setMaintenanceError(null);
    setMaintenanceSuccess(false);
    const next = !maintenance;
    setMaintenance(next);
    try {
      localStorage.setItem('sa_maintenance', next ? 'true' : 'false');
    } catch (_) { }
    pendingMaintenance.current = true;
    setAppConfig({ maintenance: next }, { currentUserEmail: auth.currentUser?.email || undefined })
      .then(() => {
        maintenanceWrittenAtRef.current = Date.now();
        setMaintenanceSuccess(true);
        setTimeout(() => setMaintenanceSuccess(false), 2500);
        pushAudit('MAINTENANCE_TOGGLE', 'system', { enabled: next });
      })
      .catch((e) => {
        setMaintenanceError(e?.message || 'Failed to save maintenance mode.');
        setTimeout(() => setMaintenanceError(null), 5000);
      })
      .finally(() => { pendingMaintenance.current = false; });
  };

  const toggleSport = (key) => {
    setSportsSaveError(null);
    setSportsSaveSuccess(false);

    setEnabledSports((prev) => {
      const isCurrentlyOn = prev[key] !== false;
      const newValue = !isCurrentlyOn;
      // Build full map for ALL sports so we never drop keys when saving (prev may only have a subset)
      const nextMap = SPORTS_FOR_FLAGS.reduce(
        (acc, s) => ({ ...acc, [s.key]: s.key === key ? newValue : (acc[s.key] ?? prev[s.key] !== false) }),
        {}
      );
      // Ensure the toggled key is set (in case it wasn't in SPORTS_FOR_FLAGS)
      nextMap[key] = newValue;

      pendingSports.current = true;
      setAppConfig({ enabledSports: nextMap }, { currentUserEmail: auth.currentUser?.email || undefined })
        .then(() => {
          sportsWrittenAtRef.current = Date.now();
          setSportsSaveSuccess(true);
          setTimeout(() => setSportsSaveSuccess(false), 2500);
        })
        .catch((e) => {
          setEnabledSports((revertPrev) => ({ ...revertPrev, [key]: isCurrentlyOn }));
          const msg = e?.message || 'Failed to save. Check Firestore connection.';
          setSportsSaveError(msg);
          console.error('[SuperAdmin] Sports save failed:', e);
          setTimeout(() => setSportsSaveError(null), 8000);
        })
        .finally(() => { pendingSports.current = false; });

      return nextMap;
    });
  };

  const updateHealth = (field, value) => {
    setHealthSaveError(null);
    setHealthSaveSuccess(false);
    const next = { ...health, [field]: value };
    setHealth(next);
    pendingHealth.current = true;
    setAppConfig({ health: next }, { currentUserEmail: auth.currentUser?.email || undefined })
      .then(() => {
        setHealthSaveSuccess(true);
        setTimeout(() => setHealthSaveSuccess(false), 2500);
      })
      .catch((e) => {
        setHealthSaveError(e?.message || 'Failed to save health status.');
        setTimeout(() => setHealthSaveError(null), 5000);
      })
      .finally(() => { pendingHealth.current = false; });
    pushAudit('HEALTH_UPDATE', 'health', { field, value });
  };

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
        setUsersError(null); // clear any previous error on success
      })
      .catch((e) => {
        const msg = e?.message || 'Failed to load users';
        setUsersError(isUsersPermissionError(msg) ? USERS_PERMISSION_ERROR_MESSAGE : msg);
      })
      .finally(() => setUsersLoading(false));
  }, []);

  const syncMyAccessAndRetry = useCallback(() => {
    const uid = auth.currentUser?.uid;
    const email = user?.email || auth.currentUser?.email;
    if (!email && !uid) return;
    setUsersError(null);
    setUsersLoading(true);
    console.log('[SuperAdminDebug] Starting sync for:', email);
    // 1) Bootstrap: set own user doc role to super_admin so Firestore getRole() grants access (rule allows member -> super_admin once)
    const bootstrapRole = uid
      ? Promise.resolve(setUserData(uid, { role: 'super_admin' }))
        .then(() => console.log('[SuperAdminDebug] Local user role updated in Firestore.'))
        .catch((e) => { console.warn('[SuperAdminDebug] Bootstrap role failed (perhaps already non-member?):', e?.message); })
      : Promise.resolve();
    bootstrapRole
      .then(() => {
        const map = buildSuperAdminEmailsMap(admins, email);
        console.log('[SuperAdminDebug] Updating app config super_admin_emails map:', map);
        return setAppConfig({ super_admin_emails: map }, { currentUserEmail: email });
      })
      .then(() => {
        console.log('[SuperAdminDebug] Config sync done. Retrying user list load...');
        return loadUsers();
      })
      .catch((e) => {
        console.error('[SuperAdminDebug] Sync process failed:', e);
        setUsersLoading(false);
        setUsersError(e?.message || 'Failed to sync access. Ensure you have network connectivity and the firestore rules are deployed.');
      });
  }, [user?.email, admins, loadUsers]);

  /** Sync role + config first so Firestore grants access, then load users. Use this when opening User Management / Leaderboard so the read succeeds. */
  const ensureAccessThenLoadUsers = useCallback(() => {
    const uid = auth.currentUser?.uid;
    const email = user?.email || auth.currentUser?.email;
    if (!uid && !email) {
      loadUsers();
      return;
    }
    setUsersError(null);
    setUsersLoading(true);
    const SYNC_TIMEOUT_MS = 8000;
    const bootstrap = uid ? Promise.resolve(setUserData(uid, { role: 'super_admin' })).catch((e) => { console.warn('Bootstrap role:', e?.message); }) : Promise.resolve();
    const configSync = email
      ? bootstrap.then(() => setAppConfig({}, { currentUserEmail: email })).catch((e) => { console.warn('Config sync:', e?.message); })
      : bootstrap;
    const timeout = new Promise((resolve) => setTimeout(resolve, SYNC_TIMEOUT_MS));
    Promise.race([configSync, timeout])
      .then(() => loadUsers())
      .catch(() => loadUsers()); // sync failed or timed out — still try loading (will show list or permission error)
  }, [user?.email, loadUsers]);

  // One-time auto "Sync my access & retry" when we hit the permission error so Super Admins often don't need to click the button
  const syncRef = useRef(null);
  syncRef.current = syncMyAccessAndRetry;
  useEffect(() => {
    if (!usersError || !isUsersPermissionError(usersError) || permissionErrorAutoSyncDone.current) return;
    permissionErrorAutoSyncDone.current = true;
    syncRef.current?.();
  }, [usersError, syncMyAccessAndRetry]);

  // When opening Dashboard, User Management or Streak Leaderboard, sync access first then load users so Firestore rules allow the read
  useEffect(() => {
    if (tab === 'dashboard' || tab === 'users' || tab === 'leaderboard') ensureAccessThenLoadUsers();
  }, [tab, ensureAccessThenLoadUsers]);

  /** Refresh: if we're showing a permission error, re-sync then load; otherwise just load. */
  const handleRefresh = useCallback(() => {
    if (usersError && isUsersPermissionError(usersError)) ensureAccessThenLoadUsers();
    else loadUsers();
  }, [usersError, ensureAccessThenLoadUsers, loadUsers]);

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

  const handleResetStreak = (uid, email) => {
    if (!window.confirm(`Reset streak for ${email || uid}?`)) return;
    setUsersActionSuccess(null);
    setStreakForAdmin(uid, 0, 0)
      .then(() => { loadUsers(); setUsersActionSuccess('Streak reset.'); setTimeout(() => setUsersActionSuccess(null), 3000); pushAudit('STREAK_RESET', 'users', { uid, email }); })
      .catch((e) => { setUsersError(e?.message || 'Failed to reset streak'); setUsersActionSuccess(null); });
  };

  const handleUpdateUserRole = (uid, email, role) => {
    setUsersActionSuccess(null);
    setUserRole(uid, role)
      .then(() => { loadUsers(); setUsersActionSuccess('Role updated.'); setTimeout(() => setUsersActionSuccess(null), 3000); pushAudit('USER_ROLE_CHANGE', 'users', { uid, email, role }); })
      .catch((e) => { setUsersError(e?.message || 'Failed to update user role'); setUsersActionSuccess(null); });
  };

  const handleUpdateUserStatus = (uid, email, status) => {
    setUsersActionSuccess(null);
    setUserStatusForAdmin(uid, status)
      .then(() => { loadUsers(); setUsersActionSuccess('Status updated.'); setTimeout(() => setUsersActionSuccess(null), 3000); pushAudit('USER_STATUS_CHANGE', 'users', { uid, email, status }); })
      .catch((e) => { setUsersError(e?.message || 'Failed to update user status'); setUsersActionSuccess(null); });
  };

  const filteredAudit = auditLog.filter((e) => {
    if (auditFilterUser && !(e.actorEmail || '').toLowerCase().includes(auditFilterUser.toLowerCase())) return false;
    if (auditFilterFrom && e.timestamp < auditFilterFrom) return false;
    if (auditFilterTo && e.timestamp > auditFilterTo + 'T23:59:59.999Z') return false;
    return true;
  });

  const exportAudit = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Resource', 'Details'];
    const rows = filteredAudit.map((e) => [e.timestamp, e.actorEmail, e.action, e.resource || '', e.details || '']);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    pushAudit('AUDIT_EXPORT', 'audit', { rows: filteredAudit.length });
  };

  const exportUsersCsv = () => {
    const headers = ['Name', 'Email', 'Role', 'Current Streak', 'Longest Streak', 'Last Active', 'Status'];
    const rows = filteredUsers.map((u) => [
      (u.displayName || '—').replace(/"/g, '""'),
      (u.email || '—').replace(/"/g, '""'),
      u.role || 'member',
      typeof u.currentStreak === 'number' ? getDisplayCurrentStreak(u) : '—',
      typeof u.longestStreak === 'number' ? u.longestStreak : '—',
      formatLastActive(u.lastLoginDate, u.lastSeen),
      u.status || 'active',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    pushAudit('USERS_EXPORT', 'users', { rows: filteredUsers.length });
  };

  function selectTab(tabId) {
    setTab(tabId);
    setSidebarOpen(false);
  }

  const cardStyle = { padding: 20, background: 'rgba(15,23,42,0.8)', borderRadius: 12, border: '1px solid rgba(251,191,36,0.15)' };
  const inputStyle = { width: '100%', maxWidth: 320, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(15,23,42,0.8)', color: '#f1f5f9' };
  const btnStyle = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 };
  const btnPrimary = { ...btnStyle, background: '#f59e0b', color: '#0a0e1a' };
  const btnDanger = { ...btnStyle, background: 'rgba(239,68,68,0.2)', color: '#f87171' };
  const tableWrap = { overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(251,191,36,0.15)' };

  return (
    <div className={`super-admin-dashboard ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sa-overlay" role="button" tabIndex={0} onClick={() => setSidebarOpen(false)} onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)} aria-label="Close menu" />
      <aside className="sa-sidebar-wrap" style={{ transform: sidebarOpen ? 'translateX(0)' : undefined }}>
        <div className="sa-sidebar-header">
          <span>System Control</span>
          <span className="sa-badge">Super Admin</span>
        </div>
        <nav className="sa-nav">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => selectTab(t.id)} className={`sa-nav-btn ${tab === t.id ? 'active' : ''}`}>
              <span className="material-icons-round">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        {typeof setColorScheme === 'function' && typeof setThemeMode === 'function' && (
          <div className="sa-theme-wrap">
            <div className="sa-theme-label">Theme</div>
            <div className="sa-theme-row">
              <button type="button" className={`sa-theme-btn ${colorScheme === 'light' ? 'active' : ''}`} onClick={() => setColorScheme('light')} title="Light">
                <span className="material-icons-round">light_mode</span>
              </button>
              <button type="button" className={`sa-theme-btn ${colorScheme === 'dark' ? 'active' : ''}`} onClick={() => setColorScheme('dark')} title="Dark">
                <span className="material-icons-round">dark_mode</span>
              </button>
            </div>
            <div className="sa-theme-modes">
              <button type="button" className={`sa-theme-mode ${themeMode === 'default' ? 'active' : ''}`} onClick={() => setThemeMode('default')}>Default</button>
              <button type="button" className={`sa-theme-mode ${themeMode === 'sunshine' ? 'active' : ''}`} onClick={() => setThemeMode('sunshine')}>Sunshine</button>
              <button type="button" className={`sa-theme-mode ${themeMode === 'sea' ? 'active' : ''}`} onClick={() => setThemeMode('sea')}>Sea</button>
              <button type="button" className={`sa-theme-mode ${themeMode === 'fire' ? 'active' : ''}`} onClick={() => setThemeMode('fire')}>Fire</button>
              <button type="button" className={`sa-theme-mode ${themeMode === 'forest' ? 'active' : ''}`} onClick={() => setThemeMode('forest')}>Forest</button>
              <button type="button" className={`sa-theme-mode ${themeMode === 'ice' ? 'active' : ''}`} onClick={() => setThemeMode('ice')}>Ice</button>
              <button type="button" className={`sa-theme-mode ${themeMode === 'flower' ? 'active' : ''}`} onClick={() => setThemeMode('flower')}>Flower</button>
              <button type="button" className={`sa-theme-mode ${themeMode === 'star' ? 'active' : ''}`} onClick={() => setThemeMode('star')}>Star</button>
            </div>
          </div>
        )}
        <div className="sa-sidebar-footer">
          <div className="sa-logged-in-as" title="This email is used for config writes; Firestore rules allowlist must match.">
            Logged in as: {user?.email || auth.currentUser?.email || '—'}
          </div>
          <button type="button" className="sa-logout-btn" onClick={onLogout}>Log out</button>
        </div>
      </aside>
      <header className="sa-mobile-header">
        <button type="button" className="sa-menu-btn" onClick={() => setSidebarOpen((o) => !o)} aria-label="Open menu"><span className="material-icons-round" style={{ fontSize: 24 }}>menu</span></button>
        <span className="sa-title">Super Admin</span>
        <span style={{ width: 40 }} />
      </header>
      <main className="sa-main">
        {tab === 'dashboard' && (
          <div>
            <h1 className="sa-main-heading">Dashboard / System Overview</h1>
            <p className="sa-main-sub">System control only. No sports or member data.</p>
            <div className="sa-cards">
              <div className="sa-card">
                <p className="sa-card-label">Total Users (Member Base)</p>
                <p className="sa-card-value">{usersLoading && !usersList.length ? '—' : usersList.length}</p>
              </div>
              <div className="sa-card">
                <p className="sa-card-label">Daily Active Users (Today)</p>
                <p className="sa-card-value" style={{ color: '#4ade80' }}>{usersLoading && !usersList.length ? '—' : engagementMetrics.dau}</p>
              </div>
              <div className="sa-card">
                <p className="sa-card-label">Total Admin accounts</p>
                <p className="sa-card-value">{admins.length}</p>
              </div>
              <div className="sa-card">
                <p className="sa-card-label">Maintenance mode</p>
                <p className="sa-card-value" style={{ color: maintenance ? '#f59e0b' : '#4ade80' }}>{maintenance ? 'ON' : 'OFF'}</p>
              </div>
              <div className="sa-card">
                <p className="sa-card-label">DB connection</p>
                <p className="sa-card-value">{health.db}</p>
              </div>
              <div className="sa-card">
                <p className="sa-card-label">Server status</p>
                <p className="sa-card-value">{health.server}</p>
              </div>
              <div className="sa-card">
                <p className="sa-card-label">Uptime</p>
                <p className="sa-card-value">{health.uptime}</p>
              </div>
              <div className="sa-card">
                <p className="sa-card-label">Feature flags</p>
                <p className="sa-card-value">{featureFlags.filter((f) => f.enabled).length} / {featureFlags.length} ON</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginTop: 24 }}>
              <div style={cardStyle}>
                <h2 style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-icons-round" style={{ fontSize: 18 }}>show_chart</span>
                  Member Logins (Last 7 Days)
                </h2>
                <div className="bar-chart-container">
                  {engagementMetrics.last7.map((d) => {
                    const height = usersList.length ? (d.count / usersList.length) * 100 : 0;
                    return (
                      <div key={d.date} className="bar-column">
                        <div className="bar-fill" style={{ height: `${Math.max(5, height)}%` }} title={`${d.count} logins on ${d.date}`} />
                        <span className="bar-label">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={cardStyle}>
                <h2 style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-icons-round" style={{ fontSize: 18 }}>history</span>
                  Recent System Activity
                </h2>
                <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                  {auditLog.slice(0, 10).length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: 14 }}>No activity yet.</p>
                  ) : (
                    auditLog.slice(0, 10).map((e) => (
                      <div key={e.id} style={{ padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.1)', fontSize: 12 }}>
                        <span style={{ color: '#94a3b8' }}>{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> — <span style={{ color: '#f59e0b', fontWeight: 600 }}>{e.action}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'admins' && (
          <div>
            <h1 className="sa-main-heading">Admin Management</h1>
            <p className="sa-main-sub">Create / Delete Admin. Assign / Revoke roles. View all Admins.</p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16, padding: '10px 14px', background: 'rgba(148,163,184,0.1)', borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)' }}>
              <strong>Bootstrap admins</strong> (Super Admin: mazcis2011@gmail.com, Admin: nasarpk20@gmail.com) always have access and do not need to be in the list below. Anyone you add here will see the Admin or Super Admin dashboard when they log in.
            </p>
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, marginBottom: 12 }}>Add Admin</h2>
              {adminSaveError && (
                <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{adminSaveError}</p>
              )}
              {adminSaveSuccess && (
                <p style={{ color: '#4ade80', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'rgba(74,222,128,0.15)', borderRadius: 8 }}>Changes saved.</p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Email</label>
                  <input style={inputStyle} value={adminForm.email} onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))} placeholder="admin@example.com" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Role</label>
                  <select style={inputStyle} value={adminForm.role} onChange={(e) => setAdminForm((f) => ({ ...f, role: e.target.value }))}>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <button type="button" style={btnPrimary} onClick={addAdmin}>Add Admin</button>
              </div>
            </div>
            <div style={tableWrap}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
                <thead>
                  <tr style={{ background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid rgba(251,191,36,0.2)' }}>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: 24, color: '#64748b', textAlign: 'center' }}>No admins yet. Add one above.</td></tr>
                  ) : (
                    admins.map((a) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                        <td style={{ padding: 12 }}>{a.email}</td>
                        <td style={{ padding: 12 }}>
                          <select style={{ ...inputStyle, width: 'auto', maxWidth: 140 }} value={a.role} onChange={(e) => setAdminRole(a.id, a.email, e.target.value)}>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </td>
                        <td style={{ padding: 12 }}>
                          <button style={{ ...btnDanger, marginLeft: 8 }} onClick={() => removeAdmin(a.id, a.email)}>Remove</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div>
            <h1 className="sa-main-heading">User Management</h1>
            <p className="sa-main-sub">All users who have ever logged in (member, admin, or super admin). View roles, streaks, active/offline status, last activity. Search by name or email, reset streak when needed.</p>
            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ ...inputStyle, minWidth: 220, maxWidth: 320 }}
              />
              <button style={{ ...btnPrimary }} type="button" onClick={handleRefresh} disabled={usersLoading}>
                {usersLoading ? 'Loading…' : 'Refresh'}
              </button>
              <button style={{ ...btnStyle, background: 'rgba(148,163,184,0.2)', color: '#e2e8f0' }} type="button" onClick={exportUsersCsv} disabled={usersLoading || filteredUsers.length === 0}>
                Export CSV
              </button>
              <div style={{ marginLeft: 'auto', fontSize: 13, background: 'rgba(148,163,184,0.1)', padding: '6px 12px', borderRadius: 8, color: '#94a3b8' }}>
                Signed in as: <strong style={{ color: '#f1f5f9' }}>{user?.email || auth.currentUser?.email || 'unknown'}</strong> | Local Role: <strong style={{ color: '#f59e0b' }}>{user?.role || 'member'}</strong>
              </div>
            </div>
            {usersError && (
              <div style={{ marginBottom: 16, padding: 16, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 12 }}>
                <p style={{ color: '#f87171', margin: '0 0 12px', fontSize: 14 }}>{usersError}</p>
                {isUsersPermissionError(usersError) && (
                  <p style={{ margin: 0 }}>
                    <button type="button" style={{ ...btnPrimary, padding: '10px 20px' }} onClick={syncMyAccessAndRetry} disabled={usersLoading}>
                      {usersLoading ? 'Syncing…' : 'Sync my access & retry'}
                    </button>
                  </p>
                )}
              </div>
            )}
            {usersActionSuccess && (
              <p style={{ color: '#4ade80', fontSize: 14, marginBottom: 16, padding: '10px 14px', background: 'rgba(34,197,94,0.15)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)' }}>{usersActionSuccess}</p>
            )}
            <div style={tableWrap}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead>
                  <tr style={{ background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid rgba(251,191,36,0.2)' }}>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Current streak</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Longest streak</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Last active</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading && usersList.length === 0 ? (
                    <tr><td colSpan={10} style={{ padding: 32, color: '#94a3b8', textAlign: 'center' }}>Loading users…</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={10} style={{ padding: 32, color: '#64748b', textAlign: 'center' }}>{userSearch ? 'No users match your search.' : 'No users have logged in yet.'}</td></tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const status = getStatus(u.lastSeen, u.lastLoginDate);
                      const avatarLetter = (u.displayName || u.email || '?').charAt(0).toUpperCase();
                      return (
                        <tr key={u.uid} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                          <td style={{ padding: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {u.photoURL ? (
                                <img src={u.photoURL} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
                              ) : (
                                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(148,163,184,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{avatarLetter}</div>
                              )}
                              <div>
                                <div style={{ fontWeight: 500 }}>{u.displayName || '—'}</div>
                                {u.provider === 'google' && <div style={{ fontSize: 10, color: '#60a5fa', marginTop: 2 }}>🔵 Google</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: 12, fontSize: 13 }}>{u.email || '—'}</td>
                          <td style={{ padding: 12 }}>
                            <select
                              style={{ ...inputStyle, width: 'auto', padding: '4px 8px', fontSize: 12 }}
                              value={u.role || 'member'}
                              onChange={(e) => handleUpdateUserRole(u.uid, u.email, e.target.value)}
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                          </td>
                          <td style={{ padding: 12 }}>{typeof u.currentStreak === 'number' ? getDisplayCurrentStreak(u) : '—'}</td>
                          <td style={{ padding: 12 }}>{typeof u.longestStreak === 'number' ? u.longestStreak : '—'}</td>
                          <td style={{ padding: 12, fontSize: 13, color: '#94a3b8' }}>{formatLastActive(u.lastLoginDate, u.lastSeen)}</td>
                          <td style={{ padding: 12 }}>
                            <select
                              style={{ ...inputStyle, width: 'auto', padding: '4px 8px', fontSize: 12, color: u.status === 'suspended' ? '#f87171' : u.status === 'banned' ? '#ef4444' : '#4ade80' }}
                              value={u.status || 'active'}
                              onChange={(e) => handleUpdateUserStatus(u.uid, u.email, e.target.value)}
                            >
                              <option value="active" style={{ color: '#4ade80' }}>Active</option>
                              <option value="suspended" style={{ color: '#f87171' }}>Suspended</option>
                              <option value="banned" style={{ color: '#ef4444' }}>Banned</option>
                            </select>
                          </td>
                          <td style={{ padding: 12 }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="button" style={{ ...btnDanger, padding: '6px 10px', fontSize: 11 }} onClick={() => handleResetStreak(u.uid, u.email)}>Reset Streak</button>
                            </div>
                          </td>
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
            <h1 className="sa-main-heading">Streak Leaderboard</h1>
            <p className="sa-main-sub">Only users with streaks are shown. Top 20 by current streak and by longest streak.</p>
            <div style={{ marginBottom: 16 }}>
              <button style={btnPrimary} type="button" onClick={handleRefresh} disabled={usersLoading}>{usersLoading ? 'Loading…' : 'Refresh'}</button>
            </div>
            {usersError && (
              <div style={{ marginBottom: 16, padding: 16, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 12 }}>
                <p style={{ color: '#f87171', margin: '0 0 12px', fontSize: 14 }}>{usersError}</p>
                {isUsersPermissionError(usersError) && (
                  <p style={{ margin: 0 }}>
                    <button type="button" style={{ ...btnPrimary, padding: '10px 20px' }} onClick={syncMyAccessAndRetry} disabled={usersLoading}>
                      {usersLoading ? 'Syncing…' : 'Sync my access & retry'}
                    </button>
                  </p>
                )}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
              <div style={{ ...cardStyle }}>
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
              <div style={{ ...cardStyle }}>
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

        {tab === 'roles' && (
          <div>
            <h1 className="sa-main-heading">Role & Permissions</h1>
            <p className="sa-main-sub">Define what Admin accounts can do. Changes are audited.</p>
            {permsSaveError && (
              <p style={{ color: '#f87171', fontSize: 14, marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)' }}>{permsSaveError}</p>
            )}
            {permsSaveSuccess && (
              <p style={{ color: '#4ade80', fontSize: 14, marginBottom: 16, padding: '10px 14px', background: 'rgba(34,197,94,0.15)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)' }}>Permissions saved.</p>
            )}
            <div style={{ ...cardStyle, marginTop: 24 }}>
              <h2 style={{ fontSize: 16, marginBottom: 16 }}>Admin permissions</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {permissions.map((p) => (
                  <li key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                    <input type="checkbox" id={p.key} checked={!!p.enabled} onChange={() => togglePermission(p.key)} style={{ width: 18, height: 18 }} />
                    <label htmlFor={p.key} style={{ flex: 1, cursor: 'pointer' }}>{p.label}</label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === 'audit' && (
          <div>
            <h1 className="sa-main-heading">Audit Logs / System Logs</h1>
            <p className="sa-main-sub">View all actions. Filter by date / user. Export logs.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <input style={{ ...inputStyle, maxWidth: 180 }} placeholder="Filter by user (email)" value={auditFilterUser} onChange={(e) => setAuditFilterUser(e.target.value)} />
              <input type="date" style={inputStyle} value={auditFilterFrom} onChange={(e) => setAuditFilterFrom(e.target.value)} />
              <input type="date" style={inputStyle} value={auditFilterTo} onChange={(e) => setAuditFilterTo(e.target.value)} />
              <button style={btnPrimary} onClick={exportAudit}>Export CSV</button>
            </div>
            <div style={tableWrap}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead>
                  <tr style={{ background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid rgba(251,191,36,0.2)' }}>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Time</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Actor</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Action</th>
                    <th style={{ textAlign: 'left', padding: 12, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Resource</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudit.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: 24, color: '#64748b', textAlign: 'center' }}>No audit entries.</td></tr>
                  ) : (
                    filteredAudit.map((e) => (
                      <tr key={e.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                        <td style={{ padding: 12, fontSize: 13, color: '#94a3b8' }}>{new Date(e.timestamp).toLocaleString()}</td>
                        <td style={{ padding: 12 }}>{e.actorEmail}</td>
                        <td style={{ padding: 12, color: '#f59e0b' }}>{e.action}</td>
                        <td style={{ padding: 12, color: '#94a3b8' }}>{e.resource || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'health' && (
          <div>
            <h1 className="sa-main-heading">Server & Database Health</h1>
            <p className="sa-main-sub">Edit status values. In production these would come from your backend.</p>
            {healthSaveError && (
              <p style={{ color: '#f87171', fontSize: 14, marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)' }}>{healthSaveError}</p>
            )}
            {healthSaveSuccess && (
              <p style={{ color: '#4ade80', fontSize: 14, marginBottom: 16, padding: '10px 14px', background: 'rgba(34,197,94,0.15)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)' }}>Health status saved.</p>
            )}
            <div className="sa-health-grid">
              {['server', 'db', 'api', 'uptime'].map((field) => (
                <div key={field} className="sa-health-card">
                  <p className="sa-card-label">{field === 'server' ? 'Server status' : field === 'db' ? 'DB connection' : field === 'api' ? 'API status' : 'Uptime'}</p>
                  <select
                    className="sa-health-select"
                    value={health[field]}
                    onChange={(e) => updateHealth(field, e.target.value)}
                  >
                    {field === 'uptime' ? (
                      ['99.9%', '99.5%', '99%', '98%', '95%'].map((v) => <option key={v} value={v}>{v}</option>)
                    ) : (
                      <>
                        <option value="OK">OK</option>
                        <option value="Connected">Connected</option>
                        <option value="Degraded">Degraded</option>
                        <option value="Down">Down</option>
                      </>
                    )}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'features' && (
          <div>
            <h1 className="sa-main-heading">Feature Flags / Maintenance</h1>
            <p className="sa-main-sub">Enable/disable features. Toggle maintenance mode. Changes are saved and audited.</p>
            {(!auth.currentUser || !auth.currentUser.email) && (
              <p style={{ color: '#f59e0b', fontSize: 14, marginBottom: 16, padding: '12px 16px', background: 'rgba(245,158,11,0.15)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.4)' }}>
                You must be signed in to save changes. Log out and sign in again if toggles do not save.
              </p>
            )}
            {flagsSaveError && (
              <p style={{ color: '#f87171', fontSize: 14, marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)' }}>{flagsSaveError}</p>
            )}
            {flagsSaveSuccess && (
              <p style={{ color: '#4ade80', fontSize: 14, marginBottom: 16, padding: '10px 14px', background: 'rgba(34,197,94,0.15)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)' }}>Feature flags saved. The app will update for all users.</p>
            )}
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, marginBottom: 12 }}>Maintenance mode</h2>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 12 }}>When ON, the app can show a global maintenance message.</p>
              {maintenanceError && (
                <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{maintenanceError}</p>
              )}
              {maintenanceSuccess && (
                <p style={{ color: '#4ade80', fontSize: 13, marginBottom: 12 }}>Maintenance mode saved.</p>
              )}
              <button type="button" style={{ ...btnStyle, ...(maintenance ? { background: '#f59e0b', color: '#0a0e1a' } : { background: 'rgba(148,163,184,0.2)', color: '#e2e8f0' }) }} onClick={toggleMaintenance}>
                {maintenance ? 'Maintenance ON' : 'Maintenance OFF'}
              </button>
            </div>
            <div style={cardStyle}>
              <h2 style={{ fontSize: 16, marginBottom: 16 }}>Feature flags</h2>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>Toggle each feature. Changes save to Firestore and apply app-wide in real time.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {featureFlags.map((f) => (
                  <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                    <div>
                      <strong style={{ display: 'block' }}>{f.label}</strong>
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{f.description}</span>
                    </div>
                    <button type="button" style={{ ...btnStyle, ...(f.enabled ? { background: 'rgba(34,197,94,0.2)', color: '#4ade80' } : { background: 'rgba(148,163,184,0.2)', color: '#94a3b8' }) }} onClick={() => toggleFlag(f.key)}>
                      {f.enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...cardStyle, marginTop: 24 }}>
              <h2 style={{ fontSize: 16, marginBottom: 16 }}>Sports</h2>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>Turn a sport OFF to hide it from the app. Users who had that sport selected will see &quot;Sorry, this sport is not currently available. Coming soon.&quot;</p>
              {sportsSaveError && (
                <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{sportsSaveError}</p>
              )}
              {sportsSaveSuccess && (
                <p style={{ color: '#4ade80', fontSize: 13, marginBottom: 12 }}>Sports saved.</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {SPORTS_FOR_FLAGS.map((s) => {
                  const isOn = enabledSports[s.key] !== false;
                  return (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                      <strong>{s.label}</strong>
                      <button type="button" style={{ ...btnStyle, ...(isOn ? { background: 'rgba(34,197,94,0.2)', color: '#4ade80' } : { background: 'rgba(148,163,184,0.2)', color: '#94a3b8' }) }} onClick={() => toggleSport(s.key)}>
                        {isOn ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
