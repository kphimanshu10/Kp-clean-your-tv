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
import { INITIAL_APPS } from './data/mockData';
import { WALLPAPER_PRESETS } from './data/wallpapers';
import {
  AppShortcut,
  CricketApiConfig,
  CricketMatch,
  CricketServiceStatus,
  LauncherSettings,
  ScreenView,
  DeviceDiagnostics,
} from './types/launcher';
import { SpatialNavState, handleSpatialDpad } from './utils/launcherLogic';
import { soundFx } from './utils/audio';
import { detectDeviceEnvironment } from './utils/hardwareDetection';
import { fetchLiveCricketMatches } from './services/cricketService';

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
      const saved = localStorage.getItem('kptv_apps_v2');
      return saved ? JSON.parse(saved) : INITIAL_APPS;
    } catch {
      return INITIAL_APPS;
    }
  });

  // Live Cricket Score State (No hardcoded demo scores)
  const [cricketStatus, setCricketStatus] = useState<CricketServiceStatus>('unconfigured');
  const [cricketMatches, setCricketMatches] = useState<CricketMatch[]>([]);
  const [activeCricketMatch, setActiveCricketMatch] = useState<CricketMatch | null>(null);
  const [cricketError, setCricketError] = useState<string | null>(
    'Live score service not configured.'
  );
  const [cricketLastUpdated, setCricketLastUpdated] = useState<string | null>(null);

  // Launcher Settings
  const [settings, setSettings] = useState<LauncherSettings>(() => {
    const defaults: LauncherSettings = {
      clockFormat: '12h',
      showDate: true,
      wallpaperPreset: 'reference-mountain',
      customWallpaperUrl: '',
      soundEffects: true,
      dpadSensitivity: 'normal',
      defaultSetopboxPort: 'hdmi1',
      simulateCloudTvOs: true,
      safeRecoveryConfirmed: true,
      weatherLocation: 'New Delhi',
      temperatureUnit: 'C',
    };
    try {
      const saved = localStorage.getItem('kptv_settings');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  // Device Diagnostics
  const [diagnostics] = useState<DeviceDiagnostics>(() => detectDeviceEnvironment());

  // Active Modals
  const [activeModal, setActiveModal] = useState<
    | 'none'
    | 'livetv'
    | 'setopbox'
    | 'cricket'
    | 'apps'
    | 'settings'
    | 'about'
    | 'wifi'
    | 'notifications'
    | 'wallpaper'
  >('none');
  const [launchedApp, setLaunchedApp] = useState<AppShortcut | null>(null);

  // Refresh Live Cricket Score
  const refreshCricketScores = useCallback(async (configOverride?: CricketApiConfig) => {
    setCricketStatus('loading');
    const result = await fetchLiveCricketMatches(configOverride);
    setCricketStatus(result.status);
    setCricketMatches(result.matches);
    setCricketError(result.errorMessage);
    setCricketLastUpdated(result.lastUpdated);
    if (result.matches.length > 0) {
      setActiveCricketMatch(prev => {
        if (prev) {
          const found = result.matches.find(m => m.id === prev.id);
          if (found) return found;
        }
        return result.matches[0];
      });
    } else {
      setActiveCricketMatch(null);
    }
  }, []);

  useEffect(() => {
    refreshCricketScores();
    const handleOnline = () => refreshCricketScores();
    const handleOffline = () => {
      setCricketStatus('offline');
      setCricketError('TV is currently offline. Check Wi-Fi connection.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshCricketScores]);

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
      localStorage.setItem('kptv_apps_v2', JSON.stringify(apps));
    } catch {
      // ignore
    }
  }, [apps]);

  const dockApps = apps.filter(a => a.inDock).sort((a, b) => a.dockOrder - b.dockOrder);
  // Total focusable items in dock = pinned dock apps + 1 ("+ More" button)
  const totalDockButtons = dockApps.length + 1;

  // Determine active wallpaper render mode
  const activePreset = WALLPAPER_PRESETS.find(p => p.id === settings.wallpaperPreset);
  const activeRenderMode = activePreset
    ? activePreset.renderMode
    : settings.wallpaperPreset === 'custom' || settings.wallpaperPreset === 'custom-image'
    ? 'custom-image'
    : 'default-mountain';

  // D-Pad Remote Direction Handler
  const handleDpadMove = useCallback(
    (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
      if (activeModal !== 'none' || launchedApp !== null) return;
      soundFx.playFocus();

      setNavState(prev => handleSpatialDpad(direction, prev, totalDockButtons));
    },
    [activeModal, launchedApp, totalDockButtons]
  );

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
      setCurrentScreen('home');
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
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // Allow normal typing inside input fields, except Escape to close modal
      if (isInputFocused) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleRemoteBack();
        }
        return;
      }

      // Guard against accidental double activation on held Enter/Back
      if (e.repeat && (e.key === 'Enter' || e.key === 'Escape' || e.key === 'Backspace')) {
        return;
      }

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
          if (activeModal === 'none') {
            e.preventDefault();
            handleRemoteEnter();
          }
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          handleRemoteBack();
          break;
        case 'Home':
          e.preventDefault();
          handleRemoteHome();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, handleDpadMove, handleRemoteEnter, handleRemoteBack, handleRemoteHome]);

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

  // Add custom application shortcut
  const handleAddCustomShortcut = (newShortcut: Omit<AppShortcut, 'id' | 'dockOrder'>) => {
    soundFx.playSelect();
    setApps(prev => {
      const maxOrder = Math.max(0, ...prev.filter(a => a.inDock).map(a => a.dockOrder));
      const created: AppShortcut = {
        ...newShortcut,
        id: `custom-${Date.now()}`,
        dockOrder: newShortcut.inDock ? maxOrder + 1 : 99,
      };
      return [...prev, created];
    });
  };

  // Remove custom application shortcut (never removes preinstalled apps like Netflix/Prime Video)
  const handleRemoveShortcut = (appId: string) => {
    soundFx.playBack();
    setApps(prev => prev.filter(app => app.isPreinstalled || app.id !== appId));
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
        weatherLocation={settings.weatherLocation}
        temperatureUnit={settings.temperatureUnit}
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

          {/* Card 2: Setopbox */}
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
            serviceStatus={cricketStatus}
            errorMessage={cricketError}
            lastUpdated={cricketLastUpdated}
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
          if (
            typeof window !== 'undefined' &&
            window.AndroidTvBridge &&
            typeof window.AndroidTvBridge.launchApp === 'function'
          ) {
            const launched = window.AndroidTvBridge.launchApp(app.packageName);
            if (launched) return;
          }
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
      {activeModal === 'livetv' && <LiveTvModal onClose={() => setActiveModal('none')} />}

      {activeModal === 'setopbox' && (
        <SetopboxModal
          defaultPort={settings.defaultSetopboxPort}
          onSaveDefaultPort={port => setSettings(s => ({ ...s, defaultSetopboxPort: port }))}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'cricket' && (
        <CricketScoreModal
          matches={cricketMatches}
          currentMatch={activeCricketMatch}
          serviceStatus={cricketStatus}
          errorMessage={cricketError}
          lastUpdated={cricketLastUpdated}
          onSelectMatch={m => setActiveCricketMatch(m)}
          onRefresh={refreshCricketScores}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'apps' && (
        <AppDrawerModal
          allApps={apps}
          onClose={() => {
            setActiveModal('none');
            setCurrentScreen('home');
          }}
          onLaunchApp={app => {
            setActiveModal('none');
            setCurrentScreen('home');
            setLaunchedApp(app);
          }}
          onToggleDockPin={handleToggleDockPin}
          onAddCustomShortcut={handleAddCustomShortcut}
          onRemoveShortcut={handleRemoveShortcut}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          settings={settings}
          diagnostics={diagnostics}
          onUpdateSettings={newS => setSettings(s => ({ ...s, ...newS }))}
          onOpenWallpaperStudio={() => setActiveModal('wallpaper')}
          onClose={() => {
            setActiveModal('none');
            setCurrentScreen('home');
          }}
        />
      )}

      {activeModal === 'wallpaper' && (
        <WallpaperModal
          currentPresetId={settings.wallpaperPreset}
          customImageUrl={settings.customWallpaperUrl}
          onSelectPreset={presetId => setSettings(s => ({ ...s, wallpaperPreset: presetId }))}
          onSetCustomImage={dataUrl =>
            setSettings(s => ({
              ...s,
              wallpaperPreset: 'custom-image',
              customWallpaperUrl: dataUrl,
            }))
          }
          onResetToDefault={() =>
            setSettings(s => ({
              ...s,
              wallpaperPreset: 'reference-mountain',
              customWallpaperUrl: '',
            }))
          }
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'about' && (
        <AboutModal
          onClose={() => {
            setActiveModal('none');
            setCurrentScreen('home');
          }}
        />
      )}

      {activeModal === 'wifi' && <WifiModal onClose={() => setActiveModal('none')} />}

      {activeModal === 'notifications' && (
        <NotificationsModal onClose={() => setActiveModal('none')} />
      )}

      {/* App Launch Confirmation Modal */}
      {launchedApp && <AppLaunchModal app={launchedApp} onClose={() => setLaunchedApp(null)} />}
    </div>
  );
}
