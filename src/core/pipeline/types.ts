import type { Disposable } from '@/shared/types';

export interface StageConfig {
  dependsOn?: string[];
  enabled?: boolean;
  id: string;
  options?: Record<string, unknown>;
  order: number;
  retryCount?: number;
  timeoutMs?: number;
  type: string;
}

export interface PipelineConfig {
  id: string;
  stages: StageConfig[];
  version: string;
}

export interface StageContext<T = unknown> {
  config: PipelineConfig;
  data: T;
  runId: string;
  signal: AbortSignal;
}

export interface PipelineStage<TInput = unknown, TOutput = unknown> {
  execute(input: TInput, context: StageContext<TInput>): Promise<TOutput>;
  name: string;
}

export interface PipelineEngine extends Disposable {
  execute<T>(input: T, config: PipelineConfig, signal?: AbortSignal): Promise<T>;
  registerStage(type: string, stage: PipelineStage): void;
}
