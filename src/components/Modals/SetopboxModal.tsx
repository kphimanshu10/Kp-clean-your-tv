import React, { useState } from 'react';
import { X, Tv, CheckCircle2, ExternalLink } from 'lucide-react';

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
  const [statusText, setStatusText] = useState<string | null>(null);

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
        setStatusText(`Switched TV to ${port.toUpperCase()}`);
        onClose();
        return;
      }
    }

    setStatusText(`Default source set to ${port.toUpperCase()}`);
  };

  const ports: Array<{
    id: 'hdmi1' | 'hdmi2' | 'av';
    title: string;
    subtitle: string;
  }> = [
    { id: 'hdmi1', title: 'HDMI 1', subtitle: 'Set-top Box / DTH' },
    { id: 'hdmi2', title: 'HDMI 2', subtitle: 'HDMI 2 / ARC' },
    { id: 'av', title: 'AV / RCA', subtitle: 'Composite Input' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-6 select-none">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900/95 border border-fuchsia-500/40 shadow-[0_0_50px_rgba(217,70,239,0.3)] p-6 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-400/40">
              <Tv className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white">Setopbox Input Source</h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Setopbox Modal"
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 focus:ring-2 focus:ring-cyan-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 grid grid-cols-3 gap-3">
          {ports.map(port => (
            <button
              key={port.id}
              onClick={() => triggerPortSwitch(port.id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer ${
                activePort === port.id
                  ? 'bg-fuchsia-600/30 border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.4)]'
                  : 'bg-slate-800/60 border-white/10 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-extrabold text-white">{port.title}</span>
                {activePort === port.id && (
                  <CheckCircle2 className="w-4 h-4 text-fuchsia-400" />
                )}
              </div>
              <span className="text-xs text-slate-300 font-medium block">
                {port.subtitle}
              </span>
            </button>
          ))}
        </div>

        {statusText && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-fuchsia-950/60 border border-fuchsia-400/40 text-fuchsia-200 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-fuchsia-400 shrink-0" />
            <span>{statusText}</span>
          </div>
        )}

        <div className="flex justify-end space-x-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => triggerPortSwitch(activePort)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open {activePort.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
