import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Image,
  Clock,
  Volume2,
  Shield,
  Download,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  FileCode,
  Check,
  Settings,
  Wifi,
  Tv,
  ExternalLink,
  Copy,
  Wrench,
  AlertTriangle,
  QrCode,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CloudDownload,
  ShieldCheck,
} from 'lucide-react';
import {
  LauncherSettings,
  DeviceDiagnostics,
  AppShortcut,
  QrUrlInputContextType,
} from '../../types/launcher';
import { generateAndroidStudioProjectZip } from '../../utils/androidProjectGenerator';
import { WALLPAPER_PRESETS } from '../../data/wallpapers';
import {
  FullCompatibilityReport,
  runFullTvCompatibilityTest,
} from '../../utils/compatibilityChecker';
import {
  DiagnosticIssueItem,
  runSystemErrorDiagnostics,
  executeSafeAutoFix,
} from '../../utils/errorDiagnosticSystem';
import {
  UpdateUiState,
  VersionManifest,
  INSTALLED_APP_VERSION,
  fetchLatestVersionManifest,
  compareVersions,
  computeBufferSha256Hex,
  formatBytes,
} from '../../utils/updateManager';
import { UniversalQrUrlModal } from './UniversalQrUrlModal';

interface SettingsModalProps {
  settings: LauncherSettings;
  diagnostics: DeviceDiagnostics;
  dockApps?: AppShortcut[];
  onReorderDockApp?: (appId: string, direction: 'left' | 'right') => void;
  onUpdateSettings: (newSettings: Partial<LauncherSettings>) => void;
  onOpenWallpaperStudio: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  diagnostics,
  dockApps = [],
  onReorderDockApp,
  onUpdateSettings,
  onOpenWallpaperStudio,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'appearance' | 'compatibility' | 'diagnostics' | 'updates' | 'export'
  >('appearance');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [systemStatusMsg, setSystemStatusMsg] = useState<string | null>(null);

  // 1. Advanced TV Compatibility Checker State
  const [compatReport, setCompatReport] = useState<FullCompatibilityReport | null>(null);
  const [runningCompatTest, setRunningCompatTest] = useState<boolean>(false);

  // 2. Automatic Error Detection & Repair State
  const [diagIssues, setDiagIssues] = useState<DiagnosticIssueItem[]>([]);
  const [runningDiagnostics, setRunningDiagnostics] = useState<boolean>(false);
  const [confirmFixId, setConfirmFixId] = useState<string | null>(null);

  // 3. KP TV Updates State
  const [updateState, setUpdateState] = useState<UpdateUiState>('idle');
  const [latestManifest, setLatestManifest] = useState<VersionManifest | null>(null);
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [downloadedBlobUrl, setDownloadedBlobUrl] = useState<string | null>(null);
  const [verifiedSha256, setVerifiedSha256] = useState<string>('');
  const [updateErrorMsg, setUpdateErrorMsg] = useState<string>('');
  const [showReleaseNotes, setShowReleaseNotes] = useState<boolean>(false);
  const [confirmInstallPrompt, setConfirmInstallPrompt] = useState<boolean>(false);

  // 4. Universal QR Modal for Backup / Restore & Remote Config
  const [qrConfig, setQrConfig] = useState<{
    open: boolean;
    contextType: QrUrlInputContextType;
    title: string;
    onApply: (url: string) => void;
  }>({
    open: false,
    contextType: 'backup-restore',
    title: 'Backup & Restore URL – QR Input',
    onApply: () => {},
  });

  const showNotice = (msg: string) => {
    setSystemStatusMsg(msg);
    setTimeout(() => setSystemStatusMsg(null), 4200);
  };

  // Run Compatibility Test
  const handleRunCompatibilityTest = useCallback(async () => {
    setRunningCompatTest(true);
    try {
      const report = await runFullTvCompatibilityTest();
      setCompatReport(report);
    } finally {
      setRunningCompatTest(false);
    }
  }, []);

  // Run Automatic Error Detection
  const handleRunErrorDiagnostics = useCallback(async () => {
    setRunningDiagnostics(true);
    try {
      const items = await runSystemErrorDiagnostics();
      setDiagIssues(items);
    } finally {
      setRunningDiagnostics(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'compatibility' && !compatReport) {
      handleRunCompatibilityTest();
    }
    if (activeTab === 'diagnostics' && diagIssues.length === 0) {
      handleRunErrorDiagnostics();
    }
  }, [
    activeTab,
    compatReport,
    diagIssues.length,
    handleRunCompatibilityTest,
    handleRunErrorDiagnostics,
  ]);

  // Export Compatibility Report
  const handleExportCompatibilityReport = () => {
    if (!compatReport) return;
    const blob = new Blob([JSON.stringify(compatReport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KP_TV_Compatibility_Report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice('Exported TV Compatibility Report JSON.');
  };

  // Copy Diagnostic Info
  const handleCopyCompatibilityInfo = async () => {
    if (!compatReport) return;
    const text = compatReport.items
      .map(i => `[${i.status}] ${i.title}: ${i.detectedValue}`)
      .join('\n');
    try {
      await navigator.clipboard?.writeText(text);
      showNotice('Copied diagnostic report to clipboard.');
    } catch {
      showNotice('Diagnostic summary prepared (use Export Report on TV WebView).');
    }
  };

  // Check for Updates
  const handleCheckForUpdates = async (customUrl?: string) => {
    setUpdateState('checking');
    setUpdateErrorMsg('');
    try {
      const manifest = await fetchLatestVersionManifest(customUrl);
      setLatestManifest(manifest);

      if (manifest.packageName !== INSTALLED_APP_VERSION.packageName) {
        setUpdateState('failed');
        setUpdateErrorMsg(
          `Package identity mismatch: Expected ${INSTALLED_APP_VERSION.packageName}, got ${manifest.packageName}.`
        );
        return;
      }

      const diff = compareVersions(
        INSTALLED_APP_VERSION.versionCode,
        manifest.versionCode
      );
      if (diff > 0) {
        setUpdateState('available');
      } else {
        setUpdateState('up-to-date');
      }
    } catch (err) {
      setUpdateState('failed');
      setUpdateErrorMsg(
        err instanceof Error ? err.message : 'Unable to check for updates.'
      );
    }
  };

  // Download Update & Verify SHA-256
  const handleDownloadUpdate = async () => {
    if (!latestManifest) return;
    setUpdateState('downloading');
    setUpdateProgress(5);
    setUpdateErrorMsg('');

    try {
      const response = await fetch(latestManifest.downloadUrl);
      if (!response.ok) {
        throw new Error(`Download server returned HTTP ${response.status}`);
      }

      const total =
        Number(response.headers.get('content-length')) ||
        latestManifest.fileSizeBytes ||
        5400000;

      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
            setUpdateProgress(Math.min(95, Math.round((received / total) * 100)));
          }
        }
      } else {
        const buf = await response.arrayBuffer();
        chunks.push(new Uint8Array(buf));
        received = buf.byteLength;
      }

      const fullArray = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        fullArray.set(chunk, offset);
        offset += chunk.length;
      }

      const computedHash = await computeBufferSha256Hex(fullArray.buffer);
      setVerifiedSha256(computedHash);

      if (
        latestManifest.sha256 &&
        computedHash &&
        computedHash.toLowerCase() !== latestManifest.sha256.toLowerCase()
      ) {
        setUpdateState('failed');
        setUpdateErrorMsg(
          'SHA-256 integrity check failed! Downloaded file does not match official signature.'
        );
        return;
      }

      const apkBlob = new Blob([fullArray], {
        type: 'application/vnd.android.package-archive',
      });
      if (downloadedBlobUrl) URL.revokeObjectURL(downloadedBlobUrl);
      const blobUrl = URL.createObjectURL(apkBlob);
      setDownloadedBlobUrl(blobUrl);
      setUpdateProgress(100);
      setUpdateState('downloaded');
    } catch (err) {
      setUpdateState('failed');
      setUpdateErrorMsg(
        err instanceof Error ? err.message : 'APK download interrupted.'
      );
    }
  };

  // Trigger Confirmed Installation
  const handleConfirmedInstallUpdate = () => {
    if (!latestManifest) return;
    setConfirmInstallPrompt(false);
    setUpdateState('installing');

    try {
      if (typeof window !== 'undefined' && window.AndroidTvBridge?.verifyAndInstallApkUrl) {
        const resJson = window.AndroidTvBridge.verifyAndInstallApkUrl(
          latestManifest.downloadUrl,
          latestManifest.sha256
        );
        const parsed = JSON.parse(resJson);
        if (parsed?.ok) {
          showNotice('Launched Android Package Installer. Confirm on TV screen to complete.');
          return;
        }
        if (parsed?.needPermission && window.AndroidTvBridge.openUnknownSourcesSettings) {
          window.AndroidTvBridge.openUnknownSourcesSettings();
          showNotice('Please grant "Install unknown apps" permission and tap Install Update again.');
          return;
        }
      }
    } catch {
      // Fallback to direct APK download trigger
    }

    const a = document.createElement('a');
    a.href = downloadedBlobUrl || latestManifest.downloadUrl;
    a.download = `kp-tv-launcher-v${latestManifest.versionName}.apk`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showNotice('APK installer package ready. Open the downloaded APK on your TV to install.');
  };

  const handleOpenDeviceSettings = () => {
    try {
      if (window.AndroidTvBridge?.openSystemSettings) {
        const opened = window.AndroidTvBridge.openSystemSettings();
        if (opened) return;
      }
    } catch {
      // ignore
    }
    showNotice('Opening Android Device Settings requires the installed KP TV APK on your TV.');
  };

  const handleOpenWifiSettings = () => {
    try {
      if (window.AndroidTvBridge?.openWifiSettings) {
        const opened = window.AndroidTvBridge.openWifiSettings();
        if (opened) return;
      }
    } catch {
      // ignore
    }
    showNotice('Opening Android Wi-Fi Settings requires the installed KP TV APK on your TV.');
  };

  const handleDownloadAndroidZip = async () => {
    try {
      setIsExporting(true);
      const blob = await generateAndroidStudioProjectZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'KP_TV_Smart_Launcher_Android_Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate zip', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportLauncherBackup = () => {
    const backupPayload = {
      exportedAt: new Date().toISOString(),
      settings,
      apps: localStorage.getItem('kptv_apps_v3'),
      playlists: localStorage.getItem('kptv_iptv_playlists_v3'),
      favorites: localStorage.getItem('kptv_iptv_favorites_v3'),
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'KP_TV_Backup_Configuration.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice('Exported KP TV Launcher configuration backup.');
  };

  const handleRestoreFromUrl = async (backupUrl: string) => {
    try {
      const res = await fetch(backupUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.settings && typeof data.settings === 'object') {
        onUpdateSettings(data.settings);
        showNotice('Restored KP TV configuration from remote URL!');
      } else {
        showNotice('Invalid backup JSON structure.');
      }
    } catch {
      showNotice('Could not fetch or parse remote backup configuration URL.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6 select-none">
      <div className="relative w-full max-w-5xl h-[88vh] rounded-3xl bg-slate-900/95 border border-white/15 shadow-[0_0_55px_rgba(0,0,0,0.85)] p-6 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-black text-white">KP TV Settings & Diagnostics</h2>
            <span className="text-xs bg-blue-900/60 text-cyan-300 font-bold px-3 py-1 rounded-full border border-blue-500/40">
              v{INSTALLED_APP_VERSION.versionName}
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleOpenDeviceSettings}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Open Device Settings</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Close Settings"
              className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {systemStatusMsg && (
          <div className="mt-3 px-4 py-2 rounded-xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center justify-between">
            <span>{systemStatusMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 py-3 border-b border-white/5">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            System & Customization
          </button>
          <button
            onClick={() => setActiveTab('compatibility')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'compatibility'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]'
                : 'bg-slate-800 text-cyan-300 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Check TV Compatibility</span>
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'diagnostics'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]'
                : 'bg-slate-800 text-emerald-300 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Auto Error Repair</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('updates');
              if (updateState === 'idle') handleCheckForUpdates();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'updates'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]'
                : 'bg-slate-800 text-amber-300 hover:text-white'
            }`}
          >
            <CloudDownload className="w-3.5 h-3.5" />
            <span>KP TV Updates</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            APK & Android Project
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 pr-1">
          {/* TAB 1: SYSTEM, SOURCE & CUSTOMIZATION */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              {/* Native Android TV Device Settings & Default Setopbox Source */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Settings className="w-4 h-4 text-cyan-400" />
                      <span>Android TV System Settings</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Open your TV’s native Android Settings for Display, Audio, Bluetooth, Apps, and Network.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5 mt-4">
                    <button
                      onClick={handleOpenDeviceSettings}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Device Settings</span>
                    </button>
                    <button
                      onClick={handleOpenWifiSettings}
                      className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Wifi className="w-4 h-4" />
                      <span>Wi-Fi Settings</span>
                    </button>
                  </div>
                </div>

                {/* Setopbox Default Input Source */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-fuchsia-500/30 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Tv className="w-4 h-4 text-fuchsia-400" />
                      <span>Setopbox Default Source</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Clicking Setopbox on the Home screen immediately opens this selected source:
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {(['hdmi1', 'hdmi2', 'av'] as const).map(port => {
                      const active = settings.defaultSetopboxPort === port;
                      return (
                        <button
                          key={port}
                          onClick={() => onUpdateSettings({ defaultSetopboxPort: port })}
                          className={`py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer ${
                            active
                              ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.5)] ring-2 ring-fuchsia-300'
                              : 'bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          {port === 'av' ? 'AV / RCA' : port.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Theme, Accent Color & Widget Visibility Customization */}
              <div className="p-4 rounded-2xl bg-slate-950/75 border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Theme, Accent Color & Home Screen Widgets</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Theme Mode */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">Launcher Theme</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          { id: 'dark-cinematic', label: 'Dark Cinematic' },
                          { id: 'midnight-oled', label: 'Midnight OLED' },
                          { id: 'deep-ocean', label: 'Deep Ocean' },
                        ] as const
                      ).map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onUpdateSettings({ themeMode: t.id })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                            (settings.themeMode || 'dark-cinematic') === t.id
                              ? 'bg-cyan-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">Accent Highlight</label>
                    <div className="flex items-center gap-2">
                      {(['cyan', 'blue', 'emerald', 'amber', 'rose'] as const).map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => onUpdateSettings({ accentColor: color })}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold capitalize cursor-pointer ${
                            (settings.accentColor || 'cyan') === color
                              ? 'ring-2 ring-white bg-slate-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Show / Hide Home Widgets */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">
                      Show / Hide Widgets
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            showWeatherWidget: settings.showWeatherWidget === false,
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                          settings.showWeatherWidget !== false
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Weather: {settings.showWeatherWidget !== false ? 'Shown' : 'Hidden'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            showQuickStatusBar: settings.showQuickStatusBar === false,
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                          settings.showQuickStatusBar !== false
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Status Bar: {settings.showQuickStatusBar !== false ? 'Shown' : 'Hidden'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dock App Arrangement (Reorder Left/Right) */}
                {dockApps.length > 0 && onReorderDockApp && (
                  <div className="pt-3 border-t border-white/10">
                    <label className="text-xs text-slate-400 block mb-2">
                      Dock App Arrangement (Reorder Pinned Dock Shortcuts)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {dockApps.map((app, idx) => (
                        <div
                          key={app.id}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 flex items-center space-x-2 text-xs font-bold text-white"
                        >
                          <span>{app.name}</span>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => onReorderDockApp(app.id, 'left')}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === dockApps.length - 1}
                              onClick={() => onReorderDockApp(app.id, 'right')}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Wallpaper Studio Launcher & Quick Picker */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Image className="w-4 h-4 text-cyan-400" />
                      <span>Smart TV Wallpaper</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select dynamic background or upload custom photos (auto-optimized for low RAM)
                    </p>
                  </div>

                  <button
                    onClick={onOpenWallpaperStudio}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
                  >
                    Open Wallpaper Studio & Upload
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {WALLPAPER_PRESETS.map(wp => {
                    const isSelected = settings.wallpaperPreset === wp.id;
                    return (
                      <button
                        key={wp.id}
                        onClick={() =>
                          onUpdateSettings({
                            wallpaperPreset: wp.id as LauncherSettings['wallpaperPreset'],
                          })
                        }
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 overflow-hidden relative ${
                          isSelected
                            ? 'border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                            : 'border-white/10 hover:border-white/30 hover:bg-slate-900'
                        }`}
                        style={{ background: wp.thumbnailGradient }}
                      >
                        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                        <div className="relative z-10 flex items-center justify-between w-full">
                          <span className="text-[10px] font-bold text-white/90 bg-black/40 px-2 py-0.5 rounded border border-white/20">
                            {wp.category}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-cyan-300 stroke-[3]" />}
                        </div>
                        <div className="relative z-10">
                          <span className="text-xs font-black text-white block truncate">
                            {wp.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clock, Date & Weather Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Clock & Date Format</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onUpdateSettings({ clockFormat: '12h' })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        settings.clockFormat === '12h'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      12-Hour
                    </button>
                    <button
                      onClick={() => onUpdateSettings({ clockFormat: '24h' })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        settings.clockFormat === '24h'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      24-Hour
                    </button>
                    <button
                      onClick={() => onUpdateSettings({ showDate: !settings.showDate })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        settings.showDate
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {settings.showDate ? 'Date Shown' : 'Date Hidden'}
                    </button>
                  </div>
                </div>

                {/* Weather Location */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2.5">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>Weather Location & Units</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.weatherLocation || ''}
                      onChange={e => onUpdateSettings({ weatherLocation: e.target.value })}
                      placeholder="New Delhi, Mumbai..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          temperatureUnit: settings.temperatureUnit === 'F' ? 'C' : 'F',
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-bold cursor-pointer"
                    >
                      °{settings.temperatureUnit || 'C'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sound Feedback + Backup & Remote Configuration via Universal QR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                      <span>Remote Navigation Audio</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Acoustic chimes when moving D-pad focus
                    </p>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ soundEffects: !settings.soundEffects })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                      settings.soundEffects
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {settings.soundEffects ? 'Enabled' : 'Muted'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-cyan-500/30 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">Backup & Remote Config</h3>
                    <p className="text-xs text-slate-400">
                      Export backup or import config URL via QR
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportLauncherBackup}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Export JSON
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setQrConfig({
                          open: true,
                          contextType: 'backup-restore',
                          title: 'Restore Backup or Remote Config via QR',
                          onApply: url => handleRestoreFromUrl(url),
                        })
                      }
                      className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR Restore</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADVANCED TV COMPATIBILITY CHECKER */}
          {activeTab === 'compatibility' && (
            <div className="space-y-4">
              {/* Top Action & Summary Bar */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-black text-white">
                      Advanced TV Compatibility Checker
                    </h3>
                    {compatReport && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          compatReport.overallStatus === 'Compatible'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {compatReport.overallStatus}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time verification of Android API, Display, CPU ABI, Decoders, HDR, Audio, Network, GMS, and Launcher Role.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRunCompatibilityTest}
                    disabled={runningCompatTest}
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${runningCompatTest ? 'animate-spin' : ''}`}
                    />
                    <span>{compatReport ? 'Test Again' : 'Run Compatibility Test'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCompatibilityReport}
                    disabled={!compatReport}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyCompatibilityInfo}
                    disabled={!compatReport}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Copy Diagnostic Information</span>
                  </button>
                </div>
              </div>

              {/* 16-Point Detailed Grid */}
              {compatReport && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {compatReport.items.map(item => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                            {item.category}
                          </span>
                          <h4 className="text-xs font-black text-white">{item.title}</h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold shrink-0 ${
                            item.status === 'Compatible'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : item.status === 'Partially Compatible'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : item.status === 'Not Compatible'
                              ? 'bg-red-950 text-red-300 border border-red-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-cyan-200 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-white/5">
                        {item.detectedValue}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-snug">
                        {item.explanation}
                      </p>

                      {item.recommendedFix && (
                        <div className="text-[11px] text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
                          <strong>Recommended Fix:</strong> {item.recommendedFix}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUTOMATIC ERROR DETECTION & SAFE REPAIR */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/40 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-emerald-400" />
                    <span>Automatic Error Detection & Safe Repair System</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Detects network issues, corrupted M3U playlists, decoder errors, and startup state. Never deletes user data silently.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunErrorDiagnostics}
                  disabled={runningDiagnostics}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${runningDiagnostics ? 'animate-spin' : ''}`}
                  />
                  <span>Scan System Now</span>
                </button>
              </div>

              <div className="space-y-3">
                {diagIssues.map(issue => (
                  <div
                    key={issue.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            issue.severity === 'healthy'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : issue.severity === 'warning'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : 'bg-red-950 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {issue.domain}
                        </span>
                        <h4 className="text-sm font-black text-white">{issue.title}</h4>
                      </div>
                      <p className="text-xs text-slate-300">
                        <strong>Cause:</strong> {issue.causeExplanation}
                      </p>
                      <p className="text-xs text-cyan-300">
                        <strong>Suggested Solution:</strong> {issue.suggestedSolution}
                      </p>
                    </div>

                    {issue.canAutoFix && (
                      <div className="shrink-0">
                        {issue.requiresConfirmation && confirmFixId === issue.id ? (
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                const res = executeSafeAutoFix(issue.id);
                                showNotice(res.message);
                                setConfirmFixId(null);
                                handleRunErrorDiagnostics();
                              }}
                              className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold cursor-pointer"
                            >
                              Confirm Safe Repair
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmFixId(null)}
                              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (issue.requiresConfirmation) {
                                setConfirmFixId(issue.id);
                              } else {
                                const res = executeSafeAutoFix(issue.id);
                                showNotice(res.message);
                                handleRunErrorDiagnostics();
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>{issue.autoFixLabel || 'Apply Safe Fix'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: KP TV UPDATES */}
          {activeTab === 'updates' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <CloudDownload className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-lg font-black text-white">KP TV Updates</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verified OTA APK updates with SHA-256 checksum validation and user confirmation.
                    </p>
                  </div>

                  {/* Current Version Badge */}
                  <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-white/10 text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Current Installed Version
                    </span>
                    <span className="text-sm font-black text-cyan-300">
                      v{INSTALLED_APP_VERSION.versionName} (Build {INSTALLED_APP_VERSION.versionCode})
                    </span>
                  </div>
                </div>

                {/* Required Action Buttons: Check for Updates, Download Update, Install Update, Release Notes, Current Version */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleCheckForUpdates()}
                    disabled={updateState === 'checking' || updateState === 'downloading'}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        updateState === 'checking' ? 'animate-spin' : ''
                      }`}
                    />
                    <span>Check for Updates</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadUpdate}
                    disabled={!latestManifest || updateState === 'downloading'}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Update</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmInstallPrompt(true)}
                    disabled={updateState !== 'downloaded' && updateState !== 'installing'}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Install Update</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReleaseNotes(!showReleaseNotes)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    {showReleaseNotes ? 'Hide Release Notes' : 'Release Notes'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      showNotice(
                        `Current Version: KP TV v${INSTALLED_APP_VERSION.versionName} (Build ${INSTALLED_APP_VERSION.versionCode}) • Package: ${INSTALLED_APP_VERSION.packageName}`
                      )
                    }
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold cursor-pointer"
                  >
                    Current Version
                  </button>
                </div>

                {/* 7 Update States Display */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10">
                  {updateState === 'checking' && (
                    <div className="flex items-center space-x-3 text-cyan-300 text-xs font-bold">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Checking for updates against version.json manifest...</span>
                    </div>
                  )}

                  {updateState === 'up-to-date' && latestManifest && (
                    <div className="flex items-center justify-between text-emerald-300 text-xs font-bold">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>
                          Already up to date! You are running the latest version (v
                          {latestManifest.versionName}, Build {latestManifest.versionCode}).
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Size: {formatBytes(latestManifest.fileSizeBytes)}
                      </span>
                    </div>
                  )}

                  {updateState === 'available' && latestManifest && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-amber-300 text-xs font-extrabold">
                        <span>
                          New version available: v{latestManifest.versionName} (Build{' '}
                          {latestManifest.versionCode})
                        </span>
                        <span>Size: {formatBytes(latestManifest.fileSizeBytes)}</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Click <strong>Download Update</strong> above to download and verify the signed APK.
                      </p>
                    </div>
                  )}

                  {updateState === 'downloading' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                        <span>Downloading APK package & computing SHA-256...</span>
                        <span>{updateProgress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                          style={{ width: `${updateProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {updateState === 'downloaded' && latestManifest && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center space-x-2 text-emerald-300 font-extrabold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>
                          Download completed & SHA-256 integrity verified! Click &quot;Install Update&quot; to proceed.
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 break-all">
                        Verified SHA-256: {verifiedSha256 || latestManifest.sha256}
                      </div>
                    </div>
                  )}

                  {updateState === 'installing' && (
                    <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>
                        Installation pending user confirmation in Android PackageInstaller...
                      </span>
                    </div>
                  )}

                  {updateState === 'failed' && (
                    <div className="flex items-center space-x-2 text-rose-300 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Update failed: {updateErrorMsg}</span>
                    </div>
                  )}
                </div>

                {/* User Confirmation Dialog before Installation */}
                {confirmInstallPrompt && latestManifest && (
                  <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-400/50 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-emerald-100">
                      <strong className="block text-sm text-white">
                        Confirm APK Update Installation
                      </strong>
                      Install <strong>{latestManifest.appName} v{latestManifest.versionName}</strong> ({formatBytes(latestManifest.fileSizeBytes)})? Your playlists and settings will be preserved.
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleConfirmedInstallUpdate}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
                      >
                        Confirm & Install Now
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmInstallPrompt(false)}
                        className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Release Notes Drawer */}
                {(showReleaseNotes || latestManifest) && latestManifest && (
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-extrabold text-cyan-300">
                      <span>Release Notes — v{latestManifest.versionName}</span>
                      <span>Released: {latestManifest.releaseDate}</span>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc pl-5">
                      {latestManifest.releaseNotes.map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ANDROID STUDIO PROJECT & APK EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/80 to-slate-950 border border-cyan-500/40">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-cyan-400" />
                      <span>Ready-to-Build Android Studio Project & Signed APK</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Download the compiled and signed Android TV APK (`kp-tv-launcher-debug.apk`) or the complete Gradle 8.4 + Kotlin Android Studio project ZIP.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <a
                      href="/kp-tv-launcher-debug.apk"
                      download="kp-tv-launcher-debug.apk"
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center space-x-2 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Built Debug APK</span>
                    </a>
                    <button
                      onClick={handleDownloadAndroidZip}
                      disabled={isExporting}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-[0_0_25px_rgba(6,182,212,0.6)] flex items-center space-x-2 transition-all cursor-pointer"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Compiling ZIP...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Download Android Studio ZIP</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {exportSuccess && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 text-xs font-bold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Downloaded KP_TV_Smart_Launcher_Android_Project.zip successfully!</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 font-mono text-xs text-slate-300 space-y-2">
                <div className="text-cyan-400 font-bold font-sans">
                  ADB Installation Commands (Android TV / Google TV / Android Box):
                </div>
                <div className="p-2.5 rounded-lg bg-black/60 text-emerald-400">
                  adb connect &lt;TV_IP&gt;:5555
                  <br />
                  adb install -r kp-tv-launcher-debug.apk
                  <br />
                  adb shell am start -n com.kptv.launcher/.MainActivity
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Universal QR Modal for Backup / Restore & Remote Config */}
        {qrConfig.open && (
          <UniversalQrUrlModal
            contextType={qrConfig.contextType}
            title={qrConfig.title}
            onApplyUrl={qrConfig.onApply}
            onClose={() => setQrConfig(prev => ({ ...prev, open: false }))}
          />
        )}
      </div>
    </div>
  );
};
