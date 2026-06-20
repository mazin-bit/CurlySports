# Curly Sports — Development & Execution Guide

This document outlines the commands and steps required to run the **Curly Sports** application across Web, iOS, and Android platforms.

---

## 1. Running the Web Application (Next.js)

The web app serves as both the main website and the backend API (including Supabase middleware and sports ingestion endpoints).

### **First-time Setup**
Install all packages and generate the Prisma Client:
```bash
# In the root directory (CurlySports)
npm install
```

### **Start the Web App**
The mobile application is pre-configured to fetch data from the web app on port **`3001`** during local development. Run Next.js explicitly on port `3001`:
```bash
# In the root directory (CurlySports)
npm run dev -- -p 3001
```
* **URL:** `http://localhost:3001`
* **Mobile endpoint:** `http://localhost:3001/mobile`

---

## 2. Running the Mobile Application (Expo)

The mobile application is located in the `/native` subdirectory. It is built using **Expo** (React Native).

### **First-time Setup**
Install the mobile dependencies:
```bash
# Navigate to the native folder
cd native

# Install dependencies
npm install
```

### **Option A: Run on iOS Simulator (macOS)**
To build and launch the app in the Apple iOS Simulator:
```bash
# In the native directory
npm run ios
```
*Xcode must be installed on your Mac.*

### **Option B: Run on Android Emulator**
1. Open Android Studio and launch a virtual device (AVD).
2. Run the following command:
```bash
# In the native directory
npm run android
```

### **Option C: Run on Physical Device (iOS & Android)**
Testing on a real phone via the **Expo Go** app:
1. Download **Expo Go** from the Google Play Store or iOS App Store.
2. Start the development server:
   ```bash
   # In the native directory
   npm start
   ```
3. Scan the QR code printed in the terminal:
   * **iOS:** Scan using the default Camera app.
   * **Android:** Scan using the Expo Go app.

---

## 3. Useful Developer Tips

### **Connecting Android Emulator to Local Web Server**
Because Android runs in a virtual sandbox, it cannot access `localhost` on your Mac directly. To bridge port `3001` so that the Android WebView can connect to the local Next.js server, run the following command while the emulator is active:
```bash
adb reverse tcp:3001 tcp:3001
```

### **Expo CLI Terminal Shortcuts**
When the Expo dev server is running, you can press these keys in your terminal to control it:
* `r` — Reload the app.
* `d` — Open the Developer Menu.
* `shift + i` — Open/reload iOS simulator.
* `shift + a` — Open/reload Android emulator.
