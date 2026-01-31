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
  resetVideo: () => void;
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
    set({ duration } as Partial<T>);
  },

  setVideoTime: (time) => {
    set({ currentTime: time } as Partial<T>);
  },

  togglePlay: () => {
    set({ isPlaying: !get().isPlaying } as Partial<T>);
  },

  setMuted: (muted) => {
    set({ isMuted: muted } as Partial<T>);
  },

  toggleLoop: () => {
    set({ isLooping: !get().isLooping } as Partial<T>);
  },

  setPlaybackRate: (rate) => {
    set({ playbackRate: rate } as Partial<T>);
  },

  resetVideo: () => {
    set(DEFAULT_VIDEO as Partial<T>);
  },
});
