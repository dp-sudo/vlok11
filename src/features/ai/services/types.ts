import type { AnalysisResult } from '@/core/domain/types';

export type AIProgressCallback = (progress: number, stage: string) => void;
export type ImageAnalysis = AnalysisResult;

export interface AICacheConfig {
  enabled: boolean;
  maxSize: number;
  ttlMs: number;
}
export interface AIProvider {
  analyzeScene?(base64Image: string): Promise<ImageAnalysis>;
  dispose(): Promise<void>;
  editImage?(base64Image: string, prompt: string): Promise<string>;
  estimateDepth?(imageUrl: string): Promise<DepthResult>;
  initialize(): Promise<void>;
  readonly isAvailable: boolean;
  readonly providerId: string;
}
export interface AIService {
  analyzeScene(base64Image: string): Promise<ImageAnalysis>;
  editImage(base64Image: string, prompt: string): Promise<string>;
  estimateDepth(imageUrl: string): Promise<DepthResult>;
  getActiveProvider(): string;
  isAvailable(): boolean;
  onProgress(callback: AIProgressCallback): () => void;
}
export interface CacheEntry<T> {
  hash: string;
  timestamp: number;
  value: T;
}
export interface DepthResult {
  confidence?: number;
  depthUrl: string;
  method: 'ai' | 'canvas' | 'worker' | 'canvas-fallback';
}
