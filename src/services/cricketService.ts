import { CricketApiConfig, CricketMatch, CricketServiceStatus } from '../types/launcher';

export interface CricketFetchResult {
  status: CricketServiceStatus;
  matches: CricketMatch[];
  errorMessage: string | null;
  lastUpdated: string | null;
}

const STORAGE_KEY = 'kptv_cricket_api_config';

export function getCricketApiConfig(): CricketApiConfig {
  const envUrl = (import.meta.env.VITE_CRICKET_API_URL || '').trim();
  const envKey = (import.meta.env.VITE_CRICKET_API_KEY || '').trim();

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<CricketApiConfig>;
      return {
        endpointUrl: (parsed.endpointUrl ?? envUrl) || 'https://api.cricapi.com/v1/currentMatches',
        apiKey: (parsed.apiKey ?? envKey) || '',
      };
    }
  } catch {
    // ignore storage errors
  }

  return {
    endpointUrl: envUrl || 'https://api.cricapi.com/v1/currentMatches',
    apiKey: envKey,
  };
}

export function saveCricketApiConfig(config: CricketApiConfig): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        endpointUrl: config.endpointUrl.trim(),
        apiKey: config.apiKey.trim(),
      })
    );
  } catch {
    // ignore storage errors
  }
}

interface CricApiScoreEntry {
  r?: number;
  w?: number;
  o?: number;
  inning?: string;
}

interface CricApiTeamInfo {
  name?: string;
  shortname?: string;
  img?: string;
}

interface CricApiMatchItem {
  id?: string;
  name?: string;
  matchType?: string;
  status?: string;
  venue?: string;
  dateTimeGMT?: string;
  teams?: string[];
  teamInfo?: CricApiTeamInfo[];
  score?: CricApiScoreEntry[];
  matchStarted?: boolean;
  matchEnded?: boolean;
}

function buildTeamCode(name: string, shortname?: string): string {
  if (shortname && shortname.trim().length > 0) {
    return shortname.trim().toUpperCase().slice(0, 4);
  }
  const clean = name.replace(/[^a-zA-Z ]/g, '').trim();
  const words = clean.split(/\s+/);
  if (words.length >= 2) {
    return words.map(w => w[0]).join('').toUpperCase().slice(0, 4);
  }
  return clean.slice(0, 3).toUpperCase() || 'TM';
}

export async function fetchLiveCricketMatches(
  configOverride?: CricketApiConfig
): Promise<CricketFetchResult> {
  const config = configOverride || getCricketApiConfig();
  const endpoint = config.endpointUrl.trim();
  const apiKey = config.apiKey.trim();

  // Check if a legitimate API is configured first
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

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      status: 'offline',
      matches: [],
      errorMessage: 'TV is currently offline. Check Wi-Fi or Ethernet connection.',
      lastUpdated: new Date().toLocaleTimeString(),
    };
  }

  try {
    const requestUrl = new URL(endpoint);
    if (apiKey && !requestUrl.searchParams.has('apikey')) {
      requestUrl.searchParams.set('apikey', apiKey);
    }
    if (endpoint.includes('cricapi.com') && !requestUrl.searchParams.has('offset')) {
      requestUrl.searchParams.set('offset', '0');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(requestUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        status: 'error',
        matches: [],
        errorMessage: `API returned HTTP ${response.status} (${response.statusText || 'Error'})`,
        lastUpdated: new Date().toLocaleTimeString(),
      };
    }

    const payload = await response.json();

    if (payload && payload.status === 'failure') {
      return {
        status: 'error',
        matches: [],
        errorMessage: payload.reason || 'Cricket API authentication or quota error.',
        lastUpdated: new Date().toLocaleTimeString(),
      };
    }

    const rawList: CricApiMatchItem[] = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.matches)
      ? payload.matches
      : Array.isArray(payload)
      ? payload
      : [];

    if (rawList.length === 0) {
      return {
        status: 'error',
        matches: [],
        errorMessage: 'No active cricket matches returned by the configured API.',
        lastUpdated: new Date().toLocaleTimeString(),
      };
    }

    const nowFormatted = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const parsedMatches: CricketMatch[] = rawList.slice(0, 9).map((item, idx) => {
      const team1Name = item.teamInfo?.[0]?.name || item.teams?.[0] || 'Team 1';
      const team2Name = item.teamInfo?.[1]?.name || item.teams?.[1] || 'Team 2';
      const team1Code = buildTeamCode(team1Name, item.teamInfo?.[0]?.shortname);
      const team2Code = buildTeamCode(team2Name, item.teamInfo?.[1]?.shortname);

      const scores = Array.isArray(item.score) ? item.score : [];
      const score1 = scores[0];
      const score2 = scores[1];

      const t1ScoreStr =
        score1 && typeof score1.r === 'number'
          ? `${score1.r}/${score1.w ?? 0}`
          : 'Yet to bat';
      const t1OversStr =
        score1 && typeof score1.o === 'number' ? `(${score1.o} ov)` : '';

      const t2ScoreStr =
        score2 && typeof score2.r === 'number'
          ? `${score2.r}/${score2.w ?? 0}`
          : 'Yet to bat';
      const t2OversStr =
        score2 && typeof score2.o === 'number' ? `(${score2.o} ov)` : '';

      const matchTypeUpper = (item.matchType || 'MATCH').toUpperCase();
      const isLiveMatch = Boolean(item.matchStarted && !item.matchEnded);

      return {
        id: item.id || `live-match-${idx}`,
        title: `${team1Code} vs ${team2Code}`,
        series: item.name || `${matchTypeUpper} • ${isLiveMatch ? 'Live' : 'Match'}`,
        matchType: matchTypeUpper,
        isLive: isLiveMatch,
        matchStatusText: item.status || 'Match in progress',
        team1: {
          name: team1Name,
          code: team1Code,
          score: t1ScoreStr,
          overs: t1OversStr,
          flag: '',
        },
        team2: {
          name: team2Name,
          code: team2Code,
          score: t2ScoreStr,
          overs: t2OversStr,
          flag: '',
        },
        targetSummary: item.status || 'Live Match Update',
        lastUpdated: nowFormatted,
      };
    });

    return {
      status: 'live',
      matches: parsedMatches,
      errorMessage: null,
      lastUpdated: nowFormatted,
    };
  } catch (err: unknown) {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      return {
        status: 'offline',
        matches: [],
        errorMessage: 'TV is offline. Check network connection.',
        lastUpdated: new Date().toLocaleTimeString(),
      };
    }

    const message =
      err instanceof Error
        ? err.name === 'AbortError'
          ? 'Live score request timed out (10s).'
          : err.message
        : 'Unable to reach live cricket score service.';

    return {
      status: 'error',
      matches: [],
      errorMessage: message,
      lastUpdated: new Date().toLocaleTimeString(),
    };
  }
}
