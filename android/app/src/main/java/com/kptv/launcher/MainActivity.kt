package com.kptv.launcher

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
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
    private var lastFocusedViewId: Int = R.id.card_live_tv

    private val uiPrefs by lazy {
        getSharedPreferences("kptv_ui_prefs", Context.MODE_PRIVATE)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        appsRepo = InstalledAppsRepository(this)
        cricketService = CricketScoreService(this)

        applySavedWallpaperPreset()
        updateClockAndDateVisibility()
        setupLiveClockAndDate()
        setupDpadFocusAnimations()
        setupClickActions()
        renderDynamicDock()
        updateWifiStatusBadge()
        refreshCricketScoreCard()

        binding.cardLiveTv.post {
            binding.cardLiveTv.requestFocus()
        }
    }

    override fun onResume() {
        super.onResume()
        renderDynamicDock()
        updateWifiStatusBadge()
        refreshCricketScoreCard()
    }

    override fun onDestroy() {
        clockJob?.cancel()
        uiScope.cancel()
        super.onDestroy()
    }

    private fun isClock24Hours(): Boolean = uiPrefs.getBoolean("clock_24h", false)
    private fun isDateVisible(): Boolean = uiPrefs.getBoolean("show_date", true)

    private fun updateClockAndDateVisibility() {
        binding.tvDate.visibility = if (isDateVisible()) View.VISIBLE else View.GONE
    }

    private fun setupLiveClockAndDate() {
        clockJob = uiScope.launch {
            while (isActive) {
                val now = Date()
                val timePattern = if (isClock24Hours()) "HH:mm" else "hh:mm a"
                val timeFormat = SimpleDateFormat(timePattern, Locale.getDefault())
                val dateFormat = SimpleDateFormat("EEE, dd MMM yyyy", Locale.getDefault())

                binding.tvClock.text = timeFormat.format(now).uppercase(Locale.getDefault())
                binding.tvDate.text = dateFormat.format(now)
                delay(1000L)
            }
        }
    }

    private fun updateWifiStatusBadge() {
        val online = cricketService.isNetworkConnected()
        binding.btnHeaderWifi.text = if (online) "Wi-Fi: Online" else "Wi-Fi: Offline"
    }

    private fun setupDpadFocusAnimations() {
        val focusableViews = listOf(
            binding.btnHeaderWallpaper,
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
                    lastFocusedViewId = v.id
                    v.animate().scaleX(1.06f).scaleY(1.06f).setDuration(140).start()
                    v.elevation = 16f
                } else {
                    v.animate().scaleX(1.0f).scaleY(1.0f).setDuration(140).start()
                    v.elevation = 4f
                }
            }
        }
    }

    private fun restoreLastFocus() {
        val target = findViewById<View>(lastFocusedViewId) ?: binding.cardLiveTv
        target.post { target.requestFocus() }
    }

    /**
     * Dynamically binds the 4 Home Dock slots to the user's pinned/installed apps,
     * falling back gracefully to preferred labels if an app is not yet installed.
     */
    private fun renderDynamicDock() {
        val dockViews = listOf(
            binding.dockNetmirror,
            binding.dockHotstar,
            binding.dockYoutube,
            binding.dockAirtel
        )
        val fallbackLabels = listOf("NetMirror TV", "JioHotstar", "YouTube", "Airtel")
        val fallbackGroups = InstalledAppsRepository.PREFERRED_DOCK_PACKAGES
        val dockApps = appsRepo.getDockApps()

        for (i in dockViews.indices) {
            val slotView = dockViews[i]
            val entry = dockApps.getOrNull(i)

            if (entry != null) {
                slotView.text = entry.label
                slotView.setOnClickListener {
                    if (!appsRepo.launchApp(entry)) {
                        Toast.makeText(this, "Unable to launch ${entry.label}", Toast.LENGTH_SHORT).show()
                    }
                }
                slotView.setOnLongClickListener {
                    showRealAppDrawerDialog()
                    true
                }
            } else {
                val label = fallbackLabels[i]
                val group = fallbackGroups[i]
                slotView.text = label
                slotView.setOnClickListener {
                    launchPreferredOrNotify(group, label)
                }
                slotView.setOnLongClickListener {
                    showRealAppDrawerDialog()
                    true
                }
            }
        }
    }

    private fun setupClickActions() {
        // Header Buttons
        binding.btnHeaderWallpaper.setOnClickListener { showWallpaperSelectorDialog() }
        binding.btnHeaderWifi.setOnClickListener { showWifiStatusDialog() }
        binding.btnHeaderSettings.setOnClickListener { openSystemOrLauncherSettings() }
        binding.btnHeaderNotifications.setOnClickListener { showDiagnosticsAndStatusDialog() }

        // Sidebar Buttons
        binding.navHome.setOnClickListener { binding.cardLiveTv.requestFocus() }
        binding.navApps.setOnClickListener { showRealAppDrawerDialog() }
        binding.navSettings.setOnClickListener { openSystemOrLauncherSettings() }
        binding.navAbout.setOnClickListener { showDiagnosticsAndStatusDialog() }

        // 3 Hero Cards
        binding.cardLiveTv.setOnClickListener { launchLiveTvOrPlayer() }
        binding.cardSetopbox.setOnClickListener {
            SetopboxHelper.openSetopboxSelector(this) { restoreLastFocus() }
        }
        binding.cardCricket.setOnClickListener { showCricketConfigDialog() }

        // 5th Dock Button: More Apps Drawer
        binding.dockMore.setOnClickListener {
            showRealAppDrawerDialog()
        }
    }

    private fun launchPreferredOrNotify(candidatePackages: List<String>, displayName: String) {
        val launched = appsRepo.findAndLaunchFirstAvailable(candidatePackages, displayName)
        if (!launched) {
            AlertDialog.Builder(this)
                .setTitle("$displayName Not Installed")
                .setMessage(
                    "$displayName (${candidatePackages.first()}) is not currently installed on this TV.\n\n" +
                    "KP TV never automatically downloads unofficial APKs. Select 'Open App Drawer' to launch or pin any installed application."
                )
                .setPositiveButton("Open App Drawer") { _, _ -> showRealAppDrawerDialog() }
                .setNegativeButton("Close", null)
                .setOnDismissListener { restoreLastFocus() }
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
        val launched = appsRepo.findAndLaunchFirstAvailable(liveTvCandidates, "tv")
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
            hint = "Enter CricAPI Key (saved in private device preferences)"
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
            .setOnDismissListener { restoreLastFocus() }
            .show()
    }

    private fun showWallpaperSelectorDialog() {
        val presetNames = arrayOf(
            "1. KP TV Alpine Sunset (Default)",
            "2. Nordic Aurora Night",
            "3. Neon Cyber Grid",
            "4. Galactic Deep Space",
            "5. Amber Sunset Serenade",
            "6. OLED Pure Minimal"
        )
        val currentIdx = uiPrefs.getInt("wallpaper_preset_index", 0)

        AlertDialog.Builder(this)
            .setTitle("Wallpaper Studio – Select TV Backdrop")
            .setSingleChoiceItems(presetNames, currentIdx) { dialog, which ->
                uiPrefs.edit().putInt("wallpaper_preset_index", which).apply()
                applySavedWallpaperPreset()
                dialog.dismiss()
            }
            .setNegativeButton("Close", null)
            .setOnDismissListener { restoreLastFocus() }
            .show()
    }

    private fun applySavedWallpaperPreset() {
        val presetIdx = uiPrefs.getInt("wallpaper_preset_index", 0)
        val colors = when (presetIdx) {
            1 -> intArrayOf(Color.parseColor("#021410"), Color.parseColor("#064E3B"), Color.parseColor("#022C22"))
            2 -> intArrayOf(Color.parseColor("#050114"), Color.parseColor("#4C1D95"), Color.parseColor("#701A75"))
            3 -> intArrayOf(Color.parseColor("#020617"), Color.parseColor("#1E1B4B"), Color.parseColor("#0F172A"))
            4 -> intArrayOf(Color.parseColor("#1C0B02"), Color.parseColor("#7C2D12"), Color.parseColor("#0C0401"))
            5 -> intArrayOf(Color.parseColor("#030712"), Color.parseColor("#030712"), Color.parseColor("#030712"))
            else -> intArrayOf(Color.parseColor("#050A1C"), Color.parseColor("#1E1B4B"), Color.parseColor("#3B0764"))
        }
        val gd = GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, colors)
        binding.rootContainer.background = gd
    }

    private fun showRealAppDrawerDialog() {
        val installedApps = appsRepo.getAllInstalledApps()
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_app_drawer, null)
        val recyclerView = dialogView.findViewById<RecyclerView>(R.id.rv_apps)
        val tvCount = dialogView.findViewById<TextView>(R.id.tv_app_count)

        tvCount.text = "${installedApps.size} Installed Apps • Long-press OK to Pin/Unpin Dock"
        recyclerView.layoutManager = GridLayoutManager(this, 4)

        val dialog = AlertDialog.Builder(this, R.style.Theme_KPTVLauncher)
            .setView(dialogView)
            .setNegativeButton("Back to Home", null)
            .setOnDismissListener {
                renderDynamicDock()
                restoreLastFocus()
            }
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
                            "Unable to launch ${app.label}",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }

                holder.itemView.setOnLongClickListener {
                    val pinned = appsRepo.toggleDockPin(app.packageName)
                    renderDynamicDock()
                    Toast.makeText(
                        this@MainActivity,
                        if (pinned) "Pinned ${app.label} to Home Dock" else "Unpinned ${app.label}",
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

    private fun showWifiStatusDialog() {
        val netSummary = DeviceDiagnosticsHelper.getNetworkStatusSummary(this)
        AlertDialog.Builder(this)
            .setTitle("Network & Wi-Fi Status")
            .setMessage("Current Connection: $netSummary")
            .setPositiveButton("Open System Wi-Fi Settings") { _, _ ->
                try {
                    startActivity(Intent(Settings.ACTION_WIFI_SETTINGS))
                } catch (_: Exception) {
                    try {
                        startActivity(Intent(Settings.ACTION_SETTINGS))
                    } catch (_: Exception) {}
                }
            }
            .setNegativeButton("Close", null)
            .setOnDismissListener { restoreLastFocus() }
            .show()
    }

    private fun openSystemOrLauncherSettings() {
        val clockLabel = if (isClock24Hours()) "Clock Format: 24-Hour (Switch to 12-Hour)" else "Clock Format: 12-Hour (Switch to 24-Hour)"
        val dateLabel = if (isDateVisible()) "Date Display: Visible (Click to Hide)" else "Date Display: Hidden (Click to Show)"

        val options = arrayOf(
            "Wallpaper Studio (Change TV Backdrop)",
            clockLabel,
            dateLabel,
            "Open Android TV System Settings",
            "Device Diagnostics & Compatibility Report"
        )
        AlertDialog.Builder(this)
            .setTitle("KP TV Settings")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> showWallpaperSelectorDialog()
                    1 -> {
                        uiPrefs.edit().putBoolean("clock_24h", !isClock24Hours()).apply()
                    }
                    2 -> {
                        uiPrefs.edit().putBoolean("show_date", !isDateVisible()).apply()
                        updateClockAndDateVisibility()
                    }
                    3 -> {
                        try {
                            startActivity(Intent(Settings.ACTION_SETTINGS))
                        } catch (_: Exception) {
                            Toast.makeText(this, "System settings unavailable", Toast.LENGTH_SHORT).show()
                        }
                    }
                    4 -> showDiagnosticsAndStatusDialog()
                }
            }
            .setNegativeButton("Close", null)
            .setOnDismissListener { restoreLastFocus() }
            .show()
    }

    private fun showDiagnosticsAndStatusDialog() {
        val report = DeviceDiagnosticsHelper.buildReport(this)
        AlertDialog.Builder(this)
            .setTitle("KP TV – Smart TV Diagnostics & Safety")
            .setMessage(report)
            .setPositiveButton("OK", null)
            .setOnDismissListener { restoreLastFocus() }
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
