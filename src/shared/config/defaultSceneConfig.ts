import {
  CameraMode,
  CameraMotionType,
  ColorGradePreset,
  MirrorMode,
  ProjectionMode,
  RenderStyle,
} from '@/shared/types';

import type { SceneConfig } from '@/shared/types';

/**
 * Default scene configuration grouped by functional modules.
 *
 * Module structure:
 * - Mesh: Mesh geometry and material properties
 * - Camera: Camera positioning and view settings
 * - Motion: Camera motion/animation parameters
 * - Rendering: Render style and material settings
 * - Effects: Post-processing and visual effects
 * - Video: Video playback settings
 * - Display: UI display preferences
 */
export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  // ========== Mesh Configuration ==========
  displacementScale: 1.5,
  wireframe: false,
  meshDensity: 256,
  mirrorMode: MirrorMode.NONE,

  // ========== Camera Configuration ==========
  /** Field of view in degrees (perspective mode) */
  fov: 50,
  /** Zoom level for orthographic mode */
  orthoZoom: 18,
  /** Minimum orthographic zoom (prevents excessive zoom out) */
  orthoZoomMin: 1,
  /** Maximum orthographic zoom (prevents excessive zoom in) */
  orthoZoomMax: 100,
  /** Camera projection mode */
  cameraMode: CameraMode.PERSPECTIVE,
  /** Minimum orbit distance */
  minDistance: 2,
  /** Maximum orbit distance */
  maxDistance: 35,
  /** Camera damping factor (0-1, higher = smoother) */
  dampingFactor: 0.06,
  /** Rotation sensitivity */
  rotateSpeed: 0.5,
  /** Zoom sensitivity */
  zoomSpeed: 0.7,
  /** Vertical camera shift */
  verticalShift: 0,
  /** Enable panning */
  enablePan: true,
  /** Panning sensitivity */
  panSpeed: 0.5,
  /** Minimum polar angle (0 = top, PI = bottom) */
  minPolarAngle: 0,
  /** Maximum polar angle (0 = top, PI = bottom) */
  maxPolarAngle: Math.PI,

  // ========== Motion Configuration ==========
  autoRotate: false,
  cameraMotionType: CameraMotionType.STATIC,
  /** Motion animation speed multiplier */
  cameraMotionSpeed: 0.5,
  /** Blend mode for combining base pose with motion */
  cameraMotionBlend: 'additive',
  /** Delay before resuming motion after user interaction (ms) */
  motionResumeDelayMs: 1000,
  /** Transition duration when resuming motion (ms) */
  motionResumeTransitionMs: 400,

  // Motion type specific parameters
  orbitRadius: 10,
  orbitTilt: 15,
  flyByHeight: 3,
  flyBySwing: 12,
  spiralLoops: 2,
  spiralHeight: 8,
  arcAngle: 90,
  arcRhythm: 1,
  trackingDistance: 12,
  trackingOffset: 0,
  dollyRange: 20,
  dollyIntensity: 1,

  // ========== Display Configuration ==========
  isImmersive: false,
  showGrid: false,
  showAxes: false,

  // ========== Rendering Configuration ==========
  renderStyle: RenderStyle.NORMAL,
  roughness: 0.5,
  metalness: 0.15,
  lightIntensity: 1.3,
  exposure: 1.15,
  projectionMode: ProjectionMode.PLANE,
  /** Projection angle in degrees (0-180) */
  projectionAngle: 180,
  depthInvert: false,
  backgroundIntensity: 0.85,

  // ========== Effects Configuration ==========
  enableNakedEye3D: false,
  enableParticles: false,
  edgeFade: 0.75,
  parallaxScale: 0.35,
  depthFog: 0.15,
  lightAngleX: 40,
  lightAngleY: 35,
  vignetteStrength: 0,
  particleType: 'dust',

  // ========== Color Grading ==========
  colorGrade: ColorGradePreset.CINEMATIC,
  saturation: 1.1,
  contrast: 1.08,
  brightness: 1.02,

  // ========== Video Configuration ==========
  videoMuted: true,
  enableFrameInterpolation: true,
  enableVignette: false,
};
