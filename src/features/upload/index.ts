import { createUploadPipeline } from './pipeline';

import type { ProcessedResult } from './pipeline';

export async function processPipeline(
  input: File | string,
  onProgress?: ProcessCallback
): Promise<ProcessedResult & { videoUrl?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipeline = createUploadPipeline({ aiService: {} as any });

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
    videoUrl,
  };
}

export type ProcessCallback = (stage: string, progress: number, message?: string) => void;

export * from './pipeline';
export { StatusDisplay } from './StatusDisplay';
export { UploadPanel } from './UploadPanel';
