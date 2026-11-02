package com.kptv.launcher

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo

/**
 * Discovers real installed launchable applications on Android TV / Cloud TV OS.
 * Supports both CATEGORY_LEANBACK_LAUNCHER and standard CATEGORY_LAUNCHER.
 * Does not depend exclusively on hardcoded package names: dynamically discovers all
 * launchable activities and persists user dock customization in SharedPreferences.
 */
class InstalledAppsRepository(private val context: Context) {

    private val prefs = context.getSharedPreferences("kptv_dock_prefs", Context.MODE_PRIVATE)

    companion object {
        // Preferred default priority when initialising dock if present on the TV:
        // 1. NetMirror TV (only if already installed)
        // 2. JioHotstar / Hotstar
        // 3. YouTube
        // 4. Airtel
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

        // 2. Query standard Launcher apps (critical for Cloud TV OS where apps use standard CATEGORY_LAUNCHER)
        val standardIntent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }
        val standardResolved = queryIntentSafe(pm, standardIntent)

        val orderedPinnedList = getSavedPinnedOrder()

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

            val priority = getPreferredDockPriority(pkg, label)
            val isPinned = if (orderedPinnedList != null) {
                orderedPinnedList.contains(pkg)
            } else {
                priority < 10
            }

            val effectiveOrder = if (orderedPinnedList != null && orderedPinnedList.contains(pkg)) {
                orderedPinnedList.indexOf(pkg)
            } else {
                priority
            }

            discovered[pkg] = AppEntry(
                label = label,
                packageName = pkg,
                activityName = activityInfo.name,
                icon = icon,
                isPinnedToDock = isPinned,
                dockPriority = effectiveOrder
            )
        }

        return discovered.values.sortedWith(
            compareBy<AppEntry> { it.dockPriority }.thenBy { it.label.lowercase() }
        )
    }

    /**
     * Returns up to 4 apps for the Home Screen Dock.
     * Uses user-customized pinned apps first, then preferred apps if installed,
     * and dynamically falls back to other installed apps on the TV so the dock is never broken.
     */
    fun getDockApps(): List<AppEntry> {
        val all = getAllInstalledApps()
        val pinned = all.filter { it.isPinnedToDock }
            .sortedWith(compareBy<AppEntry> { it.dockPriority }.thenBy { it.label.lowercase() })

        if (pinned.size >= 4) {
            return pinned.take(4)
        }

        val remaining = all.filter { !it.isPinnedToDock }
        return (pinned + remaining).take(4)
    }

    fun toggleDockPin(packageName: String): Boolean {
        val currentDock = getDockApps().map { it.packageName }.toMutableList()
        val nowPinned = if (currentDock.contains(packageName)) {
            currentDock.remove(packageName)
            false
        } else {
            currentDock.add(0, packageName)
            true
        }
        savePinnedOrder(currentDock.take(4))
        return nowPinned
    }

    private fun getSavedPinnedOrder(): List<String>? {
        val raw = prefs.getString("pinned_order_csv", null) ?: return null
        return raw.split(",").map { it.trim() }.filter { it.isNotEmpty() }
    }

    private fun savePinnedOrder(packages: List<String>) {
        prefs.edit().putString("pinned_order_csv", packages.joinToString(",")).apply()
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

    fun findAndLaunchFirstAvailable(candidates: List<String>, keywordFallback: String? = null): Boolean {
        val allApps = getAllInstalledApps()
        val byPkg = allApps.associateBy { it.packageName }
        for (pkg in candidates) {
            val match = byPkg[pkg]
            if (match != null && launchApp(match)) {
                return true
            }
        }
        if (!keywordFallback.isNullOrEmpty()) {
            val byLabel = allApps.firstOrNull {
                it.label.contains(keywordFallback, ignoreCase = true) ||
                it.packageName.contains(keywordFallback, ignoreCase = true)
            }
            if (byLabel != null && launchApp(byLabel)) {
                return true
            }
        }
        return false
    }

    private fun getPreferredDockPriority(packageName: String, label: String): Int {
        PREFERRED_DOCK_PACKAGES.forEachIndexed { index, group ->
            if (group.any { it.equals(packageName, ignoreCase = true) }) {
                return index
            }
        }
        val lowerLabel = label.lowercase()
        if (lowerLabel.contains("netmirror")) return 0
        if (lowerLabel.contains("hotstar")) return 1
        if (lowerLabel.contains("youtube")) return 2
        if (lowerLabel.contains("airtel")) return 3
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
