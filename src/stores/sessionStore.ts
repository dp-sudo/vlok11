import { createUploadPipeline, type UploadPipeline } from '@/features/upload/pipeline';

import { isValidStatusTransition } from '@/core/domain/types';
import type { AIService } from '@/features/ai/services/AIService';
import type {
  Asset,
  ExportStateInfo,
  ProcessingResult,
  ProcessingStatus,
} from '@/shared/domain/types';
import type { StateCreator } from 'zustand';

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
  let aiService: AIService | null = null;

  const ensurePipeline = () => {
    if (!pipeline) {
      if (!aiService) {
        throw new Error('AI Service not initialized');
      }
      pipeline = createUploadPipeline({ aiService });
      
      pipeline.onProgress((p) => {
        if (p.stage === 'complete') return;
        let status: ProcessingStatus = 'analyzing';

        if (p.stage === 'depth') status = 'processing_depth';
        set({ status, progress: p.progress, statusMessage: p.message } as Partial<T>);
      });

      pipeline.onError((err) => {
        get().uploadError(err.message);
      });

      pipeline.onComplete((result) => {
        get().uploadComplete(result as unknown as ProcessingResult);
      });
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

      if (!isValidStatusTransition(currentStatus, 'uploading')) {
        get().uploadError(`Invalid status transition: cannot start upload from '${currentStatus}' status`);

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

        void p.process(input);
      } catch (error) {
        get().uploadError(error instanceof Error ? error.message : 'Unknown initialization error');
      }
    },

    uploadComplete: (result) => {
      const currentStatus = get().status;
      const nextStatus = 'ready' as const;

      if (!isValidStatusTransition(currentStatus, nextStatus)) {
        console.warn(`[SessionStore] Invalid status transition: ${currentStatus} -> ${nextStatus}`);
      }
      set({
        status: 'ready',
        progress: 100,
        result,
        currentAsset: result.asset,
      } as Partial<T>);
    },

    uploadError: (message) => {
      const currentStatus = get().status;
      const nextStatus = 'error' as const;

      if (!isValidStatusTransition(currentStatus, nextStatus)) {
        console.warn(`[SessionStore] Invalid status transition: ${currentStatus} -> ${nextStatus}`);
      }
      set({
        status: 'error',
        error: new Error(message),
        statusMessage: message,
      } as Partial<T>);
    },

    resetSession: () => {
      set({
        ...DEFAULT_SESSION,
        currentAsset: undefined,
        result: undefined,
        error: undefined,
        isServiceInitialized: !!aiService,
      } as Partial<T>);
      get().resetVideo();
      pipeline?.cancel();
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
