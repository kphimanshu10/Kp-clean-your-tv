import React, { useState } from 'react';
import {
  X,
  Image,
  Clock,
  Volume2,
  Shield,
  Download,
  Smartphone,
  Monitor,
  RefreshCw,
  CheckCircle2,
  FileCode,
  Check,
  Settings,
  Wifi,
  Tv,
  ExternalLink,
} from 'lucide-react';
import { LauncherSettings, DeviceDiagnostics } from '../../types/launcher';
import { generateAndroidStudioProjectZip } from '../../utils/androidProjectGenerator';
import { WALLPAPER_PRESETS } from '../../data/wallpapers';

interface SettingsModalProps {
  settings: LauncherSettings;
  diagnostics: DeviceDiagnostics;
  onUpdateSettings: (newSettings: Partial<LauncherSettings>) => void;
  onOpenWallpaperStudio: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  diagnostics,
  onUpdateSettings,
  onOpenWallpaperStudio,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'hardware' | 'export'>('appearance');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [systemStatusMsg, setSystemStatusMsg] = useState<string | null>(null);

  const handleOpenDeviceSettings = () => {
    try {
      if (window.AndroidTvBridge?.openSystemSettings) {
        const opened = window.AndroidTvBridge.openSystemSettings();
        if (opened) return;
      }
    } catch {
      // ignore
    }
    setSystemStatusMsg('Opening Android Device Settings requires the installed KP TV APK on your TV.');
    setTimeout(() => setSystemStatusMsg(null), 4000);
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
    setSystemStatusMsg('Opening Android Wi-Fi Settings requires the installed KP TV APK on your TV.');
    setTimeout(() => setSystemStatusMsg(null), 4000);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-8 select-none">
      <div className="relative w-full max-w-4xl h-[85vh] rounded-3xl bg-slate-900/95 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.85)] p-7 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-black text-white">KP TV Settings</h2>
            <span className="text-xs bg-blue-900/60 text-cyan-300 font-bold px-3 py-1 rounded-full border border-blue-500/40">
              Smart TV Launcher
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
          <div className="mt-3 px-4 py-2.5 rounded-xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center justify-between">
            <span>{systemStatusMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-3 py-3 border-b border-white/5">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            System, Source & Display
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hardware'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Hardware & TV OS Specs
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                : 'bg-slate-800 text-cyan-400 hover:text-white'
            }`}
          >
            Android Studio Project & APK Export
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 pr-1">
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
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 overflow-hidden relative ${
                          isSelected
                            ? 'border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-[1.02]'
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
                          <span className="text-xs font-black text-white block truncate">{wp.name}</span>
                          <span className="text-[10px] text-slate-200 block truncate">{wp.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clock & Date Settings */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Digital Clock & Time Preferences</span>
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Clock Time Format</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onUpdateSettings({ clockFormat: '12h' })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          settings.clockFormat === '12h'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        12-Hour (08:45 PM)
                      </button>
                      <button
                        onClick={() => onUpdateSettings({ clockFormat: '24h' })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          settings.clockFormat === '24h'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        24-Hour (20:45)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Date Display</label>
                    <button
                      onClick={() => onUpdateSettings({ showDate: !settings.showDate })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        settings.showDate
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {settings.showDate ? 'Date Visible (Sun, 02 Nov)' : 'Date Hidden'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Weather Location & Temperature Unit Preferences */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Header Weather Widget Location & Units</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">
                      Preferred City / Location
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={settings.weatherLocation || ''}
                        onChange={e => onUpdateSettings({ weatherLocation: e.target.value })}
                        placeholder="e.g. New Delhi, Mumbai, Bengaluru"
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['New Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad'].map(
                        city => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => onUpdateSettings({ weatherLocation: city })}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                              (settings.weatherLocation || 'New Delhi').toLowerCase() ===
                              city.toLowerCase()
                                ? 'bg-cyan-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {city}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">
                      Temperature Unit
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => onUpdateSettings({ temperatureUnit: 'C' })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          (settings.temperatureUnit || 'C') === 'C'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Celsius (°C)
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateSettings({ temperatureUnit: 'F' })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          settings.temperatureUnit === 'F'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Fahrenheit (°F)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sound Feedback */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>TV Remote Navigation Audio Feedback</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Synthesized acoustic chimes when moving D-pad focus and clicking Enter
                  </p>
                </div>
                <button
                  onClick={() => onUpdateSettings({ soundEffects: !settings.soundEffects })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settings.soundEffects ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.soundEffects ? 'Enabled' : 'Muted'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span>Target Device Detected Profile</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                    <span className="text-slate-400 block">Brand & Model</span>
                    <span className="font-bold text-white">{diagnostics.brand}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                    <span className="text-slate-400 block">Screen Size</span>
                    <span className="font-bold text-cyan-300">{diagnostics.screenSize}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                    <span className="text-slate-400 block">Target Resolution</span>
                    <span className="font-bold text-white">{diagnostics.resolution}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                    <span className="text-slate-400 block">Aspect Ratio</span>
                    <span className="font-bold text-emerald-400">{diagnostics.aspectRatio}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                    <span className="text-slate-400 block">Operating System</span>
                    <span className="font-bold text-amber-300">{diagnostics.osType}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                    <span className="text-slate-400 block">Est. RAM Allocation</span>
                    <span className="font-bold text-white">{diagnostics.memoryEstimateGb} GB</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30">
                <h3 className="text-sm font-bold text-cyan-300 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Cloud TV OS Launcher Compatibility Engine</span>
                </h3>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-5">
                  <li>
                    <strong>Google Play Services:</strong> Not required. KP TV is self-contained with pure Android AOSP intents.
                  </li>
                  <li>
                    <strong>Remote D-Pad:</strong> Fully supported via standard KeyEvent handlers (`KEYCODE_DPAD_*`).
                  </li>
                  <li>
                    <strong>Launcher Home Override:</strong> Verified safe. Does not wipe stock system firmware.
                  </li>
                  <li>
                    <strong>Zero Advertisements:</strong> Zero advertising SDKs, zero promotional telemetry, 100% clean UI.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/80 to-slate-950 border border-cyan-500/40">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-cyan-400" />
                      <span>Ready-to-Build Android Studio Project</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Download the complete native Android project source code including Kotlin source, Gradle build scripts, AndroidManifest with Leanback TV filters, and ADB scripts.
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
                  Windows PC Commands to Install via USB / Wi-Fi Debugging:
                </div>
                <div className="p-2.5 rounded-lg bg-black/60 text-emerald-400">
                  adb connect &lt;TV_IP&gt;:5555<br />
                  adb install -r android/app/build/outputs/apk/debug/app-debug.apk<br />
                  adb shell am start -n com.kptv.launcher/.MainActivity
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
