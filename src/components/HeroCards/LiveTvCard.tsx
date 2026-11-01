import React from 'react';
import { Tv, Play, ChevronRight } from 'lucide-react';

interface LiveTvCardProps {
  isFocused: boolean;
  onSelect: () => void;
}

export const LiveTvCard: React.FC<LiveTvCardProps> = ({ isFocused, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label="Open Live TV Channels"
      className={`relative flex-1 min-w-[280px] h-64 rounded-3xl p-6 flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 select-none ${
        isFocused
          ? 'ring-4 ring-cyan-400 shadow-[0_0_40px_rgba(56,189,248,0.9)] scale-[1.03] z-20'
          : 'shadow-[0_10px_30px_rgba(0,114,255,0.35)] hover:scale-[1.01]'
      }`}
      style={{
        background: 'linear-gradient(135deg, rgba(0, 162, 255, 0.85) 0%, rgba(0, 85, 255, 0.9) 50%, rgba(10, 30, 90, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(125, 211, 252, 0.45)',
      }}
    >
      {/* Dynamic Cyan Wave Ribbons in background matching reference */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
        <svg
          viewBox="0 0 400 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute -bottom-10 -left-10 w-[140%] h-[140%]"
        >
          <path
            d="M-50 220 C 100 120, 200 280, 450 180"
            stroke="url(#cyanRibbon)"
            strokeWidth="38"
            strokeLinecap="round"
            className="opacity-70 blur-[2px]"
          />
          <path
            d="M-30 250 C 120 160, 250 300, 480 210"
            stroke="url(#cyanRibbonGlow)"
            strokeWidth="12"
            strokeLinecap="round"
            className="opacity-90"
          />
          <defs>
            <linearGradient id="cyanRibbon" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="cyanRibbonGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top section: Main TV Icon & Titles matching reference */}
      <div className="relative z-10 flex items-center space-x-4">
        {/* TV Screen Container with Play triangle */}
        <div className="relative w-22 h-18 rounded-2xl bg-gradient-to-br from-white/25 to-white/10 border-2 border-white/70 flex items-center justify-center shadow-[0_6px_25px_rgba(0,0,0,0.35)] shrink-0">
          {/* TV Antenna details */}
          <div className="absolute -top-3 w-8 h-2 flex justify-between px-1">
            <div className="w-0.5 h-3 bg-white/80 rotate-[-25deg] origin-bottom rounded-full" />
            <div className="w-0.5 h-3 bg-white/80 rotate-[25deg] origin-bottom rounded-full" />
          </div>

          {/* TV Screen Stand bottom */}
          <div className="absolute -bottom-2 w-8 h-1.5 bg-white/90 rounded-sm" />
          <div className="absolute -bottom-3 w-12 h-1 bg-white/70 rounded-full" />

          {/* Inner Play Triangle */}
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.9)]">
            <Play className="w-5 h-5 text-blue-700 fill-blue-700 ml-0.5" />
          </div>
        </div>

        <div className="flex flex-col">
          <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
            Live TV
          </h2>
          <span className="text-sm font-semibold text-cyan-100/90 tracking-wide mt-0.5">
            Live TV Channels
          </span>
        </div>
      </div>

      {/* Bottom action row: Circular arrow icon */}
      <div className="relative z-10 flex items-end justify-between mt-auto">
        <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-200/90 bg-black/20 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>IPTV / HD Streams</span>
        </div>

        {/* Circular Arrow Button with Glow */}
        <div className="w-10 h-10 rounded-full bg-blue-900/60 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-transform duration-200 group-hover:scale-110">
          <ChevronRight className="w-6 h-6 text-cyan-200 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
};
