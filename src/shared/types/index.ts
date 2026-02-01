import type { Camera } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import type { CameraMode, ProjectionMode } from '@/core/domain/types';

export type BlendMode = 'override' | 'additive' | 'manual-priority';
export interface Disposable {
  dispose(): Promise<void> | void;
}
export type CameraPositionHint = 'front' | 'inside' | 'above';
export type CameraPreset = CameraViewPreset;
export type CameraViewPreset = 'FRONT' | 'TOP' | 'SIDE' | 'ISO' | 'FOCUS';
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
export type EasingFunction = (t: number) => number;
export type EasingType =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-out-cubic'
  | 'ease-in-elastic'
  | 'ease-out-elastic'
  | 'ease-in-out-elastic'
  | 'ease-in-bounce'
  | 'ease-out-bounce';
export type GestureType = 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'rotate';
export type InteractionType = 'none' | 'rotate' | 'pan' | 'zoom' | 'touch' | 'pinch';
export type MotionType =
  | 'STATIC'
  | 'ORBIT'
  | 'FLY_BY'
  | 'SPIRAL'
  | 'ARC'
  | 'TRACKING'
  | 'DOLLY_ZOOM';
export type ProjectionType = 'perspective' | 'orthographic';
export type TrackedPointSource = 'user' | 'tracker';

export interface AnimationHandle {
  cancel: (snapToEnd?: boolean) => void;
  getProgress: () => number;
  id: string;
  isActive: () => boolean;
  pause: () => void;
  resume: () => void;
}
export interface AnimationInfo {
  duration: number;
  id: string;
  isPaused: boolean;
  progress: number;
  startTime: number;
}
export interface AnimationOptions<T = unknown> {
  duration: number;
  easing?: EasingType;
  onCancel?: () => void;
  onComplete?: () => void;
  onUpdate?: (value: T, progress: number) => void;
}
export interface AnimationService {
  animate<T>(from: T, to: T, options: AnimationOptions<T>): AnimationHandle;
  animateNumber(from: number, to: number, options: AnimationOptions<number>): AnimationHandle;
  animateVec3(from: Vec3, to: Vec3, options: AnimationOptions<Vec3>): AnimationHandle;
  cancel(handle: AnimationHandle, snapToEnd?: boolean): void;
  cancelAll(snapToEnd?: boolean): void;
  clearQueue(): void;
  enqueue(animation: QueuedAnimation): void;
  getActiveAnimations(): AnimationInfo[];
  isAnimating(): boolean;
}
export interface CameraBookmark {
  createdAt: number;
  id: string;
  name: string;
  pose: CameraPose;
  thumbnail?: string;
}
export interface CameraPose {
  far?: number;
  fov: number;
  near?: number;
  position: Vec3;
  target: Vec3;
  up: Vec3;
}
export interface CameraService {
  applyPreset(preset: CameraPreset): Promise<void>;
  canRedo(): boolean;
  canUndo(): boolean;
  deleteBookmark(id: string): void;
  getBookmarks(): CameraBookmark[];
  getPose(): CameraPose;
  loadBookmark(id: string): Promise<void>;
  lookAt(target: Vec3, duration?: number): Promise<void>;
  moveTo(position: Vec3, duration?: number): Promise<void>;
  redo(): void;
  saveBookmark(name: string): string;
  setFov(fov: number, duration?: number): Promise<void>;
  setPose(pose: Partial<CameraPose>, options?: TransitionOptions): void;
  setProjection(mode: ProjectionType): void;
  syncFromThree(camera: Camera, controls: OrbitControlsType): void;
  syncToThree(camera: Camera, controls: OrbitControlsType): void;
  undo(): void;
}
export interface CameraStateSnapshot {
  cameraMode: CameraMode;
  fov: number;
  position: Vec3;
  projectionMode: ProjectionMode;
  target: Vec3;
  timestamp: number;
  up: Vec3;
  zoom: number;
}
export interface CameraTransitionConfig {
  duration: number;
  easing: EasingType;
  preserveDirection: boolean;
  preserveDistance: boolean;
}
export interface CoreController {
  animation: AnimationService;
  destroy(): Promise<void>;
  initialize(): Promise<void>;
  isInitialized: boolean;
  pause(): void;
  reset(): void;
  resume(): void;
  readonly serviceId: string;
}
export interface FovZoomEquivalence {
  fov: number;
  referenceHeight: number;
  zoom: number;
}
export interface GestureEvent {
  delta?: Point2D;
  position: Point2D;
  rotation?: number;
  scale?: number;
  timestamp: number;
  type: GestureType;
  velocity?: Point2D;
}
export interface InputSensitivity {
  pan: number;
  pinch: number;
  rotate: number;
  zoom: number;
}
export interface InputService {
  bindToElement(element: HTMLElement): void;
  getInteractionType(): InteractionType;
  getSensitivity(): InputSensitivity;
  getState(): InteractionState;
  isEnabled(): boolean;
  isInteracting(): boolean;
  onGesture(callback: (gesture: GestureEvent) => void): () => void;
  onInteractionEnd(callback: () => void): () => void;
  onInteractionStart(callback: (type: InteractionType) => void): () => void;
  setEnabled(enabled: boolean): void;
  setSensitivity(sensitivity: Partial<InputSensitivity>): void;
  unbind(): void;
}
export interface InteractionState {
  currentPosition: Point2D | null;
  isInteracting: boolean;
  lastUpdateTime: number;
  startPosition: Point2D | null;
  startTime: number;
  type: InteractionType;
}
export interface MotionConfig {
  blendMode: BlendMode;
  params: Partial<MotionParams>;
  type: MotionType;
}
export interface MotionParams {
  arcAngle: number;
  arcRhythm: number;
  dollyIntensity: number;
  dollyRange: number;
  flyByHeight: number;
  flyBySwing: number;
  orbitRadius: number;
  orbitTilt: number;
  scale: number;
  speed: number;
  spiralHeight: number;
  spiralLoops: number;
  trackingDistance: number;
  trackingOffset: number;
}
export interface MotionPoint {
  fov: number;
  position: Vec3;
  target: Vec3;
  time: number;
}
export interface MotionResult {
  fov: number;
  position: Vec3;
  target: Vec3;
}
export interface MotionService {
  calculate(time: number, basePose?: CameraPose): MotionResult | null;
  generatePreview(duration: number, samples: number): MotionPoint[];
  getBlendMode(): BlendMode;
  getParameters(): MotionParams;
  getProgress(): number;
  getState(): MotionState;
  getType(): MotionType;
  isActive(): boolean;
  isPaused(): boolean;
  pause(): void;
  resume(): void;
  setBlendMode(mode: BlendMode): void;
  setParameter<K extends keyof MotionParams>(key: K, value: MotionParams[K]): void;
  start(type: MotionType, config?: Partial<MotionConfig>): void;
  stop(): void;
}
export interface MotionState {
  isActive: boolean;
  isPaused: boolean;
  progress: number;
  startTime: number;
  type: MotionType;
}
export interface Point2D {
  x: number;
  y: number;
}
export interface ProjectionCameraPreset {
  distanceLimits: { max: number; min: number };
  idealDistance: number;
  idealFov: number;
  immersive: boolean;
  positionHint: CameraPositionHint;
  targetOffset: Vec3;
}
export interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
}
export interface QueuedAnimation {
  execute: () => AnimationHandle;
  id: string;
  priority?: number;
}
export type {
  AIImmersiveConfig,
  AnimeStyleConfig,
  CameraControlConfig,
  CelStyleConfig,
  CrystalStyleConfig,
  HologramStyleConfig,
  InkWashStyleConfig,
  MatrixStyleConfig,
  MotionParamsConfig,
  PostProcessConfig,
  RecordingConfig,
  RenderMeshConfig,
  RetroStyleConfig,
  SceneConfig,
  StyleEffectsConfig,
  UIDisplayConfig,
} from './sceneConfig';
export interface TrackedPoint2D {
  flipX?: boolean;
  flipY?: boolean;
  mediaHeight: number;
  mediaWidth: number;
  pixel: { x: number; y: number };
  source?: TrackedPointSource;
  timestamp?: number;
}
export interface TrackedPoint3D {
  depth01: number;
  source?: TrackedPointSource;
  timestamp?: number;
  uv: { u: number; v: number };
  world: Vec3;
}
export interface TransitionOptions {
  duration?: number;
  easing?: EasingType;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export {
  type AnalysisResult,
  type Asset,
  type AssetType,
  type BaseAsset,
  CameraMode,
  CameraMotionType,
  ColorGradePreset,
  type ImageAsset,
  isImageAsset,
  isValidAnalysisResult,
  isValidAsset,
  isValidProcessedAsset,
  isValidStatusTransition,
  isVideoAsset,
  MirrorMode,
  type ProcessedAsset,
  type ProcessingState,
  ProjectionMode,
  type RecommendedConfig,
  RenderStyle,
  SceneType,
  SESSION_STATUS_TRANSITIONS,
  type SessionStatus,
  TechPipeline,
  type VideoAsset,
} from '@/core/domain/types';
