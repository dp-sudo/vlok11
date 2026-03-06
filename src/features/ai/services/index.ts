export { AIService } from './AIService';
export { AIServiceCache } from './AIServiceCache';
export { AIServiceProviderManager } from './AIServiceProvider';
export { hashString, createLogger, CACHE_DEFAULTS, HASH_CALC, PROGRESS } from './AIServiceCore';
export type { LazyProvider } from './AIServiceProvider';

export type {
  AICacheConfig,
  AIProgressCallback,
  AIProvider,
  AIService as AIServiceType,
  CacheEntry,
  CacheStats,
  DepthResult,
  ImageAnalysis,
} from './types';

export {
  LightSceneAnalyzer,
  lightSceneAnalyzer,
} from './LightSceneAnalyzer';

export type {
  MotionPath,
  MotionWaypoint,
} from './SmartMotionEngine';

export {
  SmartMotionEngine,
  smartMotionEngine,
} from './SmartMotionEngine';

export type {
  MotionStyle,
  SceneMood,
  SimpleInsight,
  SimpleSceneType,
} from './LightSceneAnalyzer';
