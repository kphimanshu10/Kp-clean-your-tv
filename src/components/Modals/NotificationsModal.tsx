import React from 'react';
import { X, Bell, CheckCircle2, Tv, Trophy } from 'lucide-react';

interface NotificationsModalProps {
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose }) => {
  const notifications = [
    {
      id: 'n1',
      title: 'Setopbox HDMI 1 Ready',
      desc: 'Setopbox cable connection detected on HDMI 1 (1080p 60Hz).',
      time: '10 mins ago',
      icon: Tv,
      iconColor: 'text-fuchsia-400',
    },
    {
      id: 'n2',
      title: 'IND vs AUS Live Match Alert',
      desc: 'India needs 12 runs in 18 balls. Live tracking is active.',
      time: 'Just now',
      icon: Trophy,
      iconColor: 'text-amber-400',
    },
    {
      id: 'n3',
      title: 'KP TV Launcher Verified',
      desc: 'Cloud TV OS compatibility verified. Zero background advertisements.',
      time: '1 hour ago',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-8 select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/95 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.3)] p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">TV Notifications</h2>
              <p className="text-xs text-slate-400">3 New Alerts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Notifications"
            className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="py-3 space-y-2.5">
          {notifications.map(n => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className="p-3 rounded-2xl bg-slate-950 border border-white/5 flex items-start space-x-3"
              >
                <div className={`p-2 rounded-xl bg-slate-900 ${n.iconColor} shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white truncate">{n.title}</h3>
                    <span className="text-[10px] text-slate-500 shrink-0">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          Dismiss All
        </button>
      </div>
    </div>
  );
};
