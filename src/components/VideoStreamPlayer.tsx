import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertTriangle,
  Sliders,
  Subtitles,
  Gauge,
  Monitor,
  SkipBack,
  SkipForward,
} from 'lucide-react';

export type VideoAspectRatio = '16:9' | '4:3' | 'fit' | 'fill';

interface AudioTrackItem {
  id: number;
  name: string;
  lang?: string;
}

interface SubtitleTrackItem {
  id: number;
  name: string;
  lang?: string;
}

interface VideoStreamPlayerProps {
  streamUrl: string;
  title: string;
  subtitle?: string;
  isLive?: boolean;
  onPrevChannel?: () => void;
  onNextChannel?: () => void;
  forceFullscreenTrigger?: number;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  className?: string;
}

export const VideoStreamPlayer: React.FC<VideoStreamPlayerProps> = ({
  streamUrl,
  title,
  subtitle,
  isLive = true,
  onPrevChannel,
  onNextChannel,
  forceFullscreenTrigger = 0,
  onFullscreenChange,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const osdTimerRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showOsd, setShowOsd] = useState<boolean>(true);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [resolutionLabel, setResolutionLabel] = useState<string>('Auto');
  const [decoderEngine, setDecoderEngine] = useState<string>('Hardware / Native');

  const [audioTracks, setAudioTracks] = useState<AudioTrackItem[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(-1);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrackItem[]>([]);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<number>(-1);

  const [reloadNonce, setReloadNonce] = useState<number>(0);

  // Wake OSD controls and auto-hide after 3.5s when in fullscreen mode
  const wakeOsd = useCallback(() => {
    setShowOsd(true);
    if (osdTimerRef.current) {
      window.clearTimeout(osdTimerRef.current);
      osdTimerRef.current = null;
    }
    if (isFullscreen && isPlaying && !playbackError) {
      osdTimerRef.current = window.setTimeout(() => {
        setShowOsd(false);
      }, 3500);
    }
  }, [isFullscreen, isPlaying, playbackError]);

  useEffect(() => {
    wakeOsd();
    return () => {
      if (osdTimerRef.current) {
        window.clearTimeout(osdTimerRef.current);
      }
    };
  }, [isFullscreen, isPlaying, playbackError, wakeOsd]);

  const cleanupHls = useCallback(() => {
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {
        // ignore
      }
      hlsRef.current = null;
    }
  }, []);

  const initPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    cleanupHls();
    setIsBuffering(true);
    setPlaybackError(null);
    setAudioTracks([]);
    setSubtitleTracks([]);
    setResolutionLabel('Detecting...');

    const lowerUrl = streamUrl.toLowerCase();
    const isHlsStream =
      lowerUrl.includes('.m3u8') ||
      lowerUrl.includes('.m3u') ||
      lowerUrl.includes('mpegurl') ||
      lowerUrl.includes('/hls/');

    if (isHlsStream && Hls.isSupported()) {
      setDecoderEngine('HLS.js MediaSource Engine');
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setIsBuffering(false);
        if (data.levels && data.levels.length > 0) {
          const highest = data.levels[data.levels.length - 1];
          if (highest.height) {
            setResolutionLabel(`${highest.height}p`);
          }
        }
        video
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_event, data) => {
        const tracks = (data.audioTracks || []).map((t, idx) => ({
          id: idx,
          name: t.name || t.lang || `Audio ${idx + 1}`,
          lang: t.lang,
        }));
        setAudioTracks(tracks);
        setSelectedAudioTrack(hls.audioTrack);
      });

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_event, data) => {
        const subs = (data.subtitleTracks || []).map((t, idx) => ({
          id: idx,
          name: t.name || t.lang || `Subtitle ${idx + 1}`,
          lang: t.lang,
        }));
        setSubtitleTracks(subs);
        setSelectedSubtitleTrack(hls.subtitleTrack);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setPlaybackError(
                'Network error while streaming. Press Retry to reconnect to stream.'
              );
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setDecoderEngine('Software Recovery Fallback');
              hls.recoverMediaError();
              break;
            default:
              setPlaybackError(
                'Stream format or CORS error. Verify the stream URL is online and accessible.'
              );
              setIsBuffering(false);
              break;
          }
        }
      });
    } else {
      // Native HTML5 / Android WebView MediaCodec playback
      setDecoderEngine('Native MediaCodec / HTML5');
      video.src = streamUrl;
      video.load();
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
        })
        .catch(() => {
          setIsPlaying(false);
          setIsBuffering(false);
        });
    }
  }, [streamUrl, cleanupHls]);

  useEffect(() => {
    initPlayback();
    return () => cleanupHls();
  }, [initPlayback, reloadNonce, cleanupHls]);

  // Enter Fullscreen (works in both browser native Fullscreen API AND iframe/WebView fixed 100vwx100vh cinema mode)
  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
    setShowOsd(true);
    onFullscreenChange?.(true);

    const el = containerRef.current as (HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    }) | null;
    if (el && !document.fullscreenElement) {
      try {
        if (typeof el.requestFullscreen === 'function') {
          el.requestFullscreen().catch(() => {
            // Fallback to CSS fixed inset-0 cinema fullscreen when blocked by iframe/WebView permissions
          });
        } else if (typeof el.webkitRequestFullscreen === 'function') {
          el.webkitRequestFullscreen();
        }
      } catch {
        // Ignore native API error; CSS fullscreen is already active
      }
    }
  }, [onFullscreenChange]);

  // Exit Fullscreen
  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setShowOsd(true);
    onFullscreenChange?.(false);

    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
    };
    if (document.fullscreenElement) {
      try {
        if (typeof document.exitFullscreen === 'function') {
          document.exitFullscreen().catch(() => {});
        } else if (typeof doc.webkitExitFullscreen === 'function') {
          doc.webkitExitFullscreen();
        }
      } catch {
        // Ignore
      }
    }
  }, [onFullscreenChange]);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Trigger fullscreen when parent increments forceFullscreenTrigger
  useEffect(() => {
    if (forceFullscreenTrigger > 0) {
      enterFullscreen();
    }
  }, [forceFullscreenTrigger, enterFullscreen]);

  // Sync when user exits native browser fullscreen via Esc
  useEffect(() => {
    const handleNativeFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        // Keep state in sync if native fullscreen exited
        setIsFullscreen(false);
        setShowOsd(true);
        onFullscreenChange?.(false);
      }
    };
    document.addEventListener('fullscreenchange', handleNativeFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleNativeFullscreenChange);
    };
  }, [isFullscreen, onFullscreenChange]);

  // Keyboard & TV Remote shortcuts for Fullscreen (F key, Escape/Back to exit fullscreen, Channel Up/Down)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (isInput) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        e.stopPropagation();
        toggleFullscreen();
        return;
      }

      if (isFullscreen) {
        wakeOsd();
        if (e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault();
          e.stopPropagation();
          exitFullscreen();
          return;
        }
        if ((e.key === 'ChannelUp' || e.key === 'PageUp') && onNextChannel) {
          e.preventDefault();
          onNextChannel();
          return;
        }
        if ((e.key === 'ChannelDown' || e.key === 'PageDown') && onPrevChannel) {
          e.preventDefault();
          onPrevChannel();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isFullscreen, toggleFullscreen, exitFullscreen, wakeOsd, onNextChannel, onPrevChannel]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (val: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, val));
    video.volume = clamped;
    video.muted = clamped === 0;
    setVolume(clamped);
    setIsMuted(clamped === 0);
  };

  const handleSpeedChange = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleSeek = (timeSec: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(duration) || duration <= 0) return;
    video.currentTime = timeSec;
    setCurrentTime(timeSec);
  };

  const cycleAspectRatio = () => {
    const order: VideoAspectRatio[] = ['16:9', '4:3', 'fit', 'fill'];
    const next = order[(order.indexOf(aspectRatio) + 1) % order.length];
    setAspectRatio(next);
  };

  const handleSelectAudioTrack = (trackId: number) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackId;
      setSelectedAudioTrack(trackId);
    }
  };

  const handleSelectSubtitleTrack = (trackId: number) => {
    if (hlsRef.current) {
      hlsRef.current.subtitleTrack = trackId;
      setSelectedSubtitleTrack(trackId);
    }
  };

  const formatTime = (sec: number) => {
    if (!Number.isFinite(sec) || sec < 0) return '00:00';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const videoObjectFitClass =
    aspectRatio === 'fill'
      ? 'object-cover w-full h-full'
      : aspectRatio === '4:3'
      ? 'object-fill w-3/4 h-full mx-auto'
      : aspectRatio === 'fit'
      ? 'object-contain w-full h-full'
      : 'object-contain w-full h-full';

  const osdVisible = !isFullscreen || showOsd || !isPlaying || Boolean(playbackError);

  return (
    <div
      ref={containerRef}
      data-kptv-fullscreen={isFullscreen ? 'true' : 'false'}
      onMouseMove={wakeOsd}
      onTouchStart={wakeOsd}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[150] w-screen h-screen bg-black flex flex-col justify-between select-none overflow-hidden'
          : `relative bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between select-none ${className}`
      }
    >
      {/* Video Surface */}
      <div
        onDoubleClick={toggleFullscreen}
        onClick={() => {
          if (isFullscreen) {
            setShowOsd(prev => !prev);
          }
        }}
        className="relative flex-1 w-full h-full min-h-[240px] flex items-center justify-center bg-black overflow-hidden"
      >
        <video
          ref={videoRef}
          className={videoObjectFitClass}
          playsInline
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsBuffering(false);
            setIsPlaying(true);
            setPlaybackError(null);
            if (videoRef.current?.videoHeight) {
              setResolutionLabel(`${videoRef.current.videoHeight}p`);
            }
          }}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime || 0);
              setDuration(
                Number.isFinite(videoRef.current.duration) ? videoRef.current.duration : 0
              );
            }
          }}
          onError={() => {
            if (!hlsRef.current) {
              setIsBuffering(false);
              setPlaybackError(
                'Unable to decode stream. Check URL format (HLS/M3U8/MP4) or network connection.'
              );
            }
          }}
        />

        {/* Top Overlay: Channel / Stream Info, Decoder Badge & Quick Full Screen Button */}
        <div
          className={`absolute top-3 left-3 right-3 flex items-center justify-between transition-opacity duration-300 z-10 ${
            osdVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 flex items-center space-x-2.5 max-w-[62%] pointer-events-auto">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                playbackError
                  ? 'bg-red-500'
                  : isBuffering
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <div className="overflow-hidden">
              <div className="text-xs font-extrabold text-white truncate">{title}</div>
              {subtitle && (
                <div className="text-[10px] text-cyan-300 truncate">{subtitle}</div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 pointer-events-auto">
            <span className="px-2 py-1 rounded-lg bg-slate-950/85 border border-cyan-500/30 text-[10px] font-bold text-cyan-300">
              {resolutionLabel}
            </span>
            <span className="px-2 py-1 rounded-lg bg-slate-950/85 border border-white/10 text-[10px] font-bold text-slate-300 hidden sm:inline-block">
              {decoderEngine}
            </span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              title={isFullscreen ? 'Exit Full Screen (Esc / F)' : 'Full Screen Play (F)'}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 border transition-all cursor-pointer shadow-lg ${
                isFullscreen
                  ? 'bg-rose-600/90 hover:bg-rose-500 border-rose-400 text-white'
                  : 'bg-cyan-600/90 hover:bg-cyan-500 border-cyan-300/60 text-white'
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Full Screen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Full Screen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Buffering Indicator */}
        {isBuffering && !playbackError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] pointer-events-none">
            <RefreshCw className="w-9 h-9 text-cyan-400 animate-spin mb-2" />
            <span className="text-xs font-extrabold text-cyan-200 tracking-wide">
              Buffering Stream...
            </span>
          </div>
        )}

        {/* Playback Error Recovery Overlay */}
        {playbackError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center z-20">
            <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
            <h4 className="text-sm font-black text-white mb-1">Stream Playback Issue</h4>
            <p className="text-xs text-slate-300 max-w-md mb-4">{playbackError}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setReloadNonce(n => n + 1);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 focus:ring-4 focus:ring-cyan-300 text-white text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Playback</span>
              </button>
              {onNextChannel && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onNextChannel();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 focus:ring-4 focus:ring-cyan-400 text-slate-200 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Try Next Channel</span>
                </button>
              )}
              {isFullscreen && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    exitFullscreen();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Full Screen</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Remote-Friendly Player Controls Bar */}
      <div
        className={`bg-slate-950/95 border-t border-white/10 px-3.5 py-2.5 space-y-2 transition-opacity duration-300 ${
          isFullscreen
            ? osdVisible
              ? 'opacity-100'
              : 'opacity-0 pointer-events-none'
            : 'opacity-100'
        }`}
      >
        {/* Seek Bar (shown for VOD or seekable HLS streams) */}
        {!isLive && duration > 0 && (
          <div className="flex items-center space-x-2.5 text-[11px] text-slate-300 font-mono">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={e => handleSeek(Number(e.target.value))}
              className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span>{formatTime(duration)}</span>
          </div>
        )}

        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Play/Pause, Prev/Next, Retry, Volume */}
          <div className="flex items-center space-x-1.5">
            {onPrevChannel && (
              <button
                type="button"
                onClick={onPrevChannel}
                title="Previous Channel"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 focus:ring-2 focus:ring-cyan-400 text-slate-200 cursor-pointer"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={togglePlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
              className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 focus:ring-2 focus:ring-cyan-300 text-white cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {onNextChannel && (
              <button
                type="button"
                onClick={onNextChannel}
                title="Next Channel"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 focus:ring-2 focus:ring-cyan-400 text-slate-200 cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setReloadNonce(n => n + 1)}
              title="Retry Stream"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 focus:ring-2 focus:ring-cyan-400 text-cyan-300 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              title="Mute / Unmute"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 focus:ring-2 focus:ring-cyan-400 text-slate-200 cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={isMuted ? 0 : volume}
              onChange={e => handleVolumeChange(Number(e.target.value))}
              aria-label="Volume"
              className="w-16 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer hidden sm:block"
            />
          </div>

          {/* Right: Speed, Audio Track, Subtitles, Aspect Ratio, Fullscreen Play */}
          <div className="flex items-center flex-wrap gap-1.5">
            {/* Speed Selector */}
            <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl px-2 py-1 text-[11px] text-slate-200">
              <Gauge className="w-3.5 h-3.5 text-cyan-400 mr-1" />
              <select
                value={playbackRate}
                onChange={e => handleSpeedChange(Number(e.target.value))}
                aria-label="Playback Speed"
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(r => (
                  <option key={r} value={r} className="bg-slate-900 text-white">
                    {r}x
                  </option>
                ))}
              </select>
            </div>

            {/* Audio Tracks Selector (if multiple available) */}
            {audioTracks.length > 1 && (
              <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl px-2 py-1 text-[11px] text-slate-200">
                <Sliders className="w-3.5 h-3.5 text-cyan-400 mr-1" />
                <select
                  value={selectedAudioTrack}
                  onChange={e => handleSelectAudioTrack(Number(e.target.value))}
                  aria-label="Audio Track"
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer max-w-[90px]"
                >
                  {audioTracks.map(t => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Subtitle Tracks Selector (if available) */}
            {subtitleTracks.length > 0 && (
              <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl px-2 py-1 text-[11px] text-slate-200">
                <Subtitles className="w-3.5 h-3.5 text-cyan-400 mr-1" />
                <select
                  value={selectedSubtitleTrack}
                  onChange={e => handleSelectSubtitleTrack(Number(e.target.value))}
                  aria-label="Subtitles"
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer max-w-[90px]"
                >
                  <option value={-1} className="bg-slate-900 text-white">
                    Sub: Off
                  </option>
                  {subtitleTracks.map(t => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Aspect Ratio Toggle */}
            <button
              type="button"
              onClick={cycleAspectRatio}
              title="Change Aspect Ratio"
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 focus:ring-2 focus:ring-cyan-400 text-[11px] font-bold text-cyan-300 flex items-center space-x-1 cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="uppercase">{aspectRatio}</span>
            </button>

            {/* Full Screen Play / Exit Full Screen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Full Screen (Esc / F)' : 'Full Screen Play (F)'}
              className={`px-3 py-1.5 rounded-xl focus:ring-2 focus:ring-cyan-400 text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                isFullscreen
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.5)]'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Full Screen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Full Screen Play</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
