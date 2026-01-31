import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { createSceneSlice, type SceneSlice } from './sceneConfigStore';
import { createSessionSlice, type SessionSlice } from './sessionStore';
import { createVideoSlice, type VideoSlice } from './videoStore';

type AppStore = SessionSlice & VideoSlice & SceneSlice;

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((...a) => ({
    ...createVideoSlice(...a),
    ...createSessionSlice(...a),
    ...createSceneSlice(...a),
  }))
);

// Selector hooks for optimized subscriptions
export const useCameraMotionType = () => useAppStore((s) => s.config.cameraMotionType);
export const useCurrentAsset = () => useAppStore((s) => s.currentAsset);
export const useDisplacementScale = () => useAppStore((s) => s.config.displacementScale);
export const useExportState = () => useAppStore((s) => s.exportState);
export const useIsImmersive = () => useAppStore((s) => s.config.isImmersive);
export const useIsPlaying = () => useAppStore((s) => s.isPlaying);
export const useProcessingResult = () => useAppStore((s) => s.result);
export const useProcessingStatus = () => useAppStore((s) => s.status);
export const useProjectionMode = () => useAppStore((s) => s.config.projectionMode);
export const useRenderStyle = () => useAppStore((s) => s.config.renderStyle);
export const useSceneStore = useAppStore;
export const useSessionStore = useAppStore;

// Optimized video state selector using shallow comparison
export const useVideoState = () =>
  useAppStore((s) => [s.currentTime, s.duration, s.isMuted, s.isPlaying]);

// Individual video state selectors to avoid unnecessary re-renders
export const useCurrentTime = () => useAppStore((s) => s.currentTime);
export const useDuration = () => useAppStore((s) => s.duration);
export const useIsMuted = () => useAppStore((s) => s.isMuted);
