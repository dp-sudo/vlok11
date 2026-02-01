/**
 * Immersive Experience Manager
 * 整合场景分析、智能运镜、沉浸式音效和情感色调
 */

import {
  lightSceneAnalyzer,
  type SimpleInsight,
  type MotionStyle,
} from '../ai/services/LightSceneAnalyzer';
import { smartMotionEngine, type MotionPath } from '../ai/services/SmartMotionEngine';
import {
  immersiveAudioManager,
  type AudioConfig,
  type AudioMood,
} from '../audio/ImmersiveAudioManager';
import {
  emotionalToneMapper,
  type EmotionalTone,
  type ToneConfig,
} from '../color/EmotionalToneMapper';

export interface ImmersiveExperienceConfig {
  autoMotion: boolean;
  autoAudio: boolean;
  autoTone: boolean;
  motionStyle?: MotionStyle;
  audioMood?: AudioMood;
  tone?: EmotionalTone;
}

export interface ExperienceResult {
  insight: SimpleInsight;
  motionPath: MotionPath | null;
  toneConfig: ToneConfig;
  audioConfig: AudioConfig;
}

export class ImmersiveExperienceManager {
  private currentConfig: ImmersiveExperienceConfig | null = null;
  private currentInsight: SimpleInsight | null = null;

  /**
   * 分析场景并生成完整的沉浸式体验配置
   */
  async analyze(image: HTMLImageElement): Promise<ExperienceResult> {
    // 1. 场景分析
    const insight = lightSceneAnalyzer.analyze(image);

    this.currentInsight = insight;

    // 2. 生成运镜路径
    const motionPath = smartMotionEngine.generatePath(
      insight,
      {
        position: { x: 0, y: 0, z: 9 },
        target: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
        fov: 55,
      },
      12
    );

    // 3. 生成色调配置
    const toneConfig: ToneConfig = {
      tone: emotionalToneMapper.getToneForMood(insight.mood),
      intensity: 0.6,
    };

    // 4. 生成音效配置
    const audioConfig: AudioConfig = {
      mood: this.mapSceneTypeToAudioMood(insight.type),
      volume: 0.4,
    };

    return {
      insight,
      motionPath,
      toneConfig,
      audioConfig,
    };
  }

  /**
   * 应用沉浸式体验
   */
  async applyExperience(
    result: ExperienceResult,
    config: Partial<ImmersiveExperienceConfig> = {}
  ): Promise<void> {
    this.currentConfig = {
      autoMotion: true,
      autoAudio: true,
      autoTone: true,
      ...config,
    };

    // 应用音效
    if (this.currentConfig.autoAudio && this.currentConfig.audioMood) {
      await immersiveAudioManager.play({
        mood: this.currentConfig.audioMood,
        volume: 0.4,
      });
    } else if (this.currentConfig.autoAudio) {
      await immersiveAudioManager.play(result.audioConfig);
    }
  }

  /**
   * 停止所有沉浸式效果
   */
  stop(): void {
    immersiveAudioManager.stop();
    this.currentConfig = null;
    this.currentInsight = null;
  }

  /**
   * 设置运镜风格
   */
  setMotionStyle(style: MotionStyle): void {
    if (this.currentInsight) {
      this.currentInsight.suggestedMotion = style;
    }
  }

  /**
   * 设置音效氛围
   */
  async setAudioMood(mood: AudioMood): Promise<void> {
    await immersiveAudioManager.play({ mood, volume: 0.4 });
  }

  /**
   * 设置情感色调
   */
  setTone(tone: EmotionalTone, intensity = 0.6): ToneConfig {
    return { tone, intensity };
  }

  /**
   * 获取当前场景洞察
   */
  getCurrentInsight(): SimpleInsight | null {
    return this.currentInsight;
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    immersiveAudioManager.setVolume(volume);
  }

  private mapSceneTypeToAudioMood(type: SimpleInsight['type']): AudioMood {
    switch (type) {
      case 'nature':
        return 'nature';
      case 'urban':
        return 'urban';
      case 'indoor':
        return 'indoor';
      case 'portrait':
        return 'indoor';
      case 'architecture':
        return 'urban';
      default:
        return 'indoor';
    }
  }
}

export const immersiveExperienceManager = new ImmersiveExperienceManager();
