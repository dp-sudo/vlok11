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

const logger = createLogger({ module: 'EventBus' });

let eventBusInstance: EventBusImpl | null = null;

class EventBusImpl implements EventBus {
  private history: (EventRecord | null)[];
  private historyHead = 0;
  private historySize = 0;
  private loggingEnabled = false;
  private maxHistory = EVENT_BUS.MAX_HISTORY;
  private subscribers = new Map<string, Subscriber[]>();

  constructor() {
    this.history = new Array<EventRecord | null>(this.maxHistory).fill(null);
  }

  clearEventHistory(): void {
    this.history = new Array<EventRecord | null>(this.maxHistory).fill(null);
    this.historyHead = 0;
    this.historySize = 0;
  }

  emit<T extends CoreEventType>(type: T, payload: CoreEventPayloadMap[T]): void;
  emit(type: string, payload: unknown): void;
  emit(type: string, payload: unknown): void {
    const subscribers = this.subscribers.get(type);

    if (this.loggingEnabled) {
      logger.debug(`Event emitted: ${type}`, { payload });
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

    this.history[this.historyHead] = record;
    this.historyHead = (this.historyHead + 1) % this.maxHistory;
    if (this.historySize < this.maxHistory) {
      this.historySize++;
    }

    for (const sub of subscribers) {
      try {
        sub.handler(payload);

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
    const result: EventRecord[] = [];
    const count = limit === undefined ? this.historySize : Math.min(limit, this.historySize);
    const start = (this.historyHead - count + this.maxHistory) % this.maxHistory;

    for (let i = 0; i < count; i++) {
      const idx = (start + i) % this.maxHistory;
      const record = this.history[idx];

      if (record) {
        result.push(record);
      }
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

    const index = subs.findIndex((sub) => sub.handler === handler);

    if (index !== -1) {
      subs.splice(index, 1);
    }

    if (subs.length === 0) {
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
    this.subscribers.clear();
    this.history = new Array<EventRecord | null>(this.maxHistory).fill(null);
    this.historyHead = 0;
    this.historySize = 0;
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
