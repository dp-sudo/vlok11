import type { PipelineStage, StageInput, StageOutput } from '../types';

export class PrepareStage implements PipelineStage {
  readonly name = 'prepare';
  readonly order = STAGE_ORDER.PREPARE;
  async execute(input: StageInput): Promise<StageOutput> {
    try {
      if (input.signal?.aborted) {
        throw new Error('Aborted');
      }
      if (!input.imageUrl) {
        throw new Error('Missing image URL');
      }
      if (!input.depthUrl) {
        throw new Error('Missing depth URL');
      }
      if (!input.analysis) {
        throw new Error('Missing analysis data');
      }
      const recommendedConfig = {
        displacementScale: input.analysis.estimatedDepthScale,
        fov: input.analysis.recommendedFov,
      };

      return {
        ...input,
        metadata: { ...input.metadata, recommendedConfig, ready: true },
        success: true,
      };
    } catch (error) {
      return {
        ...input,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

const STAGE_ORDER = {
  READ: 0,
  ANALYZE: 1,
  DEPTH: 2,
  PREPARE: 3,
} as const;
