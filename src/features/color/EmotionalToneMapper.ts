/**
 * Emotional Tone Mapper
 * 情感色调映射器
 */

export type EmotionalTone = 'warm' | 'cool' | 'vintage' | 'dramatic' | 'ethereal' | 'natural';

export interface ToneConfig {
  tone: EmotionalTone;
  intensity: number; // 0-1
}

interface ToneSettings {
  saturation: number;
  contrast: number;
  tint: { r: number; g: number; b: number };
  vignette?: number;
}

// 色调配置
const TONE_CONFIGS: Record<EmotionalTone, ToneSettings> = {
  warm: {
    saturation: 1.2,
    contrast: 1.1,
    tint: { r: 15, g: 8, b: -8 },
  },
  cool: {
    saturation: 0.9,
    contrast: 1.05,
    tint: { r: -8, g: 0, b: 15 },
  },
  vintage: {
    saturation: 0.7,
    contrast: 0.9,
    tint: { r: 25, g: 12, b: -15 },
    vignette: 0.3,
  },
  dramatic: {
    saturation: 1.3,
    contrast: 1.25,
    tint: { r: -5, g: -5, b: 8 },
    vignette: 0.4,
  },
  ethereal: {
    saturation: 1.1,
    contrast: 0.95,
    tint: { r: 10, g: 15, b: 25 },
    vignette: 0.2,
  },
  natural: {
    saturation: 1.0,
    contrast: 1.0,
    tint: { r: 0, g: 0, b: 0 },
  },
};

export class EmotionalToneMapper {
  /**
   * 应用情感色调到 ImageData
   */
  apply(imageData: ImageData, config: ToneConfig): ImageData {
    const { tone, intensity } = config;
    const settings = TONE_CONFIGS[tone];
    const {data} = imageData;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // 应用色调偏移
      r += settings.tint.r * intensity;
      g += settings.tint.g * intensity;
      b += settings.tint.b * intensity;

      // 应用饱和度

      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      r = gray + (r - gray) * settings.saturation * intensity;
      g = gray + (g - gray) * settings.saturation * intensity;
      b = gray + (b - gray) * settings.saturation * intensity;

      // 应用对比度
      r = ((r / 255 - 0.5) * settings.contrast + 0.5) * 255;
      g = ((g / 255 - 0.5) * settings.contrast + 0.5) * 255;
      b = ((b / 255 - 0.5) * settings.contrast + 0.5) * 255;

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    return imageData;
  }

  /**
   * 根据场景 mood 推荐色调
   */
  getToneForMood(mood: string): EmotionalTone {
    switch (mood) {
      case 'warm':
        return 'warm';
      case 'cool':
        return 'cool';
      case 'dark':
        return 'dramatic';
      case 'vivid':
        return 'dramatic';
      case 'bright':
        return 'natural';
      case 'calm':
        return 'ethereal';
      default:
        return 'natural';
    }
  }
}

export const emotionalToneMapper = new EmotionalToneMapper();
