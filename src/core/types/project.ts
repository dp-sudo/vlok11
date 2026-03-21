import type { AnalysisResult, Asset } from '@/core/domain/types';
import type { PrecisionControlConfig } from '@/features/scene/services/camera/PrecisionConfigService';
import type { CameraViewPreset, SceneConfig } from '@/shared/types';

export interface ProjectMeta {
  name: string;
  createdAt: number;
  lastModified: number;
  version: string; // e.g., "1.0.0"
}

export interface ProjectAssets {
  assetId?: string;
  backgroundPath?: string;
  depthMapPath?: string;
  imagePath?: string;
  inlineDataUrl?: string;
  inlineFileName?: string;
  inlineMimeType?: string;
  sourceAsset?: Asset;
  sourceType: 'image' | 'video';
  sourcePath: string;
}

export interface ProjectResourceSnapshot {
  dataUrl?: string;
  mimeType?: string;
  path: string;
}

export interface ProjectProcessingSnapshot {
  analysis: AnalysisResult;
  background?: ProjectResourceSnapshot;
  depthMap: ProjectResourceSnapshot;
  image: ProjectResourceSnapshot;
  processingTime: number;
}

export interface SceneState {
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
    preset?: CameraViewPreset;
  };
  config: SceneConfig;
  precision: PrecisionControlConfig;
  video?: {
    currentTime: number;
    duration: number;
    isLooping: boolean;
    isMuted: boolean;
    isPlaying: boolean;
    playbackRate: number;
  };
}

export interface ProjectData {
  meta: ProjectMeta;
  assets: ProjectAssets;
  processing?: ProjectProcessingSnapshot;
  scene: SceneState;
}
