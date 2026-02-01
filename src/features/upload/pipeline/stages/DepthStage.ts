import { createLogger } from '@/core/Logger';
import type { AIService } from '@/features/ai/services/AIService';
import type { PipelineStage, StageInput, StageOutput } from '../types';

const logger = createLogger({ module: 'DepthStage' });

const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) {
    throw new Error('Aborted');
  }
};

export class DepthStage implements PipelineStage {
  readonly name = 'depth';
  readonly order = 2;

  constructor(private aiService: AIService) {}

  canSkip(input: StageInput): boolean {
    return input.depthUrl !== undefined;
  }

  async execute(input: StageInput): Promise<StageOutput> {
    try {
      throwIfAborted(input.signal);

      logger.info('DepthStage input', {
        hasImageUrl: !!input.imageUrl,
        hasImageBase64: !!input.imageBase64,
        hasFile: !!input.file,
        hasUrl: !!input.url,
      });

      if (!input.imageUrl) {
        logger.error('Missing imageUrl in input', { input: Object.keys(input) });
        throwIfAborted(input.signal);

        const testMode = (window as { __TEST_MODE__?: boolean }).__TEST_MODE__;

        if (typeof window !== 'undefined' && testMode === true) {
          if (!input.imageUrl && input.file) {
            input.imageUrl = URL.createObjectURL(input.file);
          }
        }

        if (!input.imageUrl) {
          throw new Error('No image URL available for depth estimation');
        }
      }

      if (!this.aiService.isAvailable()) {
        await this.aiService.initialize();
      }

      throwIfAborted(input.signal);

      const depthResult = await this.aiService.estimateDepth(input.imageUrl);

      throwIfAborted(input.signal);

      return {
        ...input,
        depthUrl: depthResult.depthUrl,
        metadata: { ...input.metadata, depthMethod: depthResult.method },
        success: true,
      };
    } catch (error) {
      logger.error('Depth estimation failed', { error });

      return {
        ...input,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}
