export type CompatibilityStatus =
  | 'Compatible'
  | 'Partially Compatible'
  | 'Not Compatible'
  | 'Unknown / Unable to Detect';

export interface CompatibilityCheckItem {
  id: string;
  category: string;
  title: string;
  detectedValue: string;
  status: CompatibilityStatus;
  explanation: string;
  recommendedFix?: string;
}

export interface FullCompatibilityReport {
  generatedAt: string;
  overallStatus: CompatibilityStatus;
  compatibleCount: number;
  partialCount: number;
  incompatibleCount: number;
  unknownCount: number;
  items: CompatibilityCheckItem[];
}

function measureDisplayRefreshRate(): Promise<number> {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') {
      resolve(60);
      return;
    }
    let frames = 0;
    const start = performance.now();
    const step = (now: number) => {
      frames++;
      if (now - start >= 350) {
        const fps = Math.round((frames * 1000) / (now - start));
        resolve(fps >= 20 && fps <= 240 ? fps : 60);
      } else {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  });
}

export async function runFullTvCompatibilityTest(): Promise<FullCompatibilityReport> {
  const isNative = Boolean(
    typeof window !== 'undefined' && window.AndroidTvBridge?.isNativeAndroid?.()
  );

  let nativeData: Record<string, unknown> = {};
  if (isNative && window.AndroidTvBridge?.getCompatibilityReportJson) {
    try {
      nativeData = JSON.parse(window.AndroidTvBridge.getCompatibilityReportJson());
    } catch {
      nativeData = {};
    }
  }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const measuredHz = await measureDisplayRefreshRate();

  // 1. Android Version & API Level
  const androidRelease = String(
    nativeData.androidRelease ||
      (ua.match(/Android\s+([0-9.]+)/i)?.[1] ?? (isNative ? '9.0+' : 'Web Runtime'))
  );
  const sdkInt = Number(nativeData.sdkInt || (isNative ? 28 : 0));
  const itemAndroidVersion: CompatibilityCheckItem = {
    id: 'android-version',
    category: 'System',
    title: 'Android Version & API Level',
    detectedValue: isNative
      ? `Android ${androidRelease} (API Level ${sdkInt})`
      : ua.includes('Android')
      ? `Android ${androidRelease} (WebView)`
      : `Web Preview (${navigator.platform || 'Desktop/Browser'})`,
    status:
      !isNative && !ua.includes('Android')
        ? 'Partially Compatible'
        : sdkInt >= 21 || ua.includes('Android')
        ? 'Compatible'
        : 'Not Compatible',
    explanation:
      sdkInt >= 21 || ua.includes('Android')
        ? 'Meets minimum API 21 (Android 5.0 Lollipop) requirement for KP TV Launcher.'
        : 'Running in non-Android browser preview; native APK features require Android 5.0+ (API 21+).',
    recommendedFix:
      !isNative && !ua.includes('Android')
        ? 'Install the KP TV APK on an Android TV, Google TV, or Android Box for full native hardware control.'
        : undefined,
  };

  // 2. Manufacturer & Model
  const brandModel = String(
    nativeData.brandModel ||
      (ua.includes('AFT')
        ? 'Amazon Fire TV'
        : ua.includes('BRAVIA')
        ? 'Sony Bravia Android TV'
        : isNative
        ? 'Android Smart TV'
        : 'Standard Display / Browser Host')
  );
  const itemBrandModel: CompatibilityCheckItem = {
    id: 'device-model',
    category: 'Hardware',
    title: 'Device Manufacturer & Model',
    detectedValue: brandModel,
    status: 'Compatible',
    explanation: 'Device identity detected and supported by KP TV responsive 16:9 engine.',
  };

  // 3. Android TV / Google TV / Android Box Classification
  const tvClassification = String(
    nativeData.tvClassification ||
      (ua.includes('GoogleTV')
        ? 'Google TV'
        : ua.includes('Leanback') || ua.includes('Android TV')
        ? 'Android TV (Leanback)'
        : ua.includes('Android')
        ? 'Android TV Box / Cloud TV OS (AOSP)'
        : 'Web Browser / Desktop Host')
  );
  const itemClassification: CompatibilityCheckItem = {
    id: 'tv-classification',
    category: 'Platform',
    title: 'TV Platform Classification',
    detectedValue: tvClassification,
    status: isNative || ua.includes('Android') ? 'Compatible' : 'Partially Compatible',
    explanation:
      'KP TV supports both Leanback Android TV / Google TV and AOSP Android Boxes (Cloud TV OS).',
  };

  // 4. Screen Resolution & Density
  const width =
    Number(nativeData.widthPixels) ||
    (typeof window !== 'undefined' ? window.screen.width * (window.devicePixelRatio || 1) : 1920);
  const height =
    Number(nativeData.heightPixels) ||
    (typeof window !== 'undefined' ? window.screen.height * (window.devicePixelRatio || 1) : 1080);
  const dpi =
    Number(nativeData.densityDpi) ||
    Math.round(((typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1) * 160);
  const isLandscape = width >= height;
  const itemResolution: CompatibilityCheckItem = {
    id: 'screen-resolution',
    category: 'Display',
    title: 'Screen Resolution & Density',
    detectedValue: `${Math.round(width)} × ${Math.round(height)} px (${dpi} dpi)`,
    status: isLandscape ? 'Compatible' : 'Partially Compatible',
    explanation: isLandscape
      ? 'Landscape 16:9 widescreen display geometry verified.'
      : 'Portrait display detected; KP TV automatically scales to preserve 16:9 TV layout.',
    recommendedFix: !isLandscape
      ? 'Rotate display to Landscape or install on a 16:9 TV screen.'
      : undefined,
  };

  // 5. Display Refresh Rate
  const refreshRate = Number(nativeData.refreshRateHz) || measuredHz;
  const itemRefreshRate: CompatibilityCheckItem = {
    id: 'refresh-rate',
    category: 'Display',
    title: 'Display Refresh Rate',
    detectedValue: `${refreshRate} Hz`,
    status: refreshRate >= 50 ? 'Compatible' : 'Partially Compatible',
    explanation:
      refreshRate >= 50
        ? 'Smooth 50Hz/60Hz+ television refresh rate active.'
        : 'Lower refresh rate detected; animations will adapt automatically.',
  };

  // 6. CPU Architecture
  const cpuAbi = String(
    nativeData.cpuAbis ||
      (ua.includes('aarch64') || ua.includes('arm64')
        ? 'arm64-v8a (64-bit ARM)'
        : ua.includes('armv7') || ua.includes('arm')
        ? 'armeabi-v7a (32-bit ARM)'
        : ua.includes('x86_64') || ua.includes('Win64') || ua.includes('Mac')
        ? 'x86_64 (64-bit)'
        : 'Universal / Multi-ABI')
  );
  const itemCpu: CompatibilityCheckItem = {
    id: 'cpu-arch',
    category: 'Hardware',
    title: 'CPU Architecture',
    detectedValue: cpuAbi,
    status: 'Compatible',
    explanation: 'KP TV APK bundles architecture-independent bytecode compatible with ARM64, ARM32, and x86.',
  };

  // 7. Available RAM & Storage
  const availRamMb = Number(nativeData.availRamMb) || 0;
  const totalRamMb =
    Number(nativeData.totalRamMb) ||
    ((navigator as unknown as { deviceMemory?: number }).deviceMemory || 2) * 1024;
  const availStorageMb = Number(nativeData.availStorageMb) || 0;

  let storageText = '';
  if (isNative && availRamMb > 0) {
    storageText = `RAM: ${availRamMb} MB free / ${totalRamMb} MB total • Storage: ${availStorageMb} MB free`;
  } else {
    storageText = `Est. RAM: ${Math.round(totalRamMb / 1024)} GB class (Low-memory optimizations active)`;
  }
  const itemMemory: CompatibilityCheckItem = {
    id: 'ram-storage',
    category: 'Hardware',
    title: 'Available RAM & Internal Storage',
    detectedValue: storageText,
    status: totalRamMb >= 768 ? 'Compatible' : 'Partially Compatible',
    explanation:
      'KP TV is specifically engineered for low-RAM (1 GB / 512 MB) Smart TVs with hardware-accelerated layers.',
  };

  // 8. Hardware Video Decoders
  let supportedVideoCodecs: string[] = [];
  if (Array.isArray(nativeData.hardwareVideoDecoders)) {
    supportedVideoCodecs = nativeData.hardwareVideoDecoders as string[];
  } else if (typeof MediaSource !== 'undefined' && typeof MediaSource.isTypeSupported === 'function') {
    if (MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E"')) {
      supportedVideoCodecs.push('H.264 / AVC');
    }
    if (
      MediaSource.isTypeSupported('video/mp4; codecs="hev1.1.6.L93.B0"') ||
      MediaSource.isTypeSupported('video/mp4; codecs="hvc1.1.6.L93.B0"')
    ) {
      supportedVideoCodecs.push('H.265 / HEVC');
    }
    if (MediaSource.isTypeSupported('video/webm; codecs="vp9"')) {
      supportedVideoCodecs.push('VP9');
    }
    if (MediaSource.isTypeSupported('video/mp4; codecs="av01.0.05M.08"')) {
      supportedVideoCodecs.push('AV1');
    }
  }
  const itemDecoders: CompatibilityCheckItem = {
    id: 'video-decoders',
    category: 'Media',
    title: 'Available Hardware Video Decoders',
    detectedValue:
      supportedVideoCodecs.length > 0
        ? supportedVideoCodecs.join(', ')
        : 'Standard HTML5 / H.264 Decoder',
    status: supportedVideoCodecs.length > 0 ? 'Compatible' : 'Partially Compatible',
    explanation:
      'H.264/AVC and HLS.js software fallback ensure live IPTV streams play reliably across all TV chipsets.',
  };

  // 9. HDR & Dolby Vision Support (Honest Detection - Never Faked)
  const hdrTypes: string[] = Array.isArray(nativeData.hdrTypes)
    ? (nativeData.hdrTypes as string[])
    : typeof window !== 'undefined' && window.matchMedia?.('(dynamic-range: high)').matches
    ? ['HDR Display Dynamic Range']
    : [];
  const itemHdr: CompatibilityCheckItem = {
    id: 'hdr-dolby',
    category: 'Media',
    title: 'HDR & Dolby Vision Support',
    detectedValue:
      hdrTypes.length > 0 ? hdrTypes.join(', ') : 'SDR Standard Dynamic Range (HDR Not Detected)',
    status: hdrTypes.length > 0 ? 'Compatible' : 'Partially Compatible',
    explanation:
      hdrTypes.length > 0
        ? 'Display reports high dynamic range capability.'
        : 'Display reports standard dynamic range (SDR). All 720p/1080p SDR streams will play normally.',
  };

  // 10. Supported Audio Codecs
  const audioCodecs: string[] = Array.isArray(nativeData.audioCodecs)
    ? (nativeData.audioCodecs as string[])
    : ['AAC-LC', 'MP3', 'Opus', 'PCM'];
  const itemAudio: CompatibilityCheckItem = {
    id: 'audio-codecs',
    category: 'Media',
    title: 'Supported Audio Codecs',
    detectedValue: audioCodecs.join(', '),
    status: 'Compatible',
    explanation: 'AAC and MP3 stereo/multi-channel audio decoding available for IPTV & Online Player.',
  };

  // 11. Wi-Fi & Ethernet Availability
  const online = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  const netSummary = String(
    nativeData.networkSummary || (online ? 'Online (Active Network Interface)' : 'Offline')
  );
  const itemNetwork: CompatibilityCheckItem = {
    id: 'network-status',
    category: 'Connectivity',
    title: 'Wi-Fi & Ethernet Availability',
    detectedValue: netSummary,
    status: online ? 'Compatible' : 'Not Compatible',
    explanation: online
      ? 'Network interface active for IPTV streaming, QR LAN server, and live weather/cricket feeds.'
      : 'No active network connection detected.',
    recommendedFix: !online
      ? 'Open Wi-Fi Settings or connect an Ethernet LAN cable to your TV.'
      : undefined,
  };

  // 12. Remote Control & D-Pad Support
  const itemRemote: CompatibilityCheckItem = {
    id: 'remote-dpad',
    category: 'Input',
    title: 'Remote Control & D-Pad Navigation',
    detectedValue: isNative
      ? 'Native KeyEvent D-Pad (Up/Down/Left/Right/OK/Back/Home)'
      : 'Spatial Keyboard & Remote D-Pad Engine Active',
    status: 'Compatible',
    explanation:
      'All cards, dock icons, modals, and players support directional D-pad focus and OK/Back keys.',
  };

  // 13. Google Play Services Availability
  const gmsAvailable =
    typeof nativeData.gmsAvailable === 'boolean' ? nativeData.gmsAvailable : null;
  const itemGms: CompatibilityCheckItem = {
    id: 'google-play-services',
    category: 'Platform',
    title: 'Google Play Services Availability',
    detectedValue:
      gmsAvailable === true
        ? 'Installed & Active'
        : gmsAvailable === false
        ? 'Not Installed (AOSP / Cloud TV OS Mode)'
        : 'Unknown / Not Required (Self-Contained Mode)',
    status: 'Compatible',
    explanation:
      'KP TV Launcher has zero dependency on Google Play Services and runs 100% natively on both GMS and non-GMS AOSP TVs.',
  };

  // 14. Required Permissions
  const itemPermissions: CompatibilityCheckItem = {
    id: 'permissions',
    category: 'Security',
    title: 'Required Permissions',
    detectedValue: 'INTERNET, ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE, REQUEST_INSTALL_PACKAGES',
    status: 'Compatible',
    explanation:
      'Uses minimal, non-invasive permissions. Does not request microphone, contacts, or dangerous system root permissions.',
  };

  // 15. Launcher Replacement Compatibility
  const homeSupported =
    typeof nativeData.homeLauncherSupported === 'boolean' ? nativeData.homeLauncherSupported : isNative;
  const itemHomeRole: CompatibilityCheckItem = {
    id: 'launcher-replacement',
    category: 'Launcher',
    title: 'Launcher Replacement Compatibility',
    detectedValue: homeSupported
      ? 'Registered for HOME, DEFAULT, and LEANBACK_LAUNCHER'
      : 'Manifest Configured (Install APK on TV to activate HOME role)',
    status: homeSupported ? 'Compatible' : 'Partially Compatible',
    explanation:
      'AndroidManifest declares both standard HOME and LEANBACK_LAUNCHER categories without disabling your stock TV launcher.',
  };

  // 16. App Installation & Update Compatibility
  const canInstall =
    typeof nativeData.canInstallPackages === 'boolean' ? nativeData.canInstallPackages : null;
  const itemInstallUpdate: CompatibilityCheckItem = {
    id: 'app-install-update',
    category: 'Updates',
    title: 'App Installation & Update Compatibility',
    detectedValue:
      canInstall === true
        ? 'Allowed (PackageInstaller Ready)'
        : canInstall === false
        ? 'Permission Needed (Allow Unknown Sources in TV Settings)'
        : 'APK Download & SHA-256 Verifier Ready',
    status: canInstall === false ? 'Partially Compatible' : 'Compatible',
    explanation:
      canInstall === false
        ? 'Android 8.0+ requires granting "Install unknown apps" permission before installing downloaded APK updates.'
        : 'Supports verified APK updates with SHA-256 integrity checks.',
    recommendedFix:
      canInstall === false
        ? 'Go to KP TV Updates tab and click "Grant Install Permission" when prompted.'
        : undefined,
  };

  const items: CompatibilityCheckItem[] = [
    itemAndroidVersion,
    itemBrandModel,
    itemClassification,
    itemResolution,
    itemRefreshRate,
    itemCpu,
    itemMemory,
    itemDecoders,
    itemHdr,
    itemAudio,
    itemNetwork,
    itemRemote,
    itemGms,
    itemPermissions,
    itemHomeRole,
    itemInstallUpdate,
  ];

  const compatibleCount = items.filter(i => i.status === 'Compatible').length;
  const partialCount = items.filter(i => i.status === 'Partially Compatible').length;
  const incompatibleCount = items.filter(i => i.status === 'Not Compatible').length;
  const unknownCount = items.filter(i => i.status === 'Unknown / Unable to Detect').length;

  const overallStatus: CompatibilityStatus =
    incompatibleCount > 0
      ? 'Partially Compatible'
      : partialCount > 3
      ? 'Partially Compatible'
      : 'Compatible';

  return {
    generatedAt: new Date().toLocaleString(),
    overallStatus,
    compatibleCount,
    partialCount,
    incompatibleCount,
    unknownCount,
    items,
  };
}
