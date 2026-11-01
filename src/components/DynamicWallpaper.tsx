import React, { memo } from 'react';

interface DynamicWallpaperProps {
  renderMode: string;
  customImageUrl?: string;
}

export const DynamicWallpaper: React.FC<DynamicWallpaperProps> = memo(({
  renderMode,
  customImageUrl,
}) => {
  return (
    <div 
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-700 select-none"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* 1. Signature Default Mountain Scene (Matching Reference Image) */}
      {renderMode === 'default-mountain' && (
        <div className="relative w-full h-full bg-[#030712]">
          <svg
            className="absolute inset-0 w-full h-full object-cover"
            viewBox="0 0 1920 1080"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#050a1c" />
                <stop offset="40%" stopColor="#0d1b40" />
                <stop offset="65%" stopColor="#2e144a" />
                <stop offset="80%" stopColor="#581c87" />
                <stop offset="92%" stopColor="#7e22ce" />
                <stop offset="100%" stopColor="#9333ea" />
              </linearGradient>

              <linearGradient id="auroraStreak" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#818cf8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.5" />
              </linearGradient>

              <linearGradient id="lakeWater" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0b1329" />
                <stop offset="35%" stopColor="#141c38" />
                <stop offset="70%" stopColor="#070c1d" />
                <stop offset="100%" stopColor="#02040a" />
              </linearGradient>

              <linearGradient id="mountainFar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.95" />
              </linearGradient>

              <linearGradient id="mountainMid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* Sky */}
            <rect width="1920" height="1080" fill="url(#skyGrad)" />

            {/* Glowing Aurora Streaks */}
            <path
              d="M -100 150 Q 500 50 1100 200 T 2100 120"
              stroke="url(#auroraStreak)"
              strokeWidth="70"
              fill="none"
              opacity="0.35"
              filter="blur(30px)"
            />

            {/* Distant Mountain Range */}
            <polygon
              points="-50,750 300,580 550,660 850,540 1150,620 1450,510 1750,630 2000,550 2000,820 -50,820"
              fill="url(#mountainFar)"
            />

            {/* Midground Dark Mountain Ridges */}
            <polygon
              points="-50,820 200,680 480,760 780,640 1080,720 1380,630 1680,740 2000,660 2000,880 -50,880"
              fill="url(#mountainMid)"
            />

            {/* Peaceful Lake Water Surface */}
            <rect x="0" y="850" width="1920" height="230" fill="url(#lakeWater)" />

            {/* Mountain Reflections in Water */}
            <rect x="0" y="850" width="1920" height="50" fill="#7e22ce" opacity="0.18" filter="blur(15px)" />
            <rect x="300" y="870" width="600" height="40" fill="#38bdf8" opacity="0.12" filter="blur(20px)" />

            {/* Pine Forest Silhouettes at bottom-left */}
            <g fill="#020617" opacity="0.95">
              <polygon points="40,840 20,930 60,930" />
              <polygon points="80,820 55,930 105,930" />
              <polygon points="120,835 95,930 145,930" />
              <polygon points="170,810 140,930 200,930" />
              <polygon points="220,845 195,930 245,930" />
              <polygon points="270,825 240,930 300,930" />
            </g>

            {/* Pine Forest Silhouettes at bottom-right */}
            <g fill="#020617" opacity="0.95">
              <polygon points="1680,825 1650,930 1710,930" />
              <polygon points="1730,805 1700,930 1760,930" />
              <polygon points="1780,830 1750,930 1810,930" />
              <polygon points="1830,815 1800,930 1860,930" />
              <polygon points="1880,840 1850,930 1910,930" />
            </g>
          </svg>
        </div>
      )}

      {/* 2. Aurora Borealis Fjord Night */}
      {renderMode === 'aurora-borealis' && (
        <div className="relative w-full h-full bg-[#021814]">
          <svg
            className="absolute inset-0 w-full h-full object-cover"
            viewBox="0 0 1920 1080"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="auroraSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#021410" />
                <stop offset="35%" stopColor="#042820" />
                <stop offset="70%" stopColor="#064e3b" />
                <stop offset="100%" stopColor="#022c22" />
              </linearGradient>
              <linearGradient id="auroraGreenWave" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="30%" stopColor="#34d399" stopOpacity="0.75" />
                <stop offset="70%" stopColor="#2dd4bf" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            <rect width="1920" height="1080" fill="url(#auroraSky)" />

            {/* Polar Aurora Curtains */}
            <path
              d="M -100 200 C 400 50, 800 350, 1400 120 S 1900 250, 2100 100"
              stroke="url(#auroraGreenWave)"
              strokeWidth="90"
              fill="none"
              filter="blur(25px)"
            />
            <path
              d="M -50 280 C 500 120, 900 380, 1500 180 S 1800 300, 2050 160"
              stroke="#6ee7b7"
              strokeWidth="35"
              fill="none"
              opacity="0.6"
              filter="blur(15px)"
            />

            {/* Starfield */}
            <g fill="#ffffff" opacity="0.65">
              <circle cx="200" cy="80" r="1.5" />
              <circle cx="350" cy="120" r="1" />
              <circle cx="580" cy="60" r="2" />
              <circle cx="820" cy="140" r="1.5" />
              <circle cx="1100" cy="90" r="1" />
              <circle cx="1340" cy="110" r="2" />
              <circle cx="1600" cy="70" r="1.5" />
              <circle cx="1800" cy="130" r="1" />
            </g>

            {/* Snow Peak Mountain silhouettes */}
            <polygon
              points="-100,800 250,600 500,700 800,530 1100,670 1400,520 1700,650 2020,560 2020,1080 -100,1080"
              fill="#062e24"
            />
            <polygon
              points="-100,860 180,720 440,800 750,650 1050,760 1350,640 1650,780 2020,670 2020,1080 -100,1080"
              fill="#021f18"
            />
          </svg>
        </div>
      )}

      {/* 3. Cyber Synthwave Grid */}
      {renderMode === 'cyber-dusk' && (
        <div className="relative w-full h-full bg-[#0a051b]">
          <svg
            className="absolute inset-0 w-full h-full object-cover"
            viewBox="0 0 1920 1080"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="cyberSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#050114" />
                <stop offset="50%" stopColor="#2e0854" />
                <stop offset="80%" stopColor="#581c87" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
              <linearGradient id="cyberSun" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>

            <rect width="1920" height="750" fill="url(#cyberSky)" />

            {/* Synthwave Glowing Sun */}
            <circle cx="960" cy="620" r="180" fill="url(#cyberSun)" opacity="0.85" filter="blur(2px)" />

            {/* Sun horizontal line cuts */}
            <rect x="760" y="550" width="400" height="6" fill="#050114" />
            <rect x="760" y="580" width="400" height="8" fill="#050114" />
            <rect x="760" y="615" width="400" height="12" fill="#050114" />
            <rect x="760" y="655" width="400" height="16" fill="#050114" />

            {/* Wireframe Horizon Mountains */}
            <polygon
              points="0,750 350,560 650,680 960,540 1270,680 1570,560 1920,750"
              fill="#180436"
              stroke="#d946ef"
              strokeWidth="2"
            />

            {/* Cyber Grid Floor */}
            <rect x="0" y="750" width="1920" height="330" fill="#070214" />
            <g stroke="#a855f7" strokeWidth="1.5" opacity="0.6">
              {[...Array(15)].map((_, i) => (
                <line
                  key={i}
                  x1={960}
                  y1={750}
                  x2={-200 + i * 165}
                  y2={1080}
                />
              ))}
              <line x1="0" y1="780" x2="1920" y2="780" />
              <line x1="0" y1="820" x2="1920" y2="820" />
              <line x1="0" y1="880" x2="1920" y2="880" />
              <line x1="0" y1="960" x2="1920" y2="960" />
            </g>
          </svg>
        </div>
      )}

      {/* 4. Galactic Deep Space Nebula */}
      {renderMode === 'deep-cosmos' && (
        <div className="relative w-full h-full bg-[#020617]">
          <div className="absolute inset-0 bg-radial-[at_50%_30%] from-indigo-900/60 via-slate-950 to-[#020617]" />
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          {/* Subtle star dots */}
          <div className="absolute inset-0 opacity-70 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
      )}

      {/* 5. Golden Lake Dusk */}
      {renderMode === 'golden-lake' && (
        <div className="relative w-full h-full bg-[#1c0b02]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#2a0e03] via-[#7c2d12] to-[#0c0401]" />
          <div className="absolute bottom-40 left-0 right-0 h-40 bg-gradient-to-t from-amber-500/20 to-transparent blur-2xl" />
        </div>
      )}

      {/* 6. OLED Pure Minimalist Dark */}
      {renderMode === 'oled-pure' && (
        <div className="relative w-full h-full bg-[#030712]">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-950/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-950/25 rounded-full blur-3xl" />
        </div>
      )}

      {/* 7. Custom Image (User uploaded file or remote URL) */}
      {renderMode === 'custom-image' && customImageUrl && (
        <div className="relative w-full h-full">
          <img
            src={customImageUrl}
            alt="Custom TV Wallpaper"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
      )}

      {/* Ambient Dark TV Vignette overlay to guarantee high-contrast readability of cards & clock */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(3, 7, 18, 0.15) 0%, rgba(3, 7, 18, 0.65) 100%)',
        }}
      />
    </div>
  );
});

DynamicWallpaper.displayName = 'DynamicWallpaper';
