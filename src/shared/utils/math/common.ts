import { MATH } from '@/shared/constants/utils';

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));
export const degToRad = (deg: number): number => deg * (Math.PI / MATH.DEGREES_IN_HALF_CIRCLE);
export const generateId = (): string =>
  `${Date.now().toString(ID_RADIX)}_${Math.random().toString(ID_RADIX).substring(ID_SUBSTRING_START, ID_SUBSTRING_END)}`;
const ID_RADIX = 36;
const ID_SUBSTRING_END = 7;
const ID_SUBSTRING_START = 2;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const radToDeg = (rad: number): number => rad * (MATH.DEGREES_IN_HALF_CIRCLE / Math.PI);
