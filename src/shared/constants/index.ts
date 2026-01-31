export const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;

export const MAX_FILE_SIZE_MB = 100;
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * BYTES_PER_MB;
export const DEFAULT_FOV = 55;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
] as const;
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
] as const;
export const ANIMATION_DURATION = {
  FOV: 300,
  PRESET: 600,
  BOOKMARK: 800,
  DEFAULT: 500,
} as const;
export const BOOTSTRAP_PROGRESS = {
  INIT: 0,
  AI_SERVICE: 20,
  SHADER_SERVICE: 30,
  MODULES: 40,
  SERVICES: 50,
  ERROR_HANDLING: 90,
  COMPLETE: 100,
} as const;

export const CAMERA = {
  DEFAULT_FOV,
  FOV_MIN: 10,
  FOV_MAX: 120,
  PERSPECTIVE_Z: 9,
  ORTHOGRAPHIC_Z: 8,
  IMMERSIVE_DISTANCE: 0.5,
  MIN_DISTANCE_THRESHOLD: 0.001,
  INITIAL_DISTANCE: 9,
  MAX_HISTORY: 50,
} as const;
export const RENDERER = {
  DPR_MIN: 1,
  DPR_MAX: 2,
  DPR: [1, 2] as [number, number],
} as const;
export const DEFAULT_ANIMATION_DURATION = 500;
export const DOUBLE_TAP_THRESHOLD = 300;
export const LONG_PRESS_THRESHOLD = 500;
export const MAX_ERROR_HISTORY = 100;
export const MAX_EVENT_HISTORY = 100;
export const MOTION = {
  TRACKING_BASE_ALPHA: 0.18,
  TRACKING_MIN_ALPHA: 0.02,
  TRACKING_MAX_ALPHA: 0.45,
  PROGRESS_NORMALIZATION_PERIOD_S: 10,
} as const;
export const PERFORMANCE = {
  FPS_TARGET: 60,
  FRAME_TIME_TARGET_MS: 16,
  UPDATE_INTERVAL_MS: 1000,
  MEMORY_PERCENT_MULTIPLIER: 100,
} as const;
export const SCENE_CONFIG = {
  DEFAULT_DEPTH_SCALE: 1.2,
  OUTDOOR_DEPTH_MULTIPLIER: 1.2,
  OBJECT_DEPTH_MULTIPLIER: 0.8,
  INDOOR_FOV: 65,
  PLANE_BASE_WIDTH: 10,
} as const;
export const SWIPE_VELOCITY_THRESHOLD = 0.5;
export const THROTTLE = {
  COORD_DEBUG_MS: 200,
  TRACKING_EMIT_MS: 33,
} as const;
