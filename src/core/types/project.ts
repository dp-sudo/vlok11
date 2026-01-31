import type { PrecisionControlConfig } from '@/features/scene/services/camera/PrecisionConfigService';
import type { CameraViewPreset } from '@/shared/types';

export interface ProjectMeta {
  name: string;
  createdAt: number;
  lastModified: number;
  version: string; // e.g., "1.0.0"
}

export interface ProjectAssets {
  sourceType: 'image' | 'video';
  sourcePath: string; // Absolute path on disk
  depthMapPath?: string; // Absolute path on disk (if cached/saved)
}

export interface SceneState {
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
    preset?: CameraViewPreset;
  };
  precision: PrecisionControlConfig;
  video?: {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
  };
}

export interface ProjectData {
  meta: ProjectMeta;
  assets: ProjectAssets;
  scene: SceneState;
}
