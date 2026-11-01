import React, { useState } from 'react';
import { X, Search, Pin, PinOff, Play, Plus, Trash2, Check } from 'lucide-react';
import { AppShortcut } from '../../types/launcher';

interface AppDrawerModalProps {
  allApps: AppShortcut[];
  onClose: () => void;
  onLaunchApp: (app: AppShortcut) => void;
  onToggleDockPin: (appId: string) => void;
  onAddCustomShortcut: (shortcut: Omit<AppShortcut, 'id' | 'dockOrder'>) => void;
  onRemoveShortcut: (appId: string) => void;
}

export const AppDrawerModal: React.FC<AppDrawerModalProps> = ({
  allApps,
  onClose,
  onLaunchApp,
  onToggleDockPin,
  onAddCustomShortcut,
  onRemoveShortcut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'alpha' | 'default'>('default');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newPackageName, setNewPackageName] = useState('');
  const [newCategory, setNewCategory] = useState<AppShortcut['category']>('streaming');
  const [pinOnCreate, setPinOnCreate] = useState(true);

  const categories = [
    { id: 'all', label: 'All Applications' },
    { id: 'streaming', label: 'Streaming' },
    { id: 'media', label: 'Video & Audio' },
    { id: 'music', label: 'Music' },
    { id: 'utility', label: 'Tools & System' },
  ];

  let filtered = allApps.filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  if (sortBy === 'alpha') {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }

  const handleCreateShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim() || !newPackageName.trim()) return;

    onAddCustomShortcut({
      name: newAppName.trim(),
      packageName: newPackageName.trim(),
      iconType: 'custom',
      category: newCategory,
      inDock: pinOnCreate,
      isPreinstalled: false,
      isTrusted: true,
      isInstalled: true,
      accentColor: '#0284c7',
    });

    setNewAppName('');
    setNewPackageName('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-8 select-none">
      <div className="relative w-full max-w-5xl h-[85vh] rounded-3xl bg-slate-900/95 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-7 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-black text-white tracking-tight">Applications Drawer</h2>
            <span className="text-xs bg-slate-800 text-cyan-300 font-bold px-3 py-1 rounded-full border border-white/10">
              {filtered.length} Apps Available
            </span>
          </div>

          {/* Search bar */}
          <div className="flex items-center space-x-3 flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search TV applications or package ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Cancel' : 'Add App Shortcut'}</span>
            </button>

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

        {/* Add Custom App Shortcut Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateShortcut}
            className="my-3 p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 grid grid-cols-1 md:grid-cols-4 gap-3 items-end text-xs"
          >
            <div>
              <label className="text-slate-400 block mb-1">Application Label</label>
              <input
                type="text"
                placeholder="e.g. Kodi TV"
                value={newAppName}
                onChange={e => setNewAppName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                required
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Android Package Name</label>
              <input
                type="text"
                placeholder="e.g. org.xbmc.kodi"
                value={newPackageName}
                onChange={e => setNewPackageName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Category</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as AppShortcut['category'])}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              >
                <option value="streaming">Streaming</option>
                <option value="media">Video & Audio</option>
                <option value="music">Music</option>
                <option value="utility">Utility</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer mr-2">
                <input
                  type="checkbox"
                  checked={pinOnCreate}
                  onChange={e => setPinOnCreate(e.target.checked)}
                />
                <span>Pin to Dock</span>
              </label>
              <button
                type="submit"
                className="flex-1 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </form>
        )}

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
                  <div className="overflow-hidden flex-1">
                    <h3 className="text-sm font-bold text-white truncate">{app.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {app.packageName}
                    </p>
                    <span className="inline-block mt-1 text-[9px] uppercase font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/40">
                      {app.category}
                    </span>
                  </div>
                </div>

                {/* Actions: Launch, Pin to Home Dock, and Remove Custom Shortcut */}
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

                  {!app.isPreinstalled && (
                    <button
                      onClick={() => onRemoveShortcut(app.id)}
                      title="Remove custom shortcut"
                      className="p-2 rounded-xl bg-slate-800 text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
