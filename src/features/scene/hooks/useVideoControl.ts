import { useCallback, useEffect, useRef } from 'react';

import type { VideoTexture } from 'three';

export function useVideoControl({
  videoTextureRef,
  isPlaying,
  isLooping,
  playbackRate,
  onTimeUpdate,
  onDurationChange,
  onEnded,
}: VideoControlOptions): VideoControlReturn {
  const callbacksRef = useRef({ onTimeUpdate, onDurationChange, onEnded });
  const lastDurationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const boundVideoRef = useRef<HTMLVideoElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    callbacksRef.current = { onTimeUpdate, onDurationChange, onEnded };
  }, [onTimeUpdate, onDurationChange, onEnded]);

  useEffect(() => {
    const video = videoTextureRef.current?.image;

    if (!video) return;

    // Apply Playback State
    if (isPlaying && video.paused) {
      void video.play().catch(() => {});
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }

    // Apply Attributes
    video.loop = !!isLooping;
    
    // Safety check for playbackRate to prevent "non-finite" errors from persisted state
    if (Number.isFinite(playbackRate) && playbackRate > 0) {
      video.playbackRate = playbackRate;
    } else {
      video.playbackRate = 1.0;
    }
  }, [isPlaying, isLooping, playbackRate, videoTextureRef]);

  useEffect(() => {
    const attachIfNeeded = (): void => {
      const video = videoTextureRef.current?.image;

      if (!video) return;
      if (boundVideoRef.current === video) return;

      cleanupRef.current?.();
      boundVideoRef.current = video;
      lastDurationRef.current = null;
      lastTimeRef.current = null;

      const handleTimeUpdate = () => {
        const t = video.currentTime;

        if (lastTimeRef.current !== t) {
          lastTimeRef.current = t;
          callbacksRef.current.onTimeUpdate?.(t);
        }
      };

      const handleDurationChange = () => {
        const d = video.duration;

        if (!d || isNaN(d)) return;
        if (lastDurationRef.current !== d) {
          lastDurationRef.current = d;
          callbacksRef.current.onDurationChange?.(d);
        }
      };

      const handleEnded = () => {
        callbacksRef.current.onEnded?.();
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('durationchange', handleDurationChange);
      video.addEventListener('ended', handleEnded);

      handleDurationChange();

      cleanupRef.current = () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('durationchange', handleDurationChange);
        video.removeEventListener('ended', handleEnded);
      };
    };

    attachIfNeeded();
    const id = window.setInterval(attachIfNeeded, VIDEO_ATTACH_CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(id);
      cleanupRef.current?.();
      cleanupRef.current = null;
      boundVideoRef.current = null;
    };
  }, [videoTextureRef]);

  const seek = useCallback(
    (time: number) => {
      const video = videoTextureRef.current?.image;

      if (video) {
        video.currentTime = time;
      }
    },
    [videoTextureRef]
  );

  return { seek };
}

export interface VideoControlOptions {
  isLooping: boolean;
  isPlaying: boolean;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  playbackRate: number;
  videoTextureRef: React.RefObject<VideoTexture | null>;
}
export interface VideoControlReturn {
  seek: (time: number) => void;
}

const VIDEO_ATTACH_CHECK_INTERVAL_MS = 300;
