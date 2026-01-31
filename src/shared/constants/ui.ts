export const Z_INDEX = {
  BASE: 0,
  SCENE: 1,
  UI_BACKDROP: 10,
  UI_PANEL: 100,
  WEBCAM_TRACKER: 9999,
  MODAL: 10000,
  LOADING: 10001,
} as const;

export const SPACING = {
  XS: 2,
  SM: 4,
  MD: 8,
  LG: 10,
  XL: 16,
} as const;

export const OPACITY = {
  HIDDEN: 0,
  SUBTLE: 0.3,
  DIM: 0.5,
  TRACKER_OVERLAY: 0.7,
  FULL: 1.0,
} as const;

export const RADII = {
  SM: 4,
  MD: 8,
  LG: 12,
  FULL: 9999,
} as const;

export const FONT_SIZE = {
  TINY: '10px',
  SMALL: '12px',
  BASE: '14px',
  LARGE: '18px',
} as const;
