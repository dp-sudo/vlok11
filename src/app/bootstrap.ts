import { getEventBus, resetEventBus } from '@/core/EventBus';
import {
  getLifecycleManager,
  LifecycleState,
  resetLifecycleManager,
} from '@/core/LifecycleManager';
import { createLogger } from '@/core/Logger';
import { AIService } from '@/features/ai/services';
import { getControlsModule, resetControlsModule } from '@/features/controls';
import { getSceneModule, resetSceneModule } from '@/features/scene';
import {
  AnimationScheduler,
  CoreController,
  getAnimationScheduler,
  getCoreController,
} from '@/features/scene/services/camera';
import { getShaderService, resetShaderService } from '@/features/scene/services/shader';
import { BOOTSTRAP_PROGRESS } from '@/shared/constants';
import { useAppStore } from '@/stores/sharedStore';

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

const logger = createLogger({ module: 'Bootstrap' });

let globalErrorHandlers: {
  error?: (event: ErrorEvent) => void;
  unhandledRejection?: (event: PromiseRejectionEvent) => void;
} = {};

export async function bootstrap(config: BootstrapConfig = {}): Promise<AIService | null> {
  const lifecycleManager = getLifecycleManager();
  const currentState = lifecycleManager.getState();

  if (currentState === LifecycleState.READY || currentState === LifecycleState.INITIALIZING) {
    logger.info('Already initialized, skipping');

    return null;
  }

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { onProgress } = mergedConfig;

  logger.info('Starting...');
  onProgress?.('initializing', BOOTSTRAP_PROGRESS.INIT);

  logger.info('Creating AIService...');
  const aiService = new AIService();

  logger.info('AIService created.');

  try {
    useAppStore.getState().initServices(aiService);
    logger.info('Services injected into store.');

    if (mergedConfig.enableAI) {
      onProgress?.('registering-ai-service', BOOTSTRAP_PROGRESS.AI_SERVICE);
      lifecycleManager.register(aiService);
    }

    if (mergedConfig.enableShaders) {
      onProgress?.('registering-shader-service', BOOTSTRAP_PROGRESS.SHADER_SERVICE);
      lifecycleManager.register(getShaderService());
    }

    if (mergedConfig.enableModules) {
      onProgress?.('registering-modules', BOOTSTRAP_PROGRESS.MODULES);
      lifecycleManager.register(getSceneModule());
      lifecycleManager.register(getControlsModule());
    }

    onProgress?.('registering-camera-services', BOOTSTRAP_PROGRESS.MODULES);
    lifecycleManager.register(getAnimationScheduler());
    lifecycleManager.register(getCoreController());

    onProgress?.('initializing-services', BOOTSTRAP_PROGRESS.SERVICES);
    logger.info('Starting lifecycleManager.initializeAll()...');

    const initPromise = lifecycleManager.initializeAll();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Initialization Timeout')), 30000)
    );

    await Promise.race([initPromise, timeoutPromise]);
    logger.info('lifecycleManager.initializeAll() complete.');

    onProgress?.('configuring-error-handling', BOOTSTRAP_PROGRESS.ERROR_HANDLING);
    setupGlobalErrorHandling();

    onProgress?.('complete', BOOTSTRAP_PROGRESS.COMPLETE);
    logger.info('Started');

    return aiService;
  } catch (error) {
    logger.error('Failed to start', { error });
    throw error;
  }
}

export function isInitialized(): boolean {
  return getLifecycleManager().getState() === LifecycleState.READY;
}

export async function shutdown(): Promise<void> {
  logger.info('Shutting down...');

  try {
    cleanupGlobalErrorHandling();

    const lifecycleManager = getLifecycleManager();

    await lifecycleManager.destroyAll();

    resetSceneModule();
    resetControlsModule();
    resetShaderService();

    CoreController.resetInstance();
    AnimationScheduler.resetInstance();

    resetLifecycleManager();
    resetEventBus();

    logger.info('Shutdown complete');
  } catch (error) {
    logger.error('Shutdown error', { error });
    throw error;
  }
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
      logger.error('Unhandled rejection', { reason: event.reason });
      eventBus.emit('system:error', {
        error: event.reason,
        context: 'unhandled-rejection',
        recoverable: false,
      });
    };

    globalErrorHandlers.error = (event: ErrorEvent) => {
      logger.error('Uncaught error', { error: event.error });
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
