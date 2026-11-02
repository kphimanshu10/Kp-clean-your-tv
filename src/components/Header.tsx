import React, { useState, useEffect, useCallback } from 'react';
import {
  Wifi,
  Settings as SettingsIcon,
  Bell,
  Tv,
  Image as ImageIcon,
  Sun,
  Moon,
  CloudSun,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudLightning,
  RefreshCw,
  MapPin,
  PlayCircle,
  HardDrive,
} from 'lucide-react';
import { formatTvClock, formatTvDate } from '../utils/launcherLogic';
import { WeatherData } from '../types/launcher';
import {
  fetchWeatherForLocation,
  mapWmoWeatherCode,
  WeatherIconKind,
} from '../services/weatherService';

interface HeaderProps {
  clockFormat: '12h' | '24h';
  showDate: boolean;
  dateFormat?: 'short' | 'full' | 'numeric';
  showWeatherWidget?: boolean;
  showQuickStatusBar?: boolean;
  weatherLocation?: string;
  temperatureUnit?: 'C' | 'F';
  focusedZone: string;
  headerIndex: number;
  onSelectWallpaper: () => void;
  onSelectWifi: () => void;
  onSelectSettings: () => void;
  onSelectNotifications: () => void;
  onSelectOnlinePlayer?: () => void;
  notificationCount?: number;
}

function renderWeatherIcon(kind: WeatherIconKind) {
  switch (kind) {
    case 'clear-day':
      return <Sun className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]" />;
    case 'clear-night':
      return <Moon className="w-5 h-5 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.7)]" />;
    case 'partly-cloudy':
      return <CloudSun className="w-5 h-5 text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.6)]" />;
    case 'cloudy':
      return <Cloud className="w-5 h-5 text-slate-300" />;
    case 'fog':
      return <CloudFog className="w-5 h-5 text-slate-300" />;
    case 'rain':
      return <CloudRain className="w-5 h-5 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" />;
    case 'snow':
      return <CloudSnow className="w-5 h-5 text-cyan-200" />;
    case 'thunderstorm':
      return <CloudLightning className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />;
  }
}

export const Header: React.FC<HeaderProps> = ({
  clockFormat,
  showDate,
  dateFormat = 'short',
  showWeatherWidget = true,
  showQuickStatusBar = true,
  weatherLocation = 'New Delhi',
  temperatureUnit = 'C',
  focusedZone,
  headerIndex,
  onSelectWallpaper,
  onSelectWifi,
  onSelectSettings,
  onSelectNotifications,
  onSelectOnlinePlayer,
  notificationCount = 2,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<boolean>(false);
  const [storageLabel, setStorageLabel] = useState<string>('Storage OK');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine !== false : true
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    try {
      if (window.AndroidTvBridge?.getStorageStatusJson) {
        const raw = window.AndroidTvBridge.getStorageStatusJson();
        const parsed = JSON.parse(raw);
        if (parsed?.freeGb) {
          setStorageLabel(`${parsed.freeGb} GB Free`);
        }
      } else if (navigator.storage?.estimate) {
        navigator.storage.estimate().then(est => {
          if (est.quota) {
            const freeGb = Math.max(0.5, (est.quota - (est.usage || 0)) / (1024 * 1024 * 1024));
            setStorageLabel(`${freeGb.toFixed(1)} GB Free`);
          }
        });
      }
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const loadWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(false);
    try {
      const data = await fetchWeatherForLocation(weatherLocation, temperatureUnit);
      setWeather(data);
    } catch {
      setWeatherError(true);
    } finally {
      setWeatherLoading(false);
    }
  }, [weatherLocation, temperatureUnit]);

  useEffect(() => {
    loadWeather();
    const weatherTimer = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(weatherTimer);
  }, [loadWeather]);

  const { timeStr, periodStr } = formatTvClock(currentTime, clockFormat);
  const dateStr =
    dateFormat === 'full'
      ? currentTime.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : dateFormat === 'numeric'
      ? currentTime.toLocaleDateString('en-GB')
      : formatTvDate(currentTime);

  const isWpFocused = focusedZone === 'header' && headerIndex === 0;
  const isWifiFocused = focusedZone === 'header' && headerIndex === 1;
  const isSettingsFocused = focusedZone === 'header' && headerIndex === 2;
  const isNotifFocused = focusedZone === 'header' && headerIndex === 3;

  const iconKind: WeatherIconKind = weather
    ? mapWmoWeatherCode(weather.conditionCode, weather.isDay).iconKind
    : 'clear-day';

  return (
    <header className="w-full flex items-center justify-between px-8 py-4 z-20 select-none">
      {/* Left: KP TV Branding & Live Clock */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3.5 group">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700/60 to-cyan-500/30 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Tv className="w-6 h-6 text-cyan-200 stroke-[2.2]" />
            <div className="absolute inset-0 rounded-xl bg-cyan-400/10 blur-sm pointer-events-none" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              KP TV
            </h1>
            <span className="text-xs font-medium text-slate-300/90 tracking-wide uppercase">
              Smart TV Launcher
            </span>
          </div>
        </div>

        <div className="h-9 w-px bg-white/20" />

        <div className="flex flex-col justify-center">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-bold tracking-tight text-white font-rajdhani drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {timeStr}
            </span>
            {periodStr && (
              <span className="text-sm font-bold text-slate-300 font-rajdhani">{periodStr}</span>
            )}
          </div>
          {showDate && (
            <span className="text-xs font-medium text-slate-300/80 tracking-wide">{dateStr}</span>
          )}
        </div>
      </div>

      {/* Right: Online Link Player Shortcut + Quick Status + Weather + Action Icons */}
      <div className="flex items-center space-x-3">
        {/* Online Link Player Direct Home Shortcut */}
        {onSelectOnlinePlayer && (
          <button
            onClick={onSelectOnlinePlayer}
            title="Open VLC-Style Online Link Player"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-orange-950/70 hover:bg-orange-900/80 border border-orange-400/40 text-orange-200 text-xs font-extrabold shadow-[0_4px_15px_rgba(0,0,0,0.4)] transition-all cursor-pointer focus:ring-4 focus:ring-cyan-400"
          >
            <PlayCircle className="w-4 h-4 text-orange-400" />
            <span>Online Player</span>
          </button>
        )}

        {/* Quick Storage & Network Status Pill */}
        {showQuickStatusBar && (
          <button
            onClick={onSelectWifi}
            title="Quick Network & Storage Status"
            className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/15 text-[11px] font-bold text-slate-200 cursor-pointer focus:ring-4 focus:ring-cyan-400"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
            />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
            <span className="text-slate-600">•</span>
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300">{storageLabel}</span>
          </button>
        )}

        {/* Weather Summary Widget */}
        {showWeatherWidget && (
          <button
            onClick={onSelectSettings}
            title="Click to configure Weather Location & Unit in Settings"
            aria-label={
              weather
                ? `Current Weather in ${weather.locationName}: ${weather.temperature} degrees ${weather.unit}, ${weather.conditionText}`
                : `Weather for ${weatherLocation}`
            }
            className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-xl border border-cyan-400/30 shadow-[0_4px_15px_rgba(0,0,0,0.4)] transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-center">
              {weatherLoading && !weather ? (
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              ) : (
                renderWeatherIcon(iconKind)
              )}
            </div>

            <div className="flex flex-col items-start text-left">
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-extrabold text-white font-rajdhani leading-none">
                  {weather ? `${weather.temperature}°${weather.unit}` : weatherError ? '--°' : '...'}
                </span>
                <span className="text-[11px] font-semibold text-cyan-300 leading-none truncate max-w-[100px]">
                  {weather ? weather.conditionText : weatherError ? 'Offline' : 'Syncing'}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-[10px] text-slate-300/90 mt-0.5">
                <MapPin className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                <span className="truncate max-w-[120px]">
                  {weather ? weather.locationName : weatherLocation}
                </span>
              </div>
            </div>
          </button>
        )}

        <div className="h-6 w-px bg-white/20" />

        {/* Wallpaper Studio Quick Button */}
        <button
          onClick={onSelectWallpaper}
          title="Wallpaper Studio"
          aria-label="Open Wallpaper Studio"
          className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer ${
            isWpFocused
              ? 'bg-blue-600/80 text-white ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.8)] scale-110'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <ImageIcon className="w-5 h-5 text-cyan-300" />
        </button>

        <div className="h-6 w-px bg-white/20" />

        {/* Wi-Fi Icon Button */}
        <button
          onClick={onSelectWifi}
          aria-label="Wi-Fi Connection Status"
          className={`relative p-2.5 rounded-full transition-all duration-200 cursor-pointer ${
            isWifiFocused
              ? 'bg-blue-600/80 text-white ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.8)] scale-110'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Wifi className="w-5 h-5" />
          <span
            className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${
              isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
        </button>

        <div className="h-6 w-px bg-white/20" />

        {/* Settings Icon Button */}
        <button
          onClick={onSelectSettings}
          aria-label="Settings"
          className={`p-2.5 rounded-full transition-all duration-200 ${
            isSettingsFocused
              ? 'bg-blue-600/80 text-white ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.8)] scale-110'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-white/20" />

        {/* Notifications Icon Button */}
        <button
          onClick={onSelectNotifications}
          aria-label="System Notifications"
          className={`relative p-2.5 rounded-full transition-all duration-200 ${
            isNotifFocused
              ? 'bg-blue-600/80 text-white ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.8)] scale-110'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          )}
        </button>
      </div>
    </header>
  );
};
