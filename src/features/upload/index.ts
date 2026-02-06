import type { AIService } from '@/features/ai/services/AIService';

import type { ProcessedResult } from './pipeline';
import { createUploadPipeline } from './pipeline';

export interface ProcessPipelineOptions {
  aiService: AIService;
  input: File | string;
  onProgress?: ProcessCallback;
}

export async function processPipeline(
  options: ProcessPipelineOptions
): Promise<ProcessedResult & { videoUrl?: string }> {
  const { aiService, input, onProgress } = options;

  const pipeline = createUploadPipeline({ aiService });

  if (onProgress) {
    pipeline.onProgress((p) => {
      onProgress(p.stage, p.progress, p.message);
    });
  }

  const result = await pipeline.process(input);

  const isVideo =
    input instanceof File ? input.type.startsWith('video/') : /\.(mp4|webm|mov|m3u8)$/i.test(input);

  let videoUrl: string | undefined;

  if (isVideo) {
    videoUrl = input instanceof File ? URL.createObjectURL(input) : input;
  }

  return {
    ...result,
    ...(videoUrl ? { videoUrl } : {}),
  };
}

export type ProcessCallback = (stage: string, progress: number, message?: string) => void;

export * from './pipeline';
export { StatusDisplay } from './StatusDisplay';
export { UploadPanel } from './UploadPanel';

