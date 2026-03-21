import { createStore } from 'zustand';
import type { StateStorage } from 'zustand/middleware';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light' | 'system';
export type ExportFormat = 'webm' | 'gif' | 'mp4' | 'png' | 'jpg';
export type AudioEnabled = boolean;
export type AudioVolume = number;

export interface AppSettings {
  geminiApiKey: string;
  performanceMode: 'quality' | 'speed';
  useLocalAi: boolean;
  // 主题设置
  themeMode: ThemeMode;
  // 音频设置
  audioEnabled: boolean;
  audioVolume: number;
  // 导出设置
  exportFormat: ExportFormat;
  exportFps: number;
  exportResolution: string;
  exportCodec: string;
  // 预设管理
  savedPresets: SavedPreset[];
}

export interface SavedPreset {
  config: unknown;
  name: string;
  timestamp: number;
}

export interface SettingsStore extends AppSettings {
  setApiKey: (key: string) => void;
  setPerformanceMode: (mode: 'quality' | 'speed') => void;
  toggleLocalAi: (useLocal: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setAudioVolume: (volume: number) => void;
  setExportFormat: (format: ExportFormat) => void;
  setExportFps: (fps: number) => void;
  setExportResolution: (resolution: string) => void;
  setExportCodec: (codec: string) => void;
  savePreset: (name: string, config: unknown) => void;
  loadPreset: (name: string) => unknown | null;
  deletePreset: (name: string) => void;
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
        (set, get) => ({
          geminiApiKey: import.meta.env['VITE_GEMINI_API_KEY'] ?? '',
          performanceMode: 'quality',
          useLocalAi: false,
          // 主题设置
          themeMode: 'dark' as ThemeMode,
          // 音频设置
          audioEnabled: true,
          audioVolume: 0.8,
          // 导出设置
          exportFormat: 'webm' as ExportFormat,
          exportFps: 60,
          exportResolution: '1920x1080',
          exportCodec: 'vp9',
          // 预设管理
          savedPresets: [],

          setApiKey: (key) => set({ geminiApiKey: key }),
          setPerformanceMode: (mode) => set({ performanceMode: mode }),
          toggleLocalAi: (useLocal) => set({ useLocalAi: useLocal }),
          setThemeMode: (mode) => set({ themeMode: mode }),
          setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
          setAudioVolume: (volume) => set({ audioVolume: Math.max(0, Math.min(1, volume)) }),
          setExportFormat: (format) => set({ exportFormat: format }),
          setExportFps: (fps) => set({ exportFps: Math.max(15, Math.min(120, fps)) }),
          setExportResolution: (resolution) => set({ exportResolution: resolution }),
          setExportCodec: (codec) => set({ exportCodec: codec }),
          savePreset: (name, config) => {
            const trimmedName = name.trim();

            if (!trimmedName) return;

            const nextPreset: SavedPreset = {
              name: trimmedName,
              config,
              timestamp: Date.now(),
            };

            const presets = get().savedPresets;
            const existing = presets.findIndex((preset) => preset.name === trimmedName);

            if (existing >= 0) {
              set({
                savedPresets: presets.map((preset, index) =>
                  index === existing ? nextPreset : preset
                ),
              });

              return;
            }

            set({ savedPresets: [...presets, nextPreset] });
          },
          loadPreset: (name) => {
            const preset = get().savedPresets.find((savedPreset) => savedPreset.name === name);

            return preset?.config ?? null;
          },
          deletePreset: (name) => {
            const presets = get().savedPresets.filter((preset) => preset.name !== name);

            set({ savedPresets: presets });
          },
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
