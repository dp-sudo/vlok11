export const CAMERA_MODE_LABELS = {
  PERSPECTIVE: '透视',
  ORTHOGRAPHIC: '正交',
} as const;

export const CAMERA_VIEWS = ['FRONT', 'TOP', 'SIDE', 'ISO', 'FOCUS'] as const;
export type CameraView = (typeof CAMERA_VIEWS)[number];

export const FOV = {
  MIN: 20,
  MAX: 120,
  STEP: 1,
  DEFAULT: 50,
} as const;

export const ORTHO_ZOOM = {
  MIN: 5,
  MAX: 50,
  STEP: 1,
  DEFAULT: 18,
} as const;

export const CONTROL_PARAMS = {
  DAMPING_MIN: 0.01,
  DAMPING_MAX: 0.3,
  DAMPING_STEP: 0.01,
  DAMPING_DEFAULT: 0.06,
  ROTATE_SPEED_MIN: 0.2,
  ROTATE_SPEED_MAX: 2,
  ROTATE_SPEED_STEP: 0.1,
  ROTATE_SPEED_DEFAULT: 0.5,
  ZOOM_SPEED_MIN: 0.2,
  ZOOM_SPEED_MAX: 2,
  ZOOM_SPEED_STEP: 0.1,
  ZOOM_SPEED_DEFAULT: 0.7,
  PAN_SPEED_MIN: 0.2,
  PAN_SPEED_MAX: 2,
  PAN_SPEED_STEP: 0.1,
  PAN_SPEED_DEFAULT: 0.5,
} as const;

export const MOTION_SPEED = {
  MIN: 0.1,
  MAX: 3,
  STEP: 0.1,
  DEFAULT: 0.5,
} as const;

export const MOTION_RESUME_DELAY = {
  MIN: 0,
  MAX: 2000,
  STEP: 50,
  DEFAULT: 1000,
} as const;

export const MOTION_RESUME_TRANSITION = {
  MIN: 0,
  MAX: 1500,
  STEP: 50,
  DEFAULT: 400,
} as const;

export const ORBIT = {
  RADIUS_MIN: 5,
  RADIUS_MAX: 30,
  RADIUS_STEP: 1,
  RADIUS_DEFAULT: 10,
  TILT_MIN: 0,
  TILT_MAX: 45,
  TILT_STEP: 1,
  TILT_DEFAULT: 12,
} as const;

export const SPIRAL = {
  LOOPS_MIN: 1,
  LOOPS_MAX: 5,
  LOOPS_STEP: 0.5,
  LOOPS_DEFAULT: 2,
  HEIGHT_MIN: 2,
  HEIGHT_MAX: 20,
  HEIGHT_STEP: 1,
  HEIGHT_DEFAULT: 8,
} as const;

export const BRIGHTNESS = {
  MIN: 0.5,
  MAX: 2,
  STEP: 0.05,
  DEFAULT: 1.02,
} as const;

export const CONTRAST = {
  MIN: 0.5,
  MAX: 2,
  STEP: 0.05,
  DEFAULT: 1.08,
} as const;

export const SATURATION = {
  MIN: 0,
  MAX: 2,
  STEP: 0.05,
  DEFAULT: 1.1,
} as const;

export const EXPOSURE = {
  MIN: 0.5,
  MAX: 3,
  STEP: 0.1,
  DEFAULT: 1.15,
} as const;

export const LIGHT_INTENSITY = {
  MIN: 0.5,
  MAX: 3,
  STEP: 0.1,
  DEFAULT: 1.3,
} as const;

export const MATERIAL = {
  ROUGHNESS_MIN: 0,
  ROUGHNESS_MAX: 1,
  ROUGHNESS_STEP: 0.05,
  ROUGHNESS_DEFAULT: 0.5,
  METALNESS_MIN: 0,
  METALNESS_MAX: 1,
  METALNESS_STEP: 0.05,
  METALNESS_DEFAULT: 0.15,
} as const;

export const DISPLACEMENT = {
  MIN: 0,
  MAX: 5,
  STEP: 0.1,
  DEFAULT: 1.5,
} as const;

export const MESH_DENSITY = {
  MIN: 64,
  MAX: 512,
  STEP: 32,
  DEFAULT: 256,
} as const;

export const EDGE_FADE = {
  MIN: 0,
  MAX: 1,
  STEP: 0.05,
  DEFAULT: 0.75,
} as const;

export const PARALLAX_SCALE = {
  MIN: 0,
  MAX: 1,
  STEP: 0.05,
  DEFAULT: 0.35,
} as const;

export const DEPTH_FOG = {
  MIN: 0,
  MAX: 1,
  STEP: 0.05,
  DEFAULT: 0.15,
} as const;

export const TIME_FORMAT = {
  SECONDS_PER_MINUTE: 60,
  PAD_LENGTH: 2,
  PAD_CHAR: '0',
} as const;

export const PROGRESS = {
  PERCENT_MULTIPLIER: 100,
  BUFFER_OFFSET: 15,
} as const;

export const FOV_PRESET_VALUES = {
  NARROW: 35,
  NORMAL: 50,
  WIDE: 85,
  ULTRA_WIDE: 120,
} as const;

export const FOV_PRESETS = [
  FOV_PRESET_VALUES.NARROW,
  FOV_PRESET_VALUES.NORMAL,
  FOV_PRESET_VALUES.WIDE,
  FOV_PRESET_VALUES.ULTRA_WIDE,
] as const;

export const DEPTH_PRESET_VALUES = {
  SUBTLE: 0.5,
  NORMAL: 1.5,
  STRONG: 2.5,
  EXTREME: 5,
} as const;

export const DEPTH_PRESETS = [
  DEPTH_PRESET_VALUES.SUBTLE,
  DEPTH_PRESET_VALUES.NORMAL,
  DEPTH_PRESET_VALUES.STRONG,
  DEPTH_PRESET_VALUES.EXTREME,
] as const;

export const EXPOSURE_PRESET_VALUES = {
  DARK: 0.8,
  NORMAL: 1.15,
  BRIGHT: 1.5,
  VERY_BRIGHT: 2,
} as const;

export const EXPOSURE_PRESETS = [
  EXPOSURE_PRESET_VALUES.DARK,
  EXPOSURE_PRESET_VALUES.NORMAL,
  EXPOSURE_PRESET_VALUES.BRIGHT,
  EXPOSURE_PRESET_VALUES.VERY_BRIGHT,
] as const;
