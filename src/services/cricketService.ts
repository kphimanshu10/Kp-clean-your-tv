import { CricketApiConfig, CricketMatch, CricketServiceStatus } from '../types/launcher';

export interface CricketFetchResult {
  status: CricketServiceStatus;
  matches: CricketMatch[];
  errorMessage: string | null;
  lastUpdated: string | null;
}

const STORAGE_ENDPOINT_KEY = 'kptv_cricket_api_endpoint';

/**
 * Returns the configured API endpoint URL (note: private API keys are never stored in frontend
 * bundles or exposed via VITE_ environment variables; keys are managed by the backend proxy /api/cricket/*).
 */
export function getCricketApiConfig(): CricketApiConfig {
  let savedEndpoint = 'https://api.cricapi.com/v1/currentMatches';
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_ENDPOINT_KEY);
      if (saved && saved.trim().length > 0) {
        savedEndpoint = saved.trim();
      }
    }
  } catch {
    // ignore storage errors
  }

  return {
    endpointUrl: savedEndpoint,
    apiKey: '',
  };
}

export async function saveCricketApiConfig(config: CricketApiConfig): Promise<CricketFetchResult> {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_ENDPOINT_KEY, config.endpointUrl.trim());
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

  try {
    const res = await fetch('/api/cricket/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        endpointUrl: config.endpointUrl.trim(),
        apiKey: config.apiKey.trim(),
      }),
    });
    if (!res.ok) {
      return {
        status: 'error',
        matches: [],
        errorMessage: `Backend proxy error (HTTP ${res.status})`,
        lastUpdated: new Date().toLocaleTimeString(),
      };
    }
    return (await res.json()) as CricketFetchResult;
  } catch {
    return fetchLiveCricketMatches(config);
  }
}

export async function fetchLiveCricketMatches(
  configOverride?: CricketApiConfig
): Promise<CricketFetchResult> {
  // If configOverride is explicitly passed (e.g., in unit tests or direct runtime validation)
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
