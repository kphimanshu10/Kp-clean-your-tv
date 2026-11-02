package com.kptv.launcher

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
import java.net.SocketTimeoutException
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
 * Handles unconfigured, offline, timeout, invalid response, quota, and authentication errors.
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

        try {
            val fullUrl = if (apiKey.isNotEmpty() && !apiUrl.contains("apikey=")) {
                val sep = if (apiUrl.contains("?")) "&" else "?"
                "${apiUrl}${sep}apikey=${apiKey}&offset=0"
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
            if (code == 401 || code == 403) {
                return@withContext errorState("Authentication error (HTTP $code)", nowTime)
            }
            if (code == 429) {
                return@withContext errorState("Quota exceeded (HTTP 429)", nowTime)
            }
            if (code != 200) {
                return@withContext errorState("HTTP $code from score service", nowTime)
            }

            val reader = BufferedReader(InputStreamReader(conn.inputStream))
            val body = reader.use { it.readText() }
            val json = try {
                JSONObject(body)
            } catch (_: Exception) {
                return@withContext errorState("Invalid JSON response from server", nowTime)
            }

            if (json.optString("status") == "failure") {
                val reason = json.optString("reason", "API error")
                return@withContext errorState(reason, nowTime)
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

            val t1Score = if (s1 != null) "${s1.optInt("r")}/${s1.optInt("w")}" else "Yet to bat"
            val t1Overs = if (s1 != null) "(${s1.optDouble("o")} ov)" else ""
            val t2Score = if (s2 != null) "${s2.optInt("r")}/${s2.optInt("w")}" else "Yet to bat"
            val t2Overs = if (s2 != null) "(${s2.optDouble("o")} ov)" else ""

            val statusText = matchObj.optString("status", "Live Match")
            val matchType = matchObj.optString("matchType", "LIVE").uppercase()

            CricketScoreState(
                status = "live",
                matchTitle = "$t1Code vs $t2Code",
                matchSubtitle = "$matchType • Updated $nowTime",
                team1Code = t1Code,
                team1Score = t1Score,
                team1Overs = t1Overs,
                team2Code = t2Code,
                team2Score = t2Score,
                team2Overs = t2Overs,
                summaryBanner = statusText,
                lastUpdated = nowTime
            )
        } catch (_: SocketTimeoutException) {
            errorState("Request timed out (8s)", nowTime)
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
        summaryBanner = "Error: $reason",
        lastUpdated = timestamp
    )

    fun isNetworkConnected(): Boolean {
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
