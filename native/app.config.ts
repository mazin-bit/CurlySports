import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  // WEB_APP_URL is set per build profile in eas.json:
  //   preview  → http://192.168.110.0:3001/mobile  (local dev server)
  //   production → https://curlysports.com/mobile   (live site)
  const webAppUrl =
    process.env.WEB_APP_URL ?? "https://curlysports.com/mobile";

  return {
    ...config,
    name: "Curly Sports",
    slug: "curly-sports",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    scheme: "curlysports",
    backgroundColor: "#07090b",
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.curlysports.app",
      backgroundColor: "#07090b",
      infoPlist: {
        UIBackgroundModes: ["remote-notification"],
      },
    },
    android: {
      package: "com.curlysports.app",
      adaptiveIcon: {
        backgroundColor: "#07090b",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      permissions: ["INTERNET", "VIBRATE", "RECEIVE_BOOT_COMPLETED"],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "./plugins/withCleartextTraffic",
      "expo-status-bar",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#07090b",
          image: "./assets/splash-icon.png",
          imageWidth: 200,
        },
      ],
      "expo-sharing",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#c8ff3d",
        },
      ],
    ],
    extra: {
      webAppUrl,
      eas: {
        projectId: "d2ef5637-3a9b-4da4-a42c-6847e2f3d5de",
      },
    },
  };
};
