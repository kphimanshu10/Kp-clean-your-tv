package com.kptv.launcher

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream

/**
 * Discovers real installed launchable applications on Android TV / Cloud TV OS.
 * Supports both CATEGORY_LEANBACK_LAUNCHER and standard CATEGORY_LAUNCHER.
 */
class InstalledAppsRepository(private val context: Context) {

    private val prefs = context.getSharedPreferences("kptv_dock_prefs", Context.MODE_PRIVATE)

    companion object {
        val PREFERRED_DOCK_PACKAGES = listOf(
            listOf("com.netmirror.app", "com.netmirror.tv", "com.netmirror"),
            listOf("in.startv.hotstar.dplus", "in.startv.hotstar", "com.hotstar.tv"),
            listOf("com.google.android.youtube.tv", "com.google.android.youtube", "com.smarttube.tv"),
            listOf("com.airtel.tv", "com.airtel.xstream", "tv.airtel.xstream"),
            listOf("com.netflix.ninja", "com.netflix.mediaclient"),
            listOf("com.amazon.amazonvideo.livingroom", "com.amazon.avod.thirdpartyclient")
        )
    }

    fun getAllInstalledApps(): List<AppEntry> {
        val pm = context.packageManager
        val selfPkg = context.packageName
        val discovered = linkedMapOf<String, AppEntry>()

        val leanbackIntent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER)
        }
        val leanbackResolved = queryIntentSafe(pm, leanbackIntent)

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

    fun toJsonArrayString(): String {
        val arr = JSONArray()
        for (app in getAllInstalledApps()) {
            val obj = JSONObject()
            obj.put("label", app.label)
            obj.put("packageName", app.packageName)
            obj.put("activityName", app.activityName ?: "")
            val iconUrl = drawableToDataUrl(app.icon)
            if (iconUrl != null) {
                obj.put("iconDataUrl", iconUrl)
            }
            arr.put(obj)
        }
        return arr.toString()
    }

    private fun drawableToDataUrl(drawable: Drawable?): String? {
        if (drawable == null) return null
        return try {
            val size = 64
            val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            drawable.setBounds(0, 0, size, size)
            drawable.draw(canvas)
            val out = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 90, out)
            val b64 = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
            "data:image/png;base64,$b64"
        } catch (_: Exception) {
            null
        }
    }

    fun launchByPackageOrAlias(packageNameOrAlias: String): Boolean {
        val trimmed = packageNameOrAlias.trim()
        if (trimmed.isEmpty()) return false

        val allApps = getAllInstalledApps()
        val exact = allApps.firstOrNull { it.packageName.equals(trimmed, ignoreCase = true) }
        if (exact != null && launchApp(exact)) {
            return true
        }

        // Check known alias groups (e.g. YouTube TV vs YouTube, Hotstar TV vs Hotstar)
        val group = PREFERRED_DOCK_PACKAGES.firstOrNull { grp ->
            grp.any { it.equals(trimmed, ignoreCase = true) }
        }
        if (group != null) {
            for (candidate in group) {
                val found = allApps.firstOrNull { it.packageName.equals(candidate, ignoreCase = true) }
                if (found != null && launchApp(found)) {
                    return true
                }
            }
        }

        // Direct PackageManager intent fallback
        val pm = context.packageManager
        try {
            val leanback = pm.getLeanbackLaunchIntentForPackage(trimmed)
            if (leanback != null) {
                leanback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(leanback)
                return true
            }
            val standard = pm.getLaunchIntentForPackage(trimmed)
            if (standard != null) {
                standard.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(standard)
                return true
            }
        } catch (_: Exception) {
            return false
        }
        return false
    }

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
