package com.kptv.launcher

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.kptv.launcher.databinding.ActivityMainBinding
import java.net.URLConnection

/**
 * KP TV – Smart TV Launcher MainActivity.
 * Renders the full production KP TV web application inside a hardware-accelerated,
 * edge-to-edge 16:9 landscape WebView while bridging real Android TV / Cloud TV OS
 * package discovery, app launching, HDMI input helpers, Wi-Fi status, and D-pad keys.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var appsRepo: InstalledAppsRepository
    private lateinit var cricketService: CricketScoreService

    companion object {
        private const val LOCAL_HOST = "kptv.local"
        private const val START_URL = "https://kptv.local/index.html"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableImmersiveFullscreen()

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        appsRepo = InstalledAppsRepository(this)
        cricketService = CricketScoreService(this)

        setupWebView()
        if (savedInstanceState == null) {
            binding.kpTvWebview.loadUrl(START_URL)
        } else {
            binding.kpTvWebview.restoreState(savedInstanceState)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        binding.kpTvWebview.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        enableImmersiveFullscreen()
        binding.kpTvWebview.onResume()
        binding.kpTvWebview.requestFocus()
    }

    override fun onPause() {
        binding.kpTvWebview.onPause()
        super.onPause()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            enableImmersiveFullscreen()
            binding.kpTvWebview.requestFocus()
        }
    }

    override fun onDestroy() {
        binding.kpTvWebview.stopLoading()
        binding.kpTvWebview.destroy()
        super.onDestroy()
    }

    private fun enableImmersiveFullscreen() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val webView = binding.kpTvWebview
        webView.setBackgroundColor(Color.parseColor("#030712"))
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.overScrollMode = View.OVER_SCROLL_NEVER
        webView.isHorizontalScrollBarEnabled = false
        webView.isVerticalScrollBarEnabled = false
        webView.isFocusable = true
        webView.isFocusableInTouchMode = true

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            useWideViewPort = true
            loadWithOverviewMode = true
            textZoom = 100
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            allowFileAccess = false
            allowContentAccess = false
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        }

        webView.addJavascriptInterface(AndroidTvBridge(), "AndroidTvBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                val uri = request?.url ?: return null
                if (!uri.host.equals(LOCAL_HOST, ignoreCase = true)) {
                    return super.shouldInterceptRequest(view, request)
                }

                var relPath = uri.path?.removePrefix("/") ?: "index.html"
                if (relPath.isEmpty()) relPath = "index.html"
                val assetPath = "www/$relPath"

                return try {
                    val inputStream = assets.open(assetPath)
                    val mimeType = resolveMimeType(relPath)
                    val headers = mapOf(
                        "Access-Control-Allow-Origin" to "*",
                        "Cache-Control" to "no-cache"
                    )
                    WebResourceResponse(mimeType, "UTF-8", 200, "OK", headers, inputStream)
                } catch (_: Exception) {
                    null
                }
            }
        }
    }

    private fun resolveMimeType(path: String): String {
        val lower = path.lowercase()
        return when {
            lower.endsWith(".html") -> "text/html"
            lower.endsWith(".js") || lower.endsWith(".mjs") -> "application/javascript"
            lower.endsWith(".css") -> "text/css"
            lower.endsWith(".json") -> "application/json"
            lower.endsWith(".svg") -> "image/svg+xml"
            lower.endsWith(".png") -> "image/png"
            lower.endsWith(".jpg") || lower.endsWith(".jpeg") -> "image/jpeg"
            lower.endsWith(".webp") -> "image/webp"
            lower.endsWith(".woff2") -> "font/woff2"
            lower.endsWith(".woff") -> "font/woff"
            lower.endsWith(".ttf") -> "font/ttf"
            else -> URLConnection.guessContentTypeFromName(path) ?: "application/octet-stream"
        }
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN) {
            val keyCode = event.keyCode
            // Guard against accidental double activation on held Enter / Back
            if (event.repeatCount > 0 && (
                    keyCode == KeyEvent.KEYCODE_DPAD_CENTER ||
                    keyCode == KeyEvent.KEYCODE_ENTER ||
                    keyCode == KeyEvent.KEYCODE_BACK
                )
            ) {
                return true
            }

            val jsKey = when (keyCode) {
                KeyEvent.KEYCODE_DPAD_UP -> "ArrowUp"
                KeyEvent.KEYCODE_DPAD_DOWN -> "ArrowDown"
                KeyEvent.KEYCODE_DPAD_LEFT -> "ArrowLeft"
                KeyEvent.KEYCODE_DPAD_RIGHT -> "ArrowRight"
                KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER -> "Enter"
                KeyEvent.KEYCODE_BACK -> "Escape"
                KeyEvent.KEYCODE_HOME -> "Home"
                else -> null
            }

            if (jsKey != null) {
                binding.kpTvWebview.evaluateJavascript(
                    "window.dispatchEvent(new KeyboardEvent('keydown', { key: '$jsKey', bubbles: true }));",
                    null
                )
                return true
            }
        }
        return super.dispatchKeyEvent(event)
    }

    inner class AndroidTvBridge {

        @JavascriptInterface
        fun isNativeAndroid(): Boolean = true

        @JavascriptInterface
        fun getInstalledApps(): String {
            return appsRepo.toJsonArrayString()
        }

        @JavascriptInterface
        fun launchApp(packageName: String): Boolean {
            return appsRepo.launchByPackageOrAlias(packageName)
        }

        @JavascriptInterface
        fun switchHdmiInput(port: String): Boolean {
            return SetopboxHelper.attemptDirectInputSwitch(this@MainActivity, port)
        }

        @JavascriptInterface
        fun saveCricketConfig(endpointUrl: String, apiKey: String): Boolean {
            cricketService.saveApiConfig(endpointUrl, apiKey)
            return true
        }

        @JavascriptInterface
        fun getCricketConfig(): String {
            return cricketService.getConfigJson()
        }

        @JavascriptInterface
        fun getWifiStatus(): String {
            return DeviceDiagnosticsHelper.getWifiStatusJson(this@MainActivity)
        }

        @JavascriptInterface
        fun getDeviceDiagnostics(): String {
            return DeviceDiagnosticsHelper.buildReport(this@MainActivity)
        }

        @JavascriptInterface
        fun openSystemSettings(): Boolean {
            return try {
                val intent = Intent(Settings.ACTION_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                startActivity(intent)
                true
            } catch (_: Exception) {
                false
            }
        }

        @JavascriptInterface
        fun openWifiSettings(): Boolean {
            return try {
                val intent = Intent(Settings.ACTION_WIFI_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                startActivity(intent)
                true
            } catch (_: Exception) {
                openSystemSettings()
            }
        }
    }
}
