import React, { useState, useEffect } from 'react';
import { Wifi, Settings as SettingsIcon, Bell, Tv, Image as ImageIcon } from 'lucide-react';
import { formatTvClock, formatTvDate } from '../utils/launcherLogic';

interface HeaderProps {
  clockFormat: '12h' | '24h';
  showDate: boolean;
  focusedZone: string;
  headerIndex: number;
  onSelectWallpaper: () => void;
  onSelectWifi: () => void;
  onSelectSettings: () => void;
  onSelectNotifications: () => void;
  notificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  clockFormat,
  showDate,
  focusedZone,
  headerIndex,
  onSelectWallpaper,
  onSelectWifi,
  onSelectSettings,
  onSelectNotifications,
  notificationCount = 2,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { timeStr, periodStr } = formatTvClock(currentTime, clockFormat);
  const dateStr = formatTvDate(currentTime);

  const isWpFocused = focusedZone === 'header' && headerIndex === 0;
  const isWifiFocused = focusedZone === 'header' && headerIndex === 1;
  const isSettingsFocused = focusedZone === 'header' && headerIndex === 2;
  const isNotifFocused = focusedZone === 'header' && headerIndex === 3;

  return (
    <header className="w-full flex items-center justify-between px-8 py-4 z-20 select-none">
      {/* Left: KP TV Branding & Live Clock */}
      <div className="flex items-center space-x-6">
        {/* KP TV Brand with TV Icon */}
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

        {/* Vertical Divider */}
        <div className="h-9 w-px bg-white/20" />

        {/* Live Clock & Dynamic Date */}
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-bold tracking-tight text-white font-rajdhani drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {timeStr}
            </span>
            {periodStr && (
              <span className="text-sm font-bold text-slate-300 font-rajdhani">
                {periodStr}
              </span>
            )}
          </div>
          {showDate && (
            <span className="text-xs font-medium text-slate-300/80 tracking-wide">
              {dateStr}
            </span>
          )}
        </div>
      </div>

      {/* Right: Quick TV Status Bar (Wallpaper, Wi-Fi, Settings, Notifications) */}
      <div className="flex items-center space-x-3.5">
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

        {/* Divider */}
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
          <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        {/* Divider */}
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

        {/* Divider */}
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
