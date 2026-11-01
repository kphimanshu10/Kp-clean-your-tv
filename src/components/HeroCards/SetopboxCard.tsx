import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SetopboxCardProps {
  isFocused: boolean;
  onSelect: () => void;
}

export const SetopboxCard: React.FC<SetopboxCardProps> = ({ isFocused, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label="Open Setopbox HDMI Input"
      className={`relative flex-1 min-w-[280px] h-64 rounded-3xl p-6 flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 select-none ${
        isFocused
          ? 'ring-4 ring-cyan-400 shadow-[0_0_40px_rgba(217,70,239,0.9)] scale-[1.03] z-20'
          : 'shadow-[0_10px_30px_rgba(168,85,247,0.35)] hover:scale-[1.01]'
      }`}
      style={{
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(168, 85, 247, 0.85) 45%, rgba(45, 10, 80, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(244, 114, 182, 0.45)',
      }}
    >
      {/* Background Soft Purple Aura */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-400/25 rounded-full blur-3xl pointer-events-none" />

      {/* Realistic Set-top box hardware unit + Remote Control illustration */}
      <div className="relative z-10 flex items-center justify-center pt-2">
        <div className="relative flex items-center justify-center">
          {/* Set-top Box Unit */}
          <div className="relative w-44 h-16 rounded-xl bg-gradient-to-b from-[#1e2230] to-[#0a0d14] border border-slate-700/80 shadow-[0_12px_24px_rgba(0,0,0,0.7)] flex flex-col justify-between p-2">
            {/* Top bevel gloss */}
            <div className="w-full h-1 bg-white/10 rounded-full" />

            {/* Front Panel */}
            <div className="w-full flex items-center justify-between px-2 pt-2">
              {/* Brand logo on hardware */}
              <span className="text-[8px] font-bold tracking-widest text-slate-500 uppercase">
                HD SETOP
              </span>

              {/* Glowing Blue Power LED indicator */}
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#38bdf8] animate-pulse" />
              </div>
            </div>

            {/* Bottom Ventilation Slots */}
            <div className="w-full flex space-x-1 px-1">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="flex-1 h-0.5 bg-black/80 rounded" />
              ))}
            </div>
          </div>

          {/* Realistic Sleek Remote Control resting next to / over it */}
          <div className="relative -ml-4 -mt-3 w-14 h-24 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-600 shadow-[0_10px_20px_rgba(0,0,0,0.8)] p-1.5 flex flex-col justify-between transform rotate-6 hover:rotate-3 transition-transform duration-300">
            {/* IR Emitter / Power Button */}
            <div className="flex justify-between items-center px-1">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            </div>

            {/* Remote D-Pad Circular Ring */}
            <div className="w-8 h-8 mx-auto rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center my-1">
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-500/80" />
            </div>

            {/* Numeric & Color Keypad Grid */}
            <div className="grid grid-cols-3 gap-0.5 px-0.5 pb-1">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="h-1 rounded-sm bg-slate-700/80" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Card Titles */}
      <div className="relative z-10 flex flex-col pt-1">
        <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
          Setopbox
        </h2>
        <span className="text-sm font-semibold text-pink-100/90 tracking-wide mt-0.5">
          Watch Setopbox
        </span>
      </div>

      {/* Bottom Action Row */}
      <div className="relative z-10 flex items-center justify-between mt-auto">
        <span className="text-xs font-semibold text-pink-200/90 bg-black/30 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          HDMI 1 / DTH Input
        </span>

        {/* Circular Arrow Button with Purple Glow */}
        <div className="w-10 h-10 rounded-full bg-purple-900/60 border border-pink-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.5)] transition-transform duration-200 group-hover:scale-110">
          <ChevronRight className="w-6 h-6 text-pink-200 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
};
