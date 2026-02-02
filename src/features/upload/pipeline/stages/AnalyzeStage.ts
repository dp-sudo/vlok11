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
      const errorMessage = String(error);
      logger.warn('Analysis failed, using fallback values', { error: errorMessage });

      // 将技术错误转换为用户友好的消息
      let userFriendlyMessage = '分析服务暂时不可用，使用默认配置';

      if (errorMessage.includes('does not support image input')) {
        userFriendlyMessage =
          '当前AI模型不支持图像输入功能。请检查API配置或更换支持图像分析的模型。';
      } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        userFriendlyMessage = '图像格式不受支持，请尝试上传JPG或PNG格式的图片。';
      } else if (errorMessage.includes('401') || errorMessage.includes('API key')) {
        userFriendlyMessage = 'AI服务认证失败，请检查API密钥配置。';
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        userFriendlyMessage = 'AI服务请求次数已达上限，请稍后再试。';
      } else if (errorMessage.includes('503') || errorMessage.includes('unavailable')) {
        userFriendlyMessage = 'AI服务暂时不可用，请使用本地处理模式。';
      }

      return {
        ...input,
        success: true,
        analysis: {
          sceneType: SceneType.UNKNOWN,
          description: userFriendlyMessage,
          reasoning: errorMessage,
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
