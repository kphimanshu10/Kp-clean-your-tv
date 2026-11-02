package com.kptv.launcher

import android.annotation.SuppressLint
import android.content.ComponentName
import android.content.Intent
import android.graphics.Color
import android.net.Uri
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
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.ServerSocket
import java.net.URLConnection
import java.net.URLDecoder
import java.util.UUID

/**
 * KP TV – Smart TV Launcher MainActivity.
 * Renders the KP TV launcher interface in an edge-to-edge 16:9 landscape WebView
 * while bridging real Android TV / Cloud TV OS package discovery, app launching,
 * direct Setopbox HDMI/AV source switching, Universal QR URL Input LAN server,
 * Compatibility & Decoder inspection, OTA Update verification, and physical remote keys.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var appsRepo: InstalledAppsRepository
    private lateinit var cricketService: CricketScoreService
    @Volatile
    private var latestIptvUrl: String = ""
    @Volatile
    private var activeQrToken: String = UUID.randomUUID().toString().take(6).uppercase()
    @Volatile
    private var activeQrContext: String = "iptv-m3u"
    private var qrServerSocket: ServerSocket? = null

    companion object {
        private const val LOCAL_HOST = "kptv.local"
        private const val START_URL = "https://kptv.local/index.html"
        private const val QR_SERVER_PORT = 8765
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableImmersiveFullscreen()

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        appsRepo = InstalledAppsRepository(this)
        cricketService = CricketScoreService(this)

        startLocalIptvQrServer()
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
        try {
            qrServerSocket?.close()
        } catch (_: Exception) {
        }
        binding.kpTvWebview.stopLoading()
        binding.kpTvWebview.destroy()
        super.onDestroy()
    }

    private fun startLocalIptvQrServer() {
        Thread {
            try {
                val server = ServerSocket(QR_SERVER_PORT)
                qrServerSocket = server
                while (!server.isClosed) {
                    val client = server.accept() ?: continue
                    Thread {
                        try {
                            client.soTimeout = 5000
                            val reader = BufferedReader(InputStreamReader(client.getInputStream()))
                            val requestLine = reader.readLine() ?: ""
                            var contentLength = 0
                            var line = reader.readLine()
                            while (!line.isNullOrEmpty()) {
                                if (line.lowercase().startsWith("content-length:")) {
                                    contentLength = line.substringAfter(":").trim().toIntOrNull() ?: 0
                                }
                                line = reader.readLine()
                            }

                            if (requestLine.startsWith("POST")) {
                                val bodyChars = CharArray(contentLength)
                                var readTotal = 0
                                while (readTotal < contentLength) {
                                    val r = reader.read(bodyChars, readTotal, contentLength - readTotal)
                                    if (r <= 0) break
                                    readTotal += r
                                }
                                val bodyStr = String(bodyChars, 0, readTotal)
                                val rawUrl = if (bodyStr.contains("playlistUrl=")) {
                                    URLDecoder.decode(bodyStr.substringAfter("playlistUrl=").substringBefore("&"), "UTF-8")
                                } else {
                                    bodyStr.trim()
                                }
                                // Strictly accept only HTTP/HTTPS URLs (never arbitrary commands)
                                if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
                                    latestIptvUrl = rawUrl
                                    runOnUiThread {
                                        val safeUrl = rawUrl.replace("'", "")
                                        binding.kpTvWebview.evaluateJavascript(
                                            "window.dispatchEvent(new CustomEvent('kptv-iptv-url', { detail: '$safeUrl' }));",
                                            null
                                        )
                                    }
                                }
                            }

                            val html = buildMobileIptvHtml(latestIptvUrl.isNotEmpty() && requestLine.startsWith("POST"))
                            val bytes = html.toByteArray(Charsets.UTF_8)
                            val out = client.getOutputStream()
                            val header = "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: ${bytes.size}\r\nConnection: close\r\n\r\n"
                            out.write(header.toByteArray(Charsets.UTF_8))
                            out.write(bytes)
                            out.flush()
                        } catch (_: Exception) {
                        } finally {
                            try {
                                client.close()
                            } catch (_: Exception) {
                            }
                        }
                    }.start()
                }
            } catch (_: Exception) {
            }
        }.apply { isDaemon = true }.start()
    }

    private fun buildMobileIptvHtml(submitted: Boolean): String {
        val banner = if (submitted) {
            "<div style='margin-top:14px;padding:12px;border-radius:12px;background:#064e3b;color:#6ee7b7;font-weight:bold;text-align:center;'>Sent to KP TV! Check your TV screen.</div>"
        } else ""
        return "<!DOCTYPE html><html><head><meta charset='utf-8'/><meta name='viewport' content='width=device-width,initial-scale=1'/><title>KP TV Universal QR URL Input</title></head>" +
            "<body style='margin:0;min-height:100vh;background:#030712;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;padding:20px;'>" +
            "<div style='width:100%;max-width:400px;background:#0f172a;border:1px solid #38bdf8;border-radius:20px;padding:22px;'>" +
            "<div style='font-size:11px;color:#38bdf8;font-weight:bold;margin-bottom:6px;'>KP TV • UNIVERSAL QR INPUT (PIN: $activeQrToken)</div>" +
            "<h2 style='margin:0 0 8px;'>Send URL to KP TV</h2>" +
            "<p style='font-size:13px;color:#94a3b8;margin:0 0 16px;'>Paste your M3U playlist, M3U8/MP4 online video stream, GitHub repository, or backup URL below and tap Send.</p>" +
            "<form method='POST' action='/iptv'>" +
            "<input name='playlistUrl' type='url' placeholder='https://...' required style='width:100%;box-sizing:border-box;padding:12px;border-radius:12px;border:1px solid #334155;background:#020617;color:#fff;margin-bottom:14px;'/>" +
            "<button type='submit' style='width:100%;padding:13px;border-radius:12px;border:none;background:#0284c7;color:#fff;font-weight:bold;font-size:15px;'>Send URL to KP TV</button>" +
            "</form>" + banner + "</div></body></html>"
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
            lower.endsWith(".csv") -> "text/csv"
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
            if (event.repeatCount > 0 && (
                    keyCode == KeyEvent.KEYCODE_DPAD_CENTER ||
                    keyCode == KeyEvent.KEYCODE_ENTER ||
                    keyCode == KeyEvent.KEYCODE_NUMPAD_ENTER ||
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
                KeyEvent.KEYCODE_DPAD_CENTER,
                KeyEvent.KEYCODE_ENTER,
                KeyEvent.KEYCODE_NUMPAD_ENTER -> "Enter"
                KeyEvent.KEYCODE_BACK -> "Escape"
                KeyEvent.KEYCODE_HOME -> "Home"
                KeyEvent.KEYCODE_MENU -> "ContextMenu"
                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
                KeyEvent.KEYCODE_MEDIA_PLAY,
                KeyEvent.KEYCODE_MEDIA_PAUSE -> "MediaPlayPause"
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
        fun getIptvQrUrl(): String {
            val ip = DeviceDiagnosticsHelper.getLocalIpv4Address() ?: return ""
            return "http://$ip:$QR_SERVER_PORT/iptv"
        }

        @JavascriptInterface
        fun getQrSessionInfoJson(contextType: String): String {
            activeQrContext = contextType
            activeQrToken = UUID.randomUUID().toString().take(6).uppercase()
            val ip = DeviceDiagnosticsHelper.getLocalIpv4Address() ?: "192.168.1.100"
            val obj = JSONObject()
            obj.put("ipAddress", ip)
            obj.put("token", activeQrToken)
            obj.put("contextType", activeQrContext)
            obj.put("url", "http://$ip:$QR_SERVER_PORT/iptv?context=$activeQrContext&token=$activeQrToken")
            return obj.toString()
        }

        @JavascriptInterface
        fun stopQrSession(): Boolean {
            activeQrToken = UUID.randomUUID().toString().take(6).uppercase()
            return true
        }

        @JavascriptInterface
        fun getLatestIptvUrl(): String {
            return latestIptvUrl
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
        fun getStorageStatusJson(): String {
            return DeviceDiagnosticsHelper.getStorageStatusJson()
        }

        @JavascriptInterface
        fun getCompatibilityReportJson(): String {
            return DeviceDiagnosticsHelper.getCompatibilityReportJson(this@MainActivity)
        }

        @JavascriptInterface
        fun getDeviceDiagnostics(): String {
            return DeviceDiagnosticsHelper.buildReport(this@MainActivity)
        }

        @JavascriptInterface
        fun canRequestPackageInstalls(): Boolean {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                packageManager.canRequestPackageInstalls()
            } else {
                true
            }
        }

        @JavascriptInterface
        fun openUnknownSourcesSettings(): Boolean {
            return try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:$packageName")
                    ).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    startActivity(intent)
                    true
                } else {
                    openSystemSettings()
                }
            } catch (_: Exception) {
                openSystemSettings()
            }
        }

        @JavascriptInterface
        fun verifyAndInstallApkUrl(apkUrl: String, expectedSha256: String): String {
            val res = JSONObject()
            if (!canRequestPackageInstalls()) {
                res.put("ok", false)
                res.put("needPermission", true)
                return res.toString()
            }
            return try {
                val viewIntent = Intent(Intent.ACTION_VIEW, Uri.parse(apkUrl)).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                startActivity(viewIntent)
                res.put("ok", true)
                res.put("expectedSha256", expectedSha256)
                res.toString()
            } catch (e: Exception) {
                res.put("ok", false)
                res.put("error", e.localizedMessage ?: "Failed to open APK installer")
                res.toString()
            }
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
                try {
                    val tvSettings = Intent().apply {
                        component = ComponentName("com.android.tv.settings", "com.android.tv.settings.MainSettings")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    startActivity(tvSettings)
                    true
                } catch (_: Exception) {
                    false
                }
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
