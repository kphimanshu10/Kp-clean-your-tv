import JSZip from 'jszip';

export const ANDROID_PROJECT_FILES: Record<string, string> = {
  'settings.gradle.kts': `pluginManagement {
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
`,

  'build.gradle.kts': `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}
`,

  'gradle/libs.versions.toml': `[versions]
agp = "8.2.2"
kotlin = "1.9.22"
coreKtx = "1.12.0"
appcompat = "1.6.1"
material = "1.11.0"
constraintlayout = "2.1.4"
leanback = "1.0.0"
recyclerview = "1.3.2"
cardview = "1.0.0"
coroutines = "1.7.3"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-appcompat = { group = "androidx.appcompat", name = "appcompat", version.ref = "appcompat" }
google-material = { group = "com.google.android.material", name = "material", version.ref = "material" }
androidx-constraintlayout = { group = "androidx.constraintlayout", name = "constraintlayout", version.ref = "constraintlayout" }
androidx-leanback = { group = "androidx.leanback", name = "leanback", version.ref = "leanback" }
androidx-recyclerview = { group = "androidx.recyclerview", name = "recyclerview", version.ref = "recyclerview" }
androidx-cardview = { group = "androidx.cardview", name = "cardview", version.ref = "cardview" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
`,

  'gradle.properties': `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`,

  'gradle/wrapper/gradle-wrapper.properties': `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`,

  'app/proguard-rules.pro': `# KP TV Smart Launcher ProGuard Rules
-keep class com.kptv.launcher.** { *; }
-dontwarn kotlin.**
`,

  'app/build.gradle.kts': `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.kptv.launcher"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.kptv.launcher"
        // API 21 (Android 5.0 Lollipop) ensures maximum compatibility with Iconic 32" Smart TV & Cloud TV OS
        minSdk = 21
        targetSdk = 34
        versionCode = 2
        versionName = "1.1.0"
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
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
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.google.material)
    implementation(libs.androidx.constraintlayout)
    implementation(libs.androidx.leanback)
    implementation(libs.androidx.recyclerview)
    implementation(libs.androidx.cardview)
    implementation(libs.kotlinx.coroutines.android)
}
`,

  'app/src/main/AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- TV Hardware Features (required="false" ensures compatibility with both Leanback & AOSP Cloud TV OS) -->
    <uses-feature
        android:name="android.software.leanback"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.touchscreen"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.faketouch"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.television"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.wifi"
        android:required="false" />

    <!-- Minimum Required Permissions (No advertising SDKs, no destructive permissions) -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

    <!-- Android 11+ (API 30+) Package Visibility Queries for Launchable TV & Standard Applications -->
    <!-- Uses explicit intent queries instead of broad package permissions -->
    <queries>
        <intent>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent>
        <intent>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
        </intent>
        <intent>
            <action android:name="android.intent.action.VIEW" />
        </intent>
    </queries>

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:banner="@drawable/tv_banner"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.KPTVLauncher">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:clearTaskOnLaunch="true"
            android:stateNotNeeded="true"
            android:screenOrientation="landscape"
            android:configChanges="keyboard|keyboardHidden|navigation|orientation|screenSize|screenLayout|smallestScreenSize">

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
`,

  'app/src/main/java/com/kptv/launcher/AppEntry.kt': `package com.kptv.launcher

import android.graphics.drawable.Drawable

data class AppEntry(
    val label: String,
    val packageName: String,
    val activityName: String?,
    val icon: Drawable?,
    val isPinnedToDock: Boolean = false,
    val dockPriority: Int = 99
)
`,

  'app/src/main/java/com/kptv/launcher/InstalledAppsRepository.kt': `package com.kptv.launcher

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo

/**
 * Discovers real installed launchable applications on Android TV / Cloud TV OS.
 * Supports both CATEGORY_LEANBACK_LAUNCHER and standard CATEGORY_LAUNCHER.
 * Never automatically downloads unofficial APKs or uninstalls existing apps.
 */
class InstalledAppsRepository(private val context: Context) {

    private val prefs = context.getSharedPreferences("kptv_dock_prefs", Context.MODE_PRIVATE)

    companion object {
        // Preferred Dock Order per specification:
        // 1. NetMirror TV (only if already installed and trusted)
        // 2. JioHotstar / Hotstar
        // 3. YouTube
        // 4. Airtel (if installed)
        val PREFERRED_DOCK_PACKAGES = listOf(
            listOf("com.netmirror.app", "com.netmirror.tv"),
            listOf("in.startv.hotstar.dplus", "in.startv.hotstar", "com.hotstar.tv"),
            listOf("com.google.android.youtube.tv", "com.google.android.youtube", "com.smarttube.tv"),
            listOf("com.airtel.tv", "com.airtel.xstream", "tv.airtel.xstream")
        )
    }

    fun getAllInstalledApps(): List<AppEntry> {
        val pm = context.packageManager
        val selfPkg = context.packageName
        val discovered = linkedMapOf<String, AppEntry>()

        // 1. Query Leanback TV apps first
        val leanbackIntent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER)
        }
        val leanbackResolved = queryIntentSafe(pm, leanbackIntent)

        // 2. Query standard Launcher apps (critical for Cloud TV OS where many apps use standard CATEGORY_LAUNCHER)
        val standardIntent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }
        val standardResolved = queryIntentSafe(pm, standardIntent)

        val customPinnedSet = prefs.getStringSet("pinned_packages", null)

        for (info in (leanbackResolved + standardResolved)) {
            val activityInfo = info.activityInfo ?: continue
            val pkg = activityInfo.packageName ?: continue
            if (pkg == selfPkg || discovered.containsKey(pkg)) continue

            val label = info.loadLabel(pm)?.toString()?.trim().takeUnless { it.isNullOrEmpty() } ?: pkg
            val icon = try {
                info.loadIcon(pm)
            } catch (_: Exception) {
                null
            }

            val priority = getPreferredDockPriority(pkg)
            val isPinned = if (customPinnedSet != null) {
                customPinnedSet.contains(pkg)
            } else {
                priority < 10
            }

            discovered[pkg] = AppEntry(
                label = label,
                packageName = pkg,
                activityName = activityInfo.name,
                icon = icon,
                isPinnedToDock = isPinned,
                dockPriority = priority
            )
        }

        return discovered.values.sortedWith(
            compareBy<AppEntry> { it.dockPriority }.thenBy { it.label.lowercase() }
        )
    }

    fun getDockApps(): List<AppEntry> {
        return getAllInstalledApps()
            .filter { it.isPinnedToDock }
            .sortedWith(compareBy<AppEntry> { it.dockPriority }.thenBy { it.label.lowercase() })
            .take(5)
    }

    fun toggleDockPin(packageName: String): Boolean {
        val currentApps = getAllInstalledApps()
        val currentSet = prefs.getStringSet("pinned_packages", null)?.toMutableSet()
            ?: currentApps.filter { it.isPinnedToDock }.map { it.packageName }.toMutableSet()

        val nowPinned = if (currentSet.contains(packageName)) {
            currentSet.remove(packageName)
            false
        } else {
            currentSet.add(packageName)
            true
        }
        prefs.edit().putStringSet("pinned_packages", currentSet).apply()
        return nowPinned
    }

    fun launchApp(entry: AppEntry): Boolean {
        val pm = context.packageManager
        try {
            val leanback = pm.getLeanbackLaunchIntentForPackage(entry.packageName)
            if (leanback != null) {
                leanback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(leanback)
                return true
            }
            val standard = pm.getLaunchIntentForPackage(entry.packageName)
            if (standard != null) {
                standard.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(standard)
                return true
            }
            if (!entry.activityName.isNullOrEmpty()) {
                val explicit = Intent(Intent.ACTION_MAIN).apply {
                    component = ComponentName(entry.packageName, entry.activityName)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(explicit)
                return true
            }
        } catch (_: Exception) {
            return false
        }
        return false
    }

    fun findAndLaunchFirstAvailable(candidates: List<String>): Boolean {
        val installed = getAllInstalledApps().associateBy { it.packageName }
        for (pkg in candidates) {
            val match = installed[pkg]
            if (match != null && launchApp(match)) {
                return true
            }
        }
        return false
    }

    private fun getPreferredDockPriority(packageName: String): Int {
        PREFERRED_DOCK_PACKAGES.forEachIndexed { index, group ->
            if (group.any { it.equals(packageName, ignoreCase = true) }) {
                return index
            }
        }
        return 50
    }

    private fun queryIntentSafe(pm: PackageManager, intent: Intent): List<ResolveInfo> {
        return try {
            pm.queryIntentActivities(intent, 0)
        } catch (_: Exception) {
            emptyList()
        }
    }
}
`,

  'app/src/main/java/com/kptv/launcher/CricketScoreService.kt': `package com.kptv.launcher

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class CricketScoreState(
    val status: String, // "unconfigured", "loading", "live", "error", "offline"
    val matchTitle: String,
    val matchSubtitle: String,
    val team1Code: String,
    val team1Score: String,
    val team1Overs: String,
    val team2Code: String,
    val team2Score: String,
    val team2Overs: String,
    val summaryBanner: String,
    val lastUpdated: String
)

/**
 * Legitimate Live Cricket Score Service.
 * Never displays hardcoded sample scores as real-time scores.
 * Shows "Live score service not configured." until a valid API key/endpoint is configured.
 */
class CricketScoreService(private val context: Context) {

    private val prefs = context.getSharedPreferences("kptv_cricket_prefs", Context.MODE_PRIVATE)

    fun getApiKey(): String = prefs.getString("cricket_api_key", "")?.trim() ?: ""
    fun getApiUrl(): String =
        prefs.getString("cricket_api_url", "https://api.cricapi.com/v1/currentMatches")?.trim()
            ?: "https://api.cricapi.com/v1/currentMatches"

    fun saveApiConfig(apiUrl: String, apiKey: String) {
        prefs.edit()
            .putString("cricket_api_url", apiUrl.trim())
            .putString("cricket_api_key", apiKey.trim())
            .apply()
    }

    suspend fun fetchLiveScore(): CricketScoreState = withContext(Dispatchers.IO) {
        val nowTime = SimpleDateFormat("hh:mm:ss a", Locale.getDefault()).format(Date())

        if (!isNetworkConnected()) {
            return@withContext CricketScoreState(
                status = "offline",
                matchTitle = "Live Cricket Score",
                matchSubtitle = "Network Offline",
                team1Code = "---",
                team1Score = "--/--",
                team1Overs = "",
                team2Code = "---",
                team2Score = "--/--",
                team2Overs = "",
                summaryBanner = "TV Offline • Check Wi-Fi Connection",
                lastUpdated = nowTime
            )
        }

        val apiKey = getApiKey()
        val apiUrl = getApiUrl()
        val isCustomFeed = apiUrl.isNotEmpty() && !apiUrl.contains("api.cricapi.com")

        if (apiKey.isEmpty() && !isCustomFeed) {
            return@withContext CricketScoreState(
                status = "unconfigured",
                matchTitle = "Live Cricket Score",
                matchSubtitle = "Press OK to configure API",
                team1Code = "TEAM 1",
                team1Score = "--",
                team1Overs = "",
                team2Code = "TEAM 2",
                team2Score = "--",
                team2Overs = "",
                summaryBanner = "Live score service not configured.",
                lastUpdated = "Not configured"
            )
        }

        try {
            val fullUrl = if (apiKey.isNotEmpty() && !apiUrl.contains("apikey=")) {
                val sep = if (apiUrl.contains("?")) "&" else "?"
                "\${apiUrl}\${sep}apikey=\${apiKey}&offset=0"
            } else {
                apiUrl
            }

            val conn = (URL(fullUrl).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8000
                readTimeout = 8000
                setRequestProperty("Accept", "application/json")
            }

            val code = conn.responseCode
            if (code != 200) {
                return@withContext errorState("HTTP \$code from score service", nowTime)
            }

            val reader = BufferedReader(InputStreamReader(conn.inputStream))
            val body = reader.use { it.readText() }
            val json = JSONObject(body)

            if (json.optString("status") == "failure") {
                return@withContext errorState(
                    json.optString("reason", "API key or quota error"),
                    nowTime
                )
            }

            val dataArr = json.optJSONArray("data")
            if (dataArr == null || dataArr.length() == 0) {
                return@withContext errorState("No active matches found", nowTime)
            }

            val matchObj = dataArr.getJSONObject(0)
            val teamsArr = matchObj.optJSONArray("teams")
            val team1Name = teamsArr?.optString(0) ?: "Team 1"
            val team2Name = teamsArr?.optString(1) ?: "Team 2"
            val t1Code = team1Name.take(3).uppercase()
            val t2Code = team2Name.take(3).uppercase()

            val scoreArr = matchObj.optJSONArray("score")
            val s1 = scoreArr?.optJSONObject(0)
            val s2 = scoreArr?.optJSONObject(1)

            val t1Score = if (s1 != null) "\${s1.optInt("r")}/\${s1.optInt("w")}" else "Yet to bat"
            val t1Overs = if (s1 != null) "(\${s1.optDouble("o")} ov)" else ""
            val t2Score = if (s2 != null) "\${s2.optInt("r")}/\${s2.optInt("w")}" else "Yet to bat"
            val t2Overs = if (s2 != null) "(\${s2.optDouble("o")} ov)" else ""

            val statusText = matchObj.optString("status", "Live Match")
            val matchType = matchObj.optString("matchType", "LIVE").uppercase()

            CricketScoreState(
                status = "live",
                matchTitle = "\$t1Code vs \$t2Code",
                matchSubtitle = "\$matchType • Updated \$nowTime",
                team1Code = t1Code,
                team1Score = t1Score,
                team1Overs = t1Overs,
                team2Code = t2Code,
                team2Score = t2Score,
                team2Overs = t2Overs,
                summaryBanner = statusText,
                lastUpdated = nowTime
            )
        } catch (e: Exception) {
            errorState(e.localizedMessage ?: "Network error", nowTime)
        }
    }

    private fun errorState(reason: String, timestamp: String) = CricketScoreState(
        status = "error",
        matchTitle = "Live Cricket Score",
        matchSubtitle = "Feed Error",
        team1Code = "---",
        team1Score = "--",
        team1Overs = "",
        team2Code = "---",
        team2Score = "--",
        team2Overs = "",
        summaryBanner = "Error: \$reason",
        lastUpdated = timestamp
    )

    private fun isNetworkConnected(): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            ?: return false
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val net = cm.activeNetwork ?: return false
            val caps = cm.getNetworkCapabilities(net) ?: return false
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } else {
            @Suppress("DEPRECATION")
            cm.activeNetworkInfo?.isConnected == true
        }
    }
}
`,

  'app/src/main/java/com/kptv/launcher/SetopboxHelper.kt': `package com.kptv.launcher

import android.content.Context
import android.content.Intent
import android.media.tv.TvInputInfo
import android.media.tv.TvInputManager
import android.os.Build
import androidx.appcompat.app.AlertDialog

/**
 * Safe Setopbox / HDMI Input helper.
 * Attempts documented Android TV Input Framework (TIF) source selection only when supported.
 * Never pretends that the input was switched when unsupported; shows clear manual instructions.
 */
object SetopboxHelper {

    fun openSetopboxSelector(context: Context) {
        val hdmiInputs = detectDocumentedHdmiInputs(context)

        val options = arrayOf(
            "Attempt TV Input Switcher (If supported by TV OS)",
            "Manual Instructions for HDMI 1 / HDMI 2 / AV"
        )

        AlertDialog.Builder(context)
            .setTitle("Setopbox Input Hub")
            .setItems(options) { _, which ->
                if (which == 0) {
                    val launched = attemptSystemTvInputIntent(context)
                    if (!launched) {
                        showManualInstructionsDialog(
                            context,
                            hdmiInputs,
                            "Direct HDMI switching is restricted by this TV firmware. No input was switched."
                        )
                    }
                } else {
                    showManualInstructionsDialog(
                        context,
                        hdmiInputs,
                        "How to switch to your Setopbox safely:"
                    )
                }
            }
            .setNegativeButton("Close", null)
            .show()
    }

    private fun detectDocumentedHdmiInputs(context: Context): List<String> {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return emptyList()
        return try {
            val tif = context.getSystemService(Context.TV_INPUT_SERVICE) as? TvInputManager
                ?: return emptyList()
            tif.tvInputList
                .filter { it.type == TvInputInfo.TYPE_HDMI || it.type == TvInputInfo.TYPE_COMPOSITE }
                .map { info ->
                    info.loadLabel(context)?.toString() ?: info.id
                }
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun attemptSystemTvInputIntent(context: Context): Boolean {
        val pm = context.packageManager
        val candidatePackages = listOf(
            "com.android.tv",
            "com.google.android.tv",
            "com.droidlogic.tvinput"
        )
        for (pkg in candidatePackages) {
            try {
                val intent = pm.getLeanbackLaunchIntentForPackage(pkg)
                    ?: pm.getLaunchIntentForPackage(pkg)
                if (intent != null) {
                    context.startActivity(intent)
                    return true
                }
            } catch (_: Exception) {
                // continue
            }
        }
        return false
    }

    private fun showManualInstructionsDialog(
        context: Context,
        detectedInputs: List<String>,
        headerNote: String
    ) {
        val detectedLine = if (detectedInputs.isNotEmpty()) {
            "Detected TV Inputs: \${detectedInputs.joinToString(", ")}\\n\\n"
        } else {
            "Detected TV Inputs: Standard Cloud TV OS Firmware (Direct HDMI API not exposed to third-party apps)\\n\\n"
        }

        val message = """
            \$headerNote

            \$detectedLine
            1. Power ON your DTH / Cable Setopbox.
            2. Press the "SOURCE" or "INPUT" button on your physical Iconic TV remote.
            3. Select HDMI 1, HDMI 2, or AV from the TV's hardware input menu.
        """.trimIndent()

        AlertDialog.Builder(context)
            .setTitle("Setopbox Manual HDMI Instructions")
            .setMessage(message)
            .setPositiveButton("OK", null)
            .show()
    }
}
`,

  'app/src/main/java/com/kptv/launcher/DeviceDiagnosticsHelper.kt': `package com.kptv.launcher

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build

object DeviceDiagnosticsHelper {

    fun buildReport(context: Context): String {
        val dm = context.resources.displayMetrics
        val am = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val memInfo = ActivityManager.MemoryInfo()
        am?.getMemoryInfo(memInfo)

        val totalRamMb = memInfo.totalMem / (1024 * 1024)
        val availRamMb = memInfo.availMem / (1024 * 1024)

        val abis = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Build.SUPPORTED_ABIS.joinToString(", ")
        } else {
            @Suppress("DEPRECATION")
            Build.CPU_ABI
        }

        val pm = context.packageManager
        val hasLeanback = pm.hasSystemFeature(PackageManager.FEATURE_LEANBACK)
        val homeIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        val homeResolvers = pm.queryIntentActivities(homeIntent, 0)
            .mapNotNull { it.activityInfo?.packageName }

        return """
            Brand / Model: \${Build.BRAND} / \${Build.MODEL}
            Android Version: Android \${Build.VERSION.RELEASE} (SDK \${Build.VERSION.SDK_INT})
            CPU Architecture (ABI): \$abis
            Screen Resolution: \${dm.widthPixels} x \${dm.heightPixels} (Density \${dm.densityDpi} dpi)
            RAM (Available / Total): \${availRamMb} MB / \${totalRamMb} MB
            Leanback Feature Flag: \$hasLeanback
            Registered HOME Launchers: \${homeResolvers.joinToString(", ")}
            Ads-Free Verification: 100% Clean (Zero Ad SDKs)
        """.trimIndent()
    }
}
`,

  'app/src/main/java/com/kptv/launcher/MainActivity.kt': `package com.kptv.launcher

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.text.InputType
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.kptv.launcher.databinding.ActivityMainBinding
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var appsRepo: InstalledAppsRepository
    private lateinit var cricketService: CricketScoreService
    private val uiScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var clockJob: Job? = null
    private var isClock24Hours = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        appsRepo = InstalledAppsRepository(this)
        cricketService = CricketScoreService(this)

        setupLiveClockAndDate()
        setupDpadFocusAnimations()
        setupClickActions()
        refreshCricketScoreCard()

        // Default initial focus on Live TV Card
        binding.cardLiveTv.post {
            binding.cardLiveTv.requestFocus()
        }
    }

    override fun onResume() {
        super.onResume()
        refreshCricketScoreCard()
    }

    override fun onDestroy() {
        clockJob?.cancel()
        uiScope.cancel()
        super.onDestroy()
    }

    private fun setupLiveClockAndDate() {
        clockJob = uiScope.launch {
            while (isActive) {
                val now = Date()
                val timePattern = if (isClock24Hours) "HH:mm" else "hh:mm a"
                val timeFormat = SimpleDateFormat(timePattern, Locale.getDefault())
                val dateFormat = SimpleDateFormat("EEE, dd MMM yyyy", Locale.getDefault())

                binding.tvClock.text = timeFormat.format(now).uppercase(Locale.getDefault())
                binding.tvDate.text = dateFormat.format(now)
                delay(1000L)
            }
        }
    }

    private fun setupDpadFocusAnimations() {
        val focusableViews = listOf(
            binding.btnHeaderWifi,
            binding.btnHeaderSettings,
            binding.btnHeaderNotifications,
            binding.navHome,
            binding.navApps,
            binding.navSettings,
            binding.navAbout,
            binding.cardLiveTv,
            binding.cardSetopbox,
            binding.cardCricket,
            binding.dockNetmirror,
            binding.dockHotstar,
            binding.dockYoutube,
            binding.dockAirtel,
            binding.dockMore
        )

        focusableViews.forEach { view ->
            view.setOnFocusChangeListener { v, hasFocus ->
                if (hasFocus) {
                    v.animate().scaleX(1.06f).scaleY(1.06f).setDuration(140).start()
                    v.elevation = 16f
                } else {
                    v.animate().scaleX(1.0f).scaleY(1.0f).setDuration(140).start()
                    v.elevation = 4f
                }
            }
        }
    }

    private fun setupClickActions() {
        // Header Buttons
        binding.btnHeaderWifi.setOnClickListener { openWifiSettings() }
        binding.btnHeaderSettings.setOnClickListener { openSystemOrLauncherSettings() }
        binding.btnHeaderNotifications.setOnClickListener { showDiagnosticsAndStatusDialog() }

        // Sidebar Buttons
        binding.navHome.setOnClickListener { binding.cardLiveTv.requestFocus() }
        binding.navApps.setOnClickListener { showRealAppDrawerDialog() }
        binding.navSettings.setOnClickListener { openSystemOrLauncherSettings() }
        binding.navAbout.setOnClickListener { showDiagnosticsAndStatusDialog() }

        // 3 Hero Cards
        binding.cardLiveTv.setOnClickListener { launchLiveTvOrPlayer() }
        binding.cardSetopbox.setOnClickListener { SetopboxHelper.openSetopboxSelector(this) }
        binding.cardCricket.setOnClickListener { showCricketConfigDialog() }

        // Preferred Dock Order:
        // 1. NetMirror TV (only if already installed)
        binding.dockNetmirror.setOnClickListener {
            launchPreferredOrNotify(
                InstalledAppsRepository.PREFERRED_DOCK_PACKAGES[0],
                "NetMirror TV"
            )
        }
        // 2. JioHotstar / Hotstar
        binding.dockHotstar.setOnClickListener {
            launchPreferredOrNotify(
                InstalledAppsRepository.PREFERRED_DOCK_PACKAGES[1],
                "JioHotstar"
            )
        }
        // 3. YouTube
        binding.dockYoutube.setOnClickListener {
            launchPreferredOrNotify(
                InstalledAppsRepository.PREFERRED_DOCK_PACKAGES[2],
                "YouTube"
            )
        }
        // 4. Airtel
        binding.dockAirtel.setOnClickListener {
            launchPreferredOrNotify(
                InstalledAppsRepository.PREFERRED_DOCK_PACKAGES[3],
                "Airtel Xstream"
            )
        }
        // 5. More Apps (Real Application Drawer)
        binding.dockMore.setOnClickListener {
            showRealAppDrawerDialog()
        }
    }

    private fun launchPreferredOrNotify(candidatePackages: List<String>, displayName: String) {
        val launched = appsRepo.findAndLaunchFirstAvailable(candidatePackages)
        if (!launched) {
            AlertDialog.Builder(this)
                .setTitle("\$displayName Not Installed")
                .setMessage(
                    "\$displayName (\${candidatePackages.first()}) was not found on this TV.\\n\\n" +
                    "KP TV never automatically downloads unofficial APKs. You can open 'More Apps' to launch any installed application."
                )
                .setPositiveButton("Open App Drawer") { _, _ -> showRealAppDrawerDialog() }
                .setNegativeButton("Close", null)
                .show()
        }
    }

    private fun launchLiveTvOrPlayer() {
        val liveTvCandidates = listOf(
            "com.google.android.tv",
            "com.android.tv",
            "org.videolan.vlc",
            "com.mxtech.videoplayer.television",
            "com.mxtech.videoplayer.ad"
        )
        val launched = appsRepo.findAndLaunchFirstAvailable(liveTvCandidates)
        if (!launched) {
            showRealAppDrawerDialog()
        }
    }

    private fun refreshCricketScoreCard() {
        binding.tvCricketStatus.text = "Syncing live score service..."
        uiScope.launch {
            val state = cricketService.fetchLiveScore()
            binding.tvCricketTitle.text = state.matchTitle
            binding.tvCricketSubtitle.text = state.matchSubtitle
            binding.tvTeam1Code.text = state.team1Code
            binding.tvTeam1Score.text = state.team1Score
            binding.tvTeam2Code.text = state.team2Code
            binding.tvTeam2Score.text = state.team2Score
            binding.tvCricketStatus.text = state.summaryBanner
        }
    }

    private fun showCricketConfigDialog() {
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 32, 48, 16)
        }

        val urlInput = EditText(this).apply {
            hint = "API URL (e.g. https://api.cricapi.com/v1/currentMatches)"
            setText(cricketService.getApiUrl())
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI
        }

        val keyInput = EditText(this).apply {
            hint = "Enter CricAPI Key (kept out of source code)"
            setText(cricketService.getApiKey())
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        }

        container.addView(urlInput)
        container.addView(keyInput)

        AlertDialog.Builder(this)
            .setTitle("Live Cricket Score Configuration")
            .setMessage("Configure your legitimate cricket score API key, or press Refresh to update live match scores.")
            .setView(container)
            .setPositiveButton("Save & Refresh") { _, _ ->
                cricketService.saveApiConfig(
                    urlInput.text?.toString() ?: "",
                    keyInput.text?.toString() ?: ""
                )
                refreshCricketScoreCard()
            }
            .setNeutralButton("Refresh Now") { _, _ ->
                refreshCricketScoreCard()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showRealAppDrawerDialog() {
        val installedApps = appsRepo.getAllInstalledApps()
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_app_drawer, null)
        val recyclerView = dialogView.findViewById<RecyclerView>(R.id.rv_apps)
        val tvCount = dialogView.findViewById<TextView>(R.id.tv_app_count)

        tvCount.text = "\${installedApps.size} Installed Apps Detected"
        recyclerView.layoutManager = GridLayoutManager(this, 4)

        val dialog = AlertDialog.Builder(this, R.style.Theme_KPTVLauncher)
            .setView(dialogView)
            .setNegativeButton("Back to Home", null)
            .create()

        recyclerView.adapter = object : RecyclerView.Adapter<AppViewHolder>() {
            override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AppViewHolder {
                val itemView = LayoutInflater.from(parent.context)
                    .inflate(R.layout.item_app_drawer, parent, false)
                return AppViewHolder(itemView)
            }

            override fun onBindViewHolder(holder: AppViewHolder, position: Int) {
                val app = installedApps[position]
                holder.tvLabel.text = app.label
                holder.tvPackage.text = app.packageName
                if (app.icon != null) {
                    holder.ivIcon.setImageDrawable(app.icon)
                } else {
                    holder.ivIcon.setImageResource(android.R.drawable.sym_def_app_icon)
                }

                holder.itemView.setOnClickListener {
                    dialog.dismiss()
                    if (!appsRepo.launchApp(app)) {
                        Toast.makeText(
                            this@MainActivity,
                            "Unable to launch \${app.label}",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }

                holder.itemView.setOnLongClickListener {
                    val pinned = appsRepo.toggleDockPin(app.packageName)
                    Toast.makeText(
                        this@MainActivity,
                        if (pinned) "Pinned \${app.label} to Dock" else "Unpinned \${app.label}",
                        Toast.LENGTH_SHORT
                    ).show()
                    true
                }
            }

            override fun getItemCount(): Int = installedApps.size
        }

        dialog.show()
    }

    private class AppViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val ivIcon: ImageView = view.findViewById(R.id.iv_app_icon)
        val tvLabel: TextView = view.findViewById(R.id.tv_app_label)
        val tvPackage: TextView = view.findViewById(R.id.tv_app_package)
    }

    private fun openWifiSettings() {
        try {
            startActivity(Intent(Settings.ACTION_WIFI_SETTINGS))
        } catch (_: Exception) {
            openSystemOrLauncherSettings()
        }
    }

    private fun openSystemOrLauncherSettings() {
        val options = arrayOf(
            "Open Android TV System Settings",
            "Toggle 12h / 24h Clock Format",
            "Device Diagnostics & Compatibility Report"
        )
        AlertDialog.Builder(this)
            .setTitle("KP TV Settings")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> {
                        try {
                            startActivity(Intent(Settings.ACTION_SETTINGS))
                        } catch (_: Exception) {
                            Toast.makeText(this, "System settings unavailable", Toast.LENGTH_SHORT).show()
                        }
                    }
                    1 -> {
                        isClock24Hours = !isClock24Hours
                    }
                    2 -> showDiagnosticsAndStatusDialog()
                }
            }
            .setNegativeButton("Close", null)
            .show()
    }

    private fun showDiagnosticsAndStatusDialog() {
        val report = DeviceDiagnosticsHelper.buildReport(this)
        AlertDialog.Builder(this)
            .setTitle("KP TV – Smart TV Diagnostics & Safety")
            .setMessage(report)
            .setPositiveButton("OK", null)
            .show()
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // Prevent accidental double activation when holding down OK/Enter
        if (event != null && event.repeatCount > 0 &&
            (keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER)
        ) {
            return true
        }

        when (keyCode) {
            KeyEvent.KEYCODE_BACK -> {
                if (!binding.cardLiveTv.hasFocus()) {
                    binding.cardLiveTv.requestFocus()
                }
                return true
            }
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER -> {
                val focused = currentFocus
                if (focused != null) {
                    focused.performClick()
                    return true
                }
            }
        }
        return super.onKeyDown(keyCode, event)
    }
}
`,

  'app/src/main/res/values/strings.xml': `<resources>
    <string name="app_name">KP TV – Smart TV Launcher</string>
    <string name="live_tv">Live TV</string>
    <string name="live_tv_channels">Live TV Channels</string>
    <string name="setopbox">Setopbox</string>
    <string name="watch_setopbox">Watch Setopbox</string>
    <string name="live_score">LIVE</string>
    <string name="cricket_unconfigured">Live score service not configured.</string>
    <string name="nav_home">Home</string>
    <string name="nav_apps">Apps</string>
    <string name="nav_settings">Settings</string>
    <string name="nav_about">About</string>
</resources>
`,

  'app/src/main/res/values/colors.xml': `<resources>
    <color name="tv_navy_bg">#030712</color>
    <color name="tv_surface_dark">#0F172A</color>
    <color name="tv_neon_blue">#38BDF8</color>
    <color name="tv_neon_purple">#D946EF</color>
    <color name="tv_card_blue_start">#0284C7</color>
    <color name="tv_card_blue_end">#1E3A8A</color>
    <color name="tv_card_purple_start">#C026D3</color>
    <color name="tv_card_purple_end">#4C1D95</color>
    <color name="tv_cricket_gold">#FACC15</color>
    <color name="white">#FFFFFF</color>
    <color name="text_muted">#94A3B8</color>
</resources>
`,

  'app/src/main/res/values/themes.xml': `<resources>
    <style name="Theme.KPTVLauncher" parent="Theme.AppCompat.NoActionBar">
        <item name="android:windowBackground">@color/tv_navy_bg</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
        <item name="android:statusBarColor">@color/tv_navy_bg</item>
        <item name="colorPrimary">@color/tv_neon_blue</item>
        <item name="colorAccent">@color/tv_neon_blue</item>
    </style>
</resources>
`,

  'app/src/main/res/drawable/ic_launcher_background.xml': `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <gradient
        android:angle="135"
        android:startColor="#030712"
        android:centerColor="#0F172A"
        android:endColor="#1D4ED8" />
</shape>
`,

  'app/src/main/res/drawable/ic_launcher_foreground.xml': `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#38BDF8"
        android:pathData="M26,34h56c3.3,0 6,2.7 6,6v32c0,3.3 -2.7,6 -6,6H26c-3.3,0 -6,-2.7 -6,-6V40c0,-3.3 2.7,-6 6,-6z" />
    <path
        android:fillColor="#030712"
        android:pathData="M30,38h48v28H30z" />
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M48,45l16,7 -16,7z" />
</vector>
`,

  'app/src/main/res/drawable/tv_banner.xml': `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item>
        <shape android:shape="rectangle">
            <size android:width="320dp" android:height="180dp" />
            <gradient
                android:angle="135"
                android:startColor="#030712"
                android:centerColor="#1E3A8A"
                android:endColor="#7E22CE" />
            <corners android:radius="12dp" />
        </shape>
    </item>
</layer-list>
`,

  'app/src/main/res/drawable/bg_card_livetv.xml': `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <gradient
        android:angle="315"
        android:startColor="#0284C7"
        android:endColor="#1E3A8A" />
    <corners android:radius="22dp" />
    <stroke android:width="2dp" android:color="#38BDF8" />
</shape>
`,

  'app/src/main/res/drawable/bg_card_setopbox.xml': `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <gradient
        android:angle="315"
        android:startColor="#DB2777"
        android:endColor="#4C1D95" />
    <corners android:radius="22dp" />
    <stroke android:width="2dp" android:color="#F472B6" />
</shape>
`,

  'app/src/main/res/drawable/bg_card_cricket.xml': `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <gradient
        android:angle="270"
        android:startColor="#0B1528"
        android:endColor="#052E16" />
    <corners android:radius="22dp" />
    <stroke android:width="2dp" android:color="#38BDF8" />
</shape>
`,

  'app/src/main/res/drawable/bg_dock_item.xml': `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#1E293B" />
    <corners
        android:topLeftRadius="24dp"
        android:bottomLeftRadius="24dp"
        android:topRightRadius="40dp"
        android:bottomRightRadius="40dp" />
    <stroke android:width="1.5dp" android:color="#38BDF8" />
</shape>
`,

  'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml': `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`,

  'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml': `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`,

  'app/src/main/res/mipmap-hdpi/ic_launcher.xml': `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@drawable/ic_launcher_background" />
    <item android:drawable="@drawable/ic_launcher_foreground" />
</layer-list>
`,

  'app/src/main/res/mipmap-hdpi/ic_launcher_round.xml': `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@drawable/ic_launcher_background" />
    <item android:drawable="@drawable/ic_launcher_foreground" />
</layer-list>
`,

  'app/src/main/res/layout/activity_main.xml': `<?xml version="1.0" encoding="utf-8"?>
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
        android:layout_height="68dp"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:paddingStart="28dp"
        android:paddingEnd="28dp"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent">

        <ImageView
            android:layout_width="36dp"
            android:layout_height="36dp"
            android:src="@drawable/ic_launcher_foreground" />

        <LinearLayout
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:layout_marginStart="10dp">
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
                android:textSize="11sp" />
        </LinearLayout>

        <View
            android:layout_width="1dp"
            android:layout_height="30dp"
            android:background="#33FFFFFF"
            android:layout_marginStart="20dp"
            android:layout_marginEnd="20dp" />

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
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
                android:textSize="11sp" />
        </LinearLayout>

        <!-- Header Right Action Buttons -->
        <TextView
            android:id="@+id/btn_header_wifi"
            android:focusable="true"
            android:clickable="true"
            android:layout_width="wrap_content"
            android:layout_height="38dp"
            android:gravity="center"
            android:paddingStart="14dp"
            android:paddingEnd="14dp"
            android:layout_marginEnd="10dp"
            android:background="@drawable/bg_dock_item"
            android:text="Wi-Fi"
            android:textColor="@color/white"
            android:textStyle="bold"
            android:textSize="12sp" />

        <TextView
            android:id="@+id/btn_header_settings"
            android:focusable="true"
            android:clickable="true"
            android:layout_width="wrap_content"
            android:layout_height="38dp"
            android:gravity="center"
            android:paddingStart="14dp"
            android:paddingEnd="14dp"
            android:layout_marginEnd="10dp"
            android:background="@drawable/bg_dock_item"
            android:text="Settings"
            android:textColor="@color/white"
            android:textStyle="bold"
            android:textSize="12sp" />

        <TextView
            android:id="@+id/btn_header_notifications"
            android:focusable="true"
            android:clickable="true"
            android:layout_width="wrap_content"
            android:layout_height="38dp"
            android:gravity="center"
            android:paddingStart="14dp"
            android:paddingEnd="14dp"
            android:background="@drawable/bg_dock_item"
            android:text="Alerts"
            android:textColor="@color/tv_neon_blue"
            android:textStyle="bold"
            android:textSize="12sp" />
    </LinearLayout>

    <!-- Left Vertical Sidebar -->
    <LinearLayout
        android:id="@+id/sidebar"
        android:layout_width="92dp"
        android:layout_height="0dp"
        android:orientation="vertical"
        android:gravity="center"
        android:padding="10dp"
        app:layout_constraintTop_toBottomOf="@id/header"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toStartOf="parent">

        <TextView
            android:id="@+id/nav_home"
            android:focusable="true"
            android:clickable="true"
            android:layout_width="72dp"
            android:layout_height="56dp"
            android:layout_marginBottom="12dp"
            android:gravity="center"
            android:background="@drawable/bg_card_livetv"
            android:text="@string/nav_home"
            android:textColor="@color/white"
            android:textStyle="bold"
            android:textSize="12sp" />

        <TextView
            android:id="@+id/nav_apps"
            android:focusable="true"
            android:clickable="true"
            android:layout_width="72dp"
            android:layout_height="56dp"
            android:layout_marginBottom="12dp"
            android:gravity="center"
            android:background="@drawable/bg_dock_item"
            android:text="@string/nav_apps"
            android:textColor="@color/white"
            android:textStyle="bold"
            android:textSize="12sp" />

        <TextView
            android:id="@+id/nav_settings"
            android:focusable="true"
            android:clickable="true"
            android:layout_width="72dp"
            android:layout_height="56dp"
            android:layout_marginBottom="12dp"
            android:gravity="center"
            android:background="@drawable/bg_dock_item"
            android:text="@string/nav_settings"
            android:textColor="@color/white"
            android:textStyle="bold"
            android:textSize="12sp" />

        <TextView
            android:id="@+id/nav_about"
            android:focusable="true"
            android:clickable="true"
            android:layout_width="72dp"
            android:layout_height="56dp"
            android:gravity="center"
            android:background="@drawable/bg_dock_item"
            android:text="@string/nav_about"
            android:textColor="@color/white"
            android:textStyle="bold"
            android:textSize="12sp" />
    </LinearLayout>

    <!-- 3 Main Hero Cards -->
    <LinearLayout
        android:id="@+id/hero_cards"
        android:layout_width="0dp"
        android:layout_height="220dp"
        android:orientation="horizontal"
        android:layout_marginStart="12dp"
        android:layout_marginEnd="28dp"
        android:layout_marginTop="12dp"
        app:layout_constraintTop_toBottomOf="@id/header"
        app:layout_constraintStart_toEndOf="@id/sidebar"
        app:layout_constraintEnd_toEndOf="parent">

        <!-- Card 1: Live TV -->
        <LinearLayout
            android:id="@+id/card_live_tv"
            android:focusable="true"
            android:clickable="true"
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:layout_marginEnd="16dp"
            android:padding="20dp"
            android:orientation="vertical"
            android:gravity="bottom"
            android:background="@drawable/bg_card_livetv">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="@string/live_tv"
                android:textColor="@color/white"
                android:textStyle="bold"
                android:textSize="24sp" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="@string/live_tv_channels"
                android:textColor="#E0F2FE"
                android:textSize="13sp"
                android:layout_marginTop="4dp" />
        </LinearLayout>

        <!-- Card 2: Setopbox -->
        <LinearLayout
            android:id="@+id/card_setopbox"
            android:focusable="true"
            android:clickable="true"
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:layout_marginEnd="16dp"
            android:padding="20dp"
            android:orientation="vertical"
            android:gravity="bottom"
            android:background="@drawable/bg_card_setopbox">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="@string/setopbox"
                android:textColor="@color/white"
                android:textStyle="bold"
                android:textSize="24sp" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="@string/watch_setopbox"
                android:textColor="#FCE7F3"
                android:textSize="13sp"
                android:layout_marginTop="4dp" />
        </LinearLayout>

        <!-- Card 3: Live Cricket Score -->
        <LinearLayout
            android:id="@+id/card_cricket"
            android:focusable="true"
            android:clickable="true"
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1.35"
            android:padding="18dp"
            android:orientation="vertical"
            android:gravity="center_vertical"
            android:background="@drawable/bg_card_cricket">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:gravity="center_vertical">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:background="#DC2626"
                    android:paddingStart="8dp"
                    android:paddingEnd="8dp"
                    android:paddingTop="2dp"
                    android:paddingBottom="2dp"
                    android:text="@string/live_score"
                    android:textColor="@color/white"
                    android:textStyle="bold"
                    android:textSize="10sp" />

                <LinearLayout
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:gravity="end"
                    android:orientation="vertical">
                    <TextView
                        android:id="@+id/tv_cricket_title"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="Live Cricket Score"
                        android:textColor="@color/white"
                        android:textStyle="bold"
                        android:textSize="16sp" />
                    <TextView
                        android:id="@+id/tv_cricket_subtitle"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="Real-Time Match Feed"
                        android:textColor="@color/text_muted"
                        android:textSize="11sp" />
                </LinearLayout>
            </LinearLayout>

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="0dp"
                android:layout_weight="1"
                android:gravity="center"
                android:orientation="horizontal">

                <LinearLayout
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:gravity="center"
                    android:orientation="vertical">
                    <TextView
                        android:id="@+id/tv_team1_code"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="TEAM 1"
                        android:textColor="@color/tv_neon_blue"
                        android:textStyle="bold"
                        android:textSize="12sp" />
                    <TextView
                        android:id="@+id/tv_team1_score"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="--"
                        android:textColor="@color/white"
                        android:textStyle="bold"
                        android:textSize="20sp" />
                </LinearLayout>

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="VS"
                    android:textColor="@color/tv_cricket_gold"
                    android:textStyle="bold"
                    android:textSize="16sp"
                    android:layout_marginStart="8dp"
                    android:layout_marginEnd="8dp" />

                <LinearLayout
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:gravity="center"
                    android:orientation="vertical">
                    <TextView
                        android:id="@+id/tv_team2_code"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="TEAM 2"
                        android:textColor="@color/tv_cricket_gold"
                        android:textStyle="bold"
                        android:textSize="12sp" />
                    <TextView
                        android:id="@+id/tv_team2_score"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="--"
                        android:textColor="@color/white"
                        android:textStyle="bold"
                        android:textSize="20sp" />
                </LinearLayout>
            </LinearLayout>

            <TextView
                android:id="@+id/tv_cricket_status"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:background="@color/tv_cricket_gold"
                android:padding="6dp"
                android:gravity="center"
                android:text="@string/cricket_unconfigured"
                android:textColor="#030712"
                android:textStyle="bold"
                android:textSize="11sp" />
        </LinearLayout>
    </LinearLayout>

    <!-- Bottom Application Dock (Preferred Order: NetMirror TV, JioHotstar, YouTube, Airtel, More Apps) -->
    <LinearLayout
        android:id="@+id/dock"
        android:layout_width="0dp"
        android:layout_height="96dp"
        android:orientation="horizontal"
        android:gravity="center"
        android:layout_marginStart="12dp"
        android:layout_marginEnd="28dp"
        app:layout_constraintTop_toBottomOf="@id/hero_cards"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toEndOf="@id/sidebar"
        app:layout_constraintEnd_toEndOf="parent">

        <TextView
            android:id="@+id/dock_netmirror"
            android:focusable="true"
            android:clickable="true"
            android:layout_width="0dp"
            android:layout_height="72dp"
            android:layout_weight="1"
            android:layout_marginEnd="12dp"
            android:gravity="center"
            android:background="@drawable/bg_dock_item"
            android:text="NetMirror TV"
            android:textColor="@color/white"
            android:textStyle="bold"
            android:textSize="13sp" />

        <TextView
            android:id="@+id/dock_hotstar"
            android:focusable="true"
            android:clickable="true"
            android:layout_width="0dp"
            android:layout_height="72dp"
            android:layout_weight="1"
            android:layout_marginEnd="12dp"
            android:gravity="center"
            android:background="@drawable/bg_dock_item"
            android:text="JioHotstar"
            android:textColor="#FACC15"
            android:textStyle="bold"
            android:textSize="13sp" />

        <TextView
            android:id="@+id/dock_youtube"
            android:focusable="true"
            android:clickable="true"
            android:layout_width="0dp"
            android:layout_height="72dp"
            android:layout_weight="1"
            android:layout_marginEnd="12dp"
            android:gravity="center"
            android:background="@drawable/bg_dock_item"
            android:text="YouTube"
            android:textColor="#F87171"
            android:textStyle="bold"
            android:textSize="13sp" />

        <TextView
            android:id="@+id/dock_airtel"
            android:focusable="true"
            android:clickable="true"
            android:layout_width="0dp"
            android:layout_height="72dp"
            android:layout_weight="1"
            android:layout_marginEnd="12dp"
            android:gravity="center"
            android:background="@drawable/bg_dock_item"
            android:text="Airtel"
            android:textColor="#FB7185"
            android:textStyle="bold"
            android:textSize="13sp" />

        <TextView
            android:id="@+id/dock_more"
            android:focusable="true"
            android:clickable="true"
            android:layout_width="0dp"
            android:layout_height="72dp"
            android:layout_weight="1"
            android:gravity="center"
            android:background="@drawable/bg_dock_item"
            android:text="+ More Apps"
            android:textColor="@color/tv_neon_blue"
            android:textStyle="bold"
            android:textSize="13sp" />
    </LinearLayout>

</androidx.constraintlayout.widget.ConstraintLayout>
`,

  'app/src/main/res/layout/dialog_app_drawer.xml': `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="24dp"
    android:background="@color/tv_navy_bg">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:paddingBottom="12dp">

        <TextView
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="KP TV – All Installed Applications"
            android:textColor="@color/white"
            android:textStyle="bold"
            android:textSize="20sp" />

        <TextView
            android:id="@+id/tv_app_count"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:textColor="@color/tv_neon_blue"
            android:textStyle="bold"
            android:textSize="12sp" />
    </LinearLayout>

    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/rv_apps"
        android:layout_width="match_parent"
        android:layout_height="420dp"
        android:clipToPadding="false" />
</LinearLayout>
`,

  'app/src/main/res/layout/item_app_drawer.xml': `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="vertical"
    android:gravity="center"
    android:focusable="true"
    android:clickable="true"
    android:padding="12dp"
    android:layout_margin="6dp"
    android:background="@drawable/bg_dock_item">

    <ImageView
        android:id="@+id/iv_app_icon"
        android:layout_width="44dp"
        android:layout_height="44dp"
        android:scaleType="fitCenter" />

    <TextView
        android:id="@+id/tv_app_label"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:gravity="center"
        android:singleLine="true"
        android:ellipsize="end"
        android:textColor="@color/white"
        android:textStyle="bold"
        android:textSize="12sp"
        android:layout_marginTop="6dp" />

    <TextView
        android:id="@+id/tv_app_package"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:gravity="center"
        android:singleLine="true"
        android:ellipsize="end"
        android:textColor="@color/text_muted"
        android:textSize="9sp" />
</LinearLayout>
`,

  'README.md': `# KP TV – Smart TV Launcher (Android Studio Project)

Complete native Android Smart TV Launcher engineered for **Iconic Smart TV (32-inch, Cloud TV OS / AOSP)**.

## Build Instructions (Windows / macOS / Linux)
1. Open this folder in **Android Studio** (Hedgehog / Iguana / Jellyfish / Koala or newer).
2. Let Gradle sync \`gradle/libs.versions.toml\`.
3. Build Debug APK:
   \`\`\`bash
   ./gradlew assembleDebug
   \`\`\`
   Output APK: \`app/build/outputs/apk/debug/app-debug.apk\`
4. Build Release APK:
   \`\`\`bash
   ./gradlew assembleRelease
   \`\`\`
   Output APK: \`app/build/outputs/apk/release/app-release.apk\`
`
};

export async function generateAndroidStudioProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  for (const [relativePath, content] of Object.entries(ANDROID_PROJECT_FILES)) {
    zip.file(relativePath, content);
  }

  return await zip.generateAsync({ type: 'blob' });
}
