// Global type declarations for window extensions

declare global {
  interface Window {
    __TEST_MODE__?: boolean;
  }
}

// Make this file a module to enable global augmentation
export {};
