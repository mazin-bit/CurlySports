import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, getDocFromServer, setDoc, updateDoc, collection, getDocs, getDocsFromCache, addDoc, query, orderBy, limit, onSnapshot, where, serverTimestamp, waitForPendingWrites } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB5J6Bf69DhTxEf24Uig56flzlar1jPGmo",
    authDomain: "mazinshub.firebaseapp.com",
    projectId: "mazinshub",
    storageBucket: "mazinshub.firebasestorage.app",
    messagingSenderId: "106744881892",
    appId: "1:106744881892:web:c7aaf209ae8a56db1642f1",
    measurementId: "G-5MB2PZXBLM"
};

const app = initializeApp(firebaseConfig);
// Analytics can throw in dev/localhost or when blocked; keep app working
try {
    if (typeof window !== 'undefined') getAnalytics(app);
} catch (_) { /* no-op */ }

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Offline persistence: cache reads so User Management and listUsers load instantly on repeat visits
try {
    if (typeof window !== 'undefined') {
        enableIndexedDbPersistence(db).catch((err) => {
            if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') console.warn('Firestore persistence:', err.message);
        });
    }
} catch (_) { /* no-op */ }

/** Get user data from Firestore (favorites, booked tickets, penalty best). Returns null if not found. */
export async function getUserData(uid) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
}

/** Recursively remove undefined so Firestore accepts the payload (Firestore rejects undefined). */
function firestoreSafePayload(obj) {
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((v) => firestoreSafePayload(v)).filter((v) => v !== undefined);
    const out = {};
    Object.keys(obj).forEach((k) => {
        const v = obj[k];
        if (v !== undefined) out[k] = firestoreSafePayload(v);
    });
    return out;
}

/** Save user data to Firestore. Merges with existing. Waits for server acknowledgment so data persists. */
export async function setUserData(uid, data) {
    const safe = firestoreSafePayload(data);
    if (safe == null) return;
    const ref = doc(db, "users", uid);
    try {
        // updateDoc replaces any top-level key in 'safe' entirely.
        // This is crucial for surveyInterests: we want to replace the whole settings block, not merge keys.
        await updateDoc(ref, safe);
    } catch (e) {
        // If document doesn't exist, use setDoc. Use 'not-found' check.
        if (e.code === 'not-found') {
            await setDoc(ref, safe);
        } else {
            // Fallback for other errors (permission, etc.)
            await setDoc(ref, safe, { merge: true });
        }
    }
    await waitForPendingWrites(db);
}

/** Get current user's role from Firestore. Defaults to 'member' if not set. */
export async function getCurrentUserRole(uid) {
    if (!uid) return null;
    const data = await getUserData(uid);
    const role = data?.role;
    if (role === 'super_admin' || role === 'admin' || role === 'member') return role;
    return 'member';
}

/**
 * Set a user's role (Firestore). Super Admins can set any role; Admins can set member.
 * Uses updateDoc so Firestore rule affectedKeys().hasOnly(['role']) passes correctly.
 */
export async function setUserRole(uid, role) {
    const ref = doc(db, "users", uid);
    try {
        await updateDoc(ref, { role });
    } catch (e) {
        if (e.code === 'not-found') {
            await setDoc(ref, { role }, { merge: true });
        } else {
            throw e;
        }
    }
}

/**
 * Set a user's status (active, suspended, banned) as an admin action.
 * Uses updateDoc so Firestore rule affectedKeys().hasOnly(['status']) passes.
 */
export async function setUserStatusForAdmin(uid, status) {
    const ref = doc(db, "users", uid);
    try {
        await updateDoc(ref, { status });
    } catch (e) {
        if (e.code === 'not-found') {
            await setDoc(ref, { status }, { merge: true });
        } else {
            throw e;
        }
    }
}

/**
 * Reset streak for a user (admin action). Uses updateDoc so
 * Firestore rule affectedKeys().hasOnly(['currentStreak', 'longestStreak']) passes.
 */
export async function setStreakForAdmin(uid, currentStreak, longestStreak) {
    const ref = doc(db, "users", uid);
    try {
        await updateDoc(ref, { currentStreak, longestStreak });
    } catch (e) {
        if (e.code === 'not-found') {
            await setDoc(ref, { currentStreak, longestStreak }, { merge: true });
        } else {
            throw e;
        }
    }
}

const USERS_COLLECTION = collection(db, "users");

/**
 * List users from cache only (instant). Returns [] if no cache. Use for immediate UI.
 */
export async function listUsersForAdminFromCache() {
    try {
        const snap = await getDocsFromCache(USERS_COLLECTION);
        return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    } catch {
        return [];
    }
}

/**
 * List users (network, with cache). Use after showing cache for instant then up-to-date list.
 */
export async function listUsersForAdmin() {
    const snap = await getDocs(USERS_COLLECTION);
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

const LOGIN_LOGS_COLLECTION = "login_logs";

/** Record a single login event (member, admin, or super_admin). Call on every successful auth. */
export async function addLoginLog(uid, email, displayName, role) {
    await addDoc(collection(db, LOGIN_LOGS_COLLECTION), {
        uid,
        email: email || "",
        displayName: displayName || "",
        role: role || "member",
        timestamp: new Date().toISOString(),
    });
}

/**
 * List recent login events (newest first). For admin/super_admin only.
 * Returns array of { id, uid, email, displayName, role, timestamp }.
 */
export async function listLoginLogs(maxItems = 500) {
    const q = query(
        collection(db, LOGIN_LOGS_COLLECTION),
        orderBy("timestamp", "desc"),
        limit(maxItems)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// --- App config (feature flags, admins, maintenance) — stored in Firestore, real-time ---
const CONFIG_REF = doc(db, "config", "app");

const DEFAULT_APP_CONFIG = {
    featureFlags: [
        { key: "live_scores", label: "Live scores", description: "Show live scores to members", enabled: true },
        { key: "streaks", label: "Streaks", description: "Enable streak tracking", enabled: true },
        { key: "favorites", label: "Favorites", description: "Allow favorites (teams/players)", enabled: true },
        { key: "leaderboard", label: "Leaderboard", description: "Show streak leaderboard", enabled: true },
        { key: "news", label: "News", description: "Show news & updates", enabled: true },
    ],
    saAdmins: [],
    permissions: [
        { key: "admin_manage_users", label: "Manage users (view, ban, suspend)", enabled: true },
        { key: "admin_view_leaderboard", label: "View streak leaderboard", enabled: true },
        { key: "admin_engagement", label: "View engagement analytics", enabled: true },
        { key: "admin_reset_streak", label: "Reset user streak", enabled: true },
    ],
    maintenance: false,
    health: { server: "OK", db: "Connected", api: "OK", uptime: "99.9%" },
    auditLog: [],
    /** Sport keys (soccer, basketball, etc.) set to false are hidden; missing or true = enabled. */
    enabledSports: {},
};

/** One-time get of app config. Returns default if doc missing. */
export async function getAppConfig() {
    const snap = await getDoc(CONFIG_REF);
    if (!snap.exists()) return { ...DEFAULT_APP_CONFIG };
    const data = snap.data();
    return {
        featureFlags: Array.isArray(data.featureFlags) ? data.featureFlags : DEFAULT_APP_CONFIG.featureFlags,
        saAdmins: Array.isArray(data.saAdmins) ? data.saAdmins : DEFAULT_APP_CONFIG.saAdmins,
        permissions: Array.isArray(data.permissions) ? data.permissions : DEFAULT_APP_CONFIG.permissions,
        maintenance: data.maintenance === true,
        health: data.health && typeof data.health === "object" ? data.health : DEFAULT_APP_CONFIG.health,
        auditLog: Array.isArray(data.auditLog) ? data.auditLog : DEFAULT_APP_CONFIG.auditLog,
        enabledSports: data.enabledSports && typeof data.enabledSports === "object" ? data.enabledSports : DEFAULT_APP_CONFIG.enabledSports,
    };
}

/** Fetch app config from server (bypass cache) so feature flags / enabled sports are up to date. */
export async function getAppConfigFromServer() {
    const snap = await getDocFromServer(CONFIG_REF);
    if (!snap.exists()) return { ...DEFAULT_APP_CONFIG };
    const data = snap.data();
    return {
        featureFlags: Array.isArray(data.featureFlags) ? data.featureFlags : DEFAULT_APP_CONFIG.featureFlags,
        saAdmins: Array.isArray(data.saAdmins) ? data.saAdmins : DEFAULT_APP_CONFIG.saAdmins,
        permissions: Array.isArray(data.permissions) ? data.permissions : DEFAULT_APP_CONFIG.permissions,
        maintenance: data.maintenance === true,
        health: data.health && typeof data.health === "object" ? data.health : DEFAULT_APP_CONFIG.health,
        auditLog: Array.isArray(data.auditLog) ? data.auditLog : DEFAULT_APP_CONFIG.auditLog,
        enabledSports: data.enabledSports && typeof data.enabledSports === "object" ? data.enabledSports : DEFAULT_APP_CONFIG.enabledSports,
    };
}

/** Subscribe to app config — real-time updates for feature flags, admins, maintenance. Callback receives full config. */
export function subscribeAppConfig(callback) {
    return onSnapshot(CONFIG_REF, (snap) => {
        if (!snap.exists()) {
            callback({ ...DEFAULT_APP_CONFIG });
            return;
        }
        const data = snap.data();
        callback({
            featureFlags: Array.isArray(data.featureFlags) ? data.featureFlags : DEFAULT_APP_CONFIG.featureFlags,
            saAdmins: Array.isArray(data.saAdmins) ? data.saAdmins : DEFAULT_APP_CONFIG.saAdmins,
            permissions: Array.isArray(data.permissions) ? data.permissions : DEFAULT_APP_CONFIG.permissions,
            maintenance: data.maintenance === true,
            health: data.health && typeof data.health === "object" ? data.health : DEFAULT_APP_CONFIG.health,
            auditLog: Array.isArray(data.auditLog) ? data.auditLog : DEFAULT_APP_CONFIG.auditLog,
            enabledSports: data.enabledSports && typeof data.enabledSports === "object" ? data.enabledSports : DEFAULT_APP_CONFIG.enabledSports,
        });
    });
}

/** Build map of super_admin emails for Firestore rules. Stores both lowercase and original case so token email matches. */
export function buildSuperAdminEmailsMap(saAdmins, currentUserEmail = null) {
    const map = {};
    (saAdmins || []).forEach((a) => {
        if (!a || a.role !== 'super_admin' || !(a.email || '').trim()) return;
        const e = (a.email || '').trim();
        map[e.toLowerCase()] = true;
        map[e] = true; // original case so request.auth.token.email matches
    });
    if (currentUserEmail && (currentUserEmail = (currentUserEmail || '').trim())) {
        map[currentUserEmail.toLowerCase()] = true;
        map[currentUserEmail] = true;
    }
    return map;
}

/** Merge-update app config (feature flags, saAdmins, permissions, maintenance, health). Super Admin only. */
export async function setAppConfig(updates, options = {}) {
    const payload = { ...updates };
    const currentEmail = options.currentUserEmail || (auth.currentUser && auth.currentUser.email) || null;

    const isUpdatingAdmins = Array.isArray(payload.saAdmins);

    // Only add super_admin_emails when saving the admins list. Sports/flags/maintenance write without reading config.
    if (isUpdatingAdmins) {
        payload.super_admin_emails = buildSuperAdminEmailsMap(payload.saAdmins, currentEmail);
    }

    if (payload.enabledSports != null && typeof payload.enabledSports === 'object') {
        const cleaned = {};
        Object.keys(payload.enabledSports).forEach((k) => {
            const v = payload.enabledSports[k];
            if (v === true || v === false) cleaned[k] = v;
        });
        payload.enabledSports = cleaned;
    }

    const safePayload = firestoreSafePayload(payload);
    const toWrite = safePayload != null && typeof safePayload === 'object' ? safePayload : payload;
    if (Object.keys(toWrite).length === 0) return;

    const doWrite = async () => {
        await setDoc(CONFIG_REF, toWrite, { merge: true });
        await waitForPendingWrites(db);
    };
    try {
        await doWrite();
    } catch (e) {
        console.warn('setAppConfig failed, retrying once:', e?.message);
        await new Promise((r) => setTimeout(r, 1200));
        await doWrite();
    }
}

/** Append one audit entry to config. Keeps last 500. */
export async function pushAuditLog(entry) {
    const snap = await getDoc(CONFIG_REF);
    const data = snap.exists() ? snap.data() : {};
    const auditLog = Array.isArray(data.auditLog) ? data.auditLog : [];
    const next = [entry, ...auditLog].slice(0, 500);
    await setDoc(CONFIG_REF, { auditLog: next }, { merge: true });
}

/** Real-time subscription to user document. Callback receives user data or null. */
export function subscribeUserData(uid, callback) {
    const ref = doc(db, "users", uid);
    return onSnapshot(ref, (snap) => {
        callback(snap.exists() ? snap.data() : null);
    });
}

// --- Notifications (personalized dashboard): store, real-time, read/unread ---
const NOTIFICATIONS_COLLECTION = "notifications";

/**
 * Create a notification for a user. Stored in Firestore. Optionally trigger email via Cloud Function.
 * @param {string} userId - Firestore user id
 * @param {string} type - e.g. 'match_start', 'match_result', 'goal', 'player_news', 'transfer'
 * @param {string} title - Short title
 * @param {string} body - Optional body text
 * @param {object} payload - Optional { link, matchId, teamName, playerId, etc. }
 */
export async function addNotification(userId, type, title, body = "", payload = {}) {
    const ref = collection(db, NOTIFICATIONS_COLLECTION);
    const docRef = await addDoc(ref, {
        userId,
        type: type || "info",
        title: title || "Update",
        body: body || "",
        read: false,
        createdAt: serverTimestamp(),
        ...payload,
    });
    return docRef.id;
}

/**
 * Real-time subscription to notifications for a user. Callback receives array of { id, ...data }.
 */
export function subscribeNotifications(userId, callback) {
    if (!userId) return () => { };
    const ref = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
        ref,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(100)
    );
    return onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
    });
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(notificationId) {
    const ref = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await setDoc(ref, { read: true }, { merge: true });
}

/**
 * Mark all notifications for a user as read.
 */
export async function markAllNotificationsRead(userId) {
    const ref = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(ref, where("userId", "==", userId), limit(200));
    const snap = await getDocs(q);
    const batch = snap.docs.map((d) => setDoc(d.ref, { read: true }, { merge: true }));
    await Promise.all(batch);
}

export {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
};
