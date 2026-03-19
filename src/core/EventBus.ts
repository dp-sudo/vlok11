import { createLogger } from '@/core/Logger';
import { EVENT_BUS } from '@/shared/constants/performance';

import type {
  CoreEventHandler,
  CoreEventPayloadMap,
  CoreEventType,
  EventBus,
  EventRecord,
  EventSubscriptionOptions,
} from './EventTypes';

interface Subscriber {
  handler: (payload: unknown) => void;
  once: boolean;
  priority: number;
}

export interface EventInterceptor {
  onEmit?: (type: string, payload: unknown) => unknown | void;
  onSubscribe?: (type: string, handler: (payload: unknown) => void) => void;
}

const logger = createLogger({ module: 'EventBus' });

let eventBusInstance: EventBusImpl | null = null;

class EventBusImpl implements EventBus {
  private history: (EventRecord | null)[];
  private historyHead = 0;
  private historySize = 0;
  private interceptors: EventInterceptor[] = [];
  private loggingEnabled = false;
  private maxHistory = EVENT_BUS.MAX_HISTORY;
  private subscribers = new Map<string, Subscriber[]>();

  constructor() {
    // 使用空数组而非预填充 null，节省内存
    this.history = [];
  }

  clearEventHistory(): void {
    this.history = [];
    this.historyHead = 0;
    this.historySize = 0;
  }

  emit<T extends CoreEventType>(type: T, payload: CoreEventPayloadMap[T]): void;
  emit(type: string, payload: unknown): void;
  emit(type: string, payload: unknown): void {
    let processedPayload = payload;

    for (const interceptor of this.interceptors) {
      if (interceptor.onEmit) {
        const result = interceptor.onEmit(type, processedPayload);

        if (result !== undefined) {
          processedPayload = result;
        }
      }
    }

    const subscribers = this.subscribers.get(type);

    if (this.loggingEnabled) {
      logger.debug(`Event emitted: ${type}`, { payload: processedPayload });
    }

    if (!subscribers || subscribers.length === 0) {
      return;
    }

    const record: EventRecord = {
      type,
      payload,
      timestamp: Date.now(),
      subscriberCount: subscribers.length,
    };

    // 环形缓冲区实现：
    // - historyHead 指向下一个写入位置
    // - 当缓冲区满时，新记录覆盖最旧的记录（通过 modulo 实现循环）
    // - 最旧的记录位置：(head - 1 + max) % max
    if (this.history.length < this.maxHistory) {
      this.history.push(record);
    } else {
      this.history[this.historyHead] = record;
      this.historyHead = (this.historyHead + 1) % this.maxHistory;
    }
    this.historySize = Math.min(this.historySize + 1, this.maxHistory);

    for (const sub of subscribers) {
      try {
        sub.handler(processedPayload);

        if (sub.once) {
          this.off(type, sub.handler);
        }
      } catch (error) {
        logger.error(`Error in event handler for ${type}`, { error });
      }
    }
  }

  enableLogging(enabled: boolean): void {
    this.loggingEnabled = enabled;
  }

  getAllTypes(): string[] {
    return Array.from(this.subscribers.keys());
  }

  getEventHistory(limit?: number): EventRecord[] {
    const count = limit === undefined ? this.historySize : Math.min(limit, this.historySize);

    if (count === 0 || this.history.length === 0) {
      return [];
    }

    // If buffer not yet full, use simple slice
    if (this.history.length < this.maxHistory) {
      return this.history.slice(-count) as EventRecord[];
    }

    // Buffer is full - use circular buffer indexing
    // head points to next write position, so newest is at (head - 1 + max) % max
    const result: EventRecord[] = [];

    for (let i = 0; i < count; i++) {
      const idx = (this.historyHead - 1 - i + this.maxHistory) % this.maxHistory;
      result.push(this.history[idx]!);
    }

    return result;
  }

  getSubscriberCount(type: CoreEventType | string): number {
    const subs = this.subscribers.get(type);

    return subs ? subs.length : 0;
  }

  off<T extends CoreEventType>(type: T, handler: CoreEventHandler<T>): void;
  off(type: string, handler: (payload: unknown) => void): void;
  off(type: string, handler: (payload: unknown) => void): void {
    const subs = this.subscribers.get(type);

    if (!subs) return;

    // Use filter to avoid array holes from splice
    const filteredSubs = subs.filter((sub) => sub.handler !== handler);

    if (filteredSubs.length !== subs.length) {
      this.subscribers.set(type, filteredSubs);
    }

    if (filteredSubs.length === 0) {
      this.subscribers.delete(type);
    }
  }

  offAll(type?: CoreEventType | string): void {
    if (type) {
      this.subscribers.delete(type);
    } else {
      this.subscribers.clear();
    }
  }

  on<T extends CoreEventType>(
    type: T,
    handler: CoreEventHandler<T>,
    options?: EventSubscriptionOptions
  ): () => void;
  on(
    type: string,
    handler: (payload: unknown) => void,
    options?: EventSubscriptionOptions
  ): () => void;
  on(
    type: string,
    handler: (payload: unknown) => void,
    options: EventSubscriptionOptions = {}
  ): () => void {
    const { priority = 0, once = false } = options;

    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, []);
    }

    const subs = this.subscribers.get(type);

    if (!subs) return () => {};

    const subscriber: Subscriber = { handler, priority, once };

    subs.push(subscriber);
    subs.sort((a, b) => b.priority - a.priority);

    return () => {
      this.off(type, handler);
    };
  }

  once<T extends CoreEventType>(type: T, handler: CoreEventHandler<T>): () => void;
  once(type: string, handler: (payload: unknown) => void): () => void;
  once(type: string, handler: (payload: unknown) => void): () => void {
    return this.on(type, handler, { once: true });
  }

  reset(): void {
    const subCount = this.getTotalSubscriberCount();

    this.subscribers.clear();
    this.history = [];
    this.historyHead = 0;
    this.historySize = 0;
    logger.info(`EventBus reset - cleared ${subCount} subscribers`);
  }

  getTotalSubscriberCount(): number {
    let count = 0;

    for (const subs of this.subscribers.values()) {
      count += subs.length;
    }

    return count;
  }

  /**
   * Debug method to get all subscriber handlers for a given event type
   * Useful for tracking subscriptions and detecting potential memory leaks
   */
  getSubscriberHandlers(type: CoreEventType | string): Array<{ handler: (payload: unknown) => void; once: boolean; priority: number }> {
    const subs = this.subscribers.get(type);

    if (!subs) {
      return [];
    }

    return subs.map((sub) => ({
      handler: sub.handler,
      once: sub.once,
      priority: sub.priority,
    }));
  }

  addInterceptor(interceptor: EventInterceptor): () => void {
    this.interceptors.push(interceptor);

    return () => {
      // Use filter to avoid array holes from splice
      this.interceptors = this.interceptors.filter((i) => i !== interceptor);
    };
  }

  clearInterceptors(): void {
    this.interceptors = [];
  }

  dispose(): void {
    this.reset();
    eventBusInstance = null;
    logger.info('EventBus disposed');
  }
}

export function getEventBus(): EventBus {
  eventBusInstance ??= new EventBusImpl();

  return eventBusInstance;
}

export function resetEventBus(): void {
  if (eventBusInstance) {
    eventBusInstance.reset();
  }
}
