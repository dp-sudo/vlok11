import { useCameraStore } from '@/stores/index';

import type { CameraPose, InteractionType } from '@/shared/types';

export function createCameraStateAccessor(): CameraStateAccessor {
  return {
    getPose(): CameraPose {
      const state = useCameraStore.getState();

      return {
        position: { ...state.pose.position },
        target: { ...state.pose.target },
        up: { ...state.pose.up },
        fov: state.pose.fov,
      };
    },
    setPose(pose: Partial<CameraPose>, source = 'user'): void {
      useCameraStore.getState().setPose(pose, source as 'user' | 'motion' | 'preset' | 'reset');
    },
    isInteracting(): boolean {
      return useCameraStore.getState().interaction.isInteracting;
    },
    getInteractionType(): string {
      return useCameraStore.getState().interaction.interactionType;
    },
    startInteraction(type: 'rotate' | 'pan' | 'zoom' | 'touch'): void {
      const currentPose = useCameraStore.getState().pose;

      useCameraStore.getState().startInteraction(type as InteractionType, currentPose);
    },
    endInteraction(): void {
      useCameraStore.getState().endInteraction();
    },
    getBasePose(): CameraPose | null {
      const {basePose} = useCameraStore.getState();

      if (!basePose) return null;

      return {
        position: basePose.position,
        target: basePose.target,
        up: basePose.up,
        fov: basePose.fov,
      };
    },
    captureBasePose(): void {
      const currentPose = useCameraStore.getState().pose;

      useCameraStore.getState().captureBasePose(currentPose);
    },
    clearBasePose(): void {
      useCameraStore.getState().clearBasePose();
    },
    getMotionState() {
      const { motion } = useCameraStore.getState();

      return {
        isActive: motion.isActive,
        isPaused: motion.isPaused,
        type: motion.type,
        progress: motion.progress,
      };
    },
    startMotion(type: string): void {
      useCameraStore.getState().startMotion(type);
    },
    stopMotion(): void {
      useCameraStore.getState().stopMotion();
    },
    pauseMotion(): void {
      useCameraStore.getState().pauseMotion();
    },
    resumeMotion(): void {
      useCameraStore.getState().resumeMotion();
    },
    updateMotionProgress(progress: number): void {
      useCameraStore.getState().updateMotionProgress(progress);
    },
    getBookmarks() {
      return useCameraStore.getState().bookmarks.map((b) => ({
        id: b.id,
        name: b.name,
        pose: { ...b.pose },
        createdAt: b.createdAt,
      }));
    },
    addBookmark(name: string): string {
      useCameraStore.getState().addBookmark(name);
      const { bookmarks } = useCameraStore.getState();

      return bookmarks[bookmarks.length - 1]?.id ?? '';
    },
    removeBookmark(id: string): void {
      useCameraStore.getState().removeBookmark(id);
    },
    applyBookmark(id: string): void {
      useCameraStore.getState().applyBookmark(id);
    },
    canUndo(): boolean {
      return useCameraStore.getState().history.length > 1;
    },
    undo(): void {
      useCameraStore.getState().undo();
    },
    reset(): void {
      useCameraStore.getState().resetCamera();
      useCameraStore.getState().stopMotion();
      useCameraStore.getState().endInteraction();
    },
  };
}
export function getCameraStateAccessor(): CameraStateAccessor {
  stateAccessor ??= createCameraStateAccessor();

  return stateAccessor;
}
export function resetCameraStateAccessor(): void {
  stateAccessor = null;
}

export interface CameraStateAccessor {
  addBookmark(name: string): string;
  applyBookmark(id: string): void;
  canUndo(): boolean;
  captureBasePose(): void;
  clearBasePose(): void;
  endInteraction(): void;
  getBasePose(): CameraPose | null;
  getBookmarks(): Array<{
    createdAt: number;
    id: string;
    name: string;
    pose: CameraPose;
  }>;
  getInteractionType(): string;
  getMotionState(): {
    isActive: boolean;
    isPaused: boolean;
    progress: number;
    type: string;
  };
  getPose(): CameraPose;
  isInteracting(): boolean;
  pauseMotion(): void;
  removeBookmark(id: string): void;
  reset(): void;
  resumeMotion(): void;
  setPose(pose: Partial<CameraPose>, source?: 'user' | 'motion' | 'preset' | 'animation'): void;
  startInteraction(type: 'rotate' | 'pan' | 'zoom' | 'touch'): void;
  startMotion(type: string): void;
  stopMotion(): void;
  undo(): void;
  updateMotionProgress(progress: number): void;
}

let stateAccessor: CameraStateAccessor | null = null;
