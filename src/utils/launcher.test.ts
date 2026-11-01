import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBallsRemaining,
  calculateRequiredRunRate,
  formatTvClock,
  formatTvDate,
  handleSpatialDpad,
  reorderDockApps,
  SpatialNavState
} from './launcherLogic';
import { AppShortcut } from '../types/launcher';

test('calculateBallsRemaining calculates 50-over remaining balls correctly', () => {
  // 45.0 overs bowled = 270 balls bowled out of 300 = 30 balls remaining
  assert.equal(calculateBallsRemaining('45.0', 50), 30);
  // 49.3 overs bowled = 297 balls bowled = 3 balls remaining
  assert.equal(calculateBallsRemaining('49.3', 50), 3);
  // 50.0 overs bowled = 0 balls remaining
  assert.equal(calculateBallsRemaining('50.0', 50), 0);
});

test('calculateRequiredRunRate calculates runs per over accurately', () => {
  // 12 runs in 18 balls (3 overs) = 4.00 RRR
  assert.equal(calculateRequiredRunRate(12, 18), '4.00');
  // 36 runs in 24 balls (4 overs) = 9.00 RRR
  assert.equal(calculateRequiredRunRate(36, 24), '9.00');
  // 0 balls left
  assert.equal(calculateRequiredRunRate(10, 0), '0.00');
});

test('formatTvClock formats 12h and 24h correctly', () => {
  const testDate = new Date(2025, 10, 2, 20, 45, 0); // 8:45 PM
  const res12 = formatTvClock(testDate, '12h');
  assert.equal(res12.timeStr, '08:45');
  assert.equal(res12.periodStr, 'PM');

  const res24 = formatTvClock(testDate, '24h');
  assert.equal(res24.timeStr, '20:45');
  assert.equal(res24.periodStr, '');
});

test('formatTvDate matches reference format', () => {
  const testDate = new Date(2025, 10, 2); // Nov 2, 2025 is a Sunday
  const dateStr = formatTvDate(testDate);
  assert.equal(dateStr, 'Sun, 02 Nov 2025');
});

test('handleSpatialDpad navigates smoothly between zones', () => {
  const initial: SpatialNavState = {
    zone: 'cards',
    sidebarIndex: 0,
    cardIndex: 0,
    dockIndex: 0,
    headerIndex: 0,
  };

  // Navigating RIGHT in cards moves from card 0 (Live TV) to card 1 (Setopbox)
  const step1 = handleSpatialDpad('RIGHT', initial, 6);
  assert.equal(step1.zone, 'cards');
  assert.equal(step1.cardIndex, 1);

  // Navigating LEFT from card 0 moves to sidebar
  const stepLeft = handleSpatialDpad('LEFT', initial, 6);
  assert.equal(stepLeft.zone, 'sidebar');

  // Navigating DOWN from cards moves to dock
  const stepDown = handleSpatialDpad('DOWN', initial, 6);
  assert.equal(stepDown.zone, 'dock');

  // Navigating UP from cards moves to header
  const stepUp = handleSpatialDpad('UP', initial, 6);
  assert.equal(stepUp.zone, 'header');
});

test('reorderDockApps rearranges dock shortcuts without losing apps', () => {
  const sampleApps: AppShortcut[] = [
    { id: 'app1', name: 'NetMirror TV', packageName: 'com.netmirror', iconType: 'netmirror', category: 'streaming', inDock: true, dockOrder: 0, isPreinstalled: true, accentColor: '#3b82f6' },
    { id: 'app2', name: 'Netflix', packageName: 'com.netflix.ninja', iconType: 'netflix', category: 'streaming', inDock: true, dockOrder: 1, isPreinstalled: true, accentColor: '#e50914' },
    { id: 'app3', name: 'YouTube', packageName: 'com.google.android.youtube.tv', iconType: 'youtube', category: 'streaming', inDock: true, dockOrder: 2, isPreinstalled: true, accentColor: '#ff0000' },
  ];

  const reordered = reorderDockApps(sampleApps, 0, 2);
  const dockSorted = reordered.filter(a => a.inDock).sort((a, b) => a.dockOrder - b.dockOrder);
  assert.equal(dockSorted[0].name, 'Netflix');
  assert.equal(dockSorted[1].name, 'YouTube');
  assert.equal(dockSorted[2].name, 'NetMirror TV');
});

test('handleSpatialDpad navigates across all 4 header items including wallpaper studio', () => {
  const inCards: SpatialNavState = {
    zone: 'cards',
    sidebarIndex: 0,
    cardIndex: 0,
    dockIndex: 0,
    headerIndex: 0,
  };

  // Up from Card 0 (Live TV) goes to Header index 0 (Wallpaper Studio)
  const upToWp = handleSpatialDpad('UP', inCards, 6);
  assert.equal(upToWp.zone, 'header');
  assert.equal(upToWp.headerIndex, 0);

  // Right from 0 goes to 1 (Wifi), then 2 (Settings), then 3 (Notifications)
  const toWifi = handleSpatialDpad('RIGHT', upToWp, 6);
  assert.equal(toWifi.headerIndex, 1);
  const toSettings = handleSpatialDpad('RIGHT', toWifi, 6);
  assert.equal(toSettings.headerIndex, 2);
  const toNotif = handleSpatialDpad('RIGHT', toSettings, 6);
  assert.equal(toNotif.headerIndex, 3);

  // Down from Notifications returns to Card 2 (Cricket)
  const downFromNotif = handleSpatialDpad('DOWN', toNotif, 6);
  assert.equal(downFromNotif.zone, 'cards');
  assert.equal(downFromNotif.cardIndex, 2);
});
