import { getEventBus } from '@/core/EventBus';
import { createLogger } from '@/core/Logger';
import { generateId } from '@/shared/utils';

import type { SceneConfig } from '@/shared/types';

export interface ConfigPreset {
  config: Partial<SceneConfig>;
  createdAt: number;
  id: string;
  name: string;
  thumbnail?: string;
  updatedAt: number;
}
interface PresetStorage {
  presets: ConfigPreset[];
  version: number;
}

const CURRENT_VERSION = 1;

export const getConfigPresetManager = (): ConfigPresetManagerImpl =>
  ConfigPresetManagerImpl.getInstance();
const logger = createLogger({ module: 'ConfigPresetManager' });
const STORAGE_KEY = 'immersa_config_presets';

class ConfigPresetManagerImpl {
  private static instance: ConfigPresetManagerImpl | null = null;
  private initialized = false;
  private presets: ConfigPreset[] = [];

  private constructor() {}

  static getInstance(): ConfigPresetManagerImpl {
    ConfigPresetManagerImpl.instance ??= new ConfigPresetManagerImpl();

    return ConfigPresetManagerImpl.instance;
  }

  clearAllPresets(): void {
    this.presets = [];
    this.saveToStorage();
    getEventBus().emit('preset:cleared', undefined);
    logger.info('Cleared all presets');
  }

  deletePreset(id: string): boolean {
    const index = this.presets.findIndex((p) => p.id === id);

    if (index === -1) {
      logger.warn(`Preset not found: ${id}`);

      return false;
    }

    const deleted = this.presets.splice(index, 1)[0];

    if (!deleted) return false;

    this.saveToStorage();
    getEventBus().emit('preset:deleted', { presetId: id, name: deleted.name });
    logger.info(`Deleted preset: ${deleted.name}`);

    return true;
  }

  exportPresets(): string {
    const data: PresetStorage = {
      version: CURRENT_VERSION,
      presets: this.presets,
    };

    return JSON.stringify(data, null, 2);
  }

  getAllPresets(): ConfigPreset[] {
    return [...this.presets];
  }

  getPreset(id: string): ConfigPreset | undefined {
    return this.presets.find((p) => p.id === id);
  }

  getPresetsByName(name: string): ConfigPreset[] {
    const lowered = name.toLowerCase();

    return this.presets.filter((p) => p.name.toLowerCase().includes(lowered));
  }

  importPresets(jsonData: string, merge = true): number {
    try {
      const data = JSON.parse(jsonData) as PresetStorage;

      if (!data.version || !Array.isArray(data.presets)) {
        throw new Error('Invalid preset data format');
      }

      const imported = data.presets.filter((p) => p.id && p.name && p.config && p.createdAt);

      if (merge) {
        const existingIds = new Set(this.presets.map((p) => p.id));

        for (const preset of imported) {
          if (!existingIds.has(preset.id)) {
            this.presets.push(preset);
          }
        }
      } else {
        this.presets = imported;
      }

      this.saveToStorage();
      logger.info(`Imported ${imported.length} presets`);

      return imported.length;
    } catch (error) {
      logger.error('Failed to import presets', { error: String(error) });

      throw error;
    }
  }

  initialize(): void {
    if (this.initialized) return;

    this.loadFromStorage();
    this.initialized = true;
    logger.info(`Initialized with ${this.presets.length} presets`);
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        this.presets = [];

        return;
      }

      const data = JSON.parse(stored) as PresetStorage;

      if (data.version === CURRENT_VERSION) {
        this.presets = data.presets;
      } else {
        this.presets = this.migratePresets(data);
      }
    } catch (error) {
      logger.error('Failed to load presets from storage', { error: String(error) });
      this.presets = [];
    }
  }

  private migratePresets(data: PresetStorage): ConfigPreset[] {
    logger.info(`Migrating presets from version ${data.version}`);

    return data.presets.map((p) => ({
      ...p,
      updatedAt: p.updatedAt ?? p.createdAt,
    }));
  }

  savePreset(name: string, config: Partial<SceneConfig>, thumbnail?: string): ConfigPreset {
    const now = Date.now();
    const preset: ConfigPreset = {
      id: generateId(),
      name,
      config: { ...config },
      thumbnail,
      createdAt: now,
      updatedAt: now,
    };

    this.presets.push(preset);
    this.saveToStorage();

    getEventBus().emit('preset:saved', { preset });
    logger.info(`Saved preset: ${name}`);

    return preset;
  }

  private saveToStorage(): void {
    try {
      const data: PresetStorage = {
        version: CURRENT_VERSION,
        presets: this.presets,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save presets to storage', { error: String(error) });
    }
  }

  updatePreset(
    id: string,
    updates: Partial<Pick<ConfigPreset, 'name' | 'config' | 'thumbnail'>>
  ): ConfigPreset | null {
    const index = this.presets.findIndex((p) => p.id === id);

    if (index === -1) {
      logger.warn(`Preset not found: ${id}`);

      return null;
    }

    const existing = this.presets[index];

    if (!existing) return null;

    const updated: ConfigPreset = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    this.presets[index] = updated;
    this.saveToStorage();

    getEventBus().emit('preset:updated', { preset: updated });

    return updated;
  }
}

export { ConfigPresetManagerImpl as ConfigPresetManager };
