import React from 'react';
import { CricketMatch } from '../../types/launcher';

interface CricketScoreCardProps {
  match: CricketMatch;
  isFocused: boolean;
  onSelect: () => void;
}

export const CricketScoreCard: React.FC<CricketScoreCardProps> = ({
  match,
  isFocused,
  onSelect,
}) => {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`Live Cricket: ${match.title}, ${match.team1.code} ${match.team1.score} vs ${match.team2.code} ${match.team2.score}`}
      className={`relative flex-[1.3] min-w-[340px] h-64 rounded-3xl flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 select-none ${
        isFocused
          ? 'ring-4 ring-cyan-400 shadow-[0_0_40px_rgba(56,189,248,0.9)] scale-[1.03] z-20'
          : 'shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:scale-[1.01]'
      }`}
      style={{
        background: 'linear-gradient(180deg, #0b1528 0%, #0d223a 50%, #06101d 100%)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
      }}
    >
      {/* Stadium Floodlights & Green Pitch Photorealistic SVG Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sky glow from floodlights */}
        <div className="absolute top-0 left-1/4 w-1/2 h-28 bg-sky-400/20 rounded-full blur-2xl" />
        <div className="absolute top-0 right-0 w-40 h-28 bg-blue-500/20 rounded-full blur-xl" />

        {/* Stadium Lights Beams */}
        <svg
          viewBox="0 0 500 300"
          className="absolute inset-0 w-full h-full object-cover opacity-75"
          preserveAspectRatio="none"
        >
          <defs>
            <radialGradient id="floodlightL" cx="15%" cy="20%" r="40%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0b1528" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="floodlightR" cx="85%" cy="20%" r="40%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0b1528" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="pitchGrass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#15803d" stopOpacity="0.7" />
              <stop offset="40%" stopColor="#166534" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#052e16" stopOpacity="0.98" />
            </linearGradient>
          </defs>

          {/* Left & Right Stadium Floodlight Towers */}
          <circle cx="75" cy="50" r="80" fill="url(#floodlightL)" />
          <circle cx="425" cy="50" r="80" fill="url(#floodlightR)" />

          {/* Stadium Tier Silhouettes */}
          <path
            d="M 0 170 Q 250 140 500 170 L 500 300 L 0 300 Z"
            fill="url(#pitchGrass)"
          />

          {/* Pitch Strip in center */}
          <polygon
            points="235,170 265,170 275,300 225,300"
            fill="#ca8a04"
            opacity="0.35"
          />

          {/* Stadium crowd & lights sparkle dots */}
          <g fill="#ffffff" opacity="0.6">
            <circle cx="50" cy="90" r="1.5" />
            <circle cx="65" cy="85" r="2" />
            <circle cx="80" cy="95" r="1.5" />
            <circle cx="420" cy="90" r="2" />
            <circle cx="440" cy="85" r="1.5" />
            <circle cx="455" cy="92" r="2" />
          </g>
        </svg>
      </div>

      {/* Top Bar: LIVE badge & Match Title */}
      <div className="relative z-10 px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 bg-red-600/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.8)] border border-red-400/50">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="tracking-wider">LIVE</span>
        </div>

        <div className="flex flex-col items-end">
          <h2 className="text-xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {match.title}
          </h2>
          <span className="text-xs font-semibold text-slate-300">
            {match.series}
          </span>
        </div>
      </div>

      {/* Middle: Teams, Emblems, VS, and Scores */}
      <div className="relative z-10 px-5 py-2 flex items-center justify-between">
        {/* Team 1: IND */}
        <div className="flex flex-col items-center flex-1">
          {/* India Flag Round Emblem */}
          <div className="w-13 h-13 rounded-full border-2 border-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col justify-between relative bg-white">
            {/* Saffron band */}
            <div className="w-full h-1/3 bg-[#FF9933]" />
            {/* White band with Ashoka Chakra */}
            <div className="w-full h-1/3 bg-white flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full border border-[#000088] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#000088]" />
              </div>
            </div>
            {/* Green band */}
            <div className="w-full h-1/3 bg-[#128807]" />
          </div>

          <span className="text-xs font-bold text-slate-200 mt-1 uppercase tracking-wider">
            {match.team1.code}
          </span>
          <span className="text-2xl font-black text-white font-rajdhani tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {match.team1.score}
          </span>
          <span className="text-[11px] font-medium text-slate-300">
            {match.team1.overs}
          </span>
        </div>

        {/* Stylized Golden VS Badge */}
        <div className="px-3 flex flex-col items-center">
          <span className="text-2xl font-black italic tracking-tighter bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]">
            VS
          </span>
        </div>

        {/* Team 2: AUS */}
        <div className="flex flex-col items-center flex-1">
          {/* Australia Flag Round Emblem */}
          <div className="w-13 h-13 rounded-full border-2 border-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.5)] overflow-hidden relative bg-[#00008b] flex items-center justify-center">
            {/* Union jack corner representation */}
            <div className="absolute top-0 left-0 w-6 h-4 bg-[#00008b] border-r border-b border-white/40">
              <div className="w-full h-full relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-red-600" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-full w-0.5 bg-red-600" />
                </div>
              </div>
            </div>
            {/* Southern Cross stars */}
            <div className="absolute right-1.5 top-2 w-1.5 h-1.5 text-white text-[8px] leading-none">★</div>
            <div className="absolute right-3.5 bottom-2 w-1.5 h-1.5 text-white text-[8px] leading-none">★</div>
            <div className="absolute right-1 bottom-4 w-1 h-1 text-white text-[7px] leading-none">★</div>
          </div>

          <span className="text-xs font-bold text-slate-200 mt-1 uppercase tracking-wider">
            {match.team2.code}
          </span>
          <span className="text-2xl font-black text-white font-rajdhani tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {match.team2.score}
          </span>
          <span className="text-[11px] font-medium text-slate-300">
            {match.team2.overs}
          </span>
        </div>
      </div>

      {/* Bottom Golden Match Status Banner matching reference image */}
      <div className="relative z-10 w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 py-2.5 px-4 flex items-center justify-center shadow-[0_-4px_20px_rgba(245,158,11,0.4)]">
        <span className="text-xs md:text-sm font-black text-slate-950 tracking-wider text-center drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] uppercase">
          {match.targetSummary}
        </span>
      </div>
    </div>
  );
};
