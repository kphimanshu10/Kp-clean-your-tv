import React from 'react';
import { X, Wifi, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';

interface WifiModalProps {
  onClose: () => void;
}

export const WifiModal: React.FC<WifiModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-8 select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.3)] p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/30 text-cyan-400 border border-cyan-400/30">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Network & Wi-Fi Status</h2>
              <p className="text-xs text-slate-400">Connected to Iconic_Home_5G</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Wi-Fi Info"
            className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Network Details */}
        <div className="py-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-white/5">
            <span className="text-slate-400">Network Name (SSID)</span>
            <span className="font-bold text-white">Iconic_Home_5G</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-white/5">
            <span className="text-slate-400">Signal Strength</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Excellent (-48 dBm)
            </span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-white/5">
            <span className="text-slate-400">IP Address</span>
            <span className="font-mono text-cyan-300">192.168.1.150</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-white/5">
            <span className="text-slate-400">Link Speed</span>
            <span className="font-bold text-white">300 Mbps (802.11ac)</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-white/5">
            <span className="text-slate-400">Internet Access</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Online & Verified
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};
