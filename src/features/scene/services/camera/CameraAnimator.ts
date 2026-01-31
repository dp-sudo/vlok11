import { getEventBus } from '@/core/EventBus';
import { createLogger } from '@/core/Logger';
import {
  calculateMotion,
  calculateProgress,
  type MotionType,
} from '@/features/camera/logic/motion';
import { lerp, lerpVec3, fromVector3 as vec3FromThree } from '@/shared/utils';
import { useCameraPoseStore } from '@/stores/cameraStore';

import { getAnimationScheduler } from './AnimationScheduler';

import type { LifecycleAware } from '@/core/LifecycleManager';
import type {
  AnimationHandle,
  BlendMode,
  CameraPose,
  TransitionOptions,
  Vec3,
} from '@/shared/types';
import type { Camera, PerspectiveCamera } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';

interface CameraAnimatorState {
  activeHandles: Map<string, AnimationHandle>;
  blendMode: BlendMode;
  isAnimating: boolean;
  isUserInteracting: boolean;
  resumeTransition: {
    duration: number;
    isActive: boolean;
    startPosition: Vec3;
    startTarget: Vec3;
    startTime: number;
  };
  userBasePosition: Vec3;
  userBaseTarget: Vec3;
}

const createDefaultState = (): CameraAnimatorState => ({
  isAnimating: false,
  activeHandles: new Map(),
  userBasePosition: { x: 0, y: 0, z: DEFAULTS.POSITION_Z },
  userBaseTarget: { x: 0, y: 0, z: 0 },
  isUserInteracting: false,
  blendMode: 'additive',
  resumeTransition: {
    isActive: false,
    startTime: 0,
    duration: DEFAULTS.RESUME_TRANSITION_MS,
    startPosition: { x: 0, y: 0, z: DEFAULTS.POSITION_Z },
    startTarget: { x: 0, y: 0, z: 0 },
  },
});
const DEFAULTS = {
  FOV: 55,
  POSITION_Z: 9,
  MOVE_DURATION: 600,
  LOOK_DURATION: 600,
  FOV_DURATION: 400,
  LERP_FACTOR: 0.1,
  FOV_LERP_FACTOR: 0.15,
  FOV_THRESHOLD: 0.01,
  RESUME_TRANSITION_MS: 400,
  BLEND_FACTOR: 0.35,
  EASING_POWER: 2.5,
  DELTA_MULTIPLIER: 6,
  EPSILON: 0.0001,
  PROGRESS_THRESHOLD: 0.01,
};

export const getCameraAnimator = (): CameraAnimatorImpl => CameraAnimatorImpl.getInstance();
const logger = createLogger({ module: 'CameraAnimator' });

class CameraAnimatorImpl implements LifecycleAware {
  private static instance: CameraAnimatorImpl | null = null;
  readonly dependencies = ['AnimationScheduler', 'MotionService'];
  readonly serviceId = 'CameraAnimator';
  private state: CameraAnimatorState = createDefaultState();
  private threeCamera: Camera | null = null;
  private threeControls: OrbitControlsType | null = null;
  private unsubscribers: (() => void)[] = [];

  private constructor() {}

  static getInstance(): CameraAnimatorImpl {
    CameraAnimatorImpl.instance ??= new CameraAnimatorImpl();

    return CameraAnimatorImpl.instance;
  }

  static resetInstance(): void {
    if (CameraAnimatorImpl.instance) {
      CameraAnimatorImpl.instance.dispose();
    }

    CameraAnimatorImpl.instance = null;
  }

  private applyFovImmediate(fov: number): void {
    useCameraPoseStore.getState().setPose({ fov }, 'user');

    if (!this.threeCamera) return;

    const perspCamera = this.threeCamera as PerspectiveCamera;

    if ('fov' in perspCamera) {
      perspCamera.fov = fov;
      perspCamera.updateProjectionMatrix();
    }
  }

  private applyMotionResult(
    result: { fov: number; position: Vec3; target: Vec3 },
    blendMode: BlendMode,
    deltaTime: number
  ): void {
    if (!this.threeCamera || !this.threeControls) return;

    let targetPos = result.position;
    let targetLook = result.target;

    if (blendMode === 'manual-priority') {
      const defaultPos = { x: 0, y: 0, z: DEFAULTS.POSITION_Z };
      const offset = {
        x: (result.position.x - defaultPos.x) * DEFAULTS.BLEND_FACTOR,
        y: (result.position.y - defaultPos.y) * DEFAULTS.BLEND_FACTOR,
        z: (result.position.z - defaultPos.z) * DEFAULTS.BLEND_FACTOR,
      };

      targetPos = {
        x: this.state.userBasePosition.x + offset.x,
        y: this.state.userBasePosition.y + offset.y,
        z: this.state.userBasePosition.z + offset.z,
      };
      targetLook = {
        x: this.state.userBaseTarget.x + result.target.x * DEFAULTS.BLEND_FACTOR,
        y: this.state.userBaseTarget.y + result.target.y * DEFAULTS.BLEND_FACTOR,
        z: this.state.userBaseTarget.z + result.target.z * DEFAULTS.BLEND_FACTOR,
      };
    }

    const { resumeTransition: t } = this.state;

    if (t.isActive) {
      const elapsed = performance.now() - t.startTime;
      const progress = Math.min(elapsed / t.duration, 1);

      if (progress < 1) {
        const eased = 1 - Math.pow(1 - progress, DEFAULTS.EASING_POWER);

        targetPos = lerpVec3(t.startPosition, targetPos, eased);

        targetLook = lerpVec3(t.startTarget, targetLook, eased);
      } else {
        this.state.resumeTransition.isActive = false;
      }
    }

    const lerpFactor = Math.min(DEFAULTS.LERP_FACTOR, deltaTime * DEFAULTS.DELTA_MULTIPLIER);
    const currentPos = vec3FromThree(this.threeCamera.position);
    const currentTarget = vec3FromThree(this.threeControls.target);

    const newPos = lerpVec3(currentPos, targetPos, lerpFactor);
    const newTarget = lerpVec3(currentTarget, targetLook, lerpFactor);

    this.threeCamera.position.set(newPos.x, newPos.y, newPos.z);
    this.threeControls.target.set(newTarget.x, newTarget.y, newTarget.z);
    this.threeControls.update();

    useCameraPoseStore.getState().setPose({ position: newPos, target: newTarget }, 'motion');
  }

  private applyPositionImmediate(position: Vec3): void {
    useCameraPoseStore.getState().setPose({ position }, 'user');
    if (this.threeCamera) {
      this.threeCamera.position.set(position.x, position.y, position.z);
    }
  }

  private applyTargetImmediate(target: Vec3): void {
    useCameraPoseStore.getState().setPose({ target }, 'user');
    if (this.threeControls) {
      this.threeControls.target.set(target.x, target.y, target.z);
      this.threeControls.update();
    }
  }

  bindThree(camera: Camera, controls: OrbitControlsType): void {
    this.threeCamera = camera;
    this.threeControls = controls;
    this.syncFromThree();
  }

  private calculateProgress(start: Vec3, end: Vec3, current: Vec3): number {
    const totalDist = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2) + Math.pow(end.z - start.z, 2)
    );

    if (totalDist < DEFAULTS.EPSILON) return 1;

    const currentDist = Math.sqrt(
      Math.pow(current.x - start.x, 2) +
        Math.pow(current.y - start.y, 2) +
        Math.pow(current.z - start.z, 2)
    );

    return Math.min(currentDist / totalDist, 1);
  }

  cancelAllAnimations(): void {
    this.state.activeHandles.forEach((handle) => handle.cancel());
    this.state.activeHandles.clear();
  }

  private captureUserBase(): void {
    if (!this.threeCamera || !this.threeControls) return;

    this.state.userBasePosition = vec3FromThree(this.threeCamera.position);
    this.state.userBaseTarget = vec3FromThree(this.threeControls.target);
  }

  async destroy(): Promise<void> {
    this.dispose();
    logger.info('Destroyed');
  }

  dispose(): void {
    this.cancelAllAnimations();
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    this.state = createDefaultState();
    this.threeCamera = null;
    this.threeControls = null;
  }

  getBlendMode(): BlendMode {
    return this.state.blendMode;
  }

  async initialize(): Promise<void> {
    this.setupEventListeners();
    logger.info('Initialized');
  }

  isUserInteracting(): boolean {
    return this.state.isUserInteracting;
  }

  lookAt(target: Vec3, options?: TransitionOptions): AnimationHandle | null {
    const duration = options?.duration ?? DEFAULTS.LOOK_DURATION;
    const easing = options?.easing ?? 'ease-out-cubic';

    if (duration <= 0) {
      this.applyTargetImmediate(target);
      options?.onComplete?.();

      return null;
    }

    const store = useCameraPoseStore.getState();
    const startTarget = { ...store.pose.target };
    const scheduler = getAnimationScheduler();

    const handle = scheduler.animateVec3(startTarget, target, {
      duration,
      easing,
      onUpdate: (value) => {
        this.applyTargetImmediate(value);
        options?.onUpdate?.(this.calculateProgress(startTarget, target, value));
      },
      onComplete: () => {
        this.state.activeHandles.delete(handle.id);
        options?.onComplete?.();
      },
    });

    this.state.activeHandles.set(handle.id, handle);

    return handle;
  }

  moveTo(position: Vec3, options?: TransitionOptions): AnimationHandle | null {
    const duration = options?.duration ?? DEFAULTS.MOVE_DURATION;
    const easing = options?.easing ?? 'ease-out-cubic';

    if (duration <= 0) {
      this.applyPositionImmediate(position);
      options?.onComplete?.();

      return null;
    }

    const store = useCameraPoseStore.getState();
    const startPosition = { ...store.pose.position };
    const scheduler = getAnimationScheduler();

    const handle = scheduler.animateVec3(startPosition, position, {
      duration,
      easing,
      onUpdate: (value) => {
        this.applyPositionImmediate(value);
        options?.onUpdate?.(this.calculateProgress(startPosition, position, value));
      },
      onComplete: () => {
        this.state.activeHandles.delete(handle.id);
        options?.onComplete?.();
      },
    });

    this.state.activeHandles.set(handle.id, handle);

    return handle;
  }

  setBlendMode(mode: BlendMode): void {
    this.state.blendMode = mode;
  }

  setFov(fov: number, options?: TransitionOptions): AnimationHandle | null {
    const duration = options?.duration ?? DEFAULTS.FOV_DURATION;
    const easing = options?.easing ?? 'ease-out-cubic';

    if (duration <= 0) {
      this.applyFovImmediate(fov);
      options?.onComplete?.();

      return null;
    }

    const store = useCameraPoseStore.getState();
    const startFov = store.pose.fov;
    const scheduler = getAnimationScheduler();

    const handle = scheduler.animateNumber(startFov, fov, {
      duration,
      easing,
      onUpdate: (value) => {
        this.applyFovImmediate(value);
        const progress =
          Math.abs(startFov - fov) > DEFAULTS.PROGRESS_THRESHOLD
            ? (value - startFov) / (fov - startFov)
            : 1;

        options?.onUpdate?.(progress);
      },
      onComplete: () => {
        this.state.activeHandles.delete(handle.id);
        options?.onComplete?.();
      },
    });

    this.state.activeHandles.set(handle.id, handle);

    return handle;
  }

  private setupEventListeners(): void {
    const bus = getEventBus();

    const unsubResumed = bus.on('motion:resumed', () => {
      if (!this.threeCamera || !this.threeControls) return;

      this.state.resumeTransition = {
        isActive: true,
        startTime: performance.now(),
        duration: DEFAULTS.RESUME_TRANSITION_MS,
        startPosition: vec3FromThree(this.threeCamera.position),
        startTarget: vec3FromThree(this.threeControls.target),
      };
    });

    this.unsubscribers.push(unsubResumed);

    const unsubInteractionEnd = bus.on('input:interaction-end', () => {
      this.captureUserBase();
    });

    this.unsubscribers.push(unsubInteractionEnd);
  }

  setUserInteracting(isInteracting: boolean): void {
    const wasInteracting = this.state.isUserInteracting;

    this.state.isUserInteracting = isInteracting;

    if (wasInteracting && !isInteracting) {
      this.captureUserBase();
      getEventBus().emit('input:interaction-end', undefined);
    } else if (!wasInteracting && isInteracting) {
      getEventBus().emit('input:interaction-start', { type: 'user' });
    }
  }

  private syncFromThree(): void {
    if (!this.threeCamera || !this.threeControls) return;

    const position = vec3FromThree(this.threeCamera.position);
    const target = vec3FromThree(this.threeControls.target);
    const fov =
      'fov' in this.threeCamera ? (this.threeCamera as { fov: number }).fov : DEFAULTS.FOV;

    useCameraPoseStore.getState().setPose({ position, target, fov }, 'user');
    this.state.userBasePosition = position;
    this.state.userBaseTarget = target;
  }

  transitionTo(pose: Partial<CameraPose>, options?: TransitionOptions): void {
    const duration = options?.duration ?? DEFAULTS.MOVE_DURATION;

    if (pose.position) {
      this.moveTo(pose.position, { ...options, duration });
    }
    if (pose.target) {
      this.lookAt(pose.target, { ...options, duration });
    }
    if (pose.fov !== undefined) {
      this.setFov(pose.fov, { ...options, duration });
    }
  }

  unbindThree(): void {
    this.threeCamera = null;
    this.threeControls = null;
  }

  private updateFovSmooth(_deltaTime: number): void {
    if (!this.threeCamera) return;

    const perspCamera = this.threeCamera as PerspectiveCamera;

    if (!('fov' in perspCamera)) return;

    const targetFov = useCameraPoseStore.getState().pose.fov;
    const currentFov = perspCamera.fov;

    if (Math.abs(currentFov - targetFov) > DEFAULTS.FOV_THRESHOLD) {
      const newFov = lerp(currentFov, targetFov, DEFAULTS.FOV_LERP_FACTOR);

      perspCamera.fov = newFov;
      perspCamera.updateProjectionMatrix();
    }
  }

  updateFrame(deltaTime: number, time: number): void {
    if (!this.threeCamera || !this.threeControls) return;

    const motionState = useCameraPoseStore.getState().motion;
    const { blendMode } = this.state;

    if (blendMode === 'manual-priority' && (this.state.isUserInteracting || motionState.isPaused)) {
      this.updateFovSmooth(deltaTime);

      return;
    }

    if (motionState.isActive && !motionState.isPaused && motionState.type !== 'STATIC') {
      const basePose: CameraPose = {
        position: this.state.userBasePosition,
        target: this.state.userBaseTarget,
        up: { x: 0, y: 1, z: 0 },
        fov: useCameraPoseStore.getState().pose.fov,
      };

      const progress = calculateProgress(time, motionState.startTime, 1);
      const motionResult = calculateMotion(motionState.type as MotionType, progress, basePose);

      if (motionResult) {
        this.applyMotionResult(motionResult, blendMode, deltaTime);
        useCameraPoseStore.getState().updateMotionProgress(progress);
      }
    }

    this.updateFovSmooth(deltaTime);
  }
}

export { CameraAnimatorImpl as CameraAnimator };
