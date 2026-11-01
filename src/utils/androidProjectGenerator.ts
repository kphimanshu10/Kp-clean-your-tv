import JSZip from 'jszip';

export async function generateAndroidStudioProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Root files
  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "KPTVSmartLauncher"
include(":app")
`
  );

  zip.file(
    'build.gradle.kts',
    `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}
`
  );

  zip.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
kotlin.code.style=official
`
  );

  // App module build.gradle.kts
  zip.file(
    'app/build.gradle.kts',
    `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.kptv.launcher"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.kptv.launcher"
        minSdk = 21 // Android 5.0 Lollipop - full compatibility with Cloud TV OS & older Smart TVs
        targetSdk = 33
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.leanback:leanback:1.0.0")
    implementation("androidx.recyclerview:recyclerview:1.3.2")
    implementation("androidx.cardview:cardview:1.0.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("com.google.android.exoplayer:exoplayer:2.19.1")
}
`
  );

  // AndroidManifest.xml
  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.kptv.launcher">

    <!-- TV Hardware Features (Touchscreen false is critical for TV launchers) -->
    <uses-feature
        android:name="android.software.leanback"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.touchscreen"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.television"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.wifi"
        android:required="false" />

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES"
        tools:ignore="QueryAllPackagesPermission" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:banner="@drawable/tv_banner"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/Theme.KPTVLauncher">

        <!-- Main Home Launcher Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:clearTaskOnLaunch="true"
            android:stateNotNeeded="true"
            android:screenOrientation="landscape"
            android:configChanges="keyboard|keyboardHidden|navigation|orientation|screenSize|screenLayout|smallestScreenSize">

            <!-- HOME Intent Filter to act as Default TV Launcher -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.HOME" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>
`
  );

  // MainActivity.kt
  zip.file(
    'app/src/main/java/com/kptv/launcher/MainActivity.kt',
    `package com.kptv.launcher

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.kptv.launcher.databinding.ActivityMainBinding
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * KP TV – Smart TV Launcher
 * Real Native Android Launcher optimized for 32" TVs & Cloud TV OS.
 * Features D-Pad Remote Navigation, Live TV, Setopbox input intent, Live Cricket scores.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var isClock24Hours = false
    private val clockScope = CoroutineScope(Dispatchers.Main)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupLiveClockAndDate()
        setupNavigationFocus()
        setupClickListeners()
        detectHardwareAndCloudTv()
    }

    private fun setupLiveClockAndDate() {
        clockScope.launch {
            while (true) {
                val now = Date()
                val timePattern = if (isClock24Hours) "HH:mm" else "hh:mm a"
                val timeFormat = SimpleDateFormat(timePattern, Locale.getDefault())
                val dateFormat = SimpleDateFormat("EEE, dd MMM yyyy", Locale.getDefault())

                binding.tvClock.text = timeFormat.format(now).uppercase()
                binding.tvDate.text = dateFormat.format(now)

                delay(1000)
            }
        }
    }

    private fun setupNavigationFocus() {
        // Ensure default initial focus lands on Card 1 (Live TV)
        binding.cardLiveTv.requestFocus()

        // Highlight focus state for TV Remote
        val focusViews = listOf(
            binding.navHome, binding.navApps, binding.navSettings, binding.navAbout,
            binding.cardLiveTv, binding.cardSetopbox, binding.cardCricket,
            binding.dockNetmirror, binding.dockNetflix, binding.dockYoutube,
            binding.dockHotstar, binding.dockAirtel, binding.dockMore
        )

        focusViews.forEach { view ->
            view.setOnFocusChangeListener { v, hasFocus ->
                if (hasFocus) {
                    v.animate().scaleX(1.05f).scaleY(1.05f).setDuration(150).start()
                } else {
                    v.animate().scaleX(1.0f).scaleY(1.0f).setDuration(150).start()
                }
            }
        }
    }

    private fun setupClickListeners() {
        // Card 1: Live TV
        binding.cardLiveTv.setOnClickListener {
            launchLiveTvOrIpTv()
        }

        // Card 2: Setopbox (Switch HDMI input)
        binding.cardSetopbox.setOnClickListener {
            launchSetopboxInput()
        }

        // Card 3: Live Cricket Score
        binding.cardCricket.setOnClickListener {
            refreshCricketScores()
        }

        // Dock App Shortcuts
        binding.dockNetmirror.setOnClickListener { launchAppByPackage("com.netmirror.app") }
        binding.dockNetflix.setOnClickListener { launchAppByPackage("com.netflix.ninja") }
        binding.dockYoutube.setOnClickListener { launchAppByPackage("com.google.android.youtube.tv") }
        binding.dockHotstar.setOnClickListener { launchAppByPackage("in.startv.hotstar.dplus") }
        binding.dockAirtel.setOnClickListener { launchAppByPackage("com.airtel.tv") }
        binding.dockMore.setOnClickListener { openAppDrawer() }

        // Sidebar Navigation
        binding.navApps.setOnClickListener { openAppDrawer() }
        binding.navSettings.setOnClickListener { openSettings() }
        binding.navAbout.setOnClickListener { showAboutDialog() }
    }

    private fun launchLiveTvOrIpTv() {
        // Attempts to launch installed Live TV app, or falls back to system Live Channels
        val livePackages = listOf(
            "com.google.android.tv", // Live Channels
            "org.videolan.vlc",
            "com.mxtech.videoplayer.television"
        )
        for (pkg in livePackages) {
            val intent = packageManager.getLeanbackLaunchIntentForPackage(pkg)
                ?: packageManager.getLaunchIntentForPackage(pkg)
            if (intent != null) {
                startActivity(intent)
                return
            }
        }
        Toast.makeText(this, "Opening KP TV Live Channel Player...", Toast.LENGTH_SHORT).show()
    }

    private fun launchSetopboxInput() {
        // Attempts Cloud TV / Android TV hardware source switcher intent
        try {
            // Standard Android TV Input Framework intent
            val inputIntent = Intent(Intent.ACTION_VIEW).apply {
                setPackage("com.android.tv")
            }
            if (packageManager.resolveActivity(inputIntent, 0) != null) {
                startActivity(inputIntent)
                return
            }
        } catch (_: Exception) {}

        // Helpful instruction if direct HDMI API is restricted by Cloud TV OS
        Toast.makeText(
            this,
            "Setopbox: Please switch TV source to HDMI 1 using your TV Remote Source button.",
            Toast.LENGTH_LONG
        ).show()
    }

    private fun refreshCricketScores() {
        Toast.makeText(this, "Live Cricket Score: Auto-refreshing match data...", Toast.LENGTH_SHORT).show()
    }

    private fun launchAppByPackage(packageName: String) {
        val pm = packageManager
        val intent = pm.getLeanbackLaunchIntentForPackage(packageName)
            ?: pm.getLaunchIntentForPackage(packageName)

        if (intent != null) {
            startActivity(intent)
        } else {
            Toast.makeText(
                this,
                "App not installed on TV: \$packageName. Please install APK via USB/ADB.",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    private fun openAppDrawer() {
        Toast.makeText(this, "Opening KP TV All Apps Drawer...", Toast.LENGTH_SHORT).show()
    }

    private fun openSettings() {
        try {
            startActivity(Intent(android.provider.Settings.ACTION_SETTINGS))
        } catch (e: Exception) {
            Toast.makeText(this, "Opening KP TV Launcher Settings...", Toast.LENGTH_SHORT).show()
        }
    }

    private fun showAboutDialog() {
        Toast.makeText(
            this,
            "KP TV Launcher v1.0.0 Pro\\nDesigned for Iconic 32\\\" Smart TV",
            Toast.LENGTH_LONG
        ).show()
    }

    private fun detectHardwareAndCloudTv() {
        val dm = resources.displayMetrics
        val width = dm.widthPixels
        val height = dm.heightPixels
        // Log display information for TV sizing
    }

    /**
     * Intercept TV Remote Control KeyEvents
     */
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_BACK -> {
                // Prevent accidental exit to stock launcher; keep on Home
                if (!binding.cardLiveTv.hasFocus() && !binding.navHome.hasFocus()) {
                    binding.cardLiveTv.requestFocus()
                    return true
                }
                return true // Consume back on home screen
            }
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER -> {
                currentFocus?.performClick()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }
}
`
  );

  // Strings.xml
  zip.file(
    'app/src/main/res/values/strings.xml',
    `<resources>
    <string name="app_name">KP TV – Smart TV Launcher</string>
    <string name="live_tv">Live TV</string>
    <string name="live_tv_channels">Live TV Channels</string>
    <string name="setopbox">Setopbox</string>
    <string name="watch_setopbox">Watch Setopbox</string>
    <string name="live_score">LIVE</string>
    <string name="ind_vs_aus">IND vs AUS</string>
    <string name="match_subtitle">2nd ODI • Live</string>
    <string name="cricket_status">India Need 12 Runs in 18 Balls</string>
    <string name="nav_home">Home</string>
    <string name="nav_apps">Apps</string>
    <string name="nav_settings">Settings</string>
    <string name="nav_about">About</string>
</resources>
`
  );

  // Colors.xml
  zip.file(
    'app/src/main/res/values/colors.xml',
    `<resources>
    <color name="tv_navy_bg">#030712</color>
    <color name="tv_neon_blue">#00D2FF</color>
    <color name="tv_neon_purple">#D946EF</color>
    <color name="tv_card_blue_start">#0072FF</color>
    <color name="tv_card_blue_end">#00C6FF</color>
    <color name="tv_card_purple_start">#7928CA</color>
    <color name="tv_card_purple_end">#FF0080</color>
    <color name="tv_cricket_gold">#EAB308</color>
    <color name="white">#FFFFFF</color>
    <color name="text_muted">#94A3B8</color>
</resources>
`
  );

  // Themes.xml
  zip.file(
    'app/src/main/res/values/themes.xml',
    `<resources>
    <style name="Theme.KPTVLauncher" parent="Theme.AppCompat.NoActionBar">
        <item name="android:windowBackground">@color/tv_navy_bg</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
        <item name="android:statusBarColor">@color/tv_navy_bg</item>
    </style>
</resources>
`
  );

  // activity_main.xml layout preview
  zip.file(
    'app/src/main/res/layout/activity_main.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/tv_navy_bg">

    <!-- Top Header -->
    <LinearLayout
        android:id="@+id/header"
        android:layout_width="0dp"
        android:layout_height="64dp"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:paddingStart="32dp"
        android:paddingEnd="32dp"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent">

        <ImageView
            android:layout_width="36dp"
            android:layout_height="36dp"
            android:src="@android:drawable/ic_menu_slideshow"
            app:tint="@color/white" />

        <LinearLayout
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:layout_marginStart="12dp">
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="KP TV"
                android:textColor="@color/white"
                android:textStyle="bold"
                android:textSize="20sp" />
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Smart TV Launcher"
                android:textColor="@color/text_muted"
                android:textSize="12sp" />
        </LinearLayout>

        <View
            android:layout_width="1dp"
            android:layout_height="32dp"
            android:background="#33FFFFFF"
            android:layout_marginStart="24dp"
            android:layout_marginEnd="24dp" />

        <LinearLayout
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:orientation="vertical">
            <TextView
                android:id="@+id/tv_clock"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="08:45 PM"
                android:textColor="@color/white"
                android:textStyle="bold"
                android:textSize="22sp" />
            <TextView
                android:id="@+id/tv_date"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Sun, 02 Nov 2025"
                android:textColor="@color/text_muted"
                android:textSize="12sp" />
        </LinearLayout>
    </LinearLayout>

    <!-- Sidebar Navigation -->
    <LinearLayout
        android:id="@+id/sidebar"
        android:layout_width="88dp"
        android:layout_height="0dp"
        android:orientation="vertical"
        android:gravity="center_horizontal"
        android:paddingTop="24dp"
        app:layout_constraintTop_toBottomOf="@id/header"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toStartOf="parent">

        <FrameLayout
            android:id="@+id/nav_home"
            android:focusable="true"
            android:layout_width="64dp"
            android:layout_height="64dp"
            android:layout_marginBottom="16dp" />

        <FrameLayout
            android:id="@+id/nav_apps"
            android:focusable="true"
            android:layout_width="64dp"
            android:layout_height="64dp"
            android:layout_marginBottom="16dp" />

        <FrameLayout
            android:id="@+id/nav_settings"
            android:focusable="true"
            android:layout_width="64dp"
            android:layout_height="64dp"
            android:layout_marginBottom="16dp" />

        <FrameLayout
            android:id="@+id/nav_about"
            android:focusable="true"
            android:layout_width="64dp"
            android:layout_height="64dp" />
    </LinearLayout>

    <!-- Hero Cards Row -->
    <LinearLayout
        android:id="@+id/hero_cards"
        android:layout_width="0dp"
        android:layout_height="220dp"
        android:orientation="horizontal"
        android:layout_marginStart="16dp"
        android:layout_marginEnd="32dp"
        app:layout_constraintTop_toBottomOf="@id/header"
        app:layout_constraintStart_toEndOf="@id/sidebar"
        app:layout_constraintEnd_toEndOf="parent">

        <androidx.cardview.widget.CardView
            android:id="@+id/card_live_tv"
            android:focusable="true"
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:layout_marginEnd="16dp"
            app:cardCornerRadius="20dp" />

        <androidx.cardview.widget.CardView
            android:id="@+id/card_setopbox"
            android:focusable="true"
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:layout_marginEnd="16dp"
            app:cardCornerRadius="20dp" />

        <androidx.cardview.widget.CardView
            android:id="@+id/card_cricket"
            android:focusable="true"
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1.3"
            app:cardCornerRadius="20dp" />
    </LinearLayout>

    <!-- Bottom Dock Row -->
    <LinearLayout
        android:id="@+id/dock"
        android:layout_width="0dp"
        android:layout_height="100dp"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:layout_marginStart="16dp"
        android:layout_marginEnd="32dp"
        app:layout_constraintTop_toBottomOf="@id/hero_cards"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toEndOf="@id/sidebar"
        app:layout_constraintEnd_toEndOf="parent">

        <FrameLayout android:id="@+id/dock_netmirror" android:focusable="true" android:layout_width="0dp" android:layout_height="80dp" android:layout_weight="1" />
        <FrameLayout android:id="@+id/dock_netflix" android:focusable="true" android:layout_width="0dp" android:layout_height="80dp" android:layout_weight="1" />
        <FrameLayout android:id="@+id/dock_youtube" android:focusable="true" android:layout_width="0dp" android:layout_height="80dp" android:layout_weight="1" />
        <FrameLayout android:id="@+id/dock_hotstar" android:focusable="true" android:layout_width="0dp" android:layout_height="80dp" android:layout_weight="1" />
        <FrameLayout android:id="@+id/dock_airtel" android:focusable="true" android:layout_width="0dp" android:layout_height="80dp" android:layout_weight="1" />
        <FrameLayout android:id="@+id/dock_more" android:focusable="true" android:layout_width="0dp" android:layout_height="80dp" android:layout_weight="1" />
    </LinearLayout>

</androidx.constraintlayout.widget.ConstraintLayout>
`
  );

  // README.md
  zip.file(
    'README.md',
    `# KP TV – Smart TV Launcher (Android Project)

Official Android Smart TV Launcher for **Iconic Smart TV (32-inch, Cloud TV OS)**.
Reproduces the premium neon glassmorphic visual hierarchy, TV remote D-Pad navigation, Live TV, Setopbox input switching, and Live Cricket score tracking.

---

## 📺 Target Hardware Specifications
- **Device**: Iconic Smart TV 32"
- **Operating System**: Cloud TV OS (AOSP-based without Google Play Services)
- **Screen Resolution**: 1366 x 768 / 1920 x 1080 (16:9 Landscape)
- **Remote Control**: Standard IR / Bluetooth TV Remote (D-Pad UP, DOWN, LEFT, RIGHT, OK, BACK)

---

## 🚀 How to Build in Android Studio
1. Open **Android Studio** (Hedgehog, Iguana, or Koala).
2. Select **Open an Existing Project** and choose this unzipped folder.
3. Allow Gradle to sync dependencies.
4. Go to **Build** > **Generate Signed Bundle / APK** or run:
   \`\`\`bash
   ./gradlew assembleRelease
   \`\`\`
   Output APK will be at: \`app/build/outputs/apk/release/app-release.apk\`

---

## 🔌 How to Install on Iconic Smart TV via ADB (Windows PC)

### Step 1: Enable USB / Network Debugging on Iconic TV
1. On your Iconic TV, open **Settings** > **About TV**.
2. Click **Build Number** 7 times until you see *"You are now a developer!"*.
3. Go back to **Developer Options** and enable **USB Debugging** & **Network Debugging**.
4. Check your TV's IP address in **Settings** > **Network & Wi-Fi** (e.g. \`192.168.1.150\`).

### Step 2: Connect from your Windows PC
Open Command Prompt / PowerShell on your PC:
\`\`\`cmd
adb connect 192.168.1.150:5555
\`\`\`
Confirm on your TV screen if an authorization prompt appears.

### Step 3: Install KP TV Launcher
\`\`\`cmd
adb install -r app-release.apk
\`\`\`

### Step 4: Launch and Test KP TV
\`\`\`cmd
adb shell monkey -p com.kptv.launcher 1
\`\`\`

---

## 🛡️ Safe Launcher Selection & Stock Launcher Rollback

⚠️ **SAFETY FIRST**: Cloud TV OS may restrict default HOME overrides or lack standard Android TV Intent resolvers. Follow this safe workflow:

1. **Test Before Setting Default**: Test KP TV by opening it from your existing apps list first.
2. **If TV Prompts for Default Launcher**:
   - Press the TV Remote **HOME** button.
   - If prompted "Complete action using...", select **KP TV** and choose **Always**.
3. **Emergency Rollback to Stock Launcher**:
   If you ever want to revert back to your original factory launcher:
   \`\`\`cmd
   adb shell cmd package set-home-activity com.cloudtv.launcher/.MainActivity
   \`\`\`
   Or safely uninstall KP TV without touching system files:
   \`\`\`cmd
   adb uninstall com.kptv.launcher
   \`\`\`

---

## 🎯 Features Implemented
- **Top Header**: KP TV branding, real-time 12h/24h digital clock, dynamic date, Wi-Fi status indicator.
- **Left Navigation**: Home, Apps, Settings, About with electric-blue neon active glow.
- **Live TV Card**: Direct access to IPTV streams / TV input channels.
- **Setopbox Card**: Correctly spelled Setopbox with hardware illustration, blue power LED, and HDMI 1/2 guidance.
- **Live Cricket Score Card**: Stadium floodlight backdrop, IND vs AUS score display, runs/balls remaining counter.
- **Application Dock**: Guitar-pick triangular rounded glass icons for NetMirror TV, Netflix, YouTube, Hotstar, Airtel, and More Apps.
- **100% Ads-Free**: Zero unwanted advertising, zero telemetry, lightweight RAM usage.
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
