import React from 'react';
import { X, Play, ShieldCheck, Terminal, Smartphone } from 'lucide-react';
import { AppShortcut } from '../../types/launcher';

interface AppLaunchModalProps {
  app: AppShortcut | null;
  onClose: () => void;
}

export const AppLaunchModal: React.FC<AppLaunchModalProps> = ({ app, onClose }) => {
  if (!app) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-8 select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.4)] p-6 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg"
              style={{ backgroundColor: app.accentColor }}
            >
              {app.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">{app.name}</h2>
              <p className="text-xs text-cyan-300 font-mono">{app.packageName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Launch Modal"
            className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details & Intent Execution Preview */}
        <div className="py-4 space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-1">
            <span className="text-slate-400 font-semibold block">Android TV Launch Intent:</span>
            <div className="font-mono text-emerald-400 text-[11px] break-all">
              Intent.ACTION_MAIN, Category: Intent.CATEGORY_LEANBACK_LAUNCHER
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-200 leading-relaxed">
            <span className="font-bold text-white block mb-0.5">Iconic Smart TV (Cloud TV OS) Execution:</span>
            On your physical TV, clicking this shortcut executes <code className="bg-black/50 px-1 py-0.5 rounded text-cyan-300">startActivity(packageManager.getLeanbackLaunchIntentForPackage("{app.packageName}"))</code>.
          </div>
        </div>

        {/* Action button */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Simulate TV Launch</span>
          </button>
        </div>
      </div>
    </div>
  );
};
