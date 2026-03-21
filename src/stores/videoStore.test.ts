import { describe, expect, it, vi } from 'vitest';

import { createVideoSlice, DEFAULT_VIDEO, type VideoSlice } from './videoStore';

describe('videoStore', () => {
  // Create a fresh store instance for testing
  const createTestVideoStore = () => {
    let initialState: VideoSlice | undefined;

    return {
      getState: () => {
        initialState ??= createVideoSlice(
          (set) => set,
          () => initialState!,
          {} as never
        );

        return initialState;
      },
    };
  };

  describe('DEFAULT_VIDEO', () => {
    it('should have correct initial values', () => {
      expect(DEFAULT_VIDEO.currentTime).toBe(0);
      expect(DEFAULT_VIDEO.duration).toBe(0);
      expect(DEFAULT_VIDEO.isLooping).toBe(true);
      expect(DEFAULT_VIDEO.isMuted).toBe(true);
      expect(DEFAULT_VIDEO.isPlaying).toBe(false);
      expect(DEFAULT_VIDEO.playbackRate).toBe(1.0);
    });
  });

  describe('createVideoSlice', () => {
    it('should create a slice with default values', () => {
      const store = createTestVideoStore();
      const state = store.getState();

      expect(state.currentTime).toBe(0);
      expect(state.duration).toBe(0);
      expect(state.isLooping).toBe(true);
      expect(state.isMuted).toBe(true);
      expect(state.isPlaying).toBe(false);
      expect(state.playbackRate).toBe(1.0);
    });

    it('should set video duration', () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn().mockReturnValue({ currentTime: 0 });
      const slice = createVideoSlice(mockSet as never, mockGet as never, {} as never);

      slice.setVideoDuration(120);

      expect(mockSet).toHaveBeenCalledWith({ duration: 120, currentTime: 0 });
    });

    it('should set video time', () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn().mockReturnValue({ duration: 100 });
      const slice = createVideoSlice(mockSet as never, mockGet as never, {} as never);

      slice.setVideoTime(45);

      expect(mockSet).toHaveBeenCalledWith({ currentTime: 45 });
    });

    it('should toggle play state', () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn().mockReturnValue({ isPlaying: false });
      const slice = createVideoSlice(mockSet as never, mockGet as never, {} as never);

      slice.togglePlay();
      expect(mockSet).toHaveBeenCalledWith({ isPlaying: true });

      mockSet.mockClear();
      mockGet.mockReturnValue({ isPlaying: true });
      slice.togglePlay();
      expect(mockSet).toHaveBeenCalledWith({ isPlaying: false });
    });

    it('should set muted state', () => {
      const mockSet = vi.fn();
      const slice = createVideoSlice(mockSet as never, vi.fn() as never, {} as never);

      slice.setMuted(false);
      expect(mockSet).toHaveBeenCalledWith({ isMuted: false });

      mockSet.mockClear();
      slice.setMuted(true);
      expect(mockSet).toHaveBeenCalledWith({ isMuted: true });
    });

    it('should toggle loop state', () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn().mockReturnValue({ isLooping: true });
      const slice = createVideoSlice(mockSet as never, mockGet as never, {} as never);

      slice.toggleLoop();
      expect(mockSet).toHaveBeenCalledWith({ isLooping: false });

      mockSet.mockClear();
      mockGet.mockReturnValue({ isLooping: false });
      slice.toggleLoop();
      expect(mockSet).toHaveBeenCalledWith({ isLooping: true });
    });

    it('should set playback rate', () => {
      const mockSet = vi.fn();
      const slice = createVideoSlice(mockSet as never, vi.fn() as never, {} as never);

      slice.setPlaybackRate(1.5);
      expect(mockSet).toHaveBeenCalledWith({ playbackRate: 1.5 });
    });

    it('should reset video to default state', () => {
      const mockSet = vi.fn();
      const slice = createVideoSlice(mockSet as never, vi.fn() as never, {} as never);

      slice.resetVideo();
      expect(mockSet).toHaveBeenCalledWith(DEFAULT_VIDEO);
    });

    it('should pause video', () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn().mockReturnValue({ isPlaying: true });
      const slice = createVideoSlice(mockSet as never, mockGet as never, {} as never);

      slice.pause();
      expect(mockSet).toHaveBeenCalledWith({ isPlaying: false });
    });

    it('should set play state directly', () => {
      const mockSet = vi.fn();
      const slice = createVideoSlice(mockSet as never, vi.fn() as never, {} as never);

      slice.setPlaying(true);
      expect(mockSet).toHaveBeenCalledWith({ isPlaying: true });

      mockSet.mockClear();
      slice.setPlaying(false);
      expect(mockSet).toHaveBeenCalledWith({ isPlaying: false });
    });

    it('should set loop state directly', () => {
      const mockSet = vi.fn();
      const slice = createVideoSlice(mockSet as never, vi.fn() as never, {} as never);

      slice.setLooping(false);
      expect(mockSet).toHaveBeenCalledWith({ isLooping: false });

      mockSet.mockClear();
      slice.setLooping(true);
      expect(mockSet).toHaveBeenCalledWith({ isLooping: true });
    });

    it('should seek to specific time', () => {
      const mockSet = vi.fn();
      // seek calls get().setVideoTime, so we need to mock that
      const mockGet = vi.fn().mockReturnValue({
        setVideoTime: vi.fn(),
        duration: 100,
      });
      const slice = createVideoSlice(mockSet as never, mockGet as never, {} as never);

      slice.seek(50);
      // seek calls setVideoTime internally, verify it was called
      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle NaN duration', () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn().mockReturnValue({ currentTime: 0 });
      const slice = createVideoSlice(mockSet as never, mockGet as never, {} as never);

      slice.setVideoDuration(NaN);

      expect(mockSet).toHaveBeenCalledWith({ duration: 0, currentTime: 0 });
    });

    it('should handle Infinity duration', () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn().mockReturnValue({ currentTime: 0 });
      const slice = createVideoSlice(mockSet as never, mockGet as never, {} as never);

      slice.setVideoDuration(Infinity);

      expect(mockSet).toHaveBeenCalledWith({ duration: 0, currentTime: 0 });
    });

    it('should handle negative duration', () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn().mockReturnValue({ currentTime: 0 });
      const slice = createVideoSlice(mockSet as never, mockGet as never, {} as never);

      slice.setVideoDuration(-10);

      expect(mockSet).toHaveBeenCalledWith({ duration: 0, currentTime: 0 });
    });

    it('should clamp currentTime when duration is reduced', () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn().mockReturnValue({ currentTime: 50 });
      const slice = createVideoSlice(mockSet as never, mockGet as never, {} as never);

      slice.setVideoDuration(30);

      expect(mockSet).toHaveBeenCalledWith({ duration: 30, currentTime: 30 });
    });

    it('should handle NaN time in setVideoTime', () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn().mockReturnValue({ duration: 100 });
      const slice = createVideoSlice(mockSet as never, mockGet as never, {} as never);

      slice.setVideoTime(NaN);

      expect(mockSet).toHaveBeenCalledWith({ currentTime: 0 });
    });

    it('should handle negative time in setVideoTime', () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn().mockReturnValue({ duration: 100 });
      const slice = createVideoSlice(mockSet as never, mockGet as never, {} as never);

      slice.setVideoTime(-5);

      expect(mockSet).toHaveBeenCalledWith({ currentTime: 0 });
    });

    it('should clamp time exceeding duration', () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn().mockReturnValue({ duration: 100 });
      const slice = createVideoSlice(mockSet as never, mockGet as never, {} as never);

      slice.setVideoTime(150);

      expect(mockSet).toHaveBeenCalledWith({ currentTime: 100 });
    });

    it('should handle NaN playback rate', () => {
      const mockSet = vi.fn();
      const slice = createVideoSlice(mockSet as never, vi.fn() as never, {} as never);

      slice.setPlaybackRate(NaN);

      expect(mockSet).toHaveBeenCalledWith({ playbackRate: 1.0 });
    });

    it('should handle Infinity playback rate', () => {
      const mockSet = vi.fn();
      const slice = createVideoSlice(mockSet as never, vi.fn() as never, {} as never);

      slice.setPlaybackRate(Infinity);

      expect(mockSet).toHaveBeenCalledWith({ playbackRate: 1.0 });
    });

    it('should clamp playback rate below minimum', () => {
      const mockSet = vi.fn();
      const slice = createVideoSlice(mockSet as never, vi.fn() as never, {} as never);

      slice.setPlaybackRate(0.01);

      expect(mockSet).toHaveBeenCalledWith({ playbackRate: 0.1 });
    });

    it('should clamp playback rate above maximum', () => {
      const mockSet = vi.fn();
      const slice = createVideoSlice(mockSet as never, vi.fn() as never, {} as never);

      slice.setPlaybackRate(10);

      expect(mockSet).toHaveBeenCalledWith({ playbackRate: 4.0 });
    });

    it('should handle undefined duration in get', () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn().mockReturnValue({ duration: undefined });
      const slice = createVideoSlice(mockSet as never, mockGet as never, {} as never);

      slice.setVideoTime(50);

      expect(mockSet).toHaveBeenCalledWith({ currentTime: 0 });
    });
  });
});
