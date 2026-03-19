import type { StateCreator } from 'zustand';

import { isValidStatusTransition } from '@/core/domain/types';
import type { AIService } from '@/features/ai/services/AIService';
import { createUploadPipeline, type UploadPipeline } from '@/features/upload/pipeline';
import type {
  Asset,
  ExportStateInfo,
  ProcessingResult,
  ProcessingStatus,
} from '@/shared/domain/types';

/**
 * 类型守卫函数：验证是否为有效的 ProcessingResult
 */
function isProcessingResult(obj: unknown): obj is ProcessingResult {
  if (!obj || typeof obj !== 'object') return false;

  const result = obj as Record<string, unknown>;

  // 使用 in 操作符更安全地检查属性存在性，使用括号符号访问索引签名属性
  const hasDepthMapUrl = 'depthMapUrl' in result && typeof result['depthMapUrl'] === 'string';
  const hasImageUrl = 'imageUrl' in result && typeof result['imageUrl'] === 'string';
  const hasAsset = 'asset' in result && result['asset'] !== undefined;

  if (!hasAsset) return false;

  const asset = result['asset'] as Record<string, unknown>;
  const hasAssetId = 'id' in asset && typeof asset['id'] === 'string';

  return hasDepthMapUrl && hasImageUrl && hasAssetId;
}

export interface SessionState {
  currentAsset?: Asset;
  error?: Error;
  exportState: ExportStateInfo;
  isServiceInitialized: boolean;
  progress: number;
  result?: ProcessingResult;
  status: ProcessingStatus | 'idle' | 'ready';
  statusMessage?: string;
}

export interface SessionActions {
  finishExport: () => void;
  initServices: (aiService: AIService) => void;
  resetSession: () => void;
  startExport: (format: ExportStateInfo['format']) => void;
  updateExportProgress: (progress: number) => void;
  uploadComplete: (result: ProcessingResult) => void;
  uploadError: (message: string) => void;
  uploadStart: (input: File | string) => void;
}

export type SessionSlice = SessionState & SessionActions;

export const DEFAULT_SESSION: SessionState = {
  status: 'idle',
  progress: 0,
  exportState: {
    isExporting: false,
    progress: 0,
    format: null,
  },
  isServiceInitialized: false,
};

export const createSessionSlice = <T extends SessionSlice & { resetVideo: () => void }>(
  set: Parameters<StateCreator<T>>[0],
  get: Parameters<StateCreator<T>>[1],
  _api: Parameters<StateCreator<T>>[2]
): SessionSlice => {
  let pipeline: UploadPipeline | null = null;
  let pipelineCallbacksCleaned = false;
  let aiService: AIService | null = null;

  const ensurePipeline = () => {
    if (!pipeline) {
      if (!aiService) {
        throw new Error('AI Service not initialized');
      }
      pipeline = createUploadPipeline({ aiService });

      pipeline.onProgress((p) => {
        // S1 - 检查回调是否已清理
        if (pipelineCallbacksCleaned) return;
        if (p.stage === 'complete') return;

        // S3 - 竞态条件：检查当前状态
        const currentStatus = get().status;
        if (currentStatus !== 'uploading') return;

        let status: ProcessingStatus = 'analyzing';

        if (p.stage === 'depth') status = 'processing_depth';
        set({ status, progress: p.progress, statusMessage: p.message } as Partial<T>);
      });

      pipeline.onError((err) => {
        // S1 - 检查回调是否已清理
        if (pipelineCallbacksCleaned) return;
        // S3 - 竞态条件：检查当前状态
        const currentStatus = get().status;
        if (currentStatus !== 'uploading') return;
        get().uploadError(err.message);
      });

      pipeline.onComplete((result) => {
        // S1 - 检查回调是否已清理
        if (pipelineCallbacksCleaned) return;
        // S3 - 竞态条件：检查当前状态
        const currentStatus = get().status;
        if (currentStatus !== 'uploading') return;

        if (isProcessingResult(result)) {
          get().uploadComplete(result);
        } else {
          get().uploadError('Invalid processing result received from pipeline');
        }
      });

      pipelineCallbacksCleaned = false;
    }

    return pipeline;
  };

  return {
    ...DEFAULT_SESSION,

    initServices: (service: AIService) => {
      aiService = service;
      set({ isServiceInitialized: true } as Partial<T>);
    },

    uploadStart: (input) => {
      const currentStatus = get().status;

      // S6 - 缺少并发上传保护
      if (get().status === 'uploading') return;

      if (!isValidStatusTransition(currentStatus, 'uploading')) {
        get().uploadError(
          `Invalid status transition: cannot start upload from '${currentStatus}' status`
        );

        return;
      }

      set({
        status: 'uploading',
        progress: 0,
        statusMessage: 'Starting upload...',
        error: undefined,
      } as Partial<T>);

      try {
        const p = ensurePipeline();

        p.process(input).catch((error) => {
          // Rejection now caught and delegated cleanly to error handler
          get().uploadError(
            error instanceof Error ? error.message : 'Pipeline aborted or threw unexpectedly'
          );
        });
      } catch (error) {
        get().uploadError(error instanceof Error ? error.message : 'Unknown initialization error');
      }
    },

    uploadComplete: (result) => {
      set({
        status: 'ready',
        progress: 100,
        result,
        currentAsset: result.asset,
      } as Partial<T>);
    },

    uploadError: (message) => {
      set({
        status: 'error',
        error: new Error(message),
        statusMessage: message,
      } as Partial<T>);
    },

    resetSession: () => {
      // S1 - 清理 pipeline 回调以防止内存泄漏
      if (pipeline) {
        // 标记回调已清理，防止 resetSession 完成后旧回调仍执行
        pipelineCallbacksCleaned = true;
        pipeline.cancel();
        pipeline.dispose();
        pipeline = null;
      }
      set({
        ...DEFAULT_SESSION,
        currentAsset: undefined,
        result: undefined,
        error: undefined,
        isServiceInitialized: !!aiService,
      } as Partial<T>);
      get().resetVideo();
    },

    startExport: (format) => {
      set({ exportState: { isExporting: true, progress: 0, format } } as Partial<T>);
    },

    updateExportProgress: (progress) => {
      set((s) => ({ exportState: { ...s.exportState, progress } }) as Partial<T>);
    },

    finishExport: () => {
      set({ exportState: { isExporting: false, progress: 100, format: null } } as Partial<T>);
    },
  };
};
