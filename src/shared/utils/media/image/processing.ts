import { EASING, IMAGE_PROCESSING } from '@/shared/constants/utils';

import { constrainImageDimensions, safeLoadImage } from './loading';

export async function generateBlurredBackground(imageUrl: string): Promise<string> {
  const img = await safeLoadImage(imageUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Context error');

  canvas.width = IMAGE_PROCESSING.BLUR_CANVAS_SIZE;
  canvas.height = IMAGE_PROCESSING.BLUR_CANVAS_SIZE;
  ctx.filter = `blur(${IMAGE_PROCESSING.BLUR_AMOUNT}px)`;
  ctx.drawImage(
    img,
    IMAGE_PROCESSING.BLUR_OFFSET,
    IMAGE_PROCESSING.BLUR_OFFSET,
    IMAGE_PROCESSING.BLUR_DRAW_SIZE,
    IMAGE_PROCESSING.BLUR_DRAW_SIZE
  );
  ctx.fillStyle = `rgba(0,0,0,${IMAGE_PROCESSING.BLUR_OVERLAY_ALPHA})`;
  ctx.fillRect(0, 0, IMAGE_PROCESSING.BLUR_CANVAS_SIZE, IMAGE_PROCESSING.BLUR_CANVAS_SIZE);

  return canvas.toDataURL('image/jpeg', IMAGE_PROCESSING.BLUR_JPEG_QUALITY);
}

export async function generatePseudoDepthMap(
  imageUrl: string,
  blurAmount = IMAGE_PROCESSING.RGBA_CHANNELS
): Promise<string> {
  const img = await safeLoadImage(imageUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  const { width, height } = constrainImageDimensions(
    img.width,
    img.height,
    IMAGE_PROCESSING.DEPTH_MAX_SIZE
  );

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

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
    ctx.drawImage(canvas, 0, 0, width, height);
  }

  return canvas.toDataURL('image/jpeg', IMAGE_PROCESSING.DEPTH_JPEG_QUALITY);
}

export async function resizeImage(
  imageUrl: string,
  maxDimension = IMAGE_PROCESSING.RESIZE_DEFAULT_MAX
): Promise<string> {
  const img = await safeLoadImage(imageUrl);
  const canvas = document.createElement('canvas');
  let { width } = img;
  let { height } = img;

  if (width > height) {
    if (width > maxDimension) {
      height *= maxDimension / width;
      width = maxDimension;
    }
  } else if (height > maxDimension) {
    width *= maxDimension / height;
    height = maxDimension;
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', IMAGE_PROCESSING.RESIZE_JPEG_QUALITY);
}

export interface ApplyDepthParams {
  coarseBlur: Float32Array;
  data: Uint8ClampedArray;
  depthBuffer: Float32Array;
  edgeBuffer: Float32Array;
  fineBlur: Float32Array;
}

export interface DepthProcessingParams {
  contrastFactor: number;
  depthBuffer: Float32Array;
  edgeBuffer: Float32Array;
  getLum: (idx: number) => number;
  height: number;
  lumRange: number;
  minLum: number;
  width: number;
}

export function applyBoxBlur(
  buffer: Float32Array,
  w: number,
  h: number,
  radius: number
): Float32Array {
  const result = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const sy = Math.max(0, Math.min(h - 1, y + ky));
          const sx = Math.max(0, Math.min(w - 1, x + kx));

          sum += buffer[sy * w + sx] ?? 0;
          count++;
        }
      }

      result[y * w + x] = sum / count;
    }
  }

  return result;
}

export function applyDepthToImageData(params: ApplyDepthParams): void {
  const { data, depthBuffer, edgeBuffer, fineBlur, coarseBlur } = params;
  const maxColorValue = IMAGE_PROCESSING.MAX_COLOR_VALUE;

  for (let i = 0; i < depthBuffer.length; i++) {
    const edge = (edgeBuffer[i] ?? 0) / maxColorValue;
    const blended = (fineBlur[i] ?? 0) * edge + (coarseBlur[i] ?? 0) * (1 - edge);
    const depth = Math.min(maxColorValue, Math.max(0, blended));
    const pixelIdx = i * IMAGE_PROCESSING.RGBA_CHANNELS;

    data[pixelIdx] = depth;
    data[pixelIdx + 1] = depth;
    data[pixelIdx + 2] = depth;
  }
}

export function computeDepthAndEdges(params: DepthProcessingParams): void {
  const { width, height, depthBuffer, edgeBuffer, getLum, minLum, lumRange, contrastFactor } =
    params;
  const maxColorValue = IMAGE_PROCESSING.MAX_COLOR_VALUE;
  const sobelX = [-1, 0, 1, -EASING.QUAD_MULTIPLIER, 0, EASING.QUAD_MULTIPLIER, -1, 0, 1];
  const sobelY = [-1, -EASING.QUAD_MULTIPLIER, -1, 0, 0, 0, 1, EASING.QUAD_MULTIPLIER, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const pixelIdx = idx * IMAGE_PROCESSING.RGBA_CHANNELS;
      const rawLum = getLum(pixelIdx);
      const normalizedLum = ((rawLum - minLum) / lumRange) * maxColorValue;
      const boostedLum = Math.min(maxColorValue, normalizedLum * Math.sqrt(contrastFactor));
      const yNorm = y / height;
      const gradient = Math.pow(yNorm, IMAGE_PROCESSING.DEPTH_GRADIENT_POWER) * maxColorValue;
      let gx = 0;
      let gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const sampleIdx = ((y + ky) * width + (x + kx)) * IMAGE_PROCESSING.RGBA_CHANNELS;
          const sampleLum = getLum(sampleIdx);
          const kernelIdx = (ky + 1) * IMAGE_PROCESSING.SOBEL_KERNEL_SIZE + (kx + 1);

          gx += sampleLum * (sobelX[kernelIdx] ?? 0);
          gy += sampleLum * (sobelY[kernelIdx] ?? 0);
        }
      }

      const edgeMagnitude = Math.sqrt(gx * gx + gy * gy);

      edgeBuffer[idx] = Math.min(maxColorValue, edgeMagnitude);

      const edgeWeight = Math.min(1, edgeMagnitude / IMAGE_PROCESSING.DEPTH_EDGE_THRESHOLD);
      const lumWeight =
        IMAGE_PROCESSING.DEPTH_LUM_WEIGHT_BASE +
        IMAGE_PROCESSING.DEPTH_LUM_WEIGHT_RANGE * edgeWeight;
      const gradWeight =
        IMAGE_PROCESSING.DEPTH_LUM_WEIGHT_BASE -
        IMAGE_PROCESSING.DEPTH_LUM_WEIGHT_RANGE * edgeWeight;

      depthBuffer[idx] = boostedLum * lumWeight + gradient * gradWeight;
    }
  }
}

export function createLuminanceGetter(data: Uint8ClampedArray): (idx: number) => number {
  return (idx: number) => {
    if (idx < 0 || idx >= data.length) return 0;

    return (
      IMAGE_PROCESSING.LUMINANCE_R * (data[idx] ?? 0) +
      IMAGE_PROCESSING.LUMINANCE_G * (data[idx + 1] ?? 0) +
      IMAGE_PROCESSING.LUMINANCE_B * (data[idx + 2] ?? 0)
    );
  };
}

export function getLuminanceStats(
  data: Uint8ClampedArray,
  getLum: (idx: number) => number
): { maxLum: number; minLum: number } {
  const maxColorValue = IMAGE_PROCESSING.MAX_COLOR_VALUE;
  let minLum: number = maxColorValue;
  let maxLum = 0;

  for (let i = 0; i < data.length; i += IMAGE_PROCESSING.RGBA_CHANNELS) {
    const lum = getLum(i);

    minLum = Math.min(minLum, lum);
    maxLum = Math.max(maxLum, lum);
  }

  return { minLum, maxLum };
}
