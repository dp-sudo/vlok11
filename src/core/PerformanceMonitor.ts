import { PERFORMANCE } from '@/shared/constants';

import { getEventBus } from './EventBus';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryTotal?: number;
  memoryUsed?: number;
}
export interface PerformanceMonitor {
  getInitTimes(): Map<string, number>;
  getMetrics(): PerformanceMetrics;
  getThresholds(): PerformanceThresholds;
  recordServiceInitTime(serviceId: string, timeMs: number): void;
  setThresholds(thresholds: Partial<PerformanceThresholds>): void;
  start(): void;
  stop(): void;
}
export interface PerformanceThresholds {
  maxFrameTime: number;
  maxMemoryPercent: number;
  minFps: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  minFps: PERFORMANCE.FPS_TARGET / 2,
  maxFrameTime: PERFORMANCE.FRAME_TIME_TARGET_MS * 2,
  maxMemoryPercent: 80,
};

export const getPerformanceMonitor = (): PerformanceMonitor => PerformanceMonitorImpl.getInstance();
const MS_PER_SECOND = 1000;

export const resetPerformanceMonitor = (): void => {
  PerformanceMonitorImpl.resetInstance();
};

class PerformanceMonitorImpl implements PerformanceMonitor {
  private static instance: PerformanceMonitorImpl | null = null;

  private fps: number = PERFORMANCE.FPS_TARGET;
  private frameCount = 0;
  private frameTime: number = PERFORMANCE.FRAME_TIME_TARGET_MS;
  private initTimes = new Map<string, number>();
  private lastTime = 0;
  private rafId = 0;
  private running = false;
  private thresholds: PerformanceThresholds = { ...DEFAULT_THRESHOLDS };
  private updateInterval = PERFORMANCE.UPDATE_INTERVAL_MS;

  private constructor() {}

  static getInstance(): PerformanceMonitorImpl {
    PerformanceMonitorImpl.instance ??= new PerformanceMonitorImpl();

    return PerformanceMonitorImpl.instance;
  }

  static resetInstance(): void {
    if (PerformanceMonitorImpl.instance) {
      PerformanceMonitorImpl.instance.stop();
      PerformanceMonitorImpl.instance.initTimes.clear();
    }
    PerformanceMonitorImpl.instance = null;
  }

  private calculateQualityLevel(currentFps: number, targetFps: number): 'high' | 'medium' | 'low' {
    const ratio = currentFps / targetFps;
    const HIGH_QUALITY_THRESHOLD = 0.8;
    const MEDIUM_QUALITY_THRESHOLD = 0.5;

    if (ratio >= HIGH_QUALITY_THRESHOLD) {
      return 'high';
    }

    if (ratio >= MEDIUM_QUALITY_THRESHOLD) {
      return 'medium';
    }

    return 'low';
  }

  private checkThresholds(): void {
    if (this.fps < this.thresholds.minFps) {
      getEventBus().emit('performance:threshold:exceeded', {
        metric: 'fps',
        value: this.fps,
        threshold: this.thresholds.minFps,
      });

      const qualityLevel = this.calculateQualityLevel(this.fps, this.thresholds.minFps);

      getEventBus().emit('performance:quality:adjust', {
        fps: this.fps,
        suggestedLevel: qualityLevel,
        reason: 'low_fps',
      });
    }

    if (this.frameTime > this.thresholds.maxFrameTime) {
      getEventBus().emit('performance:threshold:exceeded', {
        metric: 'frameTime',
        value: this.frameTime,
        threshold: this.thresholds.maxFrameTime,
      });
    }

    const metrics = this.getMetrics();

    if (metrics.memoryUsed && metrics.memoryTotal) {
      const memoryPercent =
        (metrics.memoryUsed / metrics.memoryTotal) * PERFORMANCE.MEMORY_PERCENT_MULTIPLIER;

      if (memoryPercent > this.thresholds.maxMemoryPercent) {
        getEventBus().emit('performance:memory:warning', {
          used: metrics.memoryUsed,
          total: metrics.memoryTotal,
          percentage: memoryPercent,
        });
      }
    }
  }

  private emitMetrics(): void {
    getEventBus().emit('performance:fps:update', {
      fps: this.fps,
      frameTime: this.frameTime,
    });
  }

  getInitTimes(): Map<string, number> {
    return new Map(this.initTimes);
  }

  getMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      fps: this.fps,
      frameTime: this.frameTime,
    };

    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const { memory } = performance as {
        memory?: { totalJSHeapSize: number; usedJSHeapSize: number };
      };

      if (memory) {
        metrics.memoryUsed = memory.usedJSHeapSize;
        metrics.memoryTotal = memory.totalJSHeapSize;
      }
    }

    return metrics;
  }

  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  recordServiceInitTime(serviceId: string, timeMs: number): void {
    this.initTimes.set(serviceId, timeMs);
  }

  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private tick(): void {
    if (!this.running) {
      return;
    }

    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastTime;

    if (elapsed >= this.updateInterval) {
      this.fps = Math.round((this.frameCount * MS_PER_SECOND) / elapsed);
      this.frameTime = elapsed / this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;

      this.emitMetrics();
      this.checkThresholds();
    }

    this.rafId = requestAnimationFrame(() => {
      this.tick();
    });
  }
}
