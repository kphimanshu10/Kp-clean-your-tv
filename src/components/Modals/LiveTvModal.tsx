import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Tv,
  QrCode,
  Link2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  Star,
  History,
  FolderOpen,
  GitBranch,
  Edit3,
  Play,
  PlayCircle,
  Upload,
  Check,
  Maximize2,
} from 'lucide-react';
import { LiveChannel, QrUrlInputContextType } from '../../types/launcher';
import {
  IptvPlaylistRecord,
  StreamSource,
  DEFAULT_GITHUB_STREAM_SOURCES,
  fetchStreamSourcesCatalog,
  fetchAndParseM3uUrl,
  parseM3uPlaylistContent,
} from '../../data/indianIptvRepo';
import { VideoStreamPlayer } from '../VideoStreamPlayer';
import { UniversalQrUrlModal } from './UniversalQrUrlModal';

interface LiveTvModalProps {
  onClose: () => void;
  onOpenOnlineLinkPlayer?: (initialUrl?: string) => void;
}

const STORAGE_PLAYLISTS_KEY = 'kptv_iptv_playlists_v3';
const STORAGE_ACTIVE_PLAYLIST_ID_KEY = 'kptv_iptv_active_playlist_id_v3';
const STORAGE_FAVORITE_CHANNELS_KEY = 'kptv_iptv_favorites_v3';
const STORAGE_RECENT_CHANNELS_KEY = 'kptv_iptv_recent_channels_v3';
const LEGACY_PLAYLIST_URL_KEY = 'kptv_iptv_playlist_url_v2';
const LEGACY_CHANNELS_KEY = 'kptv_iptv_channels_v2';

// Re-export for backwards compatibility with existing unit tests
export function parseM3uPlaylist(content: string, fallbackUrl: string): LiveChannel[] {
  return parseM3uPlaylistContent(content, fallbackUrl);
}

export const LiveTvModal: React.FC<LiveTvModalProps> = ({
  onClose,
  onOpenOnlineLinkPlayer,
}) => {
  const [activeTab, setActiveTab] = useState<'livetv' | 'playlists' | 'github'>('livetv');

  // Playlists state (Multiple playlists supported, no hardcoded fake demo streams on startup)
  const [playlists, setPlaylists] = useState<IptvPlaylistRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PLAYLISTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      // Migrate legacy single playlist if user had one saved
      const legacyUrl = localStorage.getItem(LEGACY_PLAYLIST_URL_KEY) || '';
      const legacyChRaw = localStorage.getItem(LEGACY_CHANNELS_KEY);
      const legacyChannels: LiveChannel[] = legacyChRaw ? JSON.parse(legacyChRaw) : [];
      if (legacyUrl && legacyChannels.length > 0) {
        return [
          {
            id: 'playlist-migrated',
            name: 'Saved User Playlist',
            url: legacyUrl,
            sourceType: 'url',
            channelCount: legacyChannels.length,
            updatedAt: new Date().toLocaleDateString(),
            channels: legacyChannels,
          },
        ];
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [activePlaylistId, setActivePlaylistId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_ACTIVE_PLAYLIST_ID_KEY) || '';
    } catch {
      return '';
    }
  });

  const activePlaylist =
    playlists.find(p => p.id === activePlaylistId) || playlists[0] || null;
  const channels = activePlaylist?.channels || [];

  // Favorites & Recently Watched (Continue Watching)
  const [favoriteUrls, setFavoriteUrls] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_FAVORITE_CHANNELS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [recentChannels, setRecentChannels] = useState<LiveChannel[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_RECENT_CHANNELS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [selectedChannel, setSelectedChannel] = useState<LiveChannel | null>(() => {
    if (recentChannels.length > 0) return recentChannels[0];
    return channels[0] || null;
  });

  // Search & Category filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [fullscreenTrigger, setFullscreenTrigger] = useState<number>(0);

  // Playlist Import & Rename states
  const [playlistUrlInput, setPlaylistUrlInput] = useState<string>('');
  const [customPlaylistName, setCustomPlaylistName] = useState<string>('');
  const [loadingPlaylist, setLoadingPlaylist] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);
  const [renamingPlaylistId, setRenamingPlaylistId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // GitHub Integration states
  const [githubSources, setGithubSources] = useState<StreamSource[]>(
    DEFAULT_GITHUB_STREAM_SOURCES
  );
  const [customGithubUrl, setCustomGithubUrl] = useState<string>('');
  const [loadingGithubCatalog, setLoadingGithubCatalog] = useState<boolean>(false);
  const [githubCacheStatus, setGithubCacheStatus] = useState<string>('Ready');

  // Universal QR Modal state
  const [qrModalConfig, setQrModalConfig] = useState<{
    open: boolean;
    contextType: QrUrlInputContextType;
    title: string;
    onApply: (url: string) => void;
  }>({
    open: false,
    contextType: 'iptv-m3u',
    title: 'IPTV Playlist URL – QR Input',
    onApply: () => {},
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PLAYLISTS_KEY, JSON.stringify(playlists));
    } catch {
      // ignore quota
    }
  }, [playlists]);

  useEffect(() => {
    try {
      if (activePlaylist?.id) {
        localStorage.setItem(STORAGE_ACTIVE_PLAYLIST_ID_KEY, activePlaylist.id);
      }
    } catch {
      // ignore
    }
  }, [activePlaylist]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FAVORITE_CHANNELS_KEY, JSON.stringify(favoriteUrls));
    } catch {
      // ignore
    }
  }, [favoriteUrls]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RECENT_CHANNELS_KEY, JSON.stringify(recentChannels));
    } catch {
      // ignore
    }
  }, [recentChannels]);

  // Select channel and record in Recently Watched (Continue Watching)
  const handleSelectChannel = useCallback((ch: LiveChannel) => {
    setSelectedChannel(ch);
    setRecentChannels(prev => {
      const filtered = prev.filter(item => item.streamUrl !== ch.streamUrl);
      return [ch, ...filtered].slice(0, 20);
    });
  }, []);

  const toggleFavoriteChannel = (streamUrl: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteUrls(prev =>
      prev.includes(streamUrl) ? prev.filter(u => u !== streamUrl) : [...prev, streamUrl]
    );
  };

  // Load or Add Playlist from URL
  const importPlaylistFromUrl = useCallback(
    async (
      rawUrl: string,
      nameOverride?: string,
      sourceType: IptvPlaylistRecord['sourceType'] = 'url'
    ) => {
      const cleanUrl = rawUrl.trim();
      if (!cleanUrl) return;

      setLoadingPlaylist(true);
      setStatusMessage(null);

      try {
        const result = await fetchAndParseM3uUrl(cleanUrl);
        if (result.channels.length === 0) {
          setStatusMessage({
            type: 'err',
            text: result.error || 'No playable channels found in playlist URL.',
          });
          setLoadingPlaylist(false);
          return;
        }

        const derivedName =
          nameOverride?.trim() ||
          customPlaylistName.trim() ||
          cleanUrl
            .split('/')
            .pop()
            ?.replace(/\.(m3u8|m3u|csv).*$/i, '')
            ?.replace(/[-_]/g, ' ') ||
          `IPTV Playlist (${ playlists.length + 1 })`;

        const nowLabel = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        const existingIndex = playlists.findIndex(p => p.url === cleanUrl);
        let targetId = '';

        if (existingIndex >= 0) {
          targetId = playlists[existingIndex].id;
          setPlaylists(prev =>
            prev.map((p, idx) =>
              idx === existingIndex
                ? {
                    ...p,
                    name: nameOverride || p.name,
                    channelCount: result.channels.length,
                    updatedAt: nowLabel,
                    channels: result.channels,
                  }
                : p
            )
          );
        } else {
          targetId = `pl-${Date.now()}`;
          const newRecord: IptvPlaylistRecord = {
            id: targetId,
            name: derivedName,
            url: cleanUrl,
            sourceType,
            channelCount: result.channels.length,
            updatedAt: nowLabel,
            channels: result.channels,
          };
          setPlaylists(prev => [newRecord, ...prev]);
        }

        setActivePlaylistId(targetId);
        handleSelectChannel(result.channels[0]);
        setPlaylistUrlInput('');
        setCustomPlaylistName('');
        setActiveTab('livetv');
        setStatusMessage({
          type: 'ok',
          text: `Loaded ${result.channels.length} channels into "${derivedName}"${
            result.fromCache ? ' (Cached)' : ''
          }.`,
        });
      } catch {
        setStatusMessage({
          type: 'err',
          text: 'Failed to load playlist. Please verify URL and network connection.',
        });
      } finally {
        setLoadingPlaylist(false);
      }
    },
    [customPlaylistName, playlists, handleSelectChannel]
  );

  // Import Local File (.m3u / .m3u8 / .csv)
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const parsedChannels = parseM3uPlaylistContent(content, file.name);
      if (parsedChannels.length === 0) {
        setStatusMessage({
          type: 'err',
          text: `File "${file.name}" did not contain valid M3U/CSV channel entries.`,
        });
        return;
      }

      const newId = `pl-file-${Date.now()}`;
      const record: IptvPlaylistRecord = {
        id: newId,
        name: file.name.replace(/\.(m3u8|m3u|csv)$/i, ''),
        url: `local://${file.name}`,
        sourceType: 'file',
        channelCount: parsedChannels.length,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        channels: parsedChannels,
      };

      setPlaylists(prev => [record, ...prev]);
      setActivePlaylistId(newId);
      handleSelectChannel(parsedChannels[0]);
      setActiveTab('livetv');
      setStatusMessage({
        type: 'ok',
        text: `Imported ${parsedChannels.length} channels from local file "${file.name}".`,
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Refresh GitHub stream catalog (Indian-IPTV-App streams.csv)
  const handleRefreshGithubCatalog = useCallback(async (csvUrlOverride?: string) => {
    setLoadingGithubCatalog(true);
    try {
      const res = await fetchStreamSourcesCatalog(csvUrlOverride);
      setGithubSources(res.sources);
      if (res.rateLimited) {
        setGithubCacheStatus('GitHub rate-limited • Using cached catalog');
      } else if (res.fromCache) {
        setGithubCacheStatus('Loaded from local/cached streams.csv');
      } else {
        setGithubCacheStatus('Synced live with GitHub streams.csv');
      }
    } catch {
      setGithubCacheStatus('Offline fallback catalog active');
    } finally {
      setLoadingGithubCatalog(false);
    }
  }, []);

  useEffect(() => {
    handleRefreshGithubCatalog();
  }, [handleRefreshGithubCatalog]);

  // Filter channels for Live TV view
  const categories = [
    'All',
    'Favorites ★',
    'Recent',
    'Sports',
    'News',
    'Entertainment',
    'Movies',
    'Regional',
  ];

  const baseCategoryChannels =
    activeCategory === 'All'
      ? channels
      : activeCategory === 'Favorites ★'
      ? channels.filter(c => favoriteUrls.includes(c.streamUrl))
      : activeCategory === 'Recent'
      ? recentChannels
      : channels.filter(c => c.category === activeCategory);

  const filteredChannels = searchQuery.trim()
    ? baseCategoryChannels.filter(
        c =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.groupTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : baseCategoryChannels;

  // Previous / Next Channel helpers
  const handleStepChannel = useCallback(
    (delta: number) => {
      if (filteredChannels.length === 0) return;
      const currentIndex = selectedChannel
        ? filteredChannels.findIndex(c => c.streamUrl === selectedChannel.streamUrl)
        : -1;
      const nextIndex =
        currentIndex === -1
          ? 0
          : (currentIndex + delta + filteredChannels.length) % filteredChannels.length;
      handleSelectChannel(filteredChannels[nextIndex]);
    },
    [filteredChannels, selectedChannel, handleSelectChannel]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-5 select-none">
      <div className="relative w-full max-w-6xl h-[90vh] rounded-3xl bg-slate-900/95 border border-cyan-500/35 shadow-[0_0_55px_rgba(6,182,212,0.3)] flex flex-col overflow-hidden">
        {/* Top Header + Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-white/10 bg-slate-950/75">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-600/30 text-cyan-400 border border-cyan-400/40">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                KP TV – IPTV & Live Stream Center
              </h2>
              <p className="text-[11px] text-slate-400">
                Multi-Playlist M3U/M3U8 Player • Universal QR Input • GitHub Indian-IPTV Integration
              </p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('livetv')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'livetv'
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Live TV ({channels.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('playlists')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'playlists'
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Playlists ({playlists.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('github')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'github'
                  ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                  : 'bg-slate-800 text-cyan-300 hover:text-white'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>GitHub Repositories</span>
            </button>

            {selectedChannel && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('livetv');
                  setFullscreenTrigger(n => n + 1);
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold flex items-center space-x-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full Screen Play</span>
              </button>
            )}

            {onOpenOnlineLinkPlayer && (
              <button
                type="button"
                onClick={() => onOpenOnlineLinkPlayer()}
                className="px-3.5 py-2 rounded-xl bg-orange-600/25 hover:bg-orange-600/40 border border-orange-400/40 text-orange-300 text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Online Link Player</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Live TV Modal"
              className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 focus:ring-2 focus:ring-cyan-400 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick URL / QR Action Bar */}
        <div className="px-6 py-2.5 bg-slate-950/85 border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (!playlistUrlInput.trim()) return;
              importPlaylistFromUrl(playlistUrlInput, undefined, 'url');
            }}
            className="flex-1 min-w-[260px] flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="Paste M3U / M3U8 Playlist Link (https://.../playlist.m3u)"
                value={playlistUrlInput}
                onChange={e => setPlaylistUrlInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 text-white text-xs border border-slate-700 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loadingPlaylist}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold flex items-center space-x-1.5 shrink-0 cursor-pointer"
            >
              {loadingPlaylist ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load M3U</span>
              )}
            </button>
          </form>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setQrModalConfig({
                  open: true,
                  contextType: 'iptv-m3u',
                  title: 'IPTV M3U Playlist – Universal QR Input',
                  onApply: url => importPlaylistFromUrl(url, 'QR Imported Playlist', 'qr'),
                })
              }
              className="px-3.5 py-2 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-200 text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>Scan QR to Paste URL</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".m3u,.m3u8,.csv,.txt"
              onChange={handleLocalFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import File</span>
            </button>
          </div>

          {statusMessage && (
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                statusMessage.type === 'ok'
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                  : 'bg-red-950/90 text-red-300 border border-red-500/40'
              }`}
            >
              {statusMessage.type === 'ok' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              )}
              <span className="truncate max-w-xs">{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* TAB 1: LIVE TV VIEW */}
        {activeTab === 'livetv' && (
          <div className="flex-1 flex overflow-hidden">
            {channels.length === 0 ? (
              /* Empty State with Quick Actions for QR, File Import, or GitHub Indian-IPTV Catalog */
              <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 p-8 overflow-y-auto">
                <div className="flex-1 max-w-lg space-y-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                    <Tv className="w-3.5 h-3.5" />
                    <span>Ready for Your M3U Playlist or GitHub IPTV Catalog</span>
                  </div>
                  <h3 className="text-2xl font-black text-white leading-tight">
                    Load an IPTV Playlist via QR Code, File, or GitHub Repository
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    KP TV does not preload fake demo channels. Add your own M3U/M3U8 playlist link using your phone via the Universal QR System, import a local file, or load live channels from the integrated <strong className="text-cyan-300">Indian-IPTV-App</strong> repository.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setQrModalConfig({
                          open: true,
                          contextType: 'iptv-m3u',
                          title: 'Scan QR on Phone to Send IPTV M3U Link',
                          onApply: url =>
                            importPlaylistFromUrl(url, 'Mobile QR Playlist', 'qr'),
                        })
                      }
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-extrabold flex items-center space-x-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Open Universal QR URL Input</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('github')}
                      className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-cyan-400/40 text-cyan-300 text-xs font-extrabold flex items-center space-x-2 cursor-pointer"
                    >
                      <GitBranch className="w-4 h-4" />
                      <span>Browse Indian-IPTV GitHub Catalog</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Active Live TV Player + Channel Browser */
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left: Video Player + Continue Watching Bar */}
                <div className="flex-[1.5] bg-black/90 p-4 flex flex-col justify-between border-r border-white/10 overflow-hidden">
                  {selectedChannel ? (
                    <VideoStreamPlayer
                      streamUrl={selectedChannel.streamUrl}
                      title={selectedChannel.name}
                      subtitle={`${selectedChannel.category} • ${selectedChannel.currentProgram}`}
                      isLive={true}
                      onPrevChannel={() => handleStepChannel(-1)}
                      onNextChannel={() => handleStepChannel(1)}
                      forceFullscreenTrigger={fullscreenTrigger}
                      className="flex-1 w-full"
                    />
                  ) : (
                    <div className="flex-1 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
                      Select a channel on the right to begin watching
                    </div>
                  )}

                  {/* Continue Watching / Recently Watched Strip */}
                  {recentChannels.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/10">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                          <History className="w-3 h-3" />
                          <span>Continue Watching / Recent Channels</span>
                        </span>
                        {activePlaylist && (
                          <span className="text-[10px] text-slate-400 truncate">
                            Playlist: <strong className="text-slate-200">{activePlaylist.name}</strong>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                        {recentChannels.slice(0, 6).map(rc => (
                          <button
                            key={`recent-${rc.streamUrl}`}
                            type="button"
                            onClick={() => handleSelectChannel(rc)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center space-x-1.5 shrink-0 border transition-all cursor-pointer ${
                              selectedChannel?.streamUrl === rc.streamUrl
                                ? 'bg-cyan-600/30 border-cyan-400 text-white'
                                : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                            }`}
                          >
                            <Play className="w-3 h-3 text-cyan-400 fill-current" />
                            <span className="truncate max-w-[110px]">{rc.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Search, Categories & Channel List */}
                <div className="flex-1 p-4 flex flex-col overflow-hidden bg-slate-900/70">
                  {/* Search Input + Active Playlist Switcher */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search channels by name or group..."
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 text-white text-xs border border-slate-700 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {playlists.length > 1 && (
                      <select
                        value={activePlaylist?.id || ''}
                        onChange={e => {
                          const nextId = e.target.value;
                          setActivePlaylistId(nextId);
                          const found = playlists.find(p => p.id === nextId);
                          if (found?.channels[0]) {
                            handleSelectChannel(found.channels[0]);
                          }
                        }}
                        aria-label="Select Active Playlist"
                        className="px-2.5 py-2 rounded-xl bg-slate-950 text-cyan-300 text-xs font-bold border border-cyan-500/40 max-w-[140px]"
                      >
                        {playlists.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.channelCount})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Category Pills */}
                  <div className="flex space-x-1.5 pb-2.5 overflow-x-auto">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                          activeCategory === cat
                            ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Channels Scroll List */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {filteredChannels.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center p-6">
                        No channels match your current filter.
                      </div>
                    ) : (
                      filteredChannels.map(channel => {
                        const isSelected = selectedChannel?.streamUrl === channel.streamUrl;
                        const isFav = favoriteUrls.includes(channel.streamUrl);
                        return (
                          <div
                            key={channel.id + channel.streamUrl}
                            onClick={() => handleSelectChannel(channel)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSelectChannel(channel);
                            }}
                            className={`w-full text-left p-2.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600/40 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                                : 'bg-slate-800/45 border border-white/5 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center space-x-3 overflow-hidden">
                              {channel.logoUrl ? (
                                <img
                                  src={channel.logoUrl}
                                  alt={channel.name}
                                  className="w-9 h-9 rounded-xl object-contain bg-slate-950 p-1 border border-white/10 shrink-0"
                                  onError={e => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                    isSelected
                                      ? 'bg-cyan-400 text-slate-950'
                                      : 'bg-slate-700 text-slate-200'
                                  }`}
                                >
                                  {channel.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="overflow-hidden">
                                <div className="text-xs font-extrabold text-white truncate">
                                  {channel.name}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {channel.currentProgram}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-cyan-300">
                                {channel.category}
                              </span>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleSelectChannel(channel);
                                  setFullscreenTrigger(n => n + 1);
                                }}
                                title="Full Screen Play"
                                aria-label={`Play ${channel.name} in Full Screen`}
                                className="px-2 py-1 rounded-lg bg-cyan-600/25 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-[10px] font-extrabold flex items-center space-x-1 transition-colors cursor-pointer"
                              >
                                <Maximize2 className="w-3 h-3" />
                                <span className="hidden xl:inline">Full Screen</span>
                              </button>
                              <button
                                type="button"
                                onClick={e => toggleFavoriteChannel(channel.streamUrl, e)}
                                aria-label="Favorite channel"
                                className={`p-1.5 rounded-lg ${
                                  isFav
                                    ? 'text-yellow-400'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${isFav ? 'fill-yellow-400' : ''}`}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PLAYLIST MANAGEMENT */}
        {activeTab === 'playlists' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30">
              <div>
                <h3 className="text-sm font-black text-white">
                  Multi-Playlist Manager ({playlists.length} Saved)
                </h3>
                <p className="text-xs text-slate-400">
                  Add multiple M3U/M3U8 playlists, rename them, refresh live channels, or switch active playlists anytime.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setQrModalConfig({
                      open: true,
                      contextType: 'iptv-m3u',
                      title: 'Add Playlist via Universal QR Code',
                      onApply: url => importPlaylistFromUrl(url, undefined, 'qr'),
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Add via QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center space-x-1.5 border border-white/10 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Import Local .M3U / .CSV</span>
                </button>
              </div>
            </div>

            {playlists.length === 0 ? (
              <div className="p-10 rounded-2xl bg-slate-950/60 border border-white/10 text-center space-y-3">
                <FolderOpen className="w-10 h-10 text-cyan-400 mx-auto opacity-70" />
                <div className="text-sm font-bold text-white">No Playlists Saved Yet</div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Paste an M3U URL in the top bar, scan a QR code from your mobile phone, or import a repository from the GitHub tab.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playlists.map(pl => {
                  const isCurrent = activePlaylist?.id === pl.id;
                  const isRenaming = renamingPlaylistId === pl.id;
                  const isConfirmingDelete = confirmDeleteId === pl.id;

                  return (
                    <div
                      key={pl.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                        isCurrent
                          ? 'bg-blue-950/50 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-950/75 border-white/10'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          {isRenaming ? (
                            <div className="flex items-center gap-1.5 flex-1">
                              <input
                                type="text"
                                value={renameText}
                                onChange={e => setRenameText(e.target.value)}
                                className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-400 text-white text-xs"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (renameText.trim()) {
                                    setPlaylists(prev =>
                                      prev.map(item =>
                                        item.id === pl.id
                                          ? { ...item, name: renameText.trim() }
                                          : item
                                      )
                                    );
                                  }
                                  setRenamingPlaylistId(null);
                                }}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white text-xs cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 overflow-hidden">
                              <h4 className="text-sm font-black text-white truncate">
                                {pl.name}
                              </h4>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                                  Active
                                </span>
                              )}
                            </div>
                          )}

                          <span className="text-xs font-extrabold text-cyan-300 shrink-0">
                            {pl.channelCount} Channels
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          {pl.url}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Source: {pl.sourceType.toUpperCase()} • Updated: {pl.updatedAt}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActivePlaylistId(pl.id);
                              if (pl.channels[0]) handleSelectChannel(pl.channels[0]);
                              setActiveTab('livetv');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                          >
                            Watch Playlist
                          </button>

                          {!pl.url.startsWith('local://') && (
                            <button
                              type="button"
                              onClick={() =>
                                importPlaylistFromUrl(pl.url, pl.name, pl.sourceType)
                              }
                              title="Refresh Playlist"
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setRenamingPlaylistId(pl.id);
                              setRenameText(pl.name);
                            }}
                            title="Rename Playlist"
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setPlaylists(prev => prev.filter(item => item.id !== pl.id));
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(pl.id)}
                            title="Delete Playlist"
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-950 text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GITHUB REPOSITORY INTEGRATION (Indian-IPTV-App) */}
        {activeTab === 'github' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            {/* Repository Attribution & Refresh Header */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950/60 to-slate-950 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-black text-white">
                    Indian-IPTV-App Open-Source Catalog Integration
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    MIT Licensed • kananinirav/Indian-IPTV-App
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Integrated stream catalog (`data/streams.csv`) with automatic M3U parsing, GitHub rate-limit handling, and local caching ({githubCacheStatus}).
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRefreshGithubCatalog()}
                disabled={loadingGithubCatalog}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingGithubCatalog ? 'animate-spin' : ''}`}
                />
                <span>Refresh Repository</span>
              </button>
            </div>

            {/* Stream Sources Grid from streams.csv */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {githubSources.map(source => (
                <div
                  key={source.id}
                  className="p-4 rounded-2xl bg-slate-950/85 border border-white/10 hover:border-cyan-400/50 flex flex-col justify-between gap-3 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-black text-white">{source.name}</h4>
                      {source.isOfficialRepo && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                          streams.csv
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {source.description || 'Public GitHub M3U stream source'}
                    </p>
                    <div className="text-[10px] text-cyan-400/80 font-mono truncate mt-2">
                      {source.streamUrl}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={loadingPlaylist}
                    onClick={() =>
                      importPlaylistFromUrl(source.streamUrl, source.name, 'github')
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-extrabold flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Load {source.name} Channels</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Custom GitHub Repository / Raw M3U Loader */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                    Load Custom GitHub Repository URL (Raw M3U or streams.csv)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Enter any raw GitHub `.m3u` or `streams.csv` URL, or scan via Universal QR Code.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setQrModalConfig({
                      open: true,
                      contextType: 'github-repo',
                      title: 'Custom GitHub IPTV Repository – QR Input',
                      onApply: url => {
                        setCustomGithubUrl(url);
                        importPlaylistFromUrl(url, 'GitHub Custom Repo', 'github');
                      },
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan Repo QR</span>
                </button>
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!customGithubUrl.trim()) return;
                  importPlaylistFromUrl(customGithubUrl, 'GitHub Custom Repo', 'github');
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="url"
                  value={customGithubUrl}
                  onChange={e => setCustomGithubUrl(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/.../streams.m3u"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold cursor-pointer"
                >
                  Import GitHub Feed
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Universal QR Code Modal */}
        {qrModalConfig.open && (
          <UniversalQrUrlModal
            contextType={qrModalConfig.contextType}
            title={qrModalConfig.title}
            initialUrl={playlistUrlInput}
            onApplyUrl={qrModalConfig.onApply}
            onClose={() => setQrModalConfig(prev => ({ ...prev, open: false }))}
          />
        )}
      </div>
    </div>
  );
};
