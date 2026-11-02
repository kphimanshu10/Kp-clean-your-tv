package com.kptv.launcher

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.media.tv.TvContract
import android.media.tv.TvInputInfo
import android.media.tv.TvInputManager
import android.os.Build

/**
 * Setopbox / HDMI & AV Input Source Launcher.
 * Directly opens the user's selected source (HDMI 1, HDMI 2, or AV) via Android TV Input Framework
 * passthrough URI or hardware TV player intents.
 */
object SetopboxHelper {

    fun attemptDirectInputSwitch(context: Context, port: String): Boolean {
        val normalizedPort = port.trim().lowercase()
        if (attemptTvInputPassthrough(context, normalizedPort)) {
            return true
        }
        return attemptSystemTvInputIntent(context, normalizedPort)
    }

    private fun attemptTvInputPassthrough(context: Context, port: String): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return false
        return try {
            val tif = context.getSystemService(Context.TV_INPUT_SERVICE) as? TvInputManager
                ?: return false
            val inputs = tif.tvInputList
            if (inputs.isEmpty()) return false

            val matchedInput: TvInputInfo? = if (port == "av") {
                inputs.firstOrNull { info ->
                    val label = info.loadLabel(context)?.toString()?.lowercase() ?: ""
                    val id = info.id.lowercase()
                    info.type == TvInputInfo.TYPE_COMPOSITE ||
                        info.type == TvInputInfo.TYPE_COMPONENT ||
                        info.type == TvInputInfo.TYPE_SVIDEO ||
                        label.contains("av") ||
                        label.contains("composite") ||
                        id.contains("av") ||
                        id.contains("cvbs")
                }
            } else {
                val hdmiInputs = inputs.filter { it.type == TvInputInfo.TYPE_HDMI }
                val targetIndex = if (port == "hdmi2") 1 else 0
                hdmiInputs.firstOrNull { info ->
                    val label = info.loadLabel(context)?.toString()?.lowercase() ?: ""
                    val id = info.id.lowercase()
                    if (port == "hdmi2") {
                        label.contains("hdmi 2") || label.contains("hdmi2") || id.contains("hdmi2") || id.contains("hw1")
                    } else {
                        label.contains("hdmi 1") || label.contains("hdmi1") || id.contains("hdmi1") || id.contains("hw0")
                    }
                } ?: hdmiInputs.getOrNull(targetIndex) ?: hdmiInputs.firstOrNull()
            }

            val finalInput = matchedInput ?: inputs.firstOrNull() ?: return false
            val passthroughUri = TvContract.buildChannelUriForPassthroughInput(finalInput.id)
            val viewIntent = Intent(Intent.ACTION_VIEW, passthroughUri).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(viewIntent)
            true
        } catch (_: Exception) {
            false
        }
    }

    fun attemptSystemTvInputIntent(context: Context, port: String = "hdmi1"): Boolean {
        val pm = context.packageManager
        val sourceCode = when (port) {
            "av" -> 1
            "hdmi2" -> 24
            else -> 23 // HDMI 1 common MStar/CloudTV input source ID
        }

        val candidatePackages = listOf(
            "com.android.tv",
            "com.google.android.tv",
            "com.droidlogic.tvinput",
            "com.droidlogic.app.tv",
            "com.mstar.tv.tvplayer.ui",
            "com.mstar.android.tvplayer.ui",
            "com.mediatek.wwtv.tvcenter",
            "com.realtek.tv",
            "com.skyworth.tv",
            "com.cultraview.tv"
        )
        for (pkg in candidatePackages) {
            try {
                val intent = pm.getLeanbackLaunchIntentForPackage(pkg)
                    ?: pm.getLaunchIntentForPackage(pkg)
                if (intent != null) {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    intent.putExtra("source", port)
                    intent.putExtra("input_source", sourceCode)
                    intent.putExtra("port", port)
                    context.startActivity(intent)
                    return true
                }
            } catch (_: Exception) {
                // continue
            }
        }

        // Dynamic scan for any installed system TV / HDMI source app on Cloud TV OS
        try {
            val allApps = InstalledAppsRepository(context).getAllInstalledApps()
            val tvApp = allApps.firstOrNull { app ->
                val p = app.packageName.lowercase()
                val l = app.label.lowercase()
                p.contains("tvinput") || p.contains("tvplayer") || p.contains("hdmi") ||
                    l == "tv" || l == "hdmi" || l == "av" || l == "source"
            }
            if (tvApp != null) {
                val launch = pm.getLeanbackLaunchIntentForPackage(tvApp.packageName)
                    ?: pm.getLaunchIntentForPackage(tvApp.packageName)
                    ?: if (!tvApp.activityName.isNullOrEmpty()) {
                        Intent(Intent.ACTION_MAIN).apply {
                            component = ComponentName(tvApp.packageName, tvApp.activityName)
                        }
                    } else null
                if (launch != null) {
                    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    launch.putExtra("source", port)
                    launch.putExtra("input_source", sourceCode)
                    context.startActivity(launch)
                    return true
                }
            }
        } catch (_: Exception) {
            // ignore
        }

        return false
    }
}
