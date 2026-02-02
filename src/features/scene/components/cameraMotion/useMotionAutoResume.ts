import { useCallback, useRef } from 'react';

import { getEventBus } from '@/core/EventBus';
import type { SceneConfig } from '@/shared/types';
import { useCameraPoseStore } from '@/stores/cameraStore';
import { useSceneStore } from '@/stores/sharedStore';

/**
 * Hook for handling automatic motion resumption after user interaction.
 *
 * Features:
 * - Detects user interaction end
 * - Waits for configurable delay before resuming
 * - Supports optional auto-resume behavior
 * - Triggers smooth transition when resuming
 */
export function useMotionAutoResume(_config: SceneConfig) {
  const resumeTimeoutRef = useRef<number | null>(null);
  const cameraStore = useCameraPoseStore;

  /**
   * Clear any pending resume timeout
   */
  const clearResumeTimeout = useCallback(() => {
    if (resumeTimeoutRef.current !== null) {
      window.clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  /**
   * Handle user interaction end - optionally auto-resume motion
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: cameraStore is stable Zustand reference
  const handleInteractionEnd = useCallback(() => {
    const motionState = cameraStore.getState().motion;
    const sceneConfig = useSceneStore.getState().config;

    // Only auto-resume if:
    // 1. Motion was previously active and paused by user interaction
    // 2. Auto-resume is enabled in config (autoResumeMotion defaults to true)
    // 3. Motion type is not STATIC
    if (
      !motionState.isActive ||
      motionState.isPaused === false ||
      sceneConfig.cameraMotionType === 'STATIC' ||
      !sceneConfig.aiMotionEnabled || // Only auto-resume for AI motion
      sceneConfig.autoResumeMotion === false // Check auto-resume preference
    ) {
      return;
    }

    // Clear any existing timeout
    clearResumeTimeout();

    // Schedule auto-resume after delay
    resumeTimeoutRef.current = window.setTimeout(() => {
      const currentMotionState = cameraStore.getState().motion;

      // Check again in case motion was manually started/stopped
      if (currentMotionState.isPaused && currentMotionState.isActive) {
        // Emit event to trigger resume transition in CameraAnimator
        getEventBus().emit('motion:resume-requested', {
          type: currentMotionState.type,
          progress: currentMotionState.pausedAt,
        });

        // Resume the motion
        cameraStore.getState().resumeMotion();
      }

      resumeTimeoutRef.current = null;
    }, sceneConfig.motionResumeDelayMs);
  }, [cameraStore, clearResumeTimeout]);

  /**
   * Cancel any pending auto-resume and immediately resume
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: cameraStore is stable Zustand reference
  const immediateResume = useCallback(() => {
    clearResumeTimeout();

    const motionState = cameraStore.getState().motion;

    if (motionState.isPaused && motionState.isActive) {
      getEventBus().emit('motion:resume-requested', {
        type: motionState.type,
        progress: motionState.pausedAt,
      });
      cameraStore.getState().resumeMotion();
    }
  }, [cameraStore, clearResumeTimeout]);

  /**
   * Cancel any pending auto-resume
   */
  const cancelAutoResume = useCallback(() => {
    clearResumeTimeout();
  }, [clearResumeTimeout]);

  return {
    handleInteractionEnd,
    immediateResume,
    cancelAutoResume,
  };
}
