import { ProjectionMode } from '@/shared/types';

import { PROJECTION_CAMERA_PRESETS } from '../camera/ProjectionCameraPresets';

import { ASPECT_RATIO_THRESHOLD, TRANSITION_DURATION } from './ProjectionPreviewService.constants';

import type { ProjectionCameraPreset, SceneConfig } from '@/shared/types';

export interface ProjectionPreview {
  cameraPreset: ProjectionCameraPreset;
  description: string;
  icon: string;
  mode: ProjectionMode;
  name: string;
  recommendedSettings: Partial<SceneConfig>;
}

export const getProjectionPreviewService = (): ProjectionPreviewServiceImpl =>
  ProjectionPreviewServiceImpl.getInstance();
const PROJECTION_METADATA: Record<
  ProjectionMode,
  { description: string; icon: string; name: string }
> = {
  [ProjectionMode.PLANE]: {
    name: '平面',
    description: '标准 2.5D 平面投影，适合展示照片和艺术作品',
    icon: '▭',
  },
  [ProjectionMode.SPHERE]: {
    name: '球面',
    description: '360° 沉浸式球面投影，适合全景图像',
    icon: '◯',
  },
  [ProjectionMode.CYLINDER]: {
    name: '圆柱',
    description: '环绕式圆柱投影，适合广角全景',
    icon: '⌭',
  },
  [ProjectionMode.DOME]: {
    name: '穹顶',
    description: '半球穹顶投影，模拟天空效果',
    icon: '⌓',
  },
  [ProjectionMode.PANORAMA]: {
    name: '全景',
    description: '水平 360° 全景投影',
    icon: '⟷',
  },
  [ProjectionMode.CUBE]: {
    name: '立方体',
    description: '立方体六面投影，完整包围视角',
    icon: '▣',
  },
  [ProjectionMode.INFINITE_BOX]: {
    name: '无限盒子',
    description: '带深度感的沉浸式房间效果',
    icon: '⧈',
  },
  [ProjectionMode.CORNER]: {
    name: '角落',
    description: '双墙角落投影，营造空间感',
    icon: '⌐',
  },
  [ProjectionMode.GAUSSIAN_SPLAT]: {
    name: '3D 高斯喷溅',
    description: '高级 3D 点云渲染模式',
    icon: '⦁',
  },
};
const PROJECTION_RECOMMENDED_SETTINGS: Partial<Record<ProjectionMode, Partial<SceneConfig>>> = {
  [ProjectionMode.PLANE]: {
    displacementScale: 1.2,
    edgeFade: 0.8,
    meshDensity: 192,
  },
  [ProjectionMode.SPHERE]: {
    displacementScale: 0.8,
    edgeFade: 0,
    meshDensity: 128,
    projectionAngle: 360,
  },
  [ProjectionMode.CYLINDER]: {
    displacementScale: 0.6,
    edgeFade: 0,
    meshDensity: 128,
    projectionAngle: 360,
  },
  [ProjectionMode.DOME]: {
    displacementScale: 0.6,
    edgeFade: 0,
    meshDensity: 128,
  },
  [ProjectionMode.PANORAMA]: {
    displacementScale: 0.4,
    edgeFade: 0,
    meshDensity: 128,
    projectionAngle: 360,
  },
  [ProjectionMode.CUBE]: {
    displacementScale: 0.5,
    edgeFade: 0,
    meshDensity: 64,
  },
  [ProjectionMode.INFINITE_BOX]: {
    displacementScale: 0.6,
    edgeFade: 0,
    meshDensity: 96,
  },
  [ProjectionMode.CORNER]: {
    displacementScale: 1.0,
    edgeFade: 0.3,
    meshDensity: 128,
  },
  [ProjectionMode.GAUSSIAN_SPLAT]: {
    displacementScale: 1.0,
    edgeFade: 0,
    meshDensity: 256,
  },
};

class ProjectionPreviewServiceImpl {
  private static instance: ProjectionPreviewServiceImpl | null = null;

  private constructor() {}

  static getInstance(): ProjectionPreviewServiceImpl {
    ProjectionPreviewServiceImpl.instance ??= new ProjectionPreviewServiceImpl();

    return ProjectionPreviewServiceImpl.instance;
  }

  findBestProjectionForAspectRatio(aspectRatio: number): ProjectionMode {
    if (aspectRatio >= ASPECT_RATIO_THRESHOLD.PANORAMA) {
      return ProjectionMode.PANORAMA;
    } else if (aspectRatio >= ASPECT_RATIO_THRESHOLD.CYLINDER) {
      return ProjectionMode.CYLINDER;
    } else if (aspectRatio <= ASPECT_RATIO_THRESHOLD.DOME) {
      return ProjectionMode.DOME;
    }

    return ProjectionMode.PLANE;
  }

  getAllPreviews(): ProjectionPreview[] {
    return Object.values(ProjectionMode).map((mode) => this.getPreview(mode));
  }

  getImmersivePreviews(): ProjectionPreview[] {
    return this.getAllPreviews().filter((p) => p.cameraPreset.immersive);
  }

  getNonImmersivePreviews(): ProjectionPreview[] {
    return this.getAllPreviews().filter((p) => !p.cameraPreset.immersive);
  }

  getPreview(mode: ProjectionMode): ProjectionPreview {
    const metadata = PROJECTION_METADATA[mode];
    const cameraPreset = PROJECTION_CAMERA_PRESETS[mode];
    const recommendedSettings = PROJECTION_RECOMMENDED_SETTINGS[mode] ?? {};

    return {
      mode,
      name: metadata.name,
      description: metadata.description,
      icon: metadata.icon,
      cameraPreset,
      recommendedSettings: {
        projectionMode: mode,
        ...recommendedSettings,
      },
    };
  }

  getRecommendedConfig(mode: ProjectionMode): Partial<SceneConfig> {
    const preview = this.getPreview(mode);

    return preview.recommendedSettings;
  }

  getTransitionDuration(from: ProjectionMode, to: ProjectionMode): number {
    const fromImmersive = PROJECTION_CAMERA_PRESETS[from].immersive;
    const toImmersive = PROJECTION_CAMERA_PRESETS[to].immersive;

    if (fromImmersive !== toImmersive) {
      return TRANSITION_DURATION.IMMERSIVE_CHANGE;
    }

    if (fromImmersive && toImmersive) {
      return TRANSITION_DURATION.IMMERSIVE_INTERNAL;
    }

    return TRANSITION_DURATION.DEFAULT;
  }
}

export { ProjectionPreviewServiceImpl as ProjectionPreviewService };
