import type { SceneConfig } from '@/shared/types';
import {
  CameraMode,
  CameraMotionType,
  ColorGradePreset,
  ProjectionMode,
  RenderStyle,
} from '@/shared/types';

/**
 * 预设系统类型定义
 */
export interface RenderStylePreset {
  id: string;
  name: string;
  config: Partial<SceneConfig>;
}

export interface MotionPreset {
  id: string;
  name: string;
  cameraMotionType: CameraMotionType;
  config: Partial<SceneConfig>;
}

export interface ProjectionPreset {
  id: string;
  name: string;
  projectionMode: ProjectionMode;
  isImmersive: boolean;
  config: Partial<SceneConfig>;
}

export interface ScenePreset {
  id: string;
  name: string;
  description: string;
  config: Partial<SceneConfig>;
}

/**
 * 渲染风格预设
 */
export const RENDER_STYLE_PRESETS: RenderStylePreset[] = [
  {
    id: 'normal',
    name: 'Normal (Standard)',
    config: {
      renderStyle: RenderStyle.NORMAL,
      roughness: 0.4,
      metalness: 0.2,
      lightIntensity: 1.5,
      exposure: 1.0,
    },
  },
  {
    id: 'anime',
    name: 'Anime Style',
    config: {
      renderStyle: RenderStyle.ANIME,
      roughness: 0.6,
      metalness: 0.1,
      lightIntensity: 1.8,
      animeShadowSteps: 4,
      animeOutlineWidth: 0.02,
      animeHighlightSharpness: 0.8,
    },
  },
  {
    id: 'cel',
    name: 'Cel Shading',
    config: {
      renderStyle: RenderStyle.CEL_SHADING,
      roughness: 0.7,
      metalness: 0.05,
      lightIntensity: 1.6,
      celColorBands: 3,
      celOutlineThickness: 0.015,
    },
  },
  {
    id: 'crystal',
    name: 'Crystal',
    config: {
      renderStyle: RenderStyle.CRYSTAL,
      roughness: 0.1,
      metalness: 0.3,
      lightIntensity: 2.0,
      crystalTransmission: 0.9,
      crystalIOR: 1.5,
      crystalDispersion: 0.5,
    },
  },
  {
    id: 'hologram',
    name: 'Hologram',
    config: {
      renderStyle: RenderStyle.HOLOGRAM_V2,
      roughness: 0.2,
      metalness: 0.8,
      lightIntensity: 1.2,
      hologramV2FresnelPower: 2.0,
      hologramV2ScanlineDensity: 200,
      hologramV2RGBOffset: 0.003,
    },
  },
  {
    id: 'ink-wash',
    name: 'Ink Wash',
    config: {
      renderStyle: RenderStyle.INK_WASH,
      roughness: 0.9,
      metalness: 0.0,
      lightIntensity: 1.3,
      inkWashInkDensity: 0.7,
      inkWashBleedAmount: 0.3,
    },
  },
  {
    id: 'matrix',
    name: 'Matrix',
    config: {
      renderStyle: RenderStyle.MATRIX,
      roughness: 0.5,
      metalness: 0.4,
      lightIntensity: 1.0,
      matrixCharDensity: 0.8,
      matrixGlowIntensity: 0.6,
      matrixShowOriginal: 0.3,
    },
  },
  {
    id: 'retro',
    name: 'Retro',
    config: {
      renderStyle: RenderStyle.RETRO_PIXEL,
      roughness: 0.6,
      metalness: 0.2,
      lightIntensity: 1.4,
      retroPixelSize: 4,
      retroCRTEffect: 0.5,
      retroScanlineBrightness: 0.3,
    },
  },
];

/**
 * 运动预设
 */
export const MOTION_PRESETS: MotionPreset[] = [
  {
    id: 'static',
    name: 'Static (No Motion)',
    cameraMotionType: CameraMotionType.STATIC,
    config: {
      cameraMotionType: CameraMotionType.STATIC,
      autoRotate: false,
    },
  },
  {
    id: 'orbit',
    name: 'Orbit',
    cameraMotionType: CameraMotionType.ORBIT,
    config: {
      cameraMotionType: CameraMotionType.ORBIT,
      orbitRadius: 10,
      orbitTilt: 15,
    },
  },
  {
    id: 'fly-by',
    name: 'Fly By',
    cameraMotionType: CameraMotionType.FLY_BY,
    config: {
      cameraMotionType: CameraMotionType.FLY_BY,
      flyByHeight: 5,
      flyBySwing: 20,
    },
  },
  {
    id: 'spiral',
    name: 'Spiral',
    cameraMotionType: CameraMotionType.SPIRAL,
    config: {
      cameraMotionType: CameraMotionType.SPIRAL,
      spiralLoops: 2,
      spiralHeight: 8,
    },
  },
  {
    id: 'arc',
    name: 'Arc',
    cameraMotionType: CameraMotionType.ARC,
    config: {
      cameraMotionType: CameraMotionType.ARC,
      arcAngle: 90,
      arcRhythm: 1,
    },
  },
  {
    id: 'tracking',
    name: 'Tracking',
    cameraMotionType: CameraMotionType.TRACKING,
    config: {
      cameraMotionType: CameraMotionType.TRACKING,
      trackingDistance: 12,
      trackingOffset: 0,
    },
  },
  {
    id: 'dolly-zoom',
    name: 'Dolly Zoom',
    cameraMotionType: CameraMotionType.DOLLY_ZOOM,
    config: {
      cameraMotionType: CameraMotionType.DOLLY_ZOOM,
      dollyRange: 20,
      dollyIntensity: 1,
    },
  },
];

/**
 * 投影模式预设
 */
export const PROJECTION_PRESETS: ProjectionPreset[] = [
  {
    id: 'plane',
    name: 'Plane (2D)',
    projectionMode: ProjectionMode.PLANE,
    isImmersive: false,
    config: {
      projectionMode: ProjectionMode.PLANE,
      isImmersive: false,
      projectionAngle: 180,
    },
  },
  {
    id: 'corner',
    name: 'Corner',
    projectionMode: ProjectionMode.CORNER,
    isImmersive: true,
    config: {
      projectionMode: ProjectionMode.CORNER,
      isImmersive: true,
    },
  },
  {
    id: 'cube',
    name: 'Cube Room',
    projectionMode: ProjectionMode.CUBE,
    isImmersive: true,
    config: {
      projectionMode: ProjectionMode.CUBE,
      isImmersive: true,
    },
  },
  {
    id: 'sphere',
    name: 'Sphere',
    projectionMode: ProjectionMode.SPHERE,
    isImmersive: true,
    config: {
      projectionMode: ProjectionMode.SPHERE,
      isImmersive: true,
    },
  },
  {
    id: 'dome',
    name: 'Dome',
    projectionMode: ProjectionMode.DOME,
    isImmersive: true,
    config: {
      projectionMode: ProjectionMode.DOME,
      isImmersive: true,
    },
  },
  {
    id: 'cylinder',
    name: 'Cylinder',
    projectionMode: ProjectionMode.CYLINDER,
    isImmersive: true,
    config: {
      projectionMode: ProjectionMode.CYLINDER,
      isImmersive: true,
    },
  },
  {
    id: 'panorama',
    name: 'Panorama',
    projectionMode: ProjectionMode.PANORAMA,
    isImmersive: true,
    config: {
      projectionMode: ProjectionMode.PANORAMA,
      isImmersive: true,
    },
  },
  {
    id: 'infinite-box',
    name: 'Infinite Box',
    projectionMode: ProjectionMode.INFINITE_BOX,
    isImmersive: true,
    config: {
      projectionMode: ProjectionMode.INFINITE_BOX,
      isImmersive: true,
    },
  },
];

/**
 * 综合场景预设
 */
export const SCENE_PRESETS: ScenePreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard 3D view with basic settings',
    config: {},
  },
  {
    id: 'immersive-cinema',
    name: 'Immersive Cinema',
    description: 'Deep immersive experience with cinematic colors',
    config: {
      isImmersive: true,
      projectionMode: ProjectionMode.DOME,
      cameraMotionType: CameraMotionType.ORBIT,
      colorGrade: ColorGradePreset.CINEMATIC,
      exposure: 1.1,
      contrast: 1.1,
      saturation: 0.95,
    },
  },
  {
    id: 'anime-showcase',
    name: 'Anime Showcase',
    description: 'Optimized for anime-style rendering',
    config: {
      renderStyle: RenderStyle.ANIME,
      cameraMotionType: CameraMotionType.ORBIT,
      autoRotate: true,
      cameraMotionSpeed: 0.3,
      colorGrade: ColorGradePreset.JAPANESE,
      brightness: 1.05,
      saturation: 1.1,
    },
  },
  {
    id: 'product-display',
    name: 'Product Display',
    description: 'Clean display for product showcase',
    config: {
      cameraMode: CameraMode.PERSPECTIVE,
      cameraMotionType: CameraMotionType.ORBIT,
      orbitRadius: 12,
      orbitTilt: 20,
      renderStyle: RenderStyle.NORMAL,
      roughness: 0.3,
      metalness: 0.4,
      lightIntensity: 2.0,
      showGrid: true,
    },
  },
  {
    id: 'holographic-display',
    name: 'Holographic Display',
    description: 'Futuristic hologram effect',
    config: {
      renderStyle: RenderStyle.HOLOGRAM_V2,
      cameraMotionType: CameraMotionType.SPIRAL,
      spiralLoops: 3,
      spiralHeight: 6,
      projectionMode: ProjectionMode.PLANE,
      isImmersive: false,
      exposure: 1.2,
    },
  },
  {
    id: 'retro-arcade',
    name: 'Retro Arcade',
    description: 'Retro gaming aesthetic',
    config: {
      renderStyle: RenderStyle.RETRO_PIXEL,
      cameraMotionType: CameraMotionType.ORBIT,
      autoRotate: true,
      cameraMotionSpeed: 0.4,
      retroPixelSize: 6,
      retroCRTEffect: 0.7,
      colorGrade: ColorGradePreset.VINTAGE,
      saturation: 1.2,
    },
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, minimal aesthetic',
    config: {
      renderStyle: RenderStyle.NORMAL,
      roughness: 0.5,
      metalness: 0.1,
      lightIntensity: 1.2,
      exposure: 1.0,
      saturation: 0.9,
      contrast: 1.0,
      showGrid: false,
      showAxes: false,
    },
  },
  {
    id: 'stereo-view',
    name: 'Stereo View',
    description: 'Anaglyph 3D for red-blue glasses',
    config: {
      renderStyle: RenderStyle.NORMAL,
      enableNakedEye3D: false,
      cameraMotionType: CameraMotionType.STATIC,
      isImmersive: true,
      projectionMode: ProjectionMode.PLANE,
    },
  },
];

/**
 * 根据ID获取渲染预设
 */
export function getRenderStylePreset(id: string): RenderStylePreset | undefined {
  return RENDER_STYLE_PRESETS.find((p) => p.id === id);
}

/**
 * 根据ID获取运动预设
 */
export function getMotionPreset(id: string): MotionPreset | undefined {
  return MOTION_PRESETS.find((p) => p.id === id);
}

/**
 * 根据ID获取投影预设
 */
export function getProjectionPreset(id: string): ProjectionPreset | undefined {
  return PROJECTION_PRESETS.find((p) => p.id === id);
}

/**
 * 根据ID获取场景预设
 */
export function getScenePreset(id: string): ScenePreset | undefined {
  return SCENE_PRESETS.find((p) => p.id === id);
}

/**
 * 验证并清理配置（移除undefined值）
 */
export function sanitizeConfig(config: Partial<SceneConfig>): Partial<SceneConfig> {
  const sanitized: Partial<SceneConfig> = {};

  for (const [key, value] of Object.entries(config)) {
    if (value !== undefined) {
      (sanitized as Record<string, unknown>)[key] = value;
    }
  }

  return sanitized;
}
