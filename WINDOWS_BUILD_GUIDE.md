# Windows PC Build Guide — KP TV Smart TV Launcher APK

Because cloud web containers do not bundle the multi-gigabyte Android SDK / `aapt2` / JDK 17 build toolchain, follow these exact commands on your **Windows 10 / 11 PC** to compile the installable **Debug APK** and **Release APK** from the `/android` folder (or from the downloaded `KP_TV_Smart_Launcher_Android_Project.zip`).

---

## 1. Prerequisites on Windows PC

1. **Install Android Studio** (Koala / Ladybug or newer):
   - Download from: `https://developer.android.com/studio`
   - During setup, ensure **Android SDK**, **Android SDK Platform 34**, and **Android SDK Build-Tools** are checked.
2. **Java Development Kit (JDK 17)**:
   - Android Studio includes an embedded JetBrains Runtime (JDK 17) at:
     `C:\Program Files\Android\Android Studio\jbr`

---

## 2. Option A: Build APK via Android Studio GUI (Recommended)

1. Open **Android Studio**.
2. Click **Open** and select the `android` folder inside this repository (or extract `KP_TV_Smart_Launcher_Android_Project.zip` and select that folder).
3. Wait for Gradle Sync to finish automatically.
4. From the top menu bar, click:
   - **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
5. Once complete, click **Locate** in the bottom-right notification pop-up.
6. Your APK files will be located at:
   - **Debug APK**: `android\app\build\outputs\apk\debug\app-debug.apk`
   - **Release APK**: `android\app\build\outputs\apk\release\app-release.apk`

---

## 3. Option B: Build APK via Windows PowerShell / Command Prompt

Open **PowerShell** on your Windows PC and run:

```powershell
# 1. Navigate to the Android project directory
cd path\to\Kp-clean-your-tv\android

# 2. Set JAVA_HOME to Android Studio's bundled JDK 17
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# 3. Validate Gradle configuration and build Debug & Release APKs
.\gradlew.bat assembleDebug assembleRelease
```

### Output APK Locations:
- **Debug APK**: `android\app\build\outputs\apk\debug\app-debug.apk`
- **Release APK**: `android\app\build\outputs\apk\release\app-release.apk`

---

## 4. Verify APK Signature & Manifest (Optional)

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\build-tools\34.0.0\apkanalyzer.bat" manifest print app\build\outputs\apk\release\app-release.apk
```
