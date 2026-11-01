import React from 'react';
import { Home, LayoutGrid, Settings, Info } from 'lucide-react';
import { ScreenView } from '../types/launcher';

interface SidebarProps {
  currentScreen: ScreenView;
  isFocusedZone: boolean;
  focusedIndex: number;
  onSelectScreen: (screen: ScreenView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  isFocusedZone,
  focusedIndex,
  onSelectScreen,
}) => {
  const items: { id: ScreenView; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'apps', label: 'Apps', icon: LayoutGrid },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <aside className="w-24 flex flex-col items-center py-6 select-none z-10 shrink-0">
      {/* Translucent Frosted Glass Capsule */}
      <div className="w-20 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/10 p-2 flex flex-col items-center space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          const isFocused = isFocusedZone && focusedIndex === index;

          return (
            <button
              key={item.id}
              onClick={() => onSelectScreen(item.id)}
              aria-label={`Navigate to ${item.label}`}
              className={`w-16 h-18 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 relative group cursor-pointer ${
                isFocused
                  ? 'bg-blue-600/90 text-white ring-4 ring-cyan-400 shadow-[0_0_25px_rgba(56,189,248,0.9)] scale-105 z-20'
                  : isActive
                  ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white border border-cyan-400/50 shadow-[0_0_20px_rgba(37,99,235,0.7)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {/* Neon Glow Aura when active */}
              {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-cyan-400/20 blur-md pointer-events-none" />
              )}

              <Icon
                className={`w-6 h-6 mb-1.5 transition-transform duration-200 ${
                  isActive || isFocused ? 'scale-110 text-white' : 'text-slate-400 group-hover:text-white'
                }`}
              />
              <span
                className={`text-[11px] font-semibold tracking-wide ${
                  isActive || isFocused ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
