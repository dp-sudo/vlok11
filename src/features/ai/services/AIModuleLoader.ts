/**
 * AI Module Dynamic Loader
 *
 * Provides lazy loading for heavy AI/ML libraries to reduce initial bundle size.
 * Libraries are loaded on-demand when AI features are actually used.
 */

import { createLogger } from '@/core/Logger';

const logger = createLogger({ module: 'AIModuleLoader' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const moduleCache = new Map<string, any>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadingPromises = new Map<string, Promise<any>>();

/**
 * Load TensorFlow.js dynamically
 */
export async function loadTensorFlow(): Promise<unknown> {
  const cacheKey = 'tensorflow';

  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey);
  }

  if (loadingPromises.has(cacheKey)) {
    return loadingPromises.get(cacheKey);
  }

  const loadPromise = (async () => {
    try {
      logger.info('Loading TensorFlow.js...');
      const tf = await import('@tensorflow/tfjs');

      // Initialize backend
      await tf.setBackend('webgl');
      await tf.ready();

      moduleCache.set(cacheKey, tf);
      logger.info('TensorFlow.js loaded successfully');

      return tf;
    } catch (error) {
      logger.error('Failed to load TensorFlow.js', { error });
      throw error;
    }
  })();

  loadingPromises.set(cacheKey, loadPromise);

  return loadPromise;
}

/**
 * Load Depth Estimation model dynamically
 */
export async function loadDepthEstimationModel(): Promise<unknown> {
  const cacheKey = 'depth-estimation';

  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey);
  }

  if (loadingPromises.has(cacheKey)) {
    return loadingPromises.get(cacheKey);
  }

  const loadPromise = (async () => {
    try {
      // Ensure TensorFlow is loaded first
      await loadTensorFlow();

      logger.info('Loading depth estimation model...');
      const depthEstimation = await import('@tensorflow-models/depth-estimation');

      moduleCache.set(cacheKey, depthEstimation);
      logger.info('Depth estimation model loaded successfully');

      return depthEstimation;
    } catch (error) {
      logger.error('Failed to load depth estimation model', { error });
      throw error;
    }
  })();

  loadingPromises.set(cacheKey, loadPromise);

  return loadPromise;
}

/**
 * Load Face Detection model dynamically
 */
export async function loadFaceDetectionModel(): Promise<unknown> {
  const cacheKey = 'face-detection';

  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey);
  }

  if (loadingPromises.has(cacheKey)) {
    return loadingPromises.get(cacheKey);
  }

  const loadPromise = (async () => {
    try {
      // Ensure TensorFlow is loaded first
      await loadTensorFlow();

      logger.info('Loading face detection model...');
      const faceDetection = await import('@tensorflow-models/face-detection');

      moduleCache.set(cacheKey, faceDetection);
      logger.info('Face detection model loaded successfully');

      return faceDetection;
    } catch (error) {
      logger.error('Failed to load face detection model', { error });
      throw error;
    }
  })();

  loadingPromises.set(cacheKey, loadPromise);

  return loadPromise;
}

/**
 * Load Google GenAI dynamically
 */
export async function loadGoogleGenAI(): Promise<unknown> {
  const cacheKey = 'google-genai';

  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey);
  }

  if (loadingPromises.has(cacheKey)) {
    return loadingPromises.get(cacheKey);
  }

  const loadPromise = (async () => {
    try {
      logger.info('Loading Google GenAI...');
      const genai = await import('@google/genai');

      moduleCache.set(cacheKey, genai);
      logger.info('Google GenAI loaded successfully');

      return genai;
    } catch (error) {
      logger.error('Failed to load Google GenAI', { error });
      throw error;
    }
  })();

  loadingPromises.set(cacheKey, loadPromise);

  return loadPromise;
}

/**
 * Load MediaPipe Face Detection dynamically
 */
export async function loadMediaPipeFaceDetection(): Promise<unknown> {
  const cacheKey = 'mediapipe-face';

  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey);
  }

  if (loadingPromises.has(cacheKey)) {
    return loadingPromises.get(cacheKey);
  }

  const loadPromise = (async () => {
    try {
      logger.info('Loading MediaPipe face detection...');
      const mpFaceDetection = await import('@mediapipe/face_detection');

      moduleCache.set(cacheKey, mpFaceDetection);
      logger.info('MediaPipe face detection loaded successfully');

      return mpFaceDetection;
    } catch (error) {
      logger.error('Failed to load MediaPipe face detection', { error });
      throw error;
    }
  })();

  loadingPromises.set(cacheKey, loadPromise);

  return loadPromise;
}

/**
 * Preload AI modules (call when idle)
 */
export function preloadAIModules(): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(
      () => {
        logger.info('Preloading AI modules during idle time...');
        // Preload TensorFlow in background
        loadTensorFlow().catch(() => {});
      },
      { timeout: 2000 }
    );
  }
}

/**
 * Clear all cached modules
 */
export function clearAIModuleCache(): void {
  moduleCache.clear();
  loadingPromises.clear();
  logger.info('AI module cache cleared');
}

/**
 * Check if a module is loaded
 */
export function isModuleLoaded(moduleName: string): boolean {
  return moduleCache.has(moduleName);
}
