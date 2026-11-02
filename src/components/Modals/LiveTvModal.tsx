import React, { useState, useEffect, useCallback } from 'react';
import { X, Play, Tv, Volume2, QrCode, Link2, Trash2, RefreshCw, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { LiveChannel } from '../../types/launcher';

interface LiveTvModalProps {
  onClose: () => void;
}

const STORAGE_PLAYLIST_URL_KEY = 'kptv_iptv_playlist_url_v2';
const STORAGE_CHANNELS_KEY = 'kptv_iptv_channels_v2';
const STORAGE_QR_SESSION_KEY = 'kptv_iptv_qr_session_id';

function mapGroupToCategory(group: string): LiveChannel['category'] {
  const lower = group.toLowerCase();
  if (lower.includes('sport') || lower.includes('cricket') || lower.includes('football')) return 'Sports';
  if (lower.includes('news')) return 'News';
  if (lower.includes('movie') || lower.includes('cinema') || lower.includes('film')) return 'Movies';
  if (lower.includes('regional') || lower.includes('hindi') || lower.includes('music')) return 'Regional';
  return 'Entertainment';
}

export function parseM3uPlaylist(content: string, fallbackUrl: string): LiveChannel[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const channels: LiveChannel[] = [];

  let pendingName = '';
  let pendingGroup = 'Entertainment';
  let pendingLogo = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXTINF:')) {
      const commaIndex = line.indexOf(',');
      pendingName = commaIndex !== -1 ? line.slice(commaIndex + 1).trim() : `Channel ${channels.length + 1}`;
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      pendingGroup = groupMatch ? groupMatch[1] : 'Entertainment';
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      pendingLogo = logoMatch ? logoMatch[1] : '';
    } else if (!line.startsWith('#') && (line.startsWith('http://') || line.startsWith('https://'))) {
      // Check if this is an HLS master manifest (#EXT-X-STREAM-INF) rather than a channel list
      const isMasterHlsVariant =
        lines.some(l => l.startsWith('#EXT-X-STREAM-INF')) && !lines.some(l => l.startsWith('#EXTINF:'));
      if (isMasterHlsVariant) {
        return [
          {
            id: `iptv-direct-${Date.now()}`,
            name: 'Live IPTV Stream',
            category: 'Entertainment',
            streamUrl: fallbackUrl,
            resolution: '1080p',
            isHd: true,
            currentProgram: fallbackUrl,
          },
        ];
      }

      const name = pendingName || `IPTV Channel ${channels.length + 1}`;
      channels.push({
        id: `iptv-${channels.length}-${Date.now()}`,
        name,
        category: mapGroupToCategory(pendingGroup),
        streamUrl: line,
        logoUrl: pendingLogo || undefined,
        resolution: '1080p',
        isHd: true,
        currentProgram: pendingGroup || 'Live IPTV Broadcast',
      });
      pendingName = '';
      pendingGroup = 'Entertainment';
      pendingLogo = '';

      if (channels.length >= 250) break;
    }
  }

  return channels;
}

export const LiveTvModal: React.FC<LiveTvModalProps> = ({ onClose }) => {
  const [playlistUrl, setPlaylistUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_PLAYLIST_URL_KEY) || '';
    } catch {
      return '';
    }
  });

  const [channels, setChannels] = useState<LiveChannel[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CHANNELS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [selectedChannel, setSelectedChannel] = useState<LiveChannel | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CHANNELS_KEY);
      const parsed: LiveChannel[] = raw ? JSON.parse(raw) : [];
      return parsed.length > 0 ? parsed[0] : null;
    } catch {
      return null;
    }
  });

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loadingPlaylist, setLoadingPlaylist] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrTargetUrl, setQrTargetUrl] = useState<string>('');

  const [sessionId] = useState<string>(() => {
    try {
      const existing = localStorage.getItem(STORAGE_QR_SESSION_KEY);
      if (existing) return existing;
      const created = 'kptv-' + Math.random().toString(36).slice(2, 9);
      localStorage.setItem(STORAGE_QR_SESSION_KEY, created);
      return created;
    } catch {
      return 'kptv-live';
    }
  });

  const categories = ['All', 'Sports', 'News', 'Entertainment', 'Movies', 'Regional'];

  const filteredChannels =
    activeCategory === 'All'
      ? channels
      : channels.filter(c => c.category === activeCategory);

  const loadPlaylistFromUrl = useCallback(async (rawUrl: string) => {
    const cleanUrl = rawUrl.trim();
    if (!cleanUrl) return;

    setLoadingPlaylist(true);
    setStatusMessage(null);

    try {
      localStorage.setItem(STORAGE_PLAYLIST_URL_KEY, cleanUrl);
    } catch {
      // ignore storage errors
    }

    try {
      let playlistText = '';
      // Try direct fetch first (works in Android WebView & CORS-enabled M3U servers)
      try {
        const directRes = await fetch(cleanUrl);
        if (directRes.ok) {
          const contentType = directRes.headers.get('content-type') || '';
          if (!contentType.includes('video/')) {
            playlistText = await directRes.text();
          }
        }
      } catch {
        // Fallback to backend proxy if running on web server
      }

      if (!playlistText && typeof window !== 'undefined' && !window.AndroidTvBridge?.isNativeAndroid?.()) {
        try {
          const proxyRes = await fetch(`/api/iptv-playlist?url=${encodeURIComponent(cleanUrl)}`);
          if (proxyRes.ok) {
            const data = await proxyRes.json();
            if (data?.content) {
              playlistText = String(data.content);
            }
          }
        } catch {
          // ignore proxy error
        }
      }

      let loadedChannels: LiveChannel[] = [];
      if (playlistText && (playlistText.includes('#EXTM3U') || playlistText.includes('#EXTINF') || playlistText.includes('http'))) {
        loadedChannels = parseM3uPlaylist(playlistText, cleanUrl);
      }

      // If URL is a direct stream (.m3u8 / .mp4 / live stream) without multiple #EXTINF items
      if (loadedChannels.length === 0) {
        loadedChannels = [
          {
            id: `iptv-stream-${Date.now()}`,
            name: cleanUrl.split('/').pop()?.replace(/\.(m3u8|m3u|mp4).*$/i, '') || 'Live IPTV Stream',
            category: 'Entertainment',
            streamUrl: cleanUrl,
            resolution: '1080p',
            isHd: true,
            currentProgram: 'Direct IPTV Playlist Stream',
          },
        ];
      }

      setChannels(loadedChannels);
      setSelectedChannel(loadedChannels[0]);
      try {
        localStorage.setItem(STORAGE_CHANNELS_KEY, JSON.stringify(loadedChannels));
      } catch {
        // ignore
      }
      setStatusMessage({
        type: 'ok',
        text: `Loaded ${loadedChannels.length} channel${loadedChannels.length === 1 ? '' : 's'} from IPTV link.`,
      });
    } catch {
      setStatusMessage({
        type: 'err',
        text: 'Could not load IPTV playlist link. Please verify the URL.',
      });
    } finally {
      setLoadingPlaylist(false);
    }
  }, []);

  // Build QR Code URL (uses TV's local Wi-Fi HTTP server in Android APK, or web session relay in browser)
  useEffect(() => {
    let target = '';
    try {
      if (typeof window !== 'undefined' && window.AndroidTvBridge?.getIptvQrUrl) {
        const nativeUrl = window.AndroidTvBridge.getIptvQrUrl();
        if (nativeUrl && nativeUrl.startsWith('http')) {
          target = nativeUrl;
        }
      }
    } catch {
      // ignore
    }

    if (!target && typeof window !== 'undefined') {
      const origin =
        window.location.origin && !window.location.origin.includes('kptv.local')
          ? window.location.origin
          : 'https://ais-pre-kautdddzohadkt5fcttmp4-995376337501.asia-east1.run.app';
      target = `${origin}/iptv-remote/${sessionId}`;
    }

    setQrTargetUrl(target);
    if (target) {
      QRCode.toDataURL(target, {
        width: 200,
        margin: 1,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then(url => setQrDataUrl(url))
        .catch(() => setQrDataUrl(''));
    }
  }, [sessionId]);

  // Listen for IPTV Playlist URL sent via Mobile QR Scan (both native Android LAN server & cloud relay)
  useEffect(() => {
    let lastSeenUrl = '';

    const handleNativeIptvEvent = (e: Event) => {
      const custom = e as CustomEvent<string>;
      const incoming = (custom.detail || '').trim();
      if (incoming && incoming !== lastSeenUrl) {
        lastSeenUrl = incoming;
        setPlaylistUrl(incoming);
        loadPlaylistFromUrl(incoming);
      }
    };

    window.addEventListener('kptv-iptv-url', handleNativeIptvEvent as EventListener);

    const interval = setInterval(async () => {
      // 1. Check Native Android Local QR Server
      try {
        if (window.AndroidTvBridge?.getLatestIptvUrl) {
          const nativeIncoming = (window.AndroidTvBridge.getLatestIptvUrl() || '').trim();
          if (nativeIncoming && nativeIncoming !== lastSeenUrl) {
            lastSeenUrl = nativeIncoming;
            setPlaylistUrl(nativeIncoming);
            loadPlaylistFromUrl(nativeIncoming);
            return;
          }
        }
      } catch {
        // ignore
      }

      // 2. Check Web Session Relay
      try {
        if (!window.location.origin.includes('kptv.local')) {
          const res = await fetch(`/api/iptv-qr/${sessionId}`);
          if (res.ok) {
            const data = await res.json();
            const remoteUrl = String(data?.playlistUrl || '').trim();
            if (remoteUrl && remoteUrl !== lastSeenUrl && remoteUrl !== playlistUrl) {
              lastSeenUrl = remoteUrl;
              setPlaylistUrl(remoteUrl);
              loadPlaylistFromUrl(remoteUrl);
            }
          }
        }
      } catch {
        // ignore offline
      }
    }, 2000);

    return () => {
      window.removeEventListener('kptv-iptv-url', handleNativeIptvEvent as EventListener);
      clearInterval(interval);
    };
  }, [sessionId, playlistUrl, loadPlaylistFromUrl]);

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;
    loadPlaylistFromUrl(playlistUrl);
  };

  const handleClearPlaylist = () => {
    setChannels([]);
    setSelectedChannel(null);
    setPlaylistUrl('');
    setStatusMessage(null);
    try {
      localStorage.removeItem(STORAGE_PLAYLIST_URL_KEY);
      localStorage.removeItem(STORAGE_CHANNELS_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 select-none">
      <div className="relative w-full max-w-5xl h-[88vh] rounded-3xl bg-slate-900/95 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.3)] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-600/30 text-cyan-400 border border-cyan-400/40">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">KP TV – Live TV IPTV Player</h2>
              <p className="text-xs text-slate-400">
                Paste your IPTV Playlist Link (.m3u / .m3u8) or Scan QR Code with Mobile Phone
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Live TV Modal"
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 focus:ring-2 focus:ring-cyan-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* IPTV Playlist Link Bar + Mobile QR Scan Panel */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-b border-white/10 flex flex-col md:flex-row items-center gap-4">
          <form onSubmit={handlePasteSubmit} className="flex-1 w-full flex items-center gap-2.5">
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="Paste IPTV Playlist Link (https://.../playlist.m3u or .m3u8)"
                value={playlistUrl}
                onChange={e => setPlaylistUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs border border-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loadingPlaylist}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 focus:ring-2 focus:ring-cyan-300 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {loadingPlaylist ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load IPTV Link</span>
              )}
            </button>
            {channels.length > 0 && (
              <button
                type="button"
                onClick={handleClearPlaylist}
                title="Clear IPTV Playlist"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-white/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </form>

          {statusMessage && (
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                statusMessage.type === 'ok'
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                  : 'bg-red-950/90 text-red-300 border border-red-500/40'
              }`}
            >
              {statusMessage.type === 'ok' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        {channels.length === 0 ? (
          /* Empty State: Paste Link or Scan QR Code on Mobile */
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 p-8 overflow-y-auto">
            {/* Left Instructions */}
            <div className="flex-1 max-w-md space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                <Smartphone className="w-3.5 h-3.5" />
                <span>No Example Streams • 100% User IPTV Playlist</span>
              </div>
              <h3 className="text-2xl font-black text-white leading-tight">
                Paste IPTV Playlist Link or Scan QR with Mobile
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Typing long M3U playlist links with a TV remote is slow. Scan the QR code on the right using your phone camera to paste your IPTV playlist link directly from your mobile browser.
              </p>
              <ol className="text-xs text-slate-300 space-y-2 list-decimal pl-4">
                <li>
                  Connect your mobile phone to the <strong className="text-white">same Wi-Fi network</strong> as your TV.
                </li>
                <li>
                  Scan the <strong className="text-cyan-300">QR Code</strong> with your mobile camera.
                </li>
                <li>
                  Paste your <code className="text-cyan-300">.m3u</code> or <code className="text-cyan-300">.m3u8</code> playlist link on your phone and tap <strong className="text-white">Send Playlist to KP TV</strong>.
                </li>
              </ol>
            </div>

            {/* Right QR Code Card */}
            <div className="p-6 rounded-3xl bg-slate-950/90 border border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.2)] flex flex-col items-center text-center max-w-xs w-full">
              <div className="flex items-center space-x-1.5 text-cyan-300 text-xs font-extrabold uppercase tracking-wider mb-3">
                <QrCode className="w-4 h-4" />
                <span>Scan to Paste IPTV Link</span>
              </div>

              {qrDataUrl ? (
                <div className="p-3 bg-white rounded-2xl shadow-lg mb-3">
                  <img
                    src={qrDataUrl}
                    alt="Scan QR to paste IPTV link"
                    className="w-40 h-40 object-contain"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center mb-3 text-xs text-slate-400">
                  Generating QR...
                </div>
              )}

              <p className="text-[11px] text-slate-300 font-semibold">
                Scan with Mobile Camera to Open IPTV Paste Page
              </p>
              {qrTargetUrl && (
                <span className="mt-1.5 text-[10px] text-cyan-400 font-mono break-all px-2 py-1 rounded bg-slate-900 border border-white/5">
                  {qrTargetUrl}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Loaded Playlist View: Video Player + Channel List + Compact QR Drawer */
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Video Player */}
            <div className="flex-[1.55] bg-black p-5 flex flex-col justify-between border-r border-white/10">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
                {selectedChannel && (
                  <>
                    <video
                      key={selectedChannel.streamUrl}
                      src={selectedChannel.streamUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-xs font-bold text-white flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span>{selectedChannel.name}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Currently Playing + Mini Mobile QR Trigger */}
              <div className="mt-4 p-3.5 rounded-2xl bg-slate-800/60 border border-white/10 flex items-center justify-between gap-4">
                <div className="overflow-hidden">
                  <h3 className="text-base font-bold text-white truncate">
                    {selectedChannel?.name || 'Select a Channel'}
                  </h3>
                  <p className="text-xs text-cyan-300 truncate">
                    {selectedChannel?.currentProgram || playlistUrl}
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {qrDataUrl && (
                    <div className="flex items-center space-x-2 bg-slate-950/90 px-2.5 py-1.5 rounded-xl border border-cyan-500/30">
                      <img src={qrDataUrl} alt="QR" className="w-9 h-9 rounded bg-white p-0.5" />
                      <div className="text-left">
                        <span className="text-[10px] font-extrabold text-cyan-300 block">
                          Mobile QR Paste
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          Scan to update link
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-xl border border-white/10">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>TV Audio</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Channel List & Category Filters */}
            <div className="flex-1 p-4 flex flex-col overflow-hidden bg-slate-900/60">
              <div className="flex space-x-1.5 pb-3 overflow-x-auto">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                      activeCategory === cat
                        ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredChannels.map(channel => {
                  const isSelected = selectedChannel?.id === channel.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel)}
                      className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/40 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-800/40 border border-white/5 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-sm font-bold text-white truncate">{channel.name}</div>
                          <div className="text-xs text-slate-400 truncate">{channel.currentProgram}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-cyan-300 shrink-0 ml-2">
                        {channel.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
