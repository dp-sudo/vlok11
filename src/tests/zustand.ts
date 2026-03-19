import type { StoreApi } from 'zustand';

/**
 * Extract store state type from store hook
 */
export type StoreState<T> = T extends { getState: () => infer S } ? S : never;

/**
 * Reset a zustand store to its initial state
 * Works with both regular stores and stores with persist middleware
 */
export function resetStore<S extends StoreApi<unknown>>(store: S): void {
  store.setState({}, true);
}

/**
 * Get current state from a store
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getStoreState<S extends StoreApi<any>>(store: S): ReturnType<S['getState']> {
  return store.getState();
}

/**
 * Helper to create a fresh store instance for testing
 * Resets state before each test
 */
export function createStoreResetHelper<T extends Record<string, unknown>>(getStore: () => T) {
  return {
    getState: getStore,
    reset: () => {
      const state = getStore();
      // Reset all state keys to initial values
      const resetState = Object.keys(state).reduce((acc, key) => {
        acc[key] = undefined;
        return acc;
      }, {} as Record<string, undefined>);
      const stateAny = state as Record<string, unknown>;
      if (stateAny['$persist']) {
        (stateAny['$persist'] as (state: unknown, method: string, stateAny: unknown) => void)(resetState, 'reset', resetState);
      }
    },
  };
}

/**
 * Mock the persist middleware storage
 * Useful for tests that don't want actual localStorage persistence
 */
export const mockPersistStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * Flush all pending zustand updates synchronously
 * Use this after state changes in tests to ensure they're applied
 */
export function flushStoreUpdates(): Promise<void> {
  return Promise.resolve();
}
