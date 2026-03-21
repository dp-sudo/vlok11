import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getEventBus, resetEventBus } from './EventBus';
import type { EventBus } from './EventTypes';

describe('EventBus', () => {
  beforeEach(() => {
    resetEventBus();
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetEventBus();
  });

  describe('getEventBus', () => {
    it('should return an event bus instance', () => {
      const bus = getEventBus();

      expect(bus).toBeDefined();
      expect(typeof bus.on).toBe('function');
      expect(typeof bus.off).toBe('function');
      expect(typeof bus.emit).toBe('function');
    });

    it('should return the same instance on multiple calls', () => {
      const bus1 = getEventBus();
      const bus2 = getEventBus();

      expect(bus1).toBe(bus2);
    });
  });

  describe('subscribe and unsubscribe', () => {
    it('should subscribe to an event', () => {
      const bus = getEventBus();
      const handler = vi.fn();

      bus.on('testEvent', handler);
      expect(bus.getSubscriberCount('testEvent')).toBe(1);
    });

    it('should unsubscribe from an event', () => {
      const bus = getEventBus();
      const handler = vi.fn();
      const unsubscribe = bus.on('testEvent', handler);

      unsubscribe();
      expect(bus.getSubscriberCount('testEvent')).toBe(0);
    });

    it('should handle multiple handlers for same event', () => {
      const bus = getEventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on('testEvent', handler1);
      bus.on('testEvent', handler2);
      expect(bus.getSubscriberCount('testEvent')).toBe(2);
    });

    it('should call handler when event is emitted', () => {
      const bus = getEventBus();
      const handler = vi.fn();

      bus.on('testEvent', handler);
      bus.emit('testEvent', { data: 'test' });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should remove all handlers with offAll', () => {
      const bus = getEventBus() as EventBus & { getTotalSubscriberCount: () => number };

      bus.on('event1', vi.fn());
      bus.on('event2', vi.fn());
      bus.offAll();
      expect(bus.getTotalSubscriberCount()).toBe(0);
    });

    it('should remove handlers for specific type with offAll', () => {
      const bus = getEventBus();

      bus.on('event1', vi.fn());
      bus.on('event2', vi.fn());
      bus.offAll('event1');
      expect(bus.getSubscriberCount('event1')).toBe(0);
      expect(bus.getSubscriberCount('event2')).toBe(1);
    });
  });

  describe('once', () => {
    it('should only call handler once', () => {
      const bus = getEventBus();
      const handler = vi.fn();

      bus.once('testEvent', handler);
      bus.emit('testEvent', { data: '1' });
      bus.emit('testEvent', { data: '2' });
      bus.emit('testEvent', { data: '3' });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', () => {
      const bus = getEventBus();
      const handler = vi.fn();
      const unsubscribe = bus.once('testEvent', handler);

      unsubscribe();
      bus.emit('testEvent', { data: 'test' });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    it('should not call handlers for non-subscribed events', () => {
      const bus = getEventBus();
      const handler = vi.fn();

      bus.on('otherEvent', handler);
      bus.emit('testEvent', { data: 'test' });
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle emit without payload', () => {
      const bus = getEventBus();
      const handler = vi.fn();

      bus.on('testEvent', handler);
      bus.emit('testEvent', undefined);
      expect(handler).toHaveBeenCalledWith(undefined);
    });
  });

  describe('event history', () => {
    it('should record events in history', () => {
      const bus = getEventBus();

      bus.on('testEvent', vi.fn()); // Subscribe to record history
      bus.emit('testEvent', { data: 'test' });
      const history = bus.getEventHistory();

      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toMatchObject({
        type: 'testEvent',
        payload: { data: 'test' },
      });
    });

    it('should limit history size', () => {
      const bus = getEventBus();

      bus.on('testEvent', vi.fn()); // Subscribe to record history
      for (let i = 0; i < 100; i++) {
        bus.emit('testEvent', { index: i });
      }
      const history = bus.getEventHistory();

      // History should be limited by MAX_HISTORY (usually 1000)
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it('should clear event history', () => {
      const bus = getEventBus();

      bus.on('testEvent', vi.fn()); // Subscribe to record history
      bus.emit('testEvent', { data: 'test' });
      bus.clearEventHistory();
      const history = bus.getEventHistory();

      expect(history.length).toBe(0);
    });

    it('should get limited history', () => {
      const bus = getEventBus();

      bus.on('testEvent', vi.fn()); // Subscribe to record history
      for (let i = 0; i < 10; i++) {
        bus.emit('testEvent', { index: i });
      }
      const history = bus.getEventHistory(5);

      expect(history.length).toBe(5);
    });
  });

  describe('interceptors', () => {
    it('should call onEmit interceptor', () => {
      const bus = getEventBus() as EventBus & {
        addInterceptor: (i: unknown) => () => void;
        clearInterceptors: () => void;
      };
      const interceptor = {
        onEmit: vi.fn((_type: string, payload: unknown) => {
          return { ...(payload as object), intercepted: true };
        }),
      };

      bus.addInterceptor(interceptor);
      const handler = vi.fn();

      bus.on('testEvent', handler);
      bus.emit('testEvent', { data: 'test' });
      expect(interceptor.onEmit).toHaveBeenCalledWith('testEvent', { data: 'test' });
      expect(handler).toHaveBeenCalledWith({ data: 'test', intercepted: true });
      bus.clearInterceptors();
    });

    it('should allow removing interceptor', () => {
      const bus = getEventBus() as EventBus & {
        addInterceptor: (i: unknown) => () => void;
      };
      const interceptor = { onEmit: vi.fn() };
      const removeInterceptor = bus.addInterceptor(interceptor);

      removeInterceptor();
      bus.emit('testEvent', { data: 'test' });
      expect(interceptor.onEmit).not.toHaveBeenCalled();
    });
  });

  describe('logging', () => {
    it('should enable and disable logging', () => {
      const bus = getEventBus();

      bus.enableLogging(true);
      bus.emit('testEvent', { data: 'test' });
      bus.enableLogging(false);
      // Should not throw even with logging disabled
      expect(() => bus.emit('testEvent', { data: 'test' })).not.toThrow();
    });
  });

  describe('getAllTypes', () => {
    it('should return all event types with subscribers', () => {
      const bus = getEventBus();

      bus.on('event1', vi.fn());
      bus.on('event2', vi.fn());
      bus.on('event3', vi.fn());
      const types = bus.getAllTypes();

      expect(types).toContain('event1');
      expect(types).toContain('event2');
      expect(types).toContain('event3');
    });
  });

  describe('reset', () => {
    it('should reset all subscribers and history', () => {
      const bus = getEventBus() as EventBus & { getTotalSubscriberCount: () => number };

      bus.on('event1', vi.fn());
      bus.emit('testEvent', { data: 'test' });
      bus.reset();
      expect(bus.getTotalSubscriberCount()).toBe(0);
      expect(bus.getEventHistory().length).toBe(0);
    });
  });

  describe('priority', () => {
    it('should call higher priority handlers first', () => {
      const bus = getEventBus();
      const order: number[] = [];

      bus.on(
        'testEvent',
        () => {
          order.push(1);
        },
        { priority: 10 }
      );
      bus.on(
        'testEvent',
        () => {
          order.push(2);
        },
        { priority: 20 }
      );
      bus.on(
        'testEvent',
        () => {
          order.push(3);
        },
        { priority: 5 }
      );

      bus.emit('testEvent', undefined);

      // Higher priority (20) should be called first
      expect(order[0]).toBe(2);
      expect(order[1]).toBe(1);
      expect(order[2]).toBe(3);
    });
  });

  describe('error handling', () => {
    it('should continue emitting to other handlers when one throws', () => {
      const bus = getEventBus();
      const handler1 = vi.fn(() => {
        throw new Error('Handler 1 error');
      });
      const handler2 = vi.fn();

      bus.on('testEvent', handler1);
      bus.on('testEvent', handler2);

      expect(() => bus.emit('testEvent', { data: 'test' })).not.toThrow();
      expect(handler2).toHaveBeenCalled();
    });

    it('should handle emit with null payload', () => {
      const bus = getEventBus();
      const handler = vi.fn();

      bus.on('testEvent', handler);
      bus.emit('testEvent', null);
      expect(handler).toHaveBeenCalledWith(null);
    });

    it('should handle emit with object payload', () => {
      const bus = getEventBus();
      const handler = vi.fn();

      bus.on('testEvent', handler);
      bus.emit('testEvent', { nested: { deep: 'value' }, arr: [1, 2, 3] });
      expect(handler).toHaveBeenCalledWith({ nested: { deep: 'value' }, arr: [1, 2, 3] });
    });

    it('should handle emit with large payload', () => {
      const bus = getEventBus();
      const handler = vi.fn();

      bus.on('testEvent', handler);
      const largePayload = { data: 'x'.repeat(10000) };

      bus.emit('testEvent', largePayload);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('getSubscriberHandlers', () => {
    it('should return all handler details for an event type', () => {
      const bus = getEventBus() as EventBus & {
        getSubscriberHandlers: (
          type: string
        ) => Array<{ handler: (payload: unknown) => void; once: boolean; priority: number }>;
      };

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on('testEvent', handler1, { priority: 10 });
      bus.on('testEvent', handler2, { priority: 5, once: true });

      const handlers = bus.getSubscriberHandlers('testEvent');

      expect(handlers.length).toBe(2);
      expect(handlers[0]?.priority).toBe(10);
      expect(handlers[1]?.once).toBe(true);
    });

    it('should return empty array for non-existent event type', () => {
      const bus = getEventBus() as EventBus & {
        getSubscriberHandlers: (
          type: string
        ) => Array<{ handler: (payload: unknown) => void; once: boolean; priority: number }>;
      };

      const handlers = bus.getSubscriberHandlers('nonexistent');

      expect(handlers).toEqual([]);
    });
  });

  describe('dispose', () => {
    it('should dispose and reset event bus', () => {
      const bus = getEventBus() as EventBus & {
        dispose: () => void;
        getTotalSubscriberCount: () => number;
      };

      bus.on('event1', vi.fn());
      bus.on('event2', vi.fn());

      bus.dispose();

      expect(bus.getTotalSubscriberCount()).toBe(0);
      expect(bus.getEventHistory().length).toBe(0);
    });
  });

  describe('event history boundary cases', () => {
    it('should return empty array when history is empty', () => {
      const bus = getEventBus();

      const history = bus.getEventHistory();

      expect(history).toEqual([]);
    });

    it('should return empty array when limit is 0', () => {
      const bus = getEventBus();

      bus.on('testEvent', vi.fn());
      bus.emit('testEvent', { data: 'test' });

      const history = bus.getEventHistory(0);

      expect(history).toEqual([]);
    });

    it('should handle limit larger than history size', () => {
      const bus = getEventBus();

      bus.on('testEvent', vi.fn());
      bus.emit('testEvent', { data: 'test' });

      const history = bus.getEventHistory(1000);

      expect(history.length).toBe(1);
    });
  });
});
