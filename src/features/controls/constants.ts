import { Box, Brain, Camera, Grid3X3, Palette, Sparkles, Zap } from 'lucide-react';
import React from 'react';

import {
  CameraMotionType,
  ColorGradePreset,
  MirrorMode,
  ProjectionMode,
  RenderStyle,
} from '@/shared/types';

export type TabType = 'scene' | 'camera' | 'effects' | 'immersive' | 'ai';

export const CAMERA_VIEW_LABELS: Record<string, string> = {
  FRONT: '正',
  TOP: '顶',
  SIDE: '侧',
  ISO: '等轴',
  FOCUS: '聚焦',
} as const;
export const COLOR_GRADES = [
  { grade: ColorGradePreset.NONE, label: '无', color: '#888' },
  { grade: ColorGradePreset.CINEMATIC, label: '电影', color: '#f4a460' },
  { grade: ColorGradePreset.VINTAGE, label: '复古', color: '#daa520' },
  { grade: ColorGradePreset.WARM, label: '暖调', color: '#ff7f50' },
  { grade: ColorGradePreset.COLD, label: '冷调', color: '#87ceeb' },
  { grade: ColorGradePreset.NOIR, label: '黑白', color: '#666' },
  { grade: ColorGradePreset.DREAMY, label: '梦幻', color: '#dda0dd' },
  { grade: ColorGradePreset.VHS, label: 'VHS', color: '#ff6b6b' },
  { grade: ColorGradePreset.JAPANESE, label: '日系', color: '#ffb7c5' },
] as const;
export const DEPTH_PRESET_VALUES = {
  SUBTLE: 0.5,
  NORMAL: 1.2,
  STRONG: 2.5,
  EXTREME: 5,
} as const;
export const DEPTH_PRESETS = [
  DEPTH_PRESET_VALUES.SUBTLE,
  DEPTH_PRESET_VALUES.NORMAL,
  DEPTH_PRESET_VALUES.STRONG,
  DEPTH_PRESET_VALUES.EXTREME,
] as const;
export const EXPOSURE_PRESET_VALUES = {
  DARK: 0.8,
  NORMAL: 1.1,
  BRIGHT: 1.5,
  VERY_BRIGHT: 2,
} as const;
export const EXPOSURE_PRESETS = [
  EXPOSURE_PRESET_VALUES.DARK,
  EXPOSURE_PRESET_VALUES.NORMAL,
  EXPOSURE_PRESET_VALUES.BRIGHT,
  EXPOSURE_PRESET_VALUES.VERY_BRIGHT,
] as const;
export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / TIME_FORMAT.SECONDS_PER_MINUTE);
  const sec = Math.floor(seconds % TIME_FORMAT.SECONDS_PER_MINUTE);

  return `${m.toString().padStart(TIME_FORMAT.PAD_LENGTH, TIME_FORMAT.PAD_CHAR)}:${sec.toString().padStart(TIME_FORMAT.PAD_LENGTH, TIME_FORMAT.PAD_CHAR)}`;
};
export const FOV_PRESET_VALUES = {
  NARROW: 35,
  NORMAL: 55,
  WIDE: 85,
  ULTRA_WIDE: 120,
} as const;
export const FOV_PRESETS = [
  FOV_PRESET_VALUES.NARROW,
  FOV_PRESET_VALUES.NORMAL,
  FOV_PRESET_VALUES.WIDE,
  FOV_PRESET_VALUES.ULTRA_WIDE,
] as const;
export const getCameraViewLabel = (view: string): string => CAMERA_VIEW_LABELS[view] ?? view;
export const MIRROR_MODES = [
  { mode: MirrorMode.NONE, label: '无' },
  { mode: MirrorMode.HORIZONTAL, label: '水平' },
  { mode: MirrorMode.VERTICAL, label: '垂直' },
  { mode: MirrorMode.QUAD, label: '四象' },
] as const;
export const MOTIONS = [
  { type: CameraMotionType.STATIC, label: '静止', icon: '⏸', desc: '固定视角' },
  { type: CameraMotionType.ORBIT, label: '环绕', icon: '🔄', desc: '围绕主体旋转' },
  { type: CameraMotionType.FLY_BY, label: '飞越', icon: '✈️', desc: '平滑飞行穿越' },
  { type: CameraMotionType.SPIRAL, label: '螺旋', icon: '🌀', desc: '螺旋上升下降' },
  { type: CameraMotionType.DOLLY_ZOOM, label: '推拉', icon: '🎬', desc: '希区柯克变焦' },
  { type: CameraMotionType.ARC, label: '弧线', icon: '↷', desc: '弧形运动轨迹' },
] as const;
export const PARTICLE_TYPES = [
  { type: 'dust', label: '尘埃' },
  { type: 'snow', label: '雪花' },
  { type: 'rain', label: '雨滴' },
  { type: 'leaves', label: '落叶' },
  { type: 'firefly', label: '萤火' },
  { type: 'stars', label: '星空' },
] as const;
export const PROGRESS_PERCENT = 100;
export const PROJECTIONS = [
  { mode: ProjectionMode.PLANE, label: '平面', icon: '▭', desc: '标准2.5D效果' },
  { mode: ProjectionMode.CYLINDER, label: '曲面', icon: '◠', desc: '柔和弧形包裹' },
  { mode: ProjectionMode.SPHERE, label: '球面', icon: '◯', desc: '360度球形投影' },
  { mode: ProjectionMode.PANORAMA, label: '全景', icon: '◡', desc: '沉浸式全景' },
  { mode: ProjectionMode.CUBE, label: '立方', icon: '⬡', desc: '六面体投影' },
  { mode: ProjectionMode.GAUSSIAN_SPLAT, label: '点云', icon: '✦', desc: '高斯点云渲染' },
] as const;
export const RENDER_STYLES = [
  { style: RenderStyle.ANIME, label: '动漫', icon: '🎌', desc: '日式动画风格' },
  { style: RenderStyle.INK_WASH, label: '水墨', icon: '🖌️', desc: '东方水墨画' },
  {
    style: RenderStyle.HOLOGRAM_V2,
    label: '全息',
    icon: React.createElement(Zap, { className: 'w-3.5 h-3.5' }),
    desc: '科幻全息效果',
  },
  {
    style: RenderStyle.RETRO_PIXEL,
    label: '像素',
    icon: React.createElement(Grid3X3, { className: 'w-3.5 h-3.5' }),
    desc: '复古像素风',
  },
  {
    style: RenderStyle.CEL_SHADING,
    label: '卡通',
    icon: React.createElement(Palette, { className: 'w-3.5 h-3.5' }),
    desc: '扁平卡通着色',
  },
  { style: RenderStyle.CRYSTAL, label: '水晶', icon: '💎', desc: '折射透明效果' },
  { style: RenderStyle.MATRIX, label: '赛博', icon: '🌃', desc: '赛博科幻霓虹' },
  { style: RenderStyle.NORMAL, label: '正常', icon: '🖼️', desc: '无特效渲染' },
] as const;
export const TABS: { icon: React.ReactNode; key: TabType; label: string }[] = [
  { key: 'scene', label: '场景', icon: React.createElement(Box, { className: 'w-4 h-4' }) },
  { key: 'camera', label: '相机', icon: React.createElement(Camera, { className: 'w-4 h-4' }) },
  { key: 'effects', label: '效果', icon: React.createElement(Sparkles, { className: 'w-4 h-4' }) },
  { key: 'immersive', label: '沉浸', icon: React.createElement(Brain, { className: 'w-4 h-4' }) },
  { key: 'ai', label: 'AI', icon: React.createElement(Zap, { className: 'w-4 h-4' }) },
];
export const TIME_FORMAT = {
  SECONDS_PER_MINUTE: 60,
  PAD_LENGTH: 2,
  PAD_CHAR: '0',
} as const;

// AI智能运镜风格
export const AI_MOTION_STYLES = [
  { style: 'cinematic', label: '电影感', icon: '🎬', desc: '缓慢环绕电影运镜' },
  { style: 'dynamic', label: '动感', icon: '⚡', desc: '快速平移切换' },
  { style: 'focus', label: '聚焦', icon: '🎯', desc: '聚焦主体中心' },
  { style: 'exploration', label: '探索', icon: '🔭', desc: '360度探索全景' },
] as const;

// 天气效果
export const WEATHER_EFFECTS = [
  { effect: 'sunny', label: '晴朗', icon: '☀️', desc: '阳光明媚氛围' },
  { effect: 'rain', label: '下雨', icon: '🌧️', desc: '细雨朦胧效果' },
  { effect: 'fog', label: '雾霾', icon: '🌫️', desc: '雾气弥漫效果' },
  { effect: 'snow', label: '下雪', icon: '❄️', desc: '飘雪浪漫效果' },
] as const;

// 录制质量选项
export const RECORDING_QUALITIES = [
  { quality: 'high', label: '高质量', desc: '8Mbps, 60fps', icon: '🎬' },
  { quality: 'medium', label: '标准', desc: '4Mbps, 30fps', icon: '📹' },
  { quality: 'low', label: '压缩', desc: '2Mbps, 30fps', icon: '📀' },
] as const;
