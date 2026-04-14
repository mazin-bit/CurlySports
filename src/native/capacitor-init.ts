import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

/**
 * Initialize native platform features.
 * Call once at app startup — does nothing on web.
 */
export async function initNativePlatform() {
  if (!Capacitor.isNativePlatform()) return;

  // Status bar: transparent overlay, light text
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: true });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#0a0e1a' });
    }
  } catch {}

  // Keyboard: resize body, not viewport
  try {
    if (Capacitor.getPlatform() === 'ios') {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
      await Keyboard.setScroll({ isDisabled: false });
    }
  } catch {}

  // Hide splash screen after app is ready
  try {
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch {}
}
