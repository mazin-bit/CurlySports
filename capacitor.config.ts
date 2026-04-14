import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.curlysports.app',
  appName: 'Curly Sports',
  webDir: 'build-mobile',
  server: {
    url: 'https://curlysports.com',
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0e1a',
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0a0e1a',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'App',
  },
  android: {
    backgroundColor: '#0a0e1a',
  },
};

export default config;
