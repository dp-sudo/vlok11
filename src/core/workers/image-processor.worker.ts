import { IMAGE_PROCESSING } from '@/shared/constants/utils';
import {
  applyBoxBlur,
  applyDepthToImageData,
  computeDepthAndEdges,
  createLuminanceGetter,
  getLuminanceStats,
} from '@/shared/utils';

import type { WorkerResponse, WorkerTask } from './WorkerManager';

declare const self: Worker;

interface DepthPayload {
  blurAmount?: number;
  height: number;
  imageBitmap: ImageBitmap;
  width: number;
}

self.onmessage = async (e: MessageEvent<WorkerTask<DepthPayload>>) => {
  const { id, type, payload } = e.data;

  if (type !== 'process_depth') {
    return;
  }

  try {
    const result = await processDepth(payload);

    const response: WorkerResponse<Blob> = {
      id,
      success: true,
      payload: result,
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };

    self.postMessage(response);
  }
};

async function processDepth(payload: DepthPayload): Promise<Blob> {
  const { imageBitmap, width, height, blurAmount = 0 } = payload;

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Failed to create OffscreenCanvas context');

  ctx.drawImage(imageBitmap, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  const depthBuffer = new Float32Array(width * height);
  const edgeBuffer = new Float32Array(width * height);

  const getLum = createLuminanceGetter(data);
  const { minLum, maxLum } = getLuminanceStats(data, getLum);
  const lumRange = Math.max(1, maxLum - minLum);
  const contrastFactor = Math.min(
    IMAGE_PROCESSING.DEPTH_CONTRAST_MAX,
    IMAGE_PROCESSING.MAX_COLOR_VALUE / lumRange
  );

  computeDepthAndEdges({
    width,
    height,
    depthBuffer,
    edgeBuffer,
    getLum,
    minLum,
    lumRange,
    contrastFactor,
  });

  const fineBlur = applyBoxBlur(
    depthBuffer,
    width,
    height,
    IMAGE_PROCESSING.DEPTH_FINE_BLUR_RADIUS
  );
  const coarseBlur = applyBoxBlur(
    depthBuffer,
    width,
    height,
    IMAGE_PROCESSING.DEPTH_COARSE_BLUR_RADIUS
  );

  applyDepthToImageData({ data, depthBuffer, edgeBuffer, fineBlur, coarseBlur });

  ctx.putImageData(imageData, 0, 0);

  if (blurAmount > 0) {
    ctx.filter = `blur(${blurAmount}px)`;
    ctx.drawImage(canvas, 0, 0);
  }

  return canvas.convertToBlob({ type: 'image/jpeg', quality: IMAGE_PROCESSING.DEPTH_JPEG_QUALITY });
}
