"use client";

import { useEffect, useRef, useState } from "react";
import {
  isNative,
  isIOS,
  isAndroid,
  platform,
  setStatusBarDark,
  hideSplash,
  onBackButton,
  onAppStateChange,
  onKeyboardChange,
} from "@/lib/native";

/** Returns platform info. Safe on web (isNative = false). */
export function usePlatform() {
  return { isNative, isIOS, isAndroid, platform };
}

/**
 * Initialize native shell on mount: status bar, splash screen, back button.
 * Call once at the top-level mobile layout.
 */
export function useNativeInit(onBack?: () => void) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!isNative) return;

    // Dark status bar + hide splash after mount
    setStatusBarDark();
    const splashTimer = setTimeout(() => hideSplash(), 300);

    // Android back button
    const backCleanupPromise = onBackButton(() => onBackRef.current?.());

    // Pause/resume — could reconnect SSE, etc.
    const stateCleanupPromise = onAppStateChange((active) => {
      if (active) {
        document.dispatchEvent(new CustomEvent("app:resume"));
      } else {
        document.dispatchEvent(new CustomEvent("app:pause"));
      }
    });

    return () => {
      clearTimeout(splashTimer);
      backCleanupPromise.then((fn) => fn());
      stateCleanupPromise.then((fn) => fn());
    };
  }, []);
}

/**
 * Track keyboard visibility and height (iOS/Android).
 * Returns { visible, height } — always { false, 0 } on web.
 */
export function useKeyboard() {
  const [state, setState] = useState({ visible: false, height: 0 });

  useEffect(() => {
    if (!isNative) return;
    let cleanup: (() => void) | undefined;
    onKeyboardChange((visible, height) => setState({ visible, height })).then((fn) => {
      cleanup = fn;
    });
    return () => cleanup?.();
  }, []);

  return state;
}
