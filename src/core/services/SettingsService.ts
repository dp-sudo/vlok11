import { createStore } from 'zustand';
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

// Web Crypto API based encryption for sensitive values
// Uses AES-GCM for authenticated encryption

const ENCRYPTION_KEY_NAME = 'immersa-settings-key';
const ENCRYPTED_API_KEY_NAME = 'immersa-settings-encrypted';

/**
 * Get or create the AES-GCM encryption key
 */
const getEncryptionKey = async (): Promise<CryptoKey> => {
  const rawKey = sessionStorage.getItem(ENCRYPTION_KEY_NAME);
  if (rawKey) {
    const keyData = JSON.parse(rawKey);
    return crypto.subtle.importKey(
      'jwk',
      keyData,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const exportedKey = await crypto.subtle.exportKey('jwk', key);
  sessionStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exportedKey));
  return key;
};

/**
 * Encrypt a string value using AES-GCM
 */
const encryptValue = async (value: string): Promise<string> => {
  if (!value) return value;
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch {
    return value;
  }
};

/**
 * Decrypt a string value using AES-GCM
 */
const decryptValue = async (value: string): Promise<string> => {
  if (!value) return value;
  try {
    if (!value.includes('-')) {
      return decodeURIComponent(atob(value));
    }

    const key = await getEncryptionKey();
    const combined = Uint8Array.from(atob(value), c => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch {
    return value;
  }
};

/**
 * Store encrypted API key to sessionStorage
 */
const storeEncryptedApiKey = async (apiKey: string): Promise<void> => {
  if (!apiKey) {
    sessionStorage.removeItem(ENCRYPTED_API_KEY_NAME);
    return;
  }
  const encrypted = await encryptValue(apiKey);
  sessionStorage.setItem(ENCRYPTED_API_KEY_NAME, encrypted);
};

/**
 * Retrieve and decrypt API key from sessionStorage
 */
const getEncryptedApiKey = async (): Promise<string> => {
  const stored = sessionStorage.getItem(ENCRYPTED_API_KEY_NAME);
  if (!stored) return '';
  return decryptValue(stored);
};

export class SettingsService {
  public store;

  constructor() {
    this.store = createStore<SettingsStore>()(
      persist(
        (set, get) => ({
          geminiApiKey: '',
          performanceMode: 'quality',
          useLocalAi: false,
          themeMode: 'dark' as ThemeMode,
          audioEnabled: true,
          audioVolume: 0.8,
          exportFormat: 'webm' as ExportFormat,
          exportFps: 60,
          exportResolution: '1920x1080',
          exportCodec: 'vp9',
          savedPresets: [],

          setApiKey: async (key) => {
            set({ geminiApiKey: key });
            await storeEncryptedApiKey(key);
          },

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
          storage: createJSONStorage(() => ({
            getItem: (name) => sessionStorage.getItem(name),
            setItem: (name, value) => sessionStorage.setItem(name, value),
            removeItem: (name) => sessionStorage.removeItem(name),
          })),
          partialize: (state) => {
            // Exclude geminiApiKey from persist - we handle it separately with encryption
            const { geminiApiKey: _omit, ...rest } = state;
            return rest;
          },
          onRehydrateStorage: () => (state) => {
            // After rehydration, load encrypted API key
            if (state) {
              getEncryptedApiKey().then((key) => {
                if (key && !state.geminiApiKey) {
                  state.geminiApiKey = key;
                }
              });
            }
          },
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
