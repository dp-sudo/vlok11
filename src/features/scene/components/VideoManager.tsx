import Hls from 'hls.js';
import { memo, useEffect, useRef, useState } from 'react';
import { LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace, VideoTexture } from 'three';

import { useSceneStore } from '@/stores/sharedStore';

interface VideoManagerProps {
  onTextureReady: (texture: VideoTexture | null) => void;
  videoUrl: string | null;
}

export const VideoManager = memo<VideoManagerProps>(({ videoUrl, onTextureReady }) => {
  const config = useSceneStore((state) => state.config);
  const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null);

  const isPowerOfTwo = (value: number): boolean => (value & (value - 1)) === 0;

  const configRef = useRef(config);

  configRef.current = config;

  useEffect(() => {
    if (!videoUrl) {
      setVideoTexture(null);

      return;
    }

    let isMounted = true;
    const vid = document.createElement('video');

    vid.crossOrigin = 'Anonymous';
    vid.loop = true;
    vid.muted = configRef.current.videoMuted;
    vid.volume = 1.0;
    vid.playsInline = true;
    vid.autoplay = true;

    let hls: Hls | null = null;
    let texture: VideoTexture | null = null;

    const setupTexture = () => {
      if (!isMounted) return;

      if (!vid.videoWidth || !vid.videoHeight) return;
      texture = new VideoTexture(vid);
      texture.colorSpace = SRGBColorSpace;

      const canUseMipmaps =
        configRef.current.enableFrameInterpolation &&
        isPowerOfTwo(vid.videoWidth) &&
        isPowerOfTwo(vid.videoHeight);

      texture.minFilter = canUseMipmaps ? LinearMipmapLinearFilter : LinearFilter;
      texture.magFilter = LinearFilter;
      texture.generateMipmaps = canUseMipmaps;
      setVideoTexture(texture);
    };

    vid.onloadedmetadata = () => setupTexture();

    if (videoUrl.includes('.m3u8') && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(vid);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        vid.play().catch((err) => console.warn('Video play failed:', err));
      });
    } else {
      vid.src = videoUrl;
      vid.play().catch((err) => console.warn('Video play failed:', err));
    }

    return () => {
      isMounted = false;

      if (hls) {
        hls.stopLoad();
        hls.detachMedia();
        hls.destroy();
      }

      vid.pause();
      vid.removeAttribute('src');
      vid.load();

      if (texture) {
        texture.dispose();
      }
    };
  }, [videoUrl]);

  useEffect(() => {
    if (videoTexture?.image) {
      videoTexture.image.muted = config.videoMuted;
    }
  }, [videoTexture, config.videoMuted]);

  useEffect(() => {
    if (videoTexture) {
      const vid = videoTexture.image as HTMLVideoElement | undefined;
      const w = vid?.videoWidth ?? 0;
      const h = vid?.videoHeight ?? 0;
      const canUseMipmaps =
        config.enableFrameInterpolation && w > 0 && h > 0 && isPowerOfTwo(w) && isPowerOfTwo(h);

      videoTexture.minFilter = canUseMipmaps ? LinearMipmapLinearFilter : LinearFilter;
      videoTexture.generateMipmaps = canUseMipmaps;
      videoTexture.needsUpdate = true;
    }
  }, [videoTexture, config.enableFrameInterpolation]);

  const onTextureReadyRef = useRef(onTextureReady);

  onTextureReadyRef.current = onTextureReady;

  useEffect(() => {
    onTextureReadyRef.current(videoTexture);
  }, [videoTexture]);

  return null;
});

VideoManager.displayName = 'VideoManager';
