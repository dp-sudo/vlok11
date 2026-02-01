import type {
  CameraMode,
  CameraMotionType,
  ColorGradePreset,
  MirrorMode,
  ProjectionMode,
  RenderStyle,
} from '@/core/domain/types';
import type { BlendMode } from './index';

export interface CameraControlConfig {
  autoRotate: boolean;
  cameraMode: CameraMode;
  cameraMotionBlend: BlendMode;
  cameraMotionSpeed: number;
  cameraMotionType: CameraMotionType;
  dampingFactor: number;
  enablePan: boolean;
  fov: number;
  maxDistance: number;
  maxPolarAngle: number;
  minDistance: number;
  minPolarAngle: number;
  orthoZoom: number;
  orthoZoomMax?: number;
  orthoZoomMin?: number;
  panSpeed: number;
  rotateSpeed: number;
  zoomSpeed: number;
}

export interface MotionParamsConfig {
  arcAngle: number;
  arcRhythm: number;
  dollyIntensity: number;
  dollyRange: number;
  flyByHeight: number;
  flyBySwing: number;
  motionResumeDelayMs: number;
  motionResumeTransitionMs: number;
  orbitRadius: number;
  orbitTilt: number;
  spiralHeight: number;
  spiralLoops: number;
  trackingDistance: number;
  trackingOffset: number;
}

export interface RenderMeshConfig {
  depthInvert: boolean;
  displacementScale: number;
  edgeFade: number;
  isImmersive: boolean;
  meshDensity: number;
  metalness: number;
  mirrorMode: MirrorMode;
  projectionAngle: number;
  projectionMode: ProjectionMode;
  renderStyle: RenderStyle;
  roughness: number;
  verticalShift: number;
  wireframe: boolean;
}

export interface PostProcessConfig {
  brightness: number;
  colorGrade: ColorGradePreset;
  contrast: number;
  depthFog: number;
  enableFrameInterpolation: boolean;
  enableNakedEye3D: boolean;
  enableParticles: boolean;
  enableVignette: boolean;
  exposure: number;
  lightAngleX: number;
  lightAngleY: number;
  lightIntensity: number;
  particleType: string;
  saturation: number;
  vignetteStrength: number;
}

export interface AnimeStyleConfig {
  animeHighlightSharpness?: number;
  animeOutlineWidth?: number;
  animeShadowSteps?: number;
  animeShadowThreshold?: number;
  animeSkinToneBoost?: number;
}

export interface CelStyleConfig {
  celColorBands?: number;
  celHalftoneSize?: number;
  celOutlineThickness?: number;
  celSpecularSize?: number;
}

export interface CrystalStyleConfig {
  crystalCaustics?: number;
  crystalDispersion?: number;
  crystalFresnelPower?: number;
  crystalIOR?: number;
  crystalTransmission?: number;
}

export interface HologramStyleConfig {
  hologramV2DataStreamSpeed?: number;
  hologramV2FlickerSpeed?: number;
  hologramV2FresnelPower?: number;
  hologramV2GlitchIntensity?: number;
  hologramV2RGBOffset?: number;
  hologramV2ScanlineDensity?: number;
  hologramV2ScanlineIntensity?: number;
}

export interface InkWashStyleConfig {
  inkWashBleedAmount?: number;
  inkWashBrushTexture?: number;
  inkWashEdgeWobble?: number;
  inkWashInkDensity?: number;
  inkWashPaperTexture?: number;
  inkWashWhiteSpace?: number;
}

export interface MatrixStyleConfig {
  matrixCharDensity?: number;
  matrixCharSize?: number;
  matrixFallSpeed?: number;
  matrixGlowIntensity?: number;
  matrixShowOriginal?: number;
  matrixTrailLength?: number;
}

export interface RetroStyleConfig {
  retroColorDepth?: number;
  retroCRTEffect?: number;
  retroDitherStrength?: number;
  retroPaletteMode?: number;
  retroPixelSize?: number;
  retroScanlineBrightness?: number;
}

export interface StyleEffectsConfig
  extends
    AnimeStyleConfig,
    CelStyleConfig,
    CrystalStyleConfig,
    HologramStyleConfig,
    InkWashStyleConfig,
    MatrixStyleConfig,
    RetroStyleConfig {}

export interface UIDisplayConfig {
  enableFaceTracking: boolean;
  showAxes: boolean;
  showGrid: boolean;
  videoMuted: boolean;
}

// AI智能沉浸体验配置
export interface AIImmersiveConfig {
  // 智能运镜
  aiMotionEnabled: boolean;
  aiMotionStyle: 'cinematic' | 'dynamic' | 'focus' | 'exploration';
  autoResumeMotion: boolean;
  // 天气氛围
  weatherEnabled: boolean;
  weatherEffect: 'sunny' | 'rain' | 'fog' | 'snow';
  weatherIntensity: number;
}

// 录制配置
export interface RecordingConfig {
  recordingQuality: 'high' | 'medium' | 'low';
}

export interface SceneConfig
  extends
    CameraControlConfig,
    MotionParamsConfig,
    RenderMeshConfig,
    PostProcessConfig,
    StyleEffectsConfig,
    UIDisplayConfig,
    AIImmersiveConfig,
    RecordingConfig {}
