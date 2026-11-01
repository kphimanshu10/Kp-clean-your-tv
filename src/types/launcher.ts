export type ScreenView = 'home' | 'apps' | 'settings' | 'about';

export type FocusArea = 
  | 'sidebar' 
  | 'card-livetv' 
  | 'card-setopbox' 
  | 'card-cricket' 
  | 'dock'
  | 'header-wifi'
  | 'header-settings'
  | 'header-notifications'
  | 'apps-grid'
  | 'modal';

export interface AppShortcut {
  id: string;
  name: string;
  packageName: string;
  activityName?: string;
  iconType: 'netmirror' | 'netflix' | 'youtube' | 'hotstar' | 'airtel' | 'more' | 'custom' | 'browser' | 'files' | 'vlc' | 'mxplayer' | 'spotify' | 'prime';
  customIcon?: string;
  category: 'streaming' | 'tv' | 'utility' | 'system' | 'music';
  inDock: boolean;
  dockOrder: number;
  isPreinstalled: boolean;
  accentColor: string;
}

export interface CricketMatch {
  id: string;
  title: string;
  series: string;
  matchType: string;
  isLive: boolean;
  team1: {
    name: string;
    code: string;
    score: string;
    overs: string;
    flag: string; // SVG or color code
  };
  team2: {
    name: string;
    code: string;
    score: string;
    overs: string;
    flag: string;
  };
  targetSummary: string;
  requiredRuns?: number;
  requiredBalls?: number;
  crr?: string;
  rrr?: string;
  lastUpdated: string;
}

export interface LiveChannel {
  id: string;
  name: string;
  category: 'Sports' | 'News' | 'Entertainment' | 'Movies' | 'Regional';
  streamUrl: string;
  logoUrl?: string;
  resolution: '1080p' | '720p' | '4K';
  isHd: boolean;
  currentProgram: string;
}

export interface LauncherSettings {
  clockFormat: '12h' | '24h';
  showDate: boolean;
  wallpaperPreset: string;
  customWallpaperUrl: string;
  soundEffects: boolean;
  dpadSensitivity: 'fast' | 'normal' | 'smooth';
  defaultSetopboxPort: 'hdmi1' | 'hdmi2' | 'av';
  simulateCloudTvOs: boolean;
  safeRecoveryConfirmed: boolean;
}

export interface DeviceDiagnostics {
  brand: string;
  model: string;
  screenSize: string;
  resolution: string;
  aspectRatio: string;
  pixelRatio: number;
  osType: string;
  androidSdkEstimate: number;
  cloudTvDetected: boolean;
  leanbackSupported: boolean;
  webGlRenderer: string;
  memoryEstimateGb: number;
  connectionType: string;
}
