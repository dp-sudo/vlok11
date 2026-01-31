import { Vector3 } from 'three';

import type { CameraPose, Vec3 } from '@/shared/types';

export const addVec3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const calculateDistance = (a: Vec3, b: Vec3): number => {
  const dx = a.x - b.x,
    dy = a.y - b.y,
    dz = a.z - b.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};
export const fromVector3 = (v: Vector3): Vec3 => ({ x: v.x, y: v.y, z: v.z });
export const isCameraPoseEqual = (a: CameraPose, b: CameraPose): boolean =>
  isVec3Equal(a.position, b.position) &&
  isVec3Equal(a.target, b.target) &&
  isVec3Equal(a.up, b.up) &&
  a.fov === b.fov;
export const isVec3Equal = (a: Vec3, b: Vec3): boolean => a.x === b.x && a.y === b.y && a.z === b.z;
export const lerpVec3 = (a: Vec3, b: Vec3, t: number): Vec3 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t,
});
export const normalizeVec3 = (v: Vec3): Vec3 => {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

  if (len === 0) return { x: 0, y: 0, z: 1 };

  return { x: v.x / len, y: v.y / len, z: v.z / len };
};
export const scaleVec3 = (v: Vec3, scale: number): Vec3 => ({
  x: v.x * scale,
  y: v.y * scale,
  z: v.z * scale,
});
export const subtractVec3 = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});
export const toVector3 = (v: Vec3): Vector3 => new Vector3(v.x, v.y, v.z);
