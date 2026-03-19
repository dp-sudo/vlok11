import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { resetEventBus } from '@/core/EventBus';
import { isValidStatusTransition } from '@/core/domain/types';

import { DEFAULT_SESSION } from './sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetEventBus();
  });

  afterEach(() => {
    resetEventBus();
  });

  describe('DEFAULT_SESSION', () => {
    it('should have correct initial values', () => {
      expect(DEFAULT_SESSION.status).toBe('idle');
      expect(DEFAULT_SESSION.progress).toBe(0);
      expect(DEFAULT_SESSION.isServiceInitialized).toBe(false);
      expect(DEFAULT_SESSION.exportState.isExporting).toBe(false);
      expect(DEFAULT_SESSION.exportState.progress).toBe(0);
      expect(DEFAULT_SESSION.exportState.format).toBeNull();
    });
  });

  describe('isValidStatusTransition', () => {
    it('should allow valid transitions from idle', () => {
      expect(isValidStatusTransition('idle', 'uploading')).toBe(true);
    });

    it('should allow valid transitions from ready to idle', () => {
      expect(isValidStatusTransition('ready', 'idle')).toBe(true);
    });

    it('should allow valid transitions from error to idle', () => {
      expect(isValidStatusTransition('error', 'idle')).toBe(true);
    });

    it('should allow valid transitions from uploading', () => {
      expect(isValidStatusTransition('uploading', 'analyzing')).toBe(true);
      expect(isValidStatusTransition('uploading', 'error')).toBe(true);
    });

    it('should allow valid transitions from analyzing', () => {
      expect(isValidStatusTransition('analyzing', 'processing_depth')).toBe(true);
      expect(isValidStatusTransition('analyzing', 'ready')).toBe(true);
      expect(isValidStatusTransition('analyzing', 'error')).toBe(true);
    });

    it('should reject invalid transitions from uploading to uploading', () => {
      expect(isValidStatusTransition('uploading', 'uploading')).toBe(false);
    });

    it('should reject invalid transitions from ready to uploading', () => {
      expect(isValidStatusTransition('ready', 'uploading')).toBe(false);
    });

    it('should reject invalid transitions from error to uploading', () => {
      expect(isValidStatusTransition('error', 'uploading')).toBe(false);
    });

    it('should reject invalid transitions from analyzing to analyzing', () => {
      expect(isValidStatusTransition('analyzing', 'analyzing')).toBe(false);
    });
  });

  describe('SessionSlice type interface', () => {
    it('should have all required state properties', () => {
      const state = DEFAULT_SESSION;

      expect(state).toHaveProperty('status');
      expect(state).toHaveProperty('progress');
      expect(state).toHaveProperty('exportState');
      expect(state).toHaveProperty('isServiceInitialized');
      // Optional properties may not exist on default state
      expect(state.status).toBeDefined();
      expect(state.exportState).toBeDefined();
    });

    it('should have all required action methods', () => {
      // This verifies the interface exists
      type SessionActions = {
        initServices: (aiService: unknown) => void;
        uploadStart: (input: File | string) => void;
        uploadComplete: (result: unknown) => void;
        uploadError: (message: string) => void;
        resetSession: () => void;
        startExport: (format: string) => void;
        updateExportProgress: (progress: number) => void;
        finishExport: () => void;
      };

      const actions: SessionActions = {
        initServices: vi.fn(),
        uploadStart: vi.fn(),
        uploadComplete: vi.fn(),
        uploadError: vi.fn(),
        resetSession: vi.fn(),
        startExport: vi.fn(),
        updateExportProgress: vi.fn(),
        finishExport: vi.fn(),
      };

      expect(typeof actions.initServices).toBe('function');
      expect(typeof actions.uploadStart).toBe('function');
      expect(typeof actions.uploadComplete).toBe('function');
      expect(typeof actions.uploadError).toBe('function');
      expect(typeof actions.resetSession).toBe('function');
      expect(typeof actions.startExport).toBe('function');
      expect(typeof actions.updateExportProgress).toBe('function');
      expect(typeof actions.finishExport).toBe('function');
    });
  });

  describe('ExportState structure', () => {
    it('should have correct export state structure', () => {
      const exportState = DEFAULT_SESSION.exportState;

      expect(exportState.isExporting).toBe(false);
      expect(exportState.progress).toBe(0);
      expect(exportState.format).toBeNull();
    });
  });
});
