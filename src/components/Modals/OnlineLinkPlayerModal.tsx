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
  Sparkles,
  CheckCircle2,
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
  if (lower.includes('.m3u8')) return 'HLS / M3U8';
  if (lower.includes('.mp4')) return 'MP4 Video';
  if (lower.includes('.webm')) return 'WebM Video';
  if (lower.includes('.ts')) return 'MPEG-TS';
  if (lower.includes('.m3u')) return 'M3U Stream';
  return 'HTTP Stream';
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
    if (initialUrl) return 'Direct Online Stream';
    return historyItems[0]?.title || 'No Stream Loaded';
  });

  const [listFilter, setListFilter] = useState<'all' | 'favorites'>('all');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ONLINE_LINKS_KEY, JSON.stringify(historyItems));
    } catch {
      // ignore
    }
  }, [historyItems]);

  const recordAndPlayUrl = (rawUrl: string) => {
    const check = validateHttpUrl(rawUrl);
    if (!check.valid) {
      setStatusNote(check.error || 'Please enter a valid HTTP/HTTPS stream URL.');
      return;
    }

    const clean = check.normalized;
    const guessedTitle =
      clean
        .split('/')
        .pop()
        ?.split('?')[0]
        ?.replace(/\.(m3u8|mp4|webm|ts|m3u)$/i, '')
        ?.replace(/[-_]/g, ' ') || 'Online Video Stream';

    const format = detectStreamFormatLabel(clean);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setActiveStreamUrl(clean);
    setActiveTitle(guessedTitle);
    setUrlInput(clean);
    setStatusNote(`Playing ${format}: ${guessedTitle}`);

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
    setStatusNote('Cleared recent playback history (kept Favorites).');
  };

  const displayedList =
    listFilter === 'favorites'
      ? historyItems.filter(i => i.isFavorite)
      : historyItems;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6 select-none">
      <div className="relative w-full max-w-6xl h-[88vh] rounded-3xl bg-slate-900/95 border border-cyan-500/35 shadow-[0_0_55px_rgba(6,182,212,0.3)] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/75">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 border border-orange-400/40 text-orange-400">
              <PlayCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-white">
                  KP TV – Online Link Player (VLC-Style)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-950/80 text-orange-300 border border-orange-500/40">
                  Direct Stream Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Play direct MP4, M3U8, HLS, WebM & HTTP streams with speed, aspect ratio, audio/subtitle tracks & QR input
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Online Link Player"
            className="p-2.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 focus:ring-4 focus:ring-cyan-400 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stream URL Input Bar */}
        <div className="px-6 py-3.5 bg-slate-950/85 border-b border-white/10 flex flex-wrap items-center gap-2.5">
          <form
            onSubmit={e => {
              e.preventDefault();
              recordAndPlayUrl(urlInput);
            }}
            className="flex-1 min-w-[260px] flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="Enter or Paste Direct Stream URL (https://.../video.m3u8 or .mp4)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-mono border border-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                required
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 focus:ring-2 focus:ring-amber-300 text-white text-xs font-extrabold flex items-center space-x-1.5 shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Stream</span>
            </button>
          </form>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400/50 focus:ring-2 focus:ring-cyan-300 text-cyan-200 text-xs font-extrabold flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Universal QR Input</span>
          </button>

          {statusNote && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[220px]">{statusNote}</span>
            </div>
          )}
        </div>

        {/* Main Body: Video Player + History / Favorites Sidebar */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Video Player */}
          <div className="flex-[1.65] p-5 bg-black/80 flex flex-col justify-between border-r border-white/10 overflow-hidden">
            {activeStreamUrl ? (
              <VideoStreamPlayer
                streamUrl={activeStreamUrl}
                title={activeTitle}
                subtitle={activeStreamUrl}
                isLive={activeStreamUrl.toLowerCase().includes('.m3u8')}
                className="flex-1 w-full"
              />
            ) : (
              <div className="flex-1 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-3xl bg-orange-500/15 border border-orange-500/40 flex items-center justify-center text-orange-400 mb-4">
                  <PlayCircle className="w-9 h-9" />
                </div>
                <h3 className="text-lg font-black text-white mb-1">
                  Ready to Play Direct Network Streams
                </h3>
                <p className="text-xs text-slate-400 max-w-md mb-5">
                  Paste any direct video or live stream link (.m3u8, .mp4, .webm, .ts) above, or use the Universal QR Code button to beam a link from your mobile phone.
                </p>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-extrabold flex items-center space-x-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Send Video Link via Phone QR</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Recent Links & Favorite URLs */}
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
                  <span>Favorites ({historyItems.filter(i => i.isFavorite).length})</span>
                </button>
              </div>

              {historyItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearNonFavorites}
                  title="Clear non-favorite history"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 text-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
              {displayedList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                  <Sparkles className="w-6 h-6 text-cyan-400 mb-2 opacity-60" />
                  <p>
                    {listFilter === 'favorites'
                      ? 'No favorite stream URLs starred yet.'
                      : 'Your played online video links will be saved here for instant replay.'}
                  </p>
                </div>
              ) : (
                displayedList.map(item => {
                  const isPlayingNow = activeStreamUrl === item.url;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
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
                        <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                          {item.url}
                        </div>
                      </button>

                      <div className="flex items-center space-x-1 shrink-0">
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
                            className={`w-4 h-4 ${item.isFavorite ? 'fill-yellow-400' : ''}`}
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

        {/* Universal QR Modal */}
        {showQrModal && (
          <UniversalQrUrlModal
            contextType="online-video"
            title="Online Link Player – Universal QR Input"
            subtitle="Scan the QR code with your phone to send any MP4, M3U8, or HLS video stream link directly to the player."
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
