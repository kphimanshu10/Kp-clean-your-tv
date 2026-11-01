/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LiveTvCard } from './components/HeroCards/LiveTvCard';
import { SetopboxCard } from './components/HeroCards/SetopboxCard';
import { CricketScoreCard } from './components/HeroCards/CricketScoreCard';
import { BottomDock } from './components/BottomDock';
import { VirtualTvRemote } from './components/VirtualTvRemote';
import { LiveTvModal } from './components/Modals/LiveTvModal';
import { SetopboxModal } from './components/Modals/SetopboxModal';
import { CricketScoreModal } from './components/Modals/CricketScoreModal';
import { AppDrawerModal } from './components/Modals/AppDrawerModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { AboutModal } from './components/Modals/AboutModal';
import { WifiModal } from './components/Modals/WifiModal';
import { NotificationsModal } from './components/Modals/NotificationsModal';
import { AppLaunchModal } from './components/Modals/AppLaunchModal';
import { WallpaperModal } from './components/Modals/WallpaperModal';
import { DynamicWallpaper } from './components/DynamicWallpaper';
import { INITIAL_APPS, CRICKET_MATCHES } from './data/mockData';
import { WALLPAPER_PRESETS } from './data/wallpapers';
import { 
  AppShortcut, CricketMatch, LauncherSettings, 
  ScreenView, DeviceDiagnostics 
} from './types/launcher';
import { 
  SpatialNavState, handleSpatialDpad 
} from './utils/launcherLogic';
import { soundFx } from './utils/audio';
import { detectDeviceEnvironment } from './utils/hardwareDetection';

export default function App() {
  // Screen & Navigation States
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('home');
  const [navState, setNavState] = useState<SpatialNavState>({
    zone: 'cards',
    sidebarIndex: 0,
    cardIndex: 0, // 0: Live TV, 1: Setopbox, 2: Cricket
    dockIndex: 0,
    headerIndex: 0,
  });

  // App Data & Persistence
  const [apps, setApps] = useState<AppShortcut[]>(() => {
    try {
      const saved = localStorage.getItem('kptv_apps');
      return saved ? JSON.parse(saved) : INITIAL_APPS;
    } catch {
      return INITIAL_APPS;
    }
  });

  const [activeCricketMatch, setActiveCricketMatch] = useState<CricketMatch>(CRICKET_MATCHES[0]);

  // Launcher Settings
  const [settings, setSettings] = useState<LauncherSettings>(() => {
    try {
      const saved = localStorage.getItem('kptv_settings');
      return saved ? JSON.parse(saved) : {
        clockFormat: '12h',
        showDate: true,
        wallpaperPreset: 'reference',
        customWallpaperUrl: '',
        soundEffects: true,
        dpadSensitivity: 'normal',
        defaultSetopboxPort: 'hdmi1',
        simulateCloudTvOs: true,
        safeRecoveryConfirmed: true,
      };
    } catch {
      return {
        clockFormat: '12h',
        showDate: true,
        wallpaperPreset: 'reference',
        customWallpaperUrl: '',
        soundEffects: true,
        dpadSensitivity: 'normal',
        defaultSetopboxPort: 'hdmi1',
        simulateCloudTvOs: true,
        safeRecoveryConfirmed: true,
      };
    }
  });

  // Device Diagnostics
  const [diagnostics, setDiagnostics] = useState<DeviceDiagnostics>(() => detectDeviceEnvironment());

  // Active Modals
  const [activeModal, setActiveModal] = useState<
    'none' | 'livetv' | 'setopbox' | 'cricket' | 'apps' | 'settings' | 'about' | 'wifi' | 'notifications' | 'wallpaper'
  >('none');
  const [launchedApp, setLaunchedApp] = useState<AppShortcut | null>(null);

  // Sync Audio Settings
  useEffect(() => {
    soundFx.setEnabled(settings.soundEffects);
    try {
      localStorage.setItem('kptv_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Sync Apps Persistence
  useEffect(() => {
    try {
      localStorage.setItem('kptv_apps', JSON.stringify(apps));
    } catch {
      // ignore
    }
  }, [apps]);

  const dockApps = apps.filter(a => a.inDock).sort((a, b) => a.dockOrder - b.dockOrder);

  // Determine active wallpaper render mode
  const activePreset = WALLPAPER_PRESETS.find(p => p.id === settings.wallpaperPreset);
  const activeRenderMode = activePreset 
    ? activePreset.renderMode 
    : (settings.wallpaperPreset === 'custom' || settings.wallpaperPreset === 'custom-image' ? 'custom-image' : 'default-mountain');

  // D-Pad Remote Direction Handler
  const handleDpadMove = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (activeModal !== 'none' || launchedApp !== null) return;
    soundFx.playFocus();

    setNavState(prev => handleSpatialDpad(direction, prev, dockApps.length));
  }, [activeModal, launchedApp, dockApps.length]);

  // OK / Enter Action Handler
  const handleRemoteEnter = useCallback(() => {
    soundFx.playSelect();

    if (activeModal !== 'none') return;
    if (launchedApp !== null) {
      setLaunchedApp(null);
      return;
    }

    if (navState.zone === 'cards') {
      if (navState.cardIndex === 0) setActiveModal('livetv');
      else if (navState.cardIndex === 1) setActiveModal('setopbox');
      else if (navState.cardIndex === 2) setActiveModal('cricket');
    } else if (navState.zone === 'dock') {
      if (navState.dockIndex < dockApps.length) {
        setLaunchedApp(dockApps[navState.dockIndex]);
      } else {
        setActiveModal('apps');
      }
    } else if (navState.zone === 'sidebar') {
      const screens: ScreenView[] = ['home', 'apps', 'settings', 'about'];
      const targetScreen = screens[navState.sidebarIndex];
      setCurrentScreen(targetScreen);
      if (targetScreen === 'apps') setActiveModal('apps');
      if (targetScreen === 'settings') setActiveModal('settings');
      if (targetScreen === 'about') setActiveModal('about');
    } else if (navState.zone === 'header') {
      if (navState.headerIndex === 0) setActiveModal('wallpaper');
      else if (navState.headerIndex === 1) setActiveModal('wifi');
      else if (navState.headerIndex === 2) setActiveModal('settings');
      else if (navState.headerIndex === 3) setActiveModal('notifications');
    }
  }, [navState, activeModal, launchedApp, dockApps]);

  // Back Button Action Handler
  const handleRemoteBack = useCallback(() => {
    soundFx.playBack();
    if (launchedApp) {
      setLaunchedApp(null);
      return;
    }
    if (activeModal !== 'none') {
      setActiveModal('none');
      return;
    }
    // Return to main cards Home
    setCurrentScreen('home');
    setNavState(prev => ({ ...prev, zone: 'cards', cardIndex: 0 }));
  }, [launchedApp, activeModal]);

  // Home Button Action Handler
  const handleRemoteHome = useCallback(() => {
    soundFx.playSelect();
    setLaunchedApp(null);
    setActiveModal('none');
    setCurrentScreen('home');
    setNavState({
      zone: 'cards',
      sidebarIndex: 0,
      cardIndex: 0,
      dockIndex: 0,
      headerIndex: 0,
    });
  }, []);

  // Keyboard Event Listeners for Physical Remote / Keyboard Arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleDpadMove('UP');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleDpadMove('DOWN');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleDpadMove('LEFT');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleDpadMove('RIGHT');
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleRemoteEnter();
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          handleRemoteBack();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          handleRemoteHome();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDpadMove, handleRemoteEnter, handleRemoteBack, handleRemoteHome]);

  // Toggle Pin/Unpin from Home Dock
  const handleToggleDockPin = (appId: string) => {
    soundFx.playSelect();
    setApps(prev =>
      prev.map(app => {
        if (app.id === appId) {
          const nextInDock = !app.inDock;
          const maxOrder = Math.max(0, ...prev.filter(a => a.inDock).map(a => a.dockOrder));
          return {
            ...app,
            inDock: nextInDock,
            dockOrder: nextInDock ? maxOrder + 1 : 99,
          };
        }
        return app;
      })
    );
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between bg-[#030712] select-none">
      {/* High-Performance Hardware-Accelerated Dynamic Wallpaper */}
      <DynamicWallpaper
        renderMode={activeRenderMode}
        customImageUrl={settings.customWallpaperUrl}
      />

      {/* Top Header */}
      <Header
        clockFormat={settings.clockFormat}
        showDate={settings.showDate}
        focusedZone={navState.zone}
        headerIndex={navState.headerIndex}
        onSelectWallpaper={() => setActiveModal('wallpaper')}
        onSelectWifi={() => setActiveModal('wifi')}
        onSelectSettings={() => setActiveModal('settings')}
        onSelectNotifications={() => setActiveModal('notifications')}
      />

      {/* Main Body: Left Sidebar + 3 Hero Cards */}
      <div className="relative z-10 flex-1 flex items-center px-8 space-x-6 overflow-hidden">
        {/* Vertical Navigation Sidebar */}
        <Sidebar
          currentScreen={currentScreen}
          isFocusedZone={navState.zone === 'sidebar'}
          focusedIndex={navState.sidebarIndex}
          onSelectScreen={screen => {
            soundFx.playSelect();
            setCurrentScreen(screen);
            if (screen === 'apps') setActiveModal('apps');
            if (screen === 'settings') setActiveModal('settings');
            if (screen === 'about') setActiveModal('about');
          }}
        />

        {/* 3 Main Hero Cards in 16:9 TV landscape row */}
        <main className="flex-1 flex items-center space-x-6 py-2 overflow-hidden">
          {/* Card 1: Live TV */}
          <LiveTvCard
            isFocused={navState.zone === 'cards' && navState.cardIndex === 0}
            onSelect={() => {
              soundFx.playSelect();
              setActiveModal('livetv');
            }}
          />

          {/* Card 2: Setopbox (Correct spelling!) */}
          <SetopboxCard
            isFocused={navState.zone === 'cards' && navState.cardIndex === 1}
            onSelect={() => {
              soundFx.playSelect();
              setActiveModal('setopbox');
            }}
          />

          {/* Card 3: Live Cricket Score */}
          <CricketScoreCard
            match={activeCricketMatch}
            isFocused={navState.zone === 'cards' && navState.cardIndex === 2}
            onSelect={() => {
              soundFx.playSelect();
              setActiveModal('cricket');
            }}
          />
        </main>
      </div>

      {/* Bottom Application Dock */}
      <BottomDock
        dockApps={dockApps}
        focusedIndex={navState.dockIndex}
        isFocusedZone={navState.zone === 'dock'}
        onLaunchApp={app => {
          soundFx.playSelect();
          setLaunchedApp(app);
        }}
        onOpenMoreApps={() => {
          soundFx.playSelect();
          setActiveModal('apps');
        }}
      />

      {/* Virtual TV Remote HUD for testing on desktop / touch */}
      <VirtualTvRemote
        onDpad={handleDpadMove}
        onEnter={handleRemoteEnter}
        onBack={handleRemoteBack}
        onHome={handleRemoteHome}
        soundEnabled={settings.soundEffects}
        onToggleSound={() => setSettings(s => ({ ...s, soundEffects: !s.soundEffects }))}
      />

      {/* Modals & Screens */}
      {activeModal === 'livetv' && (
        <LiveTvModal onClose={() => setActiveModal('none')} />
      )}

      {activeModal === 'setopbox' && (
        <SetopboxModal
          defaultPort={settings.defaultSetopboxPort}
          onSaveDefaultPort={port => setSettings(s => ({ ...s, defaultSetopboxPort: port }))}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'cricket' && (
        <CricketScoreModal
          currentMatch={activeCricketMatch}
          onSelectMatch={m => setActiveCricketMatch(m)}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'apps' && (
        <AppDrawerModal
          allApps={apps}
          onClose={() => setActiveModal('none')}
          onLaunchApp={app => {
            setActiveModal('none');
            setLaunchedApp(app);
          }}
          onToggleDockPin={handleToggleDockPin}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          settings={settings}
          diagnostics={diagnostics}
          onUpdateSettings={newS => setSettings(s => ({ ...s, ...newS }))}
          onOpenWallpaperStudio={() => setActiveModal('wallpaper')}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'wallpaper' && (
        <WallpaperModal
          currentPresetId={settings.wallpaperPreset}
          customImageUrl={settings.customWallpaperUrl}
          onSelectPreset={presetId => setSettings(s => ({ ...s, wallpaperPreset: presetId }))}
          onSetCustomImage={dataUrl => setSettings(s => ({ ...s, wallpaperPreset: 'custom-image', customWallpaperUrl: dataUrl }))}
          onResetToDefault={() => setSettings(s => ({ ...s, wallpaperPreset: 'reference-mountain', customWallpaperUrl: '' }))}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'about' && (
        <AboutModal onClose={() => setActiveModal('none')} />
      )}

      {activeModal === 'wifi' && (
        <WifiModal onClose={() => setActiveModal('none')} />
      )}

      {activeModal === 'notifications' && (
        <NotificationsModal onClose={() => setActiveModal('none')} />
      )}

      {/* App Launch Confirmation Modal */}
      {launchedApp && (
        <AppLaunchModal
          app={launchedApp}
          onClose={() => setLaunchedApp(null)}
        />
      )}
    </div>
  );
}
