import { create } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware';

import { createSceneSlice, type SceneSlice } from './sceneConfigStore';
import { createSessionSlice, type SessionSlice } from './sessionStore';
import { createVideoSlice, type VideoSlice } from './videoStore';

type AppStore = SessionSlice & VideoSlice & SceneSlice;

// 自定义 localStorage 存储，使用更短的 key
const localStorageStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.warn(`[localStorage] Failed to get item "${name}":`, error);

      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.warn(`[localStorage] Failed to set item "${name}":`, error);
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.warn(`[localStorage] Failed to remove item "${name}":`, error);
    }
  },
};

// S2 - 持久化版本控制
const CURRENT_VERSION = 1;

export const useAppStore = create<AppStore>()(
  persist(
    subscribeWithSelector((...a) => ({
      ...createVideoSlice(...a),
      ...createSessionSlice(...a),
      ...createSceneSlice(...a),
    })),
    {
      name: 'scene-config-v1',
      storage: createJSONStorage(() => localStorageStorage),
      // 只持久化 scene config 部分，避免持久化 session 和 video 状态
      partialize: (state) => ({
        config: state.config,
        _version: CURRENT_VERSION,
      }),
    }
  )
);

export const useSceneStore = useAppStore;
export const useSessionStore = useAppStore;
