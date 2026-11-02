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
  iconType:
    | 'netmirror'
    | 'netflix'
    | 'youtube'
    | 'hotstar'
    | 'airtel'
    | 'more'
    | 'custom'
    | 'browser'
    | 'files'
    | 'vlc'
    | 'mxplayer'
    | 'spotify'
    | 'prime';
  customIcon?: string;
  category: 'streaming' | 'tv' | 'utility' | 'system' | 'music' | 'media';
  inDock: boolean;
  dockOrder: number;
  isPreinstalled: boolean;
  isTrusted?: boolean;
  isInstalled?: boolean;
  accentColor: string;
  lastOpenedAt?: number;
}

export type CricketServiceStatus = 'unconfigured' | 'loading' | 'live' | 'error' | 'offline';

export interface CricketApiConfig {
  endpointUrl: string;
  apiKey: string;
}

export interface CricketMatch {
  id: string;
  title: string;
  series: string;
  matchType: string;
  isLive: boolean;
  matchStatusText?: string;
  team1: {
    name: string;
    code: string;
    score: string;
    overs: string;
    flag: string;
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
  groupTitle?: string;
  isFavorite?: boolean;
}

export interface LauncherSettings {
  clockFormat: '12h' | '24h';
  showDate: boolean;
  dateFormat?: 'short' | 'full' | 'numeric';
  wallpaperPreset: string;
  customWallpaperUrl: string;
  soundEffects: boolean;
  dpadSensitivity: 'fast' | 'normal' | 'smooth';
  defaultSetopboxPort: 'hdmi1' | 'hdmi2' | 'av';
  simulateCloudTvOs: boolean;
  safeRecoveryConfirmed: boolean;
  weatherLocation: string;
  temperatureUnit: 'C' | 'F';
  themeMode?: 'dark-cinematic' | 'midnight-oled' | 'deep-ocean';
  accentColor?: 'cyan' | 'blue' | 'emerald' | 'amber' | 'rose';
  showWeatherWidget?: boolean;
  showCricketWidget?: boolean;
  showQuickStatusBar?: boolean;
}

export interface WeatherData {
  locationName: string;
  temperature: number;
  unit: 'C' | 'F';
  conditionText: string;
  conditionCode: number;
  isDay: boolean;
  lastUpdated: string;
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

export interface AndroidInstalledApp {
  label: string;
  packageName: string;
  activityName?: string;
  isBanner?: boolean;
  iconDataUrl?: string;
}

export interface AndroidWifiStatus {
  connected: boolean;
  ssid: string;
  rssiDbm: number;
  signalQuality: string;
  linkSpeedMbps: number;
  ipAddress: string;
}

export type QrUrlInputContextType =
  | 'iptv-m3u'
  | 'online-video'
  | 'github-repo'
  | 'backup-restore'
  | 'remote-config';

export interface AndroidTvBridgeInterface {
  isNativeAndroid?: () => boolean;
  launchApp?: (packageName: string) => boolean;
  getInstalledApps?: () => string;
  switchHdmiInput?: (port: string) => boolean;
  fetchCricketMatches?: (endpointUrl: string, apiKey: string) => string;
  saveCricketConfig?: (endpointUrl: string, apiKey: string) => boolean;
  getCricketConfig?: () => string;
  getWifiStatus?: () => string;
  getDeviceDiagnostics?: () => string;
  getCompatibilityReportJson?: () => string;
  getStorageStatusJson?: () => string;
  openSystemSettings?: () => boolean;
  openWifiSettings?: () => boolean;
  getIptvQrUrl?: () => string;
  getLatestIptvUrl?: () => string;
  getQrSessionInfoJson?: (contextType: string) => string;
  stopQrSession?: () => boolean;
  getAppVersionInfoJson?: () => string;
  canRequestPackageInstalls?: () => boolean;
  openUnknownSourcesSettings?: () => boolean;
  verifyAndInstallApkUrl?: (apkUrl: string, expectedSha256: string) => string;
}

declare global {
  interface Window {
    AndroidTvBridge?: AndroidTvBridgeInterface;
  }
}
