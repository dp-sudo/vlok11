import { createLogger } from '@/core/Logger';
import { getWorkerManager } from '@/core/workers/WorkerManager';
import { IMAGE_PROCESSING } from '@/shared/constants/utils';
import { SceneType, TechPipeline } from '@/shared/types';
import { constrainImageDimensions, generatePseudoDepthMap, safeLoadImage } from '@/shared/utils';

import type { AIProvider, DepthResult, ImageAnalysis } from '../types';

export class FallbackProvider implements AIProvider {
  private _isAvailable = true;
  readonly providerId = 'fallback';

  async analyzeScene(_base64Image: string): Promise<ImageAnalysis> {
    logger.info('Using fallback analysis');

    return {
      sceneType: SceneType.UNKNOWN,
      estimatedDepthScale: 1.5,
      description: '无法连接AI服务，使用默认设置',
      recommendedFov: 55,
      recommendedPipeline: TechPipeline.DEPTH_MESH,
      reasoning: '离线模式',
      suggestedModel: 'default',
    };
  }

  async dispose(): Promise<void> {
    logger.info('FallbackProvider destroyed');
  }

  async estimateDepth(imageUrl: string): Promise<DepthResult> {
    logger.info('Using fallback depth estimation (Worker)');

    try {
      const img = await safeLoadImage(imageUrl);

      const { width, height } = constrainImageDimensions(
        img.width,
        img.height,
        IMAGE_PROCESSING.DEPTH_MAX_SIZE
      );

      const imageBitmap = await createImageBitmap(img);

      const workerManager = getWorkerManager();
      const depthBlob = await workerManager.execute<unknown, Blob>(
        'image-processor',
        'process_depth',
        {
          imageBitmap,
          width,
          height,
          blurAmount: 0,
        },
        [imageBitmap]
      );

      const depthUrl = URL.createObjectURL(depthBlob);

      return {
        depthUrl,
        method: 'worker',
        confidence: 0.6,
      };
    } catch (error) {
      logger.error('Worker depth failed, falling back to main thread', { error });

      const depthUrl = await generatePseudoDepthMap(imageUrl);

      return {
        depthUrl,
        method: 'canvas-fallback',
        confidence: 0.5,
      };
    }
  }

  async initialize(): Promise<void> {
    logger.info('FallbackProvider initialized');
  }

  get isAvailable(): boolean {
    return this._isAvailable;
  }
}

export const createFallbackProvider = (): AIProvider => new FallbackProvider();
const logger = createLogger({ module: 'FallbackProvider' });
