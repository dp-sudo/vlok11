export { getEventBus, resetEventBus } from '@/core/EventBus';
export type { EventBus } from '@/core/EventTypes';
export { AnimationScheduler, getAnimationScheduler, getEasingFunction } from './AnimationScheduler';
export { CameraAnimator, getCameraAnimator } from './CameraAnimator';
export type { CameraPresetType, PresetConfig } from './CameraPresets';
export {
  CAMERA_PRESETS,
  calculateDistance,
  calculatePresetPose,
  calculatePresetPoseForProjection,
  getDistanceFromPose,
  scaleVec3,
} from './CameraPresets';
export { CameraService, getCameraService } from './CameraService';
export type { CameraStateAccessor } from './CameraStateBridge';
export { getCameraStateAccessor, resetCameraStateAccessor } from './CameraStateBridge';
export {
  captureSnapshot,
  clearSnapshots,
  createSnapshot,
  getLatestSnapshot,
  getSnapshotByProjection,
  interpolateSnapshots,
} from './CameraStateSnapshot';
export { CameraTransitionService, getCameraTransitionService } from './CameraTransitionService';
export type { ConfigPreset, ConfigService } from './ConfigService';
export { getConfigService } from './ConfigService';
export { CoreController, getCoreController } from './CoreController';
export {
  CoreControllerContext,
  CoreControllerProvider,
  useAnimationService,
  useCameraService,
  useCoreController,
  useInputService,
  useMotionService,
} from './CoreControllerProvider';
export { getInputService, InputService } from './InputService';
export { InputStateManager, DEFAULT_INTERACTION_STATE } from './InputState';
export { InputHandler } from './InputHandler';
// Motion modules - re-export from MotionService which re-exports them
export {
  getMotionService,
  MotionService,
  MotionCalculator,
  getMotionCalculator,
  type MotionType,
  type MotionParams,
  type MotionResult,
  type MotionPoint,
  type MotionConfig,
  type MotionState,
} from './MotionService';
export type { OrthoViewPreset, OrthoViewPresetType } from './OrthographicPresets';
export {
  calculateOrthoPresetPose,
  emitOrthoPresetApplied,
  getAllOrthoViewPresets,
  getOrthoPresetDisplayInfo,
  getOrthoViewPreset,
  isValidOrthoViewPreset,
  ORTHO_VIEW_PRESETS,
} from './OrthographicPresets';
export type { CameraSyncResult } from './PerspectiveOrthoBridge';
export {
  calculateCameraSync,
  calculateEquivalence,
  fovToZoom,
  syncOrthoZoomFromPerspective,
  syncPerspectiveFovFromOrtho,
  zoomToFov,
} from './PerspectiveOrthoBridge';
export type {
  PrecisionConfigServiceInterface,
  PrecisionControlConfig,
} from './PrecisionConfigService';
export {
  getPrecisionConfigService,
  PrecisionConfigService,
  resetPrecisionConfigService,
} from './PrecisionConfigService';
export {
  DEFAULT_TRANSITION_CONFIG,
  getPresetForProjection,
  getTransitionConfig,
  PROJECTION_CAMERA_PRESETS,
  QUICK_TRANSITION_CONFIG,
} from './ProjectionCameraPresets';
