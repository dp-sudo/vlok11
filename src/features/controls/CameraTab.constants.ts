export type CameraView = (typeof CAMERA_VIEWS)[number];

export const CAMERA_MODE_LABELS = {
  PERSPECTIVE: '透视',
  ORTHOGRAPHIC: '正交',
} as const;
export const CAMERA_VIEWS = ['FRONT', 'TOP', 'SIDE', 'ISO', 'FOCUS'] as const;
export const CONTROL_PARAMS = {
  DAMPING_MIN: 0.01,
  DAMPING_MAX: 0.3,
  DAMPING_STEP: 0.01,
  ROTATE_SPEED_MIN: 0.2,
  ROTATE_SPEED_MAX: 2,
  ROTATE_SPEED_STEP: 0.1,
  ZOOM_SPEED_MIN: 0.5,
  ZOOM_SPEED_MAX: 3,
  ZOOM_SPEED_STEP: 0.1,
  PAN_SPEED_MIN: 0.2,
  PAN_SPEED_MAX: 2,
  PAN_SPEED_STEP: 0.1,
} as const;
export const FOV = {
  MIN: 35,
  MAX: 120,
  STEP: 1,
} as const;
export const MOTION_RESUME_DELAY = {
  MIN: 0,
  MAX: 2000,
  STEP: 50,
} as const;
export const MOTION_RESUME_TRANSITION = {
  MIN: 0,
  MAX: 1500,
  STEP: 50,
} as const;
export const MOTION_SPEED = {
  MIN: 0.1,
  MAX: 3,
  STEP: 0.1,
} as const;
export const ORBIT = {
  RADIUS_MIN: 5,
  RADIUS_MAX: 30,
  RADIUS_STEP: 1,
  TILT_MIN: 0,
  TILT_MAX: 45,
  TILT_STEP: 1,
} as const;
export const ORTHO_ZOOM = {
  MIN: 1,
  MAX: 100,
  STEP: 1,
} as const;
export const SPIRAL = {
  LOOPS_MIN: 1,
  LOOPS_MAX: 5,
  LOOPS_STEP: 0.5,
  HEIGHT_MIN: 2,
  HEIGHT_MAX: 20,
  HEIGHT_STEP: 1,
} as const;
