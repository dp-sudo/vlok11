export const BOUNDING_EXPANSION_MULTIPLIER = 2;
export const BOX_DENSITY = {
  CUBE_DIVISOR: 2,
  INFINITE_BOX_DIVISOR: 4,
} as const;
export const BOX_FACE = {
  VERTICES_PER_FACE: 4,
  FRONT: 0,
  BACK: 1,
  TOP: 2,
  BOTTOM: 3,
  RIGHT: 4,
  LEFT: 5,
} as const;
export const CORNER_POSITION_OFFSET = 0.4;
export const CYLINDER_RADIUS_FACTOR = 0.9;
export const DEG_TO_RAD = Math.PI / 180;
export const DOME_PHI_LENGTH = Math.PI / 2;
export const INFINITE_BOX_SCALE = 2;
export const MAX_CORNER_PLANE_RES = 128;
export const MAX_SPLAT_DENSITY = 384;
export const SPHERE_RADIUS = {
  STANDARD: 0.8,
  PANORAMA: 0.6,
  DOME: 0.8,
} as const;
export const UV_BOUNDS = {
  QUARTER: 0.25,
  THREE_QUARTER: 0.75,
  ZERO: 0.0,
  ONE: 1.0,
} as const;
