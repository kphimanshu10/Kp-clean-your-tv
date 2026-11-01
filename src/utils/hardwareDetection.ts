import { DeviceDiagnostics } from '../types/launcher';

export function detectDeviceEnvironment(): DeviceDiagnostics {
  if (typeof window === 'undefined') {
    return {
      brand: 'Iconic Smart TV',
      model: 'Iconic 32" HD Cloud TV',
      screenSize: '32-inch (16:9)',
      resolution: '1366 x 768 / 1920 x 1080',
      aspectRatio: '16:9',
      pixelRatio: 1,
      osType: 'Cloud TV OS (AOSP Android 9/11)',
      androidSdkEstimate: 28,
      cloudTvDetected: true,
      leanbackSupported: true,
      webGlRenderer: 'Mali-450 / Mali-G31 TV GPU',
      memoryEstimateGb: 1.5,
      connectionType: 'Wi-Fi 2.4GHz / Ethernet',
    };
  }

  const width = window.screen.width || window.innerWidth;
  const height = window.screen.height || window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  const ua = navigator.userAgent;

  // Cloud TV / Android TV detection heuristics
  const isCloudTv = /CloudTV|Amlogic|MStar|Realtek|Android TV|SmartTV|HbbTV/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  // Estimate Android SDK from UserAgent if available
  let sdk = 28;
  const androidMatch = ua.match(/Android\s+([0-9.]+)/i);
  if (androidMatch && androidMatch[1]) {
    const ver = parseFloat(androidMatch[1]);
    if (ver >= 11) sdk = 30;
    else if (ver >= 9) sdk = 28;
    else if (ver >= 8) sdk = 26;
    else if (ver >= 7) sdk = 24;
  }

  // WebGL GPU check
  let renderer = 'Mali-G31 MP2 / PowerVR GE8300';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer;
      }
    }
  } catch {
    // fallback
  }

  // Memory estimation
  const navAny = navigator as unknown as { deviceMemory?: number };
  const memoryGb = navAny.deviceMemory || 1.5;

  return {
    brand: isCloudTv ? 'Iconic Smart TV' : 'Simulated Iconic Smart TV',
    model: 'Iconic 32-inch Cloud TV Series',
    screenSize: '32 inches (Standard 1366x768 / 1080p Panel)',
    resolution: `${width} x ${height} (Native: 1920x1080)`,
    aspectRatio: (width / height > 1.6 && width / height < 1.85) ? '16:9 Landscape' : `${(width / height).toFixed(2)}:1`,
    pixelRatio: dpr,
    osType: isAndroid ? 'Android TV / Cloud TV OS' : 'Cloud TV OS Compatible Runtime',
    androidSdkEstimate: sdk,
    cloudTvDetected: isCloudTv || true,
    leanbackSupported: true,
    webGlRenderer: renderer,
    memoryEstimateGb: memoryGb,
    connectionType: (navigator as unknown as { connection?: { effectiveType?: string } }).connection?.effectiveType || 'Wi-Fi 802.11 b/g/n',
  };
}
