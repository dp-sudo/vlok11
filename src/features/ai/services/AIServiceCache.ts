import { getEventBus } from '@/core/EventBus';
import { AIEvents } from '@/core/EventTypes';
import { CACHE_DEFAULTS } from './AIService.constants';
import type { AICacheConfig, CacheEntry } from './types';

export class AIServiceCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: AICacheConfig;

  constructor(
    config: AICacheConfig = {
      enabled: true,
      maxSize: CACHE_DEFAULTS.MAX_SIZE,
      ttlMs: CACHE_DEFAULTS.TTL_MS,
    }
  ) {
    this.config = config;
  }

  get(key: string, cacheType: string): T | null {
    if (!this.config.enabled) return null;

    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > this.config.ttlMs) {
      this.cache.delete(key);

      return null;
    }

    getEventBus().emit(AIEvents.CACHE_HIT, { key, type: cacheType });

    return entry.value;
  }

  set(key: string, value: T): void {
    if (!this.config.enabled) return;

    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { value, timestamp: Date.now(), hash: key });
  }

  clear(): void {
    this.cache.clear();
  }

  configure(config: Partial<AICacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AICacheConfig {
    return { ...this.config };
  }

  getSize(): number {
    return this.cache.size;
  }

  getStats(): { size: number; estimatedSize: number } {
    let estimatedSize = 0;

    for (const [key, entry] of this.cache.entries()) {
      estimatedSize += key.length * 2 + JSON.stringify(entry.value).length * 2;
    }

    return {
      size: this.cache.size,
      estimatedSize,
    };
  }
}
