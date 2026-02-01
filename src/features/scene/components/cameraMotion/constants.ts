import type { MotionType } from '@/shared/types';
import { CameraMotionType, ProjectionMode } from '@/shared/types';

export const ANIMATION = {
  BASE_CAPTURE_DELAY_MS: 50,
  CINEMATIC_LERP_MAX: 0.12,
  CINEMATIC_LERP_MULTIPLIER: 3.5,
  FOV_LERP_FACTOR: 0.08,
  FOV_THRESHOLD: 0.5,
  MANUAL_BLEND_FACTOR: 0.35,
  EASE_OUT_POWER: 3,
} as const;
export const CAMERA_DEFAULTS = {
  INITIAL_DISTANCE: 9,
  IMMERSIVE_DISTANCE: 2,
  MIN_DISTANCE_THRESHOLD: 0.01,
  FOV: 55,
} as const;
export const IMMERSIVE_MODES: ProjectionMode[] = [
  ProjectionMode.INFINITE_BOX,
  ProjectionMode.CORNER,
  ProjectionMode.CUBE,
  ProjectionMode.PANORAMA,
  ProjectionMode.SPHERE,
  ProjectionMode.DOME,
  ProjectionMode.CYLINDER,
];
export const MOTION_SCALE_BY_PROJECTION: Record<ProjectionMode, number> = {
  [ProjectionMode.CUBE]: 0.2,
  [ProjectionMode.INFINITE_BOX]: 0.15,
  [ProjectionMode.CORNER]: 0.3,
  [ProjectionMode.CYLINDER]: 0.5,
  [ProjectionMode.DOME]: 0.6,
  [ProjectionMode.SPHERE]: 0.6,
  [ProjectionMode.PANORAMA]: 0.1,
  [ProjectionMode.PLANE]: 1.0,
  [ProjectionMode.GAUSSIAN_SPLAT]: 1.0,
};
export const MOTION_TYPE_MAP: Record<CameraMotionType, MotionType> = {
  [CameraMotionType.STATIC]: 'STATIC',
  [CameraMotionType.ORBIT]: 'ORBIT',
  [CameraMotionType.FLY_BY]: 'FLY_BY',
  [CameraMotionType.SPIRAL]: 'SPIRAL',
  [CameraMotionType.ARC]: 'ARC',
  [CameraMotionType.TRACKING]: 'TRACKING',
  [CameraMotionType.DOLLY_ZOOM]: 'DOLLY_ZOOM',
};
export const toMotionType = (type: CameraMotionType): MotionType => {
  return MOTION_TYPE_MAP[type] || 'STATIC';
};
