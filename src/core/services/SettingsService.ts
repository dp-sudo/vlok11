import { createStore } from 'zustand';
import { persist } from 'zustand/middleware';

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
