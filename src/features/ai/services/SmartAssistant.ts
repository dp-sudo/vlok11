import { CameraMode, ProjectionMode, RenderStyle } from '@/core/domain/types';
import { createLogger } from '@/core/Logger';

import type { SceneConfig } from '@/shared/types';

export interface SceneOptimization {
  category: 'camera' | 'rendering' | 'performance' | 'visual';
  currentValue?: string | number;
  impact: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  recommendedValue?: string | number;
  suggestion: string;
}

export interface SceneAnalysis {
  optimizations: SceneOptimization[];
  overallScore: number;
  strengths: string[];
  timestamp: number;
  weaknesses: string[];
}

class SmartAssistantImpl {
  private static instance: SmartAssistantImpl | null = null;
  private logger = createLogger({ module: 'SmartAssistant' });

  private constructor() {}

  static getInstance(): SmartAssistantImpl {
    SmartAssistantImpl.instance ??= new SmartAssistantImpl();

    return SmartAssistantImpl.instance;
  }

  static resetInstance(): void {
    SmartAssistantImpl.instance = null;
  }

  private analyzeCameraSettings(config: SceneConfig): SceneOptimization[] {
    const optimizations: SceneOptimization[] = [];

    if (config.fov < 30 || config.fov > 90) {
      optimizations.push({
        category: 'camera',
        priority: 'medium',
        suggestion: '视场角(FOV)可能过于极端',
        currentValue: config.fov,
        recommendedValue: config.fov < 30 ? 50 : 70,
        reason: 'FOV 应在 30-90 度之间以获得自然的透视效果',
        impact: '调整后观看体验更自然',
      });
    }

    if (config.cameraMode === CameraMode.ORTHOGRAPHIC && config.isImmersive) {
      optimizations.push({
        category: 'camera',
        priority: 'high',
        suggestion: '沉浸模式不建议使用正交相机',
        currentValue: 'orthographic',
        recommendedValue: 'perspective',
        reason: '正交投影会失去深度感，不适合沉浸式体验',
        impact: '切换为透视相机将大幅提升沉浸感',
      });
    }

    return optimizations;
  }

  private analyzePerformance(config: SceneConfig): SceneOptimization[] {
    const optimizations: SceneOptimization[] = [];

    if (config.isImmersive && config.projectionMode === ProjectionMode.INFINITE_BOX) {
      optimizations.push({
        category: 'performance',
        priority: 'medium',
        suggestion: '沉浸式 + 无限盒子可能影响性能',
        currentValue: `${config.projectionMode} + immersive`,
        recommendedValue: 'dome',
        reason: '复杂的投影模式在沉浸模式下计算量大',
        impact: '切换到圆顶投影可提升帧率 20-30%',
      });
    }

    return optimizations;
  }

  private analyzeRenderingSettings(config: SceneConfig): SceneOptimization[] {
    const optimizations: SceneOptimization[] = [];

    if (config.displacementScale > 2) {
      optimizations.push({
        category: 'rendering',
        priority: 'medium',
        suggestion: '深度位移缩放过大',
        currentValue: config.displacementScale,
        recommendedValue: 1.5,
        reason: '过大的位移会导致图像失真',
        impact: '降低位移值将获得更真实的深度效果',
      });
    }

    if (
      config.renderStyle === RenderStyle.NORMAL &&
      config.projectionMode === ProjectionMode.SPHERE
    ) {
      optimizations.push({
        category: 'rendering',
        priority: 'low',
        suggestion: '球形投影可尝试其他渲染风格',
        currentValue: config.renderStyle,
        recommendedValue: 'hologram',
        reason: '球形投影与全息图风格结合效果更佳',
        impact: '视觉效果更具科技感',
      });
    }

    return optimizations;
  }

  async analyzeScene(sceneConfig: SceneConfig, imageData?: ImageData): Promise<SceneAnalysis> {
    this.logger.info('Starting scene analysis');

    const optimizations: SceneOptimization[] = [];

    optimizations.push(...this.analyzeCameraSettings(sceneConfig));
    optimizations.push(...this.analyzeRenderingSettings(sceneConfig));
    optimizations.push(...this.analyzePerformance(sceneConfig));

    if (imageData) {
      optimizations.push(...this.analyzeVisualQuality(sceneConfig, imageData));
    }

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    for (const opt of optimizations) {
      if (opt.priority === 'high') {
        weaknesses.push(opt.suggestion);
      } else if (opt.priority === 'low') {
        strengths.push(`当前${opt.category}设置良好`);
      }
    }

    const overallScore = Math.max(
      0,
      100 -
        optimizations.filter((o) => o.priority === 'high').length * 20 -
        optimizations.filter((o) => o.priority === 'medium').length * 10
    );

    this.logger.info('Scene analysis complete', {
      optimizations: optimizations.length,
      score: overallScore,
    });

    return {
      optimizations,
      overallScore,
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      timestamp: Date.now(),
    };
  }

  private analyzeVisualQuality(_config: SceneConfig, imageData: ImageData): SceneOptimization[] {
    const optimizations: SceneOptimization[] = [];

    const brightness = this.calculateBrightness(imageData);

    if (brightness < 50) {
      optimizations.push({
        category: 'visual',
        priority: 'medium',
        suggestion: '图像整体偏暗',
        currentValue: brightness.toFixed(0),
        recommendedValue: '调整亮度',
        reason: '低亮度图像在 3D 场景中视觉效果较差',
        impact: '提升亮度将改善整体视觉效果',
      });
    }

    return optimizations;
  }

  private calculateBrightness(imageData: ImageData): number {
    const { data } = imageData;
    let sum = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      sum += (r ?? 0) * 0.299 + (g ?? 0) * 0.587 + (b ?? 0) * 0.114;
    }

    return (sum / pixelCount / 255) * 100;
  }

  async explainSetting(setting: keyof SceneConfig, value: unknown): Promise<string> {
    const explanations: Record<string, string> = {
      fov: `视场角(FOV)为 ${value} 度。较小的值产生"长焦"效果，较大的值产生"广角"效果。推荐范围：50-70度。`,
      displacementScale: `深度位移缩放为 ${value}。控制3D效果的强度。值越大深度效果越明显，但过大会失真。推荐范围：0.5-2.0。`,
      cameraMode: `相机模式为 ${value}。透视(perspective)模拟人眼视觉，正交(orthographic)保持平行线不变形。沉浸式体验建议使用透视模式。`,
      projectionMode: `投影模式为 ${value}。不同模式创建不同的3D空间效果。球形(sphere)适合全景图，平面(flat)适合普通照片。`,
      renderStyle: `渲染风格为 ${value}。影响最终视觉呈现。normal为真实风格，hologram为全息风格，crystal为水晶风格等。`,
      isImmersive: `沉浸模式${value ? '已启用' : '已禁用'}。启用后观众仿佛身临其境，提供更强烈的空间感。`,
      cameraMotionType: `相机运动类型为 ${value}。控制相机如何在场景中移动。static为静止，orbit为环绕运动。`,
    };

    return explanations[setting] ?? `${setting}: ${value}`;
  }

  async suggestOptimalSettings(imageAnalysis: {
    brightness: number;
    complexity: string;
    contrast: number;
  }): Promise<Partial<SceneConfig>> {
    this.logger.info('Generating optimal settings', { imageAnalysis });

    const suggestions: Partial<SceneConfig> = {};

    if (imageAnalysis.brightness < 50) {
      suggestions.displacementScale = 0.8;
    } else {
      suggestions.displacementScale = 1.2;
    }

    if (imageAnalysis.complexity === 'high') {
      suggestions.projectionMode = ProjectionMode.PLANE;
      suggestions.isImmersive = false;
    } else {
      suggestions.projectionMode = ProjectionMode.SPHERE;
      suggestions.isImmersive = true;
    }

    if (imageAnalysis.contrast > 70) {
      suggestions.renderStyle = RenderStyle.CRYSTAL;
    } else {
      suggestions.renderStyle = RenderStyle.NORMAL;
    }

    return suggestions;
  }
}

export const getSmartAssistant = (): SmartAssistantImpl => SmartAssistantImpl.getInstance();
export const resetSmartAssistant = (): void => SmartAssistantImpl.resetInstance();
