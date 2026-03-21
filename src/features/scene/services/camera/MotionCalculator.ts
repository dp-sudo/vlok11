/**
 * Motion Calculator
 *
 * Encapsulates motion calculation logic by wrapping the functions from
 * @/features/camera/logic/motion.ts. Provides a unified API for camera
 * motion calculations.
 *
 * Note: The core implementation resides in @/features/camera/logic/motion.ts.
 * This calculator provides a convenient wrapper for use within the camera services.
 */

import {
  calculateArc,
  calculateDollyZoom,
  calculateFlyBy,
  calculateMotion,
  calculateOrbit,
  calculateProgress,
  calculateSpiral,
  calculateTracking,
  DEFAULT_MOTION_PARAMS,
  type MotionParams as MotionParamsInternal,
  type MotionResult,
  type MotionType,
} from '@/features/camera/logic/motion';
import { DEFAULT_FOV } from '@/shared/constants';
import type { CameraPose, MotionParams, Vec3 } from '@/shared/types';

export type { MotionParams, MotionResult, MotionType };
export { DEFAULT_MOTION_PARAMS };

// Re-export calculation functions from motion.ts
export {
  calculateArc,
  calculateDollyZoom,
  calculateFlyBy,
  calculateMotion,
  calculateOrbit,
  calculateProgress,
  calculateSpiral,
  calculateTracking,
} from '@/features/camera/logic/motion';

export interface CalculatorConfig {
  /** Base speed multiplier */
  speed: number;
  /** Scale factor */
  scale: number;
  /** Motion parameters */
  params: MotionParams;
}

/**
 * Default calculator configuration
 */
export const DEFAULT_CALCULATOR_CONFIG: CalculatorConfig = {
  speed: 1.0,
  scale: 1.0,
  params: DEFAULT_MOTION_PARAMS,
};

/**
 * MotionCalculator provides a unified interface for calculating camera motion
 * based on various motion types and parameters.
 */
export class MotionCalculator {
  private config: CalculatorConfig;

  constructor(config: Partial<CalculatorConfig> = {}) {
    this.config = { ...DEFAULT_CALCULATOR_CONFIG, ...config };
  }

  /**
   * Update calculator configuration
   */
  configure(config: Partial<CalculatorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): CalculatorConfig {
    return { ...this.config };
  }

  /**
   * Calculate motion result for a given time and base pose
   *
   * @param time - Current time in milliseconds
   * @param startTime - Motion start time in milliseconds
   * @param basePose - Base camera pose
   * @param motionType - Type of motion to calculate
   * @param trackingTarget - Optional tracking target for TRACKING motion
   * @returns MotionResult or null if motion is not applicable
   */
  calculate(
    time: number,
    startTime: number,
    basePose: CameraPose,
    motionType: MotionType,
    trackingTarget?: Vec3
  ): MotionResult | null {
    if (motionType === 'STATIC') {
      return null;
    }

    const progress = calculateProgress(time, startTime, this.config.speed);
    const params = { ...this.config.params };

    return calculateMotion(motionType, progress, basePose, params, trackingTarget);
  }

  /**
   * Calculate motion with custom parameters
   *
   * @param time - Current time in milliseconds
   * @param startTime - Motion start time in milliseconds
   * @param basePose - Base camera pose
   * @param motionType - Type of motion to calculate
   * @param customParams - Custom motion parameters
   * @param trackingTarget - Optional tracking target for TRACKING motion
   * @returns MotionResult or null if motion is not applicable
   */
  calculateWithParams(
    time: number,
    startTime: number,
    basePose: CameraPose,
    motionType: MotionType,
    customParams: Partial<MotionParams>,
    trackingTarget?: Vec3
  ): MotionResult | null {
    if (motionType === 'STATIC') {
      return null;
    }

    const progress = calculateProgress(time, startTime, this.config.speed);
    const params = { ...this.config.params, ...customParams };

    return calculateMotion(motionType, progress, basePose, params, trackingTarget);
  }

  /**
   * Calculate orbit motion
   */
  orbit(progress: number, base: CameraPose, params?: Partial<MotionParams>): MotionResult {
    return calculateOrbit(progress, base, {
      ...DEFAULT_MOTION_PARAMS,
      ...params,
    } as MotionParamsInternal);
  }

  /**
   * Calculate fly-by motion
   */
  flyBy(progress: number, base: CameraPose, params?: Partial<MotionParams>): MotionResult {
    return calculateFlyBy(progress, base, {
      ...DEFAULT_MOTION_PARAMS,
      ...params,
    } as MotionParamsInternal);
  }

  /**
   * Calculate spiral motion
   */
  spiral(progress: number, base: CameraPose, params?: Partial<MotionParams>): MotionResult {
    return calculateSpiral(progress, base, {
      ...DEFAULT_MOTION_PARAMS,
      ...params,
    } as MotionParamsInternal);
  }

  /**
   * Calculate dolly-zoom motion
   */
  dollyZoom(progress: number, base: CameraPose, params?: Partial<MotionParams>): MotionResult {
    return calculateDollyZoom(progress, base, {
      ...DEFAULT_MOTION_PARAMS,
      ...params,
    } as MotionParamsInternal);
  }

  /**
   * Calculate arc motion
   */
  arc(progress: number, base: CameraPose, params?: Partial<MotionParams>): MotionResult {
    return calculateArc(progress, base, {
      ...DEFAULT_MOTION_PARAMS,
      ...params,
    } as MotionParamsInternal);
  }

  /**
   * Calculate tracking motion
   */
  tracking(base: CameraPose, params?: Partial<MotionParams>, trackingTarget?: Vec3): MotionResult {
    return calculateTracking(
      base,
      { ...DEFAULT_MOTION_PARAMS, ...params } as MotionParamsInternal,
      trackingTarget
    );
  }

  /**
   * Generate preview points for a motion path
   *
   * @param motionType - Type of motion to preview
   * @param duration - Duration in seconds
   * @param samples - Number of sample points
   * @param basePose - Base camera pose
   * @returns Array of motion points
   */
  generatePreview(
    motionType: MotionType,
    duration: number,
    samples: number,
    basePose: CameraPose
  ): Array<{ position: Vec3; target: Vec3; fov: number; time: number }> {
    const points: Array<{ position: Vec3; target: Vec3; fov: number; time: number }> = [];

    if (motionType === 'STATIC') {
      return points;
    }

    const step = duration / samples;
    const { params } = this.config;

    for (let i = 0; i <= samples; i++) {
      const time = i * step;
      const progress = time / duration;

      const result = calculateMotion(motionType, progress, basePose, params);

      if (result) {
        points.push({
          position: result.position,
          target: result.target,
          fov: result.fov,
          time,
        });
      }
    }

    return points;
  }

  /**
   * Create a default camera pose
   */
  static createDefaultPose(): CameraPose {
    return {
      position: { x: 0, y: 0, z: 9 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fov: DEFAULT_FOV,
    };
  }
}

/**
 * Default motion calculator instance
 */
let defaultCalculator: MotionCalculator | null = null;

/**
 * Get the default motion calculator instance
 */
export function getMotionCalculator(): MotionCalculator {
  defaultCalculator ??= new MotionCalculator();

  return defaultCalculator;
}

/**
 * Reset the default motion calculator instance
 */
export function resetMotionCalculator(): void {
  defaultCalculator = null;
}
