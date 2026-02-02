import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [seekError, setSeekError] = useState<string | null>(null);
  const [isSeekable, setIsSeekable] = useState(false);

  useEffect(() => {
    callbacksRef.current = { onTimeUpdate, onDurationChange, onEnded };
  }, [onTimeUpdate, onDurationChange, onEnded]);

  useEffect(() => {
    const video = videoTextureRef.current?.image;

    if (!video) {
      setIsSeekable(false);

      return;
    }

    setIsSeekable(true);

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

      if (!video) {
        setIsSeekable(false);

        return;
      }

      setIsSeekable(true);

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

        if (!d || Number.isNaN(d)) {
          setIsSeekable(false);

          return;
        }

        setIsSeekable(true);
        if (lastDurationRef.current !== d) {
          lastDurationRef.current = d;
          callbacksRef.current.onDurationChange?.(d);
        }
      };

      const handleEnded = () => {
        callbacksRef.current.onEnded?.();
      };

      const handleCanSeek = () => {
        setIsSeekable(video.duration > 0);
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('durationchange', handleDurationChange);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('canplay', handleCanSeek);

      handleDurationChange();
      handleCanSeek();

      cleanupRef.current = () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('durationchange', handleDurationChange);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('canplay', handleCanSeek);
      };
    };

    attachIfNeeded();
    // Use a ref to track the timeout/interval to avoid stale closures
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        attachIfNeeded();
      }
    }, VIDEO_ATTACH_CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      cleanupRef.current?.();
      cleanupRef.current = null;
      boundVideoRef.current = null;
    };
  }, [videoTextureRef]);

  const seek = useCallback(
    (time: number) => {
      const video = videoTextureRef.current?.image;

      if (!video) {
        setSeekError('Video not loaded');

        return false;
      }

      if (!Number.isFinite(time) || time < 0) {
        setSeekError('Invalid seek time');

        return false;
      }

      try {
        const clampedTime = Math.max(0, Math.min(time, video.duration || 0));

        video.currentTime = clampedTime;
        setSeekError(null);

        return true;
      } catch (_err) {
        setSeekError('Seek failed');

        return false;
      }
    },
    [videoTextureRef]
  );

  return { seek, isSeekable, seekError };
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
  seek: (time: number) => boolean;
  isSeekable: boolean;
  seekError: string | null;
}

const VIDEO_ATTACH_CHECK_INTERVAL_MS = 300;
