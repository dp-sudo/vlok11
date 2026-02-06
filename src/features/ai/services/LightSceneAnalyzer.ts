/**
 * Lightweight Scene Analyzer
 * 基于颜色/亮度分布的轻量场景分析，无需 ML 模型依赖
 */

export type SimpleSceneType = 'indoor' | 'nature' | 'urban' | 'portrait' | 'architecture';
export type SceneMood = 'bright' | 'dark' | 'vivid' | 'calm' | 'warm' | 'cool' | 'neutral';
export type MotionStyle = 'cinematic' | 'dynamic' | 'focus' | 'exploration';

export interface SimpleInsight {
  type: SimpleSceneType;
  mood: SceneMood;
  suggestedMotion: MotionStyle;
  confidence: number;
}

export class LightSceneAnalyzer {
  /**
   * 分析图片并返回场景洞察
   */
  analyze(image: HTMLImageElement): SimpleInsight {
    const canvas = this.createAnalysisCanvas(image);
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;

    // 采样分析（每 16 个像素取一个，大幅减少计算量）
    const sampleRate = 16;
    const samples: number[] = [];
    const colors: { r: number; g: number; b: number }[] = [];

    for (let i = 0; i < data.length; i += 4 * sampleRate) {
      const brightness = (data[i]! + data[i + 1]! + data[i + 2]!) / 3;

      samples.push(brightness);
      colors.push({ r: data[i]!, g: data[i + 1]!, b: data[i + 2]! });
    }

    const avgBrightness = this.calcAverage(samples);
    const saturation = this.calcAvgSaturation(colors);
    const warmth = this.calcWarmth(colors);

    const type = this.classifyScene(avgBrightness, saturation, warmth);
    const mood = this.classifyMood(avgBrightness, saturation, warmth);
    const suggestedMotion = this.suggestMotion(type, mood);
    const confidence = this.calcConfidence(avgBrightness, saturation);

    return { type, mood, suggestedMotion, confidence };
  }

  /** 场景分类 */
  private classifyScene(brightness: number, saturation: number, warmth: number): SimpleSceneType {
    // 低亮度 + 低饱和度 = 室内/夜景
    if (brightness < 80 && saturation < 30) return 'indoor';

    // 高亮度 + 高饱和度 + 暖色 = 自然
    if (brightness > 150 && saturation > 50 && warmth > 10) return 'nature';

    // 高亮度 + 中饱和度 + 冷色 = 城市/建筑
    if (brightness > 120 && saturation < 60 && warmth < -5) return 'urban';

    // 高饱和度 + 暖色 = 人像
    if (saturation > 60 && warmth > 15) return 'portrait';

    // 中等亮度 + 线条感 = 建筑
    if (brightness > 80 && brightness < 180 && saturation < 50) return 'architecture';

    return 'indoor';
  }

  /** 情绪分类 */
  private classifyMood(brightness: number, saturation: number, warmth: number): SceneMood {
    if (brightness > 180 && saturation < 40) return 'bright';
    if (brightness < 80) return 'dark';
    if (saturation > 70) return 'vivid';
    if (saturation < 30) return 'calm';
    if (warmth > 20) return 'warm';
    if (warmth < -20) return 'cool';

    return 'neutral';
  }

  /** 推荐运镜 */
  private suggestMotion(type: SimpleSceneType, mood: SceneMood): MotionStyle {
    if (mood === 'dark') return 'focus';
    if (mood === 'vivid') return 'dynamic';
    if (mood === 'calm' || mood === 'warm') return 'cinematic';
    if (type === 'nature') return 'cinematic';
    if (type === 'urban' || type === 'architecture') return 'exploration';

    return 'cinematic';
  }

  private createAnalysisCanvas(image: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');

    canvas.width = 64;
    canvas.height = 64;

    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(image, 0, 0, 64, 64);

    return canvas;
  }

  private calcAverage(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calcAvgSaturation(colors: { r: number; g: number; b: number }[]): number {
    let totalSat = 0;

    for (const c of colors) {
      const max = Math.max(c.r, c.g, c.b);
      const min = Math.min(c.r, c.g, c.b);

      totalSat += max === 0 ? 0 : (max - min) / max;
    }

    return totalSat / colors.length;
  }

  private calcWarmth(colors: { r: number; g: number; b: number }[]): number {
    // 正值 = 暖色(红黄)，负值 = 冷色(蓝)
    let total = 0;

    for (const c of colors) {
      total += c.r - c.b;
    }

    return total / colors.length;
  }

  private calcConfidence(brightness: number, saturation: number): number {
    return Math.min(1, (Math.abs(brightness - 128) / 128 + Math.abs(saturation - 50) / 50) / 2);
  }
}

export const lightSceneAnalyzer = new LightSceneAnalyzer();
