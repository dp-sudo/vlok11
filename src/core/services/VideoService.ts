import { createStore } from 'zustand';

export interface VideoPlaybackState {
  currentTime: number;
  duration: number;
  isMuted: boolean;
  isPlaying: boolean;
}

export interface VideoActions {
  reset: () => void;
  setMuted: (muted: boolean) => void;
  setVideoDuration: (duration: number) => void;
  setVideoTime: (time: number) => void;
  togglePlay: () => void;
}

export type VideoStore = VideoPlaybackState & VideoActions;

let videoServiceInstance: VideoService | null = null;

export class VideoService {
  public store;

  constructor() {
    this.store = createStore<VideoStore>((set, get) => ({
      currentTime: 0,
      duration: 0,
      isMuted: true,
      isPlaying: false,

      setVideoDuration: (duration) => {
        set({ duration });
      },

      setVideoTime: (time) => {
        set({ currentTime: time });
      },

      togglePlay: () => {
        const newState = !get().isPlaying;

        set({ isPlaying: newState });
      },

      setMuted: (muted) => {
        set({ isMuted: muted });
      },

      reset: () => {
        set({
          currentTime: 0,
          duration: 0,
          isMuted: true,
          isPlaying: false,
        });
      },
    }));
  }

  static getInstance(): VideoService {
    videoServiceInstance ??= new VideoService();

    return videoServiceInstance;
  }
}

export function getVideoService(): VideoService {
  return VideoService.getInstance();
}
