import React, { useState, useRef } from 'react';
import { 
  X, Image as ImageIcon, Upload, Link2, Check, 
  RotateCcw, Sparkles, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { WALLPAPER_PRESETS, WallpaperPreset, optimizeWallpaperImage } from '../../data/wallpapers';
import { soundFx } from '../../utils/audio';

interface WallpaperModalProps {
  currentPresetId: string;
  customImageUrl?: string;
  onSelectPreset: (presetId: string) => void;
  onSetCustomImage: (dataUrl: string) => void;
  onResetToDefault: () => void;
  onClose: () => void;
}

export const WallpaperModal: React.FC<WallpaperModalProps> = ({
  currentPresetId,
  customImageUrl,
  onSelectPreset,
  onSetCustomImage,
  onResetToDefault,
  onClose,
}) => {
  const [selectedTab, setSelectedTab] = useState<'presets' | 'custom'>('presets');
  const [inputUrl, setInputUrl] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelect = (preset: WallpaperPreset) => {
    soundFx.playSelect();
    onSelectPreset(preset.id);
    setSuccessMessage(`Applied "${preset.name}"`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingFile(true);
      setErrorMessage(null);
      // Downscale to max 1920x1080 and compress to avoid TV memory lag
      const optimizedDataUrl = await optimizeWallpaperImage(file);
      onSetCustomImage(optimizedDataUrl);
      soundFx.playSelect();
      setSuccessMessage('Custom TV wallpaper uploaded & memory-optimized!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process image.';
      setErrorMessage(msg);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    // Test image validity
    const img = new Image();
    img.onload = () => {
      onSetCustomImage(inputUrl.trim());
      soundFx.playSelect();
      setSuccessMessage('Applied custom wallpaper from URL!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setInputUrl('');
      setErrorMessage(null);
    };
    img.onerror = () => {
      setErrorMessage('Unable to load image from this URL. Please verify the link.');
    };
    img.src = inputUrl.trim();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-6 select-none">
      <div className="relative w-full max-w-4xl max-h-[88vh] rounded-3xl bg-slate-900/95 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.35)] p-7 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/30 text-cyan-400 border border-cyan-400/30">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-white">Wallpaper Studio</h2>
                <span className="text-[10px] font-bold bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-700/50">
                  Hardware Accelerated
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Choose dynamic presets or upload your own 16:9 Smart TV backdrop
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                soundFx.playSelect();
                onResetToDefault();
                setSuccessMessage('Reset to Default Mountain Wallpaper');
                setTimeout(() => setSuccessMessage(null), 2500);
              }}
              title="Reset to default mountain scene"
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset Default</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Close Wallpaper Studio"
              className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between py-3 border-b border-white/5">
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedTab('presets')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTab === 'presets'
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Dynamic Presets ({WALLPAPER_PRESETS.length})
            </button>
            <button
              onClick={() => setSelectedTab('custom')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTab === 'custom'
                  ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Custom Image / Upload
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>RAM-Safe for 32" Cloud TV</span>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-950/80 border border-red-400/50 text-red-200 text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-4 pr-1">
          {selectedTab === 'presets' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {WALLPAPER_PRESETS.map(preset => {
                const isActive = currentPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelect(preset)}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between h-40 overflow-hidden ${
                      isActive
                        ? 'border-cyan-400 ring-4 ring-cyan-400/80 shadow-[0_0_25px_rgba(56,189,248,0.6)] scale-[1.02]'
                        : 'border-white/10 hover:border-white/30 hover:scale-[1.01]'
                    }`}
                    style={{ background: preset.thumbnailGradient }}
                  >
                    {/* Dark gradient overlay for typography readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                    {/* Top Row: Category & Active badge */}
                    <div className="relative z-10 flex items-center justify-between w-full">
                      <span className="text-[10px] font-bold text-white/90 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20 uppercase tracking-wider">
                        {preset.category}
                      </span>
                      {isActive && (
                        <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-[0_0_10px_#38bdf8]">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Name & Description */}
                    <div className="relative z-10">
                      <h3 className="text-sm font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {preset.name}
                      </h3>
                      <p className="text-[11px] text-slate-200/90 line-clamp-2 mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedTab === 'custom' && (
            <div className="space-y-5">
              {/* Option A: Upload from Local Device / USB */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Upload Local Image File</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Select a photo from your PC, phone, or TV USB drive (JPG, PNG, WebP). Automatic downscaling ensures fast rendering without lagging your TV launcher.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingFile}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isProcessingFile ? 'Optimizing Image...' : 'Choose Image File'}</span>
                </button>
              </div>

              {/* Option B: Enter Direct Image URL */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-cyan-400" />
                  <span>Load from Web Image URL</span>
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  Paste any direct high-resolution 16:9 image link (e.g. Unsplash, custom hosting).
                </p>

                <form onSubmit={handleApplyUrl} className="flex space-x-2">
                  <input
                    type="url"
                    placeholder="https://example.com/my-wallpaper.jpg"
                    value={inputUrl}
                    onChange={e => setInputUrl(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Apply URL
                  </button>
                </form>
              </div>

              {/* Active Custom Image Preview if present */}
              {customImageUrl && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30">
                  <span className="text-xs font-bold text-slate-300 block mb-2">
                    Current Custom Wallpaper Preview:
                  </span>
                  <div className="w-full h-36 rounded-xl overflow-hidden border border-white/10 relative">
                    <img
                      src={customImageUrl}
                      alt="Current Custom Wallpaper"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-[10px] text-cyan-300 font-bold">
                      Active Custom
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Tip: Press Back on your TV remote to return to Home</span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
