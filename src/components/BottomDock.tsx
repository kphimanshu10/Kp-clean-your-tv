import React from 'react';
import { AppShortcut } from '../types/launcher';
import { Plus } from 'lucide-react';

interface BottomDockProps {
  dockApps: AppShortcut[];
  focusedIndex: number;
  isFocusedZone: boolean;
  onLaunchApp: (app: AppShortcut) => void;
  onOpenMoreApps: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  dockApps,
  focusedIndex,
  isFocusedZone,
  onLaunchApp,
  onOpenMoreApps,
}) => {
  return (
    <div className="w-full flex items-center justify-center space-x-5 py-4 select-none z-10">
      {dockApps.map((app, index) => {
        const isFocused = isFocusedZone && focusedIndex === index;

        return (
          <button
            key={app.id}
            onClick={() => onLaunchApp(app)}
            aria-label={`Launch ${app.name}`}
            className={`relative w-28 h-20 rounded-[28px] flex items-center justify-center transition-all duration-300 cursor-pointer group ${
              isFocused
                ? 'ring-4 ring-cyan-400 shadow-[0_0_35px_rgba(56,189,248,0.9)] scale-110 z-20'
                : 'hover:scale-105 shadow-[0_8px_20px_rgba(0,0,0,0.5)]'
            }`}
            style={{
              background:
                app.id === 'netmirror'
                  ? 'linear-gradient(135deg, rgba(37,99,235,0.9) 0%, rgba(30,58,138,0.95) 100%)'
                  : app.id === 'hotstar'
                  ? 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,58,138,0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: isFocused ? '2.5px solid #38bdf8' : '1.5px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '28px 48px 48px 28px',
              boxShadow: isFocused 
                ? '0 0 35px rgba(56,189,248,0.95), inset 0 0 15px rgba(56,189,248,0.4)' 
                : '0 8px 24px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)',
            }}
          >
            {/* Soft inner glow reflection */}
            <div className="absolute top-1 left-2 right-4 h-3 rounded-full bg-white/10 blur-[1px] pointer-events-none" />
            {/* Render Custom App Logo matching the Reference Image */}
            {app.id === 'netmirror' && (
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/20 border border-white/50 flex items-center justify-center shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                  <span className="text-xl font-black text-white ml-0.5">D</span>
                </div>
              </div>
            )}

            {app.id === 'netflix' && (
              <div className="flex items-center justify-center">
                <span className="text-4xl font-black text-[#E50914] tracking-tighter drop-shadow-[0_2px_8px_rgba(229,9,20,0.8)] font-sans">
                  N
                </span>
              </div>
            )}

            {app.id === 'youtube' && (
              <div className="flex items-center justify-center">
                <div className="w-12 h-8 rounded-xl bg-[#FF0000] flex items-center justify-center shadow-[0_2px_10px_rgba(255,0,0,0.6)]">
                  <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[11px] border-l-white ml-1" />
                </div>
              </div>
            )}

            {app.id === 'hotstar' && (
              <div className="flex flex-col items-center justify-center">
                <div className="text-yellow-400 text-2xl leading-none drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
                  ★
                </div>
                <span className="text-[10px] font-bold text-white tracking-wider mt-0.5 lowercase">
                  hotstar
                </span>
              </div>
            )}

            {app.id === 'airtel' && (
              <div className="flex flex-col items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#E11D48] flex items-center justify-center shadow-[0_0_8px_rgba(225,29,72,0.8)]">
                  <div className="w-3 h-3 rounded-full border-2 border-white" />
                </div>
                <span className="text-[10px] font-bold text-white tracking-wider mt-0.5">
                  Airtel
                </span>
              </div>
            )}

            {app.id === 'prime' && (
              <div className="flex flex-col items-center justify-center">
                <span className="text-xs font-black text-[#00A8E1] tracking-tight lowercase">
                  prime
                </span>
                <span className="text-[9px] font-bold text-white tracking-widest uppercase">
                  video
                </span>
              </div>
            )}

            {/* Fallback for additional apps */}
            {!['netmirror', 'netflix', 'youtube', 'hotstar', 'airtel', 'prime'].includes(app.id) && (
              <div className="flex flex-col items-center justify-center px-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs mb-0.5"
                  style={{ backgroundColor: app.accentColor || '#0284c7' }}
                >
                  {app.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-[10px] font-bold text-white truncate max-w-[80px]">
                  {app.name}
                </span>
              </div>
            )}
          </button>
        );
      })}

      {/* 6th Button: + More Apps */}
      {(() => {
        const isMoreFocused = isFocusedZone && focusedIndex === dockApps.length;
        return (
          <button
            onClick={onOpenMoreApps}
            aria-label="Open More Apps Drawer"
            className={`relative w-28 h-20 rounded-[28px] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group ${
              isMoreFocused
                ? 'ring-4 ring-cyan-400 shadow-[0_0_35px_rgba(56,189,248,0.9)] scale-110 z-20'
                : 'hover:scale-105 shadow-[0_8px_20px_rgba(0,0,0,0.5)]'
            }`}
            style={{
              background: 'linear-gradient(135deg, rgba(30,58,138,0.8) 0%, rgba(15,23,42,0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: isMoreFocused ? '2.5px solid #38bdf8' : '1.5px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '28px 48px 48px 28px',
              boxShadow: isMoreFocused 
                ? '0 0 35px rgba(56,189,248,0.95), inset 0 0 15px rgba(56,189,248,0.4)' 
                : '0 8px 24px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)',
            }}
          >
            <div className="absolute top-1 left-2 right-4 h-3 rounded-full bg-white/10 blur-[1px] pointer-events-none" />
            <Plus className="w-6 h-6 text-cyan-300 stroke-[2.5]" />
            <span className="text-[11px] font-bold text-white tracking-wide mt-0.5">
              More
            </span>
          </button>
        );
      })()}
    </div>
  );
};
