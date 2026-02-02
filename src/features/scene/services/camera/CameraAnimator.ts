import type { Camera, PerspectiveCamera } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { getEventBus } from '@/core/EventBus';
import type { LifecycleAware } from '@/core/LifecycleManager';
import { createLogger } from '@/core/Logger';
import {
  calculateMotion,
  calculateProgress,
  type MotionType,
} from '@/features/camera/logic/motion';
import type {
  AnimationHandle,
  BlendMode,
  CameraPose,
  TransitionOptions,
  Vec3,
} from '@/shared/types';
import { lerp, lerpVec3, fromVector3 as vec3FromThree } from '@/shared/utils';
import { useCameraPoseStore } from '@/stores/cameraStore';
import { useSceneStore } from '@/stores/sharedStore';
import { getAnimationScheduler } from './AnimationScheduler';

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
  // Base pose for additive blending (captured when motion starts)
  additiveBasePose: {
    position: Vec3;
    target: Vec3;
    fov: number;
  } | null;
  // User's manual pose for manual-priority mode
  userManualPose: {
    position: Vec3;
    target: Vec3;
  } | null;
}

const createDefaultState = (): CameraAnimatorState => ({
  isAnimating: false,
  activeHandles: new Map(),
  isUserInteracting: false,
  blendMode: 'additive',
  resumeTransition: {
    isActive: false,
    startTime: 0,
    duration: DEFAULTS.RESUME_TRANSITION_MS,
    startPosition: { x: 0, y: 0, z: DEFAULTS.POSITION_Z },
    startTarget: { x: 0, y: 0, z: 0 },
  },
  additiveBasePose: null,
  userManualPose: null,
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
  ADDITIVE_BLEND_FACTOR: 1.0,
  MANUAL_PRIORITY_FACTOR: 0.5,
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

  /**
   * Apply motion result based on blend mode
   *
   * - OVERRIDE: Motion completely controls the camera position
   * - ADDITIVE: Motion is added as offset to the captured base pose
   * - MANUAL-PRIORITY: Motion only affects camera when user is not interacting,
   *                    blending between manual pose and motion
   */
  private applyMotionResult(
    result: { fov: number; position: Vec3; target: Vec3 },
    blendMode: BlendMode,
    deltaTime: number
  ): void {
    if (!this.threeCamera || !this.threeControls) return;

    let finalPosition: Vec3;
    let finalTarget: Vec3;
    let finalFov: number;

    const currentPose = useCameraPoseStore.getState().pose;

    switch (blendMode) {
      case 'override': {
        // OVERRIDE: Motion completely takes over camera control
        // Use motion result directly as the target
        finalPosition = result.position;
        finalTarget = result.target;
        finalFov = result.fov;
        break;
      }

      case 'additive': {
        // ADDITIVE: Motion is applied as offset from captured base pose
        // This ensures motion is consistent and doesn't drift
        const base = this.state.additiveBasePose;

        if (!base) {
          // No base captured yet, capture current as base
          this.captureAdditiveBasePose();
          finalPosition = result.position;
          finalTarget = result.target;
          finalFov = result.fov;
        } else {
          // Calculate offset from motion result relative to identity pose
          // Then apply that offset to the captured base pose
          const identityPos = { x: 0, y: 0, z: DEFAULTS.POSITION_Z };
          const identityTarget = { x: 0, y: 0, z: 0 };

          const posOffset = {
            x: (result.position.x - identityPos.x) * DEFAULTS.ADDITIVE_BLEND_FACTOR,
            y: (result.position.y - identityPos.y) * DEFAULTS.ADDITIVE_BLEND_FACTOR,
            z: (result.position.z - identityPos.z) * DEFAULTS.ADDITIVE_BLEND_FACTOR,
          };

          const targetOffset = {
            x: (result.target.x - identityTarget.x) * DEFAULTS.ADDITIVE_BLEND_FACTOR,
            y: (result.target.y - identityTarget.y) * DEFAULTS.ADDITIVE_BLEND_FACTOR,
            z: (result.target.z - identityTarget.z) * DEFAULTS.ADDITIVE_BLEND_FACTOR,
          };

          finalPosition = {
            x: base.position.x + posOffset.x,
            y: base.position.y + posOffset.y,
            z: base.position.z + posOffset.z,
          };

          finalTarget = {
            x: base.target.x + targetOffset.x,
            y: base.target.y + targetOffset.y,
            z: base.target.z + targetOffset.z,
          };

          finalFov = base.fov + (result.fov - DEFAULTS.FOV) * 0.5;
        }
        break;
      }

      case 'manual-priority': {
        // MANUAL-PRIORITY: Blend between user's manual position and motion
        // When user is interacting, we use their pose
        // When motion is active, we blend towards motion
        const manual = this.state.userManualPose;

        if (!manual || this.state.isUserInteracting) {
          // User is controlling, capture their pose
          this.captureManualPose();
          finalPosition = vec3FromThree(this.threeCamera.position);
          finalTarget = vec3FromThree(this.threeControls.target);
          finalFov = currentPose.fov;
        } else {
          // Blend from manual pose towards motion result
          const blendFactor = DEFAULTS.MANUAL_PRIORITY_FACTOR;

          finalPosition = {
            x: manual.position.x + (result.position.x - manual.position.x) * blendFactor,
            y: manual.position.y + (result.position.y - manual.position.y) * blendFactor,
            z: manual.position.z + (result.position.z - manual.position.z) * blendFactor,
          };

          finalTarget = {
            x: manual.target.x + (result.target.x - manual.target.x) * blendFactor,
            y: manual.target.y + (result.target.y - manual.target.y) * blendFactor,
            z: manual.target.z + (result.target.z - manual.target.z) * blendFactor,
          };

          finalFov = currentPose.fov + (result.fov - currentPose.fov) * 0.3;
        }
        break;
      }

      default: {
        finalPosition = result.position;
        finalTarget = result.target;
        finalFov = result.fov;
      }
    }

    // Apply resume transition smoothing if active
    const { resumeTransition: t } = this.state;

    if (t.isActive) {
      const elapsed = performance.now() - t.startTime;
      const progress = Math.min(elapsed / t.duration, 1);

      if (progress < 1) {
        const eased = 1 - (1 - progress) ** DEFAULTS.EASING_POWER;

        finalPosition = lerpVec3(t.startPosition, finalPosition, eased);
        finalTarget = lerpVec3(t.startTarget, finalTarget, eased);
      } else {
        this.state.resumeTransition.isActive = false;
      }
    }

    // Smooth interpolation to final values
    const lerpFactor = Math.min(DEFAULTS.LERP_FACTOR, deltaTime * DEFAULTS.DELTA_MULTIPLIER);
    const currentPos = vec3FromThree(this.threeCamera.position);
    const currentTarget = vec3FromThree(this.threeControls.target);

    const newPos = lerpVec3(currentPos, finalPosition, lerpFactor);
    const newTarget = lerpVec3(currentTarget, finalTarget, lerpFactor);

    this.threeCamera.position.set(newPos.x, newPos.y, newPos.z);
    this.threeControls.target.set(newTarget.x, newTarget.y, newTarget.z);
    this.threeControls.update();

    // Update store with new pose
    useCameraPoseStore.getState().setPose(
      {
        position: newPos,
        target: newTarget,
        fov: finalFov,
      },
      blendMode === 'manual-priority' && this.state.isUserInteracting ? 'user' : 'motion'
    );
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
      (end.x - start.x) ** 2 + (end.y - start.y) ** 2 + (end.z - start.z) ** 2
    );

    if (totalDist < DEFAULTS.EPSILON) return 1;

    const currentDist = Math.sqrt(
      (current.x - start.x) ** 2 + (current.y - start.y) ** 2 + (current.z - start.z) ** 2
    );

    return Math.min(currentDist / totalDist, 1);
  }

  cancelAllAnimations(): void {
    this.state.activeHandles.forEach((handle) => {
      handle.cancel();
    });
    this.state.activeHandles.clear();
  }

  /**
   * Capture the current pose as base for additive blending
   */
  private captureAdditiveBasePose(): void {
    if (!this.threeCamera || !this.threeControls) return;

    const store = useCameraPoseStore.getState();

    this.state.additiveBasePose = {
      position: vec3FromThree(this.threeCamera.position),
      target: vec3FromThree(this.threeControls.target),
      fov: store.pose.fov,
    };
    logger.info('Captured additive base pose');
  }

  /**
   * Capture the current pose as manual pose for manual-priority mode
   */
  private captureManualPose(): void {
    if (!this.threeCamera || !this.threeControls) return;

    this.state.userManualPose = {
      position: vec3FromThree(this.threeCamera.position),
      target: vec3FromThree(this.threeControls.target),
    };
  }

  async destroy(): Promise<void> {
    this.dispose();
    logger.info('Destroyed');
  }

  dispose(): void {
    this.cancelAllAnimations();
    this.unsubscribers.forEach((unsub) => {
      unsub();
    });
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
    const previousMode = this.state.blendMode;

    this.state.blendMode = mode;

    // When switching to additive mode, capture the current pose as base
    if (mode === 'additive' && previousMode !== 'additive') {
      this.captureAdditiveBasePose();
    }

    // When switching to manual-priority, capture current manual pose
    if (mode === 'manual-priority' && previousMode !== 'manual-priority') {
      this.captureManualPose();
    }

    logger.info(`Blend mode changed: ${previousMode} -> ${mode}`);
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

      const resumeTransitionMs = useSceneStore.getState().config.motionResumeTransitionMs;

      this.state.resumeTransition = {
        isActive: true,
        startTime: performance.now(),
        duration: resumeTransitionMs,
        startPosition: vec3FromThree(this.threeCamera.position),
        startTarget: vec3FromThree(this.threeControls.target),
      };
    });

    this.unsubscribers.push(unsubResumed);

    const unsubResumeRequested = bus.on('motion:resume-requested', () => {
      if (!this.threeCamera || !this.threeControls) return;

      const resumeTransitionMs = useSceneStore.getState().config.motionResumeTransitionMs;

      this.state.resumeTransition = {
        isActive: true,
        startTime: performance.now(),
        duration: resumeTransitionMs,
        startPosition: vec3FromThree(this.threeCamera.position),
        startTarget: vec3FromThree(this.threeControls.target),
      };
    });

    this.unsubscribers.push(unsubResumeRequested);
  }

  setUserInteracting(isInteracting: boolean): void {
    const wasInteracting = this.state.isUserInteracting;

    this.state.isUserInteracting = isInteracting;

    if (wasInteracting && !isInteracting) {
      // User just stopped interacting
      // For manual-priority mode, update the manual pose
      if (this.state.blendMode === 'manual-priority') {
        this.captureManualPose();
      }
      // For additive mode, we might want to rebase
      if (this.state.blendMode === 'additive') {
        this.captureAdditiveBasePose();
      }
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

    // Also sync to internal state
    this.state.additiveBasePose ??= { position, target, fov };
    this.state.userManualPose ??= { position, target };
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

    // MANUAL-PRIORITY: When user is interacting, only update FOV smoothly
    // Don't apply motion when user is controlling the camera
    if (blendMode === 'manual-priority' && this.state.isUserInteracting) {
      this.updateFovSmooth(deltaTime);

      return;
    }

    // For active motion (not static and not paused)
    if (motionState.isActive && !motionState.isPaused && motionState.type !== 'STATIC') {
      // Ensure we have base poses captured
      if (blendMode === 'additive' && !this.state.additiveBasePose) {
        this.captureAdditiveBasePose();
      }
      if (blendMode === 'manual-priority' && !this.state.userManualPose) {
        this.captureManualPose();
      }

      // For additive mode, use the captured base pose
      // For other modes, use current camera position as base
      const basePose: CameraPose =
        blendMode === 'additive' && this.state.additiveBasePose
          ? {
              position: this.state.additiveBasePose.position,
              target: this.state.additiveBasePose.target,
              up: { x: 0, y: 1, z: 0 },
              fov: this.state.additiveBasePose.fov,
            }
          : {
              position: vec3FromThree(this.threeCamera.position),
              target: vec3FromThree(this.threeControls.target),
              up: { x: 0, y: 1, z: 0 },
              fov: useCameraPoseStore.getState().pose.fov,
            };

      const motionSpeed = useSceneStore.getState().config.cameraMotionSpeed;
      const progress = calculateProgress(time, motionState.startTime, motionSpeed);
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
