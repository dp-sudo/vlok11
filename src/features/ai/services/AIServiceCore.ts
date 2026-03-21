import { createLogger } from '@/core/Logger';
import { HASH_CALC } from './AIService.constants';

export { createLogger };

// Re-export constants
export {
  CACHE_DEFAULTS,
  HASH_CALC,
  PROGRESS,
} from './AIService.constants';
// Re-export types from types.ts
export type {
  AICacheConfig,
  AIProgressCallback,
  AIProvider,
  AIService,
  CacheEntry,
  CacheStats,
  DepthResult,
  ImageAnalysis,
} from './types';

// Utility function for hashing strings
export function hashString(str: string): string {
  let hash1 = 0;
  let hash2 = 0;
  const len = str.length;

  for (let i = 0; i < len; i++) {
    const char = str.charCodeAt(i);

    hash1 = ((hash1 << HASH_CALC.HASH1_SHIFT) - hash1 + char) | 0;
    hash2 = ((hash2 << HASH_CALC.HASH2_SHIFT) ^ char) | 0;
  }

  return `${(hash1 >>> 0).toString(HASH_CALC.HEX_RADIX)}_${(hash2 >>> 0).toString(HASH_CALC.HEX_RADIX)}_${len}`;
}
