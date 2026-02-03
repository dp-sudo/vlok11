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
 * Load TensorFlow.js dynamically with retry mechanism
 */
export async function loadTensorFlow(retries = 3): Promise<unknown> {
  const cacheKey = 'tensorflow';

  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey);
  }

  if (loadingPromises.has(cacheKey)) {
    return loadingPromises.get(cacheKey);
  }

  const loadPromise = (async () => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.info(`Loading TensorFlow.js (attempt ${attempt}/${retries})...`);
        const tf = await import('@tensorflow/tfjs');

        // Initialize backend with timeout
        const backendPromise = tf.setBackend('webgl');
        const backendTimeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TensorFlow backend initialization timeout')), 30000)
        );

        await Promise.race([backendPromise, backendTimeoutPromise]);
        await tf.ready();

        moduleCache.set(cacheKey, tf);
        logger.info('TensorFlow.js loaded successfully');

        return tf;
      } catch (error) {
        logger.warn(`TensorFlow.js load attempt ${attempt} failed`, { error });

        if (attempt === retries) {
          logger.error('Failed to load TensorFlow.js after all retries', { error });
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.min(1000 * 2 ** (attempt - 1), 10000);

        logger.info(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error('Unexpected error in loadTensorFlow');
  })();

  loadingPromises.set(cacheKey, loadPromise);

  return loadPromise;
}

/**
 * Load Depth Estimation model dynamically with retry mechanism
 */
export async function loadDepthEstimationModel(retries = 3): Promise<unknown> {
  const cacheKey = 'depth-estimation';

  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey);
  }

  if (loadingPromises.has(cacheKey)) {
    return loadingPromises.get(cacheKey);
  }

  const loadPromise = (async () => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Ensure TensorFlow is loaded first
        await loadTensorFlow();

        logger.info(`Loading depth estimation model (attempt ${attempt}/${retries})...`);

        // Add timeout for model loading
        const modelPromise = import('@tensorflow-models/depth-estimation');
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Depth estimation model load timeout')), 20000)
        );

        const depthEstimation = await Promise.race([modelPromise, timeoutPromise]);

        moduleCache.set(cacheKey, depthEstimation);
        logger.info('Depth estimation model loaded successfully');

        return depthEstimation;
      } catch (error) {
        logger.warn(`Depth estimation model load attempt ${attempt} failed`, { error });

        if (attempt === retries) {
          logger.error('Failed to load depth estimation model after all retries', { error });
          throw error;
        }

        // Exponential backoff
        const delay = Math.min(1000 * 2 ** (attempt - 1), 10000);

        logger.info(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error('Unexpected error in loadDepthEstimationModel');
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
