import { createStore } from 'zustand';
import type { StateStorage } from 'zustand/middleware';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface AppSettings {
  geminiApiKey: string;
  performanceMode: 'quality' | 'speed';
  useLocalAi: boolean;
}

export interface SettingsStore extends AppSettings {
  setApiKey: (key: string) => void;
  setPerformanceMode: (mode: 'quality' | 'speed') => void;
  toggleLocalAi: (useLocal: boolean) => void;
}

let settingsServiceInstance: SettingsService | null = null;

// Simple encryption helper (base64 encoding for demonstration)
// In production, use a proper encryption library

const encryptValue = (value: string): string => {
  if (!value) return value;
  try {
    return btoa(encodeURIComponent(value));
  } catch {
    // 编码失败时返回原值
    return value;
  }
};

const decryptValue = (value: string): string => {
  if (!value) return value;
  try {
    return decodeURIComponent(atob(value));
  } catch {
    // 解码失败时返回原值
    return value;
  }
};

// Custom storage using sessionStorage with encryption
const createEncryptedStorage = (): StateStorage => {
  return {
    getItem: (name: string): string | null => {
      const value = sessionStorage.getItem(name);

      if (!value) return null;
      try {
        const parsed = JSON.parse(value);

        if (parsed.state?.geminiApiKey) {
          parsed.state.geminiApiKey = decryptValue(parsed.state.geminiApiKey);
        }

        return JSON.stringify(parsed);
      } catch {
        // JSON 解析失败时返回原始值
        return value;
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        const parsed = JSON.parse(value);

        if (parsed.state?.geminiApiKey) {
          parsed.state.geminiApiKey = encryptValue(parsed.state.geminiApiKey);
        }
        sessionStorage.setItem(name, JSON.stringify(parsed));
      } catch {
        // JSON 解析失败时直接存储原始值
        sessionStorage.setItem(name, value);
      }
    },
    removeItem: (name: string): void => {
      sessionStorage.removeItem(name);
    },
  };
};

export class SettingsService {
  public store;

  constructor() {
    this.store = createStore<SettingsStore>()(
      persist(
        (set) => ({
          geminiApiKey: import.meta.env['VITE_GEMINI_API_KEY'] ?? '',
          performanceMode: 'quality',
          useLocalAi: false,

          setApiKey: (key) => set({ geminiApiKey: key }),
          setPerformanceMode: (mode) => set({ performanceMode: mode }),
          toggleLocalAi: (useLocal) => set({ useLocalAi: useLocal }),
        }),
        {
          name: 'immersa-settings',
          storage: createJSONStorage(createEncryptedStorage),
        }
      )
    );
  }

  static getInstance(): SettingsService {
    settingsServiceInstance ??= new SettingsService();

    return settingsServiceInstance;
  }

  getApiKey(): string {
    return this.store.getState().geminiApiKey;
  }
}

export function getSettingsService(): SettingsService {
  return SettingsService.getInstance();
}
