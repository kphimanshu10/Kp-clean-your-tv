import { AppShortcut, CricketMatch } from '../types/launcher';

/**
 * Calculates remaining balls from an overs string (e.g. "45.0" in a 50-over match -> 30 balls remaining)
 */
export function calculateBallsRemaining(oversStr: string, maxOvers: number = 50): number {
  const parts = oversStr.split('.');
  const overs = parseInt(parts[0] || '0', 10);
  const balls = parseInt(parts[1] || '0', 10);
  const totalBallsBowled = overs * 6 + balls;
  const maxBalls = maxOvers * 6;
  return Math.max(0, maxBalls - totalBallsBowled);
}

/**
 * Calculates Required Run Rate (RRR)
 */
export function calculateRequiredRunRate(runsNeeded: number, ballsRemaining: number): string {
  if (ballsRemaining <= 0) return '0.00';
  const oversRemaining = ballsRemaining / 6;
  const rrr = runsNeeded / oversRemaining;
  return rrr.toFixed(2);
}

/**
 * Formats clock time according to 12h or 24h format
 */
export function formatTvClock(date: Date, format: '12h' | '24h'): { timeStr: string; periodStr: string } {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  if (format === '24h') {
    const formattedHours = hours.toString().padStart(2, '0');
    return {
      timeStr: `${formattedHours}:${minutes}`,
      periodStr: '',
    };
  } else {
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const formattedHours = h12.toString().padStart(2, '0');
    return {
      timeStr: `${formattedHours}:${minutes}`,
      periodStr: period,
    };
  }
}

/**
 * Formats TV Date string like "Sun, 02 Nov 2025" matching the reference image!
 */
export function formatTvDate(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[date.getDay()];
  const dayNum = date.getDate().toString().padStart(2, '0');
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

/**
 * Spatial D-pad navigation state machine
 */
export type NavigationZone = 'sidebar' | 'cards' | 'dock' | 'header';

export interface SpatialNavState {
  zone: NavigationZone;
  sidebarIndex: number; // 0: Home, 1: Apps, 2: Settings, 3: About
  cardIndex: number;    // 0: Live TV, 1: Setopbox, 2: Cricket
  dockIndex: number;    // 0 to dock.length - 1
  headerIndex: number;  // 0: Wifi, 1: Settings, 2: Notifications
}

export function handleSpatialDpad(
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
  current: SpatialNavState,
  dockCount: number
): SpatialNavState {
  const next: SpatialNavState = { ...current };

  switch (direction) {
    case 'UP':
      if (next.zone === 'dock') {
        next.zone = 'cards';
        // Map dock position to nearest card
        if (next.dockIndex <= 1) next.cardIndex = 0;
        else if (next.dockIndex <= 3) next.cardIndex = 1;
        else next.cardIndex = 2;
      } else if (next.zone === 'cards') {
        next.zone = 'header';
        // Map 3 cards to 4 header items
        if (next.cardIndex === 0) next.headerIndex = 0; // Wallpaper
        else if (next.cardIndex === 1) next.headerIndex = 2; // Settings
        else next.headerIndex = 3; // Notifications
      } else if (next.zone === 'sidebar') {
        next.sidebarIndex = Math.max(0, next.sidebarIndex - 1);
      }
      break;

    case 'DOWN':
      if (next.zone === 'header') {
        next.zone = 'cards';
        if (next.headerIndex <= 1) next.cardIndex = 0;
        else if (next.headerIndex === 2) next.cardIndex = 1;
        else next.cardIndex = 2;
      } else if (next.zone === 'cards') {
        next.zone = 'dock';
        if (next.cardIndex === 0) next.dockIndex = 0;
        else if (next.cardIndex === 1) next.dockIndex = 2;
        else next.dockIndex = 4;
        if (next.dockIndex >= dockCount) next.dockIndex = Math.max(0, dockCount - 1);
      } else if (next.zone === 'sidebar') {
        next.sidebarIndex = Math.min(3, next.sidebarIndex + 1);
      }
      break;

    case 'LEFT':
      if (next.zone === 'cards') {
        if (next.cardIndex > 0) {
          next.cardIndex--;
        } else {
          next.zone = 'sidebar';
        }
      } else if (next.zone === 'dock') {
        if (next.dockIndex > 0) {
          next.dockIndex--;
        } else {
          next.zone = 'sidebar';
        }
      } else if (next.zone === 'header') {
        if (next.headerIndex > 0) {
          next.headerIndex--;
        } else {
          next.zone = 'sidebar';
        }
      }
      break;

    case 'RIGHT':
      if (next.zone === 'sidebar') {
        next.zone = 'cards';
      } else if (next.zone === 'cards') {
        if (next.cardIndex < 2) {
          next.cardIndex++;
        }
      } else if (next.zone === 'dock') {
        if (next.dockIndex < dockCount - 1) {
          next.dockIndex++;
        }
      } else if (next.zone === 'header') {
        if (next.headerIndex < 3) {
          next.headerIndex++;
        }
      }
      break;
  }

  return next;
}

/**
 * Reorders dock shortcuts
 */
export function reorderDockApps(apps: AppShortcut[], sourceIndex: number, destIndex: number): AppShortcut[] {
  const dockApps = apps.filter(a => a.inDock).sort((a, b) => a.dockOrder - b.dockOrder);
  if (sourceIndex < 0 || sourceIndex >= dockApps.length || destIndex < 0 || destIndex >= dockApps.length) {
    return apps;
  }

  const [moved] = dockApps.splice(sourceIndex, 1);
  dockApps.splice(destIndex, 0, moved);

  // Re-assign dockOrder
  const updatedMap = new Map<string, number>();
  dockApps.forEach((app, idx) => {
    updatedMap.set(app.id, idx);
  });

  return apps.map(app => {
    if (updatedMap.has(app.id)) {
      return { ...app, dockOrder: updatedMap.get(app.id)! };
    }
    return app;
  });
}
