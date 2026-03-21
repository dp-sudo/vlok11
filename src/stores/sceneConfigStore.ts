import type { StateCreator } from 'zustand';
import { CameraMode, CameraMotionType, ProjectionMode } from '@/core/domain/types';
import { createLogger } from '@/core/Logger';
import { DEFAULT_SCENE_CONFIG } from '@/shared/config/defaultSceneConfig';
import {
  getMotionPreset,
  getProjectionPreset,
  getRenderStylePreset,
  getScenePreset,
  sanitizeConfig,
} from '@/shared/config/presets';
import type { SceneConfig } from '@/shared/types';

const logger = createLogger({ module: 'sceneConfigStore' });

export interface SceneState {
  config: SceneConfig;
}

export interface SceneActions {
  applyRenderStylePreset: (presetId: string) => void;
  applyMotionPreset: (presetId: string) => void;
  applyProjectionPreset: (presetId: string) => void;
  applyScenePreset: (presetId: string) => void;
  exportConfig: () => string;
  getConfig: () => SceneConfig;
  importConfig: (json: string) => boolean;
  resetConfig: () => void;
  resetViewConfig: () => void;
  setConfig: (
    updater: Partial<SceneConfig> | ((prev: SceneConfig) => Partial<SceneConfig>)
  ) => void;
}

export type SceneSlice = SceneState & SceneActions;

const IMMERSIVE_MODES = [
  ProjectionMode.INFINITE_BOX,
  ProjectionMode.CORNER,
  ProjectionMode.CUBE,
  ProjectionMode.PANORAMA,
  ProjectionMode.SPHERE,
  ProjectionMode.DOME,
  ProjectionMode.CYLINDER,
];

const hasSceneConfigChanges = (oldConfig: SceneConfig, changes: Partial<SceneConfig>): boolean => {
  for (const key of Object.keys(changes) as (keyof SceneConfig)[]) {
    if (!Object.is(oldConfig[key], changes[key])) return true;
  }

  return false;
};

export const createSceneSlice = <T extends SceneSlice>(
  set: Parameters<StateCreator<T>>[0],
  get: Parameters<StateCreator<T>>[1],
  _api: Parameters<StateCreator<T>>[2]
): SceneSlice => {
  // Apply preset with proper immersive mode handling
  const applyPresetWithImmersive = (presetConfig: Partial<SceneConfig>): Partial<SceneConfig> => {
    const nextChanges = { ...presetConfig };

    if (nextChanges.projectionMode !== undefined) {
      const shouldImmersive = IMMERSIVE_MODES.includes(nextChanges.projectionMode);

      nextChanges.isImmersive = shouldImmersive;
      if (shouldImmersive) {
        nextChanges.cameraMode = CameraMode.PERSPECTIVE;
      }
    }

    return nextChanges;
  };

  return {
    config: DEFAULT_SCENE_CONFIG,

    setConfig: (updater) => {
      const oldConfig = get().config;
      const changes = typeof updater === 'function' ? updater(oldConfig) : updater;

      if (!hasSceneConfigChanges(oldConfig, changes)) return;

      const nextChanges: Partial<SceneConfig> = { ...changes };

      if (nextChanges.projectionMode !== undefined) {
        const shouldImmersive = IMMERSIVE_MODES.includes(nextChanges.projectionMode);

        nextChanges.isImmersive = shouldImmersive;
        if (shouldImmersive) {
          nextChanges.cameraMode = CameraMode.PERSPECTIVE;
        }
      }

      set({ config: { ...oldConfig, ...nextChanges } } as Partial<T>);
    },

    resetConfig: () => {
      set({ config: DEFAULT_SCENE_CONFIG } as Partial<T>);
    },

    resetViewConfig: () => {
      const oldConfig = get().config;
      const viewChanges = {
        cameraMotionType: CameraMotionType.STATIC,
        isImmersive: false,
        fov: 50,
      };

      if (!hasSceneConfigChanges(oldConfig, viewChanges)) return;
      set({ config: { ...oldConfig, ...viewChanges } } as Partial<T>);
    },

    applyRenderStylePreset: (presetId: string) => {
      const preset = getRenderStylePreset(presetId);

      if (!preset) return;

      const oldConfig = get().config;
      const nextChanges = applyPresetWithImmersive(preset.config);

      if (!hasSceneConfigChanges(oldConfig, nextChanges)) return;
      set({ config: { ...oldConfig, ...nextChanges } } as Partial<T>);
    },

    applyMotionPreset: (presetId: string) => {
      const preset = getMotionPreset(presetId);

      if (!preset) return;

      const oldConfig = get().config;
      const nextChanges = applyPresetWithImmersive(preset.config);

      if (!hasSceneConfigChanges(oldConfig, nextChanges)) return;
      set({ config: { ...oldConfig, ...nextChanges } } as Partial<T>);
    },

    applyProjectionPreset: (presetId: string) => {
      const preset = getProjectionPreset(presetId);

      if (!preset) return;

      const oldConfig = get().config;
      const nextChanges = applyPresetWithImmersive(preset.config);

      if (!hasSceneConfigChanges(oldConfig, nextChanges)) return;
      set({ config: { ...oldConfig, ...nextChanges } } as Partial<T>);
    },

    applyScenePreset: (presetId: string) => {
      const preset = getScenePreset(presetId);

      if (!preset) return;

      const oldConfig = get().config;
      const nextChanges = applyPresetWithImmersive(preset.config);

      if (!hasSceneConfigChanges(oldConfig, nextChanges)) return;
      set({ config: { ...oldConfig, ...nextChanges } } as Partial<T>);
    },

    exportConfig: () => {
      const { config } = get();

      return JSON.stringify(sanitizeConfig(config), null, 2);
    },

    importConfig: (json: string) => {
      try {
        const imported = JSON.parse(json);

        // S4 - 添加 Schema 验证
        if (!imported || typeof imported !== 'object') return false;

        // 验证基本结构：必须包含至少一个有效的配置字段
        const validKeys = [
          'cameraMode',
          'cameraMotionType',
          'renderStyle',
          'projectionMode',
          'isImmersive',
          'fov',
          'displacementScale',
          'depthEdgeStrength',
          'motionSpeed',
          'motionAmplitude',
          'bloomStrength',
          'chromaticAberration',
        ];
        const hasValidKey = validKeys.some((key) => key in imported);

        if (!hasValidKey) return false;

        const oldConfig = get().config;
        const nextChanges = applyPresetWithImmersive(imported);

        if (!hasSceneConfigChanges(oldConfig, nextChanges)) return true;
        set({ config: { ...oldConfig, ...nextChanges } } as Partial<T>);

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        logger.warn('Failed to import config', { error: errorMessage });

        return false;
      }
    },

    getConfig: () => {
      // 返回深拷贝以防止外部修改内部状态
      return structuredClone(get().config);
    },
  };
};
