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

  /**
   * Execute a promise with timeout support, propagating AbortSignal
   */
  private executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number | undefined): Promise<T> {
    if (!timeoutMs || timeoutMs <= 0) {
      return promise;
    }

    return Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Stage timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        // Clean up timeout if promise resolves first
        promise.then(() => clearTimeout(timeoutId)).catch(() => clearTimeout(timeoutId));
      }),
    ]);
  }

  /**
   * Execute a stage with retry logic and exponential backoff
   */
  private async executeWithRetry(
    stage: PipelineStage,
    inputData: unknown,
    context: StageContext,
    stageConfig: StageConfig
  ): Promise<unknown> {
    const retryCount = stageConfig.retryCount ?? 0;
    const { timeoutMs } = stageConfig;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        // If not first attempt, wait before retry (exponential backoff)
        if (attempt > 0) {
          const delay = Math.min(1000 * 2 ** (attempt - 1), 10000);

          logger.debug(
            `Retrying stage ${stageConfig.type}, attempt ${attempt + 1}, delay ${delay}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        // Execute with timeout wrapper
        const result = await this.executeWithTimeout(stage.execute(inputData, context), timeoutMs);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(
          `Stage ${stageConfig.type} attempt ${attempt + 1} failed: ${lastError.message}`
        );

        // If retries remain, continue loop
        if (attempt < retryCount) {
          // Continue to next iteration
        }
      }
    }

    // All retries failed, throw the last error
    throw lastError;
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

    // Create or use external abort signal
    const abortController = signal ? null : new AbortController();
    const activeSignal = signal ?? abortController!.signal;

    while (pending.size > 0) {
      if (signal?.aborted) {
        throw new Error('Pipeline aborted');
      }

      const readyStages = getReadyStages();

      if (readyStages.length === 0 && pending.size > 0) {
        throw new Error(
          `Pipeline deadlock: no stages ready but ${pending.size} pending. ` +
            `Pending stages: ${[...pending].join(', ')}`
        );
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
          signal: activeSignal,
        };

        try {
          logger.debug(`Executing stage: ${stageConfig.type}`);
          getEventBus().emit('pipeline:stage-started', {
            runId,
            stage: stageConfig.type,
            index: enabledStages.indexOf(stageConfig),
            total: enabledStages.length,
          });

          const result = await this.executeWithRetry(stage, inputData, context, stageConfig);

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
