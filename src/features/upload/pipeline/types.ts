import type { AnalysisResult, ProcessedAsset } from '@/core/domain/types';

export type CompleteCallback = (result: ProcessedResult) => void;
export type ErrorCallback = (
  error: Error,
  stage: string,
  recoveryOptions: RecoveryOption[]
) => void;
export type ProcessedResult = ProcessedAsset;
export type ProgressCallback = (progress: PipelineProgress) => void;

export interface PipelineProgress {
  message: string;
  progress: number;
  stage: string;
  stageIndex: number;
  totalStages: number;
}
export interface PipelineStage {
  canSkip?(input: StageInput): boolean;
  execute(input: StageInput): Promise<StageOutput>;
  readonly name: string;
  readonly order: number;
}
export interface RecoveryOption {
  action: () => Promise<void>;
  label: string;
}
export interface RunContext {
  runId: string;
  signal: AbortSignal;
}
export interface StageInput {
  analysis?: AnalysisResult;
  backgroundUrl?: string;
  depthUrl?: string;
  file?: File;
  imageBase64?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  onProgress?: (stage: string, progress: number, message: string) => void;
  runId?: string;
  signal?: AbortSignal;
  url?: string;
  videoUrl?: string;
}
export interface StageOutput extends StageInput {
  error?: Error;
  success: boolean;
}
export interface UploadPipeline {
  cancel(): void;
  dispose(): void;
  getProgress(): PipelineProgress;
  onComplete(callback: CompleteCallback): () => void;
  onError(callback: ErrorCallback): () => void;
  onProgress(callback: ProgressCallback): () => void;
  process(input: File | string): Promise<ProcessedResult>;
}
