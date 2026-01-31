import type {
  BlendMode,
  CameraBookmark,
  CameraPose,
  CameraPreset,
  GestureEvent,
  InteractionType,
  MotionState,
  MotionType,
  TrackedPoint2D,
  TrackedPoint3D,
} from '@/shared/types';

export type AIEventType = (typeof AIEvents)[keyof typeof AIEvents];
export type AnimationEventType = (typeof AnimationEvents)[keyof typeof AnimationEvents];
export type CameraConfigEventType = (typeof CameraConfigEvents)[keyof typeof CameraConfigEvents];
export type CameraEventType = (typeof CameraEvents)[keyof typeof CameraEvents];
export type ConfigEventType = (typeof ConfigEvents)[keyof typeof ConfigEvents];
export type CoreEventHandler<T extends CoreEventType> = (payload: CoreEventPayloadMap[T]) => void;
export type CoreEventType =
  | CameraEventType
  | CameraConfigEventType
  | ConfigEventType
  | MotionEventType
  | InputEventType
  | AnimationEventType
  | SystemEventType
  | RenderEventType
  | UploadEventType
  | MediaEventType
  | ExportEventType
  | PipelineEventType
  | AIEventType
  | SessionEventType
  | TrackingEventType;
export type ExportEventType = (typeof ExportEvents)[keyof typeof ExportEvents];
export type InputEventType = (typeof InputEvents)[keyof typeof InputEvents];
export type MediaEventType = (typeof MediaEvents)[keyof typeof MediaEvents];
export type MotionEventType = (typeof MotionEvents)[keyof typeof MotionEvents];
export type PipelineEventType = (typeof PipelineEvents)[keyof typeof PipelineEvents];
export type RenderEventType = (typeof RenderEvents)[keyof typeof RenderEvents];
export type SessionEventType = (typeof SessionEvents)[keyof typeof SessionEvents];
export type SystemEventType = (typeof SystemEvents)[keyof typeof SystemEvents];
export type TrackingEventType = (typeof TrackingEvents)[keyof typeof TrackingEvents];
export type UploadEventType = (typeof UploadEvents)[keyof typeof UploadEvents];

export interface AnimationCancelledPayload {
  id: string;
  progress: number;
  snappedToEnd: boolean;
}
export interface AnimationCompletedPayload {
  duration: number;
  id: string;
}
export interface AnimationPausedPayload {
  id: string;
  progress: number;
}
export interface AnimationProgressPayload {
  id: string;
  progress: number;
}
export interface AnimationResumedPayload {
  id: string;
  progress: number;
}
export interface AnimationStartedPayload {
  duration: number;
  id: string;
}
export interface CameraBookmarkDeletedPayload {
  bookmarkId: string;
}
export interface CameraBookmarkLoadedPayload {
  bookmark: CameraBookmark;
}
export interface CameraBookmarkSavedPayload {
  bookmark: CameraBookmark;
}
export interface CameraHistoryChangedPayload {
  canRedo: boolean;
  canUndo: boolean;
  historyLength: number;
}
export interface CameraPoseAnimatingPayload {
  currentPose: CameraPose;
  progress: number;
  targetPose: CameraPose;
}
export interface CameraPoseChangedPayload {
  pose: CameraPose;
  previousPose: CameraPose;
  source: 'user' | 'motion' | 'preset' | 'animation' | 'sync';
}
export interface CameraPresetAppliedPayload {
  pose: CameraPose;
  preset: CameraPreset;
}
export interface CameraProjectionChangedPayload {
  mode: 'perspective' | 'orthographic';
  previousMode: 'perspective' | 'orthographic';
}
export interface ConfigChangedPayload {
  changes: Partial<Record<string, unknown>>;
  newConfig: Partial<Record<string, unknown>>;
  oldConfig: Partial<Record<string, unknown>>;
}
export interface ConfigPresetAppliedPayload {
  presetId: string;
  presetName: string;
}
export interface ConfigResetPayload {
  newConfig: Partial<Record<string, unknown>>;
  oldConfig: Partial<Record<string, unknown>>;
}
export interface CoreEventPayloadMap {
  [AIEvents.CACHE_HIT]: { key: string; type: 'analysis' | 'depth' };
  [AIEvents.FALLBACK_ACTIVATED]: { reason: string };
  [AIEvents.PROVIDER_CHANGED]: { from: string; to: string };
  [AIEvents.REQUEST_COMPLETED]: { duration: number; operation: string; provider: string };
  [AIEvents.REQUEST_ERROR]: { error: string; operation: string; provider: string };
  [AIEvents.REQUEST_STARTED]: { operation: string; provider: string };
  [AnimationEvents.CANCELLED]: AnimationCancelledPayload;
  [AnimationEvents.COMPLETED]: AnimationCompletedPayload;
  [AnimationEvents.PAUSED]: AnimationPausedPayload;
  [AnimationEvents.PROGRESS]: AnimationProgressPayload;
  [AnimationEvents.RESUMED]: AnimationResumedPayload;
  [AnimationEvents.STARTED]: AnimationStartedPayload;
  [CameraConfigEvents.CAMERA_MODE_CHANGED]: {
    mode: 'perspective' | 'orthographic';
    previousMode: 'perspective' | 'orthographic';
  };

  [CameraConfigEvents.FOV_CHANGED]: { fov: number };
  [CameraConfigEvents.ORTHO_ZOOM_CHANGED]: { orthoZoom: number };
  [CameraEvents.BOOKMARK_DELETED]: CameraBookmarkDeletedPayload;
  [CameraEvents.BOOKMARK_LOADED]: CameraBookmarkLoadedPayload;
  [CameraEvents.BOOKMARK_SAVED]: CameraBookmarkSavedPayload;

  [CameraEvents.HISTORY_CHANGED]: CameraHistoryChangedPayload;
  [CameraEvents.MOTION_COMPLETED]: { type: string };
  [CameraEvents.MOTION_STARTED]: { duration: number; type: string };
  [CameraEvents.MOTION_STOPPED]: undefined;
  [CameraEvents.POSE_ANIMATING]: CameraPoseAnimatingPayload;
  [CameraEvents.POSE_CHANGED]: CameraPoseChangedPayload;
  [CameraEvents.POSITION_CHANGED]: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  };
  [CameraEvents.PRESET_APPLIED]: CameraPresetAppliedPayload;
  [CameraEvents.PROJECTION_CHANGED]: CameraProjectionChangedPayload;
  [CameraEvents.VIEW_RESET]: undefined;
  [ConfigEvents.CHANGED]: ConfigChangedPayload;

  [ConfigEvents.PRESET_APPLIED]: ConfigPresetAppliedPayload;
  [ConfigEvents.RESET]: ConfigResetPayload;
  [ConfigEvents.VALIDATED]: { config: Record<string, unknown> };
  [ConfigEvents.VALIDATION_FAILED]: { errors: string[] };
  [ExportEvents.MODEL_EXPORT_COMPLETED]: { fileName: string };

  [ExportEvents.MODEL_EXPORT_STARTED]: undefined;
  [ExportEvents.RECORDING_STARTED]: { withAudio: boolean };
  [ExportEvents.RECORDING_STOPPED]: { duration: number };
  [ExportEvents.SNAPSHOT_COMPLETED]: { fileName: string };
  [ExportEvents.SNAPSHOT_STARTED]: undefined;
  [InputEvents.ENABLED_CHANGED]: InputEnabledChangedPayload;

  [InputEvents.GESTURE]: InputGesturePayload;
  [InputEvents.INTERACTION_END]: InputInteractionEndPayload;
  [InputEvents.INTERACTION_START]: InputInteractionStartPayload;
  [InputEvents.INTERACTION_UPDATE]: InputInteractionUpdatePayload;
  [MediaEvents.DEPTH_GENERATED]: { method: string };
  [MediaEvents.LOADED]: { type: 'image' | 'video'; url: string };

  [MediaEvents.UNLOADED]: undefined;
  [MediaEvents.VIDEO_ENDED]: undefined;
  [MediaEvents.VIDEO_PAUSE]: undefined;
  [MediaEvents.VIDEO_PLAY]: undefined;
  [MediaEvents.VIDEO_SEEK]: { time: number };

  [MotionEvents.BLEND_MODE_CHANGED]: MotionBlendModeChangedPayload;
  [MotionEvents.PARAMS_CHANGED]: MotionParamsChangedPayload;
  [MotionEvents.PAUSED]: MotionPausedPayload;
  [MotionEvents.PROGRESS]: MotionProgressPayload;
  [MotionEvents.RESUMED]: MotionResumedPayload;
  [MotionEvents.STARTED]: MotionStartedPayload;

  [MotionEvents.STOPPED]: MotionStoppedPayload;
  [MotionEvents.TYPE_CHANGED]: MotionTypeChangedPayload;
  [PipelineEvents.CANCELLED]: Record<string, never>;
  [PipelineEvents.COMPLETED]: { result: Record<string, unknown> };
  [PipelineEvents.ERROR]: { error: string; stage: string };
  [PipelineEvents.STAGE_COMPLETED]: { progress: number; stage: string };
  [PipelineEvents.STAGE_STARTED]: { progress: number; stage: string };

  [PipelineEvents.STARTED]: { inputType: 'file' | 'url' };
  [RenderEvents.FRAME_RENDERED]: { frameTime: number };
  [RenderEvents.MATERIAL_UPDATED]: { materialType: string };
  [RenderEvents.SHADER_COMPILED]: { shaderId: string };
  [RenderEvents.SHADER_ERROR]: { error: string; shaderId: string };
  [RenderEvents.STYLE_CHANGED]: { style: string };

  [SessionEvents.CONFIG_RECOMMENDED]: { config: Record<string, unknown> };
  [SessionEvents.RESET_REQUESTED]: undefined;
  [SystemEvents.DISPOSED]: SystemDisposedPayload;
  [SystemEvents.ERROR]: SystemErrorPayload;
  [SystemEvents.INITIALIZED]: SystemInitializedPayload;
  [SystemEvents.PAUSED]: SystemPausedPayload;

  [SystemEvents.RESUMED]: SystemResumedPayload;
  [SystemEvents.WARNING]: SystemWarningPayload;
  [TrackingEvents.POINT_2D]: TrackedPoint2D;
  [TrackingEvents.POINT_3D]: TrackedPoint3D;
  [UploadEvents.CANCELLED]: undefined;
  [UploadEvents.COMPLETED]: { result: Record<string, unknown> };

  [UploadEvents.ERROR]: { error: string; stage?: string };
  [UploadEvents.PROGRESS]: { progress: number; stage: string };

  [UploadEvents.STAGE_CHANGED]: { previousStage?: string; stage: string };
  [UploadEvents.STARTED]: { fileName: string; fileSize: number; fileType: string };
}
export interface EventBus {
  clearEventHistory(): void;
  emit<T extends CoreEventType>(type: T, payload: CoreEventPayloadMap[T]): void;
  emit(type: string, payload: unknown): void;
  enableLogging(enabled: boolean): void;
  getAllTypes(): string[];
  getEventHistory(limit?: number): EventRecord[];
  getSubscriberCount(type: CoreEventType | string): number;
  off<T extends CoreEventType>(type: T, handler: CoreEventHandler<T>): void;
  off(type: string, handler: (payload: unknown) => void): void;
  offAll(type?: CoreEventType | string): void;
  on<T extends CoreEventType>(
    type: T,
    handler: CoreEventHandler<T>,
    options?: EventSubscriptionOptions
  ): () => void;
  on(
    type: string,
    handler: (payload: unknown) => void,
    options?: EventSubscriptionOptions
  ): () => void;
  once<T extends CoreEventType>(type: T, handler: CoreEventHandler<T>): () => void;
  once(type: string, handler: (payload: unknown) => void): () => void;
  reset(): void;
}
export interface EventRecord {
  payload: unknown;
  subscriberCount: number;
  timestamp: number;
  type: CoreEventType | string;
}
export interface EventSubscriptionOptions {
  once?: boolean;
  priority?: number;
}
export interface InputEnabledChangedPayload {
  enabled: boolean;
}
export interface InputGesturePayload {
  gesture: GestureEvent;
}
export interface InputInteractionEndPayload {
  duration: number;
  type: InteractionType;
}
export interface InputInteractionStartPayload {
  position: { x: number; y: number };
  timestamp: number;
  type: InteractionType;
}
export interface InputInteractionUpdatePayload {
  delta: { x: number; y: number };
  position: { x: number; y: number };
  type: InteractionType;
}
export interface MotionBlendModeChangedPayload {
  mode: BlendMode;
  previousMode: BlendMode;
}
export interface MotionParamsChangedPayload {
  key: string;
  previousValue: number;
  value: number;
}
export interface MotionPausedPayload {
  progress: number;
  type: MotionType;
}
export interface MotionProgressPayload {
  progress: number;
  state: MotionState;
  type: MotionType;
}
export interface MotionResumedPayload {
  progress: number;
  type: MotionType;
}
export interface MotionStartedPayload {
  blendMode: BlendMode;
  type: MotionType;
}
export interface MotionStoppedPayload {
  reason: 'user' | 'completed' | 'error';
  type: MotionType;
}
export interface MotionTypeChangedPayload {
  previousType: MotionType;
  type: MotionType;
}
export interface SystemDisposedPayload {
  timestamp: number;
}
export interface SystemErrorPayload {
  context: string;
  error: Error;
  recoverable: boolean;
}
export interface SystemInitializedPayload {
  timestamp: number;
  version: string;
}
export interface SystemPausedPayload {
  timestamp: number;
}
export interface SystemResumedPayload {
  pauseDuration: number;
  timestamp: number;
}
export interface SystemWarningPayload {
  context: string;
  message: string;
}

export const AIEvents = {
  REQUEST_STARTED: 'ai:request:started',
  REQUEST_COMPLETED: 'ai:request:completed',
  REQUEST_ERROR: 'ai:request:error',
  PROVIDER_CHANGED: 'ai:provider:changed',
  FALLBACK_ACTIVATED: 'ai:fallback:activated',
  CACHE_HIT: 'ai:cache:hit',
} as const;
export const AnimationEvents = {
  STARTED: 'animation:started',
  PROGRESS: 'animation:progress',
  COMPLETED: 'animation:completed',
  CANCELLED: 'animation:cancelled',
  PAUSED: 'animation:paused',
  RESUMED: 'animation:resumed',
} as const;
export const CameraEvents = {
  POSITION_CHANGED: 'camera:position:changed',
  POSE_CHANGED: 'camera:pose-changed',
  POSE_ANIMATING: 'camera:pose-animating',
  PRESET_APPLIED: 'camera:preset-applied',
  PROJECTION_CHANGED: 'camera:projection-changed',
  BOOKMARK_SAVED: 'camera:bookmark-saved',
  BOOKMARK_LOADED: 'camera:bookmark-loaded',
  BOOKMARK_DELETED: 'camera:bookmark-deleted',
  HISTORY_CHANGED: 'camera:history-changed',
  VIEW_RESET: 'camera:view:reset',
  MOTION_STARTED: 'camera:motion:started',
  MOTION_STOPPED: 'camera:motion:stopped',
  MOTION_COMPLETED: 'camera:motion:completed',
} as const;
export const CameraConfigEvents = {
  FOV_CHANGED: 'camera:config:fov_changed',
  ORTHO_ZOOM_CHANGED: 'camera:config:ortho_zoom_changed',
  CAMERA_MODE_CHANGED: 'camera:config:camera_mode_changed',
} as const;
export const ConfigEvents = {
  CHANGED: 'config:changed',
  PRESET_APPLIED: 'config:preset-applied',
  RESET: 'config:reset',
  VALIDATED: 'config:validated',
  VALIDATION_FAILED: 'config:validation:failed',
} as const;
export const ExportEvents = {
  SNAPSHOT_STARTED: 'export:snapshot:started',
  SNAPSHOT_COMPLETED: 'export:snapshot:completed',
  MODEL_EXPORT_STARTED: 'export:model:started',
  MODEL_EXPORT_COMPLETED: 'export:model:completed',
  RECORDING_STARTED: 'export:recording:started',
  RECORDING_STOPPED: 'export:recording:stopped',
} as const;
export const InputEvents = {
  INTERACTION_START: 'input:interaction-start',
  INTERACTION_END: 'input:interaction-end',
  INTERACTION_UPDATE: 'input:interaction-update',
  GESTURE: 'input:gesture',
  ENABLED_CHANGED: 'input:enabled-changed',
} as const;
export const MediaEvents = {
  LOADED: 'media:loaded',
  UNLOADED: 'media:unloaded',
  DEPTH_GENERATED: 'media:depth:generated',
  VIDEO_PLAY: 'media:video:play',
  VIDEO_PAUSE: 'media:video:pause',
  VIDEO_SEEK: 'media:video:seek',
  VIDEO_ENDED: 'media:video:ended',
} as const;
export const MotionEvents = {
  STARTED: 'motion:started',
  STOPPED: 'motion:stopped',
  PAUSED: 'motion:paused',
  RESUMED: 'motion:resumed',
  PROGRESS: 'motion:progress',
  TYPE_CHANGED: 'motion:type-changed',
  BLEND_MODE_CHANGED: 'motion:blend-mode-changed',
  PARAMS_CHANGED: 'motion:params-changed',
} as const;
export const PipelineEvents = {
  STARTED: 'pipeline:started',
  STAGE_STARTED: 'pipeline:stage-started',
  STAGE_COMPLETED: 'pipeline:stage-completed',
  COMPLETED: 'pipeline:completed',
  ERROR: 'pipeline:error',
  CANCELLED: 'pipeline:cancelled',
} as const;
export const RenderEvents = {
  STYLE_CHANGED: 'render:style:changed',
  MATERIAL_UPDATED: 'render:material:updated',
  SHADER_COMPILED: 'render:shader:compiled',
  SHADER_ERROR: 'render:shader:error',
  FRAME_RENDERED: 'render:frame:rendered',
} as const;
export const SessionEvents = {
  CONFIG_RECOMMENDED: 'session:config-recommended',
  RESET_REQUESTED: 'session:reset-requested',
} as const;
export const SystemEvents = {
  INITIALIZED: 'system:initialized',
  DISPOSED: 'system:disposed',
  ERROR: 'system:error',
  WARNING: 'system:warning',
  PAUSED: 'system:paused',
  RESUMED: 'system:resumed',
} as const;
export const TrackingEvents = {
  POINT_2D: 'tracking:point-2d',
  POINT_3D: 'tracking:point-3d',
} as const;
export const UploadEvents = {
  STARTED: 'upload:started',
  PROGRESS: 'upload:progress',
  STAGE_CHANGED: 'upload:stage:changed',
  COMPLETED: 'upload:completed',
  ERROR: 'upload:error',
  CANCELLED: 'upload:cancelled',
} as const;
