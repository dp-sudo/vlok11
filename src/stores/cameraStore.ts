import { getEventBus } from '@/core/EventBus';
import {
  type CameraPresetType,
  calculateDistance,
  calculatePresetPose,
} from '@/features/scene/services/camera/CameraPresets';
import { CAMERA } from '@/shared/constants';
import type { StateCreator } from 'zustand';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type {
  InteractionType,
  CameraBookmark as SharedCameraBookmark,
  CameraPose as SharedCameraPose,
  Vec3,
} from '@/shared/types';
import { generateId, isCameraPoseEqual } from '@/shared/utils';

export type { InteractionType };

export type CameraBookmark = Omit<SharedCameraBookmark, 'pose'> & {
  pose: CameraPose;
};

export interface CameraHistoryEntry {
  pose: CameraPose;
  source: 'user' | 'motion' | 'preset' | 'reset';
  timestamp: number;
}

/** 默认相机姿态 */
const DEFAULT_POSE: CameraPose = {
  position: { x: 0, y: 0, z: 8 },
  target: { x: 0, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  fov: 50,
};

export const DEFAULT_CAMERA_POSE = DEFAULT_POSE;

/** 默认运动状态 */
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

/** 默认交互状态 */
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
  // === 基础功能 ===
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

  // === 正交相机功能 ===
  /** 正交zoom记忆值 */
  orthoZoomMemory: number;
  /** 透视FOV记忆值 */
  perspectiveFovMemory: number;
  /** 当前正交视图预设 */
  currentOrthoPreset: string | null;
  /** 设置正交zoom */
  setOrthoZoom: (zoom: number) => void;
  /** 设置透视FOV */
  setPerspectiveFov: (fov: number) => void;
  /** 保存相机模式设置 */
  saveCameraModeSettings: (mode: 'perspective' | 'orthographic', value: number) => void;
  /** 获取相机模式设置 */
  getCameraModeSettings: (mode: 'perspective' | 'orthographic') => number;
  /** 设置当前正交预设 */
  setCurrentOrthoPreset: (preset: string | null) => void;
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

/** 正交相机默认值 */
const DEFAULT_ORTHO_ZOOM = 20;
const DEFAULT_FOV = 50;

/** 验证相机姿态数据是否有效 */
const isValidPose = (pose: Partial<CameraPose>): boolean => {
  if (!pose.position || !pose.target) return true; // null/undefined 时跳过验证

  const { x: px, y: py, z: pz } = pose.position;
  const { x: tx, y: ty, z: tz } = pose.target;

  // 检查是否为有效数字
  const isValidNumber = (n: number): boolean => Number.isFinite(n) && !Number.isNaN(n);

  return (
    isValidNumber(px) &&
    isValidNumber(py) &&
    isValidNumber(pz) &&
    isValidNumber(tx) &&
    isValidNumber(ty) &&
    isValidNumber(tz)
  );
};

export const createCameraSlice: StateCreator<CameraSlice, [], [], CameraSlice> = (set, get) => ({
  // 基础状态
  pose: { ...DEFAULT_POSE },
  bookmarks: [],
  history: [],
  motion: { ...DEFAULT_MOTION },
  interaction: { ...DEFAULT_INTERACTION },
  basePose: null,

  // 正交相机状态
  orthoZoomMemory: DEFAULT_ORTHO_ZOOM,
  perspectiveFovMemory: DEFAULT_FOV,
  currentOrthoPreset: null,

  // 所有Actions
  ...createPoseActions(set, get),
  ...createMotionActions(set, get),
  ...createInteractionActions(set, get),
  ...createResetAllAction(set),
  ...createOrthoActions(set, get),
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
    if (!isValidPose(pose)) {
      console.warn('Invalid pose received in captureBasePose');
      return;
    }
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
    // 验证 duration 为有效数字
    const validDuration = Number.isFinite(duration) && duration >= 0 ? duration : 0;

    set({
      motion: {
        isActive: true,
        type,
        progress: 0,
        startTime: Date.now(),
        duration: validDuration,
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

    // 边界值检查：防止除以零或无效值
    const safeDuration = motion.duration > 0 ? motion.duration : 1;
    const safePausedAt = Math.max(0, Math.min(1, motion.pausedAt));

    set({
      motion: {
        ...motion,
        isPaused: false,
        startTime: Date.now() - safePausedAt * safeDuration,
      },
    });

    // 发射 motion:resumed 事件，让 CameraAnimator 触发恢复过渡动画
    getEventBus().emit('motion:resumed', {
      type: motion.type,
      progress: safePausedAt,
    });
  },
  updateMotionProgress: (progress: number) => {
    // 确保 progress 在有效范围内 [0, 1]
    const clampedProgress = Math.max(0, Math.min(1, progress));
    set((state) => ({
      motion: { ...state.motion, progress: clampedProgress },
    }));
  },
});

const createPoseActions = (
  set: Parameters<StateCreator<CameraSlice, [], [], CameraSlice>>[0],
  get: Parameters<StateCreator<CameraSlice, [], [], CameraSlice>>[1]
) => ({
  setPose: (newPose: Partial<CameraPose>, source: CameraHistoryEntry['source'] = 'user') => {
    // 验证姿态数据
    if (!isValidPose(newPose)) {
      console.warn('Invalid pose data in setPose:', newPose);
      return;
    }

    const currentPose = get().pose;
    const updatedPose = { ...currentPose, ...newPose };

    // 如果姿态相同，跳过更新
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
    const clampedFov = Math.max(CAMERA.FOV_MIN, Math.min(CAMERA.FOV_MAX, fov));
    get().setPose({ fov: clampedFov }, 'user');
  },
  addBookmark: (name: string) => {
    const { pose, bookmarks } = get();

    if (!name || name.trim().length === 0) {
      console.warn('Cannot add bookmark with empty name');
      return;
    }

    const newBookmark: CameraBookmark = {
      id: generateId(),
      name: name.trim(),
      pose: { ...pose },
      createdAt: Date.now(),
    };

    set({ bookmarks: [...bookmarks, newBookmark] });
  },
  removeBookmark: (id: string) => {
    if (!id) return;
    set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) }));
  },
  applyBookmark: (id: string) => {
    if (!id) return;

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
      orthoZoomMemory: DEFAULT_ORTHO_ZOOM,
      perspectiveFovMemory: DEFAULT_FOV,
      currentOrthoPreset: null,
    });
  },
});

/** 正交相机专用Actions */
const createOrthoActions = (
  set: Parameters<StateCreator<CameraSlice, [], [], CameraSlice>>[0],
  get: Parameters<StateCreator<CameraSlice, [], [], CameraSlice>>[1]
) => ({
  setOrthoZoom: (zoom: number) => {
    // 验证 zoom 为有效数字
    const clampedZoom = Number.isFinite(zoom)
      ? Math.max(1, Math.min(100, zoom))
      : DEFAULT_ORTHO_ZOOM;
    set({ orthoZoomMemory: clampedZoom });
  },

  setPerspectiveFov: (fov: number) => {
    const clampedFov = Number.isFinite(fov)
      ? Math.max(CAMERA.FOV_MIN, Math.min(CAMERA.FOV_MAX, fov))
      : DEFAULT_FOV;
    set({ perspectiveFovMemory: clampedFov });
  },

  saveCameraModeSettings: (mode: 'perspective' | 'orthographic', value: number) => {
    if (mode === 'perspective') {
      set({ perspectiveFovMemory: value });
    } else {
      set({ orthoZoomMemory: value });
    }
  },

  getCameraModeSettings: (mode: 'perspective' | 'orthographic') => {
    const state = get();

    return mode === 'perspective' ? state.perspectiveFovMemory : state.orthoZoomMemory;
  },

  setCurrentOrthoPreset: (preset: string | null) => {
    set({ currentOrthoPreset: preset });
  },
});

export const useCameraPoseStore = create<CameraSlice>()(
  subscribeWithSelector((...a) => ({
    ...createCameraSlice(...a),
  }))
);

export const useBasePose = () => useCameraPoseStore((s) => s.basePose);
export const useCameraBookmarks = () => useCameraPoseStore((s) => s.bookmarks);
export const useCameraFov = () => useCameraPoseStore((s) => s.pose.fov);
export const useCameraPosition = () => useCameraPoseStore((s) => s.pose.position);
export const useCameraTarget = () => useCameraPoseStore((s) => s.pose.target);
export const useInteractionState = () => useCameraPoseStore((s) => s.interaction);
export const useIsInteracting = () => useCameraPoseStore((s) => s.interaction.isInteracting);
export const useIsMotionActive = () => useCameraPoseStore((s) => s.motion.isActive);
export const useMotionState = () => useCameraPoseStore((s) => s.motion);
