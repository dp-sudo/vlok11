import { getEventBus } from '@/core/EventBus';
import { createLogger } from '@/core/Logger';
import { getStageRegistry } from '@/core/pipeline/StageRegistry';

import type {
  PipelineConfig,
  PipelineEngine as PipelineEngineInterface,
  PipelineStage,
  StageConfig,
  StageContext,
} from './types';

const logger = createLogger({ module: 'PipelineEngine' });

let pipelineEngineInstance: PipelineEngine | null = null;

export class PipelineEngine implements PipelineEngineInterface {
  private registry = getStageRegistry();

  static getInstance(): PipelineEngine {
    pipelineEngineInstance ??= new PipelineEngine();

    return pipelineEngineInstance;
  }

  async dispose(): Promise<void> {}

  async execute<T>(initialInput: T, config: PipelineConfig, signal?: AbortSignal): Promise<T> {
    const enabledStages = config.stages.filter((s) => s.enabled !== false);
    const runId = crypto.randomUUID();

    logger.info(
      `Starting pipeline ${config.id} (RunID: ${runId}) with ${enabledStages.length} stages`
    );
    getEventBus().emit('pipeline:started', { runId, configId: config.id });

    const completed = new Map<string, unknown>();
    const pending = new Set(enabledStages.map((s) => s.id));

    const getReadyStages = (): StageConfig[] => {
      return enabledStages.filter((stage) => {
        if (!pending.has(stage.id)) return false;
        const deps = stage.dependsOn ?? [];

        return deps.every((depId) => completed.has(depId));
      });
    };

    let currentData = initialInput as unknown;

    while (pending.size > 0) {
      if (signal?.aborted) {
        throw new Error('Pipeline aborted');
      }

      const readyStages = getReadyStages();

      if (readyStages.length === 0 && pending.size > 0) {
        throw new Error(`Pipeline deadlock: no stages ready but ${pending.size} pending`);
      }

      const results = await Promise.all(
        readyStages.map(async (stageConfig) => {
          const stage = this.registry.getStage(stageConfig.type);

          if (!stage) {
            throw new Error(`Stage type '${stageConfig.type}' not found in registry`);
          }

          const inputData = stageConfig.dependsOn?.length
            ? completed.get(stageConfig.dependsOn[stageConfig.dependsOn.length - 1])
            : currentData;

          const context: StageContext = {
            config,
            data: inputData,
            runId,
            signal: signal ?? new AbortController().signal,
          };

          try {
            logger.debug(`Executing stage: ${stageConfig.type}`);
            getEventBus().emit('pipeline:stage-started', {
              runId,
              stage: stageConfig.type,
              index: enabledStages.indexOf(stageConfig),
              total: enabledStages.length,
            });

            const result = await stage.execute(inputData, context);

            getEventBus().emit('pipeline:stage-completed', {
              runId,
              stage: stageConfig.type,
            });

            return { id: stageConfig.id, result };
          } catch (error) {
            logger.error(`Stage ${stageConfig.type} failed`, { error });
            getEventBus().emit('pipeline:error', {
              runId,
              stage: stageConfig.type,
              error,
            });
            throw error;
          }
        })
      );

      for (const { id, result } of results) {
        completed.set(id, result);
        pending.delete(id);
        currentData = result;
      }
    }

    getEventBus().emit('pipeline:completed', { runId });

    return currentData as T;
  }

  registerStage(type: string, stage: PipelineStage): void {
    this.registry.register(type, stage);
  }
}

export function getPipelineEngine(): PipelineEngine {
  return PipelineEngine.getInstance();
}
