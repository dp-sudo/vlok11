/**
 * Motion Types Re-export
 *
 * Re-exports motion-related types from shared types for convenient access
 * within the camera services module.
 */

import type { MotionType } from '@/shared/types';

export type {
  MotionType,
  MotionParams,
  MotionResult,
  MotionConfig,
  MotionState,
  MotionPoint,
} from '@/shared/types';

// Re-export MotionService interface for consumers
export type { MotionService } from '@/shared/types';

// Motion type union for type guards
export const MOTION_TYPES = [
  'STATIC',
  'ORBIT',
  'FLY_BY',
  'SPIRAL',
  'ARC',
  'TRACKING',
  'DOLLY_ZOOM',
] as const;

export type MotionTypeValue = (typeof MOTION_TYPES)[number];

/**
 * Check if a motion type is valid
 */
export function isValidMotionType(value: string): value is MotionType {
  return MOTION_TYPES.includes(value as MotionTypeValue);
}
