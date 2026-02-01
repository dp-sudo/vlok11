import { CAMERA } from '@/shared/constants';
import type { CameraPose, Vec3 } from '@/shared/types';
import { ProjectionMode } from '@/shared/types';
import { calculateDistance } from '@/shared/utils';

export function calculatePresetPose(
  presetId: CameraPresetType,
  currentDistance?: number
): Omit<CameraPose, 'fov'> {
  const preset = getPresetById(presetId);

  if (!preset) {
    const defaultPreset = CAMERA_PRESETS[DEFAULT_PRESET_INDEX];

    if (!defaultPreset) throw new Error('CAMERA_PRESETS is empty');

    return defaultPreset.pose;
  }

  const basePose = preset.pose;

  if (currentDistance !== undefined && currentDistance > 0) {
    const baseDistance = getDistanceFromPose(basePose);

    if (baseDistance > 0) {
      const scale = currentDistance / baseDistance;

      return {
        position: scaleVec3(basePose.position, scale),
        target: basePose.target,
        up: basePose.up,
      };
    }
  }

  return basePose;
}
export function calculatePresetPoseForProjection(
  presetId: CameraPresetType,
  projectionMode: ProjectionMode,
  isImmersive: boolean,
  currentDistance?: number
): Omit<CameraPose, 'fov'> {
  const basePose = calculatePresetPose(presetId, currentDistance);

  if (isImmersive && IMMERSIVE_PROJECTION_MODES.includes(projectionMode)) {
    const dir = normalizeVec3(basePose.position);

    return {
      position: scaleVec3(dir, CAMERA.IMMERSIVE_DISTANCE),
      target: { x: 0, y: 0, z: 0 },
      up: basePose.up,
    };
  }

  return basePose;
}
export function getDefaultPreset(): PresetConfig {
  const preset = CAMERA_PRESETS[DEFAULT_PRESET_INDEX];

  if (!preset) throw new Error('CAMERA_PRESETS is empty');

  return preset;
}
export function getDistanceFromPose(pose: Omit<CameraPose, 'fov'>): number {
  return calculateDistance(pose.position, pose.target);
}
export function getPresetById(id: CameraPresetType): PresetConfig | undefined {
  return CAMERA_PRESETS.find((p) => p.id === id);
}
export function getPresetPose(id: CameraPresetType): Omit<CameraPose, 'fov'> | undefined {
  return getPresetById(id)?.pose;
}
export function scaleVec3(v: Vec3, scale: number): Vec3 {
  return { x: v.x * scale, y: v.y * scale, z: v.z * scale };
}

export type CameraPresetType = 'FRONT' | 'TOP' | 'SIDE' | 'ISO' | 'FOCUS';

export interface PresetConfig {
  id: CameraPresetType;
  name: string;
  pose: Omit<CameraPose, 'fov'>;
}

export const CAMERA_PRESETS: PresetConfig[] = [
  {
    id: 'FRONT',
    name: '正面',
    pose: {
      position: { x: 0, y: 0, z: 10 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
    },
  },
  {
    id: 'TOP',
    name: '俯视',
    pose: {
      position: { x: 0, y: 10, z: 0.01 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 0, z: -1 },
    },
  },
  {
    id: 'SIDE',
    name: '侧面',
    pose: {
      position: { x: 10, y: 0, z: 0 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
    },
  },
  {
    id: 'ISO',
    name: '等轴',
    pose: {
      position: { x: 7, y: 7, z: 7 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
    },
  },
  {
    id: 'FOCUS',
    name: '聚焦',
    pose: {
      position: { x: 0, y: 0, z: 5 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
    },
  },
];
const DEFAULT_PRESET_INDEX = 0;
const IMMERSIVE_PROJECTION_MODES: ProjectionMode[] = [
  ProjectionMode.CYLINDER,
  ProjectionMode.PANORAMA,
  ProjectionMode.SPHERE,
  ProjectionMode.DOME,
  ProjectionMode.INFINITE_BOX,
  ProjectionMode.CORNER,
  ProjectionMode.CUBE,
];

function normalizeVec3(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

  if (len === 0) return { x: 0, y: 0, z: 1 };

  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export { calculateDistance } from '@/shared/utils';
