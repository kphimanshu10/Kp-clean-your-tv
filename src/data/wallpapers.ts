export interface WallpaperPreset {
  id: string;
  name: string;
  category: 'Landscape' | 'Abstract & Aurora' | 'Cyber & Synth' | 'Dark & Minimal';
  description: string;
  thumbnailGradient: string;
  accentColor: string;
  renderMode: 'default-mountain' | 'aurora-borealis' | 'cyber-dusk' | 'deep-cosmos' | 'golden-lake' | 'oled-pure' | 'custom-image';
  isDynamic: boolean;
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'reference-mountain',
    name: 'KP TV Alpine Sunset',
    category: 'Landscape',
    description: 'Default signature mountain twilight with lake reflections and pine trees',
    thumbnailGradient: 'linear-gradient(135deg, #0d1b40 0%, #581c87 50%, #9333ea 100%)',
    accentColor: '#38bdf8',
    renderMode: 'default-mountain',
    isDynamic: true,
  },
  {
    id: 'aurora-borealis',
    name: 'Nordic Aurora Night',
    category: 'Abstract & Aurora',
    description: 'Ethereal emerald & cyan polar lights sweeping across arctic peaks',
    thumbnailGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #10b981 100%)',
    accentColor: '#34d399',
    renderMode: 'aurora-borealis',
    isDynamic: true,
  },
  {
    id: 'cyber-dusk',
    name: 'Neon Cyber Grid',
    category: 'Cyber & Synth',
    description: 'Futuristic purple neon horizon with glowing cybernetic gridlines',
    thumbnailGradient: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #d946ef 100%)',
    accentColor: '#e879f9',
    renderMode: 'cyber-dusk',
    isDynamic: true,
  },
  {
    id: 'deep-cosmos',
    name: 'Galactic Deep Space',
    category: 'Abstract & Aurora',
    description: 'Stellar nebula clouds with twinkling starfields and indigo vortex',
    thumbnailGradient: 'linear-gradient(135deg, #020617 0%, #172554 50%, #312e81 100%)',
    accentColor: '#818cf8',
    renderMode: 'deep-cosmos',
    isDynamic: true,
  },
  {
    id: 'golden-lake',
    name: 'Amber Sunset Serenade',
    category: 'Landscape',
    description: 'Warm golden hour dusk with crimson reflections over tranquil waters',
    thumbnailGradient: 'linear-gradient(135deg, #451a03 0%, #9a3412 50%, #f59e0b 100%)',
    accentColor: '#fbbf24',
    renderMode: 'golden-lake',
    isDynamic: true,
  },
  {
    id: 'oled-pure',
    name: 'OLED Pure Minimal',
    category: 'Dark & Minimal',
    description: 'Pitch deep navy & black with soft subtle edge glow for maximum card pop',
    thumbnailGradient: 'linear-gradient(135deg, #030712 0%, #0b1329 50%, #020617 100%)',
    accentColor: '#94a3b8',
    renderMode: 'oled-pure',
    isDynamic: false,
  },
];

/**
 * Optimizes an uploaded image file via an in-memory Canvas downscaling to max 1920x1080 (16:9)
 * and JPEG compression at 0.82 quality. This prevents high-res 4K/8K smartphone photos (15MB+)
 * from overwhelming the TV memory and exceeding localStorage quota.
 */
export async function optimizeWallpaperImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (JPG, PNG, WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = document.createElement('img');
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not initialize canvas context.'));
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP or JPEG for lightweight storage
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(optimizedDataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
