import { createLogger } from '@/core/Logger';
import { BATCH_PROCESSING, MEMORY } from '@/shared/constants/utils';

export class ObjectURLManager {
  private static instance: ObjectURLManager | null = null;
  private urls = new Set<string>();

  static getInstance(): ObjectURLManager {
    ObjectURLManager.instance ??= new ObjectURLManager();

    return ObjectURLManager.instance;
  }

  create(blob: Blob | File): string {
    const url = URL.createObjectURL(blob);

    this.urls.add(url);

    return url;
  }

  getCount(): number {
    return this.urls.size;
  }

  revoke(url: string): void {
    if (this.urls.has(url)) {
      URL.revokeObjectURL(url);
      this.urls.delete(url);
    }
  }

  revokeAll(): void {
    this.urls.forEach((url) => URL.revokeObjectURL(url));
    this.urls.clear();
  }
}

export const batchProcess = async <T, R>(
  items: T[],
  processor: (item: T) => R | Promise<R>,
  batchSize = BATCH_PROCESSING.DEFAULT_BATCH_SIZE,
  delayBetweenBatches = 0
): Promise<R[]> => {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));

    results.push(...batchResults);
    if (delayBetweenBatches > 0 && i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
};
export const cancelIdleCallback = (id: number): void => {
  if ('cancelIdleCallback' in window) {
    (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};
export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFn;
};
export const getMemoryUsage = (): { percentage: number; total: number; used: number } | null => {
  if ('memory' in performance) {
    const { memory } = performance as Performance & {
      memory: { totalJSHeapSize: number; usedJSHeapSize: number };
    };

    return {
      used: Math.round(memory.usedJSHeapSize / MEMORY.BYTES_PER_KB / MEMORY.BYTES_PER_KB),
      total: Math.round(memory.totalJSHeapSize / MEMORY.BYTES_PER_KB / MEMORY.BYTES_PER_KB),
      percentage: Math.round(
        (memory.usedJSHeapSize / memory.totalJSHeapSize) * MEMORY.PERCENTAGE_MULTIPLIER
      ),
    };
  }

  return null;
};
export const getObjectURLManager = (): ObjectURLManager => ObjectURLManager.getInstance();
const isDevEnv = import.meta.env?.DEV ?? false;
const logger = createLogger({ module: 'Utils' });

export const perfMark = {
  start: (name: string) => {
    if (isDevEnv) performance.mark(`${name}-start`);
  },
  end: (name: string) => {
    if (isDevEnv) {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = performance.getEntriesByName(name, 'measure')[0];

        if (measure) logger.debug(`${name}: ${measure.duration.toFixed(2)}ms`);
      } catch {}
    }
  },
  clear: () => {
    if (isDevEnv) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  },
};
export const requestIdleCallback = (
  callback: () => void,
  options?: { timeout?: number }
): number => {
  if ('requestIdleCallback' in window) {
    return (
      window as unknown as {
        requestIdleCallback: (cb: () => void, opts?: { timeout?: number }) => number;
      }
    ).requestIdleCallback(callback, options);
  }

  return setTimeout(callback, options?.timeout ?? 1) as unknown as number;
};
export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
};
