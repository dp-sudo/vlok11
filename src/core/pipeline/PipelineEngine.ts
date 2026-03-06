import { getEventBus } from '@/core/EventBus';
import { createLogger } from '@/core/Logger';
import { getStageRegistry } from '@/core/pipeline/StageRegistry';
import { generateUUID } from '@/shared/utils/uuid';

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

  async dispose(): Promise<void> {
    // Clear pipeline instance reference to allow garbage collection
    pipelineEngineInstance = null;
    logger.info('PipelineEngine disposed');
  }

  async execute<T>(initialInput: T, config: PipelineConfig, signal?: AbortSignal): Promise<T> {
    const enabledStages = config.stages.filter((s) => s.enabled !== false);
    const runId = generateUUID();

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

      // Execute ready stages (those whose dependencies are satisfied)
      // 执行语义：
      // 1. dependsOn 用于确定哪些 stage 可以执行（依赖的 stage 已完成）
      // 2. 数据流采用线性流：每个 stage 的输入来自上一个执行的 stage 输出（通过 currentData 传递）
      // 3. 所有 ready 的 stages 按顺序执行，后一个 stage 使用前一个的输出作为输入
      for (const stageConfig of readyStages) {
        const stage = this.registry.getStage(stageConfig.type);

        if (!stage) {
          throw new Error(`Stage type '${stageConfig.type}' not found in registry`);
        }

        // 线性数据流：每个 stage 的输入来自 currentData（前一个 stage 的输出）
        // 这确保了数据按执行顺序正确传递
        const inputData = currentData;

        const context: StageContext = {
          config,
          data: inputData,
          runId,
          signal: signal ?? new AbortSignal(),
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

          completed.set(stageConfig.id, result);
          pending.delete(stageConfig.id);
          currentData = result;
        } catch (error) {
          logger.error(`Stage ${stageConfig.type} failed`, { error });
          getEventBus().emit('pipeline:error', {
            runId,
            stage: stageConfig.type,
            error,
          });
          throw error;
        }
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
