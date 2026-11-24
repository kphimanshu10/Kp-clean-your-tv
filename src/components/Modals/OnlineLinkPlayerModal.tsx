import React, { useState, useEffect } from 'react';
import {
  X,
  PlayCircle,
  QrCode,
  Link2,
  Star,
  History,
  Trash2,
  Play,
  Maximize2,
} from 'lucide-react';
import { VideoStreamPlayer } from '../VideoStreamPlayer';
import { UniversalQrUrlModal, validateHttpUrl } from './UniversalQrUrlModal';

interface OnlineStreamHistoryItem {
  id: string;
  title: string;
  url: string;
  format: string;
  isFavorite: boolean;
  lastPlayedAt: string;
}

interface OnlineLinkPlayerModalProps {
  initialUrl?: string;
  onClose: () => void;
}

const STORAGE_ONLINE_LINKS_KEY = 'kptv_online_link_history_v1';

function detectStreamFormatLabel(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('.m3u8')) return 'HLS';
  if (lower.includes('.mp4')) return 'MP4';
  if (lower.includes('.webm')) return 'WebM';
  if (lower.includes('.ts')) return 'TS';
  return 'Stream';
}

export const OnlineLinkPlayerModal: React.FC<OnlineLinkPlayerModalProps> = ({
  initialUrl = '',
  onClose,
}) => {
  const [historyItems, setHistoryItems] = useState<OnlineStreamHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ONLINE_LINKS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [urlInput, setUrlInput] = useState<string>(() => {
    if (initialUrl) return initialUrl;
    return historyItems[0]?.url || '';
  });

  const [activeStreamUrl, setActiveStreamUrl] = useState<string>(() => {
    if (initialUrl) return initialUrl;
    return historyItems[0]?.url || '';
  });

  const [activeTitle, setActiveTitle] = useState<string>(() => {
    if (initialUrl) return 'Online Stream';
    return historyItems[0]?.title || 'Link Player';
  });

  const [listFilter, setListFilter] = useState<'all' | 'favorites'>('all');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [fullscreenTrigger, setFullscreenTrigger] = useState<number>(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ONLINE_LINKS_KEY, JSON.stringify(historyItems));
    } catch {
      // ignore
    }
  }, [historyItems]);

  const recordAndPlayUrl = (rawUrl: string, openInFullscreen = false) => {
    const check = validateHttpUrl(rawUrl);
    if (!check.valid) return;

    const clean = check.normalized;
    const guessedTitle =
      clean
        .split('/')
        .pop()
        ?.split('?')[0]
        ?.replace(/\.(m3u8|mp4|webm|ts|m3u)$/i, '')
        ?.replace(/[-_]/g, ' ') || 'Video Stream';

    const format = detectStreamFormatLabel(clean);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setActiveStreamUrl(clean);
    setActiveTitle(guessedTitle);
    setUrlInput(clean);
    if (openInFullscreen) {
      setFullscreenTrigger(n => n + 1);
    }

    setHistoryItems(prev => {
      const existing = prev.find(i => i.url === clean);
      if (existing) {
        return [
          { ...existing, lastPlayedAt: nowTime },
          ...prev.filter(i => i.url !== clean),
        ];
      }
      const nextItem: OnlineStreamHistoryItem = {
        id: `online-${Date.now()}`,
        title: guessedTitle,
        url: clean,
        format,
        isFavorite: false,
        lastPlayedAt: nowTime,
      };
      return [nextItem, ...prev.slice(0, 29)];
    });
  };

  const toggleFavorite = (id: string) => {
    setHistoryItems(prev =>
      prev.map(item => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  const deleteHistoryItem = (id: string) => {
    setHistoryItems(prev => prev.filter(item => item.id !== id));
  };

  const clearNonFavorites = () => {
    setHistoryItems(prev => prev.filter(item => item.isFavorite));
  };

  const displayedList =
    listFilter === 'favorites'
      ? historyItems.filter(i => i.isFavorite)
      : historyItems;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-5 select-none">
      <div className="relative w-full max-w-6xl h-[86vh] rounded-3xl bg-slate-900/95 border border-cyan-500/35 shadow-[0_0_55px_rgba(6,182,212,0.3)] flex flex-col overflow-hidden">
        {/* Compact Header + URL Input Bar */}
        <div className="px-5 py-3.5 bg-slate-950/85 border-b border-white/10 flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2 mr-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400">
              <PlayCircle className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-white">Link Player</h2>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              recordAndPlayUrl(urlInput);
            }}
            className="flex-1 min-w-[240px] flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="Paste stream link (https://.../video.m3u8 or .mp4)"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-mono border border-slate-700 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 focus:ring-2 focus:ring-cyan-300 text-white text-xs font-extrabold flex items-center space-x-1.5 shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (urlInput.trim()) {
                  recordAndPlayUrl(urlInput, true);
                } else if (activeStreamUrl) {
                  setFullscreenTrigger(n => n + 1);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 focus:ring-2 focus:ring-cyan-300 text-white text-xs font-extrabold flex items-center space-x-1.5 shrink-0 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen Play</span>
            </button>
          </form>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400/50 focus:ring-2 focus:ring-cyan-300 text-cyan-200 text-xs font-extrabold flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>QR Link</span>
          </button>

          <button
            onClick={onClose}
            aria-label="Close Link Player"
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 focus:ring-2 focus:ring-cyan-400 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body: Video Player + History / Favorites Sidebar */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-[1.7] p-4 bg-black/80 flex flex-col justify-between border-r border-white/10 overflow-hidden">
            {activeStreamUrl ? (
              <VideoStreamPlayer
                streamUrl={activeStreamUrl}
                title={activeTitle}
                subtitle={activeStreamUrl}
                isLive={activeStreamUrl.toLowerCase().includes('.m3u8')}
                forceFullscreenTrigger={fullscreenTrigger}
                className="flex-1 w-full"
              />
            ) : (
              <div className="flex-1 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center">
                <PlayCircle className="w-12 h-12 text-cyan-400 mb-3 opacity-80" />
                <h3 className="text-base font-black text-white mb-4">
                  Paste Stream URL or Scan QR Link
                </h3>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-extrabold flex items-center space-x-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan Phone QR</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Recent & Favorites */}
          <div className="flex-1 p-4 bg-slate-900/70 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setListFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer ${
                    listFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Recent ({historyItems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter('favorites')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer ${
                    listFilter === 'favorites'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Saved ({historyItems.filter(i => i.isFavorite).length})</span>
                </button>
              </div>

              {historyItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearNonFavorites}
                  title="Clear history"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 text-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
              {displayedList.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center p-4 text-slate-500 text-xs">
                  No saved links
                </div>
              ) : (
                displayedList.map(item => {
                  const isPlayingNow = activeStreamUrl === item.url;
                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                        isPlayingNow
                          ? 'bg-blue-600/30 border-cyan-400'
                          : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => recordAndPlayUrl(item.url)}
                        className="flex-1 text-left overflow-hidden cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-extrabold text-white truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 font-bold shrink-0">
                            {item.format}
                          </span>
                        </div>
                      </button>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => recordAndPlayUrl(item.url, true)}
                          title="Full Screen Play"
                          className="px-2 py-1 rounded-lg bg-cyan-600/25 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-[10px] font-extrabold flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Full</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(item.id)}
                          aria-label="Toggle Favorite"
                          className={`p-1.5 rounded-lg cursor-pointer ${
                            item.isFavorite
                              ? 'text-yellow-400 bg-yellow-500/10'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-yellow-400' : ''}`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHistoryItem(item.id)}
                          aria-label="Remove item"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {showQrModal && (
          <UniversalQrUrlModal
            contextType="online-video"
            title="Scan QR to Send Video Link"
            placeholder="https://example.com/live/stream.m3u8"
            initialUrl={urlInput}
            onApplyUrl={url => recordAndPlayUrl(url)}
            onClose={() => setShowQrModal(false)}
          />
        )}
      </div>
    </div>
  );
};
