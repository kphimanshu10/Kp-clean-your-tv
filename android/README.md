# KP TV – Smart TV Launcher (Android Studio Project)

Complete native Android Smart TV Launcher engineered for **Iconic Smart TV (32-inch, Cloud TV OS / AOSP)**.

## Build Instructions (Windows / macOS / Linux)
1. Open this folder in **Android Studio** (Hedgehog / Iguana / Jellyfish / Koala or newer).
2. Let Gradle sync `gradle/libs.versions.toml`.
3. Build Debug APK:
   ```bash
   ./gradlew assembleDebug
   ```
   Output APK: `app/build/outputs/apk/debug/app-debug.apk`
4. Build Release APK:
   ```bash
   ./gradlew assembleRelease
   ```
   Output APK: `app/build/outputs/apk/release/app-release.apk`
