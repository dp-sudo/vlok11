import type { CameraPose, Vec3 } from '@/shared/types';

export type EasingFunction = (t: number) => number;

const EASING_CONSTANTS = {
  CUBIC_POWER: 3,
  THRESHOLD: 0.5,
  CUBIC_FACTOR: 4,
  OFFSET_MULTIPLIER: -2,
} as const;

export const easings: Record<string, EasingFunction> = {
  linear: (t) => t,
  'ease-out-cubic': (t) => 1 - Math.pow(1 - t, EASING_CONSTANTS.CUBIC_POWER),
  'ease-in-cubic': (t) => t * t * t,
  'ease-in-out-cubic': (t) =>
    t < EASING_CONSTANTS.THRESHOLD
      ? EASING_CONSTANTS.CUBIC_FACTOR * t * t * t
      : 1 - Math.pow(EASING_CONSTANTS.OFFSET_MULTIPLIER * t + 2, EASING_CONSTANTS.CUBIC_POWER) / 2,
  'ease-out-quad': (t) => 1 - (1 - t) * (1 - t),
  'ease-in-quad': (t) => t * t,
};

export function getEasing(name: string): EasingFunction {
  return easings[name] ?? easings['linear'];
}

export interface AnimationConfig {
  duration: number;
  easing?: string;
  onComplete?: () => void;
  onUpdate: (progress: number) => void;
}

export interface AnimationController {
  cancel: () => void;
  pause: () => void;
  resume: () => void;
}

export function createAnimation(config: AnimationConfig): AnimationController {
  const { duration, easing = 'ease-out-cubic', onUpdate, onComplete } = config;
  const easingFn = getEasing(easing);

  let startTime: number | null = null;
  let rafId: number | null = null;
  let isPaused = false;
  let pausedProgress = 0;

  const animate = (timestamp: number) => {
    if (isPaused) return;

    startTime ??= timestamp;

    const elapsed = timestamp - startTime;
    const rawProgress = Math.min(elapsed / duration, 1);
    const easedProgress = easingFn(rawProgress);

    onUpdate(easedProgress);

    if (rawProgress < 1) {
      rafId = requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  };

  rafId = requestAnimationFrame(animate);

  return {
    cancel: () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
    pause: () => {
      isPaused = true;
      pausedProgress = startTime !== null ? (performance.now() - startTime) / duration : 0;
    },
    resume: () => {
      if (!isPaused) return;
      isPaused = false;
      startTime = performance.now() - pausedProgress * duration;
      rafId = requestAnimationFrame(animate);
    },
  };
}

export interface PoseAnimationOptions {
  duration: number;
  easing?: string;
  from: CameraPose;
  onComplete?: () => void;
  onUpdate: (pose: CameraPose) => void;
  to: Partial<CameraPose>;
}

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

export function animatePose(options: PoseAnimationOptions): AnimationController {
  const { from, to, duration, easing, onUpdate, onComplete } = options;

  const targetPose: CameraPose = {
    ...from,
    ...to,
    position: to.position ? { ...from.position, ...to.position } : from.position,
    target: to.target ? { ...from.target, ...to.target } : from.target,
    up: to.up ? { ...from.up, ...to.up } : from.up,
  };

  return createAnimation({
    duration,
    easing,
    onComplete,
    onUpdate: (progress) => {
      const interpolated: CameraPose = {
        position: lerpVec3(from.position, targetPose.position, progress),
        target: lerpVec3(from.target, targetPose.target, progress),
        up: lerpVec3(from.up, targetPose.up, progress),
        fov: from.fov + (targetPose.fov - from.fov) * progress,
        near: from.near,
        far: from.far,
      };

      onUpdate(interpolated);
    },
  });
}
