import type { AnalysisResult, AssetType, RecommendedConfig } from '@/core/domain/types';
import { DEFAULT_FOV, SCENE_CONFIG } from '@/shared/constants';
import { CameraMotionType, ColorGradePreset, SceneType } from '@/shared/types';

interface ConfigContext {
  analysis: AnalysisResult;
  assetType: AssetType;
}

function recommendColorGrade(keywords: string[]): ColorGradePreset {
  const k = keywords.map((s) => s.toLowerCase());

  if (k.some((w) => ['neon', 'cyber', 'night', 'city', 'future'].includes(w))) {
    return ColorGradePreset.CYBERPUNK;
  }
  if (k.some((w) => ['sunset', 'warm', 'desert', 'fire'].includes(w))) {
    return ColorGradePreset.WARM;
  }
  if (k.some((w) => ['winter', 'snow', 'cold', 'ice', 'blue'].includes(w))) {
    return ColorGradePreset.COLD;
  }
  if (k.some((w) => ['forest', 'nature', 'mountain'].includes(w))) {
    return ColorGradePreset.CINEMATIC;
  }
  if (k.some((w) => ['old', 'retro', 'vintage', '1980', '1990'].includes(w))) {
    return ColorGradePreset.VINTAGE;
  }

  return ColorGradePreset.NONE;
}

export function deriveSceneConfig(context: ConfigContext): RecommendedConfig {
  const { analysis, assetType } = context;

  const config: RecommendedConfig = {
    displacementScale: analysis.estimatedDepthScale || SCENE_CONFIG.DEFAULT_DEPTH_SCALE,
    fov: analysis.recommendedFov || DEFAULT_FOV,
    colorGrade: ColorGradePreset.NONE,
    enableFog: false,
    enableVignette: true,
    cameraMotion: CameraMotionType.STATIC,
    videoLoop: true,
  };

  switch (analysis.sceneType) {
    case SceneType.OUTDOOR:
      config.enableFog = true;
      config.displacementScale *= SCENE_CONFIG.OUTDOOR_DEPTH_MULTIPLIER;
      config.cameraMotion = CameraMotionType.ORBIT;
      break;

    case SceneType.INDOOR:
      config.fov = SCENE_CONFIG.INDOOR_FOV;
      config.cameraMotion = CameraMotionType.DOLLY_ZOOM;
      break;

    case SceneType.OBJECT:
      config.displacementScale *= SCENE_CONFIG.OBJECT_DEPTH_MULTIPLIER;
      config.cameraMotion = CameraMotionType.ARC;
      config.enableVignette = true;
      break;
  }

  if (assetType === 'video') {
    config.cameraMotion = CameraMotionType.STATIC;
    config.videoLoop = true;
  }

  config.colorGrade = recommendColorGrade(analysis.keywords ?? []);

  return config;
}

export const SceneConfigurator = {
  deriveConfig: deriveSceneConfig,
};
