"use client";

import { useEffect, useState } from "react";
import {
  isNative,
  isIOS,
  isAndroid,
  platform,
  onAppResume,
  onNativeReady,
} from "@/lib/native";

/** Returns platform info. Safe on web (isNative = false). */
export function usePlatform() {
  return { isNative, isIOS, isAndroid, platform };
}

/**
 * Runs a callback when the Expo native bridge is ready.
 * No-ops on web.
 */
export function useNativeReady(cb: () => void) {
  useEffect(() => {
    return onNativeReady(cb);
  }, [cb]);
}

/**
 * Runs a callback each time the app resumes from background.
 * Works in native shell only.
 */
export function useAppResume(cb: () => void) {
  useEffect(() => {
    return onAppResume(cb);
  }, [cb]);
}

/**
 * Track whether running in native shell.
 * Returns false initially on SSR, true once bridge injects.
 */
export function useIsNative() {
  const [native, setNative] = useState(false);
  useEffect(() => {
    if (isNative) {
      setNative(true);
      return;
    }
    return onNativeReady(() => setNative(true));
  }, []);
  return native;
}
