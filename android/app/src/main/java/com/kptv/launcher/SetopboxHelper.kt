package com.kptv.launcher

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

    fun attemptDirectInputSwitch(context: Context, port: String): Boolean {
        return attemptSystemTvInputIntent(context)
    }

    fun openSetopboxSelector(context: Context, onDismissRestoreFocus: () -> Unit) {
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
                            "Direct HDMI switching is restricted by this TV firmware. No input was switched.",
                            onDismissRestoreFocus
                        )
                    }
                } else {
                    showManualInstructionsDialog(
                        context,
                        hdmiInputs,
                        "How to switch to your Setopbox safely:",
                        onDismissRestoreFocus
                    )
                }
            }
            .setNegativeButton("Close", null)
            .setOnDismissListener { onDismissRestoreFocus() }
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

    fun attemptSystemTvInputIntent(context: Context): Boolean {
        val pm = context.packageManager
        val candidatePackages = listOf(
            "com.android.tv",
            "com.google.android.tv",
            "com.droidlogic.tvinput",
            "com.mstar.tv.tvplayer.ui"
        )
        for (pkg in candidatePackages) {
            try {
                val intent = pm.getLeanbackLaunchIntentForPackage(pkg)
                    ?: pm.getLaunchIntentForPackage(pkg)
                if (intent != null) {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
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
        headerNote: String,
        onDismissRestoreFocus: () -> Unit
    ) {
        val detectedLine = if (detectedInputs.isNotEmpty()) {
            "Detected TV Inputs: ${detectedInputs.joinToString(", ")}\n\n"
        } else {
            "Detected TV Inputs: Standard Cloud TV OS Firmware (Direct HDMI API not exposed to third-party apps)\n\n"
        }

        val message = """
            $headerNote

            $detectedLine
            1. Power ON your DTH / Cable Setopbox.
            2. Press the "SOURCE" or "INPUT" button on your physical Iconic TV remote.
            3. Select HDMI 1, HDMI 2, or AV from the TV's hardware input menu.
        """.trimIndent()

        AlertDialog.Builder(context)
            .setTitle("Setopbox Manual HDMI Instructions")
            .setMessage(message)
            .setPositiveButton("OK", null)
            .setOnDismissListener { onDismissRestoreFocus() }
            .show()
    }
}
