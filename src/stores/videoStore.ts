import type { StateCreator } from 'zustand';

export interface VideoState {
  currentTime: number;
  duration: number;
  isLooping: boolean;
  isMuted: boolean;
  isPlaying: boolean;
  playbackRate: number;
}

export interface VideoActions {
  pause: () => void;
  resetVideo: () => void;
  seek: (time: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setVideoDuration: (duration: number) => void;
  setVideoTime: (time: number) => void;
  toggleLoop: () => void;
  togglePlay: () => void;
}

export type VideoSlice = VideoState & VideoActions;

export const DEFAULT_VIDEO: VideoState = {
  currentTime: 0,
  duration: 0,
  isLooping: true,
  isMuted: true,
  isPlaying: false,
  playbackRate: 1.0,
};

export const createVideoSlice = <T extends VideoSlice>(
  set: Parameters<StateCreator<T>>[0],
  get: Parameters<StateCreator<T>>[1],
  _api: Parameters<StateCreator<T>>[2]
): VideoSlice => ({
  ...DEFAULT_VIDEO,

  setVideoDuration: (duration) => {
    // 验证 duration 为非负数
    const validDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0;

    // S8 - 添加 currentTime 校验，防止状态不一致
    const currentTime = get().currentTime ?? 0;
    const newCurrentTime = validDuration < currentTime ? validDuration : currentTime;

    set({ duration: validDuration, currentTime: newCurrentTime } as Partial<T>);
  },

  setVideoTime: (time) => {
    // 验证 time 在有效范围内 [0, duration]
    const duration = get().duration ?? 0;
    const clampedTime = Number.isFinite(time)
      ? Math.max(0, Math.min(time, duration))
      : 0;
    set({ currentTime: clampedTime } as Partial<T>);
  },

  togglePlay: () => {
    set({ isPlaying: !get().isPlaying } as Partial<T>);
  },

  // 新增：独立的暂停操作
  pause: () => {
    set({ isPlaying: false } as Partial<T>);
  },

  // S7 - seek 函数与 setVideoTime 重复逻辑，统一使用 setVideoTime
  seek: (time) => {
    get().setVideoTime(time);
  },

  setMuted: (muted) => {
    set({ isMuted: muted } as Partial<T>);
  },

  toggleLoop: () => {
    set({ isLooping: !get().isLooping } as Partial<T>);
  },

  setPlaybackRate: (rate) => {
    // 验证 playbackRate 为正数且在合理范围内 [0.1, 4.0]
    const validRate = Number.isFinite(rate)
      ? Math.max(0.1, Math.min(rate, 4.0))
      : 1.0;
    set({ playbackRate: validRate } as Partial<T>);
  },

  resetVideo: () => {
    set(DEFAULT_VIDEO as Partial<T>);
  },
});
