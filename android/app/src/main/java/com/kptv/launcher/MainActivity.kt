package com.kptv.launcher

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
                .setTitle("$displayName Not Installed")
                .setMessage(
                    "$displayName (${candidatePackages.first()}) was not found on this TV.\n\n" +
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

        tvCount.text = "${installedApps.size} Installed Apps Detected"
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
                            "Unable to launch ${app.label}",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }

                holder.itemView.setOnLongClickListener {
                    val pinned = appsRepo.toggleDockPin(app.packageName)
                    Toast.makeText(
                        this@MainActivity,
                        if (pinned) "Pinned ${app.label} to Dock" else "Unpinned ${app.label}",
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
