# Troubleshooting Guide — KP TV Smart TV Launcher

## 1. Installed Apps Not Showing in App Drawer (Android 11+ / API 30+)
- **Cause**: Android 11 and later restrict package visibility unless `<queries>` is declared in `AndroidManifest.xml`.
- **Fix Applied**: `app/src/main/AndroidManifest.xml` includes explicit `<queries>` blocks for both `android.intent.category.LAUNCHER` and `android.intent.category.LEANBACK_LAUNCHER` under `android.intent.action.MAIN`, allowing `PackageManager.queryIntentActivities()` to detect all launchable TV and standard Android apps without requiring the restricted `QUERY_ALL_PACKAGES` permission.

## 2. Pressing HOME Button Always Opens the Stock Cloud TV Launcher
- **Cause**: Some Cloud TV OS builds hardcode the HOME key in firmware to launch `com.cloudtv.launcher` or `com.mstar.tv.launcher` without showing the standard Android chooser dialog.
- **Workaround**:
  1. Keep KP TV pinned as the first shortcut in your TV's quick-launch bar, **or**
  2. Check if your TV supports `cmd role` / `set-home-activity` via ADB (without disabling the stock launcher):
     ```powershell
     adb shell cmd package set-home-activity com.kptv.launcher/.MainActivity
     ```

## 3. Setopbox Card Does Not Automatically Switch HDMI Input
- **Cause**: On many AOSP / Cloud TV boards (MStar, Amlogic, Realtek), hardware HDMI switching requires `android.permission.TV_INPUT_HARDWARE` (a system/signature-only permission granted only to firmware apps).
- **Behavior**: KP TV first checks if a documented system TV Input activity (`com.android.tv` / `TvInputManager`) is accessible. If the firmware blocks third-party HDMI switching, KP TV **never pretends the input was switched**—instead, it displays clear manual instructions to press the physical **SOURCE / INPUT** button on your TV remote.

## 4. Live Cricket Score Shows "Live score service not configured."
- **Cause**: Hardcoded demo scores have been removed so fake scores are never presented as live scores, and private API keys are never exposed in frontend `VITE_*` variables or source control.
- **Solution**: Set `CRICKET_API_URL` and `CRICKET_API_KEY` in `.env` on the server (proxied via `/api/cricket/matches`), or click the **Live Cricket Score** card in the launcher, choose **Configure API**, and enter your endpoint and key.

## 5. Missing Resource / Gradle Wrapper / Plugin Errors in Android Studio
- **Cause**: Previously, `gradlew`, `gradlew.bat`, `gradle-wrapper.jar`, `gradle/libs.versions.toml`, `@drawable/tv_banner`, and `@mipmap/ic_launcher` were missing from the generated project.
- **Fix Applied**: Official Gradle 8.4 wrapper files (`gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar`), version catalogs, adaptive icons, vector drawables, and TV banner resources are now included and verified with `./gradlew assembleDebug`.

