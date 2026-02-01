import { getEventBus } from '@/core/EventBus';
import { getLifecycleManager, type LifecycleAware, LifecycleState } from '@/core/LifecycleManager';
import { createLogger } from '@/core/Logger';
import type { AnimationService, CameraPose, CoreController } from '@/shared/types';
import { useCameraPoseStore } from '@/stores/cameraStore';
import { useSceneStore } from '@/stores/sharedStore';
import { getAnimationScheduler } from './AnimationScheduler';

type PoseChangedPayload = { pose: CameraPose; source?: string };
type SystemErrorPayload = { error: Error; recoverable?: boolean };

export const getCoreController = (): CoreController => CoreControllerImpl.getInstance();
const logger = createLogger({ module: 'CoreController' });
const VERSION = '1.0.0';

class CoreControllerImpl implements CoreController, LifecycleAware {
  private static instance: CoreControllerImpl | null = null;
  private _animation: AnimationService;
  private _isInitialized = false;
  private _isPaused = false;

  readonly dependencies: string[] = ['AnimationScheduler'];
  private pauseTimestamp = 0;
  readonly serviceId = 'CoreController';
  private unsubscribers: (() => void)[] = [];

  private constructor() {
    this._animation = getAnimationScheduler();
  }

  static getInstance(): CoreControllerImpl {
    CoreControllerImpl.instance ??= new CoreControllerImpl();

    return CoreControllerImpl.instance;
  }

  static resetInstance(): void {
    if (CoreControllerImpl.instance) {
      CoreControllerImpl.instance.dispose();
    }
    CoreControllerImpl.instance = null;
  }

  get animation(): AnimationService {
    return this._animation;
  }

  async destroy(): Promise<void> {
    this.dispose();
  }

  dispose(): void {
    if (!this._isInitialized) {
      return;
    }

    useCameraPoseStore.getState().stopMotion();
    this._animation.cancelAll();

    this.unsubscribers.forEach((unsub) => {
      unsub();
    });
    this.unsubscribers = [];
    this._isInitialized = false;

    getEventBus().emit('system:disposed', { timestamp: Date.now() });
    logger.info('Disposed');
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) {
      logger.warn('Already initialized');

      return;
    }

    try {
      this.setupEventListeners();
      this._isInitialized = true;

      getEventBus().emit('system:initialized', {
        timestamp: Date.now(),
        version: VERSION,
      });

      logger.info('Initialized');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      getEventBus().emit('system:error', {
        error: err,
        context: 'CoreController.initialize',
        recoverable: false,
      });

      throw err;
    }
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  isLifecycleReady(): boolean {
    return getLifecycleManager().getState() === LifecycleState.READY;
  }

  pause(): void {
    if (this._isPaused) {
      return;
    }

    this._isPaused = true;
    this.pauseTimestamp = Date.now();
    useCameraPoseStore.getState().pauseMotion();

    getEventBus().emit('system:paused', { timestamp: this.pauseTimestamp });
  }

  reset(): void {
    useCameraPoseStore.getState().stopMotion();
    this._animation.cancelAll();
    useCameraPoseStore.getState().setPose(
      {
        position: { x: 0, y: 0, z: 9 },
        target: { x: 0, y: 0, z: 0 },
        fov: 55,
      },
      'reset'
    );
    logger.info('Reset to default state');
  }

  resume(): void {
    if (!this._isPaused) {
      return;
    }

    const pauseDuration = Date.now() - this.pauseTimestamp;

    this._isPaused = false;
    useCameraPoseStore.getState().resumeMotion();

    getEventBus().emit('system:resumed', { timestamp: Date.now(), pauseDuration });
  }

  private setupEventListeners(): void {
    const bus = getEventBus();

    const unsubInteractionStart = bus.on('input:interaction-start', () => {
      const motionState = useCameraPoseStore.getState().motion;

      if (motionState.isActive) {
        useCameraPoseStore.getState().pauseMotion();
      }
    });

    this.unsubscribers.push(unsubInteractionStart);

    const unsubInteractionEnd = bus.on('input:interaction-end', () => {
      const motionState = useCameraPoseStore.getState().motion;
      const interactionState = useCameraPoseStore.getState().interaction;

      if (motionState.isPaused) {
        const { motionResumeDelayMs } = useSceneStore.getState().config;
        const timeoutId = setTimeout(() => {
          const currentMotion = useCameraPoseStore.getState().motion;
          const currentInteraction = useCameraPoseStore.getState().interaction;

          if (currentMotion.isPaused && !currentInteraction.isInteracting) {
            useCameraPoseStore.getState().resumeMotion();
          }
        }, motionResumeDelayMs);

        this.unsubscribers.push(() => clearTimeout(timeoutId));
      }

      void interactionState;
    });

    this.unsubscribers.push(unsubInteractionEnd);

    const unsubPoseChanged = bus.on('camera:pose-changed', (payload: unknown) => {
      const p = payload as PoseChangedPayload | null;

      if (p?.source === 'user') {
        useCameraPoseStore.getState().captureBasePose(p.pose);
      }
    });

    this.unsubscribers.push(unsubPoseChanged);

    const unsubError = bus.on('system:error', (payload: unknown) => {
      const p = payload as SystemErrorPayload | null;

      logger.error('System error', { message: p?.error?.message ?? 'Unknown error' });
      if (!p?.recoverable) {
        this.reset();
      }
    });

    this.unsubscribers.push(unsubError);
  }
}

export { CoreControllerImpl as CoreController };
