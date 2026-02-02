import Hls from 'hls.js';

import { createLogger } from '@/core/Logger';
import { VIDEO_PROCESSING } from '@/shared/constants/utils';

import { findVideoUrlInHtml } from '../image/analysis';
import { fetchWebPageHtmlViaProxies, validateUrl } from '../image/loading';

const drawFrameToCanvas = (video: HTMLVideoElement, scaleMax: number, quality: number): string => {
  const { videoWidth: width, videoHeight: height } = video;

  if (!width || !height) return '';

  let targetWidth = width;
  let targetHeight = height;

  if (width > height) {
    if (width > scaleMax) {
      targetHeight *= scaleMax / width;
      targetWidth = scaleMax;
    }
  } else if (height > scaleMax) {
    targetWidth *= scaleMax / height;
    targetHeight = scaleMax;
  }

  targetWidth = Math.floor(targetWidth);
  targetHeight = Math.floor(targetHeight);

  if (targetWidth < 1 || targetHeight < 1) return '';

  const canvas = document.createElement('canvas');

  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas context failed');
  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

  return canvas.toDataURL('image/jpeg', quality);
};

export const extractFrameFromVideo = (
  videoUrl: string,
  maxDimension = VIDEO_PROCESSING.DEFAULT_MAX_DIMENSION,
  timeoutMs = VIDEO_PROCESSING.DEFAULT_TIMEOUT_MS
): Promise<{
  aspectRatio: number;
  base64: string;
  duration: number;
  height: number;
  width: number;
}> =>
  new Promise((resolve, reject) => {
    const validation = validateUrl(videoUrl);

    if (!validation.valid) {
      reject(new Error(validation.error));

      return;
    }
    const video = document.createElement('video');

    video.style.display = 'none';
    document.body.appendChild(video);
    video.crossOrigin = 'Anonymous';
    video.setAttribute('referrerPolicy', 'no-referrer');
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    let hls: Hls | null = null;
    let isCleanedUp = false;
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          'Video processing timed out. The file may be too large or the format/codec is not supported.'
        )
      );
    }, timeoutMs);
    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      clearTimeout(timeoutId);
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
      video.oncanplay = null;
      video.onloadeddata = null;
      video.pause();
      video.removeAttribute('src');
      video.load();
      if (hls) {
        hls.destroy();
        hls = null;
      }
      if (video.parentNode) video.parentNode.removeChild(video);
    };
    const captureFrame = () => {
      try {
        const { videoWidth: width, videoHeight: height } = video;

        if (!width || !height) throw new Error('Video dimensions not available.');

        let dataUrl = '';

        try {
          dataUrl = drawFrameToCanvas(video, maxDimension, VIDEO_PROCESSING.JPEG_QUALITY);
        } catch {
          logger.warn('High-res capture failed, retrying fallback');
          dataUrl = drawFrameToCanvas(
            video,
            VIDEO_PROCESSING.FALLBACK_DIMENSION,
            VIDEO_PROCESSING.JPEG_QUALITY
          );
        }

        if (!dataUrl) throw new Error('Failed to generate image data.');
        const { duration } = video;

        cleanup();
        resolve({ base64: dataUrl, width, height, aspectRatio: width / height, duration });
      } catch (e: unknown) {
        cleanup();
        const errorMessage = e instanceof Error ? e.message : String(e);

        if (errorMessage.includes('Tainted')) {
          reject(
            new Error(
              'CORS Error: The video source prevents processing. Please use a file or a server that allows Cross-Origin access.'
            )
          );
        } else {
          reject(e instanceof Error ? e : new Error(errorMessage));
        }
      }
    };
    let hasSeeked = false;
    const trySeek = () => {
      if (hasSeeked) return;
      if (!video.videoWidth || !video.videoHeight) return;
      hasSeeked = true;
      const { duration } = video;
      let seekTime: number = VIDEO_PROCESSING.DEFAULT_SEEK_TIME;

      if (Number.isFinite(duration) && duration > 0)
        seekTime = Math.min(
          VIDEO_PROCESSING.MAX_SEEK_TIME,
          duration * VIDEO_PROCESSING.SEEK_DURATION_RATIO
        );
      if (video.seekable.length === 0 && duration === Infinity) {
        captureFrame();

        return;
      }
      try {
        video.currentTime = seekTime;
      } catch {
        captureFrame();
      }
    };

    video.onloadeddata = () => {
      if (video.readyState >= 2) trySeek();
    };
    video.oncanplay = () => trySeek();
    video.onseeked = () => captureFrame();
    video.onerror = () => {
      cleanup();
      reject(new Error('Video loading failed or codec unsupported.'));
    };
    const isHls = videoUrl.includes('.m3u8') || videoUrl.includes('application/x-mpegURL');

    if (isHls && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          logger.warn('HLS Fatal Error', { type: data.type });
          cleanup();
          reject(new Error('HLS Stream Error'));
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isHls) {
      video.src = videoUrl;
      video.load();
    } else {
      video.src = videoUrl;
      video.load();
    }
  });
const logger = createLogger({ module: 'Utils' });

export const resolveWebPageVideoUrl = async (pageUrl: string): Promise<string> => {
  const validation = validateUrl(pageUrl);

  if (!validation.valid) throw new Error(validation.error);
  try {
    const html = await fetchWebPageHtmlViaProxies(pageUrl);
    const normalizedHtml = html.replace(/\\\r?\n/g, '');
    const url = findVideoUrlInHtml(normalizedHtml, pageUrl);

    if (!url) throw new Error('Could not find a valid video URL (.m3u8 or .mp4) on the page.');

    return url;
  } catch (error) {
    logger.error('Video resolution failed', { error: String(error) });
    throw error;
  }
};
