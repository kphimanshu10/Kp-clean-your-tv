# KP TV – Smart TV Launcher

**KP TV – Smart TV Launcher** is an ads-free, 16:9 neon glassmorphic Smart TV home screen and native Android Studio project engineered for the **Iconic Smart TV (32-inch, Cloud TV OS / AOSP)** and compatible Android TV devices.

---

## Key Features

1. **Preserved KP TV Neon Glassmorphism Design**:
   - **Header**: KP TV branding, live 12h/24h digital clock, current date, Wallpaper Studio button, Wi-Fi status, Settings, and Notifications.
   - **Left Sidebar**: Home, Apps, Settings, and About with electric-blue focus glow.
   - **Hero Cards**:
     - **Live TV**: Direct IPTV / HLS / MP4 stream player and native Android TV player launcher.
     - **Setopbox**: Hardware HDMI / AV port preference hub with safe `TvInputManager` detection and clear manual remote instructions (never pretends an unsupported HDMI switch succeeded).
     - **Live Cricket Score**: Real-time cricket score API client with loading, live, offline, error, and unconfigured (`"Live score service not configured."`) states. Zero hardcoded demo scores are shown as live scores.
   - **Preferred Application Dock**:
     1. **NetMirror TV** (launched if installed and trusted)
     2. **JioHotstar / Hotstar**
     3. **YouTube**
     4. **Airtel** (if installed)
     5. **+ More Apps** (opens the full Application Drawer; **Netflix** and **Prime Video** are preserved and never uninstalled)
2. **Complete TV Remote D-Pad Navigation**:
   - Supports `KEYCODE_DPAD_UP`, `KEYCODE_DPAD_DOWN`, `KEYCODE_DPAD_LEFT`, `KEYCODE_DPAD_RIGHT`, `KEYCODE_DPAD_CENTER`, `KEYCODE_ENTER`, and `KEYCODE_BACK` with repeat-key protection against accidental double activation.
3. **100% Ads-Free & Non-Destructive**:
   - Contains zero advertising SDKs, zero promotional banners, and zero telemetry.
   - Never disables the stock TV launcher or modifies system firmware.

---

## Repository Structure

- `/server.ts` — Express backend proxy (`/api/cricket/matches`, `/api/cricket/config`) that keeps private `CRICKET_API_KEY` credentials strictly on the server and out of frontend JavaScript bundles.
- `/src/` — React 19 + TypeScript + Tailwind CSS + Vite interactive TV launcher & Android Studio ZIP generator.
- `/android/` — Complete, standalone Android Studio project (`minSdk = 21`, `targetSdk = 34`, Gradle 8.4 Wrapper `gradlew` / `gradlew.bat` / `gradle-wrapper.jar`, Kotlin + ViewBinding + Leanback + Android 11+ `<queries>` package visibility).
- `WINDOWS_BUILD_GUIDE.md` — Step-by-step instructions to build the Debug and Release APKs on Windows or Linux.
- `TV_INSTALLATION_GUIDE.md` — Instructions for installing KP TV on the Iconic 32-inch Smart TV via USB drive or ADB over Wi-Fi.
- `TROUBLESHOOTING.md` — Solutions for Cloud TV OS quirks, remote focus, package visibility, and HDMI switching.
- `STOCK_LAUNCHER_RECOVERY_GUIDE.md` — Safe rollback commands to restore the factory stock launcher at any time.

---

## Web Project Commands

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run dev
```

## Android Project Build Commands

```bash
cd android
./gradlew assembleDebug
```
Output APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## Live Cricket Score Configuration (Server-Side Proxy Security)

Private API keys are **never** exposed in `VITE_*` frontend variables or bundled into client JavaScript:
- Copy `.env.example` to `.env` (or `.env.local`) and set server-only `CRICKET_API_URL` and `CRICKET_API_KEY="your_cricapi_key"`, **or**
- Click the **Live Cricket Score** card inside the launcher and enter a custom endpoint/key in the **Configure API** panel (forwarded securely via `/api/cricket/matches`).
- When no API is configured, the card honestly displays: `"Live score service not configured."`

