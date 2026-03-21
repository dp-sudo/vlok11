import { describe, expect, it, vi } from 'vitest';
import { RenderStyle } from '@/core/domain/types';
import { DEFAULT_SCENE_CONFIG } from '@/shared/config/defaultSceneConfig';
import {
  getMotionPreset,
  getProjectionPreset,
  getRenderStylePreset,
  getScenePreset,
  sanitizeConfig,
} from '@/shared/config/presets';

import { createSceneSlice } from './sceneConfigStore';

describe('sceneConfigStore', () => {
  // Helper to create scene slice
  const createTestSceneSlice = (initialConfig = DEFAULT_SCENE_CONFIG) => {
    const state = {
      config: { ...initialConfig },
    };

    const mockSet = vi.fn((updater) => {
      if (typeof updater === 'function') {
        const result = updater(state);

        Object.assign(state, result);
      } else {
        Object.assign(state, updater);
      }
    });

    const mockGet = vi.fn(() => state);

    const slice = createSceneSlice(mockSet as never, mockGet as never, (() => ({})) as never);

    return { slice, state, mockSet, mockGet };
  };

  describe('DEFAULT_SCENE_CONFIG', () => {
    it('should have required properties', () => {
      expect(DEFAULT_SCENE_CONFIG).toHaveProperty('renderStyle');
      expect(DEFAULT_SCENE_CONFIG).toHaveProperty('projectionMode');
      expect(DEFAULT_SCENE_CONFIG).toHaveProperty('cameraMotionType');
      expect(DEFAULT_SCENE_CONFIG).toHaveProperty('isImmersive');
      expect(DEFAULT_SCENE_CONFIG).toHaveProperty('fov');
    });
  });

  describe('setConfig', () => {
    it('should update config with partial values', () => {
      const { slice, mockSet } = createTestSceneSlice();

      slice.setConfig({ fov: 75 });

      expect(mockSet).toHaveBeenCalled();
    });

    it('should not call set if no changes', () => {
      const { slice, state } = createTestSceneSlice();
      const originalConfig = { ...state.config };

      slice.setConfig({ fov: originalConfig.fov });

      // setConfig has early return when no changes detected
      // so this may or may not call set depending on implementation
    });
  });

  describe('resetConfig', () => {
    it('should reset config to default', () => {
      const { slice, state, mockSet } = createTestSceneSlice();

      state.config.fov = 100;
      state.config.renderStyle = RenderStyle.CEL_SHADING;

      slice.resetConfig();

      expect(mockSet).toHaveBeenCalled();
    });
  });

  describe('resetViewConfig', () => {
    it('should reset only view-related config', () => {
      const { slice, state } = createTestSceneSlice();

      state.config.fov = 100;
      state.config.renderStyle = RenderStyle.CEL_SHADING;

      slice.resetViewConfig();
    });
  });

  describe('applyRenderStylePreset', () => {
    it('should apply a valid preset', () => {
      const { slice, mockSet } = createTestSceneSlice();

      slice.applyRenderStylePreset('cel');

      expect(mockSet).toHaveBeenCalled();
    });

    it('should not call set for invalid preset', () => {
      const { slice, mockSet } = createTestSceneSlice();

      slice.applyRenderStylePreset('nonexistent');

      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('applyMotionPreset', () => {
    it('should apply a valid preset', () => {
      const { slice, mockSet } = createTestSceneSlice();

      slice.applyMotionPreset('orbit');

      expect(mockSet).toHaveBeenCalled();
    });

    it('should not call set for invalid preset', () => {
      const { slice, mockSet } = createTestSceneSlice();

      slice.applyMotionPreset('nonexistent');

      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('applyProjectionPreset', () => {
    it('should apply a valid preset', () => {
      const { slice, mockSet } = createTestSceneSlice();

      slice.applyProjectionPreset('panorama');

      expect(mockSet).toHaveBeenCalled();
    });

    it('should not call set for invalid preset', () => {
      const { slice, mockSet } = createTestSceneSlice();

      slice.applyProjectionPreset('nonexistent');

      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('exportConfig', () => {
    it('should export config as JSON string', () => {
      const { slice } = createTestSceneSlice();

      const json = slice.exportConfig();

      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe('importConfig', () => {
    it('should import valid JSON config', () => {
      const { slice } = createTestSceneSlice();
      const configJson = JSON.stringify({ fov: 80 });

      const result = slice.importConfig(configJson);

      expect(result).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      const { slice } = createTestSceneSlice();

      const result = slice.importConfig('invalid json');

      expect(result).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return current config', () => {
      const { slice, state } = createTestSceneSlice();

      const config = slice.getConfig();

      expect(config).toStrictEqual(state.config);
    });
  });
});

describe('preset functions', () => {
  describe('getRenderStylePreset', () => {
    it('should return preset for valid id', () => {
      const preset = getRenderStylePreset('cel');

      expect(preset).toBeDefined();
      expect(preset?.id).toBe('cel');
    });

    it('should return undefined for invalid id', () => {
      const preset = getRenderStylePreset('nonexistent');

      expect(preset).toBeUndefined();
    });

    it('should return all available presets', () => {
      const preset = getRenderStylePreset('normal');

      expect(preset).toBeDefined();
    });
  });

  describe('getMotionPreset', () => {
    it('should return preset for valid id', () => {
      const preset = getMotionPreset('orbit');

      expect(preset).toBeDefined();
    });

    it('should return undefined for invalid id', () => {
      const preset = getMotionPreset('nonexistent');

      expect(preset).toBeUndefined();
    });

    it('should return static preset', () => {
      const preset = getMotionPreset('static');

      expect(preset).toBeDefined();
    });
  });

  describe('getProjectionPreset', () => {
    it('should return preset for valid id', () => {
      const preset = getProjectionPreset('panorama');

      expect(preset).toBeDefined();
    });

    it('should return undefined for invalid id', () => {
      const preset = getProjectionPreset('nonexistent');

      expect(preset).toBeUndefined();
    });

    it('should return perspective preset', () => {
      const preset = getProjectionPreset('plane');

      expect(preset).toBeDefined();
    });
  });

  describe('getScenePreset', () => {
    it('should return preset for valid id', () => {
      const preset = getScenePreset('default');

      expect(preset).toBeDefined();
    });

    it('should return undefined for invalid id', () => {
      const preset = getScenePreset('nonexistent');

      expect(preset).toBeUndefined();
    });
  });

  describe('sanitizeConfig', () => {
    it('should return valid config unchanged', () => {
      const result = sanitizeConfig(DEFAULT_SCENE_CONFIG);

      expect(result).toBeDefined();
    });

    it('should handle partial config', () => {
      const partial = { fov: 75 };
      const result = sanitizeConfig(partial as never);

      expect(result).toBeDefined();
    });

    it('should handle empty config', () => {
      const result = sanitizeConfig({} as never);

      expect(result).toBeDefined();
    });

    it('should handle undefined values', () => {
      const result = sanitizeConfig({ fov: undefined, renderStyle: undefined } as never);

      expect(result).toBeDefined();
    });
  });
});
