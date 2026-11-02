import React, { useState } from 'react';
import { X, Tv, AlertTriangle, CheckCircle2, ExternalLink, Info } from 'lucide-react';

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

  const handleSelectPort = (port: 'hdmi1' | 'hdmi2' | 'av') => {
    setActivePort(port);
    onSaveDefaultPort(port);
    setSwitchAttemptResult(null);
  };

  const handleAttemptHardwareSwitch = () => {
    // Only attempt direct HDMI switching if a documented native TV bridge API is exposed
    if (
      typeof window !== 'undefined' &&
      window.AndroidTvBridge &&
      typeof window.AndroidTvBridge.switchHdmiInput === 'function'
    ) {
      const switched = window.AndroidTvBridge.switchHdmiInput(activePort);
      if (switched) {
        setSwitchAttemptResult({
          supported: true,
          message: `Switched TV input to ${activePort.toUpperCase()} via Android TV Input Framework.`,
        });
        return;
      }
    }

    // Never pretend that the input was switched when unsupported
    setSwitchAttemptResult({
      supported: false,
      message: `Direct HDMI input switching to ${activePort.toUpperCase()} is not exposed by the current OS/browser runtime. Please press the "SOURCE" or "INPUT" button on your physical Iconic TV remote and select ${activePort.toUpperCase()}.`,
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
              <h2 className="text-xl font-extrabold text-white">Setopbox Input Hub</h2>
              <p className="text-xs text-slate-400">
                Preferred HDMI / AV Source Preference & Manual Remote Instructions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Setopbox Modal"
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Ports Selector */}
        <div className="py-5">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
            Select Preferred Setopbox Input Port
          </h3>

          <div className="grid grid-cols-3 gap-4">
            {/* HDMI 1 */}
            <button
              onClick={() => handleSelectPort('hdmi1')}
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
              onClick={() => handleSelectPort('hdmi2')}
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
              onClick={() => handleSelectPort('av')}
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

        {/* Honest Hardware Switch Attempt Status */}
        {switchAttemptResult && (
          <div
            className={`mb-4 p-3.5 rounded-xl border text-xs font-semibold flex items-start space-x-2.5 ${
              switchAttemptResult.supported
                ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-200'
                : 'bg-amber-950/80 border-amber-400/50 text-amber-200'
            }`}
          >
            {switchAttemptResult.supported ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <span>{switchAttemptResult.message}</span>
          </div>
        )}

        {/* Clear Manual Instructions */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex items-start space-x-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1.5">
            <span className="font-bold text-amber-300 block">
              How to Watch Setopbox on Iconic 32" Smart TV (Cloud TV OS):
            </span>
            <ol className="list-decimal pl-4 space-y-1 text-slate-300">
              <li>
                Ensure your DTH / Cable Setopbox is powered ON and connected to{' '}
                <strong className="text-fuchsia-300">{activePort.toUpperCase()}</strong>.
              </li>
              <li>
                On the native Android APK, KP TV checks if your TV firmware exposes the Android TV Input Framework (<code className="text-cyan-300">TvInputManager</code>).
              </li>
              <li>
                If your TV firmware locks direct HDMI switching to system apps only, press the{' '}
                <strong className="text-white">SOURCE</strong> or{' '}
                <strong className="text-white">INPUT</strong> button on your physical TV remote and select{' '}
                <strong className="text-fuchsia-300">{activePort.toUpperCase()}</strong>.
              </li>
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleAttemptHardwareSwitch}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all flex items-center space-x-2 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Attempt {activePort.toUpperCase()} Input Switch</span>
          </button>
        </div>
      </div>
    </div>
  );
};
