declare module 'hls.js' {
  export interface HlsLevel {
    height?: number;
    width?: number;
    bitrate?: number;
  }

  export interface HlsMediaTrack {
    id: number;
    name?: string;
    lang?: string;
  }

  export interface HlsManifestParsedData {
    levels?: HlsLevel[];
  }

  export interface HlsAudioTracksUpdatedData {
    audioTracks?: HlsMediaTrack[];
  }

  export interface HlsSubtitleTracksUpdatedData {
    subtitleTracks?: HlsMediaTrack[];
  }

  export interface HlsErrorData {
    type: string;
    details: string;
    fatal: boolean;
  }

  export default class Hls {
    static isSupported(): boolean;
    static Events: {
      MANIFEST_PARSED: 'hlsManifestParsed';
      AUDIO_TRACKS_UPDATED: 'hlsAudioTracksUpdated';
      SUBTITLE_TRACKS_UPDATED: 'hlsSubtitleTracksUpdated';
      ERROR: 'hlsError';
    };
    static ErrorTypes: {
      NETWORK_ERROR: string;
      MEDIA_ERROR: string;
      OTHER_ERROR: string;
    };

    audioTrack: number;
    subtitleTrack: number;

    constructor(config?: Record<string, unknown>);
    loadSource(url: string): void;
    attachMedia(media: HTMLMediaElement): void;
    startLoad(startPosition?: number): void;
    recoverMediaError(): void;
    destroy(): void;

    on(
      event: 'hlsManifestParsed',
      listener: (event: string, data: HlsManifestParsedData) => void
    ): void;
    on(
      event: 'hlsAudioTracksUpdated',
      listener: (event: string, data: HlsAudioTracksUpdatedData) => void
    ): void;
    on(
      event: 'hlsSubtitleTracksUpdated',
      listener: (event: string, data: HlsSubtitleTracksUpdatedData) => void
    ): void;
    on(event: 'hlsError', listener: (event: string, data: HlsErrorData) => void): void;
  }
}
