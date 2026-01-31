import type { CameraPose, Vec3 } from '@/shared/types';

export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(a: Vec3, b: Vec3): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

  if (len === 0) return { x: 0, y: 0, z: 0 };

  return {
    x: v.x / len,
    y: v.y / len,
    z: v.z / len,
  };
}

export function interpolatePose(from: CameraPose, to: CameraPose, t: number): CameraPose {
  return {
    position: lerpVec3(from.position, to.position, t),
    target: lerpVec3(from.target, to.target, t),
    up: lerpVec3(from.up, to.up, t),
    fov: lerp(from.fov, to.fov, t),
    near: from.near,
    far: from.far,
  };
}
