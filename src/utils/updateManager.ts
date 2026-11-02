export type UpdateUiState =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'installing'
  | 'failed';

export interface VersionManifest {
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  releaseDate: string;
  downloadUrl: string;
  fileSizeBytes: number;
  sha256: string;
  minAndroidSdk: number;
  targetAndroidSdk: number;
  releaseNotes: string[];
}

export const INSTALLED_APP_VERSION = {
  packageName: 'com.kptv.launcher',
  versionName: '2.6.0',
  versionCode: 6,
};

export async function computeBufferSha256Hex(buffer: ArrayBuffer): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return '';
}

export function compareVersions(installedCode: number, remoteCode: number): number {
  return remoteCode - installedCode;
}

export async function fetchLatestVersionManifest(
  customManifestUrl?: string
): Promise<VersionManifest> {
  const urlsToTry = customManifestUrl?.trim()
    ? [customManifestUrl.trim()]
    : ['/api/version', './version.json', '/version.json'];

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as VersionManifest;
        if (data && data.versionName && typeof data.versionCode === 'number') {
          return data;
        }
      }
    } catch {
      // try next fallback
    }
  }

  throw new Error('Could not reach update manifest server (version.json).');
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}
