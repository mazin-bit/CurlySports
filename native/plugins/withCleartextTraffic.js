const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Expo config plugin to ensure cleartext (HTTP) traffic is allowed on Android.
 * This sets android:usesCleartextTraffic="true" on the <application> element
 * in AndroidManifest.xml, which is required for WebView to load HTTP URLs
 * on Android 9+ (API 28+).
 */
module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    if (app) {
      app.$["android:usesCleartextTraffic"] = "true";
    }
    return config;
  });
};
