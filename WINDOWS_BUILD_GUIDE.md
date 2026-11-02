# Windows & Linux Build Guide — KP TV Smart TV Launcher APK

The repository's `/android` folder (and the downloadable `KP_TV_Smart_Launcher_Android_Project.zip`) includes the complete, official **Gradle 8.4 Wrapper** (`gradlew`, `gradlew.bat`, and `gradle/wrapper/gradle-wrapper.jar`) configured for **Android Gradle Plugin 8.2.2**, **Kotlin 1.9.22**, and **JDK 17**.

---

## 1. Prerequisites on Windows PC

1. **Install Android Studio** (Koala / Ladybug or newer):
   - Download from: `https://developer.android.com/studio`
   - During setup, ensure **Android SDK**, **Android SDK Platform 34**, and **Android SDK Build-Tools 34.0.0** are checked.
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
   - **Release APK**: `android\app\build\outputs\apk\release\app-release-unsigned.apk`

---

## 3. Option B: Build APK via Windows PowerShell / Command Prompt

Open **PowerShell** on your Windows PC and run:

```powershell
# 1. Navigate to the Android project directory
cd path\to\Kp-clean-your-tv\android

# 2. Set JAVA_HOME to Android Studio's bundled JDK 17 and ANDROID_HOME to your Android SDK
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# 3. Validate Gradle wrapper and build the installable Debug APK
.\gradlew.bat --version
.\gradlew.bat assembleDebug
```

### Linux / macOS Terminal Commands:

```bash
cd android
chmod +x gradlew
./gradlew --version
./gradlew assembleDebug
```

### Output APK Location:
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 4. Verify APK Signature & Manifest (Optional)

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\build-tools\34.0.0\apkanalyzer.bat" manifest print app\build\outputs\apk\debug\app-debug.apk
```

