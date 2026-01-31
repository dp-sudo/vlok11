import { ProjectionMode } from '@/shared/types';

import type { CameraTransitionConfig, ProjectionCameraPreset } from '@/shared/types';

export function getPresetForProjection(mode: ProjectionMode): ProjectionCameraPreset {
  return PROJECTION_CAMERA_PRESETS[mode];
}
export function getTransitionConfig(
  fromMode: ProjectionMode,
  toMode: ProjectionMode
): CameraTransitionConfig {
  const fromPreset = PROJECTION_CAMERA_PRESETS[fromMode];
  const toPreset = PROJECTION_CAMERA_PRESETS[toMode];

  if (fromPreset.immersive !== toPreset.immersive) {
    return { ...DEFAULT_TRANSITION_CONFIG, duration: 800 };
  }

  if (fromPreset.immersive && toPreset.immersive) {
    return QUICK_TRANSITION_CONFIG;
  }

  return DEFAULT_TRANSITION_CONFIG;
}

export const DEFAULT_TRANSITION_CONFIG: CameraTransitionConfig = {
  duration: 600,
  easing: 'ease-in-out-cubic',
  preserveDistance: false,
  preserveDirection: true,
};
const ORIGIN = { x: 0, y: 0, z: 0 };

export const PROJECTION_CAMERA_PRESETS: Record<ProjectionMode, ProjectionCameraPreset> = {
  [ProjectionMode.PLANE]: {
    idealDistance: 9,
    idealFov: 55,
    targetOffset: ORIGIN,
    positionHint: 'front',
    immersive: false,
    distanceLimits: { min: 1.5, max: 40 },
  },
  [ProjectionMode.SPHERE]: {
    idealDistance: 0.1,
    idealFov: 75,
    targetOffset: ORIGIN,
    positionHint: 'inside',
    immersive: true,
    distanceLimits: { min: 0.01, max: 10 },
  },
  [ProjectionMode.CYLINDER]: {
    idealDistance: 0.1,
    idealFov: 70,
    targetOffset: ORIGIN,
    positionHint: 'inside',
    immersive: true,
    distanceLimits: { min: 0.01, max: 6 },
  },
  [ProjectionMode.DOME]: {
    idealDistance: 0.1,
    idealFov: 75,
    targetOffset: ORIGIN,
    positionHint: 'inside',
    immersive: true,
    distanceLimits: { min: 0.01, max: 10 },
  },
  [ProjectionMode.PANORAMA]: {
    idealDistance: 0.1,
    idealFov: 90,
    targetOffset: ORIGIN,
    positionHint: 'inside',
    immersive: true,
    distanceLimits: { min: 0.01, max: 8 },
  },
  [ProjectionMode.CUBE]: {
    idealDistance: 0.1,
    idealFov: 70,
    targetOffset: ORIGIN,
    positionHint: 'inside',
    immersive: true,
    distanceLimits: { min: 0.01, max: 12 },
  },
  [ProjectionMode.INFINITE_BOX]: {
    idealDistance: 0.1,
    idealFov: 65,
    targetOffset: ORIGIN,
    positionHint: 'inside',
    immersive: true,
    distanceLimits: { min: 0.01, max: 14 },
  },
  [ProjectionMode.CORNER]: {
    idealDistance: 4,
    idealFov: 60,
    targetOffset: { x: 0, y: 0, z: -2 },
    positionHint: 'front',
    immersive: true,
    distanceLimits: { min: 0.01, max: 12 },
  },
  [ProjectionMode.GAUSSIAN_SPLAT]: {
    idealDistance: 9,
    idealFov: 55,
    targetOffset: ORIGIN,
    positionHint: 'front',
    immersive: false,
    distanceLimits: { min: 1.5, max: 40 },
  },
};
export const QUICK_TRANSITION_CONFIG: CameraTransitionConfig = {
  duration: 300,
  easing: 'ease-out-cubic',
  preserveDistance: true,
  preserveDirection: true,
};
