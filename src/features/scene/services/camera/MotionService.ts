import { getEventBus } from '@/core/EventBus';
import { TrackingEvents } from '@/core/EventTypes';
import { createLogger } from '@/core/Logger';
import { DEFAULT_FOV } from '@/shared/constants';
import { MOTION_CALC, MS_PER_SECOND } from '@/shared/constants/motion';
import { degToRad, lerp, lerpVec3, radToDeg } from '@/shared/utils';
import { useCameraStore } from '@/stores/index';

import { getPrecisionConfigService } from './PrecisionConfigService';

import type { LifecycleAware } from '@/core/LifecycleManager';
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

const BASE_RATE = 0.5;
const DEFAULT_PARAMS: MotionParams = {
  speed: 1.0,
  scale: 1.0,
  orbitRadius: 9,
  orbitTilt: 15,
  flyByHeight: 2,
  flyBySwing: 8,
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
const TRACKING_POINT_TIMEOUT_MS = 800;

class MotionServiceImpl implements MotionServiceType, LifecycleAware {
  private static instance: MotionServiceImpl | null = null;
  private _isInitialized = false;
  private blendMode: BlendMode = 'override';
  readonly dependencies = ['CameraService'];
  private params: MotionParams = { ...DEFAULT_PARAMS };
  private pauseTimeOffset = 0;
  readonly serviceId = 'MotionService';
  private state: MotionState = { ...DEFAULT_STATE };
  private trackingLastSeenPerfMs = 0;
  private trackingOff: (() => void) | null = null;
  private trackingRawTarget: Vec3 | null = null;
  private trackingSmoothedTarget: Vec3 | null = null;
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
  calculate(time: number, basePose?: CameraPose): MotionResult | null {
    if (!this.state.isActive || this.state.isPaused || this.state.type === 'STATIC') {
      return null;
    }
    const { type } = this.state;
    const elapsed = (time - this.state.startTime) / MS_PER_SECOND;
    const speed = this.params.speed || 1;
    const progress = (elapsed * speed * BASE_RATE) % 1;

    this.state.progress = progress;
    const base = basePose ??
      this.getBasePose() ?? {
        position: { x: 0, y: 0, z: 9 },
        target: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
        fov: DEFAULT_FOV,
      };
    let result: MotionResult;

    switch (type) {
      case 'ORBIT':
        result = this.calculateOrbit(progress, base);
        break;
      case 'FLY_BY':
        result = this.calculateFlyBy(progress, base);
        break;
      case 'SPIRAL':
        result = this.calculateSpiral(progress, base);
        break;
      case 'DOLLY_ZOOM':
        result = this.calculateDollyZoom(progress, base);
        break;
      case 'ARC':
        result = this.calculateArc(progress, base);
        break;
      case 'TRACKING':
        result = this.calculateTracking(
          MOTION_CALC.TRACKING_ALPHA_SPEED / MOTION_CALC.DELTA_TIME_FACTOR,
          base
        );
        break;
      default:
        return null;
    }

    return result;
  }
  private calculateArc(progress: number, base: CameraPose): MotionResult {
    const t = Math.sin(progress * Math.PI * 2);
    const maxAngle = degToRad(this.params.arcAngle ?? MOTION_CALC.ARC_DEFAULT_ANGLE);
    const angle = t * maxAngle;
    const radius = this.params.orbitRadius ?? MOTION_CALC.FLY_BY_Z_BASE;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;

    return {
      position: {
        x: base.target.x + x,
        y: base.target.y + (base.position.y - base.target.y),
        z: base.target.z + z,
      },
      target: base.target,
      fov: base.fov,
    };
  }
  private calculateDollyZoom(progress: number, base: CameraPose): MotionResult {
    const t = Math.sin(progress * Math.PI * 2);
    const range = this.params.dollyRange ?? MOTION_CALC.DOLLY_MIN_DISTANCE;
    const intensity = this.params.dollyIntensity ?? 1;
    const distOffset = t * range;
    const baseDist = MOTION_CALC.FLY_BY_Z_BASE;
    const newDist = baseDist + distOffset;
    const halfFovRad = degToRad(base.fov) / 2;
    const k = Math.tan(halfFovRad) * baseDist;
    const newHalfFov = Math.atan(k / newDist);
    const newFov = radToDeg(newHalfFov * 2);
    const finalFov = lerp(base.fov, newFov, intensity);
    const dx = base.position.x - base.target.x;
    const dy = base.position.y - base.target.y;
    const dz = base.position.z - base.target.z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (len < MOTION_CALC.EPSILON)
      return { position: base.position, target: base.target, fov: base.fov };
    const dir = { x: dx / len, y: dy / len, z: dz / len };
    const finalDist = Math.max(MOTION_CALC.MIN_DISTANCE, len + distOffset * intensity);

    return {
      position: {
        x: base.target.x + dir.x * finalDist,
        y: base.target.y + dir.y * finalDist,
        z: base.target.z + dir.z * finalDist,
      },
      target: base.target,
      fov: finalFov,
    };
  }
  private calculateFlyBy(progress: number, base: CameraPose): MotionResult {
    const t = (progress * 2 - 1) * (this.params.flyBySwing ?? MOTION_CALC.FLY_BY_SWING);
    const height = this.params.flyByHeight ?? 2;

    return {
      position: {
        x: base.target.x + t,
        y: base.target.y + height,
        z: base.target.z + MOTION_CALC.DOLLY_MIN_DISTANCE,
      },
      target: base.target,
      fov: base.fov,
    };
  }
  private calculateOrbit(progress: number, base: CameraPose): MotionResult {
    const angle = progress * Math.PI * 2;
    const radius = this.params.orbitRadius ?? MOTION_CALC.FLY_BY_Z_BASE;
    const tilt = degToRad(this.params.orbitTilt ?? MOTION_CALC.ORBIT_TILT);
    const x = Math.sin(angle) * radius * Math.cos(tilt);
    const z = Math.cos(angle) * radius * Math.cos(tilt);
    const y = Math.sin(tilt) * radius;

    return {
      position: {
        x: base.target.x + x,
        y: base.target.y + y,
        z: base.target.z + z,
      },
      target: base.target,
      fov: base.fov,
    };
  }
  private calculateSpiral(progress: number, base: CameraPose): MotionResult {
    const loops = this.params.spiralLoops ?? 2;
    const heightTotal = this.params.spiralHeight ?? MOTION_CALC.SPIRAL_HEIGHT;
    const angle = progress * Math.PI * 2 * loops;
    const height = (progress - MOTION_CALC.HALF) * heightTotal;
    const radius = this.params.orbitRadius ?? MOTION_CALC.FLY_BY_Z_BASE;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;

    return {
      position: {
        x: base.target.x + x,
        y: base.target.y + height,
        z: base.target.z + z,
      },
      target: base.target,
      fov: base.fov,
    };
  }
  private calculateTracking(deltaTime: number, base: CameraPose): MotionResult {
    if (!this.isTrackingValid() || !this.trackingRawTarget) {
      return {
        position: base.position,
        target: base.target,
        fov: base.fov,
      };
    }
    if (!this.trackingSmoothedTarget) {
      this.trackingSmoothedTarget = { ...this.trackingRawTarget };
    } else {
      const smoothFactor = Math.min(1, deltaTime * MOTION_CALC.DOLLY_MIN_DISTANCE);

      this.trackingSmoothedTarget = lerpVec3(
        this.trackingSmoothedTarget,
        this.trackingRawTarget,
        smoothFactor
      );
    }
    const target = this.trackingSmoothedTarget;
    const dist = this.params.trackingDistance ?? MOTION_CALC.DOLLY_MIN_DISTANCE;
    const offsetY = this.params.trackingOffset ?? 0;
    const position = {
      x: target.x,
      y: target.y + offsetY,
      z: target.z + dist,
    };

    return {
      position,
      target,
      fov: base.fov,
    };
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
    const points: MotionPoint[] = [];
    const step = duration / samples;
    const basePose: CameraPose = {
      position: { x: 0, y: 0, z: 9 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fov: 55,
    };
    const originalState = { ...this.state };

    this.state.startTime = 0;
    this.state.isActive = true;
    this.state.isPaused = false;
    for (let i = 0; i <= samples; i++) {
      const time = i * step * MS_PER_SECOND;
      const res = this.calculate(time, basePose);

      if (res) {
        points.push({
          position: res.position,
          target: res.target,
          fov: res.fov,
          time: i * step,
        });
      }
    }
    this.state = originalState;

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
  private isTrackingValid(): boolean {
    return performance.now() - this.trackingLastSeenPerfMs < TRACKING_POINT_TIMEOUT_MS;
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
    this.unsubscribe = useCameraStore.subscribe(
      (state) => state.interaction.isInteracting,
      (isInteracting, wasInteracting) => {
        if (wasInteracting && !isInteracting && this.blendMode === 'additive') {
          const { pose } = useCameraStore.getState();

          useCameraStore.getState().captureBasePose(pose as unknown as StoreCameraPose);
        }
      }
    );
  }
  private setupTrackingSync(): void {
    this.trackingOff = getEventBus().on(TrackingEvents.POINT_3D, (p: TrackedPoint3D) => {
      this.trackingRawTarget = { ...p.world };
      this.trackingLastSeenPerfMs = performance.now();
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
      damping: precisionConfig.dampingFactor 
    });
  }

  private get store() {
    return useCameraStore.getState();
  }
}

export { MotionServiceImpl as MotionService };
