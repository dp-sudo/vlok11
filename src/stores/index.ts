export {
  createCameraSlice,
  DEFAULT_CAMERA_POSE,
  DEFAULT_INTERACTION_STATE,
  DEFAULT_MOTION_STATE,
  useCameraPoseStore,
  useCameraPoseStore as useCameraStore,
} from './cameraStore';

export {
  useBasePose,
  useCameraBookmarks,
  useCameraFov,
  useCameraPosition,
  useCameraTarget,
  useInteractionState,
  useIsInteracting,
  useIsMotionActive,
  useMotionState,
} from './cameraStore';

export type {
  CameraBookmark,
  CameraHistoryEntry,
  CameraInteractionState,
  CameraMotionState,
  CameraPose,
  CameraSlice,
  InteractionType,
} from './cameraStore';

export {
  useCameraMotionType,
  useDisplacementScale,
  useIsImmersive,
  useProjectionMode,
  useRenderStyle,
  useSceneStore,
  useSessionStore,
} from './sharedStore';

export type { SessionStatus } from '@/core/domain/types';

export { useVideoState, useCurrentTime, useDuration, useIsMuted } from './sharedStore';

export {
  useCurrentAsset,
  useProcessingResult,
  useProcessingStatus,
  useExportState,
} from './sharedStore';
