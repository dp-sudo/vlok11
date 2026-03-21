export function isRuntimeTestMode(): boolean {
  if (typeof import.meta !== 'undefined' && Boolean(import.meta.env?.['VITEST'])) {
    return true;
  }

  if (typeof process !== 'undefined' && process.env['NODE_ENV'] === 'test') {
    return true;
  }

  if (typeof window !== 'undefined' && window.__TEST_MODE__ === true) {
    return true;
  }

  return false;
}
