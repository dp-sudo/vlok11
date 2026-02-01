import type { StateCreator } from 'zustand';
import { DEFAULT_SCENE_CONFIG } from '@/shared/config/defaultSceneConfig';

import type { SceneConfig } from '@/shared/types';
import { CameraMode, CameraMotionType, ProjectionMode } from '@/shared/types';

export interface SceneState {
  config: SceneConfig;
}

export interface SceneActions {
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
): SceneSlice => ({
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
});
