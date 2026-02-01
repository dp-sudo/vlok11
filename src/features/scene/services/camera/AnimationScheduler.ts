import { getEventBus } from '@/core/EventBus';
import { createLogger } from '@/core/Logger';

import { EASING_BOUNCE, EASING_COMMON, EASING_ELASTIC } from './AnimationScheduler.constants';

import type { LifecycleAware } from '@/core/LifecycleManager';
import type {
  AnimationHandle,
  AnimationInfo,
  AnimationOptions,
  AnimationService,
  EasingFunction,
  EasingType,
  QueuedAnimation,
  Vec3,
} from '@/shared/types';

interface ActiveAnimation {
  duration: number;
  easing: EasingFunction;
  id: string;
  isPaused: boolean;
  onCancel?: () => void;
  onComplete?: () => void;
  onUpdate: (progress: number) => void;
  pausedAt: number;
  pausedProgress: number;
  startTime: number;
}

const EASING_FUNCTIONS: Record<EasingType, EasingFunction> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (EASING_COMMON.QUAD_MULTIPLIER - t),
  'ease-in-out': (t) =>
    t < EASING_COMMON.HALF
      ? EASING_COMMON.QUAD_MULTIPLIER * t * t
      : -1 + (EASING_COMMON.CUBIC_MULTIPLIER - EASING_COMMON.QUAD_MULTIPLIER * t) * t,
  'ease-in-cubic': (t) => t * t * t,
  'ease-out-cubic': (t) => 1 - Math.pow(1 - t, EASING_COMMON.CUBIC_POWER),
  'ease-in-out-cubic': (t) =>
    t < EASING_COMMON.HALF
      ? EASING_COMMON.CUBIC_MULTIPLIER * t * t * t
      : 1 -
        Math.pow(
          EASING_COMMON.CUBIC_NEG_MULTIPLIER * t + EASING_COMMON.QUAD_MULTIPLIER,
          EASING_COMMON.CUBIC_POWER
        ) /
          EASING_COMMON.CUBIC_DIVISOR,
  'ease-in-elastic': (t) => {
    if (t === 0 || t === 1) {
      return t;
    }

    return (
      -Math.pow(EASING_ELASTIC.BASE, EASING_ELASTIC.EXPONENT * t - EASING_ELASTIC.EXPONENT) *
      Math.sin(
        (t * EASING_ELASTIC.EXPONENT - EASING_ELASTIC.PHASE_OFFSET_IN) *
          ((2 * Math.PI) / EASING_ELASTIC.PERIOD_DIVISOR)
      )
    );
  },
  'ease-out-elastic': (t) => {
    if (t === 0 || t === 1) {
      return t;
    }

    return (
      Math.pow(EASING_ELASTIC.BASE, EASING_ELASTIC.NEG_EXPONENT * t) *
        Math.sin(
          (t * EASING_ELASTIC.EXPONENT - EASING_ELASTIC.PHASE_OFFSET_OUT) *
            ((2 * Math.PI) / EASING_ELASTIC.PERIOD_DIVISOR)
        ) +
      1
    );
  },
  'ease-in-out-elastic': (t) => {
    if (t === 0 || t === 1) {
      return t;
    }
    if (t < EASING_COMMON.HALF) {
      return (
        -(
          Math.pow(
            EASING_ELASTIC.BASE,
            EASING_ELASTIC.IN_OUT_MULTIPLIER * t - EASING_ELASTIC.EXPONENT
          ) *
          Math.sin(
            (EASING_ELASTIC.IN_OUT_MULTIPLIER * t - EASING_ELASTIC.IN_OUT_PHASE_OFFSET) *
              ((2 * Math.PI) / EASING_ELASTIC.IN_OUT_PERIOD_DIVISOR)
          )
        ) / EASING_COMMON.CUBIC_DIVISOR
      );
    }

    return (
      (Math.pow(
        EASING_ELASTIC.BASE,
        EASING_ELASTIC.IN_OUT_NEG_MULTIPLIER * t + EASING_ELASTIC.EXPONENT
      ) *
        Math.sin(
          (EASING_ELASTIC.IN_OUT_MULTIPLIER * t - EASING_ELASTIC.IN_OUT_PHASE_OFFSET) *
            ((2 * Math.PI) / EASING_ELASTIC.IN_OUT_PERIOD_DIVISOR)
        )) /
        EASING_COMMON.CUBIC_DIVISOR +
      1
    );
  },
  'ease-in-bounce': (t) => 1 - EASING_FUNCTIONS['ease-out-bounce'](1 - t),
  'ease-out-bounce': (inputT) => {
    const n1 = EASING_BOUNCE.N1;
    const d1 = EASING_BOUNCE.D1;
    let t = inputT;

    if (t < 1 / d1) {
      return n1 * t * t;
    }
    if (t < 2 / d1) {
      t -= EASING_BOUNCE.OFFSET_1 / d1;

      return n1 * t * t + EASING_BOUNCE.RESULT_1;
    }
    if (t < EASING_BOUNCE.THRESHOLD_2 / d1) {
      t -= EASING_BOUNCE.OFFSET_2 / d1;

      return n1 * t * t + EASING_BOUNCE.RESULT_2;
    }
    t -= EASING_BOUNCE.OFFSET_3 / d1;

    return n1 * t * t + EASING_BOUNCE.RESULT_3;
  },
};

export const getAnimationScheduler = (): AnimationService & LifecycleAware =>
  AnimationSchedulerImpl.getInstance();
export const getEasingFunction = (type: EasingType): EasingFunction =>
  EASING_FUNCTIONS[type] || EASING_FUNCTIONS.linear;
const logger = createLogger({ module: 'AnimationScheduler' });

class AnimationSchedulerImpl implements AnimationService, LifecycleAware {
  private static instance: AnimationSchedulerImpl | null = null;
  private activeAnimations = new Map<string, ActiveAnimation>();
  private animationQueue: QueuedAnimation[] = [];
  readonly dependencies: string[] = [];
  private frameId: number | null = null;
  private idCounter = 0;
  readonly serviceId = 'AnimationScheduler';

  private constructor() {
    this.tick = this.tick.bind(this);
  }

  static getInstance(): AnimationSchedulerImpl {
    AnimationSchedulerImpl.instance ??= new AnimationSchedulerImpl();

    return AnimationSchedulerImpl.instance;
  }

  static resetInstance(): void {
    if (AnimationSchedulerImpl.instance) {
      AnimationSchedulerImpl.instance.cancelAll();
      AnimationSchedulerImpl.instance.clearQueue();
    }
    AnimationSchedulerImpl.instance = null;
  }

  animate<T>(from: T, to: T, options: AnimationOptions<T>): AnimationHandle {
    const { duration, easing = 'ease-out-cubic', onUpdate, onComplete, onCancel } = options;
    const id = this.generateId();
    const easingFn = getEasingFunction(easing);

    const animation: ActiveAnimation = {
      id,
      startTime: performance.now(),
      duration,
      easing: easingFn,
      isPaused: false,
      pausedAt: 0,
      pausedProgress: 0,
      onUpdate: (progress) => {
        const value = this.interpolate(from, to, progress);

        onUpdate?.(value, progress);
      },
      onComplete,
      onCancel,
    };

    this.activeAnimations.set(id, animation);
    this.startLoop();
    getEventBus().emit('animation:started', { id, duration });

    return this.createHandle(id);
  }

  animateNumber(from: number, to: number, options: AnimationOptions<number>): AnimationHandle {
    return this.animate(from, to, options);
  }

  animateVec3(from: Vec3, to: Vec3, options: AnimationOptions<Vec3>): AnimationHandle {
    return this.animate(from, to, options);
  }

  cancel(handle: AnimationHandle, snapToEnd = false): void {
    const { id } = handle as { id: string };
    const animation = this.activeAnimations.get(id);

    if (!animation) {
      return;
    }

    if (snapToEnd) {
      animation.onUpdate(1);
    }
    animation.onCancel?.();
    this.activeAnimations.delete(id);

    const progress = snapToEnd ? 1 : this.getAnimationProgress(animation);

    getEventBus().emit('animation:cancelled', { id, progress, snappedToEnd: snapToEnd });

    this.checkStopLoop();
    this.processQueue();
  }

  cancelAll(snapToEnd = false): void {
    this.activeAnimations.forEach((animation) => {
      if (snapToEnd) {
        animation.onUpdate(1);
      }
      animation.onCancel?.();
      const progress = snapToEnd ? 1 : this.getAnimationProgress(animation);

      getEventBus().emit('animation:cancelled', {
        id: animation.id,
        progress,
        snappedToEnd: snapToEnd,
      });
    });

    this.activeAnimations.clear();
    this.checkStopLoop();
  }

  private checkStopLoop(): void {
    if (this.activeAnimations.size === 0 && this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  clearQueue(): void {
    this.animationQueue = [];
  }

  private createHandle(id: string): AnimationHandle {
    return {
      id,
      cancel: (snapToEnd) => {
        this.cancel({ id } as AnimationHandle, snapToEnd);
      },
      pause: () => {
        this.pauseAnimation(id);
      },
      resume: () => {
        this.resumeAnimation(id);
      },
      isActive: () => this.activeAnimations.has(id),
      getProgress: () => {
        const anim = this.activeAnimations.get(id);

        return anim ? this.getAnimationProgress(anim) : 1;
      },
    };
  }

  async destroy(): Promise<void> {
    this.cancelAll();
    this.clearQueue();
    logger.info('Destroyed');
  }

  enqueue(animation: QueuedAnimation): void {
    this.animationQueue.push(animation);
    this.animationQueue.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    this.processQueue();
  }

  private generateId(): string {
    return `anim_${++this.idCounter}_${Date.now()}`;
  }

  getActiveAnimations(): AnimationInfo[] {
    const now = performance.now();
    const result: AnimationInfo[] = [];

    this.activeAnimations.forEach((anim) => {
      const elapsed = anim.isPaused ? anim.pausedAt - anim.startTime : now - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);

      result.push({
        id: anim.id,
        startTime: anim.startTime,
        duration: anim.duration,
        progress,
        isPaused: anim.isPaused,
      });
    });

    return result;
  }

  private getAnimationProgress(animation: ActiveAnimation): number {
    if (animation.isPaused) {
      return animation.pausedProgress;
    }
    const elapsed = performance.now() - animation.startTime;

    return Math.min(elapsed / animation.duration, 1);
  }

  async initialize(): Promise<void> {
    logger.info('Initialized');
  }

  private interpolate<T>(from: T, to: T, progress: number): T {
    if (typeof from === 'number' && typeof to === 'number') {
      return (from + (to - from) * progress) as T;
    }

    if (this.isVec3(from) && this.isVec3(to)) {
      return {
        x: from.x + (to.x - from.x) * progress,
        y: from.y + (to.y - from.y) * progress,
        z: from.z + (to.z - from.z) * progress,
      } as T;
    }

    return progress >= 1 ? to : from;
  }

  isAnimating(): boolean {
    return this.activeAnimations.size > 0;
  }

  private isVec3(value: unknown): value is Vec3 {
    return (
      typeof value === 'object' && value !== null && 'x' in value && 'y' in value && 'z' in value
    );
  }

  pause(): void {
    for (const [id] of this.activeAnimations) {
      this.pauseAnimation(id);
    }
  }

  private pauseAnimation(id: string): void {
    const animation = this.activeAnimations.get(id);

    if (!animation || animation.isPaused) {
      return;
    }

    animation.isPaused = true;
    animation.pausedAt = performance.now();
    animation.pausedProgress = this.getAnimationProgress(animation);
    getEventBus().emit('animation:paused', { id, progress: animation.pausedProgress });
  }

  private processQueue(): void {
    if (this.activeAnimations.size === 0 && this.animationQueue.length > 0) {
      const next = this.animationQueue.shift();

      if (next) {
        next.execute();
      }
    }
  }

  resume(): void {
    for (const [id, anim] of this.activeAnimations) {
      if (anim.isPaused) {
        this.resumeAnimation(id);
      }
    }
  }

  private resumeAnimation(id: string): void {
    const animation = this.activeAnimations.get(id);

    if (!animation?.isPaused) {
      return;
    }

    const pauseDuration = performance.now() - animation.pausedAt;

    animation.startTime += pauseDuration;
    animation.isPaused = false;
    getEventBus().emit('animation:resumed', { id, progress: animation.pausedProgress });
    this.startLoop();
  }

  private startLoop(): void {
    this.frameId ??= requestAnimationFrame(this.tick);
  }

  private tick(now: number): void {
    const completed: string[] = [];
    const animations = Array.from(this.activeAnimations.entries());

    for (const [id, animation] of animations) {
      if (animation.isPaused) {
        continue;
      }

      const elapsed = now - animation.startTime;
      const rawProgress = Math.min(elapsed / animation.duration, 1);
      const easedProgress = animation.easing(rawProgress);

      animation.onUpdate(easedProgress);
      getEventBus().emit('animation:progress', { id, progress: rawProgress });

      if (rawProgress >= 1) {
        completed.push(id);
      }
    }

    for (const id of completed) {
      const animation = this.activeAnimations.get(id);

      if (animation) {
        animation.onComplete?.();
        this.activeAnimations.delete(id);
        getEventBus().emit('animation:completed', { id, duration: animation.duration });
      }
    }

    if (this.activeAnimations.size > 0) {
      this.frameId = requestAnimationFrame(this.tick);
    } else {
      this.frameId = null;
      this.processQueue();
    }
  }
}

export { AnimationSchedulerImpl as AnimationScheduler };
