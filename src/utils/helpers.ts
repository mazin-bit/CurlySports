// @ts-nocheck

export const SUPER_ADMIN_EMAIL = 'mazcis2011@gmail.com';
export const ADMIN_EMAIL = 'nasarpk20@gmail.com';
export const isSuperAdminEmail = (email) => (email || '').toLowerCase().trim() === SUPER_ADMIN_EMAIL;
export const isAdminEmail = (email) => (email || '').toLowerCase().trim() === ADMIN_EMAIL;

/** Build feature-flags object from config array. Defaults all true. */
export function featureFlagsFromConfig(configArray) {
  const obj = { news: true, live_scores: true, streaks: true, favorites: true, leaderboard: true };
  (Array.isArray(configArray) ? configArray : []).forEach((f) => { obj[f.key] = f.enabled !== false; });
  return obj;
}

/** Returns 'super_admin' | 'admin' | null if the email is in the Super Admin-managed admin list. */
export function getSaRoleForEmail(email, saAdmins) {
  const e = (email || '').toLowerCase().trim();
  if (!e || !Array.isArray(saAdmins)) return null;
  const entry = saAdmins.find((a) => (a.email || '').toLowerCase().trim() === e);
  return entry && (entry.role === 'super_admin' || entry.role === 'admin') ? entry.role : null;
}

/** Fix mojibake when API returns UTF-8 (e.g. Hindi/Urdu) interpreted as Latin-1 */
export function fixTextEncoding(str) {
  if (str == null || typeof str !== 'string') return str;
  if (!str) return str;
  const likelyMojibake = /à¤|à¥|à¤®|à¤¬|à¤²|à¤à¥|à¤°|à¤¸|à¤®à¥|à¤«|à¤¨à¤²|à¤¦à¥|à¤¡|ἀ|ά|κ|για/i.test(str);
  if (!likelyMojibake) return str;
  try {
    const bytes = new Uint8Array([...str].map(c => c.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8').decode(bytes);
    return decoded;
  } catch (_) {
    return str;
  }
}
