import React from 'react';
import { AppShortcut } from '../types/launcher';
import { Plus, Tv, Globe, Folder, PlayCircle, Music } from 'lucide-react';

interface BottomDockProps {
  dockApps: AppShortcut[];
  focusedIndex: number;
  isFocusedZone: boolean;
  onLaunchApp: (app: AppShortcut) => void;
  onOpenMoreApps: () => void;
}

export const renderDefaultAppIcon = (app: AppShortcut, size: 'dock' | 'drawer' = 'dock') => {
  const iconBoxClass = size === 'dock' ? 'w-9 h-9 rounded-xl' : 'w-12 h-12 rounded-2xl';

  if (app.customIcon) {
    return (
      <img
        src={app.customIcon}
        alt={app.name}
        className={`${iconBoxClass} object-contain bg-slate-900/90 p-1 shadow-md shrink-0 border border-white/15`}
      />
    );
  }

  switch (app.iconType) {
    case 'netmirror':
      return (
        <div
          className={`${iconBoxClass} bg-gradient-to-br from-blue-500 to-indigo-700 border border-white/40 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.5)] shrink-0`}
        >
          <span className="text-base font-black text-white">N</span>
        </div>
      );
    case 'hotstar':
      return (
        <div
          className={`${iconBoxClass} bg-gradient-to-br from-slate-900 to-blue-950 border border-yellow-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(250,204,21,0.4)] shrink-0`}
        >
          <span className="text-yellow-400 text-lg leading-none">★</span>
        </div>
      );
    case 'youtube':
      return (
        <div
          className={`${iconBoxClass} bg-[#FF0000] flex items-center justify-center shadow-[0_2px_10px_rgba(255,0,0,0.5)] shrink-0`}
        >
          <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[9px] border-l-white ml-0.5" />
        </div>
      );
    case 'airtel':
      return (
        <div
          className={`${iconBoxClass} bg-[#E11D48] flex items-center justify-center shadow-[0_0_10px_rgba(225,29,72,0.6)] shrink-0`}
        >
          <div className="w-4 h-4 rounded-full border-2 border-white" />
        </div>
      );
    case 'netflix':
      return (
        <div
          className={`${iconBoxClass} bg-black border border-red-600/50 flex items-center justify-center shadow-[0_0_10px_rgba(229,9,20,0.6)] shrink-0`}
        >
          <span className="text-xl font-black text-[#E50914] font-sans">N</span>
        </div>
      );
    case 'prime':
      return (
        <div
          className={`${iconBoxClass} bg-[#00A8E1] flex items-center justify-center shadow-[0_0_10px_rgba(0,168,225,0.5)] shrink-0`}
        >
          <span className="text-[10px] font-black text-white uppercase tracking-tighter">prime</span>
        </div>
      );
    case 'spotify':
      return (
        <div
          className={`${iconBoxClass} bg-[#1DB954] flex items-center justify-center shadow-md shrink-0`}
        >
          <Music className="w-5 h-5 text-black stroke-[2.5]" />
        </div>
      );
    case 'vlc':
    case 'mxplayer':
      return (
        <div
          className={`${iconBoxClass} flex items-center justify-center shadow-md shrink-0`}
          style={{ backgroundColor: app.accentColor || '#f97316' }}
        >
          <PlayCircle className="w-5 h-5 text-white stroke-[2.2]" />
        </div>
      );
    case 'browser':
      return (
        <div
          className={`${iconBoxClass} bg-indigo-600 flex items-center justify-center shadow-md shrink-0`}
        >
          <Globe className="w-5 h-5 text-white" />
        </div>
      );
    case 'files':
      return (
        <div
          className={`${iconBoxClass} bg-emerald-600 flex items-center justify-center shadow-md shrink-0`}
        >
          <Folder className="w-5 h-5 text-white" />
        </div>
      );
    default:
      return (
        <div
          className={`${iconBoxClass} flex items-center justify-center text-white font-black shadow-md shrink-0 border border-white/15`}
          style={{ backgroundColor: app.accentColor || '#0284c7' }}
        >
          <Tv className="w-5 h-5 text-white" />
        </div>
      );
  }
};

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
            className={`relative w-32 h-20 px-2.5 rounded-[28px] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group ${
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
                  : 'linear-gradient(135deg, rgba(30,41,59,0.85) 0%, rgba(15,23,42,0.95) 100%)',
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

            {/* Default App Icon (Native PackageManager Icon or Default Launcher Icon) */}
            {renderDefaultAppIcon(app, 'dock')}

            {/* App Name Label as in Last Build Launcher */}
            <span className="text-[11px] font-extrabold text-white tracking-wide mt-1 truncate max-w-[104px] drop-shadow">
              {app.name}
            </span>
          </button>
        );
      })}

      {/* + More Apps Button */}
      {(() => {
        const isMoreFocused = isFocusedZone && focusedIndex === dockApps.length;
        return (
          <button
            onClick={onOpenMoreApps}
            aria-label="Open More Apps Drawer"
            className={`relative w-32 h-20 px-2.5 rounded-[28px] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group ${
              isMoreFocused
                ? 'ring-4 ring-cyan-400 shadow-[0_0_35px_rgba(56,189,248,0.9)] scale-110 z-20'
                : 'hover:scale-105 shadow-[0_8px_20px_rgba(0,0,0,0.5)]'
            }`}
            style={{
              background: 'linear-gradient(135deg, rgba(30,58,138,0.85) 0%, rgba(15,23,42,0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: isMoreFocused ? '2.5px solid #38bdf8' : '1.5px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '28px 48px 48px 28px',
              boxShadow: isMoreFocused
                ? '0 0 35px rgba(56,189,248,0.95), inset 0 0 15px rgba(56,189,248,0.4)'
                : '0 8px 24px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)',
            }}
          >
            <div className="absolute top-1 left-2 right-4 h-3 rounded-full bg-white/10 blur-[1px] pointer-events-none" />
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Plus className="w-5 h-5 text-cyan-300 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-extrabold text-white tracking-wide mt-1">
              + More Apps
            </span>
          </button>
        );
      })()}
    </div>
  );
};
