import { getEventBus } from '@/core/EventBus';
import { PipelineEvents } from '@/core/EventTypes';
import { createLogger } from '@/core/Logger';
import type { PipelineEngine } from '@/core/pipeline/PipelineEngine';
import { getPipelineEngine } from '@/core/pipeline/PipelineEngine';
import type {
  PipelineStage as CorePipelineStage,
  PipelineConfig,
  StageContext,
} from '@/core/pipeline/types';
import type { AIService } from '@/features/ai/services/AIService';
import { AnalyzeStage, DepthStage, PrepareStage, ReadStage } from './stages';
import type {
  CompleteCallback,
  ErrorCallback,
  PipelineStage as LegacyPipelineStage,
  PipelineProgress,
  ProcessedResult,
  ProgressCallback,
  RecoveryOption,
  StageInput,
  StageOutput,
  UploadPipeline as UploadPipelineInterface,
} from './types';
import { ASSET_DEFAULTS, PROGRESS } from './UploadPipeline.constants';

export interface PipelineEventEmitter {
  emit(event: string, payload: Record<string, unknown>): void;
}

export interface PipelineOptions {
  aiService: AIService;
  eventEmitter?: PipelineEventEmitter;
}

class LegacyStageAdapter implements CorePipelineStage<StageInput, StageOutput> {
  constructor(private legacyStage: LegacyPipelineStage) {}

  async execute(input: StageInput, context: StageContext<StageInput>): Promise<StageOutput> {
    const inputWithContext = { ...input, signal: context.signal, runId: context.runId };

    if (this.legacyStage.canSkip?.(inputWithContext)) {
      return { ...inputWithContext, success: true };
    }

    return this.legacyStage.execute(inputWithContext);
  }

  get name(): string {
    return this.legacyStage.name;
  }
}

const buildAnalysisResult = (
  analysis: NonNullable<StageInput['analysis']>
): ProcessedResult['analysis'] => ({
  ...analysis,
  estimatedDepthScale: analysis.estimatedDepthScale ?? ASSET_DEFAULTS.DEPTH_SCALE_ESTIMATE,
  depthVariance: analysis.depthVariance ?? ASSET_DEFAULTS.DEPTH_VARIANCE,
  keywords: analysis.keywords ?? [],
});
const buildAsset = (
  stageInput: StageInput,
  imageUrl: string,
  isVideo: boolean
): ProcessedResult['asset'] => {
  const baseAsset = {
    id: crypto.randomUUID(),
    sourceUrl: imageUrl,
    width: (stageInput.metadata?.width as number) ?? ASSET_DEFAULTS.WIDTH,
    height: (stageInput.metadata?.height as number) ?? ASSET_DEFAULTS.HEIGHT,
    aspectRatio: (stageInput.metadata?.aspectRatio as number) ?? ASSET_DEFAULTS.ASPECT_RATIO,
    createdAt: Date.now(),
  };

  if (isVideo) {
    return {
      ...baseAsset,
      type: 'video' as const,
      duration: (stageInput.metadata?.duration as number) ?? ASSET_DEFAULTS.DURATION,
      thumbnailUrl: imageUrl,
      sourceUrl: stageInput.videoUrl ?? imageUrl,
    };
  }

  return { ...baseAsset, type: 'image' as const };
};
const createDefaultEmitter = (): PipelineEventEmitter => ({
  emit: (event, payload) => {
    try {
      getEventBus().emit(event, payload);
    } catch (error) {
      logger.warn('Failed to emit pipeline event', { event, error: String(error) });
    }
  },
});
const createStageInput = (input: File | string, signal: AbortSignal, runId: string): StageInput => {
  return input instanceof File ? { file: input, signal, runId } : { url: input, runId, signal };
};

export const createUploadPipeline = (options: PipelineOptions): UploadPipelineImpl =>
  new UploadPipelineImpl(options);
const logger = createLogger({ module: 'UploadPipeline' });

class UploadPipelineImpl implements UploadPipelineInterface {
  private abortController: AbortController | null = null;
  private blobUrls: string[] = []; // Track created blob URLs for cleanup
  private completeCallbacks = new Set<CompleteCallback>();
  private currentProgress: PipelineProgress = {
    stage: '',
    stageIndex: 0,
    totalStages: 0,
    progress: 0,
    message: '',
  };
  private currentRunId: string | null = null;
  private engine: PipelineEngine;
  private errorCallbacks = new Set<ErrorCallback>();
  private eventEmitter: PipelineEventEmitter;
  private legacyStages: LegacyPipelineStage[] = [];
  private progressCallbacks = new Set<ProgressCallback>();
  private startTime = 0;
  private unsubscriptions: (() => void)[] = [];

  constructor(options: PipelineOptions) {
    this.eventEmitter = options?.eventEmitter ?? createDefaultEmitter();
    const { aiService } = options;

    this.engine = getPipelineEngine();

    this.legacyStages = [
      new ReadStage(),
      new AnalyzeStage(aiService),
      new DepthStage(aiService),
      new PrepareStage(),
    ].sort((a, b) => a.order - b.order);

    this.legacyStages.forEach((stage) => {
      this.engine.registerStage(stage.name, new LegacyStageAdapter(stage));
    });

    this.unsubscriptions.push(
      getEventBus().on('pipeline:stage-started', (payload) => {
        const { stage, index, total } = payload as Record<string, unknown>;

        this.emitStageStart(String(stage), Number(index), Number(total));
      }),
      getEventBus().on('pipeline:stage-completed', (payload) => {
        const { stage } = payload as Record<string, unknown>;
        const index = this.legacyStages.findIndex((s) => s.name === String(stage));

        if (index !== -1) {
          this.emitStageComplete(String(stage), index, this.legacyStages.length);
        }
      })
    );
  }

  private buildResult(stageInput: StageInput): ProcessedResult {
    const processingTime = Date.now() - this.startTime;
    const imageUrl = stageInput.imageUrl ?? '';
    const depthUrl = stageInput.depthUrl ?? '';
    const { analysis } = stageInput;

    if (!imageUrl || !depthUrl || !analysis) {
      throw new Error('Pipeline incomplete: missing required output data');
    }
    const result: ProcessedResult = {
      asset: buildAsset(stageInput, imageUrl, !!stageInput.videoUrl),
      analysis: buildAnalysisResult(analysis),
      depthMapUrl: depthUrl,
      imageUrl,
      backgroundUrl: stageInput.backgroundUrl,
      processingTime,
    };

    this.updateProgress({
      stage: 'complete',
      stageIndex: this.legacyStages.length,
      totalStages: this.legacyStages.length,
      progress: PROGRESS.COMPLETE,
      message: 'Processing complete',
    });
    for (const callback of this.completeCallbacks) {
      callback(result);
    }
    this.eventEmitter.emit(PipelineEvents.COMPLETED, { result });

    return result;
  }

  cancel(): void {
    this.abortController?.abort();
  }

  dispose(): void {
    this.unsubscriptions.forEach((unsubscribe) => unsubscribe());
    this.unsubscriptions = [];
    this.completeCallbacks.clear();
    this.errorCallbacks.clear();
    this.progressCallbacks.clear();
    this.abortController?.abort();
    this.releaseBlobUrls();
  }

  private emitStageComplete(stageName: string, index: number, total: number): void {
    this.eventEmitter.emit(PipelineEvents.STAGE_COMPLETED, {
      stage: stageName,
      progress: Math.round(((index + 1) / total) * PROGRESS.COMPLETE),
    });
  }
  private emitStageStart(stageName: string, index: number, total: number): void {
    this.updateProgress({
      stage: stageName,
      stageIndex: index,
      totalStages: total,
      progress: Math.round((index / total) * PROGRESS.COMPLETE),
      message: `Processing ${stageName}...`,
    });
    this.eventEmitter.emit(PipelineEvents.STAGE_STARTED, {
      stage: stageName,
      progress: this.currentProgress.progress,
    });
  }
  private async executeStages(stageInput: StageInput): Promise<StageInput> {
    const config: PipelineConfig = {
      id: 'upload-pipeline-v1',
      version: '1.0.0',
      stages: this.legacyStages.map((s, i, arr) => ({
        id: s.name,
        type: s.name,
        order: i,
        enabled: true,
        dependsOn: i > 0 ? [arr[i - 1].name] : undefined,
      })),
    };

    try {
      this.abortController ??= new AbortController();

      const output = await this.engine.execute<StageInput>(
        stageInput,
        config,
        this.abortController.signal
      );

      const finalOutput = output as StageOutput;

      if (!finalOutput.success && finalOutput.error) {
        throw finalOutput.error;
      }

      return finalOutput;
    } catch (error) {
      const stageName = 'pipeline';

      this.handleStageError(
        stageName,
        error instanceof Error ? error : new Error(String(error)),
        stageInput
      );
    }
  }

  getProgress(): PipelineProgress {
    return { ...this.currentProgress };
  }
  private getRecoveryOptions(stageName: string, stageInput?: StageInput): RecoveryOption[] {
    const options: RecoveryOption[] = [];

    options.push({
      label: 'Retry Stage',
      action: async () => {
        if (!stageInput) return;
        logger.info(`Retrying stage: ${stageName}`);

        if (stageInput.file) {
          await this.process(stageInput.file);
        } else if (stageInput.url) {
          await this.process(stageInput.url);
        }
      },
    });
    if (stageName === 'read') {
      options.push({
        label: 'Select Different File',
        action: async () => {
          getEventBus().emit('ui:open-upload', {});
        },
      });
    }

    return options;
  }
  private handleStageError(
    stageName: string,
    error: Error | undefined,
    stageInput: StageInput
  ): never {
    const err = error ?? new Error(`Stage ${stageName} failed`);
    const recoveryOptions = this.getRecoveryOptions(stageName, stageInput);

    for (const callback of this.errorCallbacks) {
      callback(err, stageName, recoveryOptions);
    }
    this.eventEmitter.emit(PipelineEvents.ERROR, {
      stage: stageName,
      error: err.message,
    });
    throw err;
  }
  onComplete(callback: CompleteCallback): () => void {
    this.completeCallbacks.add(callback);

    return () => this.completeCallbacks.delete(callback);
  }
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);

    return () => this.errorCallbacks.delete(callback);
  }
  onProgress(callback: ProgressCallback): () => void {
    this.progressCallbacks.add(callback);

    return () => this.progressCallbacks.delete(callback);
  }
  async process(input: File | string): Promise<ProcessedResult> {
    // Clean up any existing blob URLs from previous runs
    this.releaseBlobUrls();
    this.startTime = Date.now();
    this.abortController = new AbortController();
    this.currentRunId = crypto.randomUUID();
    const inputType = input instanceof File ? 'file' : 'url';

    this.eventEmitter.emit(PipelineEvents.STARTED, { inputType });
    let stageInput = createStageInput(input, this.abortController.signal, this.currentRunId);

    stageInput = await this.executeStages(stageInput);

    // Track blob URLs created during processing for cleanup
    this.trackBlobUrlsFromStageInput(stageInput);

    return this.buildResult(stageInput);
  }

  private trackBlobUrlsFromStageInput(stageInput: StageInput): void {
    // Track blob URLs for later cleanup

    const urlsToTrack = [stageInput.imageUrl, stageInput.videoUrl, stageInput.backgroundUrl].filter(
      (url): url is string => typeof url === 'string' && url.startsWith('blob:')
    );

    this.blobUrls.push(...urlsToTrack);
  }

  private releaseBlobUrls(): void {
    for (const url of this.blobUrls) {
      try {
        URL.revokeObjectURL(url);
        logger.debug('Revoked blob URL', { url });
      } catch (error) {
        logger.warn('Failed to revoke blob URL', { url, error: String(error) });
      }
    }
    this.blobUrls = [];
  }

  private updateProgress(progress: PipelineProgress): void {
    this.currentProgress = progress;
    for (const callback of this.progressCallbacks) {
      callback(progress);
    }
  }
}

export { UploadPipelineImpl as UploadPipeline };
