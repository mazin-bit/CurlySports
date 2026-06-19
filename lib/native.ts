/**
 * Capacitor native API utilities.
 *
 * Every helper is safe to call on web — functions no-op gracefully
 * when the native plugin isn't available.
 */

import { Capacitor } from "@capacitor/core";

// ─── Platform helpers ───────────────────────────────────────────────────────

/** true when running inside the Capacitor native shell (iOS / Android) */
export const isNative = Capacitor.isNativePlatform();
export const isIOS = Capacitor.getPlatform() === "ios";
export const isAndroid = Capacitor.getPlatform() === "android";
export const platform = Capacitor.getPlatform(); // "ios" | "android" | "web"

// ─── Status Bar ─────────────────────────────────────────────────────────────

export async function setStatusBarDark() {
  if (!isNative) return;
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  await StatusBar.setStyle({ style: Style.Dark });
  if (isAndroid) {
    await StatusBar.setBackgroundColor({ color: "#07090b" });
  }
}

export async function setStatusBarLight() {
  if (!isNative) return;
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  await StatusBar.setStyle({ style: Style.Light });
  if (isAndroid) {
    await StatusBar.setBackgroundColor({ color: "#f6ede0" });
  }
}

export async function hideStatusBar() {
  if (!isNative) return;
  const { StatusBar } = await import("@capacitor/status-bar");
  await StatusBar.hide();
}

export async function showStatusBar() {
  if (!isNative) return;
  const { StatusBar } = await import("@capacitor/status-bar");
  await StatusBar.show();
}

// ─── Haptics ────────────────────────────────────────────────────────────────

export async function hapticImpact(style: "light" | "medium" | "heavy" = "medium") {
  if (!isNative) return;
  const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
  const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
  await Haptics.impact({ style: map[style] });
}

export async function hapticNotification(type: "success" | "warning" | "error" = "success") {
  if (!isNative) return;
  const { Haptics, NotificationType } = await import("@capacitor/haptics");
  const map = { success: NotificationType.Success, warning: NotificationType.Warning, error: NotificationType.Error };
  await Haptics.notification({ type: map[type] });
}

export async function hapticSelection() {
  if (!isNative) return;
  const { Haptics } = await import("@capacitor/haptics");
  await Haptics.selectionStart();
  await Haptics.selectionChanged();
  await Haptics.selectionEnd();
}

// ─── Keyboard ───────────────────────────────────────────────────────────────

export async function hideKeyboard() {
  if (!isNative) return;
  const { Keyboard } = await import("@capacitor/keyboard");
  await Keyboard.hide();
}

/** Listen for keyboard show/hide events. Returns an unsubscribe function. */
export async function onKeyboardChange(cb: (visible: boolean, height: number) => void): Promise<() => void> {
  if (!isNative) return () => {};
  const { Keyboard } = await import("@capacitor/keyboard");
  const showHandle = await Keyboard.addListener("keyboardWillShow", (info) => cb(true, info.keyboardHeight));
  const hideHandle = await Keyboard.addListener("keyboardWillHide", () => cb(false, 0));
  return () => { showHandle.remove(); hideHandle.remove(); };
}

// ─── Share ──────────────────────────────────────────────────────────────────

export async function nativeShare(opts: { title?: string; text?: string; url?: string }) {
  if (!isNative) {
    // Fallback to Web Share API
    if (navigator.share) {
      await navigator.share(opts);
    }
    return;
  }
  const { Share } = await import("@capacitor/share");
  await Share.share(opts);
}

// ─── Browser (open external links) ─────────────────────────────────────────

export async function openExternal(url: string) {
  if (!isNative) {
    window.open(url, "_blank", "noopener");
    return;
  }
  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url });
}

// ─── Preferences (key-value storage) ────────────────────────────────────────

export async function setPreference(key: string, value: string) {
  if (!isNative) {
    localStorage.setItem(key, value);
    return;
  }
  const { Preferences } = await import("@capacitor/preferences");
  await Preferences.set({ key, value });
}

export async function getPreference(key: string): Promise<string | null> {
  if (!isNative) {
    return localStorage.getItem(key);
  }
  const { Preferences } = await import("@capacitor/preferences");
  const { value } = await Preferences.get({ key });
  return value;
}

export async function removePreference(key: string) {
  if (!isNative) {
    localStorage.removeItem(key);
    return;
  }
  const { Preferences } = await import("@capacitor/preferences");
  await Preferences.remove({ key });
}

// ─── Push Notifications ─────────────────────────────────────────────────────

export async function requestPushPermission(): Promise<boolean> {
  if (!isNative) return false;
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const result = await PushNotifications.requestPermissions();
  if (result.receive === "granted") {
    await PushNotifications.register();
    return true;
  }
  return false;
}

export async function onPushToken(cb: (token: string) => void): Promise<() => void> {
  if (!isNative) return () => {};
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const handle = await PushNotifications.addListener("registration", (token) => cb(token.value));
  return () => handle.remove();
}

export async function onPushNotification(cb: (notification: { title?: string; body?: string; data: Record<string, unknown> }) => void): Promise<() => void> {
  if (!isNative) return () => {};
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const handle = await PushNotifications.addListener("pushNotificationReceived", (n) =>
    cb({ title: n.title ?? undefined, body: n.body ?? undefined, data: (n.data ?? {}) as Record<string, unknown> })
  );
  return () => handle.remove();
}

// ─── App lifecycle ──────────────────────────────────────────────────────────

/** Listen for hardware back button (Android). Returns unsubscribe. */
export async function onBackButton(cb: () => void): Promise<() => void> {
  if (!isNative) return () => {};
  const { App } = await import("@capacitor/app");
  const handle = await App.addListener("backButton", cb);
  return () => handle.remove();
}

/** Listen for app state changes (foreground/background). */
export async function onAppStateChange(cb: (isActive: boolean) => void): Promise<() => void> {
  if (!isNative) return () => {};
  const { App } = await import("@capacitor/app");
  const handle = await App.addListener("appStateChange", (state) => cb(state.isActive));
  return () => handle.remove();
}

// ─── Splash Screen ──────────────────────────────────────────────────────────

export async function hideSplash() {
  if (!isNative) return;
  const { SplashScreen } = await import("@capacitor/splash-screen");
  await SplashScreen.hide();
}

export async function showSplash() {
  if (!isNative) return;
  const { SplashScreen } = await import("@capacitor/splash-screen");
  await SplashScreen.show({ autoHide: false });
}

// ─── Safe Area ──────────────────────────────────────────────────────────────

/** Get CSS safe-area-inset values. Works on web too (returns 0 when unavailable). */
export function getSafeAreaInsets() {
  if (typeof window === "undefined") return { top: 0, bottom: 0, left: 0, right: 0 };
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue("env(safe-area-inset-top)") || "0", 10),
    bottom: parseInt(style.getPropertyValue("env(safe-area-inset-bottom)") || "0", 10),
    left: parseInt(style.getPropertyValue("env(safe-area-inset-left)") || "0", 10),
    right: parseInt(style.getPropertyValue("env(safe-area-inset-right)") || "0", 10),
  };
}
