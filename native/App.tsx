import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  StatusBar,
  Platform,
  BackHandler,
  ActivityIndicator,
  Text,
  AppState,
} from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import * as Sharing from "expo-sharing";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

// Keep splash visible while we load
SplashScreen.preventAutoHideAsync();

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// URL is set at build time via eas.json env vars → app.config.ts → extra.webAppUrl
//   preview build  → http://192.168.110.0:3001/mobile  (your local dev server)
//   production build → https://curlysports.com/mobile   (live deployed site)
const BASE_URL =
  Constants.expoConfig?.extra?.webAppUrl ?? "https://curlysports.com/mobile";

// ─── JS injected into the WebView to set up the native bridge ───────────────
const BRIDGE_JS = `
(function() {
  if (window.__CURLY_NATIVE__) return;
  window.__CURLY_NATIVE__ = true;
  window.CurlyNative = {
    platform: '${Platform.OS}',
    isNative: true,
    postMessage: function(type, data) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data || {} }));
    },
    haptic: function(style) { this.postMessage('haptic', { style: style || 'medium' }); },
    hapticNotification: function(type) { this.postMessage('hapticNotification', { type: type || 'success' }); },
    share: function(opts) { this.postMessage('share', opts); },
    openExternal: function(url) { this.postMessage('openExternal', { url: url }); },
    requestPush: function() { this.postMessage('requestPush'); },
    secureSet: function(key, value) { this.postMessage('secureSet', { key: key, value: value }); },
    secureGet: function(key) { this.postMessage('secureGet', { key: key }); },
    secureDelete: function(key) { this.postMessage('secureDelete', { key: key }); },
  };
  // Notify web app that native bridge is ready
  window.dispatchEvent(new Event('curly:native-ready'));
  true;
})();
`;

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Splash screen ─────────────────────────────────────────
  const onWebViewLoad = useCallback(async () => {
    setIsReady(true);
    await SplashScreen.hideAsync();
  }, []);

  // ── Intercept external URLs → open in system browser ────
  const appHost = (() => {
    try { return new URL(BASE_URL).host; } catch { return "curlysports.com"; }
  })();

  const onShouldStartLoadWithRequest = useCallback(
    (request: { url: string; navigationType: string }) => {
      const { url, navigationType } = request;
      // Allow javascript:, about:, data: schemes
      if (!url.startsWith("http://") && !url.startsWith("https://")) return true;
      try {
        const host = new URL(url).host;
        // Allow same-host navigation (app pages)
        if (host === appHost || host === "localhost" || host.startsWith("192.168.") || host.startsWith("10.") || host === "0.0.0.0") {
          return true;
        }
        // On iOS, onShouldStartLoadWithRequest fires for ALL requests (scripts,
        // images, fonts, analytics, etc.) — not just link taps. Only open
        // external URLs in the system browser for user-initiated navigations.
        if (navigationType === "click" || navigationType === "formsubmit") {
          Linking.openURL(url);
          return false;
        }
        // Allow subresource loads (scripts, images, fonts, iframes) in WebView
        return true;
      } catch {
        return true;
      }
    },
    [appHost]
  );

  // ── Android back button ───────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const handler = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false; // let system handle (exit app)
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", handler);
    return () => sub.remove();
  }, [canGoBack]);

  // ── App state (foreground/background) ─────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `window.dispatchEvent(new Event('curly:app-resume')); true;`
        );
      }
    });
    return () => sub.remove();
  }, []);

  // ── Push notification tap → navigate in WebView ──────────
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.url && webViewRef.current) {
          webViewRef.current.injectJavaScript(
            `window.location.href = '${data.url}'; true;`
          );
        }
      }
    );
    return () => sub.remove();
  }, []);

  // ── Handle messages from WebView ──────────────────────────
  const onMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as {
        type: string;
        data: Record<string, string>;
      };

      switch (msg.type) {
        case "haptic": {
          const map: Record<string, Haptics.ImpactFeedbackStyle> = {
            light: Haptics.ImpactFeedbackStyle.Light,
            medium: Haptics.ImpactFeedbackStyle.Medium,
            heavy: Haptics.ImpactFeedbackStyle.Heavy,
          };
          await Haptics.impactAsync(
            map[msg.data.style] ?? Haptics.ImpactFeedbackStyle.Medium
          );
          break;
        }

        case "hapticNotification": {
          const nMap: Record<string, Haptics.NotificationFeedbackType> = {
            success: Haptics.NotificationFeedbackType.Success,
            warning: Haptics.NotificationFeedbackType.Warning,
            error: Haptics.NotificationFeedbackType.Error,
          };
          await Haptics.notificationAsync(
            nMap[msg.data.type] ?? Haptics.NotificationFeedbackType.Success
          );
          break;
        }

        case "share":
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(msg.data.url ?? "", {
              dialogTitle: msg.data.title,
            });
          }
          break;

        case "openExternal":
          if (msg.data.url) await Linking.openURL(msg.data.url);
          break;

        case "requestPush": {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status === "granted") {
            const token = await Notifications.getExpoPushTokenAsync();
            webViewRef.current?.injectJavaScript(
              `window.dispatchEvent(new CustomEvent('curly:push-token', { detail: '${token.data}' })); true;`
            );
          }
          break;
        }

        case "secureSet":
          await SecureStore.setItemAsync(msg.data.key, msg.data.value);
          break;

        case "secureGet": {
          const val = await SecureStore.getItemAsync(msg.data.key);
          webViewRef.current?.injectJavaScript(
            `window.dispatchEvent(new CustomEvent('curly:secure-value', { detail: { key: '${msg.data.key}', value: ${val ? `'${val}'` : "null"} } })); true;`
          );
          break;
        }

        case "secureDelete":
          await SecureStore.deleteItemAsync(msg.data.key);
          break;
      }
    } catch {
      // ignore malformed messages
    }
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#07090b"
        translucent={false}
      />

      {loadError ? (
        <View style={styles.loading}>
          <Text style={{ color: "#ff6b6b", fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
            Connection Error
          </Text>
          <Text style={{ color: "#aaa", fontSize: 13, textAlign: "center", marginBottom: 4, paddingHorizontal: 32 }}>
            Could not connect to server
          </Text>
          <Text style={{ color: "#666", fontSize: 11, textAlign: "center", marginBottom: 20, paddingHorizontal: 32 }}>
            {BASE_URL}{"\n"}{loadError}
          </Text>
          <Text
            style={{ color: "#c8ff3d", fontSize: 14, fontWeight: "700" }}
            onPress={() => { setLoadError(null); webViewRef.current?.reload(); }}
          >
            TAP TO RETRY
          </Text>
        </View>
      ) : null}
      <WebView
        ref={webViewRef}
        source={{ uri: BASE_URL }}
        style={[styles.webview, loadError ? { display: "none" } : undefined]}
        injectedJavaScript={BRIDGE_JS}
        onMessage={onMessage}
        onLoad={() => { setLoadError(null); onWebViewLoad(); }}
        onError={(e) => {
          const { description, code, url } = e.nativeEvent;
          setLoadError(`${description || "Unknown error"} (code: ${code || "?"})`);
        }}
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 500) {
            setLoadError(`Server error: ${e.nativeEvent.statusCode}`);
          }
        }}
        onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        // Performance
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => <LoadingView />}
        // Security
        originWhitelist={["https://*", "http://*"]}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        // iOS
        allowsBackForwardNavigationGestures
        contentMode="mobile"
        // Android
        mixedContentMode="compatibility"
        setSupportMultipleWindows={false}
        overScrollMode="never"
      />
    </View>
  );
}

function LoadingView() {
  return (
    <View style={styles.loading}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>C</Text>
      </View>
      <Text style={styles.brandName}>
        curly<Text style={{ color: "#ff5b3d" }}>.</Text>sports
      </Text>
      <View style={{ flexDirection: "row", gap: 6, marginTop: 24 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#c8ff3d",
              opacity: 0.5,
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07090b",
  },
  webview: {
    flex: 1,
    backgroundColor: "#07090b",
  },
  loading: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#07090b",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: "#c8ff3d",
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-6deg" }],
    shadowColor: "#c8ff3d",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#07090b",
    transform: [{ rotate: "6deg" }],
  },
  brandName: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: "900",
    color: "#fffdf7",
    letterSpacing: -0.5,
  },
});
