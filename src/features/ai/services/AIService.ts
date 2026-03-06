import { getEventBus } from '@/core/EventBus';
import { AIEvents } from '@/core/EventTypes';
import type { LifecycleAware } from '@/core/LifecycleManager';
import { SceneType, TechPipeline } from '@/shared/types';
import { createLogger, CACHE_DEFAULTS, PROGRESS, hashString } from './AIServiceCore';
import type { AICacheConfig, AIProgressCallback, AIProvider, AIService as AIServiceType, DepthResult, ImageAnalysis } from './types';
import { FallbackProvider } from './providers/FallbackProvider';
import { AIServiceCache } from './AIServiceCache';
import { getGeminiProvider, getTensorFlowProvider } from './AIServiceProvider';
import type { LazyProvider } from './AIServiceProvider';

const logger = createLogger({ module: 'AIService' });

class AIServiceImpl implements AIServiceType, LifecycleAware {
  private activeDepthProvider: AIProvider | null = null;
  private activeSceneProvider: AIProvider | null = null;

  private analysisCache: AIServiceCache<ImageAnalysis>;
  private depthCache: AIServiceCache<DepthResult>;

  private cacheConfig: AICacheConfig = {
    enabled: true,
    maxSize: CACHE_DEFAULTS.MAX_SIZE,
    ttlMs: CACHE_DEFAULTS.TTL_MS,
  };

  readonly dependencies = [];

  private fallbackProvider: FallbackProvider;

  private _geminiProvider: LazyProvider | null = null;
  private _tensorflowProvider: LazyProvider | null = null;

  private initialized = false;
  private isPaused = false;
  private pendingAnalysis = new Map<string, Promise<ImageAnalysis>>();
  private pendingDepth = new Map<string, Promise<DepthResult>>();
  private progressCallbacks = new Set<AIProgressCallback>();

  readonly serviceId = 'ai-service';

  constructor() {
    this.fallbackProvider = new FallbackProvider();
    this.analysisCache = new AIServiceCache<ImageAnalysis>(this.cacheConfig);
    this.depthCache = new AIServiceCache<DepthResult>(this.cacheConfig);

    this.activeSceneProvider = this.fallbackProvider;
    this.activeDepthProvider = this.fallbackProvider;
  }

  // Lazy initialization methods for providers
  private async ensureGeminiProvider(): Promise<LazyProvider> {
    this._geminiProvider ??= await getGeminiProvider();

    return this._geminiProvider;
  }

  private async ensureTensorFlowProvider(): Promise<LazyProvider> {
    this._tensorflowProvider ??= await getTensorFlowProvider();

    return this._tensorflowProvider;
  }

  async analyzeScene(base64Image: string): Promise<ImageAnalysis> {
    const cacheKey = hashString(base64Image);
    const cached = this.analysisCache.get(cacheKey, 'analysis');

    if (cached) {
      return cached;
    }

    const pending = this.pendingAnalysis.get(cacheKey);

    if (pending) {
      return pending;
    }

    const promise = this.doAnalyzeScene(base64Image, cacheKey);

    this.pendingAnalysis.set(cacheKey, promise);

    try {
      return await promise;
    } finally {
      this.pendingAnalysis.delete(cacheKey);
    }
  }

  clearCache(): void {
    this.analysisCache.clear();
    this.depthCache.clear();
  }

  configureCaching(config: Partial<AICacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
    this.analysisCache.configure(this.cacheConfig);
    this.depthCache.configure(this.cacheConfig);
  }

  async destroy(): Promise<void> {
    const disposePromises: Promise<void>[] = [this.fallbackProvider.dispose()];

    if (this._geminiProvider) {
      disposePromises.push(this._geminiProvider.dispose());
    }
    if (this._tensorflowProvider) {
      disposePromises.push(this._tensorflowProvider.dispose());
    }

    await Promise.all(disposePromises);

    this.activeSceneProvider = null;
    this.activeDepthProvider = null;
    this.initialized = false;

    this.analysisCache.clear();
    this.depthCache.clear();
    this.progressCallbacks.clear();
  }

  private async doAnalyzeScene(base64Image: string, cacheKey: string): Promise<ImageAnalysis> {
    const isTestMode = (window as { __TEST_MODE__?: boolean }).__TEST_MODE__;

    if (isTestMode) {
      logger.info('Test mode detected, returning mock analysis');

      this.emitProgress(PROGRESS.START, 'analyzing');
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.emitProgress(PROGRESS.MIDPOINT, 'analyzing');

      return {
        sceneType: SceneType.OUTDOOR,
        description: 'Mocked scene description for testing',
        reasoning: 'Test mode active',
        estimatedDepthScale: 1.0,
        recommendedFov: 55,
        recommendedPipeline: TechPipeline.DEPTH_MESH,
        suggestedModel: 'default',
        keywords: ['mock', 'test'],
      };
    }

    this.emitProgress(PROGRESS.START, 'analyzing');
    const provider = this.activeSceneProvider?.providerId ?? 'unknown';
    const t0 = performance.now();

    getEventBus().emit(AIEvents.REQUEST_STARTED, { provider, operation: 'analyzeScene' });

    try {
      if (this.activeSceneProvider?.analyzeScene) {
        this.emitProgress(PROGRESS.MIDPOINT, 'analyzing');
        const result = await this.activeSceneProvider.analyzeScene(base64Image);

        this.analysisCache.set(cacheKey, result);
        this.emitProgress(PROGRESS.COMPLETE, 'analyzing');
        getEventBus().emit(AIEvents.REQUEST_COMPLETED, {
          provider: this.activeSceneProvider.providerId,
          operation: 'analyzeScene',
          duration: performance.now() - t0,
        });

        return result;
      }
    } catch (error) {
      logger.warn('Primary provider failed', { error });
      getEventBus().emit(AIEvents.REQUEST_ERROR, {
        provider,
        operation: 'analyzeScene',
        error: String(error),
      });
      if (this.activeSceneProvider !== this.fallbackProvider) {
        getEventBus().emit(AIEvents.PROVIDER_CHANGED, {
          from: this.activeSceneProvider?.providerId ?? 'unknown',
          to: 'fallback',
        });
        getEventBus().emit(AIEvents.FALLBACK_ACTIVATED, { reason: 'scene-provider-failed' });
        this.activeSceneProvider = this.fallbackProvider;
      }
    }

    const result = await this.fallbackProvider.analyzeScene(base64Image);

    this.analysisCache.set(cacheKey, result);
    this.emitProgress(PROGRESS.COMPLETE, 'analyzing');
    getEventBus().emit(AIEvents.REQUEST_COMPLETED, {
      provider: 'fallback',
      operation: 'analyzeScene',
      duration: performance.now() - t0,
    });

    return result;
  }

  private async doEstimateDepth(imageUrl: string, cacheKey: string): Promise<DepthResult> {
    const isTestMode = (window as { __TEST_MODE__?: boolean }).__TEST_MODE__;

    if (isTestMode) {
      logger.info('Test mode detected, returning mock depth');

      this.emitProgress(PROGRESS.START, 'depth_estimation');
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.emitProgress(PROGRESS.MIDPOINT, 'depth_estimation');

      return {
        depthUrl: imageUrl,
        method: 'canvas-fallback',
      };
    }
    this.emitProgress(PROGRESS.START, 'depth_estimation');
    const provider = this.activeDepthProvider?.providerId ?? 'unknown';
    const t0 = performance.now();

    getEventBus().emit(AIEvents.REQUEST_STARTED, { provider, operation: 'estimateDepth' });

    try {
      if (this.activeDepthProvider?.estimateDepth) {
        this.emitProgress(PROGRESS.MIDPOINT, 'depth_estimation');
        const result = await this.activeDepthProvider.estimateDepth(imageUrl);

        this.depthCache.set(cacheKey, result);
        this.emitProgress(PROGRESS.COMPLETE, 'depth_estimation');
        getEventBus().emit(AIEvents.REQUEST_COMPLETED, {
          provider: this.activeDepthProvider.providerId,
          operation: 'estimateDepth',
          duration: performance.now() - t0,
        });

        return result;
      }
    } catch (error) {
      logger.warn('Primary depth provider failed', { error });
      getEventBus().emit(AIEvents.REQUEST_ERROR, {
        provider,
        operation: 'estimateDepth',
        error: String(error),
      });
      if (this.activeDepthProvider !== this.fallbackProvider) {
        getEventBus().emit(AIEvents.PROVIDER_CHANGED, {
          from: this.activeDepthProvider?.providerId ?? 'unknown',
          to: 'fallback',
        });
        getEventBus().emit(AIEvents.FALLBACK_ACTIVATED, { reason: 'depth-provider-failed' });
        this.activeDepthProvider = this.fallbackProvider;
      }
    }

    const result = await this.fallbackProvider.estimateDepth(imageUrl);

    this.depthCache.set(cacheKey, result);
    this.emitProgress(PROGRESS.COMPLETE, 'depth_estimation');
    getEventBus().emit(AIEvents.REQUEST_COMPLETED, {
      provider: 'fallback',
      operation: 'estimateDepth',
      duration: performance.now() - t0,
    });

    return result;
  }

  async editImage(base64Image: string, _prompt: string): Promise<string> {
    logger.warn('Image editing not implemented');

    return base64Image;
  }

  private emitProgress(progress: number, stage: string): void {
    for (const callback of this.progressCallbacks) {
      callback(progress, stage);
    }
  }

  async estimateDepth(imageUrl: string): Promise<DepthResult> {
    const cacheKey = hashString(imageUrl);
    const cached = this.depthCache.get(cacheKey, 'depth');

    if (cached) {
      return cached;
    }

    const pending = this.pendingDepth.get(cacheKey);

    if (pending) {
      return pending;
    }

    const promise = this.doEstimateDepth(imageUrl, cacheKey);

    this.pendingDepth.set(cacheKey, promise);

    try {
      return await promise;
    } finally {
      this.pendingDepth.delete(cacheKey);
    }
  }

  getActiveProvider(): string {
    return `scene=${this.activeSceneProvider?.providerId}, depth=${this.activeDepthProvider?.providerId}`;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const testMode = (window as { __TEST_MODE__?: boolean }).__TEST_MODE__;

    if (typeof window !== 'undefined' && testMode === true) {
      logger.info('Test mode detected, skipping real initialization');
      this.initialized = true;
      this.activeSceneProvider = this.fallbackProvider;
      this.activeDepthProvider = this.fallbackProvider;

      return;
    }

    // Initialize providers lazily
    const [gemini, tensorflow] = await Promise.all([
      this.ensureGeminiProvider(),
      this.ensureTensorFlowProvider(),
    ]);

    await Promise.all([
      gemini.initialize(),
      tensorflow.initialize(),
      this.fallbackProvider.initialize(),
    ]);

    this.activeSceneProvider = gemini.isAvailable ? gemini : this.fallbackProvider;
    this.activeDepthProvider = tensorflow.isAvailable ? tensorflow : this.fallbackProvider;

    this.initialized = true;

    logger.info(
      `Initialized: scene=${this.activeSceneProvider.providerId}, depth=${this.activeDepthProvider.providerId}`
    );
  }

  isAvailable(): boolean {
    return this.initialized;
  }

  onProgress(callback: AIProgressCallback): () => void {
    this.progressCallbacks.add(callback);

    return () => this.progressCallbacks.delete(callback);
  }

  // Provider 管理方法
  async switchProvider(type: 'scene' | 'depth', providerId: string): Promise<void> {
    const provider = await this.getProviderById(providerId);

    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    if (!provider.isAvailable) {
      throw new Error(`Provider ${providerId} is not available`);
    }

    const fromProvider =
      type === 'scene'
        ? this.activeSceneProvider?.providerId
        : this.activeDepthProvider?.providerId;

    if (type === 'scene') {
      this.activeSceneProvider = provider;
    } else {
      this.activeDepthProvider = provider;
    }

    getEventBus().emit(AIEvents.PROVIDER_CHANGED, {
      type,
      from: fromProvider ?? 'unknown',
      to: providerId,
    });

    logger.info(`Switched ${type} provider from ${fromProvider} to ${providerId}`);
  }

  async isProviderAvailable(providerId: string): Promise<boolean> {
    const provider = await this.getProviderById(providerId);

    return provider?.isAvailable ?? false;
  }

  getActiveProviderId(type: 'scene' | 'depth'): string {
    const provider = type === 'scene' ? this.activeSceneProvider : this.activeDepthProvider;

    return provider?.providerId ?? 'unknown';
  }

  private async getProviderById(id: string): Promise<AIProvider | null> {
    switch (id) {
      case 'gemini':
        return this.ensureGeminiProvider();
      case 'tensorflow':
        return this.ensureTensorFlowProvider();
      case 'fallback':
        return this.fallbackProvider;
      default:
        return null;
    }
  }

  // 缓存统计方法
  getCacheStats(): { analysisCacheSize: number; depthCacheSize: number; totalSize: number } {
    const analysisStats = this.analysisCache.getStats();
    const depthStats = this.depthCache.getStats();

    return {
      analysisCacheSize: analysisStats.size,
      depthCacheSize: depthStats.size,
      totalSize: analysisStats.estimatedSize + depthStats.estimatedSize,
    };
  }

  getCacheConfig(): AICacheConfig {
    return { ...this.cacheConfig };
  }

  updateCacheConfig(config: Partial<AICacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
    this.analysisCache.configure(this.cacheConfig);
    this.depthCache.configure(this.cacheConfig);
    logger.info('Cache config updated', { config: this.cacheConfig });
  }

  pause(): void {
    if (this.isPaused) return;

    this.isPaused = true;
    logger.info('AIService paused');
    getEventBus().emit(AIEvents.PROVIDER_CHANGED, {
      from: 'active',
      to: 'paused',
    });
  }

  resume(): void {
    if (!this.isPaused) return;

    this.isPaused = false;
    logger.info('AIService resumed');
    getEventBus().emit(AIEvents.PROVIDER_CHANGED, {
      from: 'paused',
      to: 'active',
    });
  }
}

export { AIServiceImpl as AIService };
