import { IMAGE_ANALYSIS } from '@/shared/constants/image';

import { toAbsoluteUrl } from './loading';

export function analyzeImage(imageData: ImageData): ImageAnalysisResult {
  const brightness = calculateImageBrightness(imageData);
  const contrast = calculateImageContrast(imageData);
  const dominantColor = extractDominantColor(imageData);

  return {
    brightness,
    contrast,
    dominantColor,
    isLowContrast: contrast < IMAGE_ANALYSIS.LOW_CONTRAST_THRESHOLD,
    isDark: brightness < IMAGE_ANALYSIS.DARK_THRESHOLD,
  };
}
export function calculateImageBrightness(imageData: ImageData): number {
  const { data } = imageData;
  let totalBrightness = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += IMAGE_ANALYSIS.SAMPLE_STEP) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;

    totalBrightness +=
      IMAGE_ANALYSIS.RGB_WEIGHT_R * r +
      IMAGE_ANALYSIS.RGB_WEIGHT_G * g +
      IMAGE_ANALYSIS.RGB_WEIGHT_B * b;
    count++;
  }

  return totalBrightness / count / IMAGE_ANALYSIS.MAX_COLOR_VALUE;
}
export function calculateImageContrast(imageData: ImageData): number {
  const { data } = imageData;
  const luminances: number[] = [];

  for (let i = 0; i < data.length; i += IMAGE_ANALYSIS.CONTRAST_SAMPLE_STEP) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const lum =
      IMAGE_ANALYSIS.RGB_WEIGHT_R * r +
      IMAGE_ANALYSIS.RGB_WEIGHT_G * g +
      IMAGE_ANALYSIS.RGB_WEIGHT_B * b;

    luminances.push(lum);
  }

  const mean = luminances.reduce((a, b) => a + b, 0) / luminances.length;
  const variance = luminances.reduce((sum, l) => sum + (l - mean) ** 2, 0) / luminances.length;

  return Math.sqrt(variance) / IMAGE_ANALYSIS.CONTRAST_DIVISOR;
}
export function extractDominantColor(imageData: ImageData): ColorInfo {
  const { data } = imageData;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += IMAGE_ANALYSIS.CONTRAST_SAMPLE_STEP) {
    totalR += data[i] ?? 0;
    totalG += data[i + 1] ?? 0;
    totalB += data[i + 2] ?? 0;
    count++;
  }

  const r = Math.round(totalR / count);
  const g = Math.round(totalG / count);
  const b = Math.round(totalB / count);

  const hex = `#${r.toString(IMAGE_ANALYSIS.HEX_BASE).padStart(IMAGE_ANALYSIS.HEX_PAD_LENGTH, '0')}${g.toString(IMAGE_ANALYSIS.HEX_BASE).padStart(IMAGE_ANALYSIS.HEX_PAD_LENGTH, '0')}${b.toString(IMAGE_ANALYSIS.HEX_BASE).padStart(IMAGE_ANALYSIS.HEX_PAD_LENGTH, '0')}`;

  return { r, g, b, hex };
}
export function findVideoUrlInHtml(normalizedHtml: string, pageUrl: string): string | null {
  const strictUrlRegex =
    /(?:["']?(?:url|vurl|link|main|video|now)["']?)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i;
  const strictMatch = strictUrlRegex.exec(normalizedHtml);

  if (strictMatch?.[1]) {
    return toAbsoluteUrl(strictMatch[1], pageUrl);
  }

  const videoFileRegex = /((?:https?:)?\/\/[^"'\s<>]+\.(?:m3u8|mp4)(?:\?[^"'\s<>]*)?)/gi;
  const fileMatches = normalizedHtml.match(videoFileRegex);

  if (fileMatches && fileMatches.length > 0) {
    const m3u8 = fileMatches.find((m) => m.toLowerCase().includes('.m3u8'));

    if (m3u8) return toAbsoluteUrl(m3u8, pageUrl);

    return toAbsoluteUrl(fileMatches[0], pageUrl);
  }

  const jsonUrlRegex = /["']?url["']?\s*[:=]\s*["']([^"']+)["']/i;
  const jsonMatch = jsonUrlRegex.exec(normalizedHtml);

  if (jsonMatch?.[1]) {
    const u = jsonMatch[1];

    if (u.includes('.m3u8') || u.includes('.mp4')) {
      return toAbsoluteUrl(u, pageUrl);
    }
  }

  const varRegex = /var\s+(?:url|main|video|now)\s*=\s*["']([^"']+)["']/i;
  const varMatch = varRegex.exec(normalizedHtml);

  if (varMatch?.[1]) {
    const u = varMatch[1];

    if (u.includes('.m3u8') || u.includes('.mp4')) {
      return toAbsoluteUrl(u, pageUrl);
    }
  }

  return null;
}

export interface ColorInfo {
  b: number;
  g: number;
  hex: string;
  r: number;
}
export interface ImageAnalysisResult {
  brightness: number;
  contrast: number;
  dominantColor: ColorInfo;
  isDark: boolean;
  isLowContrast: boolean;
}
