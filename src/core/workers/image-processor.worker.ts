/**
 * Image Processor Worker
 * Handles CPU-intensive image processing tasks off the main thread
 */

import type { WorkerResponse, WorkerTask } from './WorkerManager';

interface DepthPayload {
  imageBitmap: ImageBitmap;
  width: number;
  height: number;
  blurAmount: number;
}

self.onmessage = async (event: MessageEvent<WorkerTask<DepthPayload>>) => {
  const { id, type, payload } = event.data;

  if (type !== 'process_depth') {
    const response: WorkerResponse = {
      id,
      success: false,
      error: `Unknown task type: ${type}`,
    };

    self.postMessage(response);

    return;
  }

  try {
    const { imageBitmap, width, height, blurAmount } = payload;

    // Use OffscreenCanvas for better performance
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get OffscreenCanvas context');
    }

    // Draw the image
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixelData = imageData.data;

    // Simple depth estimation based on luminance
    // Brighter pixels = closer (higher depth value)
    const depthCanvas = new OffscreenCanvas(width, height);
    const depthCtx = depthCanvas.getContext('2d');

    if (!depthCtx) {
      throw new Error('Failed to get depth canvas context');
    }

    const depthImageData = depthCtx.createImageData(width, height);
    const depthPixelData = depthImageData.data;

    for (let i = 0; i < pixelData.length; i += 4) {
      // Calculate luminance
      const r = pixelData[i] ?? 0;
      const g = pixelData[i + 1] ?? 0;
      const b = pixelData[i + 2] ?? 0;
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Write depth as grayscale
      depthPixelData[i] = luminance;
      depthPixelData[i + 1] = luminance;
      depthPixelData[i + 2] = luminance;
      depthPixelData[i + 3] = 255;
    }

    depthCtx.putImageData(depthImageData, 0, 0);

    // Apply blur if specified
    if (blurAmount > 0) {
      // Simple box blur using canvas filter
      const tempCanvas = new OffscreenCanvas(width, height);
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        tempCtx.filter = `blur(${blurAmount}px)`;
        tempCtx.drawImage(depthCanvas, 0, 0);
        depthCanvas.width = tempCanvas.width;
        depthCanvas.height = tempCanvas.height;
        depthCtx.drawImage(tempCanvas, 0, 0);
      }
    }

    // Convert to blob
    const blob = await depthCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });

    const response: WorkerResponse = {
      id,
      success: true,
      payload: blob,
    };

    self.postMessage(response, { transfer: [blob] });
  } catch (error) {
    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };

    self.postMessage(response);
  }
};
