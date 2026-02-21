import { createLogger } from '@/core/Logger';
import { loadDepthEstimationModel, loadTensorFlow } from '../AIModuleLoader';

import type { AIProvider, DepthResult, ImageAnalysis } from '../types';

type DepthEstimationModule = DepthEstimationModuleExtended | null;

// Depth estimator interface to avoid 'any' usage
interface DepthEstimator {
  estimateDepth: (
    image: HTMLImageElement,
    options: {
      flipHorizontal: boolean;
      minDepth: number;
      maxDepth: number;
    }
  ) => Promise<{
    toCanvasImageSource: () => Promise<CanvasImageSource>;
  }>;
}

// Extended depth estimation module interface
interface DepthEstimationModuleExtended {
  SupportedModels: {
    ARPortraitDepth: string;
  };
  createEstimator: (model: string, config: unknown) => Promise<DepthEstimator>;
}

export class TensorFlowProvider implements AIProvider {
  private _isAvailable = false;

  private estimator: DepthEstimator | null = null;
  private isLoading = false;
  private loadError: Error | null = null;
  readonly providerId = 'tensorflow';

  private depthEstimation: DepthEstimationModule | null = null;

  async analyzeScene(_base64Image: string): Promise<ImageAnalysis> {
    throw new Error('TensorFlowProvider does not support scene analysis');
  }

  async dispose(): Promise<void> {
    if (this.estimator) {
      try {
        this.estimator = null;
        this.depthEstimation = null;
        this.loadError = null;
        this._isAvailable = false;
        logger.info('TensorFlow depth model disposed');
      } catch (error) {
        logger.error('Failed to dispose depth model', { error });
      }
    }
  }

  async editImage(_base64Image: string, _prompt: string): Promise<string> {
    throw new Error('TensorFlowProvider does not support image editing');
  }

  async estimateDepth(imageUrl: string): Promise<DepthResult> {
    if (!this.estimator) {
      throw new Error('TensorFlowProvider not initialized');
    }

    const img = new Image();

    img.crossOrigin = 'Anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        resolve();
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = imageUrl;
    });

    try {
      const depthMap = await this.estimator.estimateDepth(img, {
        flipHorizontal: false,
        minDepth: 0,
        maxDepth: 1,
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      const depthData = await depthMap.toCanvasImageSource();

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(depthData, 0, 0, canvas.width, canvas.height);

      const depthUrl = canvas.toDataURL('image/jpeg', DEPTH_JPEG_QUALITY);

      canvas.width = 0;
      canvas.height = 0;

      return { depthUrl, method: 'ai' };
    } catch (error) {
      logger.error('AI Depth estimation failed', { error });
      throw error;
    }
  }

  getStatus(): { error: Error | null; isLoaded: boolean; isLoading: boolean } {
    return {
      isLoaded: this.estimator !== null,
      isLoading: this.isLoading,
      error: this.loadError,
    };
  }

  async initialize(): Promise<void> {
    if (this.estimator) {
      this._isAvailable = true;

      return;
    }

    if (this.isLoading) {
      while (this.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, LOAD_POLL_INTERVAL_MS));
      }

      return;
    }

    this.isLoading = true;

    try {
      await loadTensorFlow();
      const loadedModule = await loadDepthEstimationModel();

      // Type guard to validate depth estimation module has required methods
      const hasCreateEstimator = (mod: unknown): mod is DepthEstimationModuleExtended => {
        return mod !== null && typeof mod === 'object' && 'createEstimator' in mod;
      };

      if (!hasCreateEstimator(loadedModule)) {
        throw new Error('Depth estimation module not properly loaded');
      }

      this.depthEstimation = loadedModule;
      const module = this.depthEstimation;
      const modelPromise = module.createEstimator(
        module.SupportedModels.ARPortraitDepth,
        getARPortraitDepthModelConfig(module)
      );

      // Increase timeout to 30s and add better error context
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () =>
            reject(
              new Error(
                'TensorFlow Model Load Timeout (30s) - Model may be too large or network slow'
              )
            ),
          30000
        );
      });

      try {
        this.estimator = await Promise.race([modelPromise, timeoutPromise]);
        if (timeoutId) clearTimeout(timeoutId);
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        throw error;
      }

      this._isAvailable = true;
      logger.info('TensorFlow depth model loaded');
    } catch (error) {
      this.loadError = error as Error;
      this._isAvailable = false;
      logger.error('Failed to load depth model', { error });
    } finally {
      this.isLoading = false;
    }
  }

  get isAvailable(): boolean {
    return this._isAvailable;
  }
}

const DEPTH_JPEG_QUALITY = 0.9;

const getARPortraitDepthModelConfig = (
  _depthEstimation: DepthEstimationModuleExtended
): unknown => {
  const depthModelUrl = import.meta.env['VITE_TF_DEPTH_MODEL_URL'];
  const segmentationModelUrl = import.meta.env['VITE_TF_SEGMENTATION_MODEL_URL'];
  const config: Record<string, string> = {};

  if (typeof depthModelUrl === 'string' && depthModelUrl.length > 0) {
    config['depthModelUrl'] = depthModelUrl;
  }

  if (typeof segmentationModelUrl === 'string' && segmentationModelUrl.length > 0) {
    config['segmentationModelUrl'] = segmentationModelUrl;
  }

  return config;
};

const LOAD_POLL_INTERVAL_MS = 100;
const logger = createLogger({ module: 'TensorFlowProvider' });
