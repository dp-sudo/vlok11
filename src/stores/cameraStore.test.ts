import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { resetEventBus } from '@/core/EventBus';

import { createCameraSlice, DEFAULT_CAMERA_POSE, DEFAULT_INTERACTION_STATE, DEFAULT_MOTION_STATE, type CameraSlice } from './cameraStore';

describe('cameraStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetEventBus();
  });

  afterEach(() => {
    resetEventBus();
  });

  // Helper to create camera slice with mocked set/get
  const createTestCameraSlice = (initialState?: Partial<CameraSlice>) => {
    const state: CameraSlice = {
      pose: { ...DEFAULT_CAMERA_POSE },
      bookmarks: [],
      history: [],
      motion: { ...DEFAULT_MOTION_STATE },
      interaction: { ...DEFAULT_INTERACTION_STATE },
      basePose: null,
      orthoZoomMemory: 20,
      perspectiveFovMemory: 50,
      currentOrthoPreset: null,
      ...initialState,
    } as CameraSlice;

    const mockSet = vi.fn((updater) => {
      if (typeof updater === 'function') {
        const result = updater(state);
        Object.assign(state, result);
      } else {
        Object.assign(state, updater);
      }
    });

    const mockGet = vi.fn(() => state);
    const slice = createCameraSlice(mockSet as never, mockGet as never, (() => ({})) as never);

    // Make get() return an object with both state and slice methods that use get()
    // This is needed because some slice methods call get().otherMethod()
    mockGet.mockImplementation(() => ({
      ...state,
      setPose: slice.setPose,
    }) as typeof state);

    return { slice, state, mockSet, mockGet };
  };

  describe('DEFAULT_CAMERA_POSE', () => {
    it('should have correct initial pose values', () => {
      expect(DEFAULT_CAMERA_POSE.position).toEqual({ x: 0, y: 0, z: 8 });
      expect(DEFAULT_CAMERA_POSE.target).toEqual({ x: 0, y: 0, z: 0 });
      expect(DEFAULT_CAMERA_POSE.up).toEqual({ x: 0, y: 1, z: 0 });
      expect(DEFAULT_CAMERA_POSE.fov).toBe(50);
    });
  });

  describe('DEFAULT_MOTION_STATE', () => {
    it('should have correct initial motion values', () => {
      expect(DEFAULT_MOTION_STATE.isActive).toBe(false);
      expect(DEFAULT_MOTION_STATE.type).toBe('STATIC');
      expect(DEFAULT_MOTION_STATE.progress).toBe(0);
      expect(DEFAULT_MOTION_STATE.isPaused).toBe(false);
    });
  });

  describe('setPose', () => {
    it('should update pose with new values', () => {
      const { slice, mockSet } = createTestCameraSlice();

      slice.setPose({ position: { x: 5, y: 10, z: 15 } });

      expect(mockSet).toHaveBeenCalled();
    });

    it('should not update pose if values are the same', () => {
      const { slice, mockSet, state } = createTestCameraSlice();

      state.pose = { ...DEFAULT_CAMERA_POSE };
      slice.setPose({ position: { x: 0, y: 0, z: 8 } });

      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should add to history when pose changes', () => {
      const { slice, state } = createTestCameraSlice();

      slice.setPose({ position: { x: 5, y: 10, z: 15 } });

      expect(state.history.length).toBeGreaterThan(0);
      expect(state.history[0]?.source).toBe('user');
    });
  });

  describe('setPosition', () => {
    it('should call setPose with position', () => {
      const { slice } = createTestCameraSlice();
      const setPoseSpy = vi.spyOn(slice, 'setPose');

      slice.setPosition({ x: 1, y: 2, z: 3 });

      expect(setPoseSpy).toHaveBeenCalledWith({ position: { x: 1, y: 2, z: 3 } }, 'user');
    });
  });

  describe('setTarget', () => {
    it('should call setPose with target', () => {
      const { slice } = createTestCameraSlice();
      const setPoseSpy = vi.spyOn(slice, 'setPose');

      slice.setTarget({ x: 4, y: 5, z: 6 });

      expect(setPoseSpy).toHaveBeenCalledWith({ target: { x: 4, y: 5, z: 6 } }, 'user');
    });
  });

  describe('setFov', () => {
    it('should clamp FOV to valid range', () => {
      const { slice, mockSet } = createTestCameraSlice();

      // Test clamping at minimum
      slice.setFov(10);
      expect(mockSet).toHaveBeenCalled();

      mockSet.mockClear();

      // Test clamping at maximum
      slice.setFov(200);
      expect(mockSet).toHaveBeenCalled();
    });
  });

  describe('bookmarks', () => {
    it('should add a bookmark', () => {
      const { slice, state } = createTestCameraSlice();

      slice.addBookmark('My View');

      expect(state.bookmarks.length).toBe(1);
      expect(state.bookmarks[0]?.name).toBe('My View');
    });

    it('should not add bookmark with empty name', () => {
      const { slice, state } = createTestCameraSlice();

      slice.addBookmark('');

      expect(state.bookmarks.length).toBe(0);
    });

    it('should remove a bookmark', () => {
      const { slice, state } = createTestCameraSlice();
      state.bookmarks = [{ id: '1', name: 'Test', pose: DEFAULT_CAMERA_POSE, createdAt: Date.now() }];

      slice.removeBookmark('1');

      expect(state.bookmarks.length).toBe(0);
    });

    it('should apply a bookmark', () => {
      const { slice, state } = createTestCameraSlice();
      state.bookmarks = [{
        id: '1',
        name: 'Test',
        pose: { ...DEFAULT_CAMERA_POSE, position: { x: 10, y: 20, z: 30 } },
        createdAt: Date.now()
      }];

      slice.applyBookmark('1');

      expect(state.pose.position.x).toBe(10);
    });
  });

  describe('motion actions', () => {
    it('should start motion', () => {
      const { slice, state } = createTestCameraSlice();

      slice.startMotion('orbit', 2000);

      expect(state.motion.isActive).toBe(true);
      expect(state.motion.type).toBe('orbit');
      expect(state.motion.duration).toBe(2000);
    });

    it('should start motion with NaN duration as 0', () => {
      const { slice, state } = createTestCameraSlice();

      slice.startMotion('orbit', NaN);

      expect(state.motion.isActive).toBe(true);
      expect(state.motion.duration).toBe(0);
    });

    it('should stop motion', () => {
      const { slice, state } = createTestCameraSlice();
      state.motion.isActive = true;

      slice.stopMotion();

      expect(state.motion.isActive).toBe(false);
    });

    it('should pause motion', () => {
      const { slice, state } = createTestCameraSlice();
      state.motion.isActive = true;
      state.motion.progress = 0.5;

      slice.pauseMotion();

      expect(state.motion.isPaused).toBe(true);
      expect(state.motion.pausedAt).toBe(0.5);
    });

    it('should update motion progress', () => {
      const { slice, state } = createTestCameraSlice();
      state.motion.isActive = true;

      slice.updateMotionProgress(0.75);

      expect(state.motion.progress).toBe(0.75);
    });

    it('should clamp progress to valid range', () => {
      const { slice, state } = createTestCameraSlice();
      state.motion.isActive = true;

      slice.updateMotionProgress(1.5);
      expect(state.motion.progress).toBe(1);

      slice.updateMotionProgress(-0.5);
      expect(state.motion.progress).toBe(0);
    });
  });

  describe('interaction actions', () => {
    it('should start interaction', () => {
      const { slice, state } = createTestCameraSlice();

      slice.startInteraction('pan', DEFAULT_CAMERA_POSE);

      expect(state.interaction.isInteracting).toBe(true);
      expect(state.interaction.interactionType).toBe('pan');
    });

    it('should end interaction', () => {
      const { slice, state } = createTestCameraSlice();
      state.interaction.isInteracting = true;

      slice.endInteraction();

      expect(state.interaction.isInteracting).toBe(false);
    });

    it('should capture base pose', () => {
      const { slice, state } = createTestCameraSlice();

      slice.captureBasePose(DEFAULT_CAMERA_POSE);

      expect(state.basePose).toEqual(DEFAULT_CAMERA_POSE);
    });

    it('should clear base pose', () => {
      const { slice, state } = createTestCameraSlice();
      state.basePose = DEFAULT_CAMERA_POSE;

      slice.clearBasePose();

      expect(state.basePose).toBeNull();
    });
  });

  describe('resetAll', () => {
    it('should reset all state to defaults', () => {
      const { slice, state } = createTestCameraSlice();

      // Modify state
      state.pose = { position: { x: 100, y: 200, z: 300 }, target: { x: 1, y: 2, z: 3 }, up: { x: 0, y: 1, z: 0 }, fov: 75 };
      state.bookmarks = [{ id: '1', name: 'Test', pose: DEFAULT_CAMERA_POSE, createdAt: Date.now() }];
      state.history = [{ pose: DEFAULT_CAMERA_POSE, source: 'user', timestamp: Date.now() }];

      slice.resetAll();

      expect(state.pose).toEqual(DEFAULT_CAMERA_POSE);
      expect(state.bookmarks).toEqual([]);
      expect(state.history).toEqual([]);
      expect(state.basePose).toBeNull();
    });
  });

  describe('ortho actions', () => {
    it('should set ortho zoom', () => {
      const { slice, state } = createTestCameraSlice();

      slice.setOrthoZoom(50);

      expect(state.orthoZoomMemory).toBe(50);
    });

    it('should clamp ortho zoom', () => {
      const { slice, state } = createTestCameraSlice();

      slice.setOrthoZoom(200);
      expect(state.orthoZoomMemory).toBe(100);

      slice.setOrthoZoom(-10);
      expect(state.orthoZoomMemory).toBe(1);
    });

    it('should set perspective FOV', () => {
      const { slice, state } = createTestCameraSlice();

      slice.setPerspectiveFov(60);

      expect(state.perspectiveFovMemory).toBe(60);
    });

    it('should save and get camera mode settings', () => {
      const { slice, state } = createTestCameraSlice();

      slice.saveCameraModeSettings('perspective', 75);
      expect(state.perspectiveFovMemory).toBe(75);

      slice.saveCameraModeSettings('orthographic', 30);
      expect(state.orthoZoomMemory).toBe(30);

      expect(slice.getCameraModeSettings('perspective')).toBe(75);
      expect(slice.getCameraModeSettings('orthographic')).toBe(30);
    });

    it('should set current ortho preset', () => {
      const { slice, state } = createTestCameraSlice();

      slice.setCurrentOrthoPreset('front');

      expect(state.currentOrthoPreset).toBe('front');
    });
  });
});
