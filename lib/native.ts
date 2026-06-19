/**
 * Native bridge utilities for Expo WebView shell.
 *
 * When the Next.js mobile app runs inside the Expo native shell,
 * `window.CurlyNative` is injected by the WebView. Every helper
 * here is safe to call on plain web — functions no-op gracefully.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CurlyNativeBridge {
  platform: "ios" | "android";
  isNative: true;
  postMessage: (type: string, data?: Record<string, any>) => void;
  haptic: (style?: "light" | "medium" | "heavy") => void;
  hapticNotification: (type?: "success" | "warning" | "error") => void;
  share: (opts: { title?: string; text?: string; url?: string }) => void;
  openExternal: (url: string) => void;
  requestPush: () => void;
  secureSet: (key: string, value: string) => void;
  secureGet: (key: string) => void;
  secureDelete: (key: string) => void;
}

declare global {
  interface Window {
    CurlyNative?: CurlyNativeBridge;
    __CURLY_NATIVE__?: boolean;
  }
}

function getBridge(): CurlyNativeBridge | null {
  if (typeof window !== "undefined" && window.CurlyNative) {
    return window.CurlyNative;
  }
  return null;
}

// ─── Platform helpers ───────────────────────────────────────────────────────

export const isNative = typeof window !== "undefined" && !!window.__CURLY_NATIVE__;
export const isIOS = getBridge()?.platform === "ios";
export const isAndroid = getBridge()?.platform === "android";
export const platform = getBridge()?.platform ?? "web";

// ─── Haptics ────────────────────────────────────────────────────────────────

export function hapticImpact(style: "light" | "medium" | "heavy" = "medium") {
  getBridge()?.haptic(style);
}

export function hapticNotification(type: "success" | "warning" | "error" = "success") {
  getBridge()?.hapticNotification(type);
}

// ─── Share ──────────────────────────────────────────────────────────────────

export async function nativeShare(opts: { title?: string; text?: string; url?: string }) {
  const bridge = getBridge();
  if (bridge) {
    bridge.share(opts);
    return;
  }
  // Fallback to Web Share API
  if (typeof navigator !== "undefined" && navigator.share) {
    await navigator.share(opts);
  }
}

// ─── Open external links ────────────────────────────────────────────────────

export function openExternal(url: string) {
  const bridge = getBridge();
  if (bridge) {
    bridge.openExternal(url);
    return;
  }
  window.open(url, "_blank", "noopener");
}

// ─── Push Notifications ─────────────────────────────────────────────────────

export function requestPushPermission() {
  getBridge()?.requestPush();
}

/** Listen for push token from native. Returns unsubscribe. */
export function onPushToken(cb: (token: string) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb((e as CustomEvent).detail);
  window.addEventListener("curly:push-token", handler);
  return () => window.removeEventListener("curly:push-token", handler);
}

// ─── Secure Storage ─────────────────────────────────────────────────────────

export function secureSet(key: string, value: string) {
  const bridge = getBridge();
  if (bridge) {
    bridge.secureSet(key, value);
    return;
  }
  localStorage.setItem(key, value);
}

export function secureGet(key: string): Promise<string | null> {
  const bridge = getBridge();
  if (bridge) {
    return new Promise((resolve) => {
      const handler = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail.key === key) {
          window.removeEventListener("curly:secure-value", handler);
          resolve(detail.value);
        }
      };
      window.addEventListener("curly:secure-value", handler);
      bridge.secureGet(key);
      // Timeout fallback
      setTimeout(() => {
        window.removeEventListener("curly:secure-value", handler);
        resolve(null);
      }, 2000);
    });
  }
  return Promise.resolve(localStorage.getItem(key));
}

export function secureDelete(key: string) {
  const bridge = getBridge();
  if (bridge) {
    bridge.secureDelete(key);
    return;
  }
  localStorage.removeItem(key);
}

// ─── App lifecycle ──────────────────────────────────────────────────────────

/** Listen for app resume from native. Returns unsubscribe. */
export function onAppResume(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("curly:app-resume", cb);
  return () => window.removeEventListener("curly:app-resume", cb);
}

/** Listen for native bridge ready. Returns unsubscribe. */
export function onNativeReady(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  if (window.__CURLY_NATIVE__) {
    cb();
    return () => {};
  }
  window.addEventListener("curly:native-ready", cb);
  return () => window.removeEventListener("curly:native-ready", cb);
}
