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
import { LiveTvModal } from './components/Modals/LiveTvModal';
import { OnlineLinkPlayerModal } from './components/Modals/OnlineLinkPlayerModal';
import { SetopboxModal } from './components/Modals/SetopboxModal';
import { CricketScoreModal } from './components/Modals/CricketScoreModal';
import { AppDrawerModal } from './components/Modals/AppDrawerModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { AboutModal } from './components/Modals/AboutModal';
import { WifiModal } from './components/Modals/WifiModal';
import { NotificationsModal } from './components/Modals/NotificationsModal';
import { WallpaperModal } from './components/Modals/WallpaperModal';
import { DynamicWallpaper } from './components/DynamicWallpaper';
import { INITIAL_APPS } from './data/mockData';
import { WALLPAPER_PRESETS } from './data/wallpapers';
import {
  AndroidInstalledApp,
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

const BASE_TV_WIDTH = 1280;
const BASE_TV_HEIGHT = 720;

export default function App() {
  // Responsive 16:9 TV Viewport Scaling State
  const [viewport, setViewport] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth || BASE_TV_WIDTH : BASE_TV_WIDTH,
    height: typeof window !== 'undefined' ? window.innerHeight || BASE_TV_HEIGHT : BASE_TV_HEIGHT,
  }));

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth || BASE_TV_WIDTH,
        height: window.innerHeight || BASE_TV_HEIGHT,
      });
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  // Screen & Navigation States
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('home');
  const [navState, setNavState] = useState<SpatialNavState>({
    zone: 'cards',
    sidebarIndex: 0,
    cardIndex: 0, // 0: Live TV, 1: Setopbox, 2: Cricket
    dockIndex: 0,
    headerIndex: 0,
  });

  // Brief non-intrusive TV status toast
  const [tvToast, setTvToast] = useState<string | null>(null);
  const showTvToast = useCallback((msg: string) => {
    setTvToast(msg);
  }, []);

  useEffect(() => {
    if (!tvToast) return;
    const t = setTimeout(() => setTvToast(null), 3200);
    return () => clearTimeout(t);
  }, [tvToast]);

  // App Data & Persistence
  const [apps, setApps] = useState<AppShortcut[]>(() => {
    try {
      const saved = localStorage.getItem('kptv_apps_v3');
      return saved ? JSON.parse(saved) : INITIAL_APPS;
    } catch {
      return INITIAL_APPS;
    }
  });

  // Sync Real Installed Android Apps when running on the TV APK:
  // - Dock Bar keeps default dock apps (NetMirror TV, JioHotstar, YouTube, Airtel) with default icon & name
  // - Apps Section (AppDrawerModal) displays ONLY genuinely installed apps on the device with their default app icons
  const syncInstalledAndroidApps = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.AndroidTvBridge?.getInstalledApps) {
        const rawJson = window.AndroidTvBridge.getInstalledApps();
        const nativeApps = JSON.parse(rawJson) as AndroidInstalledApp[];
        if (Array.isArray(nativeApps)) {
          setApps(prev => {
            const matchedPackages = new Set<string>();
            const defaultDockDefaults = prev.filter(a => a.inDock);

            const updatedDock = defaultDockDefaults.map(dockItem => {
              const match = nativeApps.find(
                na =>
                  na.packageName.toLowerCase() === dockItem.packageName.toLowerCase() ||
                  (dockItem.id === 'youtube' && na.packageName.toLowerCase().includes('youtube')) ||
                  (dockItem.id === 'hotstar' && na.packageName.toLowerCase().includes('hotstar')) ||
                  (dockItem.id === 'netmirror' &&
                    na.packageName.toLowerCase().includes('netmirror')) ||
                  (dockItem.id === 'airtel' && na.packageName.toLowerCase().includes('airtel'))
              );
              if (match) {
                matchedPackages.add(match.packageName.toLowerCase());
                return {
                  ...dockItem,
                  name: dockItem.name || match.label,
                  packageName: match.packageName,
                  customIcon: match.iconDataUrl || dockItem.customIcon,
                  isInstalled: true,
                };
              }
              return {
                ...dockItem,
                isInstalled: false,
              };
            });

            const installedDrawerApps: AppShortcut[] = nativeApps
              .filter(na => !matchedPackages.has(na.packageName.toLowerCase()))
              .map((na, idx) => ({
                id: `android-${na.packageName}`,
                name: na.label || na.packageName,
                packageName: na.packageName,
                activityName: na.activityName,
                iconType: 'custom' as const,
                customIcon: na.iconDataUrl,
                category: 'utility' as const,
                inDock: false,
                dockOrder: 100 + idx,
                isPreinstalled: true,
                isTrusted: true,
                isInstalled: true,
                accentColor: '#0284c7',
              }));

            return [...updatedDock, ...installedDrawerApps];
          });
        }
      }
    } catch {
      // ignore bridge parse errors
    }
  }, []);

  useEffect(() => {
    syncInstalledAndroidApps();
  }, [syncInstalledAndroidApps]);

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
      dateFormat: 'short',
      wallpaperPreset: 'reference-mountain',
      customWallpaperUrl: '',
      soundEffects: true,
      dpadSensitivity: 'normal',
      defaultSetopboxPort: 'hdmi1',
      simulateCloudTvOs: false,
      safeRecoveryConfirmed: true,
      weatherLocation: 'New Delhi',
      temperatureUnit: 'C',
      themeMode: 'dark-cinematic',
      accentColor: 'cyan',
      showWeatherWidget: true,
      showCricketWidget: true,
      showQuickStatusBar: true,
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
    | 'onlineplayer'
    | 'setopbox'
    | 'cricket'
    | 'apps'
    | 'settings'
    | 'about'
    | 'wifi'
    | 'notifications'
    | 'wallpaper'
  >('none');

  const [onlinePlayerInitialUrl, setOnlinePlayerInitialUrl] = useState<string>('');

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
      localStorage.setItem('kptv_apps_v3', JSON.stringify(apps));
    } catch {
      // ignore
    }
  }, [apps]);

  const dockApps = apps.filter(a => a.inDock).sort((a, b) => a.dockOrder - b.dockOrder);
  const totalDockButtons = dockApps.length + 1;

  // Determine active wallpaper render mode
  const activePreset = WALLPAPER_PRESETS.find(p => p.id === settings.wallpaperPreset);
  const activeRenderMode = activePreset
    ? activePreset.renderMode
    : settings.wallpaperPreset === 'custom' || settings.wallpaperPreset === 'custom-image'
    ? 'custom-image'
    : 'default-mountain';

  // Direct Application Launch via Native Android Bridge
  const triggerAppLaunch = useCallback(
    (app: AppShortcut) => {
      soundFx.playSelect();
      setApps(prev =>
        prev.map(item =>
          item.id === app.id ? { ...item, lastOpenedAt: Date.now() } : item
        )
      );

      if (
        typeof window !== 'undefined' &&
        window.AndroidTvBridge &&
        typeof window.AndroidTvBridge.launchApp === 'function'
      ) {
        const launched = window.AndroidTvBridge.launchApp(app.packageName);
        if (launched) return;
        showTvToast(`${app.name} is not installed on this TV.`);
        return;
      }
      showTvToast(`Launching ${app.name} (${app.packageName})...`);
    },
    [showTvToast]
  );

  // Direct Setopbox Action: Clicking Setopbox opens the already-selected source (HDMI 1, HDMI 2, or AV) immediately
  const handleSetopboxDirectLaunch = useCallback(() => {
    soundFx.playSelect();
    const activePort = settings.defaultSetopboxPort || 'hdmi1';
    if (
      typeof window !== 'undefined' &&
      window.AndroidTvBridge &&
      typeof window.AndroidTvBridge.switchHdmiInput === 'function'
    ) {
      const switched = window.AndroidTvBridge.switchHdmiInput(activePort);
      if (switched) {
        showTvToast(`Switched TV Source to ${activePort.toUpperCase()}`);
        return;
      }
    }
    setActiveModal('setopbox');
  }, [settings.defaultSetopboxPort, showTvToast]);

  // Reorder Dock Apps Left / Right
  const handleReorderDockApp = useCallback((appId: string, direction: 'left' | 'right') => {
    soundFx.playFocus();
    setApps(prev => {
      const currentDock = prev
        .filter(a => a.inDock)
        .sort((a, b) => a.dockOrder - b.dockOrder);
      const index = currentDock.findIndex(a => a.id === appId);
      if (index === -1) return prev;
      const swapIndex = direction === 'left' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= currentDock.length) return prev;

      const updatedOrder = [...currentDock];
      const temp = updatedOrder[index];
      updatedOrder[index] = updatedOrder[swapIndex];
      updatedOrder[swapIndex] = temp;

      const orderMap = new Map<string, number>();
      updatedOrder.forEach((item, idx) => orderMap.set(item.id, idx + 1));

      return prev.map(item =>
        orderMap.has(item.id)
          ? { ...item, dockOrder: orderMap.get(item.id)! }
          : item
      );
    });
  }, []);

  // D-Pad Remote Direction Handler
  const handleDpadMove = useCallback(
    (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
      soundFx.playFocus();

      // If a modal is open, move focus between interactive elements inside the modal
      if (activeModal !== 'none') {
        const focusables = Array.from(
          document.querySelectorAll<HTMLElement>(
            '.fixed.inset-0 button:not([disabled]), .fixed.inset-0 input:not([disabled]), .fixed.inset-0 select:not([disabled]), .fixed.inset-0 a[href], .fixed.inset-0 [tabindex="0"]'
          )
        );
        if (focusables.length === 0) return;
        const currentIdx = focusables.indexOf(document.activeElement as HTMLElement);
        let nextIdx = 0;
        if (direction === 'RIGHT' || direction === 'DOWN') {
          nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % focusables.length;
        } else {
          nextIdx = currentIdx <= 0 ? focusables.length - 1 : currentIdx - 1;
        }
        focusables[nextIdx]?.focus();
        return;
      }

      setNavState(prev => handleSpatialDpad(direction, prev, totalDockButtons));
    },
    [activeModal, totalDockButtons]
  );

  // OK / Enter Action Handler
  const handleRemoteEnter = useCallback(() => {
    soundFx.playSelect();

    if (activeModal !== 'none') {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && activeEl !== document.body) {
        activeEl.click();
      }
      return;
    }

    if (navState.zone === 'cards') {
      if (navState.cardIndex === 0) setActiveModal('livetv');
      else if (navState.cardIndex === 1) handleSetopboxDirectLaunch();
      else if (navState.cardIndex === 2) setActiveModal('cricket');
    } else if (navState.zone === 'dock') {
      if (navState.dockIndex < dockApps.length) {
        triggerAppLaunch(dockApps[navState.dockIndex]);
      } else {
        syncInstalledAndroidApps();
        setActiveModal('apps');
      }
    } else if (navState.zone === 'sidebar') {
      const screens: ScreenView[] = ['home', 'apps', 'settings', 'about'];
      const targetScreen = screens[navState.sidebarIndex];
      setCurrentScreen(targetScreen);
      if (targetScreen === 'apps') {
        syncInstalledAndroidApps();
        setActiveModal('apps');
      }
      if (targetScreen === 'settings') setActiveModal('settings');
      if (targetScreen === 'about') setActiveModal('about');
    } else if (navState.zone === 'header') {
      if (navState.headerIndex === 0) setActiveModal('wallpaper');
      else if (navState.headerIndex === 1) setActiveModal('wifi');
      else if (navState.headerIndex === 2) setActiveModal('settings');
      else if (navState.headerIndex === 3) setActiveModal('notifications');
    }
  }, [
    navState,
    activeModal,
    dockApps,
    triggerAppLaunch,
    handleSetopboxDirectLaunch,
    syncInstalledAndroidApps,
  ]);

  // Back Button Action Handler
  const handleRemoteBack = useCallback(() => {
    soundFx.playBack();
    if (activeModal !== 'none') {
      setActiveModal('none');
      setCurrentScreen('home');
      return;
    }
    setCurrentScreen('home');
    setNavState(prev => ({ ...prev, zone: 'cards', cardIndex: 0 }));
  }, [activeModal]);

  // Home Button Action Handler
  const handleRemoteHome = useCallback(() => {
    soundFx.playSelect();
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

  // Keyboard Event Listeners for Physical Remote Control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (isInputFocused) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleRemoteBack();
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          handleDpadMove(e.key === 'ArrowDown' ? 'DOWN' : 'UP');
        }
        return;
      }

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
          e.preventDefault();
          handleRemoteEnter();
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
        case 'ContextMenu':
        case 'F1':
          e.preventDefault();
          setActiveModal('settings');
          break;
        case 'MediaPlayPause':
          e.preventDefault();
          if (activeModal === 'none') {
            setActiveModal('livetv');
          }
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

  // Compute proportional 16:9 landscape TV stage dimensions
  const scale =
    viewport.width < viewport.height
      ? viewport.width / BASE_TV_WIDTH
      : Math.min(viewport.width / BASE_TV_WIDTH, viewport.height / BASE_TV_HEIGHT);
  const stageWidth = Math.max(BASE_TV_WIDTH, Math.round(viewport.width / scale));
  const stageHeight = Math.max(BASE_TV_HEIGHT, Math.round(viewport.height / scale));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030712] select-none">
      <div
        style={{
          width: `${stageWidth}px`,
          height: `${stageHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        className="relative overflow-hidden flex flex-col justify-between bg-[#030712] select-none"
      >
        {/* High-Performance Hardware-Accelerated Dynamic Wallpaper */}
        <DynamicWallpaper
          renderMode={activeRenderMode}
          customImageUrl={settings.customWallpaperUrl}
        />

        {/* Non-Intrusive TV Status Toast */}
        {tvToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-slate-950/95 border border-cyan-400/50 text-cyan-200 text-xs font-extrabold shadow-[0_0_25px_rgba(6,182,212,0.4)]">
            {tvToast}
          </div>
        )}

        {/* Top Header */}
        <Header
          clockFormat={settings.clockFormat}
          showDate={settings.showDate}
          dateFormat={settings.dateFormat}
          showWeatherWidget={settings.showWeatherWidget}
          showQuickStatusBar={settings.showQuickStatusBar}
          weatherLocation={settings.weatherLocation}
          temperatureUnit={settings.temperatureUnit}
          focusedZone={navState.zone}
          headerIndex={navState.headerIndex}
          onSelectWallpaper={() => setActiveModal('wallpaper')}
          onSelectWifi={() => setActiveModal('wifi')}
          onSelectSettings={() => setActiveModal('settings')}
          onSelectNotifications={() => setActiveModal('notifications')}
          onSelectOnlinePlayer={() => {
            soundFx.playSelect();
            setOnlinePlayerInitialUrl('');
            setActiveModal('onlineplayer');
          }}
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
              if (screen === 'apps') {
                syncInstalledAndroidApps();
                setActiveModal('apps');
              }
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

            {/* Card 2: Setopbox (Opens selected HDMI/AV source immediately on click/Enter) */}
            <SetopboxCard
              isFocused={navState.zone === 'cards' && navState.cardIndex === 1}
              selectedPort={settings.defaultSetopboxPort}
              onSelect={handleSetopboxDirectLaunch}
              onConfigureSource={() => {
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
          onLaunchApp={triggerAppLaunch}
          onOpenMoreApps={() => {
            soundFx.playSelect();
            syncInstalledAndroidApps();
            setActiveModal('apps');
          }}
        />

        {/* Modals & Screens */}
        {activeModal === 'livetv' && (
          <LiveTvModal
            onClose={() => setActiveModal('none')}
            onOpenOnlineLinkPlayer={initialUrl => {
              setOnlinePlayerInitialUrl(initialUrl || '');
              setActiveModal('onlineplayer');
            }}
          />
        )}

        {activeModal === 'onlineplayer' && (
          <OnlineLinkPlayerModal
            initialUrl={onlinePlayerInitialUrl}
            onClose={() => setActiveModal('none')}
          />
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
              triggerAppLaunch(app);
            }}
            onToggleDockPin={handleToggleDockPin}
            onRefreshInstalledApps={syncInstalledAndroidApps}
          />
        )}

        {activeModal === 'settings' && (
          <SettingsModal
            settings={settings}
            diagnostics={diagnostics}
            dockApps={dockApps}
            onReorderDockApp={handleReorderDockApp}
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
      </div>
    </div>
  );
}
