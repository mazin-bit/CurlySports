import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { AppConfig, FeatureFlag, Permission, SaAdmin, HealthStatus, AuditLogEntry } from '../types/config';

// ============================================================
// TYPES
// ============================================================

interface UserRow {
  id: string;
  auth_id: string;
  email: string;
  display_name: string;
  photo_url: string | null;
  role: string;
  status: string;
  current_streak: number;
  longest_streak: number;
  last_login_date: string | null;
  last_seen: string | null;
  favorite_clubs: string[];
  favorite_players: (string | number)[];
  booked_tickets: Record<string, unknown>;
  penalty_best: number;
  super_over_best: number;
  survey_interests: Record<string, unknown> | null;
  survey_completed: boolean;
  survey_skipped: boolean;
  created_at: string;
  updated_at: string;
}

/** Maps Supabase snake_case row to the camelCase shape the app expects. */
function mapUserRow(row: UserRow): Record<string, unknown> {
  return {
    uid: row.auth_id,
    email: row.email,
    displayName: row.display_name,
    photoURL: row.photo_url,
    role: row.role,
    status: row.status,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastLoginDate: row.last_login_date,
    lastSeen: row.last_seen,
    favoriteClubs: row.favorite_clubs ?? [],
    favoritePlayers: row.favorite_players ?? [],
    bookedTickets: row.booked_tickets ?? {},
    penaltyBest: row.penalty_best,
    superOverBest: row.super_over_best,
    surveyInterests: row.survey_interests,
    surveyCompleted: row.survey_completed,
    surveySkipped: row.survey_skipped,
  };
}

/** Maps camelCase app data to Supabase snake_case columns. */
function mapUserDataToRow(data: Record<string, unknown>): Record<string, unknown> {
  const mapping: Record<string, string> = {
    displayName: 'display_name',
    photoURL: 'photo_url',
    currentStreak: 'current_streak',
    longestStreak: 'longest_streak',
    lastLoginDate: 'last_login_date',
    lastSeen: 'last_seen',
    favoriteClubs: 'favorite_clubs',
    favoritePlayers: 'favorite_players',
    bookedTickets: 'booked_tickets',
    penaltyBest: 'penalty_best',
    superOverBest: 'super_over_best',
    surveyInterests: 'survey_interests',
    surveyCompleted: 'survey_completed',
    surveySkipped: 'survey_skipped',
  };

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    const snakeKey = mapping[key] || key;
    result[snakeKey] = value;
  }
  return result;
}

// ============================================================
// DEFAULT APP CONFIG
// ============================================================

const DEFAULT_APP_CONFIG: AppConfig = {
  featureFlags: [
    { key: 'live_scores', label: 'Live scores', description: 'Show live scores to members', enabled: true },
    { key: 'streaks', label: 'Streaks', description: 'Enable streak tracking', enabled: true },
    { key: 'favorites', label: 'Favorites', description: 'Allow favorites (teams/players)', enabled: true },
    { key: 'leaderboard', label: 'Leaderboard', description: 'Show streak leaderboard', enabled: true },
    { key: 'news', label: 'News', description: 'Show news & updates', enabled: true },
  ],
  saAdmins: [],
  permissions: [
    { key: 'admin_manage_users', label: 'Manage users (view, ban, suspend)', enabled: true },
    { key: 'admin_view_leaderboard', label: 'View streak leaderboard', enabled: true },
    { key: 'admin_engagement', label: 'View engagement analytics', enabled: true },
    { key: 'admin_reset_streak', label: 'Reset user streak', enabled: true },
  ],
  maintenance: false,
  health: { server: 'OK', db: 'Connected', api: 'OK', uptime: '99.9%' },
  auditLog: [],
  enabledSports: {},
};

function parseAppConfigRow(row: Record<string, unknown>): AppConfig {
  return {
    featureFlags: Array.isArray(row.feature_flags) ? (row.feature_flags as FeatureFlag[]) : DEFAULT_APP_CONFIG.featureFlags,
    saAdmins: Array.isArray(row.sa_admins) ? (row.sa_admins as SaAdmin[]) : DEFAULT_APP_CONFIG.saAdmins,
    permissions: Array.isArray(row.permissions) ? (row.permissions as Permission[]) : DEFAULT_APP_CONFIG.permissions,
    maintenance: row.maintenance === true,
    health: (row.health && typeof row.health === 'object' ? row.health : DEFAULT_APP_CONFIG.health) as HealthStatus,
    auditLog: Array.isArray(row.audit_log) ? (row.audit_log as AuditLogEntry[]) : DEFAULT_APP_CONFIG.auditLog,
    enabledSports: (row.enabled_sports && typeof row.enabled_sports === 'object' ? row.enabled_sports : DEFAULT_APP_CONFIG.enabledSports) as Record<string, boolean>,
  };
}

// ============================================================
// USER OPERATIONS
// ============================================================

/** Get user data by auth UID. Returns null if not found. */
export async function getUserData(uid: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', uid)
    .single();

  if (error || !data) return null;
  return mapUserRow(data as UserRow);
}

/** Save/update user data. Upserts by auth_id. */
export async function setUserData(uid: string, data: Record<string, unknown>): Promise<void> {
  const mapped = mapUserDataToRow(data);

  // Try update first
  const { error: updateError } = await supabase
    .from('users')
    .update(mapped)
    .eq('auth_id', uid);

  if (updateError) {
    // If no rows matched, insert
    const { error: insertError } = await supabase
      .from('users')
      .upsert({
        auth_id: uid,
        email: (data.email as string) || '',
        ...mapped,
      }, { onConflict: 'auth_id' });

    if (insertError) {
      console.error('setUserData error:', insertError.message);
    }
  }
}

/** Get current user's role. Defaults to 'member'. */
export async function getCurrentUserRole(uid: string): Promise<string | null> {
  if (!uid) return null;
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', uid)
    .single();

  const role = data?.role;
  if (role === 'super_admin' || role === 'admin' || role === 'member') return role;
  return 'member';
}

/** Set a user's role. */
export async function setUserRole(uid: string, role: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('auth_id', uid);

  if (error) {
    // Fallback: upsert
    await supabase
      .from('users')
      .upsert({ auth_id: uid, email: '', role }, { onConflict: 'auth_id' });
  }
}

/** Set a user's status (active, suspended, banned). */
export async function setUserStatusForAdmin(uid: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ status })
    .eq('auth_id', uid);

  if (error) {
    await supabase
      .from('users')
      .upsert({ auth_id: uid, email: '', status }, { onConflict: 'auth_id' });
  }
}

/** Reset streak for a user. */
export async function setStreakForAdmin(uid: string, currentStreak: number, longestStreak: number): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ current_streak: currentStreak, longest_streak: longestStreak })
    .eq('auth_id', uid);

  if (error) {
    await supabase
      .from('users')
      .upsert({ auth_id: uid, email: '', current_streak: currentStreak, longest_streak: longestStreak }, { onConflict: 'auth_id' });
  }
}

/** List users from sessionStorage cache (instant). */
export async function listUsersForAdminFromCache(): Promise<Array<Record<string, unknown>>> {
  try {
    const cached = sessionStorage.getItem('admin_users_cache');
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

/** List all users. */
export async function listUsersForAdmin(): Promise<Array<Record<string, unknown>>> {
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error || !data) return [];
  const mapped = (data as UserRow[]).map(mapUserRow);

  // Cache for instant loads
  try {
    sessionStorage.setItem('admin_users_cache', JSON.stringify(mapped));
  } catch { /* quota exceeded */ }

  return mapped;
}

// ============================================================
// LOGIN LOGS
// ============================================================

/** Record a login event. */
export async function addLoginLog(uid: string, email: string, displayName: string, role: string): Promise<void> {
  await supabase
    .from('login_logs')
    .insert({
      user_auth_id: uid,
      email: email || '',
      display_name: displayName || '',
      role: role || 'member',
    });
}

/** List recent login events (newest first). */
export async function listLoginLogs(maxItems = 500): Promise<Array<Record<string, unknown>>> {
  const { data } = await supabase
    .from('login_logs')
    .select('*')
    .order('logged_at', { ascending: false })
    .limit(maxItems);

  return (data || []).map((d) => ({
    id: d.id,
    uid: d.user_auth_id,
    email: d.email,
    displayName: d.display_name,
    role: d.role,
    timestamp: d.logged_at,
  }));
}

// ============================================================
// APP CONFIG
// ============================================================

/** One-time get of app config. */
export async function getAppConfig(): Promise<AppConfig> {
  const { data } = await supabase
    .from('app_config')
    .select('*')
    .eq('id', 'app')
    .single();

  if (!data) return { ...DEFAULT_APP_CONFIG };
  return parseAppConfigRow(data);
}

/** Alias - Supabase has no cache distinction. */
export const getAppConfigFromServer = getAppConfig;

/** Subscribe to app config changes (real-time). */
export function subscribeAppConfig(callback: (config: AppConfig) => void): () => void {
  // Initial fetch
  getAppConfig().then(callback).catch(() => callback({ ...DEFAULT_APP_CONFIG }));

  // Real-time subscription
  const channel: RealtimeChannel = supabase
    .channel('app_config_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'app_config',
      filter: 'id=eq.app',
    }, (payload) => {
      if (payload.new) {
        callback(parseAppConfigRow(payload.new as Record<string, unknown>));
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Build map of super_admin emails. */
export function buildSuperAdminEmailsMap(
  saAdmins: Array<{ email?: string; role?: string }> | null,
  currentUserEmail: string | null = null
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  (saAdmins || []).forEach((a) => {
    if (!a || a.role !== 'super_admin' || !(a.email || '').trim()) return;
    const e = (a.email || '').trim();
    map[e.toLowerCase()] = true;
    map[e] = true;
  });
  if (currentUserEmail) {
    const trimmed = currentUserEmail.trim();
    if (trimmed) {
      map[trimmed.toLowerCase()] = true;
      map[trimmed] = true;
    }
  }
  return map;
}

/** Merge-update app config. */
export async function setAppConfig(updates: Record<string, unknown>, options: { currentUserEmail?: string | null } = {}): Promise<void> {
  const payload: Record<string, unknown> = {};
  const currentEmail = options.currentUserEmail || null;

  // Map camelCase keys to snake_case for Supabase
  const keyMapping: Record<string, string> = {
    featureFlags: 'feature_flags',
    saAdmins: 'sa_admins',
    permissions: 'permissions',
    maintenance: 'maintenance',
    health: 'health',
    auditLog: 'audit_log',
    enabledSports: 'enabled_sports',
    super_admin_emails: 'super_admin_emails',
  };

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    const snakeKey = keyMapping[key] || key;
    payload[snakeKey] = value;
  }

  // Build super_admin_emails map when updating admins
  if (Array.isArray(payload.sa_admins)) {
    payload.super_admin_emails = buildSuperAdminEmailsMap(
      payload.sa_admins as Array<{ email?: string; role?: string }>,
      currentEmail
    );
  }

  // Clean enabledSports to booleans only
  if (payload.enabled_sports != null && typeof payload.enabled_sports === 'object') {
    const cleaned: Record<string, boolean> = {};
    Object.entries(payload.enabled_sports as Record<string, unknown>).forEach(([k, v]) => {
      if (v === true || v === false) cleaned[k] = v;
    });
    payload.enabled_sports = cleaned;
  }

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase
    .from('app_config')
    .update(payload)
    .eq('id', 'app');

  if (error) {
    console.warn('setAppConfig failed, retrying once:', error.message);
    await new Promise((r) => setTimeout(r, 1200));
    await supabase.from('app_config').update(payload).eq('id', 'app');
  }
}

/** Append one audit entry. Keeps last 500. */
export async function pushAuditLog(entry: Record<string, unknown>): Promise<void> {
  const { data } = await supabase
    .from('app_config')
    .select('audit_log')
    .eq('id', 'app')
    .single();

  const auditLog = Array.isArray(data?.audit_log) ? data.audit_log : [];
  const next = [entry, ...auditLog].slice(0, 500);
  await supabase.from('app_config').update({ audit_log: next }).eq('id', 'app');
}

// ============================================================
// REAL-TIME USER DATA
// ============================================================

/** Real-time subscription to user data. */
export function subscribeUserData(uid: string, callback: (data: Record<string, unknown> | null) => void): () => void {
  // Initial fetch
  getUserData(uid).then(callback).catch(() => callback(null));

  const channel = supabase
    .channel(`user_${uid}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'users',
      filter: `auth_id=eq.${uid}`,
    }, (payload) => {
      if (payload.new && Object.keys(payload.new).length > 0) {
        callback(mapUserRow(payload.new as UserRow));
      } else {
        callback(null);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================================
// NOTIFICATIONS
// ============================================================

/** Resolve user's internal DB ID from auth_id. */
async function resolveUserId(authId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .single();
  return data?.id ?? null;
}

/** Create a notification for a user. */
export async function addNotification(
  userId: string,
  type: string,
  title: string,
  body = '',
  payload: Record<string, unknown> = {}
): Promise<string | null> {
  // userId here could be auth_id or internal id - try internal first
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: type || 'info',
      title: title || 'Update',
      body: body || '',
      read: false,
      payload,
    })
    .select('id')
    .single();

  if (error) {
    // Maybe userId is auth_id, resolve it
    const internalId = await resolveUserId(userId);
    if (internalId) {
      const { data: retryData } = await supabase
        .from('notifications')
        .insert({
          user_id: internalId,
          type: type || 'info',
          title: title || 'Update',
          body: body || '',
          read: false,
          payload,
        })
        .select('id')
        .single();
      return retryData?.id ?? null;
    }
    return null;
  }
  return data?.id ?? null;
}

/** Real-time subscription to notifications. */
export function subscribeNotifications(
  userId: string,
  callback: (list: Array<{ id: string } & Record<string, unknown>>) => void
): () => void {
  if (!userId) return () => {};

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    callback(
      (data || []).map((d) => ({
        id: d.id,
        userId: d.user_id,
        type: d.type,
        title: d.title,
        body: d.body,
        read: d.read,
        createdAt: d.created_at,
        ...((d.payload as Record<string, unknown>) || {}),
      }))
    );
  };

  // Initial fetch
  fetchNotifications();

  // Re-fetch on any change
  const channel = supabase
    .channel(`notifications_${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, () => {
      fetchNotifications();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Mark a notification as read. */
export async function markNotificationRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
}

/** Mark all notifications for a user as read. */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
}
