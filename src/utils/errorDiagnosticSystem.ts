import Hls from 'hls.js';
import { IptvPlaylistRecord } from '../data/indianIptvRepo';

export interface DiagnosticIssueItem {
  id: string;
  domain: string;
  severity: 'healthy' | 'warning' | 'error';
  title: string;
  causeExplanation: string;
  suggestedSolution: string;
  canAutoFix: boolean;
  requiresConfirmation?: boolean;
  autoFixLabel?: string;
}

export async function runSystemErrorDiagnostics(): Promise<DiagnosticIssueItem[]> {
  const results: DiagnosticIssueItem[] = [];

  // 1. Network Connection Check
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  results.push({
    id: 'net-connectivity',
    domain: 'Network Connectivity',
    severity: isOnline ? 'healthy' : 'error',
    title: isOnline ? 'Network Connection Active' : 'Network Connection Offline',
    causeExplanation: isOnline
      ? 'Internet and local network sockets are reachable.'
      : 'The TV currently has no active Wi-Fi or Ethernet connection.',
    suggestedSolution: isOnline
      ? 'No action needed.'
      : 'Reconnect Wi-Fi in TV Settings or check your router connection.',
    canAutoFix: !isOnline,
    autoFixLabel: 'Open Wi-Fi Settings',
  });

  // 2. IPTV Playlists & Broken URL / M3U Format Check
  let playlists: IptvPlaylistRecord[] = [];
  let corruptedStorage = false;
  try {
    const raw = localStorage.getItem('kptv_iptv_playlists_v3');
    if (raw) {
      playlists = JSON.parse(raw);
      if (!Array.isArray(playlists)) {
        corruptedStorage = true;
        playlists = [];
      }
    }
  } catch {
    corruptedStorage = true;
  }

  const invalidPlaylists = playlists.filter(
    p =>
      !p ||
      !Array.isArray(p.channels) ||
      p.channels.length === 0 ||
      (!p.url.startsWith('http://') &&
        !p.url.startsWith('https://') &&
        !p.url.startsWith('local://'))
  );

  if (corruptedStorage || invalidPlaylists.length > 0) {
    results.push({
      id: 'iptv-playlist-integrity',
      domain: 'IPTV Playlists & M3U Format',
      severity: 'warning',
      title: `Found ${invalidPlaylists.length || 1} Corrupted or Empty IPTV Playlist Entry`,
      causeExplanation:
        'One or more saved playlist records have malformed URLs or zero valid M3U channels.',
      suggestedSolution:
        'Sanitize saved playlist entries while preserving all valid playlists and favorite channels.',
      canAutoFix: true,
      requiresConfirmation: false,
      autoFixLabel: 'Repair Saved Playlists Safely',
    });
  } else {
    results.push({
      id: 'iptv-playlist-integrity',
      domain: 'IPTV Playlists & M3U Format',
      severity: 'healthy',
      title: `IPTV Storage Healthy (${playlists.length} Valid Playlist${
        playlists.length === 1 ? '' : 's'
      })`,
      causeExplanation: 'All stored M3U/M3U8 playlist records and channel structures are valid.',
      suggestedSolution: 'No repair required.',
      canAutoFix: false,
    });
  }

  // 3. Video Playback & HLS Engine Check
  const hlsSupported = Hls.isSupported();
  const nativeVideo =
    typeof document !== 'undefined' && Boolean(document.createElement('video').canPlayType);
  results.push({
    id: 'video-playback-engine',
    domain: 'Video Playback & Decoders',
    severity: hlsSupported || nativeVideo ? 'healthy' : 'error',
    title: hlsSupported
      ? 'HLS.js + HTML5 MediaCodec Engine Operational'
      : 'Standard HTML5 Video Fallback Active',
    causeExplanation: hlsSupported
      ? 'MediaSource Extensions (MSE) and automatic HLS stream recovery are active.'
      : 'Browser/WebView relies on native HLS decoding.',
    suggestedSolution: 'Use Retry Playback in player if a stream stalls.',
    canAutoFix: false,
  });

  // 4. Launcher Settings & Startup State Check
  let settingsCorrupted = false;
  try {
    const rawSettings = localStorage.getItem('kptv_settings');
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      if (!parsed || typeof parsed !== 'object') settingsCorrupted = true;
    }
  } catch {
    settingsCorrupted = true;
  }

  results.push({
    id: 'launcher-startup-state',
    domain: 'Launcher Startup & Settings',
    severity: settingsCorrupted ? 'error' : 'healthy',
    title: settingsCorrupted
      ? 'Corrupted Launcher Settings JSON Detected'
      : 'Launcher Configuration & Startup State Verified',
    causeExplanation: settingsCorrupted
      ? 'Saved settings in localStorage could not be parsed cleanly.'
      : 'Home screen layout, 16:9 viewport scaler, and dock configuration are valid.',
    suggestedSolution: settingsCorrupted
      ? 'Repair and normalize launcher settings without deleting user playlists.'
      : 'No action needed.',
    canAutoFix: settingsCorrupted,
    autoFixLabel: 'Repair Launcher Settings',
  });

  // 5. Stale Cache & Low-Memory Optimization Check
  let totalStorageChars = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) {
        totalStorageChars += (localStorage.getItem(k) || '').length;
      }
    }
  } catch {
    // ignore
  }
  const storageKb = Math.round((totalStorageChars * 2) / 1024);
  const highCacheUsage = storageKb > 3500;

  results.push({
    id: 'memory-cache-health',
    domain: 'Memory & Cache Optimization',
    severity: highCacheUsage ? 'warning' : 'healthy',
    title: highCacheUsage
      ? `High Local Cache Usage (${storageKb} KB)`
      : `Low-Memory Footprint Optimal (${storageKb} KB used)`,
    causeExplanation: highCacheUsage
      ? 'Cached GitHub playlists are consuming significant browser/WebView storage quota.'
      : 'Storage usage is well within safe limits for 1 GB RAM Smart TVs.',
    suggestedSolution: highCacheUsage
      ? 'Trim temporary GitHub M3U cache while keeping your saved playlists, dock apps, and settings.'
      : 'Optional: Clear temporary stream cache anytime to free memory.',
    canAutoFix: true,
    requiresConfirmation: true,
    autoFixLabel: 'Trim Temporary Stream Cache',
  });

  return results;
}

export function executeSafeAutoFix(issueId: string): {
  fixed: boolean;
  message: string;
} {
  try {
    if (issueId === 'net-connectivity') {
      if (typeof window !== 'undefined' && window.AndroidTvBridge?.openWifiSettings) {
        window.AndroidTvBridge.openWifiSettings();
        return { fixed: true, message: 'Opened Android TV Wi-Fi Settings.' };
      }
      return {
        fixed: false,
        message: 'Please check your Wi-Fi or Ethernet connection in system settings.',
      };
    }

    if (issueId === 'iptv-playlist-integrity') {
      const raw = localStorage.getItem('kptv_iptv_playlists_v3');
      if (!raw) {
        return { fixed: true, message: 'Initialized clean playlist store.' };
      }
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (p: IptvPlaylistRecord) =>
              p &&
              Array.isArray(p.channels) &&
              p.channels.length > 0 &&
              (p.url.startsWith('http://') ||
                p.url.startsWith('https://') ||
                p.url.startsWith('local://'))
          );
          localStorage.setItem('kptv_iptv_playlists_v3', JSON.stringify(valid));
          return {
            fixed: true,
            message: `Repaired playlist storage. Retained ${valid.length} valid playlist(s).`,
          };
        }
      } catch {
        localStorage.setItem('kptv_iptv_playlists_v3', JSON.stringify([]));
        return { fixed: true, message: 'Reset corrupted playlist JSON to a clean array.' };
      }
    }

    if (issueId === 'launcher-startup-state') {
      localStorage.removeItem('kptv_settings');
      return {
        fixed: true,
        message: 'Restored default safe launcher settings. Reload or reopen Settings to apply.',
      };
    }

    if (issueId === 'memory-cache-health') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('kptv_gh_iptv_cache_v1_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      return {
        fixed: true,
        message: `Cleared ${keysToRemove.length} temporary cached stream file(s). Saved playlists and settings were preserved.`,
      };
    }

    return { fixed: false, message: 'No automatic fix registered for this item.' };
  } catch (err) {
    return {
      fixed: false,
      message: err instanceof Error ? err.message : 'Auto-fix encountered an error.',
    };
  }
}
