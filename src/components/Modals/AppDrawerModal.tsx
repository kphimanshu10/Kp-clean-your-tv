import React, { useState } from 'react';
import { X, Search, Pin, PinOff, Play, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AppShortcut } from '../../types/launcher';

interface AppDrawerModalProps {
  allApps: AppShortcut[];
  onClose: () => void;
  onLaunchApp: (app: AppShortcut) => void;
  onToggleDockPin: (appId: string) => void;
}

export const AppDrawerModal: React.FC<AppDrawerModalProps> = ({
  allApps,
  onClose,
  onLaunchApp,
  onToggleDockPin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'alpha' | 'default'>('default');

  const categories = [
    { id: 'all', label: 'All Applications' },
    { id: 'streaming', label: 'Streaming' },
    { id: 'media', label: 'Video & Audio' },
    { id: 'utility', label: 'Tools & System' },
  ];

  let filtered = allApps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCat;
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
            <h2 className="text-2xl font-black text-white tracking-tight">Applications Drawer</h2>
            <span className="text-xs bg-slate-800 text-cyan-300 font-bold px-3 py-1 rounded-full border border-white/10">
              {filtered.length} Apps Installed
            </span>
          </div>

          {/* Search bar */}
          <div className="flex items-center space-x-3 flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search TV applications or packages..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSortBy(sortBy === 'alpha' ? 'default' : 'alpha')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                sortBy === 'alpha' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
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

        {/* Category Filter Pills */}
        <div className="flex space-x-2 py-3 border-b border-white/5">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Apps Grid */}
        <div className="flex-1 overflow-y-auto pt-4 pr-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filtered.map(app => (
              <div
                key={app.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-cyan-400/60 transition-all flex flex-col justify-between group"
              >
                {/* App Icon & Details */}
                <div className="flex items-start space-x-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shrink-0"
                    style={{ backgroundColor: app.accentColor }}
                  >
                    {app.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-sm font-bold text-white truncate">{app.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{app.packageName}</p>
                    <span className="inline-block mt-1 text-[9px] uppercase font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/40">
                      {app.category}
                    </span>
                  </div>
                </div>

                {/* Actions: Launch & Pin to Home Dock */}
                <div className="flex items-center space-x-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => onLaunchApp(app)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch</span>
                  </button>

                  <button
                    onClick={() => onToggleDockPin(app.id)}
                    title={app.inDock ? 'Remove from Home Dock' : 'Pin to Home Dock'}
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
