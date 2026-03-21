import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock AbortController and AbortSignal
class MockAbortSignal {
  _aborted = false;
  get aborted() {
    return this._aborted;
  }
  onabort: null | ((...args: unknown[]) => void) = null;
  dispatchEvent = () => true;
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  throwIfAborted = vi.fn();
}

class MockAbortController {
  signal = new MockAbortSignal();
  abort() {
    this.signal._aborted = true;
  }
}

Object.defineProperty(global, 'AbortController', {
  value: MockAbortController,
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'AbortSignal', {
  value: MockAbortSignal,
  writable: true,
  configurable: true,
});
