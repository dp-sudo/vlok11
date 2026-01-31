import { createLogger } from '@/core/Logger';

import type { LifecycleAware } from '@/core/LifecycleManager';

const logger = createLogger({ module: 'PrecisionConfigService' });

export interface PrecisionControlConfig {
  moveSensitivity: number;
  rotateSensitivity: number;
  zoomSensitivity: number;
  dampingFactor: number;
  fovStep: number;
  fovRange: { min: number; max: number };
  minMoveThreshold: number;
}

export interface PrecisionConfigServiceInterface extends LifecycleAware {
  getConfig(): PrecisionControlConfig;
  setConfig(config: Partial<PrecisionControlConfig>): void;
  applyPreset(presetId: string): void;
  reset(): void;
}

const DEFAULT_PRECISION_CONFIG: PrecisionControlConfig = {
  moveSensitivity: 1.0,
  rotateSensitivity: 1.0,
  zoomSensitivity: 1.0,
  dampingFactor: 0.1,
  fovStep: 1.0,
  fovRange: { min: 1, max: 180 },
  minMoveThreshold: 0.001,
};

const PRECISION_PRESETS: Record<string, Partial<PrecisionControlConfig>> = {
  smooth: {
    dampingFactor: 0.2,
    moveSensitivity: 0.7,
    rotateSensitivity: 0.7,
    zoomSensitivity: 0.8,
  },
  precise: {
    dampingFactor: 0.05,
    moveSensitivity: 1.5,
    rotateSensitivity: 1.5,
    zoomSensitivity: 1.5,
  },
  cinematic: {
    dampingFactor: 0.3,
    moveSensitivity: 0.5,
    rotateSensitivity: 0.5,
    zoomSensitivity: 0.5,
  },
  standard: {},
};

let precisionConfigInstance: PrecisionConfigService | null = null;

export class PrecisionConfigService implements PrecisionConfigServiceInterface, LifecycleAware {
  private config: PrecisionControlConfig = { ...DEFAULT_PRECISION_CONFIG };
  readonly dependencies: string[] = [];
  readonly serviceId = 'precision-config-service';

  static getInstance(): PrecisionConfigService {
    precisionConfigInstance ??= new PrecisionConfigService();

    return precisionConfigInstance;
  }

  static resetInstance(): void {
    precisionConfigInstance = null;
  }

  applyPreset(presetId: string): void {
    const preset = PRECISION_PRESETS[presetId];

    if (preset) {
      this.config = { ...this.config, ...preset };
      logger.info(`Applied precision preset: ${presetId}`);
    } else {
      logger.warn(`Precision preset not found: ${presetId}`);
    }
  }

  async destroy(): Promise<void> {
    logger.info('PrecisionConfigService destroyed');
  }

  getConfig(): PrecisionControlConfig {
    return { ...this.config };
  }

  async initialize(): Promise<void> {
    logger.info('PrecisionConfigService initialized');
  }

  reset(): void {
    this.config = { ...DEFAULT_PRECISION_CONFIG };
  }

  setConfig(config: Partial<PrecisionControlConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export function getPrecisionConfigService(): PrecisionConfigService {
  return PrecisionConfigService.getInstance();
}

export function resetPrecisionConfigService(): void {
  PrecisionConfigService.resetInstance();
}
