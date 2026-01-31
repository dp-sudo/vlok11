export { AnimationScheduler, getAnimationScheduler, getEasingFunction } from './AnimationScheduler';
export { CameraAnimator, getCameraAnimator } from './CameraAnimator';
export {
  calculateDistance,
  calculatePresetPose,
  calculatePresetPoseForProjection,
  CAMERA_PRESETS,
  getDistanceFromPose,
  scaleVec3,
} from './CameraPresets';
export type { CameraPresetType, PresetConfig } from './CameraPresets';
export { CameraService, getCameraService } from './CameraService';
export { getCameraStateAccessor, resetCameraStateAccessor } from './CameraStateBridge';
export type { CameraStateAccessor } from './CameraStateBridge';
export {
  captureSnapshot,
  clearSnapshots,
  createSnapshot,
  getLatestSnapshot,
  getSnapshotByProjection,
  interpolateSnapshots,
} from './CameraStateSnapshot';
export { CameraTransitionService, getCameraTransitionService } from './CameraTransitionService';
export { getConfigService } from './ConfigService';
export type { ConfigPreset, ConfigService } from './ConfigService';
export { getPrecisionConfigService, PrecisionConfigService, resetPrecisionConfigService } from './PrecisionConfigService';
export type { PrecisionConfigServiceInterface, PrecisionControlConfig } from './PrecisionConfigService';
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
export { getMotionService, MotionService } from './MotionService';
export {
  calculateCameraSync,
  calculateEquivalence,
  fovToZoom,
  syncOrthoZoomFromPerspective,
  syncPerspectiveFovFromOrtho,
  zoomToFov,
} from './PerspectiveOrthoBridge';
export type { CameraSyncResult } from './PerspectiveOrthoBridge';
export {
  DEFAULT_TRANSITION_CONFIG,
  getPresetForProjection,
  getTransitionConfig,
  PROJECTION_CAMERA_PRESETS,
  QUICK_TRANSITION_CONFIG,
} from './ProjectionCameraPresets';
export { getEventBus, resetEventBus } from '@/core/EventBus';
export type { EventBus } from '@/core/EventTypes';
