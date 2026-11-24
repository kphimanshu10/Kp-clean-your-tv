import React from 'react';
import { X, Tv, ShieldCheck, Sparkles, Download } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6 select-none">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900/95 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.3)] p-6 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.6)]">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">KP TV Launcher</h2>
              <p className="text-xs text-cyan-300 font-semibold">
                v2.7.0 (Build 7) • Smart TV Launcher
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close About"
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3 text-xs text-slate-300">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10">
            <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Launcher Specifications</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-slate-900 border border-white/5">
                <span className="text-slate-400 block">Package:</span>
                <span className="text-cyan-300">com.kptv.launcher</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-white/5">
                <span className="text-slate-400 block">Android SDK:</span>
                <span className="text-cyan-300">API 21 – API 34</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-emerald-100/90 font-medium">
              100% Ads-Free Android TV Launcher with Direct Setopbox Input, Link Player & D-Pad Navigation.
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <a
            href="/kp-tv-launcher-debug.apk?v=2.7.0-b7"
            download="kp-tv-launcher-v2.7.0-debug.apk"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download APK (v2.7.0)</span>
          </a>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
