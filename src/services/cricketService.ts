import { CricketApiConfig, CricketMatch, CricketServiceStatus } from '../types/launcher';

export interface CricketFetchResult {
  status: CricketServiceStatus;
  matches: CricketMatch[];
  errorMessage: string | null;
  lastUpdated: string | null;
}

const STORAGE_ENDPOINT_KEY = 'kptv_cricket_api_endpoint';
const STORAGE_ANDROID_KEY = 'kptv_android_cricket_key';

function isRunningInAndroidApk(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.AndroidTvBridge && typeof window.AndroidTvBridge.isNativeAndroid === 'function')
  );
}

/**
 * Normalizes CricAPI or custom JSON match payloads in the client only when running inside the
 * standalone Android APK where the Node.js Express server (/api/cricket/*) is not present.
 */
function normalizeMatchPayloadClient(raw: unknown): CricketMatch[] {
  if (!raw || typeof raw !== 'object') return [];
  const obj = raw as Record<string, unknown>;
  const list = Array.isArray(obj.data)
    ? obj.data
    : Array.isArray(obj.matches)
    ? obj.matches
    : Array.isArray(raw)
    ? raw
    : null;
  if (!list) return [];

  const results: CricketMatch[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const m = item as Record<string, unknown>;
    const teams = Array.isArray(m.teams) ? (m.teams as string[]) : [];
    const teamInfo = Array.isArray(m.teamInfo) ? (m.teamInfo as Record<string, unknown>[]) : [];
    const scores = Array.isArray(m.score) ? (m.score as Record<string, unknown>[]) : [];

    const t1Name = String(teamInfo[0]?.name || teams[0] || 'Team 1');
    const t2Name = String(teamInfo[1]?.name || teams[1] || 'Team 2');
    const t1Code = String(teamInfo[0]?.shortname || t1Name.slice(0, 3).toUpperCase());
    const t2Code = String(teamInfo[1]?.shortname || t2Name.slice(0, 3).toUpperCase());

    const s1 = scores[0];
    const s2 = scores[1];
    const t1Score = s1 && s1.r !== undefined ? `${s1.r}/${s1.w ?? 0}` : '--/--';
    const t2Score = s2 && s2.r !== undefined ? `${s2.r}/${s2.w ?? 0}` : '--/--';
    const t1Overs = s1 && s1.o !== undefined ? `(${s1.o} ov)` : '';
    const t2Overs = s2 && s2.o !== undefined ? `(${s2.o} ov)` : '';

    const statusText = String(m.status || 'Match in progress');
    results.push({
      id: String(m.id || `${t1Code}-${t2Code}`),
      title: `${t1Code} vs ${t2Code}`,
      series: String(m.name || m.series || 'Live Cricket'),
      matchType: String(m.matchType || 'T20').toUpperCase(),
      isLive: true,
      matchStatusText: statusText,
      team1: { name: t1Name, code: t1Code, score: t1Score, overs: t1Overs, flag: '#0284c7' },
      team2: { name: t2Name, code: t2Code, score: t2Score, overs: t2Overs, flag: '#eab308' },
      targetSummary: statusText,
      lastUpdated: new Date().toLocaleTimeString(),
    });
  }
  return results;
}

export function getCricketApiConfig(): CricketApiConfig {
  let savedEndpoint = 'https://api.cricapi.com/v1/currentMatches';
  let savedKey = '';
  try {
    if (typeof window !== 'undefined' && window.AndroidTvBridge?.getCricketConfig) {
      const json = window.AndroidTvBridge.getCricketConfig();
      const parsed = JSON.parse(json) as Partial<CricketApiConfig>;
      if (parsed.endpointUrl) savedEndpoint = parsed.endpointUrl;
      if (parsed.apiKey) savedKey = parsed.apiKey;
    } else if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_ENDPOINT_KEY);
      if (saved && saved.trim().length > 0) {
        savedEndpoint = saved.trim();
      }
      if (isRunningInAndroidApk()) {
        savedKey = localStorage.getItem(STORAGE_ANDROID_KEY) || '';
      }
    }
  } catch {
    // ignore storage errors
  }

  return {
    endpointUrl: savedEndpoint,
    apiKey: savedKey,
  };
}

export async function saveCricketApiConfig(config: CricketApiConfig): Promise<CricketFetchResult> {
  const cleanEndpoint = config.endpointUrl.trim() || 'https://api.cricapi.com/v1/currentMatches';
  const cleanKey = config.apiKey.trim();

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_ENDPOINT_KEY, cleanEndpoint);
      if (isRunningInAndroidApk()) {
        localStorage.setItem(STORAGE_ANDROID_KEY, cleanKey);
      }
    }
    if (typeof window !== 'undefined' && window.AndroidTvBridge?.saveCricketConfig) {
      window.AndroidTvBridge.saveCricketConfig(cleanEndpoint, cleanKey);
    }
  } catch {
    // ignore storage errors
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      status: 'offline',
      matches: [],
      errorMessage: 'TV is currently offline. Check Wi-Fi or Ethernet connection.',
      lastUpdated: new Date().toLocaleTimeString(),
    };
  }

  if (!isRunningInAndroidApk()) {
    try {
      const res = await fetch('/api/cricket/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          endpointUrl: cleanEndpoint,
          apiKey: cleanKey,
        }),
      });
      if (res.ok) {
        return (await res.json()) as CricketFetchResult;
      }
    } catch {
      // Fallback to fetchLiveCricketMatches
    }
  }

  return fetchLiveCricketMatches({ endpointUrl: cleanEndpoint, apiKey: cleanKey });
}

export async function fetchLiveCricketMatches(
  configOverride?: CricketApiConfig
): Promise<CricketFetchResult> {
  if (configOverride) {
    const endpoint = configOverride.endpointUrl.trim();
    const apiKey = configOverride.apiKey.trim();
    const hasCustomDirectFeed =
      endpoint.length > 0 &&
      endpoint !== 'https://api.cricapi.com/v1/currentMatches' &&
      !endpoint.includes('api.cricapi.com');

    if (!apiKey && !hasCustomDirectFeed) {
      return {
        status: 'unconfigured',
        matches: [],
        errorMessage: 'Live score service not configured.',
        lastUpdated: null,
      };
    }
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      status: 'offline',
      matches: [],
      errorMessage: 'TV is currently offline. Check Wi-Fi or Ethernet connection.',
      lastUpdated: new Date().toLocaleTimeString(),
    };
  }

  // Native Android APK path via AndroidTvBridge or direct fetch when inside APK
  if (isRunningInAndroidApk()) {
    const activeCfg = configOverride || getCricketApiConfig();
    const endpoint = activeCfg.endpointUrl.trim();
    const apiKey = activeCfg.apiKey.trim();
    const hasCustomDirectFeed =
      endpoint.length > 0 &&
      endpoint !== 'https://api.cricapi.com/v1/currentMatches' &&
      !endpoint.includes('api.cricapi.com');

    if (!apiKey && !hasCustomDirectFeed) {
      return {
        status: 'unconfigured',
        matches: [],
        errorMessage: 'Live score service not configured.',
        lastUpdated: null,
      };
    }

    try {
      const url = new URL(endpoint);
      if (apiKey && !url.searchParams.has('apikey')) {
        url.searchParams.set('apikey', apiKey);
      }
      const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        return {
          status: 'error',
          matches: [],
          errorMessage: `Live score HTTP ${res.status}`,
          lastUpdated: new Date().toLocaleTimeString(),
        };
      }
      const json = (await res.json()) as Record<string, unknown>;
      if (json.status === 'failure') {
        return {
          status: 'error',
          matches: [],
          errorMessage: String(json.reason || 'API key or quota error.'),
          lastUpdated: new Date().toLocaleTimeString(),
        };
      }
      const matches = normalizeMatchPayloadClient(json);
      return {
        status: matches.length > 0 ? 'live' : 'error',
        matches,
        errorMessage: matches.length > 0 ? null : 'No active cricket matches found.',
        lastUpdated: new Date().toLocaleTimeString(),
      };
    } catch {
      return {
        status: 'error',
        matches: [],
        errorMessage: 'Unable to reach live cricket score service.',
        lastUpdated: new Date().toLocaleTimeString(),
      };
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch('/api/cricket/matches', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      return {
        status: 'error',
        matches: [],
        errorMessage: `Authentication error (HTTP ${response.status}): Invalid API credentials.`,
        lastUpdated: new Date().toLocaleTimeString(),
      };
    }

    if (response.status === 429) {
      return {
        status: 'error',
        matches: [],
        errorMessage: 'API quota exceeded (HTTP 429): Rate limit reached.',
        lastUpdated: new Date().toLocaleTimeString(),
      };
    }

    if (!response.ok) {
      return {
        status: 'error',
        matches: [],
        errorMessage: `Proxy returned HTTP ${response.status}`,
        lastUpdated: new Date().toLocaleTimeString(),
      };
    }

    const data = (await response.json()) as CricketFetchResult;
    if (!data || typeof data.status !== 'string') {
      return {
        status: 'error',
        matches: [],
        errorMessage: 'Invalid response from cricket score proxy.',
        lastUpdated: new Date().toLocaleTimeString(),
      };
    }

    return data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return {
        status: 'offline',
        matches: [],
        errorMessage: 'TV is offline. Check network connection.',
        lastUpdated: new Date().toLocaleTimeString(),
      };
    }

    const message =
      err instanceof Error && err.name === 'AbortError'
        ? 'Timeout error: Live score request timed out (10s).'
        : 'Live score service not configured.';

    return {
      status: message === 'Live score service not configured.' ? 'unconfigured' : 'error',
      matches: [],
      errorMessage: message,
      lastUpdated: null,
    };
  }
}

