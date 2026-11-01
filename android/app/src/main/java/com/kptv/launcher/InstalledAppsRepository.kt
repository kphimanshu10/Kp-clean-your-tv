package com.kptv.launcher

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
