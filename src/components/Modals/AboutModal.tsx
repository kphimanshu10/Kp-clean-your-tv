import React from 'react';
import { X, Tv, ShieldCheck, Terminal, Heart, Sparkles, CheckCircle } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-8 select-none">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900/95 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.3)] p-7 flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.6)]">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">KP TV – Smart TV Launcher</h2>
              <p className="text-xs text-cyan-300 font-semibold">
                Version 1.0.0 Pro • Pure Ads-Free Experience
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close About Modal"
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs text-slate-300">
          {/* Target TV Details */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Target Device Engineering</span>
            </h3>
            <p className="mb-2">
              Engineered specifically for the <strong className="text-white">Iconic 32-inch Smart TV</strong> running <strong className="text-cyan-300">Cloud TV OS / AOSP</strong>. Features ultra-low RAM footprint (&lt; 65MB), zero promotional bloatware, hardware remote D-pad acceleration, and full 16:9 1080p/720p scaling.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-slate-900 border border-white/5">
                <span className="text-slate-400 block">Package ID:</span>
                <span className="text-cyan-300">com.kptv.launcher</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-white/5">
                <span className="text-slate-400 block">SDK Support:</span>
                <span className="text-cyan-300">Android 5.0 (API 21) to 14 (API 34)</span>
              </div>
            </div>
          </div>

          {/* 100% Ads-Free Policy */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
            <h3 className="text-sm font-bold text-emerald-300 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Ads-Free & Privacy-Preserving</span>
            </h3>
            <p className="text-emerald-100/90 leading-relaxed">
              KP TV never injects banner advertisements, promotional app recommendations, sponsored videos, or tracking SDKs. Your TV home screen remains fast, clean, and distraction-free.
            </p>
          </div>

          {/* Stock Launcher Safety & Rollback Guide */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-500/30">
            <h3 className="text-sm font-bold text-amber-300 mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>Safe Rollback & Recovery Guide</span>
            </h3>
            <p className="text-slate-300 mb-2">
              KP TV is non-destructive. If you ever need to restore your Iconic TV's original stock launcher, run these commands via ADB from your Windows PC:
            </p>
            <div className="p-3 rounded-xl bg-black/80 font-mono text-emerald-400 text-[11px] space-y-1">
              <div># Restore factory Cloud TV launcher:</div>
              <div>adb shell cmd package set-home-activity com.cloudtv.launcher/.MainActivity</div>
              <div># Or cleanly uninstall KP TV without affecting firmware:</div>
              <div>adb uninstall com.kptv.launcher</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1">
            <span>Built with precision for Smart TV enthusiasts</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline ml-1" />
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
