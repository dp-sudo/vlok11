import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { getEventBus } from '@/core/EventBus';
import {
  calculateDistance,
  calculatePresetPose,
  type CameraPresetType,
} from '@/features/scene/services/camera/CameraPresets';
import { CAMERA } from '@/shared/constants';
import { generateId, isCameraPoseEqual } from '@/shared/utils';

import type {
  InteractionType,
  CameraBookmark as SharedCameraBookmark,
  CameraPose as SharedCameraPose,
  Vec3,
} from '@/shared/types';
import type { StateCreator } from 'zustand';

export type { InteractionType };

export type CameraBookmark = Omit<SharedCameraBookmark, 'pose'> & {
  pose: CameraPose;
};

export interface CameraHistoryEntry {
  pose: CameraPose;
  source: 'user' | 'motion' | 'preset' | 'reset';
  timestamp: number;
}

const DEFAULT_POSE: CameraPose = {
  position: { x: 0, y: 0, z: 8 },
  target: { x: 0, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  fov: 50,
};

const DEFAULT_MOTION: CameraMotionState = {
  isActive: false,
  type: 'STATIC',
  progress: 0,
  startTime: 0,
  duration: 0,
  isPaused: false,
  pausedAt: 0,
};

export const DEFAULT_MOTION_STATE = DEFAULT_MOTION;

const DEFAULT_INTERACTION: CameraInteractionState = {
  isInteracting: false,
  interactionType: 'none',
  startPosition: null,
  startTarget: null,
  lastInteractionTime: 0,
};

export const DEFAULT_INTERACTION_STATE = DEFAULT_INTERACTION;

export type CameraPose = Omit<SharedCameraPose, 'near' | 'far'>;

export interface CameraSlice {
  addBookmark: (name: string) => void;
  applyBookmark: (id: string) => void;
  applyPreset: (preset: CameraPresetType) => void;
  basePose: CameraPose | null;
  bookmarks: CameraBookmark[];
  captureBasePose: (pose: CameraPose) => void;
  clearBasePose: () => void;
  endInteraction: () => void;
  history: CameraHistoryEntry[];
  interaction: CameraInteractionState;
  motion: CameraMotionState;
  pauseMotion: () => void;
  pose: CameraPose;
  removeBookmark: (id: string) => void;
  resetAll: () => void;
  resetCamera: () => void;
  resumeMotion: () => void;
  setFov: (fov: number) => void;
  setPose: (pose: Partial<CameraPose>, source?: CameraHistoryEntry['source']) => void;
  setPosition: (position: Vec3) => void;
  setTarget: (target: Vec3) => void;
  startInteraction: (type: InteractionType, currentPose: CameraPose) => void;
  startMotion: (type: string, duration?: number) => void;
  stopMotion: () => void;
  undo: () => void;
  updateMotionProgress: (progress: number) => void;
}

export interface CameraInteractionState {
  interactionType: InteractionType;
  isInteracting: boolean;
  lastInteractionTime: number;
  startPosition: Vec3 | null;
  startTarget: Vec3 | null;
}

export interface CameraMotionState {
  duration: number;
  isActive: boolean;
  isPaused: boolean;
  pausedAt: number;
  progress: number;
  startTime: number;
  type: string;
}

export const createCameraSlice: StateCreator<CameraSlice, [], [], CameraSlice> = (set, get) => ({
  pose: { ...DEFAULT_POSE },
  bookmarks: [],
  history: [],
  motion: { ...DEFAULT_MOTION },
  interaction: { ...DEFAULT_INTERACTION },
  basePose: null,
  ...createPoseActions(set, get),
  ...createMotionActions(set, get),
  ...createInteractionActions(set, get),
  ...createResetAllAction(set),
});

const createInteractionActions = (
  set: Parameters<StateCreator<CameraSlice, [], [], CameraSlice>>[0],
  _get: Parameters<StateCreator<CameraSlice, [], [], CameraSlice>>[1]
) => ({
  startInteraction: (type: InteractionType, currentPose: CameraPose) => {
    set({
      interaction: {
        isInteracting: true,
        interactionType: type,
        startPosition: { ...currentPose.position },
        startTarget: { ...currentPose.target },
        lastInteractionTime: Date.now(),
      },
    });
  },
  endInteraction: () => {
    set({
      interaction: { ...DEFAULT_INTERACTION, lastInteractionTime: Date.now() },
    });
  },
  captureBasePose: (pose: CameraPose) => {
    set({ basePose: { ...pose } });
  },
  clearBasePose: () => {
    set({ basePose: null });
  },
});

const createMotionActions = (
  set: Parameters<StateCreator<CameraSlice, [], [], CameraSlice>>[0],
  get: Parameters<StateCreator<CameraSlice, [], [], CameraSlice>>[1]
) => ({
  startMotion: (type: string, duration = 0) => {
    set({
      motion: {
        isActive: true,
        type,
        progress: 0,
        startTime: Date.now(),
        duration,
        isPaused: false,
        pausedAt: 0,
      },
    });
  },
  stopMotion: () => {
    set({ motion: { ...DEFAULT_MOTION } });
  },
  pauseMotion: () => {
    const { motion } = get();

    if (!motion.isActive) return;
    set({ motion: { ...motion, isPaused: true, pausedAt: motion.progress } });
  },
  resumeMotion: () => {
    const { motion } = get();

    if (!motion.isPaused) return;
    set({
      motion: {
        ...motion,
        isPaused: false,
        startTime: Date.now() - motion.pausedAt * motion.duration,
      },
    });
    // 发射 motion:resumed 事件，让 CameraAnimator 触发恢复过渡动画
    getEventBus().emit('motion:resumed', { type: motion.type, progress: motion.pausedAt });
  },
  updateMotionProgress: (progress: number) => {
    set((state) => ({
      motion: { ...state.motion, progress: Math.max(0, Math.min(1, progress)) },
    }));
  },
});

const createPoseActions = (
  set: Parameters<StateCreator<CameraSlice, [], [], CameraSlice>>[0],
  get: Parameters<StateCreator<CameraSlice, [], [], CameraSlice>>[1]
) => ({
  setPose: (newPose: Partial<CameraPose>, source: CameraHistoryEntry['source'] = 'user') => {
    const currentPose = get().pose;
    const updatedPose = { ...currentPose, ...newPose };

    if (isCameraPoseEqual(currentPose, updatedPose)) return;
    set((state) => ({
      pose: updatedPose,
      history: [
        { pose: updatedPose, timestamp: Date.now(), source },
        ...state.history.slice(0, CAMERA.MAX_HISTORY - 1),
      ],
    }));
  },
  setPosition: (position: Vec3) => {
    get().setPose({ position }, 'user');
  },
  setTarget: (target: Vec3) => {
    get().setPose({ target }, 'user');
  },
  setFov: (fov: number) => {
    get().setPose({ fov: Math.max(CAMERA.FOV_MIN, Math.min(CAMERA.FOV_MAX, fov)) }, 'user');
  },
  addBookmark: (name: string) => {
    const { pose, bookmarks } = get();
    const newBookmark: CameraBookmark = {
      id: generateId(),
      name,
      pose: { ...pose },
      createdAt: Date.now(),
    };

    set({ bookmarks: [...bookmarks, newBookmark] });
  },
  removeBookmark: (id: string) => {
    set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) }));
  },
  applyBookmark: (id: string) => {
    const bookmark = get().bookmarks.find((b) => b.id === id);

    if (bookmark) {
      get().setPose(bookmark.pose, 'preset');
    }
  },
  applyPreset: (preset: CameraPresetType) => {
    const currentPose = get().pose;
    const currentDist = calculateDistance(currentPose.position, currentPose.target);
    const presetPose = calculatePresetPose(preset, currentDist);

    get().setPose({ position: presetPose.position, target: presetPose.target }, 'preset');
  },
  undo: () => {
    const { history } = get();

    if (history.length < 2) return;
    const [, previous, ...rest] = history;

    if (previous) {
      set({ pose: previous.pose, history: [previous, ...rest] });
    }
  },
  resetCamera: () => {
    set({ pose: { ...DEFAULT_POSE }, history: [] });
  },
});

const createResetAllAction = (
  set: Parameters<StateCreator<CameraSlice, [], [], CameraSlice>>[0]
) => ({
  resetAll: () => {
    set({
      pose: { ...DEFAULT_POSE },
      bookmarks: [],
      history: [],
      motion: { ...DEFAULT_MOTION },
      interaction: { ...DEFAULT_INTERACTION },
      basePose: null,
    });
  },
});

export const DEFAULT_CAMERA_POSE = DEFAULT_POSE;

export const useBasePose = () => useCameraPoseStore((s) => s.basePose);
export const useCameraBookmarks = () => useCameraPoseStore((s) => s.bookmarks);
export const useCameraFov = () => useCameraPoseStore((s) => s.pose.fov);

export const useCameraPoseStore = create<CameraSlice>()(
  subscribeWithSelector(createCameraSlice)
);

export const useCameraPosition = () => useCameraPoseStore((s) => s.pose.position);
export const useCameraTarget = () => useCameraPoseStore((s) => s.pose.target);
export const useInteractionState = () => useCameraPoseStore((s) => s.interaction);
export const useIsInteracting = () => useCameraPoseStore((s) => s.interaction.isInteracting);
export const useIsMotionActive = () =>
  useCameraPoseStore((s) => s.motion.isActive && !s.motion.isPaused);
export const useMotionState = () => useCameraPoseStore((s) => s.motion);
