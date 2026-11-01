import React, { useState } from 'react';
import { 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  CornerDownLeft, Home, Power, Volume2, VolumeX, Minimize2, Maximize2, Radio
} from 'lucide-react';

interface VirtualTvRemoteProps {
  onDpad: (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => void;
  onEnter: () => void;
  onBack: () => void;
  onHome: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const VirtualTvRemote: React.FC<VirtualTvRemoteProps> = ({
  onDpad,
  onEnter,
  onBack,
  onHome,
  soundEnabled,
  onToggleSound,
}) => {
  const [isMinimized, setIsMinimized] = useState(true);

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center space-x-2 bg-slate-900/90 text-cyan-400 border border-cyan-500/40 px-3.5 py-2 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-md hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Radio className="w-4 h-4 animate-pulse text-cyan-400" />
          <span className="text-xs font-bold tracking-wide">TV Remote HUD</span>
          <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
        </button>
      ) : (
        <div className="w-56 rounded-3xl bg-slate-950/95 border border-slate-700/80 shadow-[0_12px_40px_rgba(0,0,0,0.85)] p-4 flex flex-col items-center backdrop-blur-2xl">
          {/* Top Bar: Title & Minimize */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-extrabold text-white tracking-wider">
                TV REMOTE
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={onToggleSound}
                title="Toggle TV Sound Effects"
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Power & Status */}
          <div className="w-full flex justify-between items-center py-2 px-1">
            <button
              onClick={() => onHome()}
              title="Home Button"
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:bg-blue-600 transition-colors"
            >
              <Home className="w-4 h-4" />
            </button>
            <div className="text-[10px] text-slate-400 font-mono">
              Iconic 32" TV
            </div>
            <button
              title="Power Button"
              className="w-8 h-8 rounded-full bg-red-950/60 border border-red-600/60 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-600 transition-colors"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>

          {/* Physical D-Pad Directional Controller */}
          <div className="relative w-36 h-36 rounded-full bg-slate-900 border-2 border-slate-700 my-2 flex items-center justify-center shadow-inner">
            {/* D-Pad UP */}
            <button
              onClick={() => onDpad('UP')}
              aria-label="Remote UP"
              className="absolute top-1.5 w-11 h-9 rounded-t-full bg-slate-800 hover:bg-cyan-600 active:bg-cyan-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronUp className="w-5 h-5" />
            </button>

            {/* D-Pad DOWN */}
            <button
              onClick={() => onDpad('DOWN')}
              aria-label="Remote DOWN"
              className="absolute bottom-1.5 w-11 h-9 rounded-b-full bg-slate-800 hover:bg-cyan-600 active:bg-cyan-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            {/* D-Pad LEFT */}
            <button
              onClick={() => onDpad('LEFT')}
              aria-label="Remote LEFT"
              className="absolute left-1.5 w-9 h-11 rounded-l-full bg-slate-800 hover:bg-cyan-600 active:bg-cyan-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* D-Pad RIGHT */}
            <button
              onClick={() => onDpad('RIGHT')}
              aria-label="Remote RIGHT"
              className="absolute right-1.5 w-9 h-11 rounded-r-full bg-slate-800 hover:bg-cyan-600 active:bg-cyan-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* OK / ENTER Center Button */}
            <button
              onClick={onEnter}
              aria-label="Remote OK"
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 active:scale-95 text-white font-extrabold text-sm flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)] cursor-pointer"
            >
              OK
            </button>
          </div>

          {/* Bottom Action Controls: Back, Home */}
          <div className="w-full flex justify-between items-center px-3 pt-2">
            <button
              onClick={onBack}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">BACK</span>
            </button>

            <button
              onClick={onHome}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-900/60 border border-blue-500 text-cyan-300 hover:text-white hover:bg-blue-600 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">HOME</span>
            </button>
          </div>

          {/* Keyboard tip */}
          <div className="text-[9px] text-slate-400 mt-2 text-center tracking-tight">
            Use keyboard <kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">Arrow Keys</kbd> & <kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">Enter</kbd>
          </div>
        </div>
      )}
    </div>
  );
};
