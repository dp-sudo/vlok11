import { createStore } from 'zustand';

import { createUploadPipeline } from '@/features/upload/pipeline';

import type {
  ExportStateInfo,
  ProcessingResult,
  ProcessingStatus,
  SessionState,
} from '@/shared/domain/types';
import type { AIService } from '@/features/ai/services/AIService';
import type { PipelineProgress, UploadPipeline } from '@/features/upload/pipeline/types';

interface SessionActions {
  finishExport: () => void;
  initAiService: (aiService: AIService) => void;
  resetSession: () => void;
  startExport: (format: ExportStateInfo['format']) => void;
  updateExportProgress: (progress: number) => void;
  updateProgress: (status: ProcessingStatus, progress: number, message?: string) => void;
  uploadComplete: (result: ProcessingResult) => void;
  uploadError: (message: string) => void;
  uploadStart: (input: File | string) => void;
}

export type SessionStore = SessionState & SessionActions;

let sessionServiceInstance: SessionService | null = null;

export class SessionService {
  private pipeline: UploadPipeline | null = null;
  private aiService: AIService | null = null;
  private pipelineReady = false;

  public store;

  constructor() {
    this.store = createStore<SessionStore>((set) => ({
      id: crypto.randomUUID(),
      status: 'idle',
      progress: 0,
      exportState: {
        isExporting: false,
        progress: 0,
        format: null,
      },

      initAiService: (aiService) => {
        this.aiService = aiService;
        this.createPipeline();
      },

      uploadStart: (input) => {
        if (!this.pipelineReady || !this.pipeline) {
          set({
            status: 'error',
            error: new Error('AI service not initialized'),
            statusMessage: 'System not ready. Please refresh and try again.',
          });

          return;
        }

        set({
          status: 'uploading',
          progress: 0,
          statusMessage: 'Starting upload...',
          error: undefined,
        });

        void this.processInput(input);
      },

      updateProgress: (status, progress, message) => {
        set({ status, progress, statusMessage: message });
      },

      uploadComplete: (result) => {
        set({
          status: 'ready',
          progress: 100,
          result,
          currentAsset: result.asset,
        });
      },

      uploadError: (message) => {
        set({
          status: 'error',
          error: new Error(message),
          statusMessage: message,
        });
      },

      resetSession: () => {
        set({
          status: 'idle',
          progress: 0,
          currentAsset: undefined,
          result: undefined,
          error: undefined,
          exportState: { isExporting: false, progress: 0, format: null },
        });
        this.pipeline?.cancel();
      },

      startExport: (format) => {
        set({ exportState: { isExporting: true, progress: 0, format } });
      },

      updateExportProgress: (progress) => {
        set((s) => ({ exportState: { ...s.exportState, progress } }));
      },

      finishExport: () => {
        set({ exportState: { isExporting: false, progress: 100, format: null } });
      },
    }));
  }

  private createPipeline(): void {
    if (!this.aiService) {
      console.error('[SessionService] Cannot create pipeline without AIService');

      return;
    }

    this.pipeline = createUploadPipeline({ aiService: this.aiService });
    this.pipelineReady = true;
  }

  static getInstance(): SessionService {
    sessionServiceInstance ??= new SessionService();

    return sessionServiceInstance;
  }

  static resetInstance(): void {
    if (sessionServiceInstance?.pipeline) {
      sessionServiceInstance.pipeline.dispose();
    }
    sessionServiceInstance = null;
  }

  private async processInput(input: File | string) {
    if (!this.pipeline) {
      this.store.getState().uploadError('Pipeline not initialized');

      return;
    }

    const { getState } = this.store;

    const unsubProgress = this.pipeline.onProgress((p: PipelineProgress) => {
      if (p.stage === 'complete') return;
      let status: ProcessingStatus = 'analyzing';

      if (p.stage === 'depth') status = 'processing_depth';

      getState().updateProgress(status, p.progress, p.message);
    });

    const unsubError = this.pipeline.onError((err: Error) => {
      getState().uploadError(err.message);
    });

    const unsubComplete = this.pipeline.onComplete((result) => {
      getState().uploadComplete(result as unknown as ProcessingResult);
    });

    try {
      await this.pipeline.process(input);
    } catch (error) {
      getState().uploadError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      unsubProgress();
      unsubError();
      unsubComplete();
    }
  }
}

export function getSessionService(): SessionService {
  return SessionService.getInstance();
}
