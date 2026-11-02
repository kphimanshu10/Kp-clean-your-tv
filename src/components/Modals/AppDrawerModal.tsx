import React, { useState } from 'react';
import { X, Search, Pin, PinOff, Play, RefreshCw } from 'lucide-react';
import { AppShortcut } from '../../types/launcher';
import { renderDefaultAppIcon } from '../BottomDock';

interface AppDrawerModalProps {
  allApps: AppShortcut[];
  onClose: () => void;
  onLaunchApp: (app: AppShortcut) => void;
  onToggleDockPin: (appId: string) => void;
  onRefreshInstalledApps?: () => void;
}

export const AppDrawerModal: React.FC<AppDrawerModalProps> = ({
  allApps,
  onClose,
  onLaunchApp,
  onToggleDockPin,
  onRefreshInstalledApps,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'alpha' | 'default'>('default');

  // Show only installed apps in the Apps section
  const installedApps = allApps.filter(app => app.isInstalled !== false);

  let filtered = installedApps.filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (sortBy === 'alpha') {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-8 select-none">
      <div className="relative w-full max-w-5xl h-[85vh] rounded-3xl bg-slate-900/95 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-7 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-black text-white tracking-tight">Installed Applications</h2>
            <span className="text-xs bg-slate-800 text-cyan-300 font-bold px-3 py-1 rounded-full border border-white/10">
              {filtered.length} Installed
            </span>
          </div>

          {/* Search bar */}
          <div className="flex items-center space-x-3 flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search installed TV apps..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onRefreshInstalledApps && (
              <button
                onClick={onRefreshInstalledApps}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            )}

            <button
              onClick={() => setSortBy(sortBy === 'alpha' ? 'default' : 'alpha')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                sortBy === 'alpha'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {sortBy === 'alpha' ? 'A-Z Sorted' : 'Sort: Default'}
            </button>

            <button
              onClick={onClose}
              aria-label="Close Applications Drawer"
              className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="flex-1 overflow-y-auto pt-5 pr-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filtered.map(app => (
              <div
                key={app.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-cyan-400/60 focus-within:border-cyan-400 transition-all flex flex-col justify-between group"
              >
                {/* Default App Icon & Details */}
                <div className="flex items-center space-x-3 mb-3">
                  {renderDefaultAppIcon(app, 'drawer')}
                  <div className="overflow-hidden flex-1">
                    <h3 className="text-sm font-bold text-white truncate">{app.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {app.packageName}
                    </p>
                  </div>
                </div>

                {/* Actions: Launch and Pin to Home Dock */}
                <div className="flex items-center space-x-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => onLaunchApp(app)}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 focus:ring-2 focus:ring-cyan-300 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Open</span>
                  </button>

                  <button
                    onClick={() => onToggleDockPin(app.id)}
                    title={app.inDock ? 'Remove from Dock' : 'Pin to Dock'}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      app.inDock
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 hover:bg-red-950 hover:text-red-400'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {app.inDock ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
