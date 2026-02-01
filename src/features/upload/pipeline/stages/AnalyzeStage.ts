import { createLogger } from '@/core/Logger';
import type { AIService } from '@/features/ai/services/AIService';
import { SceneType, TechPipeline } from '@/shared/types';
import type { PipelineStage, StageInput, StageOutput } from '../types';

export class AnalyzeStage implements PipelineStage {
  readonly name = 'analyze';
  readonly order = 1;

  constructor(private aiService: AIService) {}

  async execute(input: StageInput): Promise<StageOutput> {
    logger.info('Starting analysis stage', {
      hasImageUrl: !!input.imageUrl,
      hasImageBase64: !!input.imageBase64,
    });

    try {
      const { imageBase64 } = input;

      if (!imageBase64) {
        logger.warn('Image data not available, using defaults');

        return {
          ...input,
          success: true,
          analysis: {
            sceneType: SceneType.UNKNOWN,
            description: '分析服务暂时不可用',
            reasoning: '分析服务暂时不可用',
            estimatedDepthScale: 1.5,
            recommendedFov: 55,
            recommendedPipeline: TechPipeline.DEPTH_MESH,
            suggestedModel: 'default',
          },
        };
      }

      const analysis = await this.aiService.analyzeScene(imageBase64);

      logger.info('Analysis completed', { sceneType: analysis.sceneType });

      const result = {
        ...input,
        success: true,
        analysis,
      };

      logger.info('AnalyzeStage output', {
        hasImageUrl: !!result.imageUrl,
        sceneType: analysis.sceneType,
      });

      return result;
    } catch (error) {
      logger.warn('Analysis failed, using fallback values', { error: String(error) });

      return {
        ...input,
        success: true,
        analysis: {
          sceneType: SceneType.UNKNOWN,
          description: '分析服务暂时不可用，使用默认配置',
          reasoning: String(error),
          estimatedDepthScale: 1.5,
          recommendedFov: 55,
          recommendedPipeline: TechPipeline.DEPTH_MESH,
          suggestedModel: 'default',
        },
      };
    }
  }
}

export const createAnalyzeStage = (aiService: AIService): PipelineStage =>
  new AnalyzeStage(aiService);
const logger = createLogger({ module: 'AnalyzeStage' });
