import React, { useState } from 'react';
import { X, Tv, CheckCircle2, ExternalLink, Info } from 'lucide-react';

interface SetopboxModalProps {
  onClose: () => void;
  defaultPort: 'hdmi1' | 'hdmi2' | 'av';
  onSaveDefaultPort: (port: 'hdmi1' | 'hdmi2' | 'av') => void;
}

export const SetopboxModal: React.FC<SetopboxModalProps> = ({
  onClose,
  defaultPort,
  onSaveDefaultPort,
}) => {
  const [activePort, setActivePort] = useState<'hdmi1' | 'hdmi2' | 'av'>(defaultPort);
  const [switchAttemptResult, setSwitchAttemptResult] = useState<{
    supported: boolean;
    message: string;
  } | null>(null);

  const triggerPortSwitch = (port: 'hdmi1' | 'hdmi2' | 'av') => {
    setActivePort(port);
    onSaveDefaultPort(port);

    if (
      typeof window !== 'undefined' &&
      window.AndroidTvBridge &&
      typeof window.AndroidTvBridge.switchHdmiInput === 'function'
    ) {
      const switched = window.AndroidTvBridge.switchHdmiInput(port);
      if (switched) {
        setSwitchAttemptResult({
          supported: true,
          message: `Opened ${port.toUpperCase()} source on TV. Default Setopbox source saved as ${port.toUpperCase()}.`,
        });
        return;
      }
    }

    setSwitchAttemptResult({
      supported: false,
      message: `Saved ${port.toUpperCase()} as your default Setopbox input source. Clicking Setopbox on the Home screen will launch ${port.toUpperCase()} directly on your TV.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-8 select-none">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900/95 border border-fuchsia-500/40 shadow-[0_0_50px_rgba(217,70,239,0.3)] p-7 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-400/40">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Setopbox Source Selection</h2>
              <p className="text-xs text-slate-400">
                Select default source (HDMI 1, HDMI 2, or AV). Clicking Setopbox on Home opens this source directly.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Setopbox Modal"
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 focus:ring-2 focus:ring-cyan-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Ports Selector */}
        <div className="py-5">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
            Active Setopbox Source (Click to Select & Open)
          </h3>

          <div className="grid grid-cols-3 gap-4">
            {/* HDMI 1 */}
            <button
              onClick={() => triggerPortSwitch('hdmi1')}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                activePort === 'hdmi1'
                  ? 'bg-fuchsia-600/30 border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.4)] ring-2 ring-fuchsia-400'
                  : 'bg-slate-800/60 border-white/10 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-extrabold text-white">HDMI 1</span>
                {activePort === 'hdmi1' && <CheckCircle2 className="w-4 h-4 text-fuchsia-400" />}
              </div>
              <span className="text-xs text-fuchsia-200/90 font-medium block">
                Primary Set-top Box / DTH
              </span>
              <span className="text-[10px] text-slate-400 mt-2 block font-mono">
                1080p / 720p Digital HDMI
              </span>
            </button>

            {/* HDMI 2 */}
            <button
              onClick={() => triggerPortSwitch('hdmi2')}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                activePort === 'hdmi2'
                  ? 'bg-fuchsia-600/30 border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.4)] ring-2 ring-fuchsia-400'
                  : 'bg-slate-800/60 border-white/10 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-extrabold text-white">HDMI 2</span>
                {activePort === 'hdmi2' && <CheckCircle2 className="w-4 h-4 text-fuchsia-400" />}
              </div>
              <span className="text-xs text-slate-300 font-medium block">
                Secondary HDMI Port
              </span>
              <span className="text-[10px] text-slate-400 mt-2 block font-mono">
                HDMI ARC / External Box
              </span>
            </button>

            {/* AV Input */}
            <button
              onClick={() => triggerPortSwitch('av')}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                activePort === 'av'
                  ? 'bg-fuchsia-600/30 border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.4)] ring-2 ring-fuchsia-400'
                  : 'bg-slate-800/60 border-white/10 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-extrabold text-white">AV / RCA</span>
                {activePort === 'av' && <CheckCircle2 className="w-4 h-4 text-fuchsia-400" />}
              </div>
              <span className="text-xs text-slate-300 font-medium block">
                Composite Cable Input
              </span>
              <span className="text-[10px] text-slate-400 mt-2 block font-mono">
                Yellow / White / Red RCA
              </span>
            </button>
          </div>
        </div>

        {/* Status Message */}
        {switchAttemptResult && (
          <div
            className={`mb-4 p-3.5 rounded-xl border text-xs font-semibold flex items-start space-x-2.5 ${
              switchAttemptResult.supported
                ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-200'
                : 'bg-cyan-950/80 border-cyan-400/50 text-cyan-200'
            }`}
          >
            {switchAttemptResult.supported ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <span>{switchAttemptResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => triggerPortSwitch(activePort)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all flex items-center space-x-2 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open {activePort.toUpperCase()} Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
