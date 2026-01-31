import { createLogger } from '@/core/Logger';

import type { PipelineStage } from './types';

const logger = createLogger({ module: 'StageRegistry' });

let stageRegistryInstance: StageRegistry | null = null;

export class StageRegistry {
  private stages = new Map<string, PipelineStage>();

  static getInstance(): StageRegistry {
    stageRegistryInstance ??= new StageRegistry();

    return stageRegistryInstance;
  }

  getStage(type: string): PipelineStage | undefined {
    return this.stages.get(type);
  }

  register(type: string, stage: PipelineStage): void {
    if (this.stages.has(type)) {
      logger.warn(`Stage ${type} already registered, overwriting.`);
    }
    this.stages.set(type, stage);
    logger.info(`Registered stage: ${type}`);
  }

  unregister(type: string): void {
    this.stages.delete(type);
  }
}

export function getStageRegistry(): StageRegistry {
  return StageRegistry.getInstance();
}
