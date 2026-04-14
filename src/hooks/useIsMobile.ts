import { Capacitor } from '@capacitor/core';

/**
 * Returns true ONLY when running inside a Capacitor native app (iOS/Android).
 * Returns false on the web — the mobile module is for the native app only.
 */
export function useIsNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Returns the platform: 'ios' | 'android' | 'web'
 */
export function getNativePlatform(): string {
  return Capacitor.getPlatform();
}
