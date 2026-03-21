import { resetKernelRuntime, setKernelAIService } from '@/app/kernelRuntime';
import { getEventBus, resetEventBus } from '@/core/EventBus';
import {
  getLifecycleManager,
  LifecycleState,
  resetLifecycleManager,
} from '@/core/LifecycleManager';
import { createLogger } from '@/core/Logger';
import { resetGlobalResourceManager } from '@/core/ResourceManager';
import { type AIService, getAIService, resetAIService } from '@/features/ai/services/AIService';
import { getControlsModule, resetControlsModule } from '@/features/controls';
import { getSceneModule, resetSceneModule } from '@/features/scene/scene-module';
import {
  AnimationScheduler,
  CoreController,
  getAnimationScheduler,
  getCoreController,
} from '@/features/scene/services/camera';
import { getShaderService, resetShaderService } from '@/features/scene/services/shader';
import { BOOTSTRAP_PROGRESS } from '@/shared/constants';

export interface BootstrapConfig {
  enableAI?: boolean;
  enableModules?: boolean;
  enableShaders?: boolean;
  onProgress?: (stage: string, progress: number) => void;
}

const DEFAULT_CONFIG: BootstrapConfig = {
  enableAI: true,
  enableShaders: true,
  enableModules: true,
};

const logger = createLogger({ module: 'AppKernel' });

let globalErrorHandlers: {
  error?: (event: ErrorEvent) => void;
  unhandledRejection?: (event: PromiseRejectionEvent) => void;
} = {};

export class AppKernel {
  private static instance: AppKernel | null = null;

  private aiService: AIService | null = null;
  private initializationPromise: Promise<AppKernel> | null = null;

  static getInstance(): AppKernel {
    AppKernel.instance ??= new AppKernel();

    return AppKernel.instance;
  }

  static resetInstance(): void {
    AppKernel.instance = null;
  }

  async initialize(config: BootstrapConfig = {}): Promise<AppKernel> {
    const lifecycleManager = getLifecycleManager();
    const currentState = lifecycleManager.getState();

    if (currentState === LifecycleState.READY) {
      this.aiService ??= getAIService();

      return this;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize({ ...DEFAULT_CONFIG, ...config });

    try {
      return await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  getAIService(): AIService {
    this.aiService ??= getAIService();

    return this.aiService;
  }

  getServices(): { aiService: AIService | null } {
    return {
      aiService: this.aiService,
    };
  }

  hasAIService(): boolean {
    return this.aiService !== null;
  }

  isReady(): boolean {
    return getLifecycleManager().getState() === LifecycleState.READY;
  }

  async shutdown(): Promise<void> {
    logger.info('开始关闭应用内核');

    try {
      cleanupGlobalErrorHandling();

      const lifecycleManager = getLifecycleManager();

      await lifecycleManager.destroyAll();

      resetSceneModule();
      resetControlsModule();
      resetShaderService();

      CoreController.resetInstance();
      AnimationScheduler.resetInstance();

      resetGlobalResourceManager();
      resetLifecycleManager();
      resetEventBus();
      resetAIService();
      resetKernelRuntime();

      this.aiService = null;
      AppKernel.resetInstance();

      logger.info('应用内核关闭完成');
    } catch (error) {
      logger.error('应用内核关闭失败', { error });
      throw error;
    }
  }

  private async doInitialize(config: BootstrapConfig): Promise<AppKernel> {
    const lifecycleManager = getLifecycleManager();
    const { onProgress } = config;

    logger.info('开始初始化应用内核');
    onProgress?.('initializing', BOOTSTRAP_PROGRESS.INIT);

    this.aiService = getAIService();
    setKernelAIService(this.aiService);

    if (config.enableAI) {
      onProgress?.('registering-ai-service', BOOTSTRAP_PROGRESS.AI_SERVICE);
      lifecycleManager.register(this.aiService);
    }

    if (config.enableShaders) {
      onProgress?.('registering-shader-service', BOOTSTRAP_PROGRESS.SHADER_SERVICE);
      lifecycleManager.register(getShaderService());
    }

    if (config.enableModules) {
      onProgress?.('registering-modules', BOOTSTRAP_PROGRESS.MODULES);
      lifecycleManager.register(getSceneModule());
      lifecycleManager.register(getControlsModule());
    }

    onProgress?.('registering-camera-services', BOOTSTRAP_PROGRESS.MODULES);
    lifecycleManager.register(getAnimationScheduler());
    lifecycleManager.register(getCoreController());

    onProgress?.('configuring-error-handling', BOOTSTRAP_PROGRESS.ERROR_HANDLING);
    setupGlobalErrorHandling();

    onProgress?.('initializing-services', BOOTSTRAP_PROGRESS.SERVICES);
    await lifecycleManager.initializeAll();
    onProgress?.('complete', BOOTSTRAP_PROGRESS.COMPLETE);

    logger.info('应用内核初始化完成');

    return this;
  }
}

export function getAppKernel(): AppKernel {
  return AppKernel.getInstance();
}

export function resetAppKernel(): void {
  AppKernel.resetInstance();
}

function cleanupGlobalErrorHandling(): void {
  if (typeof window !== 'undefined') {
    if (globalErrorHandlers.unhandledRejection) {
      window.removeEventListener('unhandledrejection', globalErrorHandlers.unhandledRejection);
    }
    if (globalErrorHandlers.error) {
      window.removeEventListener('error', globalErrorHandlers.error);
    }
    globalErrorHandlers = {};
  }
}

function setupGlobalErrorHandling(): void {
  const eventBus = getEventBus();

  if (typeof window !== 'undefined') {
    cleanupGlobalErrorHandling();

    globalErrorHandlers.unhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('捕获到未处理的 Promise 拒绝', { reason: event.reason });
      eventBus.emit('system:error', {
        error: event.reason,
        context: 'unhandled-rejection',
        recoverable: false,
      });
    };

    globalErrorHandlers.error = (event: ErrorEvent) => {
      logger.error('捕获到未处理的全局错误', { error: event.error });
      eventBus.emit('system:error', {
        error: event.error,
        context: 'uncaught-error',
        recoverable: false,
      });
    };

    window.addEventListener('unhandledrejection', globalErrorHandlers.unhandledRejection);
    window.addEventListener('error', globalErrorHandlers.error);
  }
}
