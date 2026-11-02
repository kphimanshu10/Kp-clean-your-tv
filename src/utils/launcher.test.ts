import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBallsRemaining,
  calculateRequiredRunRate,
  formatTvClock,
  formatTvDate,
  handleSpatialDpad,
  reorderDockApps,
  SpatialNavState,
} from './launcherLogic';
import { AppShortcut } from '../types/launcher';
import { INITIAL_APPS, CRICKET_MATCHES } from '../data/mockData';
import { fetchLiveCricketMatches } from '../services/cricketService';
import { mapWmoWeatherCode } from '../services/weatherService';
import { proxyFetchCricketMatches } from '../../server';
import { ANDROID_PROJECT_FILES } from './androidProjectGenerator';
import { GRADLE_WRAPPER_JAR_BASE64 } from './gradleWrapperAssets';

test('calculateBallsRemaining calculates 50-over remaining balls correctly', () => {
  assert.equal(calculateBallsRemaining('45.0', 50), 30);
  assert.equal(calculateBallsRemaining('49.3', 50), 3);
  assert.equal(calculateBallsRemaining('50.0', 50), 0);
});

test('calculateRequiredRunRate calculates runs per over accurately', () => {
  assert.equal(calculateRequiredRunRate(12, 18), '4.00');
  assert.equal(calculateRequiredRunRate(36, 24), '9.00');
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
  const step1 = handleSpatialDpad('RIGHT', initial, 5);
  assert.equal(step1.zone, 'cards');
  assert.equal(step1.cardIndex, 1);

  // Navigating LEFT from card 0 moves to sidebar
  const stepLeft = handleSpatialDpad('LEFT', initial, 5);
  assert.equal(stepLeft.zone, 'sidebar');

  // Navigating DOWN from cards moves to dock
  const stepDown = handleSpatialDpad('DOWN', initial, 5);
  assert.equal(stepDown.zone, 'dock');

  // Navigating UP from cards moves to header
  const stepUp = handleSpatialDpad('UP', initial, 5);
  assert.equal(stepUp.zone, 'header');
});

test('reorderDockApps rearranges dock shortcuts without losing apps', () => {
  const sampleApps: AppShortcut[] = [
    {
      id: 'app1',
      name: 'NetMirror TV',
      packageName: 'com.netmirror',
      iconType: 'netmirror',
      category: 'streaming',
      inDock: true,
      dockOrder: 0,
      isPreinstalled: true,
      accentColor: '#3b82f6',
    },
    {
      id: 'app2',
      name: 'JioHotstar',
      packageName: 'in.startv.hotstar.dplus',
      iconType: 'hotstar',
      category: 'streaming',
      inDock: true,
      dockOrder: 1,
      isPreinstalled: true,
      accentColor: '#0c2461',
    },
    {
      id: 'app3',
      name: 'YouTube',
      packageName: 'com.google.android.youtube.tv',
      iconType: 'youtube',
      category: 'streaming',
      inDock: true,
      dockOrder: 2,
      isPreinstalled: true,
      accentColor: '#ff0000',
    },
  ];

  const reordered = reorderDockApps(sampleApps, 0, 2);
  const dockSorted = reordered.filter(a => a.inDock).sort((a, b) => a.dockOrder - b.dockOrder);
  assert.equal(dockSorted[0].name, 'JioHotstar');
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

  const upToWp = handleSpatialDpad('UP', inCards, 5);
  assert.equal(upToWp.zone, 'header');
  assert.equal(upToWp.headerIndex, 0);

  const toWifi = handleSpatialDpad('RIGHT', upToWp, 5);
  assert.equal(toWifi.headerIndex, 1);
  const toSettings = handleSpatialDpad('RIGHT', toWifi, 5);
  assert.equal(toSettings.headerIndex, 2);
  const toNotif = handleSpatialDpad('RIGHT', toSettings, 5);
  assert.equal(toNotif.headerIndex, 3);

  const downFromNotif = handleSpatialDpad('DOWN', toNotif, 5);
  assert.equal(downFromNotif.zone, 'cards');
  assert.equal(downFromNotif.cardIndex, 2);
});

test('INITIAL_APPS follows preferred dock order and preserves Netflix & Prime Video', () => {
  const dockApps = INITIAL_APPS.filter(a => a.inDock).sort((a, b) => a.dockOrder - b.dockOrder);
  assert.equal(dockApps.length, 4);
  assert.equal(dockApps[0].id, 'netmirror');
  assert.equal(dockApps[1].id, 'hotstar');
  assert.equal(dockApps[2].id, 'youtube');
  assert.equal(dockApps[3].id, 'airtel');

  // Verify Netflix and Prime Video are preserved and never uninstalled
  assert.ok(INITIAL_APPS.some(a => a.id === 'netflix'));
  assert.ok(INITIAL_APPS.some(a => a.id === 'prime'));
});

test('Live cricket service reports "Live score service not configured." when unconfigured and has no fake demo scores', async () => {
  assert.equal(CRICKET_MATCHES.length, 0);
  const res = await fetchLiveCricketMatches({
    endpointUrl: '',
    apiKey: '',
  });
  assert.equal(res.status, 'unconfigured');
  assert.equal(res.errorMessage, 'Live score service not configured.');
  assert.equal(res.matches.length, 0);
});

test('Backend proxyFetchCricketMatches handles unconfigured and invalid URL states safely without leaking secrets', async () => {
  const unconf = await proxyFetchCricketMatches({ endpointUrl: '', apiKey: '' });
  assert.equal(unconf.status, 'unconfigured');
  assert.equal(unconf.errorMessage, 'Live score service not configured.');

  const invalid = await proxyFetchCricketMatches({ endpointUrl: 'ftp://invalid-url', apiKey: 'test' });
  assert.equal(invalid.status, 'error');
});

test('mapWmoWeatherCode maps WMO codes accurately', () => {
  assert.deepEqual(mapWmoWeatherCode(0), { conditionText: 'Clear Sky', iconKind: 'clear-day' });
  assert.deepEqual(mapWmoWeatherCode(2), { conditionText: 'Partly Cloudy', iconKind: 'partly-cloudy' });
  assert.deepEqual(mapWmoWeatherCode(61), { conditionText: 'Rain', iconKind: 'rain' });
  assert.deepEqual(mapWmoWeatherCode(95), { conditionText: 'Thunderstorm', iconKind: 'thunderstorm' });
});

test('Android project generator includes all required Gradle Wrapper, Manifest, Kotlin, and resource files', () => {
  const requiredFiles = [
    'gradlew',
    'gradlew.bat',
    'settings.gradle.kts',
    'build.gradle.kts',
    'gradle/libs.versions.toml',
    'gradle.properties',
    'gradle/wrapper/gradle-wrapper.properties',
    'app/build.gradle.kts',
    'app/proguard-rules.pro',
    'app/src/main/AndroidManifest.xml',
    'app/src/main/java/com/kptv/launcher/MainActivity.kt',
    'app/src/main/java/com/kptv/launcher/AppEntry.kt',
    'app/src/main/java/com/kptv/launcher/InstalledAppsRepository.kt',
    'app/src/main/java/com/kptv/launcher/CricketScoreService.kt',
    'app/src/main/java/com/kptv/launcher/SetopboxHelper.kt',
    'app/src/main/java/com/kptv/launcher/DeviceDiagnosticsHelper.kt',
    'app/src/main/res/drawable/tv_banner.xml',
    'app/src/main/res/drawable/ic_launcher_background.xml',
    'app/src/main/res/drawable/ic_launcher_foreground.xml',
    'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
    'app/src/main/res/layout/activity_main.xml',
    'app/src/main/res/layout/dialog_app_drawer.xml',
    'app/src/main/res/layout/item_app_drawer.xml',
    'app/src/main/res/values/strings.xml',
    'app/src/main/res/values/colors.xml',
    'app/src/main/res/values/themes.xml',
  ];

  for (const file of requiredFiles) {
    assert.ok(ANDROID_PROJECT_FILES[file], `Missing required Android file: ${file}`);
  }

  // Verify official gradle-wrapper.jar binary payload is present and non-empty
  const jarBytes = Buffer.from(GRADLE_WRAPPER_JAR_BASE64, 'base64');
  assert.ok(jarBytes.length > 40000, 'Expected valid gradle-wrapper.jar binary (>40KB)');
  // Verify PK zip magic header
  assert.equal(jarBytes[0], 0x50);
  assert.equal(jarBytes[1], 0x4b);

  // Verify AndroidManifest uses <queries> instead of QUERY_ALL_PACKAGES and sensorLandscape orientation
  const manifest = ANDROID_PROJECT_FILES['app/src/main/AndroidManifest.xml'];
  assert.ok(!manifest.includes('QUERY_ALL_PACKAGES'));
  assert.ok(manifest.includes('<queries>'));
  assert.ok(manifest.includes('android.intent.category.LEANBACK_LAUNCHER'));
  assert.ok(manifest.includes('android.intent.category.HOME'));
  assert.ok(manifest.includes('android:screenOrientation="sensorLandscape"'));
  assert.ok(manifest.includes('android:hardwareAccelerated="true"'));

  // Verify MainActivity hosts secure fullscreen WebView with AndroidTvBridge
  const mainActivity = ANDROID_PROJECT_FILES['app/src/main/java/com/kptv/launcher/MainActivity.kt'];
  assert.ok(mainActivity.includes('https://kptv.local/index.html'));
  assert.ok(mainActivity.includes('allowFileAccess = false'));
  assert.ok(mainActivity.includes('allowContentAccess = false'));
  assert.ok(mainActivity.includes('textZoom = 100'));
  assert.ok(mainActivity.includes('AndroidTvBridge'));

  const layoutXml = ANDROID_PROJECT_FILES['app/src/main/res/layout/activity_main.xml'];
  assert.ok(layoutXml.includes('android.webkit.WebView'));
  assert.ok(layoutXml.includes('@+id/kp_tv_webview'));
});



