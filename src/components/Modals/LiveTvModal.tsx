import React, { useState } from 'react';
import { X, Play, Tv, Volume2, ShieldCheck, Plus, Check } from 'lucide-react';
import { LIVE_CHANNELS } from '../../data/mockData';
import { LiveChannel } from '../../types/launcher';

interface LiveTvModalProps {
  onClose: () => void;
}

export const LiveTvModal: React.FC<LiveTvModalProps> = ({ onClose }) => {
  const [channels, setChannels] = useState<LiveChannel[]>(LIVE_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<LiveChannel>(LIVE_CHANNELS[0]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const categories = ['All', 'Sports', 'News', 'Entertainment'];

  const filteredChannels = activeCategory === 'All'
    ? channels
    : channels.filter(c => c.category === activeCategory);

  const handleAddCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customName.trim()) return;

    const newChan: LiveChannel = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: 'Entertainment',
      streamUrl: customUrl.trim(),
      resolution: '1080p',
      isHd: true,
      currentProgram: 'Custom IPTV User Stream',
    };

    setChannels([newChan, ...channels]);
    setSelectedChannel(newChan);
    setCustomUrl('');
    setCustomName('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-8 select-none">
      <div className="relative w-full max-w-5xl h-[85vh] rounded-3xl bg-slate-900/95 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.3)] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-600/30 text-cyan-400 border border-cyan-400/40">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">KP TV – Live TV Channels</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified & Legitimate IPTV Streams (No Pirated Streams)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Live TV Modal"
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout: Video Player + Channel List */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Video Player */}
          <div className="flex-[1.6] bg-black p-5 flex flex-col justify-between border-r border-white/10">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
              <video
                key={selectedChannel.streamUrl}
                src={selectedChannel.streamUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
              {/* On-Screen Channel Watermark */}
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-xs font-bold text-white flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>{selectedChannel.name}</span>
                <span className="text-[10px] bg-cyan-600 px-1.5 rounded font-mono">
                  {selectedChannel.resolution}
                </span>
              </div>
            </div>

            {/* Currently Playing Information */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-800/60 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedChannel.name}</h3>
                  <p className="text-sm text-cyan-300">{selectedChannel.currentProgram}</p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-750 px-3 py-1.5 rounded-xl border border-white/10">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Stereo TV Audio (PCM)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Channel List & Category Filters */}
          <div className="flex-1 p-5 flex flex-col overflow-hidden bg-slate-900/60">
            {/* Category tabs */}
            <div className="flex space-x-2 pb-3 overflow-x-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Add Custom IPTV Button */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full mb-3 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-slate-800/80 border border-dashed border-cyan-500/40 text-cyan-300 hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Cancel Stream' : 'Add Custom IPTV M3U / MP4 Stream'}</span>
            </button>

            {/* Custom Stream Input Form */}
            {showAddForm && (
              <form onSubmit={handleAddCustomStream} className="mb-4 p-3 rounded-xl bg-slate-950 border border-cyan-500/30 flex flex-col space-y-2">
                <input
                  type="text"
                  placeholder="Channel Name (e.g. My Cable HD)"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs border border-slate-700 focus:outline-none focus:border-cyan-400"
                  required
                />
                <input
                  type="url"
                  placeholder="Stream URL (.m3u8, .mp4, or http://)"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs border border-slate-700 focus:outline-none focus:border-cyan-400"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Channel</span>
                </button>
              </form>
            )}

            {/* Channel List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredChannels.map(channel => {
                const isSelected = selectedChannel.id === channel.id;

                return (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel)}
                    className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/40 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-800/40 border border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}>
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{channel.name}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[160px]">{channel.currentProgram}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-cyan-300">
                      {channel.resolution}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
