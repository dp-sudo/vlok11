import type { CameraPose, Vec3 } from '@/shared/types';

export type MotionType =
  | 'ORBIT'
  | 'ARC'
  | 'DOLLY_ZOOM'
  | 'FLY_BY'
  | 'SPIRAL'
  | 'TRACKING'
  | 'STATIC';

export interface MotionResult {
  fov: number;
  position: Vec3;
  target: Vec3;
}

export interface MotionParams {
  arcAngle: number;
  arcRhythm: number;
  dollyIntensity: number;
  dollyRange: number;
  flyByHeight: number;
  flyBySwing: number;
  orbitRadius: number;
  orbitTilt: number;
  scale: number;
  speed: number;
  spiralHeight: number;
  spiralLoops: number;
  trackingDistance: number;
  trackingOffset: number;
}

export const DEFAULT_MOTION_PARAMS: MotionParams = {
  arcAngle: 90,
  arcRhythm: 1,
  dollyIntensity: 0.8,
  dollyRange: 10,
  flyByHeight: 2,
  flyBySwing: 8,
  orbitRadius: 9,
  orbitTilt: 15,
  scale: 1.0,
  speed: 1.0,
  spiralHeight: 5,
  spiralLoops: 2,
  trackingDistance: 6,
  trackingOffset: 1,
};

const MOTION_CONSTANTS = {
  EPSILON: 0.0001,
  MIN_DISTANCE: 0.5,
  DEFAULT_FOV: 50,
  FLY_BY_Z_BASE: 9,
  PI2: Math.PI * 2,
  SPIRAL_CENTER: 0.5,
  FOV_MIN: 10,
  FOV_MAX: 120,
  MS_PER_SECOND: 1000,
  DEG_TO_RAD_FACTOR: 180,
  BASE_RATE: 0.5,
} as const;

export function calculateMotion(
  type: MotionType,
  progress: number,
  basePose: CameraPose,
  params: Partial<MotionParams> = {},
  trackingTarget?: Vec3
): MotionResult | null {
  const p = { ...DEFAULT_MOTION_PARAMS, ...params };

  switch (type) {
    case 'ORBIT':
      return calculateOrbit(progress, basePose, p);
    case 'FLY_BY':
      return calculateFlyBy(progress, basePose, p);
    case 'SPIRAL':
      return calculateSpiral(progress, basePose, p);
    case 'DOLLY_ZOOM':
      return calculateDollyZoom(progress, basePose, p);
    case 'ARC':
      return calculateArc(progress, basePose, p);
    case 'TRACKING':
      return calculateTracking(basePose, p, trackingTarget);
    case 'STATIC':
    default:
      return null;
  }
}

export function calculateOrbit(
  progress: number,
  base: CameraPose,
  params: MotionParams
): MotionResult {
  const angle = progress * MOTION_CONSTANTS.PI2;
  const radius = params.orbitRadius;
  const tiltRad = degToRad(params.orbitTilt);

  const x = Math.sin(angle) * radius * Math.cos(tiltRad);
  const z = Math.cos(angle) * radius * Math.cos(tiltRad);
  const y = Math.sin(tiltRad) * radius;

  return {
    position: {
      x: base.target.x + x,
      y: base.target.y + y,
      z: base.target.z + z,
    },
    target: base.target,
    fov: base.fov,
  };
}

export function calculateFlyBy(
  progress: number,
  base: CameraPose,
  params: MotionParams
): MotionResult {
  const t = (progress * 2 - 1) * params.flyBySwing;
  const height = params.flyByHeight;

  return {
    position: {
      x: base.target.x + t,
      y: base.target.y + height,
      z: base.target.z + MOTION_CONSTANTS.FLY_BY_Z_BASE,
    },
    target: base.target,
    fov: base.fov,
  };
}

export function calculateSpiral(
  progress: number,
  base: CameraPose,
  params: MotionParams
): MotionResult {
  const loops = params.spiralLoops;
  const heightTotal = params.spiralHeight;
  const angle = progress * MOTION_CONSTANTS.PI2 * loops;
  const height = (progress - MOTION_CONSTANTS.SPIRAL_CENTER) * heightTotal;
  const radius = params.orbitRadius;

  return {
    position: {
      x: base.target.x + Math.sin(angle) * radius,
      y: base.target.y + height,
      z: base.target.z + Math.cos(angle) * radius,
    },
    target: base.target,
    fov: base.fov,
  };
}

export function calculateDollyZoom(
  progress: number,
  base: CameraPose,
  params: MotionParams
): MotionResult {
  const t = Math.sin(progress * MOTION_CONSTANTS.PI2);
  const range = params.dollyRange;
  const intensity = params.dollyIntensity;
  const distOffset = t * range;

  const dx = base.position.x - base.target.x;
  const dy = base.position.y - base.target.y;
  const dz = base.position.z - base.target.z;
  const baseDist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (baseDist < MOTION_CONSTANTS.EPSILON) {
    return { position: base.position, target: base.target, fov: base.fov };
  }

  const dir = { x: dx / baseDist, y: dy / baseDist, z: dz / baseDist };
  const newDist = Math.max(MOTION_CONSTANTS.MIN_DISTANCE, baseDist + distOffset * intensity);

  const halfFovRad = degToRad(base.fov) / 2;
  const k = Math.tan(halfFovRad) * baseDist;
  const newHalfFov = Math.atan(k / newDist);
  const newFov = radToDeg(newHalfFov * 2);
  const finalFov = lerp(base.fov, newFov, intensity);

  return {
    position: {
      x: base.target.x + dir.x * newDist,
      y: base.target.y + dir.y * newDist,
      z: base.target.z + dir.z * newDist,
    },
    target: base.target,
    fov: Math.max(MOTION_CONSTANTS.FOV_MIN, Math.min(MOTION_CONSTANTS.FOV_MAX, finalFov)),
  };
}

export function calculateArc(
  progress: number,
  base: CameraPose,
  params: MotionParams
): MotionResult {
  const t = Math.sin(progress * MOTION_CONSTANTS.PI2);
  const maxAngle = degToRad(params.arcAngle);
  const angle = t * maxAngle;
  const radius = params.orbitRadius;

  const heightOffset = base.position.y - base.target.y;

  return {
    position: {
      x: base.target.x + Math.sin(angle) * radius,
      y: base.target.y + heightOffset,
      z: base.target.z + Math.cos(angle) * radius,
    },
    target: base.target,
    fov: base.fov,
  };
}

export function calculateTracking(
  base: CameraPose,
  params: MotionParams,
  trackingTarget?: Vec3
): MotionResult {
  if (!trackingTarget) {
    return { position: base.position, target: base.target, fov: base.fov };
  }

  const dist = params.trackingDistance;
  const offsetY = params.trackingOffset;

  return {
    position: {
      x: trackingTarget.x,
      y: trackingTarget.y + offsetY,
      z: trackingTarget.z + dist,
    },
    target: trackingTarget,
    fov: base.fov,
  };
}

export function calculateProgress(time: number, startTime: number, speed: number): number {
  const elapsed = (time - startTime) / MOTION_CONSTANTS.MS_PER_SECOND;

  return (elapsed * speed * MOTION_CONSTANTS.BASE_RATE) % 1;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / MOTION_CONSTANTS.DEG_TO_RAD_FACTOR;
}

function radToDeg(rad: number): number {
  return (rad * MOTION_CONSTANTS.DEG_TO_RAD_FACTOR) / Math.PI;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
