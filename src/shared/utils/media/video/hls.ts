import Hls from 'hls.js';

import { createLogger } from '@/core/Logger';

export function createHlsPlayer(
  videoElement: HTMLVideoElement,
  url: string,
  onManifestParsed?: () => void,
  onError?: (error: string) => void
): HlsPlayerResult {
  const isHlsUrl = url.includes('.m3u8') || url.includes('application/x-mpegURL');

  if (isHlsUrl && Hls.isSupported()) {
    const hls = new Hls();

    hls.loadSource(url);
    hls.attachMedia(videoElement);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      videoElement.play().catch((err: Error) => {
        logger.warn('Auto-play failed, user interaction may be required', { error: err.message });
      });
      onManifestParsed?.();
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        logger.warn('HLS Fatal Error', { type: data.type });
        onError?.(`HLS Error: ${data.type}`);
      }
    });

    return { hls, isNative: false };
  }

  if (videoElement.canPlayType('application/vnd.apple.mpegurl') && isHlsUrl) {
    videoElement.src = url;
    videoElement.load();
    onManifestParsed?.();

    return { hls: null, isNative: true };
  }

  videoElement.src = url;
  videoElement.load();
  onManifestParsed?.();

  return { hls: null, isNative: false };
}
export function destroyHlsPlayer(hls: Hls | null): void {
  if (hls) {
    try {
      hls.stopLoad();
      hls.detachMedia();
      hls.destroy();
    } catch (e) {
      logger.warn('Error destroying HLS player', { error: String(e) });
    }
  }
}
export function isHlsUrl(url: string): boolean {
  return url.includes('.m3u8') || url.includes('application/x-mpegURL');
}

export interface HlsPlayerResult {
  hls: Hls | null;
  isNative: boolean;
}

const logger = createLogger({ module: 'HlsUtils' });
