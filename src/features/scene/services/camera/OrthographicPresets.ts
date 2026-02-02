import { getEventBus } from '@/core/EventBus';
import { createLogger } from '@/core/Logger';
import type { Vec3 } from '@/shared/types';

const logger = createLogger({ module: 'OrthographicPresets' });

/**
 * 正交视图预设类型
 */
export type OrthoViewPresetType = 'top' | 'front' | 'side' | 'iso';

/**
 * 正交视图预设配置
 */
export interface OrthoViewPreset {
  /** 显示名称 */
  name: string;
  /** 相机位置 */
  position: Vec3;
  /** 观察目标 */
  target: Vec3;
  /** 上方向 */
  up: Vec3;
  /** 默认缩放值 */
  defaultZoom: number;
  /** Lucide图标名称 */
  icon: string;
  /** 描述 */
  description: string;
}

/**
 * 正交视图预设集合
 */
export const ORTHO_VIEW_PRESETS: Record<OrthoViewPresetType, OrthoViewPreset> = {
  top: {
    name: '俯视',
    position: { x: 0, y: 20, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 0, z: -1 },
    defaultZoom: 25,
    icon: 'ArrowDown',
    description: '从上方垂直观察场景',
  },
  front: {
    name: '正视',
    position: { x: 0, y: 0, z: 20 },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    defaultZoom: 25,
    icon: 'Eye',
    description: '从正面观察场景',
  },
  side: {
    name: '侧视',
    position: { x: 20, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    defaultZoom: 25,
    icon: 'ArrowRight',
    description: '从侧面观察场景',
  },
  iso: {
    name: '等轴测',
    position: { x: 15, y: 15, z: 15 },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    defaultZoom: 18,
    icon: 'Box',
    description: '等轴测视角观察场景',
  },
};

/**
 * 获取正交视图预设
 * @param preset - 预设类型
 * @returns 预设配置
 */
export function getOrthoViewPreset(preset: OrthoViewPresetType): OrthoViewPreset {
  return ORTHO_VIEW_PRESETS[preset];
}

/**
 * 获取所有正交视图预设
 * @returns 预设数组
 */
export function getAllOrthoViewPresets(): Array<{
  type: OrthoViewPresetType;
  preset: OrthoViewPreset;
}> {
  return Object.entries(ORTHO_VIEW_PRESETS).map(([type, preset]) => ({
    type: type as OrthoViewPresetType,
    preset,
  }));
}

/**
 * 计算应用正交视图预设后的姿态
 * @param presetType - 预设类型
 * @param options - 选项
 * @returns 新的相机姿态和zoom值
 */
export function calculateOrthoPresetPose(
  presetType: OrthoViewPresetType,
  options: {
    useDefaultZoom?: boolean;
    currentZoom?: number;
  } = {}
): {
  position: Vec3;
  target: Vec3;
  up: Vec3;
  zoom: number;
  preset: OrthoViewPreset;
} | null {
  const preset = ORTHO_VIEW_PRESETS[presetType];

  if (!preset) {
    logger.warn(`未知的正交视图预设: ${presetType}`);

    return null;
  }

  // 计算zoom值
  const zoom = options.useDefaultZoom
    ? preset.defaultZoom
    : (options.currentZoom ?? preset.defaultZoom);

  return {
    position: { ...preset.position },
    target: { ...preset.target },
    up: { ...preset.up },
    zoom,
    preset,
  };
}

/**
 * 发射正交预设应用事件
 * @param presetType - 预设类型
 * @param previousPreset - 上一个预设
 * @param pose - 相机姿态
 * @param zoom - zoom值
 */
export function emitOrthoPresetApplied(
  presetType: OrthoViewPresetType,
  previousPreset: OrthoViewPresetType | null,
  pose: { position: Vec3; target: Vec3; up: Vec3 },
  zoom: number
): void {
  getEventBus().emit('camera:ortho-preset-applied', {
    preset: presetType,
    previousPreset,
    pose,
    zoom,
  });

  logger.info(`应用正交视图预设: ${ORTHO_VIEW_PRESETS[presetType].name}`, {
    preset: presetType,
    zoom,
  });
}

/**
 * 验证是否为有效的正交视图预设类型
 * @param value - 待验证的值
 * @returns 是否有效
 */
export function isValidOrthoViewPreset(value: string): value is OrthoViewPresetType {
  return Object.keys(ORTHO_VIEW_PRESETS).includes(value);
}

/**
 * 获取正交视图预设的显示信息
 * @param presetType - 预设类型
 * @returns 显示信息
 */
export function getOrthoPresetDisplayInfo(presetType: OrthoViewPresetType): {
  label: string;
  icon: string;
  description: string;
} {
  const preset = ORTHO_VIEW_PRESETS[presetType];

  return {
    label: preset.name,
    icon: preset.icon,
    description: preset.description,
  };
}
