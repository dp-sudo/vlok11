import { createLogger } from '@/core/Logger';
import { DEFAULT_SCENE_CONFIG } from '@/shared/config/defaultSceneConfig';
import { ColorGradePreset, RenderStyle } from '@/shared/types';

import type { LifecycleAware } from '@/core/LifecycleManager';
import type { SceneConfig } from '@/shared/types';

const logger = createLogger({ module: 'ConfigService' });

let configServiceInstance: ConfigServiceImpl | null = null;

export class ConfigServiceImpl implements ConfigService, LifecycleAware {
  private config: SceneConfig = { ...DEFAULT_CONFIG };
  readonly dependencies: string[] = [];

  readonly serviceId = 'config-service';

  static getInstance(): ConfigServiceImpl {
    configServiceInstance ??= new ConfigServiceImpl();

    return configServiceInstance;
  }

  static resetInstance(): void {
    configServiceInstance = null;
  }

  applyPreset(presetId: string): void {
    const preset = CONFIG_PRESETS.find((p) => p.id === presetId);

    if (!preset) {
      logger.warn(`Preset not found: ${presetId}`);

      return;
    }

    this.setConfig(preset.config);
  }

  async destroy(): Promise<void> {
    logger.info('ConfigService destroyed');
  }

  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  getConfig(): SceneConfig {
    return { ...this.config };
  }

  getPresets(): ConfigPreset[] {
    return [...CONFIG_PRESETS];
  }

  importConfig(jsonString: string): void {
    try {
      const imported = JSON.parse(jsonString) as Partial<SceneConfig>;
      const errors = this.validateConfig(imported);

      if (errors.length > 0) {
        throw new Error('无效的配置格式');
      }
      this.setConfig(imported);
    } catch (e) {
      logger.error('Failed to import config', { error: String(e) });
      throw e;
    }
  }

  async initialize(): Promise<void> {
    logger.info('ConfigService initialized');
  }

  resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };
  }

  setConfig(config: Partial<SceneConfig>): void {
    this.config = { ...this.config, ...config };
  }

  validateConfig(config: Partial<SceneConfig>): string[] {
    const errors: string[] = [];

    if (config.displacementScale !== undefined) {
      if (
        config.displacementScale < 0 ||
        config.displacementScale > CONFIG_LIMITS.DISPLACEMENT_SCALE_MAX
      ) {
        errors.push(
          `displacementScale must be between 0 and ${CONFIG_LIMITS.DISPLACEMENT_SCALE_MAX}`
        );
      }
    }

    if (config.fov !== undefined) {
      if (config.fov < CONFIG_LIMITS.FOV_MIN || config.fov > CONFIG_LIMITS.FOV_MAX) {
        errors.push(`fov must be between ${CONFIG_LIMITS.FOV_MIN} and ${CONFIG_LIMITS.FOV_MAX}`);
      }
    }

    if (config.exposure !== undefined) {
      if (config.exposure < 0 || config.exposure > CONFIG_LIMITS.EXPOSURE_MAX) {
        errors.push(`exposure must be between 0 and ${CONFIG_LIMITS.EXPOSURE_MAX}`);
      }
    }

    return errors;
  }
}

export interface ConfigPreset {
  config: Partial<SceneConfig>;
  description: string;
  id: string;
  name: string;
}

export interface ConfigService {
  applyPreset(presetId: string): void;
  getConfig(): SceneConfig;
  getPresets(): ConfigPreset[];
  resetConfig(): void;
  setConfig(config: Partial<SceneConfig>): void;
  validateConfig(config: Partial<SceneConfig>): string[];
}

const CONFIG_LIMITS = {
  DISPLACEMENT_SCALE_MAX: 10,
  FOV_MIN: 10,
  FOV_MAX: 150,
  EXPOSURE_MAX: 5,
} as const;

const CONFIG_PRESETS: ConfigPreset[] = [
  {
    id: 'anime',
    name: '动漫',
    description: '日式动画风格效果',
    config: {
      renderStyle: RenderStyle.ANIME,
      colorGrade: ColorGradePreset.JAPANESE,
      exposure: 1.1,
      contrast: 1.05,
      saturation: 1.1,
      enableVignette: false,
    },
  },
  {
    id: 'ink-wash',
    name: '水墨',
    description: '东方水墨画风格',
    config: {
      renderStyle: RenderStyle.INK_WASH,
      colorGrade: ColorGradePreset.NONE,
      exposure: 1.0,
      contrast: 1.2,
      saturation: 0,
      enableVignette: false,
    },
  },
  {
    id: 'hologram',
    name: '全息',
    description: '科幻全息投影效果',
    config: {
      renderStyle: RenderStyle.HOLOGRAM_V2,
      colorGrade: ColorGradePreset.NONE,
      enableVignette: false,
    },
  },
  {
    id: 'retro',
    name: '复古像素',
    description: '8位复古游戏风格',
    config: {
      renderStyle: RenderStyle.RETRO_PIXEL,
      colorGrade: ColorGradePreset.VHS,
      exposure: 1.0,
      enableVignette: true,
      vignetteStrength: 0.3,
    },
  },
];

const DEFAULT_CONFIG: SceneConfig = DEFAULT_SCENE_CONFIG;

export function getConfigService(): ConfigService {
  return ConfigServiceImpl.getInstance();
}

export function resetConfigService(): void {
  ConfigServiceImpl.resetInstance();
}
