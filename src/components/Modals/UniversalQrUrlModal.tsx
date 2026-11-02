import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  QrCode,
  Link2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Wifi,
  Clock,
  Smartphone,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import { QrUrlInputContextType } from '../../types/launcher';

interface UniversalQrUrlModalProps {
  contextType: QrUrlInputContextType;
  title: string;
  subtitle?: string;
  placeholder?: string;
  initialUrl?: string;
  onApplyUrl: (url: string) => void;
  onClose: () => void;
}

const SESSION_DURATION_SEC = 600; // 10-minute temporary authenticated session

export function validateHttpUrl(raw: string): {
  valid: boolean;
  normalized: string;
  warning?: string;
  error?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, normalized: '', error: 'Please enter or paste a URL first.' };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        normalized: trimmed,
        error: 'Only HTTP and HTTPS links are supported for security.',
      };
    }
    const warning =
      parsed.protocol === 'http:'
        ? 'Note: HTTP link detected. HTTPS is preferred when available.'
        : undefined;
    return { valid: true, normalized: parsed.toString(), warning };
  } catch {
    return {
      valid: false,
      normalized: trimmed,
      error: 'Invalid URL format. Include https:// or http:// at the beginning.',
    };
  }
}

export const UniversalQrUrlModal: React.FC<UniversalQrUrlModalProps> = ({
  contextType,
  title,
  subtitle,
  placeholder = 'https://example.com/playlist.m3u8',
  initialUrl = '',
  onApplyUrl,
  onClose,
}) => {
  const [urlInput, setUrlInput] = useState<string>(initialUrl);
  const [activeMode, setActiveMode] = useState<'scan-receive' | 'generate-share'>('scan-receive');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [shareQrDataUrl, setShareQrDataUrl] = useState<string>('');
  const [qrTargetUrl, setQrTargetUrl] = useState<string>('');
  const [localIp, setLocalIp] = useState<string>('Detecting LAN IP...');
  const [connectionOk, setConnectionOk] = useState<boolean>(true);
  const [sessionId, setSessionId] = useState<string>(() =>
    'kptv-' + Math.random().toString(36).slice(2, 8)
  );
  const [authToken, setAuthToken] = useState<string>(() =>
    Math.random().toString(36).slice(2, 8).toUpperCase()
  );
  const [secondsLeft, setSecondsLeft] = useState<number>(SESSION_DURATION_SEC);
  const [validationState, setValidationState] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    message: string;
  }>({ status: 'idle', message: '' });

  // Build QR code for mobile remote input session
  const buildSessionQr = useCallback(
    (sid: string, token: string) => {
      let target = '';
      let detectedIp = 'Cloud / Web Relay';

      try {
        if (typeof window !== 'undefined' && window.AndroidTvBridge?.getQrSessionInfoJson) {
          const rawInfo = window.AndroidTvBridge.getQrSessionInfoJson(contextType);
          const info = JSON.parse(rawInfo);
          if (info?.url) {
            target = info.url;
            detectedIp = info.ipAddress || 'TV Local Wi-Fi';
            if (info.token) setAuthToken(info.token);
          }
        } else if (typeof window !== 'undefined' && window.AndroidTvBridge?.getIptvQrUrl) {
          const base = window.AndroidTvBridge.getIptvQrUrl();
          if (base && base.startsWith('http')) {
            target = `${base}?context=${encodeURIComponent(contextType)}&token=${encodeURIComponent(token)}`;
            try {
              detectedIp = new URL(base).host;
            } catch {
              detectedIp = 'TV Local Wi-Fi';
            }
          }
        }
      } catch {
        // fallback to web relay
      }

      if (!target && typeof window !== 'undefined') {
        const origin =
          window.location.origin && !window.location.origin.includes('kptv.local')
            ? window.location.origin
            : 'https://ais-pre-kautdddzohadkt5fcttmp4-995376337501.asia-east1.run.app';
        target = `${origin}/iptv-remote/${sid}?context=${encodeURIComponent(
          contextType
        )}&token=${encodeURIComponent(token)}`;
        try {
          detectedIp = new URL(origin).host;
        } catch {
          detectedIp = 'Local Network';
        }
      }

      setLocalIp(detectedIp);
      setQrTargetUrl(target);
      setConnectionOk(typeof navigator !== 'undefined' ? navigator.onLine !== false : true);

      if (target) {
        QRCode.toDataURL(target, {
          width: 220,
          margin: 1,
          color: {
            dark: '#020617',
            light: '#ffffff',
          },
        })
          .then(data => setQrDataUrl(data))
          .catch(() => setQrDataUrl(''));
      }
    },
    [contextType]
  );

  useEffect(() => {
    buildSessionQr(sessionId, authToken);
  }, [sessionId, authToken, buildSessionQr]);

  // Countdown timer for temporary session expiration
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll for incoming URL from phone QR submission (only while session has not expired)
  useEffect(() => {
    if (secondsLeft <= 0) return;

    let lastReceived = '';

    const handleNativeUrlEvent = (e: Event) => {
      const custom = e as CustomEvent<string>;
      const incoming = (custom.detail || '').trim();
      if (incoming && incoming !== lastReceived) {
        lastReceived = incoming;
        setUrlInput(incoming);
        setValidationState({
          status: 'valid',
          message: 'Received URL from mobile QR session! Ready to Load / Import.',
        });
      }
    };

    window.addEventListener('kptv-iptv-url', handleNativeUrlEvent as EventListener);

    const pollInterval = setInterval(async () => {
      try {
        if (window.AndroidTvBridge?.getLatestIptvUrl) {
          const nativeUrl = (window.AndroidTvBridge.getLatestIptvUrl() || '').trim();
          if (nativeUrl && nativeUrl !== lastReceived && nativeUrl !== initialUrl) {
            lastReceived = nativeUrl;
            setUrlInput(nativeUrl);
            setValidationState({
              status: 'valid',
              message: 'Received URL from mobile phone via TV LAN QR Server!',
            });
            return;
          }
        }
      } catch {
        // ignore
      }

      try {
        if (!window.location.origin.includes('kptv.local')) {
          const res = await fetch(
            `/api/iptv-qr/${sessionId}?token=${encodeURIComponent(authToken)}`
          );
          if (res.ok) {
            const data = await res.json();
            const remoteUrl = String(data?.playlistUrl || '').trim();
            if (remoteUrl && remoteUrl !== lastReceived) {
              lastReceived = remoteUrl;
              setUrlInput(remoteUrl);
              setValidationState({
                status: 'valid',
                message: 'Received URL from mobile QR scan! Click Load / Import below.',
              });
            }
          }
        }
      } catch {
        // ignore
      }
    }, 1800);

    return () => {
      window.removeEventListener('kptv-iptv-url', handleNativeUrlEvent as EventListener);
      clearInterval(pollInterval);
    };
  }, [sessionId, authToken, secondsLeft, initialUrl]);

  // Stop QR session cleanly when modal closes
  const handleCloseModal = () => {
    try {
      window.AndroidTvBridge?.stopQrSession?.();
    } catch {
      // ignore
    }
    onClose();
  };

  const handleRegenerateSession = () => {
    const newSid = 'kptv-' + Math.random().toString(36).slice(2, 8);
    const newTok = Math.random().toString(36).slice(2, 8).toUpperCase();
    setSessionId(newSid);
    setAuthToken(newTok);
    setSecondsLeft(SESSION_DURATION_SEC);
    setValidationState({ status: 'idle', message: 'Generated fresh authenticated QR session.' });
  };

  const handleGenerateQrForTypedUrl = async () => {
    const check = validateHttpUrl(urlInput);
    if (!check.valid) {
      setValidationState({ status: 'invalid', message: check.error || 'Invalid URL' });
      return;
    }
    setActiveMode('generate-share');
    try {
      const generated = await QRCode.toDataURL(check.normalized, {
        width: 220,
        margin: 1,
        color: { dark: '#020617', light: '#ffffff' },
      });
      setShareQrDataUrl(generated);
      setValidationState({
        status: 'valid',
        message: 'Generated QR code for current URL.',
      });
    } catch {
      setValidationState({
        status: 'invalid',
        message: 'Failed to generate QR code for URL.',
      });
    }
  };

  const handleValidateUrl = async () => {
    const check = validateHttpUrl(urlInput);
    if (!check.valid) {
      setValidationState({ status: 'invalid', message: check.error || 'Invalid URL' });
      return;
    }

    setValidationState({ status: 'checking', message: 'Validating URL reachability & format...' });

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(check.normalized, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        setValidationState({
          status: 'valid',
          message: `Verified reachable (HTTP ${res.status}). ${check.warning || 'HTTPS/URL valid.'}`,
        });
        return;
      }
      setValidationState({
        status: 'invalid',
        message: `Server responded with HTTP ${res.status}. Verify the link is active.`,
      });
    } catch {
      // Even if direct browser fetch hits CORS, check via backend proxy if available
      try {
        const proxyRes = await fetch(
          `/api/iptv-playlist?url=${encodeURIComponent(check.normalized)}`
        );
        if (proxyRes.ok) {
          setValidationState({
            status: 'valid',
            message: `URL validated via KP TV proxy. ${check.warning || 'Ready to load.'}`,
          });
          return;
        }
      } catch {
        // ignore
      }

      setValidationState({
        status: 'valid',
        message: `URL syntax is valid (${check.normalized.slice(0, 45)}...). Ready to load.`,
      });
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUrlInput(text.trim());
          setValidationState({
            status: 'idle',
            message: 'Pasted URL from system clipboard.',
          });
          return;
        }
      }
    } catch {
      // Clipboard API may require focus/permission in some WebViews
    }
    setValidationState({
      status: 'idle',
      message: 'Focus the URL field and press OK / Long-Press to paste, or scan the QR code.',
    });
  };

  const handleLoadAndImport = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const check = validateHttpUrl(urlInput);
    if (!check.valid) {
      setValidationState({ status: 'invalid', message: check.error || 'Invalid URL' });
      return;
    }
    onApplyUrl(check.normalized);
    handleCloseModal();
  };

  const formatTimeLeft = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6 select-none">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#0b1329] border-2 border-cyan-400/50 shadow-[0_0_60px_rgba(6,182,212,0.35)] p-6 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-white">{title}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  Universal QR URL System
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {subtitle ||
                  'Paste a URL directly, or scan the QR code with your phone to send any link to KP TV.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleCloseModal}
            aria-label="Close Universal QR URL Input"
            className="p-2.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 focus:ring-4 focus:ring-cyan-400 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5">
          {/* Left 7 Columns: URL Input + Remote-Friendly Action Buttons */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <form onSubmit={handleLoadAndImport} className="space-y-3">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                Target URL ({contextType.toUpperCase()})
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-950 text-white text-xs font-mono border-2 border-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/30"
                />
              </div>

              {/* Action Buttons Row 1: Paste, Scan QR, Generate QR, Clear, Validate */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 focus:ring-4 focus:ring-cyan-400 text-white text-xs font-bold flex items-center justify-center space-x-1.5 border border-white/10 transition-all cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Paste URL</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode('scan-receive')}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition-all cursor-pointer focus:ring-4 focus:ring-cyan-400 ${
                    activeMode === 'scan-receive'
                      ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200'
                      : 'bg-slate-800 border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Scan QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateQrForTypedUrl}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition-all cursor-pointer focus:ring-4 focus:ring-cyan-400 ${
                    activeMode === 'generate-share'
                      ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200'
                      : 'bg-slate-800 border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Generate QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={handleValidateUrl}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 focus:ring-4 focus:ring-cyan-400 text-emerald-300 text-xs font-bold flex items-center justify-center space-x-1.5 border border-emerald-500/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Validate URL</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUrlInput('');
                    setValidationState({ status: 'idle', message: 'Cleared URL input.' });
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-red-950/70 focus:ring-4 focus:ring-cyan-400 text-rose-300 text-xs font-bold flex items-center justify-center space-x-1.5 border border-rose-500/30 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Clear URL</span>
                </button>

                <button
                  type="button"
                  onClick={handleRegenerateSession}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 focus:ring-4 focus:ring-cyan-400 text-cyan-300 text-xs font-bold flex items-center justify-center space-x-1.5 border border-cyan-500/30 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>New Session</span>
                </button>
              </div>

              {/* Validation Feedback Box */}
              {validationState.message && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center space-x-2 border ${
                    validationState.status === 'valid'
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                      : validationState.status === 'invalid'
                      ? 'bg-red-950/80 border-red-500/40 text-red-300'
                      : 'bg-slate-900/90 border-cyan-500/30 text-cyan-200'
                  }`}
                >
                  {validationState.status === 'checking' && (
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                  )}
                  {validationState.status === 'valid' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {validationState.status === 'invalid' && (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{validationState.message}</span>
                </div>
              )}

              {/* Primary Load / Import Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 focus:ring-4 focus:ring-cyan-300 text-white font-black text-sm shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Load / Import URL Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* TV Network & Authenticated Session Telemetry */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/25 grid grid-cols-3 gap-2 text-[11px]">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="overflow-hidden">
                  <span className="text-slate-400 block text-[10px]">TV Local Host / IP</span>
                  <span className="text-white font-bold truncate block">{localIp}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Session Pin & Status</span>
                  <span className="text-emerald-300 font-bold">
                    {connectionOk ? `Online • PIN ${authToken}` : 'Offline'}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Session Expiration</span>
                  <span className="text-amber-300 font-bold">
                    {secondsLeft > 0 ? formatTimeLeft(secondsLeft) : 'Expired'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: High-Contrast QR Code Display */}
          <div className="md:col-span-5 p-5 rounded-3xl bg-slate-950/95 border border-cyan-400/40 flex flex-col items-center justify-between text-center">
            <div className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
              {activeMode === 'scan-receive'
                ? 'Scan with Phone to Send URL to TV'
                : 'Scan with Phone to Open Typed URL'}
            </div>

            <div className="my-3 p-3.5 bg-white rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.3)]">
              {activeMode === 'scan-receive' ? (
                qrDataUrl && secondsLeft > 0 ? (
                  <img
                    src={qrDataUrl}
                    alt="Scan QR Code to Send URL to TV"
                    className="w-44 h-44 object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-800 font-bold p-4">
                    {secondsLeft <= 0 ? 'Session Expired. Click New Session.' : 'Generating QR...'}
                  </div>
                )
              ) : shareQrDataUrl ? (
                <img
                  src={shareQrDataUrl}
                  alt="Generated QR Code for URL"
                  className="w-44 h-44 object-contain"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-800 font-bold p-4">
                  Enter a valid URL and click Generate QR Code
                </div>
              )}
            </div>

            <div className="w-full space-y-1.5">
              <p className="text-[11px] text-slate-300 font-medium">
                {activeMode === 'scan-receive'
                  ? '1. Scan QR with phone camera → 2. Paste URL on phone → 3. Auto-fills on TV!'
                  : 'Scan this QR code to open the entered URL on your mobile device.'}
              </p>
              {activeMode === 'scan-receive' && qrTargetUrl && (
                <div className="text-[10px] text-cyan-400 font-mono truncate px-2.5 py-1 rounded-lg bg-slate-900 border border-white/5">
                  {qrTargetUrl}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
