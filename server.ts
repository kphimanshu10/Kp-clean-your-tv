import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server-side runtime configuration (kept strictly in server memory / env, never bundled in frontend JS)
let runtimeCricketConfig = {
  endpointUrl: (process.env.CRICKET_API_URL || 'https://api.cricapi.com/v1/currentMatches').trim(),
  apiKey: (process.env.CRICKET_API_KEY || '').trim(),
};

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

export async function proxyFetchCricketMatches(configOverride?: {
  endpointUrl?: string;
  apiKey?: string;
}) {
  const endpoint = (
    configOverride?.endpointUrl ??
    runtimeCricketConfig.endpointUrl ??
    'https://api.cricapi.com/v1/currentMatches'
  ).trim();
  const apiKey = (configOverride?.apiKey ?? runtimeCricketConfig.apiKey ?? '').trim();

  const hasCustomDirectFeed =
    endpoint.length > 0 &&
    endpoint !== 'https://api.cricapi.com/v1/currentMatches' &&
    !endpoint.includes('api.cricapi.com');

  if (!apiKey && !hasCustomDirectFeed) {
    return {
      status: 'unconfigured' as const,
      matches: [],
      errorMessage: 'Live score service not configured.',
      lastUpdated: null,
    };
  }

  const nowFormatted = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  let requestUrl: URL;
  try {
    requestUrl = new URL(endpoint);
  } catch {
    return {
      status: 'error' as const,
      matches: [],
      errorMessage: 'Invalid response: Malformed API endpoint URL.',
      lastUpdated: nowFormatted,
    };
  }

  if (apiKey && !requestUrl.searchParams.has('apikey')) {
    requestUrl.searchParams.set('apikey', apiKey);
  }
  if (endpoint.includes('cricapi.com') && !requestUrl.searchParams.has('offset')) {
    requestUrl.searchParams.set('offset', '0');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(requestUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      return {
        status: 'error' as const,
        matches: [],
        errorMessage: `Authentication error (HTTP ${response.status}): Invalid API credentials.`,
        lastUpdated: nowFormatted,
      };
    }

    if (response.status === 429) {
      return {
        status: 'error' as const,
        matches: [],
        errorMessage: 'API quota exceeded (HTTP 429): Rate limit reached.',
        lastUpdated: nowFormatted,
      };
    }

    if (!response.ok) {
      return {
        status: 'error' as const,
        matches: [],
        errorMessage: `Upstream API error: HTTP ${response.status}`,
        lastUpdated: nowFormatted,
      };
    }

    let payload: Record<string, unknown>;
    try {
      payload = (await response.json()) as Record<string, unknown>;
    } catch {
      return {
        status: 'error' as const,
        matches: [],
        errorMessage: 'Invalid response: Upstream server did not return valid JSON.',
        lastUpdated: nowFormatted,
      };
    }

    if (!payload || typeof payload !== 'object') {
      return {
        status: 'error' as const,
        matches: [],
        errorMessage: 'Invalid response: Empty or malformed payload.',
        lastUpdated: nowFormatted,
      };
    }

    if (payload.status === 'failure') {
      const reason = String(payload.reason || 'Unknown API failure');
      const lower = reason.toLowerCase();
      if (lower.includes('key') || lower.includes('auth') || lower.includes('token')) {
        return {
          status: 'error' as const,
          matches: [],
          errorMessage: `Authentication error: ${reason}`,
          lastUpdated: nowFormatted,
        };
      }
      if (lower.includes('hit') || lower.includes('quota') || lower.includes('limit')) {
        return {
          status: 'error' as const,
          matches: [],
          errorMessage: `Quota exceeded: ${reason}`,
          lastUpdated: nowFormatted,
        };
      }
      return {
        status: 'error' as const,
        matches: [],
        errorMessage: reason,
        lastUpdated: nowFormatted,
      };
    }

    const rawList: CricApiMatchItem[] = Array.isArray(payload.data)
      ? (payload.data as CricApiMatchItem[])
      : Array.isArray(payload.matches)
      ? (payload.matches as CricApiMatchItem[])
      : [];

    if (rawList.length === 0) {
      return {
        status: 'error' as const,
        matches: [],
        errorMessage: 'No active cricket matches returned by the configured API.',
        lastUpdated: nowFormatted,
      };
    }

    const parsedMatches = rawList.slice(0, 9).map((item, idx) => {
      const team1Name = item.teamInfo?.[0]?.name || item.teams?.[0] || 'Team 1';
      const team2Name = item.teamInfo?.[1]?.name || item.teams?.[1] || 'Team 2';
      const team1Code = buildTeamCode(team1Name, item.teamInfo?.[0]?.shortname);
      const team2Code = buildTeamCode(team2Name, item.teamInfo?.[1]?.shortname);

      const scores = Array.isArray(item.score) ? item.score : [];
      const score1 = scores[0];
      const score2 = scores[1];

      const t1ScoreStr =
        score1 && typeof score1.r === 'number' ? `${score1.r}/${score1.w ?? 0}` : 'Yet to bat';
      const t1OversStr = score1 && typeof score1.o === 'number' ? `(${score1.o} ov)` : '';

      const t2ScoreStr =
        score2 && typeof score2.r === 'number' ? `${score2.r}/${score2.w ?? 0}` : 'Yet to bat';
      const t2OversStr = score2 && typeof score2.o === 'number' ? `(${score2.o} ov)` : '';

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
      status: 'live' as const,
      matches: parsedMatches,
      errorMessage: null,
      lastUpdated: nowFormatted,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const message =
      err instanceof Error
        ? err.name === 'AbortError'
          ? 'Timeout error: Live score request timed out after 10 seconds.'
          : `Network error: ${err.message}`
        : 'Unable to reach live cricket score service.';

    return {
      status: 'error' as const,
      matches: [],
      errorMessage: message,
      lastUpdated: nowFormatted,
    };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Check current backend proxy configuration status (never returns raw API key)
  app.get('/api/cricket/config', (_req, res) => {
    res.json({
      endpointUrl: runtimeCricketConfig.endpointUrl,
      hasApiKey: runtimeCricketConfig.apiKey.length > 0,
    });
  });

  // Update backend proxy configuration in server memory
  app.post('/api/cricket/config', async (req, res) => {
    const { endpointUrl, apiKey } = req.body || {};
    if (typeof endpointUrl === 'string') {
      runtimeCricketConfig.endpointUrl =
        endpointUrl.trim() || 'https://api.cricapi.com/v1/currentMatches';
    }
    if (typeof apiKey === 'string') {
      runtimeCricketConfig.apiKey = apiKey.trim();
    }
    const result = await proxyFetchCricketMatches();
    res.json(result);
  });

  // Proxy live cricket score requests server-side so keys never leak to frontend bundle
  app.get('/api/cricket/matches', async (_req, res) => {
    const result = await proxyFetchCricketMatches();
    res.json(result);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KP TV Server & API Proxy listening on http://0.0.0.0:${PORT}`);
  });
}

// Only start HTTP listener when executed as server entry point (not when imported by unit tests)
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startServer();
}
