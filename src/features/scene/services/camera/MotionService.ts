import { getEventBus } from '@/core/EventBus';
import { TrackingEvents } from '@/core/EventTypes';
import type { LifecycleAware } from '@/core/LifecycleManager';
import { createLogger } from '@/core/Logger';
import { DEFAULT_FOV } from '@/shared/constants';
import { MS_PER_SECOND } from '@/shared/constants/motion';
import type {
  BlendMode,
  CameraPose,
  MotionConfig,
  MotionParams,
  MotionPoint,
  MotionResult,
  MotionService as MotionServiceType,
  MotionState,
  MotionType,
  TrackedPoint3D,
  Vec3,
} from '@/shared/types';
import type { CameraPose as StoreCameraPose } from '@/stores/cameraStore';
import { useCameraStore } from '@/stores/index';
import { getPrecisionConfigService } from './PrecisionConfigService';
import { getMotionCalculator } from './MotionCalculator';

// Re-export MotionCalculator for external use
export { MotionCalculator, getMotionCalculator } from './MotionCalculator';
export type { MotionType, MotionParams, MotionResult } from './MotionCalculator';

// Re-export types for convenience
export type { MotionPoint, MotionConfig, MotionState };

const BASE_RATE = 0.5;
const DEFAULT_PARAMS: MotionParams = {
  speed: 1.0,
  scale: 1.0,
  orbitRadius: 9,
  orbitTilt: 15,
  flyByHeight: 5,
  flyBySwing: 20,
  spiralLoops: 2,
  spiralHeight: 5,
  arcAngle: 90,
  arcRhythm: 1,
  trackingDistance: 6,
  trackingOffset: 1,
  dollyRange: 10,
  dollyIntensity: 0.8,
};
const DEFAULT_STATE: MotionState = {
  isActive: false,
  isPaused: false,
  type: 'STATIC',
  progress: 0,
  startTime: 0,
};

export const getMotionService = (): MotionServiceImpl => MotionServiceImpl.getInstance();
const logger = createLogger({ module: 'MotionService' });

class MotionServiceImpl implements MotionServiceType, LifecycleAware {
  private static instance: MotionServiceImpl | null = null;
  private _isInitialized = false;
  private blendMode: BlendMode = 'override';
  readonly dependencies = ['CameraService'];
  private params: MotionParams = { ...DEFAULT_PARAMS };
  private pauseTimeOffset = 0;
  readonly serviceId = 'MotionService';
  private state: MotionState = { ...DEFAULT_STATE };
  // Tracking state - used for TRACKING motion type
  private trackingTarget: Vec3 | null = null;
  private trackingOff: (() => void) | null = null;
  private unsubscribe: (() => void) | null = null;
  private constructor() {}

  static getInstance(): MotionServiceImpl {
    MotionServiceImpl.instance ??= new MotionServiceImpl();

    return MotionServiceImpl.instance;
  }

  static resetInstance(): void {
    if (MotionServiceImpl.instance) {
      MotionServiceImpl.instance.dispose();
    }
    MotionServiceImpl.instance = null;
  }

  /**
   * @deprecated 运动计算已移至 MotionCalculator。请使用 getMotionCalculator().calculate() 代替。
   * 此方法仅用于 generatePreview() 的内部实现。
   *
   * 运行时推荐使用 CameraAnimator + MotionCalculator 的组合。
   */
  calculate(time: number, basePose?: CameraPose): MotionResult | null {
    if (!this.state.isActive || this.state.isPaused || this.state.type === 'STATIC') {
      return null;
    }

    const { type } = this.state;
    const elapsed = (time - this.state.startTime) / MS_PER_SECOND;
    const speed = this.params.speed || 1;
    const progress = (elapsed * speed * BASE_RATE) % 1;

    this.state.progress = progress;

    const base =
      basePose ??
      this.getBasePose() ?? {
        position: { x: 0, y: 0, z: 9 },
        target: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
        fov: DEFAULT_FOV,
      };

    // Use MotionCalculator for calculations
    const calculator = getMotionCalculator();
    const result = calculator.calculate(time, this.state.startTime, base, type, this.trackingTarget ?? undefined);

    return result;
  }

  configure(config: Partial<MotionConfig>): void {
    if (config.type) this.state.type = config.type;
    if (config.blendMode) this.blendMode = config.blendMode;
    if (config.params) {
      this.params = { ...this.params, ...config.params };
    }
    if (this.state.type === 'STATIC') {
      this.state.isActive = false;
    } else if (!this.state.isPaused) {
      this.state.isActive = true;
    }
  }

  async destroy(): Promise<void> {
    logger.info('Destroying');
    this.stop();
    this.dispose();
    this._isInitialized = false;
  }

  private dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.trackingOff) {
      this.trackingOff();
      this.trackingOff = null;
    }
  }

  generatePreview(duration: number, samples: number): MotionPoint[] {
    const calculator = getMotionCalculator();
    const basePose: CameraPose = {
      position: { x: 0, y: 0, z: 9 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fov: 55,
    };

    // Store original state
    const originalType = this.state.type;
    const originalStartTime = this.state.startTime;
    const originalIsActive = this.state.isActive;
    const originalIsPaused = this.state.isPaused;

    // Set preview state
    this.state.type = originalType || 'ORBIT';
    this.state.startTime = 0;
    this.state.isActive = true;
    this.state.isPaused = false;

    const points = calculator.generatePreview(this.state.type, duration, samples, basePose);

    // Restore original state
    this.state.type = originalType;
    this.state.startTime = originalStartTime;
    this.state.isActive = originalIsActive;
    this.state.isPaused = originalIsPaused;

    return points;
  }

  private getBasePose(): CameraPose | null {
    const { basePose } = this.store;

    return basePose
      ? {
          position: basePose.position,
          target: basePose.target,
          up: basePose.up,
          fov: basePose.fov,
        }
      : null;
  }

  getBlendMode(): BlendMode {
    return this.blendMode;
  }

  getParameters(): MotionParams {
    return { ...this.params };
  }

  getProgress(): number {
    return this.state.progress;
  }

  getState(): MotionState {
    return { ...this.state };
  }

  getType(): MotionType {
    return this.state.type;
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) return;
    logger.info('Initializing');
    this.setupStoreSync();
    this.setupTrackingSync();
    this._isInitialized = true;
  }

  isActive(): boolean {
    return this.state.isActive;
  }

  isPaused(): boolean {
    return this.state.isPaused;
  }

  pause(): void {
    if (!this.state.isActive || this.state.isPaused) return;
    this.state.isPaused = true;
    this.pauseTimeOffset = performance.now() - this.state.startTime;
    logger.info('Paused motion');
  }

  resume(): void {
    if (!this.state.isActive || !this.state.isPaused) return;
    this.state.isPaused = false;
    this.state.startTime = performance.now() - this.pauseTimeOffset;
    logger.info('Resumed motion');
  }

  setBlendMode(mode: BlendMode): void {
    this.blendMode = mode;
  }

  setParameter<K extends keyof MotionParams>(key: K, value: MotionParams[K]): void {
    this.params[key] = value;
  }

  private setupStoreSync(): void {
    // Clean up any existing subscription first to prevent memory leaks
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.unsubscribe = useCameraStore.subscribe(
      (state) => state.interaction.isInteracting,
      (isInteracting, wasInteracting) => {
        if (wasInteracting && !isInteracting && this.blendMode === 'additive') {
          const { pose } = useCameraStore.getState();

          useCameraStore.getState().captureBasePose(pose);
        }
      }
    );
  }

  private setupTrackingSync(): void {
    // Clean up any existing subscription first to prevent memory leaks
    if (this.trackingOff) {
      this.trackingOff();
      this.trackingOff = null;
    }

    this.trackingOff = getEventBus().on(TrackingEvents.POINT_3D, (p: TrackedPoint3D) => {
      this.trackingTarget = { ...p.world };
    });
  }

  start(type: MotionType, config?: Partial<MotionConfig>): void {
    this.state.type = type;
    if (config) {
      this.configure(config);
    }
    if (this.state.type === 'STATIC') {
      logger.warn('Cannot start STATIC motion');

      return;
    }
    this.state.isActive = true;
    this.state.isPaused = false;
    this.state.startTime = performance.now();
    this.state.progress = 0;
    this.pauseTimeOffset = 0;
    if (this.blendMode === 'additive') {
      const { pose } = useCameraStore.getState();

      useCameraStore.getState().captureBasePose(pose as unknown as StoreCameraPose);
    }
    logger.info(`Started motion: ${this.state.type}`);
  }

  stop(): void {
    this.state.isActive = false;
    this.state.isPaused = false;
    this.state.progress = 0;
    logger.info('Stopped motion');
  }

  // 应用精度配置
  applyPrecisionConfig(): void {
    const precisionConfig = getPrecisionConfigService().getConfig();

    // 应用灵敏度到运动参数
    this.params.speed = this.params.speed * precisionConfig.moveSensitivity;

    logger.info('Applied precision config to motion', {
      speedMultiplier: precisionConfig.moveSensitivity,
      damping: precisionConfig.dampingFactor,
    });
  }

  private get store() {
    return useCameraStore.getState();
  }
}

export { MotionServiceImpl as MotionService };
