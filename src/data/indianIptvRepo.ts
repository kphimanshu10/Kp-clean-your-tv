import { LiveChannel } from '../types/launcher';

/**
 * Integrated Open-Source IPTV Architecture adapted from:
 * Repository: https://github.com/kananinirav/Indian-IPTV-App.git
 * License: MIT License (Copyright (c) Nirav Kanani)
 *
 * Preserves the Channel & StreamSource data models and M3U/CSV parsing workflow
 * while extending with caching, GitHub rate-limit handling, and EPG/category metadata.
 */

export interface StreamSource {
  id: string;
  name: string;
  streamUrl: string;
  description?: string;
  isOfficialRepo?: boolean;
}

export interface IptvPlaylistRecord {
  id: string;
  name: string;
  url: string;
  sourceType: 'url' | 'file' | 'github' | 'qr';
  channelCount: number;
  updatedAt: string;
  channels: LiveChannel[];
}

export const INDIAN_IPTV_REPO_CSV_URL =
  'https://raw.githubusercontent.com/kananinirav/Indian-IPTV-App/refs/heads/master/data/streams.csv';

export const DEFAULT_GITHUB_STREAM_SOURCES: StreamSource[] = [
  {
    id: 'indian-tv-main',
    name: 'Indian TV (Indian-IPTV-App)',
    streamUrl: 'https://raw.githubusercontent.com/iptv-org/iptv/refs/heads/master/streams/in.m3u',
    description: 'Primary Indian TV live channels from kananinirav/Indian-IPTV-App streams.csv',
    isOfficialRepo: true,
  },
  {
    id: 'indian-tv-sports',
    name: 'Sports (Indian-IPTV-App)',
    streamUrl: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    description: 'Live Sports channels from kananinirav/Indian-IPTV-App streams.csv',
    isOfficialRepo: true,
  },
  {
    id: 'iptv-org-news',
    name: 'News Channels (Public M3U)',
    streamUrl: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    description: 'Public News channels directory',
    isOfficialRepo: false,
  },
  {
    id: 'iptv-org-entertainment',
    name: 'Entertainment (Public M3U)',
    streamUrl: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
    description: 'Public Entertainment channels directory',
    isOfficialRepo: false,
  },
  {
    id: 'iptv-org-movies',
    name: 'Movies & Cinema (Public M3U)',
    streamUrl: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    description: 'Public Movies & Cinema streams',
    isOfficialRepo: false,
  },
  {
    id: 'iptv-org-music',
    name: 'Music TV (Public M3U)',
    streamUrl: 'https://iptv-org.github.io/iptv/categories/music.m3u',
    description: 'Public Music video channels',
    isOfficialRepo: false,
  },
];

const CACHE_PREFIX = 'kptv_gh_iptv_cache_v1_';
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache

export function parseStreamsCsv(csvContent: string): StreamSource[] {
  const sources: StreamSource[] = [];
  const lines = csvContent.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.toLowerCase().startsWith('name,')) {
      continue;
    }
    const commaIndex = trimmed.indexOf(',');
    if (commaIndex === -1) continue;

    const name = trimmed.slice(0, commaIndex).trim();
    const streamUrl = trimmed.slice(commaIndex + 1).trim();

    if (name && (streamUrl.startsWith('http://') || streamUrl.startsWith('https://'))) {
      sources.push({
        id: `csv-source-${i}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name,
        streamUrl,
        description: `Loaded from streams.csv (${name})`,
        isOfficialRepo: true,
      });
    }
  }

  return sources;
}

export function mapGroupToCategory(group: string): LiveChannel['category'] {
  const lower = (group || '').toLowerCase();
  if (lower.includes('sport') || lower.includes('cricket') || lower.includes('football')) {
    return 'Sports';
  }
  if (lower.includes('news') || lower.includes('business')) {
    return 'News';
  }
  if (lower.includes('movie') || lower.includes('cinema') || lower.includes('film')) {
    return 'Movies';
  }
  if (
    lower.includes('regional') ||
    lower.includes('hindi') ||
    lower.includes('tamil') ||
    lower.includes('telugu') ||
    lower.includes('punjabi') ||
    lower.includes('marathi') ||
    lower.includes('bengali') ||
    lower.includes('music')
  ) {
    return 'Regional';
  }
  return 'Entertainment';
}

export function extractChannelNameFromExtInf(line: string, fallbackIndex: number): string {
  const commaIndex = line.lastIndexOf(',');
  if (commaIndex !== -1 && commaIndex + 1 < line.length) {
    const extracted = line.slice(commaIndex + 1).trim();
    if (extracted) return extracted;
  }
  const tvgNameMatch = line.match(/tvg-name="([^"]+)"/i);
  if (tvgNameMatch?.[1]) return tvgNameMatch[1].trim();
  return `Channel ${fallbackIndex}`;
}

export function extractLogoUrlFromExtInf(line: string): string | undefined {
  const match = line.match(/tvg-logo="([^"]+)"/i);
  if (match && match[1] && match[1].trim().startsWith('http')) {
    return match[1].trim();
  }
  return undefined;
}

export function parseM3uPlaylistContent(
  content: string,
  fallbackUrl: string,
  maxChannels = 600
): LiveChannel[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  // Support CSV format if user imports a streams.csv file directly
  if (trimmed.toLowerCase().startsWith('name,stream')) {
    const csvSources = parseStreamsCsv(trimmed);
    return csvSources.map((src, idx) => ({
      id: `csv-ch-${idx}-${Date.now()}`,
      name: src.name,
      category: mapGroupToCategory(src.name),
      streamUrl: src.streamUrl,
      resolution: '1080p',
      isHd: true,
      currentProgram: 'Playlist Source Feed',
      groupTitle: src.name,
    }));
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  // Detect if this is an HLS Master Manifest (#EXT-X-STREAM-INF) for a single live stream
  const isSingleHlsMaster =
    lines.some(l => l.startsWith('#EXT-X-STREAM-INF')) &&
    !lines.some(l => l.startsWith('#EXTINF:'));

  if (isSingleHlsMaster) {
    const streamName =
      fallbackUrl
        .split('/')
        .pop()
        ?.replace(/\.(m3u8|m3u).*$/i, '')
        .replace(/[-_]/g, ' ') || 'Live HLS Broadcast';
    return [
      {
        id: `hls-master-${Date.now()}`,
        name: streamName,
        category: 'Entertainment',
        streamUrl: fallbackUrl,
        resolution: '1080p',
        isHd: true,
        currentProgram: 'Direct HLS Master Stream',
        groupTitle: 'Live Stream',
      },
    ];
  }

  const channels: LiveChannel[] = [];
  let pendingName = '';
  let pendingGroup = 'Entertainment';
  let pendingLogo: string | undefined = undefined;
  let pendingEpg = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXTINF:')) {
      pendingName = extractChannelNameFromExtInf(line, channels.length + 1);
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      pendingGroup = groupMatch?.[1]?.trim() || 'Entertainment';
      pendingLogo = extractLogoUrlFromExtInf(line);
      const tvgIdMatch = line.match(/tvg-id="([^"]+)"/i);
      pendingEpg = tvgIdMatch?.[1]?.trim() || '';
    } else if (
      !line.startsWith('#') &&
      (line.startsWith('http://') || line.startsWith('https://'))
    ) {
      const name = pendingName || `Channel ${channels.length + 1}`;
      const res: LiveChannel['resolution'] =
        name.toLowerCase().includes('4k') || name.toLowerCase().includes('uhd')
          ? '4K'
          : name.toLowerCase().includes('720')
          ? '720p'
          : '1080p';

      channels.push({
        id: `ch-${channels.length}-${name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}`,
        name,
        category: mapGroupToCategory(pendingGroup),
        streamUrl: line,
        logoUrl: pendingLogo,
        resolution: res,
        isHd: true,
        currentProgram: pendingEpg
          ? `${pendingGroup} • EPG: ${pendingEpg}`
          : `${pendingGroup} • Live Broadcast`,
        groupTitle: pendingGroup,
      });

      pendingName = '';
      pendingGroup = 'Entertainment';
      pendingLogo = undefined;
      pendingEpg = '';

      if (channels.length >= maxChannels) break;
    }
  }

  return channels;
}

export async function fetchStreamSourcesCatalog(customCsvUrl?: string): Promise<{
  sources: StreamSource[];
  fromCache: boolean;
  rateLimited?: boolean;
}> {
  const targetUrl = (customCsvUrl || INDIAN_IPTV_REPO_CSV_URL).trim();
  const cacheKey = `${CACHE_PREFIX}catalog_${btoa(targetUrl).slice(0, 24)}`;

  try {
    const response = await fetch(targetUrl);
    if (response.status === 403 || response.status === 429) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return { sources: JSON.parse(cached), fromCache: true, rateLimited: true };
      }
      return { sources: DEFAULT_GITHUB_STREAM_SOURCES, fromCache: true, rateLimited: true };
    }
    if (response.ok) {
      const text = await response.text();
      const parsed = parseStreamsCsv(text);
      if (parsed.length > 0) {
        // Merge with additional curated categories so user gets both Indian-IPTV-App and categories
        const merged = [...parsed];
        for (const extra of DEFAULT_GITHUB_STREAM_SOURCES) {
          if (!merged.some(s => s.streamUrl === extra.streamUrl)) {
            merged.push(extra);
          }
        }
        try {
          localStorage.setItem(cacheKey, JSON.stringify(merged));
        } catch {
          // ignore
        }
        return { sources: merged, fromCache: false };
      }
    }
  } catch {
    // Fallback to local /data/indian-iptv-streams.csv or default sources
  }

  try {
    const localRes = await fetch('./data/indian-iptv-streams.csv');
    if (localRes.ok) {
      const text = await localRes.text();
      const parsed = parseStreamsCsv(text);
      if (parsed.length > 0) {
        return { sources: parsed, fromCache: true };
      }
    }
  } catch {
    // ignore
  }

  return { sources: DEFAULT_GITHUB_STREAM_SOURCES, fromCache: true };
}

export async function fetchAndParseM3uUrl(rawUrl: string): Promise<{
  channels: LiveChannel[];
  fromCache: boolean;
  error?: string;
}> {
  const cleanUrl = rawUrl.trim();
  if (!cleanUrl) {
    return { channels: [], fromCache: false, error: 'URL is empty.' };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleanUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return {
        channels: [],
        fromCache: false,
        error: 'Only http:// and https:// URLs are supported.',
      };
    }
  } catch {
    return { channels: [], fromCache: false, error: 'Malformed URL format.' };
  }

  const cacheKey = `${CACHE_PREFIX}m3u_${btoa(cleanUrl).slice(0, 32)}`;

  // Check recent cache first if offline
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const parsedCache = JSON.parse(cachedRaw) as { ts: number; channels: LiveChannel[] };
        if (Array.isArray(parsedCache.channels) && parsedCache.channels.length > 0) {
          return { channels: parsedCache.channels, fromCache: true };
        }
      }
    } catch {
      // ignore
    }
  }

  let playlistText = '';
  let rateLimited = false;

  // 1. Try direct fetch (works for GitHub raw URLs, iptv-org, and Android WebView)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const directRes = await fetch(parsedUrl.toString(), { signal: controller.signal });
    clearTimeout(timer);

    if (directRes.status === 403 || directRes.status === 429) {
      rateLimited = true;
    } else if (directRes.ok) {
      const contentType = (directRes.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('video/mp4') && !contentType.includes('video/webm')) {
        playlistText = await directRes.text();
      }
    }
  } catch {
    // Fallback to backend proxy if available
  }

  // 2. Fallback to backend CORS proxy (/api/iptv-playlist) when running in web environment
  if (
    !playlistText &&
    !rateLimited &&
    typeof window !== 'undefined' &&
    !window.AndroidTvBridge?.isNativeAndroid?.()
  ) {
    try {
      const proxyRes = await fetch(`/api/iptv-playlist?url=${encodeURIComponent(cleanUrl)}`);
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data?.content) {
          playlistText = String(data.content);
        }
      }
    } catch {
      // ignore
    }
  }

  if (playlistText) {
    const channels = parseM3uPlaylistContent(playlistText, cleanUrl);
    if (channels.length > 0) {
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ ts: Date.now(), channels: channels.slice(0, 300) })
        );
      } catch {
        // ignore storage quota
      }
      return { channels, fromCache: false };
    }
  }

  // Check if cached copy exists when rate-limited or network failed
  try {
    const cachedRaw = localStorage.getItem(cacheKey);
    if (cachedRaw) {
      const parsedCache = JSON.parse(cachedRaw) as { ts: number; channels: LiveChannel[] };
      if (
        Array.isArray(parsedCache.channels) &&
        parsedCache.channels.length > 0 &&
        (rateLimited || Date.now() - parsedCache.ts < CACHE_TTL_MS * 4)
      ) {
        return { channels: parsedCache.channels, fromCache: true };
      }
    }
  } catch {
    // ignore
  }

  // If the URL is a direct single video/HLS stream (.m3u8 / .mp4 / .ts)
  if (/\.(m3u8|mp4|webm|ts|mkv|mov)(\?.*)?$/i.test(cleanUrl)) {
    const singleChannel: LiveChannel = {
      id: `direct-stream-${Date.now()}`,
      name:
        cleanUrl
          .split('/')
          .pop()
          ?.replace(/\.(m3u8|mp4|webm|ts).*$/i, '')
          .replace(/[-_]/g, ' ') || 'Direct Live Stream',
      category: 'Entertainment',
      streamUrl: cleanUrl,
      resolution: '1080p',
      isHd: true,
      currentProgram: 'Direct Media Stream',
      groupTitle: 'Direct Stream',
    };
    return { channels: [singleChannel], fromCache: false };
  }

  return {
    channels: [],
    fromCache: false,
    error: rateLimited
      ? 'GitHub API rate limit reached. Try again later or use cached playlist.'
      : 'Unable to parse M3U channels from this URL. Verify the playlist link is active and valid.',
  };
}
