import type { CameraPose, Vec3 } from '@/shared/types';

export type PresetType =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'corner-front-left'
  | 'corner-front-right'
  | 'corner-back-left'
  | 'corner-back-right';

export interface PresetConfig {
  fov: number;
  position: Vec3;
  target: Vec3;
  up: Vec3;
}

const PRESET_CONSTANTS = {
  DEFAULT_FOV: 55,
  CORNER_HORIZONTAL: 0.7,
  CORNER_VERTICAL: 0.5,
  DEFAULT_DISTANCE: 5,
  TOP_VIEW_OFFSET: 0.001,
} as const;

const PRESET_CONFIGS: Record<PresetType, (distance: number) => PresetConfig> = {
  front: (d) => ({
    fov: PRESET_CONSTANTS.DEFAULT_FOV,
    position: { x: 0, y: 0, z: d },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
  }),
  back: (d) => ({
    fov: PRESET_CONSTANTS.DEFAULT_FOV,
    position: { x: 0, y: 0, z: -d },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
  }),
  left: (d) => ({
    fov: PRESET_CONSTANTS.DEFAULT_FOV,
    position: { x: -d, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
  }),
  right: (d) => ({
    fov: PRESET_CONSTANTS.DEFAULT_FOV,
    position: { x: d, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
  }),
  top: (d) => ({
    fov: PRESET_CONSTANTS.DEFAULT_FOV,
    position: { x: 0, y: d, z: PRESET_CONSTANTS.TOP_VIEW_OFFSET },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 0, z: -1 },
  }),
  bottom: (d) => ({
    fov: PRESET_CONSTANTS.DEFAULT_FOV,
    position: { x: 0, y: -d, z: PRESET_CONSTANTS.TOP_VIEW_OFFSET },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 0, z: 1 },
  }),
  'corner-front-left': (d) => ({
    fov: PRESET_CONSTANTS.DEFAULT_FOV,
    position: {
      x: -d * PRESET_CONSTANTS.CORNER_HORIZONTAL,
      y: d * PRESET_CONSTANTS.CORNER_VERTICAL,
      z: d * PRESET_CONSTANTS.CORNER_HORIZONTAL,
    },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
  }),
  'corner-front-right': (d) => ({
    fov: PRESET_CONSTANTS.DEFAULT_FOV,
    position: {
      x: d * PRESET_CONSTANTS.CORNER_HORIZONTAL,
      y: d * PRESET_CONSTANTS.CORNER_VERTICAL,
      z: d * PRESET_CONSTANTS.CORNER_HORIZONTAL,
    },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
  }),
  'corner-back-left': (d) => ({
    fov: PRESET_CONSTANTS.DEFAULT_FOV,
    position: {
      x: -d * PRESET_CONSTANTS.CORNER_HORIZONTAL,
      y: d * PRESET_CONSTANTS.CORNER_VERTICAL,
      z: -d * PRESET_CONSTANTS.CORNER_HORIZONTAL,
    },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
  }),
  'corner-back-right': (d) => ({
    fov: PRESET_CONSTANTS.DEFAULT_FOV,
    position: {
      x: d * PRESET_CONSTANTS.CORNER_HORIZONTAL,
      y: d * PRESET_CONSTANTS.CORNER_VERTICAL,
      z: -d * PRESET_CONSTANTS.CORNER_HORIZONTAL,
    },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
  }),
};

export function calculatePresetPose(preset: PresetType, currentDistance: number): CameraPose {
  const configFn = PRESET_CONFIGS[preset];

  if (!configFn) {
    return createDefaultPose(currentDistance);
  }

  const config = configFn(currentDistance);

  return {
    ...config,
    near: 0.1,
    far: 1000,
  };
}

export function createDefaultPose(
  distance: number = PRESET_CONSTANTS.DEFAULT_DISTANCE
): CameraPose {
  return {
    fov: PRESET_CONSTANTS.DEFAULT_FOV,
    position: { x: 0, y: 0, z: distance },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    near: 0.1,
    far: 1000,
  };
}

export function calculateDistance(position: Vec3, target: Vec3): number {
  const dx = position.x - target.x;
  const dy = position.y - target.y;
  const dz = position.z - target.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
